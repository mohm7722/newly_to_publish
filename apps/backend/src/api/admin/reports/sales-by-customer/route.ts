import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { nocache } from "../../../utils/nocache"
import { requirePermission } from "../../../utils/rbac"
import { handleServiceError } from "../../../utils/errors"
import {
  toNum,
  buildCreatedAtFilter,
  strParam,
  fullName,
} from "../../../../lib/reports/shared"

/**
 * GET /admin/reports/sales-by-customer
 *
 * Sales aggregated per customer: order count, value per currency, and the most
 * recent order date.
 *
 * Filters: `date_from`, `date_to`, `currency_code`, `customer` (name/email
 * contains). Gated by `orders:read`.
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
    if (strParam(q.currency_code)) filters.currency_code = strParam(q.currency_code)

    const { data: orders } = await query.graph({
      entity: "order",
      filters,
      fields: [
        "id",
        "status",
        "email",
        "currency_code",
        "total",
        "created_at",
        "customer.id",
        "customer.first_name",
        "customer.last_name",
        "customer.email",
        "items.*",
      ],
      pagination: { take: 5000, skip: 0, order: { created_at: "DESC" } },
    })

    type Bucket = {
      key: string
      name: string
      email: string | null
      orders: number
      value_by_currency: Map<string, number>
      last_order: string | null
    }
    const buckets = new Map<string, Bucket>()

    for (const o of orders ?? []) {
      const order = o as any
      if (order.status === "canceled") continue
      const email = order.customer?.email ?? order.email ?? null
      const key = order.customer?.id ?? email ?? "—"
      const currency = (order.currency_code ?? "").toUpperCase()

      let b = buckets.get(key)
      if (!b) {
        b = {
          key,
          name: fullName(order.customer?.first_name, order.customer?.last_name),
          email,
          orders: 0,
          value_by_currency: new Map(),
          last_order: null,
        }
        buckets.set(key, b)
      }
      b.orders += 1
      if (currency) {
        b.value_by_currency.set(
          currency,
          (b.value_by_currency.get(currency) ?? 0) + toNum(order.total)
        )
      }
      if (!b.last_order || new Date(order.created_at) > new Date(b.last_order)) {
        b.last_order = order.created_at
      }
    }

    const search = strParam(q.customer)?.toLowerCase()

    const rows = Array.from(buckets.values())
      .map((b) => ({
        customer_name: b.name,
        email: b.email,
        orders: b.orders,
        value_by_currency: Object.fromEntries(b.value_by_currency),
        last_order: b.last_order,
      }))
      .filter((r) =>
        search
          ? `${r.customer_name} ${r.email ?? ""}`.toLowerCase().includes(search)
          : true
      )
      .sort((a, b) => b.orders - a.orders)

    nocache(res)
    res.status(200).json({ rows, count: rows.length })
  } catch (error) {
    handleServiceError(error, res)
  }
}
