import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Abandoned-Cart Module — additive `dismissed` column.
 *
 * Adds the nullable/defaulted `dismissed` flag used by the admin management UI
 * to exclude a cart from further automatic reminders. Additive-only and
 * idempotent (safe to re-run).
 */
export class Migration20260706100000 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `ALTER TABLE IF EXISTS "abandoned_cart_reminder" ADD COLUMN IF NOT EXISTS "dismissed" boolean NOT NULL DEFAULT false;`
    )
  }

  async down(): Promise<void> {
    this.addSql(
      `ALTER TABLE IF EXISTS "abandoned_cart_reminder" DROP COLUMN IF EXISTS "dismissed";`
    )
  }
}
