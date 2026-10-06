/**
 * Schema-preservation guard — shared types.
 *
 * The schema guard protects the four existing production tables that the
 * migrated custom modules map onto (`shipping_cities`, `bank_accounts`,
 * `cod_settings`, `order_settlement`). Its job is to halt the build/startup
 * before any module migration performs a destructive change (drop, rename,
 * truncate, column-type alteration, or row delete) against those tables. The
 * only schema change the guard permits is the additive, nullable
 * `deleted_at timestamptz NULL` column required by `MedusaService`
 * (Requirements 1.6, 1.7, 9.4).
 *
 * These types are intentionally framework-agnostic so the core diff/assert
 * logic stays pure and unit-testable (Property 2, task 3.2).
 */

/** A single live or expected column, with its Postgres data type. */
export type ColumnSchema = {
  /** Column name as stored in the database. */
  name: string
  /** Raw Postgres `data_type` (e.g. `character varying`, `timestamp with time zone`). */
  dataType: string
  /** Whether the column accepts NULL. */
  isNullable: boolean
}

/** The columns of a single table. */
export type TableSchema = {
  /** Unqualified table name (no schema prefix). */
  table: string
  /** Columns in ordinal order. */
  columns: ColumnSchema[]
}

/**
 * The kinds of schema change the guard reasons about. Every kind except
 * `add_column` (of the allowed `deleted_at` column) is destructive against a
 * protected table.
 */
export type SchemaChangeKind =
  | "add_column"
  | "drop_column"
  | "rename_column"
  | "alter_column_type"
  | "drop_table"
  | "rename_table"
  | "truncate_table"
  | "delete_rows"

/**
 * A normalized representation of one schema operation. Produced either by
 * diffing the live schema against the model-expected schema (`diffSchemas`) or
 * by scanning pending module migration SQL (`scanSqlForSchemaChanges`), and
 * consumed by `assertNonDestructiveDiff`.
 */
export type SchemaChange = {
  kind: SchemaChangeKind
  /** Unqualified table the change targets. */
  table: string
  /** Column the change targets (for column-scoped kinds). */
  column?: string
  /** New name (for `rename_column` / `rename_table`). */
  toName?: string
  /** Declared type (for `add_column`). */
  dataType?: string
  /** Declared nullability (for `add_column`). */
  isNullable?: boolean
  /** Previous type (for `alter_column_type`). */
  fromType?: string
  /** New type (for `alter_column_type`). */
  toType?: string
  /** Optional human-readable detail used in error messages. */
  detail?: string
}

/** A read-only SQL runner returning result rows. */
export type QueryRunner = (
  sql: string,
  bindings?: unknown[]
) => Promise<Array<Record<string, unknown>>>
