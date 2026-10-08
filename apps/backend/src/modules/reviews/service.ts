import { MedusaService } from "@medusajs/framework/utils"
import { ProductReview } from "./models/product-review"

/** Allowed moderation states for a review. */
export type ReviewStatus = "pending" | "approved" | "rejected"
export const REVIEW_STATUSES: ReviewStatus[] = [
  "pending",
  "approved",
  "rejected",
]

/** Clamp an arbitrary input to an integer rating in the 1–5 range. */
function normalizeRating(value: unknown): number {
  const n = Math.round(Number(value))
  if (!Number.isFinite(n)) return 5
  return Math.min(5, Math.max(1, n))
}

/**
 * ReviewsModuleService.
 *
 * Wires the {@link ProductReview} model into the idiomatic Medusa `MedusaService`
 * factory, which generates the standard data-access primitives
 * (`listProductReviews`, `createProductReviews`, `updateProductReviews`,
 * `retrieveProductReview`, ...). On top of those this service exposes the small
 * business helpers the store API relies on, and centralizes the invariant that
 * **only `approved` reviews are ever read by the storefront**.
 */
class ReviewsModuleService extends MedusaService({
  ProductReview,
}) {
  /**
   * Approved, featured, store-level testimonials for the homepage slider,
   * newest first. "Store-level" means `product_id` is null.
   */
  async listFeaturedTestimonials(limit = 8) {
    const rows = await this.listProductReviews(
      { status: "approved", is_featured: true, product_id: null },
      { order: { created_at: "DESC" }, take: Math.max(1, Math.min(limit, 50)) }
    )
    return rows
  }

  /** Approved reviews for a specific product, newest first. */
  async listApprovedForProduct(productId: string, limit = 20) {
    const rows = await this.listProductReviews(
      { status: "approved", product_id: productId },
      { order: { created_at: "DESC" }, take: Math.max(1, Math.min(limit, 100)) }
    )
    return rows
  }

  /** Average rating + count across approved reviews of a product. */
  async getProductRatingSummary(productId: string) {
    const rows = await this.listProductReviews(
      { status: "approved", product_id: productId },
      { take: 1000 }
    )
    const count = rows.length
    const average =
      count === 0
        ? 0
        : Math.round(
            (rows.reduce((sum: number, r: any) => sum + Number(r.rating || 0), 0) /
              count) *
              10
          ) / 10
    return { count, average }
  }

  /**
   * Create a review in the `pending` state (the default for customer-submitted
   * reviews). Rating is clamped to 1–5 and basic text fields are trimmed.
   */
  async submitReview(input: {
    rating: unknown
    body: string
    author_name: string
    author_city?: string | null
    title?: string | null
    product_id?: string | null
    order_id?: string | null
  }) {
    const created = await this.createProductReviews({
      rating: normalizeRating(input.rating),
      body: String(input.body ?? "").trim(),
      author_name: String(input.author_name ?? "").trim(),
      author_city: input.author_city?.toString().trim() || null,
      title: input.title?.toString().trim() || null,
      product_id: input.product_id ?? null,
      order_id: input.order_id ?? null,
      status: "pending",
      is_featured: false,
    })
    return Array.isArray(created) ? created[0] : created
  }

  /** Move a review to a new moderation state (admin action). */
  async setStatus(id: string, status: ReviewStatus) {
    const updated = await this.updateProductReviews({ id, status })
    return Array.isArray(updated) ? updated[0] : updated
  }

  /**
   * Admin moderation listing: all reviews (any status), newest first, with
   * optional `status` / `product_id` filters and pagination. Returns the page
   * of rows plus the total matching count.
   */
  async adminList(opts: {
    status?: ReviewStatus
    product_id?: string
    limit?: number
    offset?: number
  }) {
    const filters: Record<string, unknown> = {}
    if (opts.status) filters.status = opts.status
    if (opts.product_id) filters.product_id = opts.product_id

    const take = Math.max(1, Math.min(opts.limit ?? 50, 200))
    const skip = Math.max(0, opts.offset ?? 0)

    const [rows, count] = await this.listAndCountProductReviews(filters, {
      order: { created_at: "DESC" },
      take,
      skip,
    })
    return { rows, count }
  }
}

export default ReviewsModuleService
