/**
 * Schema-preservation guard — live schema introspection.
 *
 * Reads the live column definitions of the protected tables from
 * `information_schema.columns`. This is strictly read-only: it issues no DDL
 * and mutates no rows. The shared Postgres connection (a Knex instance) is
 * resolved from the Medusa container by the caller and passed in, keeping this
 * module free of framework wiring and easy to test with a fake connection.
 */
import {
  isProtectedTable,
  PROTECTED_TABLES,
  PROTECTED_TABLE_BASELINE,
} from "./baseline"
import type { ColumnSchema, TableSchema } from "./types"

/**
 * Minimal structural shape of the Knex query builder used here. Declared
 * locally so this module does not hard-depend on Knex types. The query is
 * `select(...).where("table_schema", "public").whereIn("table_name", tables)`.
 */
export type PgConnectionLike = (table: string) => {
  select: (...columns: string[]) => {
    where: (
      column: string,
      value: string
    ) => {
      whereIn: (
        column: string,
        values: readonly string[]
      ) => Promise<InformationSchemaRow[]>
    }
  }
}

/** A row from `information_schema.columns` (the columns we read). */
export type InformationSchemaRow = {
  table_name: string
  column_name: string
  data_type: string
  is_nullable: string // "YES" | "NO"
}

/**
 * Introspect the live column definitions of the protected tables.
 *
 * Returns one {@link TableSchema} per protected table that exists in the
 * database, in {@link PROTECTED_TABLES} order. Tables absent from the database
 * are omitted (a fresh database with no legacy tables is not a destructive
 * change and is handled by the caller).
 */
export async function introspectLiveSchema(
  pg: PgConnectionLike,
  tables: readonly string[] = PROTECTED_TABLES
): Promise<TableSchema[]> {
  const rows = await pg("information_schema.columns")
    .select("table_name", "column_name", "data_type", "is_nullable")
    .where("table_schema", "public")
    .whereIn("table_name", tables)

  const byTable = new Map<string, ColumnSchema[]>()
  for (const row of rows) {
    const list = byTable.get(row.table_name) ?? []
    list.push({
      name: row.column_name,
      dataType: row.data_type,
      isNullable: String(row.is_nullable).toUpperCase() === "YES",
    })
    byTable.set(row.table_name, list)
  }

  const result: TableSchema[] = []
  for (const table of tables) {
    const columns = byTable.get(table)
    if (columns && columns.length > 0) {
      result.push({ table, columns })
    }
  }
  return result
}

/**
 * The baseline {@link TableSchema} for a protected table, if defined. Builds a
 * {@link TableSchema} from the column baseline in `baseline.ts`.
 */
export function baselineFor(table: string): TableSchema | undefined {
  if (!isProtectedTable(table)) {
    return undefined
  }
  return { table, columns: PROTECTED_TABLE_BASELINE[table] }
}
