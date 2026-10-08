import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { nocache } from "../../utils/nocache"
import { handleServiceError } from "../../utils/errors"
import { REVIEWS_MODULE } from "../../../modules/reviews"
import type ReviewsModuleService from "../../../modules/reviews/service"
import { REVIEW_STATUSES, type ReviewStatus } from "../../../modules/reviews/service"

/**
 * GET /admin/reviews
 *
 * Moderation list of customer reviews (any status), newest first. Query:
 *   - `status`     → filter by `pending` | `approved` | `rejected`
 *   - `product_id` → filter to a product's reviews
 *   - `limit` / `offset` → pagination (defaults 50 / 0)
 *
 * Gated by `reviews:read` via the RBAC middleware (segment-mapped resource).
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const svc = req.scope.resolve<ReviewsModuleService>(REVIEWS_MODULE)
    const q = req.query as Record<string, string | undefined>

    const status =
      q.status && (REVIEW_STATUSES as string[]).includes(q.status)
        ? (q.status as ReviewStatus)
        : undefined
    const product_id = q.product_id?.trim() || undefined
    const limit = Number(q.limit)
    const offset = Number(q.offset)

    const { rows, count } = await svc.adminList({
      status,
      product_id,
      limit: Number.isFinite(limit) ? limit : undefined,
      offset: Number.isFinite(offset) ? offset : undefined,
    })

    nocache(res)
    res.status(200).json({
      reviews: rows.map((r: any) => ({
        id: r.id,
        rating: Number(r.rating) || 0,
        title: r.title ?? null,
        body: r.body,
        author_name: r.author_name,
        author_city: r.author_city ?? null,
        product_id: r.product_id ?? null,
        is_verified: Boolean(r.order_id),
        status: r.status,
        is_featured: Boolean(r.is_featured),
        created_at: r.created_at,
      })),
      count,
    })
  } catch (error) {
    handleServiceError(error, res)
  }
}
