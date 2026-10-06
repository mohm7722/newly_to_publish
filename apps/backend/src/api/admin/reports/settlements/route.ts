import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { nocache } from "../../../utils/nocache"
import { requirePermission } from "../../../utils/rbac"
import { handleServiceError } from "../../../utils/errors"
import { toNum, buildCreatedAtFilter, strParam } from "../../../../lib/reports/shared"
import { SETTLEMENT_MODULE } from "../../../../modules/settlement"
import type SettlementModuleService from "../../../../modules/settlement/service"

/**
 * GET /admin/reports/settlements
 *
 * Per-order currency settlements: base currency (SAR) vs the selected
 * settlement currency, the applied FX rate, and the converted totals. Includes
 * per-settlement-currency totals.
 *
 * Filters: `date_from`, `date_to`, `currency_code` (settlement currency).
 * Gated by `settlements:read`.
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  if (!requirePermission(req, res, "settlements:read")) {
    return
  }

  try {
    const q = req.query as Record<string, string | undefined>
    const settlementSvc =
      req.scope.resolve<SettlementModuleService>(SETTLEMENT_MODULE)

    const filters: Record<string, unknown> = {}
    const created = buildCreatedAtFilter(q.date_from, q.date_to)
    if (created) filters.created_at = created
    if (strParam(q.currency_code)) {
      filters.currency_code = strParam(q.currency_code)
    }

    const settlements = (await settlementSvc.listOrderSettlements(filters, {
      take: 5000,
      order: { created_at: "DESC" },
    })) as Array<Record<string, any>>

    // Resolve order display ids in one batch.
    const orderIds = settlements
      .map((s) => s.order_id)
      .filter((id): id is string => typeof id === "string")
    const displayById = new Map<string, number>()
    if (orderIds.length > 0) {
      const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
      const { data: orders } = await query.graph({
        entity: "order",
        filters: { id: orderIds },
        fields: ["id", "display_id"],
      })
      for (const o of orders ?? []) {
        displayById.set((o as any).id, (o as any).display_id)
      }
    }

    const totalsByCurrency = new Map<string, number>()
    const rows = settlements.map((s) => {
      const currency = (s.currency_code ?? "").toUpperCase()
      const total = toNum(s.total)
      totalsByCurrency.set(currency, (totalsByCurrency.get(currency) ?? 0) + total)
      return {
        order_id: s.order_id,
        display_id: displayById.get(s.order_id) ?? null,
        base_currency_code: (s.base_currency_code ?? "SAR").toUpperCase(),
        currency_code: currency,
        rate: toNum(s.rate),
        subtotal: toNum(s.subtotal),
        shipping: toNum(s.shipping),
        tax: toNum(s.tax),
        discount: toNum(s.discount),
        total,
        created_at: s.created_at ?? null,
      }
    })

    nocache(res)
    res.status(200).json({
      rows,
      count: rows.length,
      totals: { value_by_currency: Object.fromEntries(totalsByCurrency) },
    })
  } catch (error) {
    handleServiceError(error, res)
  }
}
