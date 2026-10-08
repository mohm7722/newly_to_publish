import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { REVIEWS_MODULE } from "../../../modules/reviews"
import type ReviewsModuleService from "../../../modules/reviews/service"

/**
 * Store reviews route.
 *
 * `GET /store/reviews` returns **only approved** customer reviews, in a shape
 * ready for the storefront. Two modes:
 *
 *   - `?product_id=<id>` → approved reviews for that product plus a rating
 *     summary (`{ average, count }`).
 *   - otherwise (optionally `?featured=true`) → approved, featured, store-level
 *     testimonials for the homepage slider.
 *
 * `?limit=<n>` caps the number of returned reviews (service clamps the range).
 *
 * `/store/*` is publishable-key gated and CORS-enabled by the framework
 * middleware, and the service guarantees pending/rejected rows are never
 * exposed here.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const reviewsService: ReviewsModuleService = req.scope.resolve(REVIEWS_MODULE)

    const productId =
      typeof req.query.product_id === "string" ? req.query.product_id : undefined
    const limitRaw = Number(req.query.limit)
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : undefined

    if (productId) {
      const [rows, summary] = await Promise.all([
        reviewsService.listApprovedForProduct(productId, limit ?? 20),
        reviewsService.getProductRatingSummary(productId),
      ])
      res.json({
        ok: true,
        reviews: rows.map(serializeReview),
        average: summary.average,
        count: summary.count,
      })
      return
    }

    const rows = await reviewsService.listFeaturedTestimonials(limit ?? 8)
    res.json({ ok: true, reviews: rows.map(serializeReview) })
  } catch (error) {
    console.error("Error fetching reviews:", error)
    res.status(500).json({ ok: false, error: "Failed to fetch reviews" })
  }
}

/**
 * `POST /store/reviews` — a customer submits a review.
 *
 * The review is always created in the `pending` state and is **never featured**
 * on submission; it only becomes visible after an admin approves it. Security:
 * `order_id`, `status`, and `is_featured` from the client are **ignored** — a
 * shopper cannot self-award the "verified buyer" badge or auto-publish a review.
 * Only `product_id` is accepted so a review can target a product.
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>

    const author_name = typeof body.author_name === "string" ? body.author_name.trim() : ""
    const text = typeof body.body === "string" ? body.body.trim() : ""
    const author_city =
      typeof body.author_city === "string" ? body.author_city.trim() : ""
    const title = typeof body.title === "string" ? body.title.trim() : ""
    const product_id =
      typeof body.product_id === "string" && body.product_id.trim()
        ? body.product_id.trim()
        : null
    const ratingNum = Number(body.rating)

    // ── Validation (reject rather than silently coerce) ──────────────────────
    const errors: string[] = []
    if (author_name.length < 2 || author_name.length > 120) {
      errors.push("الاسم مطلوب (بين 2 و120 حرفًا)")
    }
    if (text.length < 3 || text.length > 2000) {
      errors.push("نص المراجعة مطلوب (بين 3 و2000 حرف)")
    }
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      errors.push("التقييم يجب أن يكون رقمًا صحيحًا بين 1 و5")
    }
    if (author_city.length > 80) {
      errors.push("اسم المدينة طويل جدًا")
    }
    if (title.length > 140) {
      errors.push("العنوان طويل جدًا")
    }

    if (errors.length > 0) {
      res.status(400).json({ ok: false, errors })
      return
    }

    const reviewsService: ReviewsModuleService = req.scope.resolve(REVIEWS_MODULE)

    const created = await reviewsService.submitReview({
      rating: ratingNum,
      body: text,
      author_name,
      author_city: author_city || null,
      title: title || null,
      product_id,
      // order_id is intentionally NOT taken from the client (anti-spoofing).
      order_id: null,
    })

    res.status(201).json({
      ok: true,
      id: (created as any)?.id ?? null,
      status: "pending",
      message: "تم استلام مراجعتك وستظهر بعد مراجعتها من قبل الفريق. شكرًا لك!",
    })
  } catch (error) {
    console.error("Error submitting review:", error)
    res.status(500).json({ ok: false, error: "Failed to submit review" })
  }
}

/** Public projection of a review row (no moderation internals leaked). */
function serializeReview(r: any) {
  return {
    id: r.id,
    rating: Number(r.rating) || 0,
    title: r.title ?? null,
    comment: r.body,
    name: r.author_name,
    city: r.author_city ?? null,
    product_id: r.product_id ?? null,
    is_verified: Boolean(r.order_id),
    created_at: r.created_at,
  }
}
