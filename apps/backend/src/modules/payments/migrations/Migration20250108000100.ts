import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Payments_Module — additive, idempotent migration.
 *
 * This is a **reviewed, hand-authored** migration (NOT the framework's
 * auto-generated `CREATE TABLE` output). It performs exactly two operations: it
 * adds the single framework-required infrastructure column `deleted_at` that
 * `MedusaService` needs for soft-delete semantics, onto each of the **existing**
 * production `bank_accounts` and `cod_settings` tables.
 *
 * Safety properties (Requirements 1.2, 1.3, 1.5, 1.6, 9.4):
 *   - Additive-only: it adds a nullable column to each table and nothing else.
 *     It does NOT drop, rename, truncate, or alter the type of any existing
 *     column, and it creates/recreates no table.
 *   - Non-destructive: adding a nullable column changes zero existing row
 *     values and performs zero inserts/updates/deletes.
 *   - Idempotent / safe to re-run: `ADD COLUMN IF NOT EXISTS` is a no-op when
 *     the column already exists, so re-running the migration is harmless.
 *
 * The schema-preservation preflight guard whitelists exactly this change
 * (`ADD COLUMN IF NOT EXISTS deleted_at timestamptz NULL`) and halts startup on
 * anything more invasive.
 */
export class Migration20250108000100 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `ALTER TABLE IF EXISTS "bank_accounts" ADD COLUMN IF NOT EXISTS "deleted_at" timestamptz NULL;`
    )
    this.addSql(
      `ALTER TABLE IF EXISTS "cod_settings" ADD COLUMN IF NOT EXISTS "deleted_at" timestamptz NULL;`
    )
  }

  async down(): Promise<void> {
    // Intentionally a no-op. Dropping `deleted_at` would be a destructive
    // schema change against a preserved production table and could discard
    // soft-delete state, so the reversal is deliberately not performed.
  }
}
