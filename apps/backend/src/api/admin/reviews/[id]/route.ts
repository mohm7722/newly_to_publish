import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { handleServiceError } from "../../../utils/errors"
import { REVIEWS_MODULE } from "../../../../modules/reviews"
import type ReviewsModuleService from "../../../../modules/reviews/service"
import { REVIEW_STATUSES, type ReviewStatus } from "../../../../modules/reviews/service"

/**
 * POST /admin/reviews/:id
 *
 * Update a review's moderation state and/or featured flag.
 * Body: `{ status?: "pending"|"approved"|"rejected", is_featured?: boolean }`.
 * At least one field must be present. Gated by `reviews:update`.
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const { id } = req.params
    const svc = req.scope.resolve<ReviewsModuleService>(REVIEWS_MODULE)
    const body = (req.body ?? {}) as {
      status?: unknown
      is_featured?: unknown
    }

    const update: { id: string; status?: ReviewStatus; is_featured?: boolean } = {
      id,
    }

    if (body.status !== undefined) {
      if (
        typeof body.status !== "string" ||
        !(REVIEW_STATUSES as string[]).includes(body.status)
      ) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "الحالة غير صالحة (pending | approved | rejected)"
        )
      }
      update.status = body.status as ReviewStatus
    }

    if (body.is_featured !== undefined) {
      if (typeof body.is_featured !== "boolean") {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "قيمة التمييز يجب أن تكون منطقية (true/false)"
        )
      }
      update.is_featured = body.is_featured
    }

    if (update.status === undefined && update.is_featured === undefined) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "لا يوجد تغيير: أرسِل status و/أو is_featured"
      )
    }

    const updated = await svc.updateProductReviews(update)
    const row = Array.isArray(updated) ? updated[0] : updated

    res.status(200).json({ success: true, review: row })
  } catch (error) {
    handleServiceError(error, res)
  }
}

/**
 * DELETE /admin/reviews/:id
 *
 * Soft-delete a review (hidden everywhere; recoverable at the DB level).
 * Gated by `reviews:delete`.
 */
export async function DELETE(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const { id } = req.params
    const svc = req.scope.resolve<ReviewsModuleService>(REVIEWS_MODULE)

    await svc.softDeleteProductReviews(id)

    res.status(200).json({ success: true, id, deleted: true })
  } catch (error) {
    handleServiceError(error, res)
  }
}
