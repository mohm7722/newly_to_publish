import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { handleServiceError } from "../../../../utils/errors"
import { sendAbandonedCartReminderWorkflow } from "../../../../../workflows/abandoned-cart/send-abandoned-cart-reminder"

/**
 * POST /admin/abandoned-carts/:id/remind
 *
 * Manually trigger an abandoned-cart reminder for the given cart, bypassing the
 * scheduled job's cooldown (but the workflow still validates eligibility: the
 * cart must have an email, still have items, and not be completed). Gated by
 * `abandoned_carts:update` via the RBAC middleware.
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const { id } = req.params
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

    // Validate the cart is eligible before running the workflow, so the admin
    // gets a clear error instead of a silent no-op.
    const {
      data: [cart],
    } = await query.graph({
      entity: "cart",
      fields: ["id", "email", "completed_at", "items.id"],
      filters: { id },
    })

    if (!cart) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, `Cart ${id} not found`)
    }
    if (cart.completed_at) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "لا يمكن إرسال تذكير لسلة مكتملة."
      )
    }
    if (!cart.email) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "لا يوجد بريد إلكتروني لهذه السلة، تعذّر إرسال التذكير."
      )
    }
    if (!Array.isArray(cart.items) || cart.items.length === 0) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "السلة فارغة، لا يوجد ما يُذكَّر به."
      )
    }

    const { result } = await sendAbandonedCartReminderWorkflow(req.scope).run({
      input: { cart_id: id },
    })

    res.status(200).json({ success: true, result })
  } catch (error) {
    handleServiceError(error, res)
  }
}
