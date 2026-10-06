import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  SETTLEMENT_MODULE,
  type SettlementModuleService,
} from "../../../../../modules/settlement"
import { toNum } from "../../../../../lib/reports/shared"

/**
 * GET /admin/orders/:id/settlement
 *
 * Reads the settlement row for a single core order (Requirements 3.1, 8.1,
 * 8.3). Returns the stored settlement fields when one has been committed, or a
 * `404` when no settlement exists for the order. Only the `order_settlement`
 * table is read; core order totals are never mutated.
 *
 * Authenticated-admin access is enforced by the framework for all `/admin/*`
 * routes (Requirement 8.6).
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const orderId = req.params.id

  if (!orderId) {
    res.status(400).json({ ok: false, message: "order id required" })
    return
  }

  try {
    const settlementService =
      req.scope.resolve<SettlementModuleService>(SETTLEMENT_MODULE)

    const settlement = await settlementService.getSettlement(orderId)

    if (!settlement) {
      res.status(404).json({ ok: false, message: "no settlement" })
      return
    }

    res.status(200).json({
      ok: true,
      order_id: settlement.order_id,
      currency_code: settlement.currency_code,
      base_currency_code: settlement.base_currency_code,
      rate: toNum(settlement.rate),
      subtotal: toNum(settlement.subtotal),
      shipping: toNum(settlement.shipping),
      tax: toNum(settlement.tax),
      discount: toNum(settlement.discount),
      total: toNum(settlement.total),
      snapshot_json: settlement.snapshot_json,
      created_at: settlement.created_at,
    })
  } catch (error) {
    res
      .status(500)
      .json({ ok: false, message: "failed to retrieve settlement data" })
  }
}
