import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { nocache } from "../../../utils/nocache"
import { requirePermission } from "../../../utils/rbac"
import { handleServiceError } from "../../../utils/errors"
import { toNum, buildCreatedAtFilter } from "../../../../lib/reports/shared"

/**
 * GET /admin/reports/revenue-by-currency
 *
 * Revenue grouped by the order currency: order count and summed totals
 * (subtotal, shipping, tax, discount, grand total).
 *
 * Filters: `date_from`, `date_to`. Gated by `settlements:read`.
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  if (!requirePermission(req, res, "settlements:read")) {
    return
  }

  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const q = req.query as Record<string, string | undefined>

    const filters: Record<string, unknown> = {}
    const created = buildCreatedAtFilter(q.date_from, q.date_to)
    if (created) filters.created_at = created

    const { data: orders } = await query.graph({
      entity: "order",
      filters,
      fields: [
        "id",
        "status",
        "currency_code",
        "item_total",
        "shipping_total",
        "tax_total",
        "discount_total",
        "total",
        "items.*",
      ],
      pagination: { take: 5000, skip: 0, order: { created_at: "DESC" } },
    })

    type Bucket = {
      currency: string
      orders: number
      subtotal: number
      shipping: number
      tax: number
      discount: number
      total: number
    }
    const buckets = new Map<string, Bucket>()

    for (const o of orders ?? []) {
      const order = o as any
      if (order.status === "canceled") continue
      const currency = (order.currency_code ?? "—").toUpperCase()
      let b = buckets.get(currency)
      if (!b) {
        b = {
          currency,
          orders: 0,
          subtotal: 0,
          shipping: 0,
          tax: 0,
          discount: 0,
          total: 0,
        }
        buckets.set(currency, b)
      }
      b.orders += 1
      b.subtotal += toNum(order.item_total)
      b.shipping += toNum(order.shipping_total)
      b.tax += toNum(order.tax_total)
      b.discount += toNum(order.discount_total)
      b.total += toNum(order.total)
    }

    const rows = Array.from(buckets.values()).sort((a, b) => b.total - a.total)

    nocache(res)
    res.status(200).json({ rows, count: rows.length })
  } catch (error) {
    handleServiceError(error, res)
  }
}
