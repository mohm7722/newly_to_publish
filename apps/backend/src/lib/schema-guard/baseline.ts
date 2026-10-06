/**
 * Schema-preservation guard — protected-table baseline and benign-difference
 * whitelist.
 *
 * The baseline column shapes below are taken verbatim from the existing
 * production schema (`medusa-backup.sql` DDL). The guard compares the live
 * database against this baseline; any missing column or non-benign type change
 * is treated as destructive. New rows and modules must map onto these columns
 * exactly, adding no business columns (Requirement 1.2).
 */

import type { ColumnSchema } from "./types"

/** The tables the guard protects from destructive migrations. */
export const PROTECTED_TABLES = [
  "shipping_cities",
  "bank_accounts",
  "cod_settings",
  "order_settlement",
] as const

export type ProtectedTable = (typeof PROTECTED_TABLES)[number]

/** The single additive column the guard permits on a protected table. */
export const ALLOWED_ADDITIVE_COLUMN = "deleted_at"

/** The required type of the allowed additive `deleted_at` column. */
export const ALLOWED_ADDITIVE_TYPE = "timestamptz"

/** The primary-key column of each protected table. */
export const PRIMARY_KEY_COLUMN: Record<ProtectedTable, string> = {
  shipping_cities: "id",
  bank_accounts: "id",
  cod_settings: "id",
  order_settlement: "order_id",
}

/**
 * Existing columns of each protected table, normalized types, exactly as they
 * appear in the production database. Derived from the backup DDL:
 *
 * - `bank_accounts(id uuid, bank_name varchar(255), account_number varchar(100)
 *   UNIQUE, currency_code varchar(20), instructions text, is_active boolean,
 *   created_at timestamptz, updated_at timestamptz)`
 * - `cod_settings(id uuid, enabled boolean, instructions text,
 *   selected_city_ids jsonb, created_at timestamptz, updated_at timestamptz)`
 * - `shipping_cities(id varchar, city varchar UNIQUE, delivery_price
 *   numeric(10,2), is_active boolean, created_at timestamp, updated_at
 *   timestamp)`  ← note `timestamp without time zone`
 * - `order_settlement(order_id text PK, currency_code text, base_currency_code
 *   text, rate numeric(18,6), subtotal/shipping/tax/discount/total bigint,
 *   snapshot_json jsonb, created_at timestamptz, updated_at timestamptz)`
 */
export const PROTECTED_TABLE_BASELINE: Record<ProtectedTable, ColumnSchema[]> = {
  shipping_cities: [
    { name: "id", dataType: "character varying", isNullable: false },
    { name: "city", dataType: "character varying", isNullable: false },
    { name: "delivery_price", dataType: "numeric", isNullable: false },
    { name: "is_active", dataType: "boolean", isNullable: false },
    { name: "created_at", dataType: "timestamp without time zone", isNullable: false },
    { name: "updated_at", dataType: "timestamp without time zone", isNullable: false },
  ],
  bank_accounts: [
    { name: "id", dataType: "uuid", isNullable: false },
    { name: "bank_name", dataType: "character varying", isNullable: false },
    { name: "account_number", dataType: "character varying", isNullable: false },
    { name: "currency_code", dataType: "character varying", isNullable: false },
    { name: "instructions", dataType: "text", isNullable: true },
    { name: "is_active", dataType: "boolean", isNullable: false },
    { name: "created_at", dataType: "timestamp with time zone", isNullable: false },
    { name: "updated_at", dataType: "timestamp with time zone", isNullable: false },
  ],
  cod_settings: [
    { name: "id", dataType: "uuid", isNullable: false },
    { name: "enabled", dataType: "boolean", isNullable: false },
    { name: "instructions", dataType: "text", isNullable: true },
    { name: "selected_city_ids", dataType: "jsonb", isNullable: true },
    { name: "created_at", dataType: "timestamp with time zone", isNullable: false },
    { name: "updated_at", dataType: "timestamp with time zone", isNullable: false },
  ],
  order_settlement: [
    { name: "order_id", dataType: "text", isNullable: false },
    { name: "currency_code", dataType: "text", isNullable: false },
    { name: "base_currency_code", dataType: "text", isNullable: false },
    { name: "rate", dataType: "numeric", isNullable: false },
    { name: "subtotal", dataType: "bigint", isNullable: false },
    { name: "shipping", dataType: "bigint", isNullable: false },
    { name: "tax", dataType: "bigint", isNullable: false },
    { name: "discount", dataType: "bigint", isNullable: false },
    { name: "total", dataType: "bigint", isNullable: false },
    { name: "snapshot_json", dataType: "jsonb", isNullable: true },
    { name: "created_at", dataType: "timestamp with time zone", isNullable: true },
    { name: "updated_at", dataType: "timestamp with time zone", isNullable: true },
  ],
}

/** Returns true when `table` is one the guard protects. */
export function isProtectedTable(table: string): table is ProtectedTable {
  return (PROTECTED_TABLES as readonly string[]).includes(table)
}

/**
 * Normalize a raw Postgres data type into a coarse canonical token so that
 * equivalent spellings compare equal (e.g. `character varying` → `varchar`,
 * `timestamp with time zone` → `timestamptz`).
 *
 * Length/precision qualifiers (`(255)`, `(10,2)`) are intentionally dropped —
 * the guard cares about the column *type*, not its width, and `model.define`
 * does not re-declare widths.
 */
export function normalizeType(raw: string): string {
  const t = String(raw ?? "")
    .trim()
    .toLowerCase()
    // strip precision/length qualifiers e.g. numeric(18,6) -> numeric
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim()

  switch (t) {
    case "character varying":
    case "varchar":
      return "varchar"
    case "character":
    case "char":
      return "char"
    case "timestamp with time zone":
    case "timestamptz":
      return "timestamptz"
    case "timestamp without time zone":
    case "timestamp":
      return "timestamp"
    case "bool":
    case "boolean":
      return "boolean"
    case "int8":
    case "bigint":
      return "bigint"
    case "int":
    case "int4":
    case "integer":
      return "integer"
    case "json":
    case "jsonb":
      return "jsonb"
    case "decimal":
    case "numeric":
      return "numeric"
    default:
      return t
  }
}

const STRINGY_PK_TYPES = new Set(["uuid", "varchar", "text", "char"])
const TIMESTAMP_TYPES = new Set(["timestamp", "timestamptz"])

/**
 * Whitelist of known-benign type differences that must NOT be flagged as
 * destructive (Requirements: "whitelist the known benign differences"):
 *
 * 1. The primary-key columns may differ between `uuid` / `varchar` / `text`.
 *    The design treats the PK as an opaque, externally-supplied string and
 *    preserves whichever type the table already uses (`uuid` for
 *    `bank_accounts`/`cod_settings`, `varchar` for `shipping_cities`,
 *    `text` for `order_settlement`).
 * 2. `shipping_cities.created_at` / `updated_at` are `timestamp without time
 *    zone`, while `model.define` timestamps are `timestamptz`. The driver
 *    handles the conversion, so this difference is left as-is.
 */
export function isBenignTypeDifference(
  table: string,
  column: string,
  liveType: string,
  expectedType: string
): boolean {
  const a = normalizeType(liveType)
  const b = normalizeType(expectedType)
  if (a === b) {
    return true
  }

  // (1) PK string-type interchangeability.
  const pk = (PRIMARY_KEY_COLUMN as Record<string, string | undefined>)[table]
  if (pk === column && STRINGY_PK_TYPES.has(a) && STRINGY_PK_TYPES.has(b)) {
    return true
  }

  // (2) shipping_cities timestamp-without-tz vs timestamptz.
  if (
    table === "shipping_cities" &&
    TIMESTAMP_TYPES.has(a) &&
    TIMESTAMP_TYPES.has(b)
  ) {
    return true
  }

  return false
}
