import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { nocache } from "../../../utils/nocache"
import { requirePermission } from "../../../utils/rbac"
import { handleServiceError } from "../../../utils/errors"
import { toNum, buildCreatedAtFilter } from "../../../../lib/reports/shared"

/**
 * GET /admin/reports/tax
 *
 * Collected tax grouped by order currency: order count, taxable subtotal, and
 * tax total per currency.
 *
 * Filters: `date_from`, `date_to`. Gated by `orders:read`.
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  if (!requirePermission(req, res, "orders:read")) {
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
        "tax_total",
        "items.*",
      ],
      pagination: { take: 5000, skip: 0, order: { created_at: "DESC" } },
    })

    type Bucket = {
      currency: string
      orders: number
      taxable_subtotal: number
      tax_total: number
    }
    const buckets = new Map<string, Bucket>()

    for (const o of orders ?? []) {
      const order = o as any
      if (order.status === "canceled") continue
      const currency = (order.currency_code ?? "—").toUpperCase()
      let b = buckets.get(currency)
      if (!b) {
        b = { currency, orders: 0, taxable_subtotal: 0, tax_total: 0 }
        buckets.set(currency, b)
      }
      b.orders += 1
      b.taxable_subtotal += toNum(order.item_total)
      b.tax_total += toNum(order.tax_total)
    }

    const rows = Array.from(buckets.values()).sort(
      (a, b) => b.tax_total - a.tax_total
    )

    nocache(res)
    res.status(200).json({ rows, count: rows.length })
  } catch (error) {
    handleServiceError(error, res)
  }
}
