import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  SETTLEMENT_MODULE,
  type SettlementModuleService,
} from "../../../../../modules/settlement"
import { accessibleOrder } from "../../../../utils/manual-transfer"

/**
 * Store order settlement route (Requirements 8.2, 8.3).
 *
 *  - `GET /store/orders/:id/settlement` → read the committed settlement row.
 *  - `OPTIONS /store/orders/:id/settlement` → CORS preflight support.
 *
 * `/store/*` is gated by the framework's publishable-key + CORS middleware. On
 * top of that, the read is restricted to whoever may access the order: an order
 * owned by a registered customer requires that customer's session, while a
 * guest order (placed without an account) is readable by the holder of the
 * order id. Anything else gets `404`, so order ids cannot be probed.
 *
 * For the owner, the response mirrors the Old Store shape for behavior parity
 * (Requirement 8.4): a found settlement is returned as `{ ok: true, ...settlement }`,
 * and a missing settlement returns `{ ok: false, message, order_id }` with a
 * `200` status. Only the `order_settlement` table is read; core order totals
 * are never mutated.
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
    if (!(await accessibleOrder(req, orderId))) {
      res.status(404).json({ ok: false, message: "order not found" })
      return
    }

    const settlementService =
      req.scope.resolve<SettlementModuleService>(SETTLEMENT_MODULE)

    const settlement = await settlementService.getSettlement(orderId)

    if (!settlement) {
      res.status(200).json({
        ok: false,
        message: "no settlement found",
        order_id: orderId,
      })
      return
    }

    res.status(200).json({
      ok: true,
      order_id: settlement.order_id,
      currency_code: settlement.currency_code,
      base_currency_code: settlement.base_currency_code,
      rate: settlement.rate,
      subtotal: settlement.subtotal,
      shipping: settlement.shipping,
      tax: settlement.tax,
      discount: settlement.discount,
      total: settlement.total,
      snapshot_json: settlement.snapshot_json,
      created_at: settlement.created_at,
    })
  } catch (error) {
    res.status(500).json({ ok: false, message: "failed to get settlement" })
  }
}

/**
 * CORS preflight handler. The framework's `/store/*` CORS middleware sets the
 * appropriate `Access-Control-*` headers; this handler simply acknowledges the
 * preflight with a `200` so browsers proceed with the actual request.
 */
export async function OPTIONS(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  res.status(200).end()
}
