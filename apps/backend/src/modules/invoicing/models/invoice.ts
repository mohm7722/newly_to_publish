import { model } from "@medusajs/framework/utils"

/**
 * Invoice record (Invoicing module).
 *
 * A persisted accounting document with its **own** number series, independent
 * of the order's display id. An invoice is issued once per order (per document
 * type) and reused on subsequent prints, so the number is stable. Monetary and
 * settlement values are snapshotted at issue time for accounting integrity.
 *
 * New table `invoicing_invoice` (additive; does not touch protected tables).
 */
export const Invoice = model
  .define(
    { name: "invoice", tableName: "invoicing_invoice" },
    {
      id: model.id({ prefix: "inv" }).primaryKey(),
      /** Unique human-facing number, e.g. INV-2026-000042. */
      invoice_number: model.text(),
      /** Document type discriminator (order_invoice, return_invoice, …). */
      document_type: model.text().default("order_invoice"),
      /** Source order id. */
      order_id: model.text(),
      /** Identity of the admin who first issued the invoice. */
      issued_by: model.text().nullable(),
      /** Snapshot: order currency + total at issue time. */
      currency_code: model.text(),
      total: model.bigNumber(),
      /** Snapshot: settlement currency/total + applied FX rate (optional). */
      settlement_currency: model.text().nullable(),
      settlement_total: model.bigNumber().nullable(),
      fx_rate: model.bigNumber().nullable(),
    }
  )
  .indexes([
    { on: ["invoice_number"], unique: true },
    { on: ["order_id", "document_type"] },
  ])

export default Invoice
