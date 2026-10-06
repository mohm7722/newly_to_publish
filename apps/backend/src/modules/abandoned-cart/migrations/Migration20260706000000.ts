import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Abandoned-Cart Module — create-table migration.
 *
 * Creates the module's own new `abandoned_cart_reminder` table. This is a fresh
 * table that does not exist in the legacy production baseline, so it is not one
 * of the schema-guard's protected tables and creating it is non-destructive.
 *
 * Idempotent / safe to re-run: all statements use `IF NOT EXISTS`.
 */
export class Migration20260706000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "abandoned_cart_reminder" (
        "id" text NOT NULL,
        "cart_id" text NOT NULL,
        "email" text NULL,
        "reminder_count" integer NOT NULL DEFAULT 0,
        "last_reminder_at" timestamptz NULL,
        "recovered" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "abandoned_cart_reminder_pkey" PRIMARY KEY ("id")
      );
    `)

    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_abandoned_cart_reminder_cart_id" ON "abandoned_cart_reminder" ("cart_id") WHERE "deleted_at" IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_abandoned_cart_reminder_last_reminder_at" ON "abandoned_cart_reminder" ("last_reminder_at") WHERE "deleted_at" IS NULL;`
    )
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "abandoned_cart_reminder" CASCADE;`)
  }
}
