/**
 * Schema-preservation guard — pure diff & assertion logic.
 *
 * This module is framework-agnostic and side-effect free. It is the unit
 * exercised by Property 2 (Destructive-migration guard, task 3.2):
 *
 *   For any schema-diff against a protected table, the guard rejects the diff
 *   with an error naming the specific table and change when the diff contains a
 *   drop, rename, truncate, or column-type alteration, and accepts the diff
 *   when it contains only additive operations (such as adding a nullable
 *   `deleted_at`).
 *
 * Three entry points:
 *   - {@link isAllowedChange} classifies a single change.
 *   - {@link assertNonDestructiveChanges} validates an explicit list of changes.
 *   - {@link diffSchemas} derives the change list by comparing a live table
 *     against its preserved baseline (used by the startup preflight), and
 *     {@link assertTablePreserved} composes the two for one table.
 */
import {
  ALLOWED_ADDITIVE_COLUMN,
  ALLOWED_ADDITIVE_TYPE,
  isBenignTypeDifference,
  normalizeType,
} from "./baseline"
import { DestructiveSchemaChangeError } from "./errors"
import type { ColumnSchema, SchemaChange, TableSchema } from "./types"

/** Find a column by name (case-insensitive). */
function findColumn(
  columns: readonly ColumnSchema[],
  name: string
): ColumnSchema | undefined {
  return columns.find((c) => c.name.toLowerCase() === name.toLowerCase())
}

/**
 * Decide whether a single change is permitted on a protected table.
 *
 * The ONLY permitted change is adding a nullable `deleted_at` column whose type
 * normalizes to `timestamptz` (i.e. `ADD COLUMN IF NOT EXISTS deleted_at
 * timestamptz NULL`). Every other change kind — drop, rename, alter type,
 * truncate, delete rows, drop table, or adding any other column — is
 * destructive and therefore rejected.
 */
export function isAllowedChange(change: SchemaChange): boolean {
  if (change.kind !== "add_column") {
    return false
  }
  if (change.column !== ALLOWED_ADDITIVE_COLUMN) {
    return false
  }
  if (change.isNullable !== true) {
    return false
  }
  return (
    typeof change.dataType === "string" &&
    normalizeType(change.dataType) === normalizeType(ALLOWED_ADDITIVE_TYPE)
  )
}

/**
 * Assert that every change in `changes` is non-destructive for `table`.
 *
 * Throws {@link DestructiveSchemaChangeError} naming the table and the first
 * offending change on any drop/rename/truncate/row-delete/column-type
 * alteration (or any non-`deleted_at` column addition). Returns normally when
 * the list is empty or contains only the allowed additive `deleted_at` column.
 *
 * `table` is used to stamp any change that does not already carry its target
 * table, so the thrown error always names the correct table.
 */
export function assertNonDestructiveChanges(
  table: string,
  changes: readonly SchemaChange[]
): void {
  for (const change of changes) {
    if (!isAllowedChange(change)) {
      const offending: SchemaChange = change.table
        ? change
        : { ...change, table }
      throw new DestructiveSchemaChangeError(offending)
    }
  }
}

/**
 * Derive the list of changes that transform the preserved `baseline` into the
 * observed `live` schema for a single table.
 *
 * - A baseline column missing from `live` is reported as `drop_column`.
 * - A baseline column whose live type differs (and is not a whitelisted benign
 *   difference) is reported as `alter_column_type`.
 * - A live column absent from the baseline is reported as `add_column`
 *   (additive — only a nullable `deleted_at` is subsequently accepted by the
 *   guard).
 *
 * Benign differences (PK `uuid`/`varchar`/`text` interchangeability, and
 * `shipping_cities` timestamp-without-tz vs `timestamptz`) are suppressed via
 * {@link isBenignTypeDifference} so they are never flagged as destructive.
 *
 * Renames are indistinguishable from a drop+add at the column-set level, so a
 * rename surfaces as a `drop_column` (destructive) here; explicit
 * `rename_column` operations are still rejected by
 * {@link assertNonDestructiveChanges} when supplied directly (e.g. from the
 * migration SQL scanner).
 */
export function diffSchemas(
  baseline: TableSchema,
  live: TableSchema
): SchemaChange[] {
  const changes: SchemaChange[] = []
  const table = baseline.table

  for (const expected of baseline.columns) {
    const actual = findColumn(live.columns, expected.name)

    if (!actual) {
      changes.push({ kind: "drop_column", table, column: expected.name })
      continue
    }

    if (normalizeType(expected.dataType) !== normalizeType(actual.dataType)) {
      if (
        !isBenignTypeDifference(
          table,
          expected.name,
          actual.dataType,
          expected.dataType
        )
      ) {
        changes.push({
          kind: "alter_column_type",
          table,
          column: expected.name,
          fromType: expected.dataType,
          toType: actual.dataType,
        })
      }
    }
  }

  for (const actual of live.columns) {
    if (!findColumn(baseline.columns, actual.name)) {
      changes.push({
        kind: "add_column",
        table,
        column: actual.name,
        dataType: actual.dataType,
        isNullable: actual.isNullable,
      })
    }
  }

  return changes
}

/**
 * Diff a live table against its baseline and assert the result is
 * non-destructive. Convenience composition of {@link diffSchemas} and
 * {@link assertNonDestructiveChanges} for one table.
 */
export function assertTablePreserved(
  baseline: TableSchema,
  live: TableSchema
): void {
  const changes = diffSchemas(baseline, live)
  assertNonDestructiveChanges(baseline.table, changes)
}
