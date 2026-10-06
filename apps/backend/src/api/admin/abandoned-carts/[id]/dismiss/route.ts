import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { handleServiceError } from "../../../../utils/errors"
import { ABANDONED_CART_MODULE } from "../../../../../modules/abandoned-cart"
import type AbandonedCartModuleService from "../../../../../modules/abandoned-cart/service"

/**
 * POST /admin/abandoned-carts/:id/dismiss
 *
 * Toggle the `dismissed` flag on a cart so the scheduled job stops (or resumes)
 * sending it automatic reminders. Body: `{ dismissed?: boolean }` (defaults to
 * true). Gated by `abandoned_carts:update` via the RBAC middleware.
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const { id } = req.params
    const svc = req.scope.resolve<AbandonedCartModuleService>(
      ABANDONED_CART_MODULE
    )

    const body = (req.body ?? {}) as { dismissed?: boolean }
    const dismissed = body.dismissed !== false // default true

    const record = await svc.setDismissed(id, dismissed)

    res.status(200).json({ success: true, dismissed, record })
  } catch (error) {
    handleServiceError(error, res)
  }
}
