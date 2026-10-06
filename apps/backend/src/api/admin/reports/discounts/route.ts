import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { nocache } from "../../../utils/nocache"
import { requirePermission } from "../../../utils/rbac"
import { handleServiceError } from "../../../utils/errors"
import { toNum, buildCreatedAtFilter, strParam } from "../../../../lib/reports/shared"

/**
 * GET /admin/reports/discounts
 *
 * Orders that carried a discount: the discounted order, its discount amount and
 * grand total, plus per-currency discount totals.
 *
 * Filters: `date_from`, `date_to`, `currency_code`. Gated by `orders:read`.
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
        "display_id",
        "status",
        "currency_code",
        "created_at",
        "discount_total",
        "total",
        "items.*",
      ],
      pagination: { take: 5000, skip: 0, order: { created_at: "DESC" } },
    })

    const totalsByCurrency = new Map<string, number>()
    const rows = (orders ?? [])
      .filter((o: any) => o.status !== "canceled" && toNum(o.discount_total) > 0)
      .map((o: any) => {
        const currency = (o.currency_code ?? "").toUpperCase()
        const discount = toNum(o.discount_total)
        totalsByCurrency.set(
          currency,
          (totalsByCurrency.get(currency) ?? 0) + discount
        )
        return {
          display_id: o.display_id,
          created_at: o.created_at,
          currency_code: currency,
          discount_total: discount,
          total: toNum(o.total),
        }
      })

    nocache(res)
    res.status(200).json({
      rows,
      count: rows.length,
      totals: { discount_by_currency: Object.fromEntries(totalsByCurrency) },
    })
  } catch (error) {
    handleServiceError(error, res)
  }
}
