import { Migration } from "@medusajs/framework/mikro-orm/migrations"

/**
 * Invoicing module — add BigNumber companion `raw_*` columns.
 *
 * `model.bigNumber()` fields persist both a numeric column and a `raw_<field>`
 * jsonb companion column. The initial migration created the numeric columns but
 * omitted the raw companions; this additive, idempotent migration adds them so
 * inserts/updates of `total` / `settlement_total` / `fx_rate` succeed.
 */
export class Migration20250110000001 extends Migration {
  async up(): Promise<void> {
    this.addSql(
      `ALTER TABLE IF EXISTS "invoicing_invoice" ADD COLUMN IF NOT EXISTS "raw_total" jsonb NULL;`
    )
    this.addSql(
      `ALTER TABLE IF EXISTS "invoicing_invoice" ADD COLUMN IF NOT EXISTS "raw_settlement_total" jsonb NULL;`
    )
    this.addSql(
      `ALTER TABLE IF EXISTS "invoicing_invoice" ADD COLUMN IF NOT EXISTS "raw_fx_rate" jsonb NULL;`
    )
  }

  async down(): Promise<void> {
    this.addSql(
      `ALTER TABLE IF EXISTS "invoicing_invoice" DROP COLUMN IF EXISTS "raw_total";`
    )
    this.addSql(
      `ALTER TABLE IF EXISTS "invoicing_invoice" DROP COLUMN IF EXISTS "raw_settlement_total";`
    )
    this.addSql(
      `ALTER TABLE IF EXISTS "invoicing_invoice" DROP COLUMN IF EXISTS "raw_fx_rate";`
    )
  }
}
