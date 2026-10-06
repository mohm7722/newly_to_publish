import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { nocache } from "../../../utils/nocache"
import { requirePermission } from "../../../utils/rbac"
import { handleServiceError } from "../../../utils/errors"
import { toNum, buildCreatedAtFilter, strParam } from "../../../../lib/reports/shared"

/**
 * GET /admin/reports/shipping
 *
 * Shipping revenue grouped by destination city: order count and collected
 * shipping fees per currency.
 *
 * Filters: `date_from`, `date_to`, `province`. Gated by `orders:read`.
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
        "shipping_total",
        "shipping_address.city",
        "shipping_address.province",
        "items.*",
      ],
      pagination: { take: 5000, skip: 0, order: { created_at: "DESC" } },
    })

    const provinceFilter = strParam(q.province)?.toLowerCase()

    type Bucket = {
      city: string
      province: string
      orders: number
      value_by_currency: Map<string, number>
    }
    const buckets = new Map<string, Bucket>()

    for (const o of orders ?? []) {
      const order = o as any
      if (order.status === "canceled") continue
      const city = order.shipping_address?.city ?? "بدون مدينة"
      const province = order.shipping_address?.province ?? "—"
      if (provinceFilter && province.toLowerCase() !== provinceFilter) continue
      const currency = (order.currency_code ?? "").toUpperCase()
      const key = `${city}|${province}`.toLowerCase()

      let b = buckets.get(key)
      if (!b) {
        b = { city, province, orders: 0, value_by_currency: new Map() }
        buckets.set(key, b)
      }
      b.orders += 1
      if (currency) {
        b.value_by_currency.set(
          currency,
          (b.value_by_currency.get(currency) ?? 0) + toNum(order.shipping_total)
        )
      }
    }

    const rows = Array.from(buckets.values())
      .map((b) => ({
        city: b.city,
        province: b.province,
        orders: b.orders,
        value_by_currency: Object.fromEntries(b.value_by_currency),
      }))
      .sort((a, b) => b.orders - a.orders)

    nocache(res)
    res.status(200).json({ rows, count: rows.length })
  } catch (error) {
    handleServiceError(error, res)
  }
}
