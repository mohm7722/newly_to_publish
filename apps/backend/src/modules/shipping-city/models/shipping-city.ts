import { model } from "@medusajs/framework/utils"

/**
 * ShippingCity data model (Shipping_City_Module).
 *
 * Maps the idiomatic Medusa 2.16 `model.define` model onto the **existing**
 * production `shipping_cities` table without introducing any new business
 * column or renaming an existing one (Requirements 1.1, 1.2).
 *
 * Table mapping
 * -------------
 * The model name is `shipping_city`, but the backing table is the existing
 * plural `shipping_cities`. The `{ name, tableName }` form of `model.define`
 * pins the table name so the framework reads/writes the legacy table instead of
 * deriving a fresh `shipping_city` table.
 *
 * Column mapping (exact, 1:1 with the existing table)
 * ---------------------------------------------------
 * - `id`             → `id` varchar PK. Treated as an **opaque string**: ids are
 *                      supplied on create in the legacy `shpcity_<ts>_<rand>`
 *                      format and existing rows keep their stored value. The
 *                      framework never generates a replacement PK for existing
 *                      rows (Requirement 1.3).
 * - `city`           → `city` text, with a UNIQUE index matching the existing
 *                      table constraint (Requirement 5.1 uniqueness, 5.2).
 * - `delivery_price` → existing `delivery_price numeric(10,2)` column. Declared
 *                      as `model.number()` because this preserved legacy table
 *                      does not have Medusa's companion `raw_delivery_price`
 *                      column required by `model.bigNumber()`. Values are
 *                      rounded and bounded at the service boundary.
 * - `is_active`      → `is_active` boolean, default true.
 *
 * The framework-managed `created_at` / `updated_at` columns already exist on the
 * table; the single additive, nullable `deleted_at` column required by
 * `MedusaService` soft-delete semantics is added by the module migration
 * (additive-only, see `migrations/`).
 */
export const ShippingCity = model
  .define(
    { name: "shipping_city", tableName: "shipping_cities" },
    {
      id: model.id().primaryKey(),
      city: model.text(),
      delivery_price: model.number(),
      is_active: model.boolean().default(true),
    }
  )
  .indexes([{ on: ["city"], unique: true }])

export default ShippingCity
