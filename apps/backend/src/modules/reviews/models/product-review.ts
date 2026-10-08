import { model } from "@medusajs/framework/utils"

/**
 * ProductReview data model (Reviews Module).
 *
 * Stores customer reviews / testimonials. A review may be attached to a
 * specific product (`product_id` set) or be a store-level testimonial
 * (`product_id` null — the kind rendered in the homepage "آراء العملاء"
 * section). The module owns its **own** new table (`product_review`) and never
 * mutates any core table, so it sits outside the schema-preservation guard
 * (which only protects the legacy production tables).
 *
 * Column mapping
 * --------------
 * - `id`           → generated text primary key.
 * - `rating`       → 1–5 star rating (validated at the API/service layer).
 * - `title`        → optional short headline.
 * - `body`         → the review text shown to shoppers.
 * - `author_name`  → display name of the reviewer.
 * - `author_city`  → optional city/location label (e.g. "تعز").
 * - `product_id`   → core product id the review is about, or null for a
 *                    store-level testimonial.
 * - `order_id`     → core order id used to mark a *verified* purchase; when set
 *                    the storefront can show a "عميل موثوق" badge truthfully.
 * - `status`       → moderation state: `pending` | `approved` | `rejected`.
 *                    Only `approved` rows are ever exposed by the store API.
 * - `is_featured`  → when true the review is eligible for the homepage
 *                    testimonials slider.
 *
 * The framework-managed `created_at` / `updated_at` / `deleted_at` columns are
 * created by the module migration.
 */
export const ProductReview = model
  .define("product_review", {
    id: model.id().primaryKey(),
    rating: model.number().default(5),
    title: model.text().nullable(),
    body: model.text(),
    author_name: model.text(),
    author_city: model.text().nullable(),
    product_id: model.text().nullable(),
    order_id: model.text().nullable(),
    status: model.text().default("pending"),
    is_featured: model.boolean().default(false),
  })
  .indexes([
    { on: ["status"] },
    { on: ["product_id"] },
    { on: ["is_featured"] },
  ])

export default ProductReview
