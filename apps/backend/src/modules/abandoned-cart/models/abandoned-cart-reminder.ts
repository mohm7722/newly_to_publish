import { model } from "@medusajs/framework/utils"

/**
 * AbandonedCartReminder data model (Abandoned-Cart Module).
 *
 * Tracks the reminder state for a single core cart so the abandoned-cart
 * feature can (a) avoid re-notifying the same customer repeatedly and
 * (b) power basic recovery reporting. The module owns its **own** new table
 * (`abandoned_cart_reminder`) and never mutates the core `cart` — this keeps
 * `cart.updated_at` meaningful as "last customer activity" and keeps the
 * feature outside the scope of the schema-preservation guard (which only
 * protects the legacy production tables).
 *
 * Column mapping
 * --------------
 * - `id`               → generated text primary key.
 * - `cart_id`          → the core cart id this reminder state belongs to
 *                        (unique among non-deleted rows).
 * - `email`            → the cart email the reminder was/will be sent to.
 * - `reminder_count`   → how many reminders have been sent so far.
 * - `last_reminder_at` → timestamp of the most recent reminder (drives the
 *                        cooldown between reminders).
 * - `recovered`        → set once the cart is known to have completed into an
 *                        order (for recovery reporting).
 * - `dismissed`        → set by an admin to exclude the cart from further
 *                        automatic reminders.
 *
 * The framework-managed `created_at` / `updated_at` / `deleted_at` columns are
 * created by the module migration.
 */
export const AbandonedCartReminder = model
  .define("abandoned_cart_reminder", {
    id: model.id().primaryKey(),
    cart_id: model.text(),
    email: model.text().nullable(),
    reminder_count: model.number().default(0),
    last_reminder_at: model.dateTime().nullable(),
    recovered: model.boolean().default(false),
    dismissed: model.boolean().default(false),
  })
  .indexes([
    { on: ["cart_id"], unique: true },
    { on: ["last_reminder_at"] },
  ])

export default AbandonedCartReminder
