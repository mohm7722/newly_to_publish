import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { PAYMENTS_MODULE } from "../../../../../../modules/payments"
import type PaymentsModuleService from "../../../../../../modules/payments/service"
import { nocache } from "../../../../../utils/nocache"

/**
 * Admin bank-account toggle route (Requirements 4.5, 8.1, 8.3, 8.6).
 *
 *  - `POST /admin/payments/bank-accounts/[id]/toggle` → flip the `is_active`
 *    flag of the bank account identified by `[id]`.
 *
 * The `[id]` segment is read from `req.params.id`. `/admin/*` is auto-protected
 * (Requirement 8.6). A missing record is rejected by the service with a
 * `NOT_FOUND` `MedusaError` mapped to 404 below (Requirement 8.3).
 */

/** Central MedusaError → HTTP status mapping (Requirement 8.3). */
function handleServiceError(error: unknown, res: MedusaResponse): void {
  if (error instanceof MedusaError) {
    if (error.type === MedusaError.Types.NOT_FOUND) {
      res.status(404).json({ message: error.message })
      return
    }
    if (error.type === MedusaError.Types.INVALID_DATA) {
      res.status(400).json({ message: error.message })
      return
    }
  }
  res.status(500).json({
    message: (error as Error)?.message ?? "Internal server error",
  })
}

/**
 * Toggle the active flag of a bank account by id.
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id } = req.params
  if (!id) {
    res.status(400).json({ message: "Bank account ID is required" })
    return
  }

  try {
    const paymentsService = req.scope.resolve<PaymentsModuleService>(
      PAYMENTS_MODULE
    )

    const bank_account = await paymentsService.toggleBankAccount(id)

    nocache(res)
    res.status(200).json({
      message: "Bank account toggled successfully",
      bank_account,
    })
  } catch (error) {
    handleServiceError(error, res)
  }
}
