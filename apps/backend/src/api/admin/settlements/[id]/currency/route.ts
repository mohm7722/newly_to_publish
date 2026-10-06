import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

import {
  SETTLEMENT_MODULE,
  type SettlementModuleService,
} from "../../../../../modules/settlement"

interface CurrencyUpdateRequest {
  currency_code: string
  rate: number
  reason: string
}

/**
 * PUT /admin/settlements/:id/currency
 *
 * Recomputes an existing settlement into a new currency / rate while preserving
 * the order's base-currency (`SAR`) amounts (Requirements 3.1, 8.1, 8.3).
 *
 * Requirement 9.3: the Old Store implemented this route with a raw `pg` client
 * and direct SQL. That is replaced entirely here with a single call to the
 * Settlement module service (`updateSettlementCurrency`) — no raw `pg` client,
 * no direct SQL. The service rejects unsupported currencies / invalid rates
 * (`INVALID_DATA` → `400`) and a missing settlement (`NOT_FOUND` → `404`).
 *
 * Authenticated-admin access is enforced by the framework for all `/admin/*`
 * routes (Requirement 8.6).
 */
export async function PUT(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id } = req.params
  const { currency_code, rate, reason } =
    (req.body as CurrencyUpdateRequest) || ({} as CurrencyUpdateRequest)

  if (!currency_code || !rate || !reason) {
    res.status(400).json({
      error: "Missing required fields: currency_code, rate, reason",
    })
    return
  }

  try {
    const settlementService =
      req.scope.resolve<SettlementModuleService>(SETTLEMENT_MODULE)

    const settlement = await settlementService.updateSettlementCurrency(id, {
      currency_code,
      rate,
      reason,
    })

    res.status(200).json({
      success: true,
      message: `Currency updated to ${currency_code}`,
      settlement,
    })
  } catch (error) {
    if (error instanceof MedusaError) {
      if (error.type === MedusaError.Types.NOT_FOUND) {
        res.status(404).json({ error: "Settlement not found for this order" })
        return
      }
      if (error.type === MedusaError.Types.INVALID_DATA) {
        res.status(400).json({ error: error.message })
        return
      }
    }
    res.status(500).json({ error: "Failed to update settlement currency" })
  }
}
