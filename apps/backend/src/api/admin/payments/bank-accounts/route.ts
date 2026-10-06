import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { z } from "zod"
import { PAYMENTS_MODULE } from "../../../../modules/payments"
import type PaymentsModuleService from "../../../../modules/payments/service"
import { nocache } from "../../../utils/nocache"

/**
 * Admin bank-accounts collection route (Requirements 4.5, 8.1, 8.3, 8.6).
 *
 *  - `GET  /admin/payments/bank-accounts` → list bank accounts.
 *  - `POST /admin/payments/bank-accounts` → create a bank account.
 *
 * `/admin/*` is auto-protected by the framework's authenticated-admin
 * middleware (Requirement 8.6); no extra gate is applied here. Field
 * validation, `account_number` uniqueness, and verbatim `currency_code`
 * persistence are enforced by the service (Requirement 8.3); its typed
 * `MedusaError`s are mapped to HTTP status codes below.
 */

/** Canonical currency codes (underscore form), locked to exactly three. */
const ALLOWED_CURRENCIES = ["SAR", "YER_NEW", "YER_OLD"] as const

/** Body accepted by {@link POST}. */
const createSchema = z.object({
  bank_name: z.string().min(1),
  account_number: z.string().min(1),
  currency_code: z.enum(ALLOWED_CURRENCIES, {
    message: "currency_code must be one of SAR, YER_NEW, YER_OLD",
  }),
  instructions: z.string().optional(),
  is_active: z.boolean().optional(),
})

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
 * List all bank accounts.
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const paymentsService = req.scope.resolve<PaymentsModuleService>(
      PAYMENTS_MODULE
    )

    nocache(res)
    res
      .status(200)
      .json({ bank_accounts: await paymentsService.listBankAccounts() })
  } catch (error) {
    handleServiceError(error, res)
  }
}

/**
 * Create a bank account. Invalid input → 400; duplicate `account_number`
 * (INVALID_DATA) → 400 with the service message.
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const parse = createSchema.safeParse(req.body)
  if (!parse.success) {
    res.status(400).json({
      message: "Invalid bank account payload",
      issues: parse.error.issues,
    })
    return
  }

  try {
    const paymentsService = req.scope.resolve<PaymentsModuleService>(
      PAYMENTS_MODULE
    )

    // Store currency_code exactly as provided (no normalization).
    const bank_account = await paymentsService.createBankAccount(parse.data)

    nocache(res)
    res.status(201).json({ bank_account })
  } catch (error) {
    handleServiceError(error, res)
  }
}
