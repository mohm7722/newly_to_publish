import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { nocache } from "../../../utils/nocache"
import { requirePermission } from "../../../utils/rbac"
import { handleServiceError } from "../../../utils/errors"
import { toNum, buildCreatedAtFilter } from "../../../../lib/reports/shared"

/**
 * GET /admin/reports/daily-activity
 *
 * Daily order activity: per calendar day, the order count, the canceled count,
 * and revenue per currency.
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
        "total",
        "created_at",
        "items.*",
      ],
      pagination: { take: 5000, skip: 0, order: { created_at: "DESC" } },
    })

    type Bucket = {
      day: string
      orders: number
      canceled: number
      value_by_currency: Map<string, number>
    }
    const buckets = new Map<string, Bucket>()

    for (const o of orders ?? []) {
      const order = o as any
      const day = order.created_at
        ? new Date(order.created_at).toISOString().slice(0, 10)
        : "—"
      let b = buckets.get(day)
      if (!b) {
        b = { day, orders: 0, canceled: 0, value_by_currency: new Map() }
        buckets.set(day, b)
      }
      b.orders += 1
      if (order.status === "canceled") {
        b.canceled += 1
        continue
      }
      const currency = (order.currency_code ?? "").toUpperCase()
      if (currency) {
        b.value_by_currency.set(
          currency,
          (b.value_by_currency.get(currency) ?? 0) + toNum(order.total)
        )
      }
    }

    const rows = Array.from(buckets.values())
      .map((b) => ({
        day: b.day,
        orders: b.orders,
        canceled: b.canceled,
        value_by_currency: Object.fromEntries(b.value_by_currency),
      }))
      .sort((a, b) => (a.day < b.day ? 1 : -1))

    nocache(res)
    res.status(200).json({ rows, count: rows.length })
  } catch (error) {
    handleServiceError(error, res)
  }
}
