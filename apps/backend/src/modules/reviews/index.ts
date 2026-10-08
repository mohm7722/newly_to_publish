import { Module } from "@medusajs/framework/utils"
import ReviewsModuleService from "./service"
import { ProductReview } from "./models/product-review"

/**
 * Reviews Module (reviews)
 *
 * Idiomatic Medusa module (`model.define` + `MedusaService`) that stores
 * customer reviews / testimonials. It owns its own new `product_review` table
 * and never mutates any core table, so it is outside the scope of the
 * schema-preservation guard (which protects only the legacy production tables).
 *
 * The store API exposes only `approved` reviews; customer-submitted reviews
 * start as `pending` and are promoted by an admin.
 */
export const REVIEWS_MODULE = "reviews"

export { ProductReview }
export { default as ReviewsModuleService } from "./service"

export default Module(REVIEWS_MODULE, {
  service: ReviewsModuleService,
})
