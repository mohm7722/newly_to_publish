import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import {
  SETTLEMENT_MODULE,
  type SettlementModuleService,
} from "../../../../modules/settlement"

/**
 * GET /admin/orders/settlement-bulk
 *
 * Bulk-reads settlement rows for the order ids supplied via the comma-separated
 * `ids` query parameter and returns the found `items` together with the
 * `missing` ids that have no settlement row (Requirements 3.1, 8.1, 8.3). The
 * route only reads the `order_settlement` table through the Settlement module
 * service; it never mutates core order totals.
 *
 * Authenticated-admin access is enforced by the framework for all `/admin/*`
 * routes (Requirement 8.6); no additional gate is required here.
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { ids } = (req.query as { ids?: string }) || {}

  if (!ids) {
    res.status(400).json({ ok: false, message: "ids required" })
    return
  }

  const orderIds = (ids as string).split(",").filter(Boolean)

  if (orderIds.length === 0) {
    res
      .status(400)
      .json({ ok: false, message: "at least one order id required" })
    return
  }

  try {
    const settlementService =
      req.scope.resolve<SettlementModuleService>(SETTLEMENT_MODULE)

    const { items, missing } = await settlementService.getMany(orderIds)

    res.status(200).json({ ok: true, items, missing })
  } catch (error) {
    res
      .status(500)
      .json({ ok: false, message: "failed to retrieve settlement data" })
  }
}
