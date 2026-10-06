/**
 * Schema-preservation guard — pending-migration SQL scanner.
 *
 * Pure, dependency-free scanner that extracts schema changes from raw SQL (for
 * example, the SQL emitted by a generated module migration). It recognizes the
 * DDL/DML statements that matter for the guard: table drops/renames/truncates,
 * row deletes, and per-column add/drop/rename/type-alter operations. The
 * resulting `SchemaChange[]` is fed straight into `assertNonDestructiveDiff`
 * so a destructive pending migration halts startup before it is applied
 * (Requirements 1.7, 9.4).
 *
 * The scanner is deliberately conservative: when in doubt it emits a change so
 * the guard errs toward halting rather than silently allowing a destructive op.
 */

import type { SchemaChange } from "./types"

/** Strip a leading `public.` / quotes from an identifier. */
function cleanIdent(raw: string): string {
  return raw
    .trim()
    .replace(/^"?public"?\./i, "")
    .replace(/^"+|"+$/g, "")
    .trim()
}

/**
 * Split a SQL blob into individual statements on `;`, ignoring `--` line
 * comments and `/* *\/` block comments. Good enough for migration SQL, which
 * does not embed semicolons in string literals for these statement types.
 */
function splitStatements(sql: string): string[] {
  const withoutComments = sql
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/--[^\n]*/g, " ")
  return withoutComments
    .split(";")
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter((s) => s.length > 0)
}

const RE_DROP_TABLE = /^drop\s+table\s+(?:if\s+exists\s+)?((?:"?public"?\.)?"?\w+"?)/i
const RE_TRUNCATE = /^truncate\s+(?:table\s+)?((?:"?public"?\.)?"?\w+"?)/i
const RE_DELETE = /^delete\s+from\s+(?:only\s+)?((?:"?public"?\.)?"?\w+"?)/i
const RE_ALTER_TABLE = /^alter\s+table\s+(?:if\s+exists\s+)?(?:only\s+)?((?:"?public"?\.)?"?\w+"?)\s+(.+)$/i

// Sub-actions inside an ALTER TABLE body (may be comma-separated).
const RE_RENAME_TABLE = /\brename\s+to\s+"?(\w+)"?/i
const RE_RENAME_COLUMN = /\brename\s+(?:column\s+)?"?(\w+)"?\s+to\s+"?(\w+)"?/gi
const RE_DROP_COLUMN = /\bdrop\s+(?:column\s+)?(?:if\s+exists\s+)?"?(\w+)"?/gi
const RE_ALTER_COLUMN_TYPE =
  /\balter\s+(?:column\s+)?"?(\w+)"?\s+(?:set\s+data\s+)?type\s+([a-z0-9_]+(?:\s+with\s+time\s+zone|\s+without\s+time\s+zone)?(?:\s*\([^)]*\))?)/gi
const RE_ADD_COLUMN =
  /\badd\s+(?:column\s+)?(?:if\s+not\s+exists\s+)?"?(\w+)"?\s+([a-z0-9_]+(?:\s+with\s+time\s+zone|\s+without\s+time\s+zone)?(?:\s*\([^)]*\))?)/gi

/**
 * Parse a single ALTER TABLE statement body into its constituent changes.
 * A rename-table action short-circuits (it cannot be combined with column ops).
 */
function scanAlterBody(table: string, body: string): SchemaChange[] {
  const changes: SchemaChange[] = []

  const renameTable = RE_RENAME_TABLE.exec(body)
  if (renameTable) {
    changes.push({ kind: "rename_table", table, toName: cleanIdent(renameTable[1]) })
    return changes
  }

  let m: RegExpExecArray | null

  RE_RENAME_COLUMN.lastIndex = 0
  while ((m = RE_RENAME_COLUMN.exec(body)) !== null) {
    changes.push({
      kind: "rename_column",
      table,
      column: cleanIdent(m[1]),
      toName: cleanIdent(m[2]),
    })
  }

  RE_ALTER_COLUMN_TYPE.lastIndex = 0
  while ((m = RE_ALTER_COLUMN_TYPE.exec(body)) !== null) {
    changes.push({
      kind: "alter_column_type",
      table,
      column: cleanIdent(m[1]),
      toType: m[2].trim(),
    })
  }

  RE_ADD_COLUMN.lastIndex = 0
  while ((m = RE_ADD_COLUMN.exec(body)) !== null) {
    const nullable = !/\bnot\s+null\b/i.test(body.slice(m.index, m.index + 120))
    changes.push({
      kind: "add_column",
      table,
      column: cleanIdent(m[1]),
      dataType: m[2].trim(),
      isNullable: nullable,
    })
  }

  // DROP COLUMN — exclude the "drop ... type" false positive handled above and
  // the rename case (already returned). Matches `drop column x` / `drop x`.
  RE_DROP_COLUMN.lastIndex = 0
  while ((m = RE_DROP_COLUMN.exec(body)) !== null) {
    const col = cleanIdent(m[1])
    // Guard against matching keywords like "constraint" without a column.
    if (col.toLowerCase() === "constraint") {
      continue
    }
    changes.push({ kind: "drop_column", table, column: col })
  }

  return changes
}

/**
 * Scan a raw SQL string and return every schema change it would perform.
 * The caller (`assertNonDestructiveDiff`) filters to protected tables, so this
 * scanner reports changes for all tables it sees.
 */
export function scanSqlForSchemaChanges(sql: string): SchemaChange[] {
  if (!sql || typeof sql !== "string") {
    return []
  }

  const changes: SchemaChange[] = []
  for (const stmt of splitStatements(sql)) {
    let m = RE_DROP_TABLE.exec(stmt)
    if (m) {
      changes.push({ kind: "drop_table", table: cleanIdent(m[1]) })
      continue
    }
    m = RE_TRUNCATE.exec(stmt)
    if (m) {
      changes.push({ kind: "truncate_table", table: cleanIdent(m[1]) })
      continue
    }
    m = RE_DELETE.exec(stmt)
    if (m) {
      changes.push({ kind: "delete_rows", table: cleanIdent(m[1]) })
      continue
    }
    m = RE_ALTER_TABLE.exec(stmt)
    if (m) {
      changes.push(...scanAlterBody(cleanIdent(m[1]), m[2]))
      continue
    }
  }
  return changes
}
