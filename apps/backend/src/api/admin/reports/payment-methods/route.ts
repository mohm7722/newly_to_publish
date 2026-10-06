import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { nocache } from "../../../utils/nocache"
import { requirePermission } from "../../../utils/rbac"
import { handleServiceError } from "../../../utils/errors"
import {
  toNum,
  buildCreatedAtFilter,
  strParam,
  classifyPaymentMethod,
  PAYMENT_METHOD_LABEL,
  type PaymentMethod,
} from "../../../../lib/reports/shared"

/**
 * GET /admin/reports/payment-methods
 *
 * Distribution of orders by payment method (COD / bank transfer / other):
 * order count, share, and value broken down per currency.
 *
 * Filters: `date_from`, `date_to`, `currency_code`. Gated by `payments:read`.
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  if (!requirePermission(req, res, "payments:read")) {
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
        "currency_code",
        "total",
        "payment_collections.payments.provider_id",
        "items.*",
      ],
      pagination: { take: 5000, skip: 0, order: { created_at: "DESC" } },
    })

    type Bucket = {
      method: PaymentMethod
      orders: number
      value_by_currency: Map<string, number>
    }
    const buckets = new Map<PaymentMethod, Bucket>()
    const bucketFor = (m: PaymentMethod): Bucket => {
      let b = buckets.get(m)
      if (!b) {
        b = { method: m, orders: 0, value_by_currency: new Map() }
        buckets.set(m, b)
      }
      return b
    }

    let totalOrders = 0
    for (const o of orders ?? []) {
      const order = o as any
      if (order.status === "canceled") continue
      const provider = order.payment_collections?.[0]?.payments?.[0]?.provider_id
      const method = classifyPaymentMethod(provider)
      const currency = (order.currency_code ?? "").toUpperCase()
      const b = bucketFor(method)
      b.orders += 1
      totalOrders += 1
      if (currency) {
        b.value_by_currency.set(
          currency,
          (b.value_by_currency.get(currency) ?? 0) + toNum(order.total)
        )
      }
    }

    const rows = Array.from(buckets.values())
      .map((b) => ({
        method: b.method,
        method_label: PAYMENT_METHOD_LABEL[b.method],
        orders: b.orders,
        share: totalOrders > 0 ? Math.round((b.orders / totalOrders) * 1000) / 10 : 0,
        value_by_currency: Object.fromEntries(b.value_by_currency),
      }))
      .sort((a, b) => b.orders - a.orders)

    nocache(res)
    res.status(200).json({ rows, count: rows.length, total_orders: totalOrders })
  } catch (error) {
    handleServiceError(error, res)
  }
}
