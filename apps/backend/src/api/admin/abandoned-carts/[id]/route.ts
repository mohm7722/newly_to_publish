import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { nocache } from "../../../utils/nocache"
import { handleServiceError } from "../../../utils/errors"
import { toNum } from "../../../../lib/reports/shared"
import { ABANDONED_CART_MODULE } from "../../../../modules/abandoned-cart"
import type AbandonedCartModuleService from "../../../../modules/abandoned-cart/service"

/**
 * GET /admin/abandoned-carts/:id
 *
 * Detail view of a single abandoned cart (by cart id): customer email, line
 * items, computed totals, and the reminder tracking state. Gated by
 * `abandoned_carts:read` via the RBAC middleware.
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const { id } = req.params
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const svc = req.scope.resolve<AbandonedCartModuleService>(
      ABANDONED_CART_MODULE
    )

    const {
      data: [cart],
    } = await query.graph({
      entity: "cart",
      fields: [
        "id",
        "email",
        "currency_code",
        "created_at",
        "updated_at",
        "completed_at",
        "customer.id",
        "customer.first_name",
        "customer.last_name",
        "items.id",
        "items.title",
        "items.quantity",
        "items.unit_price",
        "items.thumbnail",
        "items.product_title",
        "items.variant_title",
      ],
      filters: { id },
    })

    if (!cart) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, `Cart ${id} not found`)
    }

    const record = await svc.getByCartId(id)

    const items = Array.isArray(cart.items) ? cart.items : []
    const itemCount = items.reduce(
      (s: number, i: any) => s + (toNum(i.quantity) || 0),
      0
    )
    const total = items.reduce(
      (s: number, i: any) => s + toNum(i.unit_price) * (toNum(i.quantity) || 1),
      0
    )

    nocache(res)
    res.status(200).json({
      cart: {
        cart_id: cart.id,
        email: cart.email ?? null,
        currency_code: (cart.currency_code ?? "").toUpperCase() || null,
        completed: Boolean(cart.completed_at),
        created_at: cart.created_at ?? null,
        updated_at: cart.updated_at ?? null,
        customer: cart.customer
          ? {
              id: cart.customer.id,
              first_name: cart.customer.first_name ?? null,
              last_name: cart.customer.last_name ?? null,
            }
          : null,
        item_count: itemCount,
        total,
        items: items.map((i: any) => ({
          id: i.id,
          title: i.title ?? i.product_title ?? null,
          variant_title: i.variant_title ?? null,
          quantity: toNum(i.quantity),
          unit_price: toNum(i.unit_price),
          thumbnail: i.thumbnail ?? null,
        })),
        reminder: record
          ? {
              reminder_count: Number(record.reminder_count) || 0,
              last_reminder_at: record.last_reminder_at ?? null,
              recovered: Boolean(record.recovered),
              dismissed: Boolean(record.dismissed),
              created_at: record.created_at ?? null,
            }
          : null,
      },
    })
  } catch (error) {
    handleServiceError(error, res)
  }
}
