/**
 * Schema-preservation guard — typed error.
 *
 * Thrown by `assertNonDestructiveDiff` when a pending/applied schema change
 * against a protected table is destructive. The message names the specific
 * table and the offending change so the operator can identify and revert the
 * migration before any data loss (Requirements 1.7, 9.4).
 */

import type { SchemaChange } from "./types"

const KIND_LABEL: Record<SchemaChange["kind"], string> = {
  add_column: "adds a disallowed column to",
  drop_column: "drops a column from",
  rename_column: "renames a column on",
  alter_column_type: "alters a column type on",
  drop_table: "drops",
  rename_table: "renames",
  truncate_table: "truncates",
  delete_rows: "deletes rows from",
}

/** Build a precise, human-readable description of a single destructive change. */
export function describeChange(change: SchemaChange): string {
  const label = KIND_LABEL[change.kind] ?? "modifies"
  switch (change.kind) {
    case "drop_table":
    case "truncate_table":
    case "delete_rows":
      return `${label} protected table "${change.table}"`
    case "rename_table":
      return `${label} protected table "${change.table}" to "${change.toName ?? "?"}"`
    case "rename_column":
      return `${label} protected table "${change.table}" (column "${change.column ?? "?"}" -> "${change.toName ?? "?"}")`
    case "alter_column_type":
      return `${label} protected table "${change.table}" (column "${change.column ?? "?"}": "${change.fromType ?? "?"}" -> "${change.toType ?? "?"}")`
    case "drop_column":
      return `${label} protected table "${change.table}" (column "${change.column ?? "?"}")`
    case "add_column":
      return `${label} protected table "${change.table}" (column "${change.column ?? "?"}" ${change.dataType ?? ""})`.trim()
    default:
      return `${label} protected table "${change.table}"`
  }
}

/**
 * Raised when a destructive schema change against a protected table is
 * detected. Halts the build/startup before the change is applied.
 */
export class DestructiveSchemaChangeError extends Error {
  readonly code = "DESTRUCTIVE_SCHEMA_CHANGE"
  /** The protected table the offending change targets. */
  readonly table: string
  /** The offending change. */
  readonly change: SchemaChange

  constructor(change: SchemaChange) {
    super(
      `Schema-preservation guard halted startup: a pending migration ${describeChange(change)}. ` +
        `Destructive changes (drop, rename, truncate, column-type alteration, row delete) to protected tables ` +
        `are not allowed; only "ADD COLUMN IF NOT EXISTS deleted_at timestamptz NULL" is permitted. ` +
        `Revert the offending migration before starting the backend.`
    )
    this.name = "DestructiveSchemaChangeError"
    this.table = change.table
    this.change = change
    Object.setPrototypeOf(this, DestructiveSchemaChangeError.prototype)
  }
}
