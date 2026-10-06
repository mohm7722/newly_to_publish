import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { nocache } from "../../utils/nocache"
import { handleServiceError } from "../../utils/errors"
import { toNum, strParam } from "../../../lib/reports/shared"
import { ABANDONED_CART_MODULE } from "../../../modules/abandoned-cart"
import type AbandonedCartModuleService from "../../../modules/abandoned-cart/service"

/**
 * GET /admin/abandoned-carts
 *
 * Management list of currently-abandoned carts: carts that still have items,
 * have not completed into an order, and have been idle past the configured
 * threshold (within the max-age window). Each row is joined with its reminder
 * tracking state (reminder count, last reminder, recovered, dismissed).
 *
 * Query filters: `status` (reminded | not_reminded | dismissed),
 * `has_email` (yes | no). Gated by `abandoned_carts:read` via the RBAC
 * middleware (segment-mapped resource).
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const svc = req.scope.resolve<AbandonedCartModuleService>(
      ABANDONED_CART_MODULE
    )

    const q = req.query as Record<string, string | undefined>

    const idleMinutes = Number(process.env.ABANDONED_CART_IDLE_MINUTES || 60)
    const maxAgeHours = Number(process.env.ABANDONED_CART_MAX_AGE_HOURS || 168)
    const now = Date.now()
    const idleBefore = new Date(now - idleMinutes * 60 * 1000)
    const oldestAllowed = new Date(now - maxAgeHours * 60 * 60 * 1000)

    const { data: carts } = await query.graph({
      entity: "cart",
      fields: [
        "id",
        "email",
        "currency_code",
        "created_at",
        "updated_at",
        "completed_at",
        "items.id",
        "items.title",
        "items.quantity",
        "items.unit_price",
        "items.thumbnail",
      ],
      filters: {
        completed_at: null,
        updated_at: { $lt: idleBefore, $gt: oldestAllowed },
      },
      pagination: { take: 500, skip: 0 },
    })

    const withItems = (carts ?? []).filter(
      (c: any) => Array.isArray(c.items) && c.items.length > 0
    )

    const cartIds = withItems.map((c: any) => c.id)
    const records = cartIds.length
      ? await svc.listAbandonedCartReminders({ cart_id: cartIds })
      : []
    const recByCart = new Map(records.map((r: any) => [r.cart_id, r]))

    let rows = withItems.map((c: any) => {
      const rec = recByCart.get(c.id)
      const itemCount = c.items.reduce(
        (s: number, i: any) => s + (toNum(i.quantity) || 0),
        0
      )
      const total = c.items.reduce(
        (s: number, i: any) => s + toNum(i.unit_price) * (toNum(i.quantity) || 1),
        0
      )
      return {
        cart_id: c.id,
        email: c.email ?? null,
        currency_code: (c.currency_code ?? "").toUpperCase() || null,
        item_count: itemCount,
        total,
        updated_at: c.updated_at ?? null,
        created_at: c.created_at ?? null,
        reminder_count: rec ? Number(rec.reminder_count) || 0 : 0,
        last_reminder_at: rec?.last_reminder_at ?? null,
        recovered: rec ? Boolean(rec.recovered) : false,
        dismissed: rec ? Boolean(rec.dismissed) : false,
      }
    })

    const status = strParam(q.status)
    if (status === "reminded") rows = rows.filter((r) => r.reminder_count > 0)
    else if (status === "not_reminded")
      rows = rows.filter((r) => r.reminder_count === 0)
    else if (status === "dismissed") rows = rows.filter((r) => r.dismissed)

    const hasEmail = strParam(q.has_email)
    if (hasEmail === "yes") rows = rows.filter((r) => !!r.email)
    else if (hasEmail === "no") rows = rows.filter((r) => !r.email)

    rows.sort(
      (a, b) =>
        new Date(b.updated_at || 0).getTime() -
        new Date(a.updated_at || 0).getTime()
    )

    nocache(res)
    res.status(200).json({ carts: rows, count: rows.length })
  } catch (error) {
    handleServiceError(error, res)
  }
}
