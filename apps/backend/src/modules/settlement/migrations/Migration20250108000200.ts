import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Settlement Module — additive, idempotent migration.
 *
 * This is a **reviewed, hand-authored** migration (NOT the framework's
 * auto-generated `CREATE TABLE` output). It performs exactly one operation: it
 * adds the single framework-required infrastructure column `deleted_at` that
 * `MedusaService` needs for soft-delete semantics, onto the **existing**
 * production `order_settlement` table.
 *
 * Safety properties (Requirements 1.2, 1.5, 1.6, 3.2, 9.4):
 *   - Additive-only: it adds a nullable column and nothing else. It does NOT
 *     drop, rename, truncate, or alter the type of any existing column, and it
 *     creates/recreates no table.
 *   - Non-destructive: adding a nullable column changes zero existing row
 *     values and performs zero inserts/updates/deletes.
 *   - Idempotent / safe to re-run: `ADD COLUMN IF NOT EXISTS` is a no-op when
 *     the column already exists, so re-running the migration is harmless.
 *
 * The schema-preservation preflight guard whitelists exactly this change
 * (`ADD COLUMN IF NOT EXISTS deleted_at timestamptz NULL`) and halts startup on
 * anything more invasive.
 */
export class Migration20250108000200 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `ALTER TABLE IF EXISTS "order_settlement" ADD COLUMN IF NOT EXISTS "deleted_at" timestamptz NULL;`
    )
  }

  async down(): Promise<void> {
    // Intentionally a no-op. Dropping `deleted_at` would be a destructive
    // schema change against a preserved production table and could discard
    // soft-delete state, so the reversal is deliberately not performed.
  }
}
