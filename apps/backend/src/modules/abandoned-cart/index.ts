import { Module } from "@medusajs/framework/utils"
import AbandonedCartModuleService from "./service"
import { AbandonedCartReminder } from "./models/abandoned-cart-reminder"

/**
 * Abandoned-Cart Module (abandoned_cart_reminder)
 *
 * Idiomatic Medusa 2.16 module (`model.define` + `MedusaService`) that tracks
 * reminder state for carts a customer left behind, powering the abandoned-cart
 * recovery feature (a scheduled job detects idle carts and a workflow sends the
 * reminder email through the Notification Module).
 *
 * The module owns its own new `abandoned_cart_reminder` table and never mutates
 * the core `cart`; it is therefore outside the scope of the schema-preservation
 * guard, which protects only the legacy production tables.
 */
export const ABANDONED_CART_MODULE = "abandoned_cart"

export { AbandonedCartReminder }
export { default as AbandonedCartModuleService } from "./service"

export default Module(ABANDONED_CART_MODULE, {
  service: AbandonedCartModuleService,
})
