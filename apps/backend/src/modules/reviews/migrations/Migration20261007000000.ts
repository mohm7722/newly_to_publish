import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Reviews Module — create-table migration.
 *
 * Creates the module's own new `product_review` table. This is a fresh table
 * that does not exist in the legacy production baseline, so it is not one of
 * the schema-guard's protected tables and creating it is non-destructive.
 *
 * Idempotent / safe to re-run: all statements use `IF NOT EXISTS`.
 */
export class Migration20261007000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "product_review" (
        "id" text NOT NULL,
        "rating" integer NOT NULL DEFAULT 5,
        "title" text NULL,
        "body" text NOT NULL,
        "author_name" text NOT NULL,
        "author_city" text NULL,
        "product_id" text NULL,
        "order_id" text NULL,
        "status" text NOT NULL DEFAULT 'pending',
        "is_featured" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "product_review_pkey" PRIMARY KEY ("id")
      );
    `)

    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_product_review_status" ON "product_review" ("status") WHERE "deleted_at" IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_product_review_product_id" ON "product_review" ("product_id") WHERE "deleted_at" IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_product_review_is_featured" ON "product_review" ("is_featured") WHERE "deleted_at" IS NULL;`
    )
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "product_review" CASCADE;`)
  }
}
