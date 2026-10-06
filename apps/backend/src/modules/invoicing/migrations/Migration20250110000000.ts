import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Invoicing module — additive, idempotent migration.
 *
 * Creates the new `invoicing_invoice` table and the order-invoice numbering
 * sequence. Purely additive; touches none of the schema-guard-protected tables.
 */
export class Migration20250110000000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`
      CREATE TABLE IF NOT EXISTS "invoicing_invoice" (
        "id" text NOT NULL,
        "invoice_number" text NOT NULL,
        "document_type" text NOT NULL DEFAULT 'order_invoice',
        "order_id" text NOT NULL,
        "issued_by" text NULL,
        "currency_code" text NOT NULL,
        "total" numeric NOT NULL DEFAULT 0,
        "raw_total" jsonb NULL,
        "settlement_currency" text NULL,
        "settlement_total" numeric NULL,
        "raw_settlement_total" jsonb NULL,
        "fx_rate" numeric NULL,
        "raw_fx_rate" jsonb NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        "deleted_at" timestamptz NULL,
        CONSTRAINT "invoicing_invoice_pkey" PRIMARY KEY ("id")
      );
    `)
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_invoicing_invoice_number_unique" ON "invoicing_invoice" ("invoice_number") WHERE "deleted_at" IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_invoicing_invoice_order" ON "invoicing_invoice" ("order_id", "document_type") WHERE "deleted_at" IS NULL;`
    )
    // Order-invoice numbering sequence (the numbering lib also creates it
    // lazily for other document types).
    this.addSql(`CREATE SEQUENCE IF NOT EXISTS "doc_seq_order_invoice";`)
  }

  async down(): Promise<void> {
    this.addSql(`DROP TABLE IF EXISTS "invoicing_invoice";`)
    this.addSql(`DROP SEQUENCE IF EXISTS "doc_seq_order_invoice";`)
  }
}
