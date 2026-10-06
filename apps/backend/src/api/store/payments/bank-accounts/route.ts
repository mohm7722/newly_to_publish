import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { PAYMENTS_MODULE } from "../../../../modules/payments"
import type PaymentsModuleService from "../../../../modules/payments/service"
import { nocache } from "../../../utils/nocache"

/**
 * Store bank-accounts route (Requirements 4.6, 8.2, 8.3).
 *
 *  - `GET /store/payments/bank-accounts` → list **active** bank accounts only.
 *
 * `/store/*` is auto-protected by the framework's publishable-key middleware,
 * so no custom auth gate is applied here. Only accounts whose `is_active` flag
 * is `true` are returned (Requirement 4.6); inactive accounts are never exposed
 * to the storefront.
 *
 * The response projects each active account down to the customer-facing fields
 * needed for checkout display (`bank_name`, `account_number`, `currency_code`,
 * `instructions`) so internal flags are not leaked to the storefront. The
 * canonical underscore currency codes (`SAR`, `YER_NEW`, `YER_OLD`) are
 * surfaced verbatim. The service's typed `MedusaError`s are mapped to HTTP
 * status codes below (Requirement 8.3).
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
 * List active bank accounts, projected to customer-facing checkout fields.
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const paymentsService = req.scope.resolve<PaymentsModuleService>(
      PAYMENTS_MODULE
    )

    const currencyCode = (req.query as { currency_code?: string }).currency_code
    const supported = ["SAR", "YER_NEW", "YER_OLD"]
    if (!currencyCode || !supported.includes(currencyCode)) {
      res.status(400).json({
        message: "currency_code must be one of SAR, YER_NEW, YER_OLD",
      })
      return
    }

    const accounts = await paymentsService.listBankAccounts({
      is_active: true,
      currency_code: currencyCode,
    })

    const bank_accounts = accounts.map((account) => ({
      id: account.id,
      bank_name: account.bank_name,
      account_number: account.account_number,
      currency_code: account.currency_code,
      instructions: account.instructions ?? null,
    }))

    nocache(res)
    res.status(200).json({ bank_accounts })
  } catch (error) {
    handleServiceError(error, res)
  }
}
