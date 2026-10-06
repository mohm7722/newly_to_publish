import { model } from "@medusajs/framework/utils"

/**
 * OrderSettlement data model (Settlement Module).
 *
 * Maps the idiomatic Medusa 2.16 `model.define` model onto the **existing**
 * production `order_settlement` table without introducing any new business
 * column or renaming an existing one (Requirements 1.1, 1.2, 3.2). The table
 * layers Yemeni-currency settlement onto the core `@medusajs/draft-order`
 * system: each row records the settlement currency and the computed,
 * FX-converted amounts for a single core order, keyed by `order_id`.
 *
 * Table mapping
 * -------------
 * The model name is `order_settlement` and the backing table is the existing
 * `order_settlement`. The `{ name, tableName }` form of `model.define` pins the
 * table name so the framework reads/writes the legacy table rather than
 * deriving a fresh one. (`MedusaService` does NOT auto-pluralize, so pinning
 * the explicit `tableName` guarantees the framework targets the existing
 * `order_settlement` table.)
 *
 * Column mapping (exact, 1:1 with the existing table)
 * ---------------------------------------------------
 * - `order_id`           → `order_id` text PK. This is the **only** primary key
 *                          (there is no separate `id` column). It holds the core
 *                          order id verbatim; existing rows keep their stored
 *                          value and the framework never generates a replacement
 *                          PK (Requirement 1.3).
 * - `currency_code`      → `currency_code` text. The selected settlement
 *                          currency (`SAR`, `YER_NEW`, `YER_OLD`).
 * - `base_currency_code` → `base_currency_code` text, default `SAR`. The base
 *                          currency the order totals are expressed in.
 * - `rate`               → `rate` numeric(18,6). The applied SAR→settlement
 *                          conversion rate.
 * - `subtotal`           → `subtotal` bigint. Converted order subtotal.
 * - `shipping`           → `shipping` bigint. Converted shipping total.
 * - `tax`                → `tax` bigint. Converted tax total.
 * - `discount`           → `discount` bigint. Converted discount total.
 * - `total`              → `total` bigint. Converted order total.
 * - `snapshot_json`      → `snapshot_json` jsonb, nullable. The FX snapshot
 *                          (ui currency, base, rates, timestamp, metadata).
 *
 * The money/amount fields are declared `model.number()` so the framework maps
 * them 1:1 onto the existing plain `numeric`/`bigint` columns. They must NOT be
 * declared `model.bigNumber()`: a `bigNumber` field additionally requires a
 * companion `raw_<field>` jsonb column, which this legacy table does not have
 * (and the schema-preservation guard forbids adding), so a `bigNumber` write
 * fails with `column "raw_<field>" does not exist`. All persisted values are
 * integer minor-units (amounts) or integer FX rates, so `number` preserves the
 * stored precision exactly.
 *
 * The framework-managed `created_at` / `updated_at` columns already exist on the
 * table; the single additive, nullable `deleted_at` column required by
 * `MedusaService` soft-delete semantics is added by the module migration
 * (additive-only, see `migrations/`).
 */
export const OrderSettlement = model
  .define(
    { name: "order_settlement", tableName: "order_settlement" },
    {
      order_id: model.text().primaryKey(),
      currency_code: model.text(),
      base_currency_code: model.text().default("SAR"),
      rate: model.number(),
      subtotal: model.number(),
      shipping: model.number(),
      tax: model.number(),
      discount: model.number(),
      total: model.number(),
      snapshot_json: model.json().nullable(),
    }
  )
  .indexes([{ on: ["currency_code"] }])

export default OrderSettlement
