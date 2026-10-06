import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { z } from "zod"
import { PAYMENTS_MODULE } from "../../../../../modules/payments"
import type PaymentsModuleService from "../../../../../modules/payments/service"
import { nocache } from "../../../../utils/nocache"

/**
 * Admin bank-account item route (Requirements 4.5, 8.1, 8.3, 8.6).
 *
 *  - `PATCH  /admin/payments/bank-accounts/[id]` → partial update.
 *  - `DELETE /admin/payments/bank-accounts/[id]` → delete.
 *
 * The `[id]` segment is read from `req.params.id`. `/admin/*` is auto-protected
 * (Requirement 8.6). Validation, `account_number` uniqueness, and `NOT_FOUND`
 * are enforced by the service; its typed `MedusaError`s are mapped below
 * (Requirement 8.3).
 */

/** Canonical currency codes (underscore form), locked to exactly three. */
const ALLOWED_CURRENCIES = ["SAR", "YER_NEW", "YER_OLD"] as const

/** Body accepted by {@link PATCH}. Every field is optional (partial update). */
const updateSchema = z.object({
  bank_name: z.string().min(1).optional(),
  account_number: z.string().min(1).optional(),
  currency_code: z
    .enum(ALLOWED_CURRENCIES, {
      message: "currency_code must be one of SAR, YER_NEW, YER_OLD",
    })
    .optional(),
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
 * Partially update a bank account by id. NOT_FOUND → 404; duplicate
 * `account_number` (INVALID_DATA) → 400.
 */
export async function PATCH(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const { id } = req.params
  if (!id) {
    res.status(400).json({ message: "Bank account ID is required" })
    return
  }

  const parse = updateSchema.safeParse(req.body)
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
    const bank_account = await paymentsService.updateBankAccount(
      id,
      parse.data
    )

    nocache(res)
    res.status(200).json({
      message: "Bank account updated successfully",
      bank_account,
    })
  } catch (error) {
    handleServiceError(error, res)
  }
}

/**
 * Delete a bank account by id. NOT_FOUND → 404; success → 204 No Content.
 */
export async function DELETE(
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

    await paymentsService.deleteBankAccount(id)

    nocache(res)
    res.status(204).send()
  } catch (error) {
    handleServiceError(error, res)
  }
}
