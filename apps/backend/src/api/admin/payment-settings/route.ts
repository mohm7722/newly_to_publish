import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { z } from "zod"
import { PAYMENTS_MODULE } from "../../../modules/payments"
import type PaymentsModuleService from "../../../modules/payments/service"
import { nocache } from "../../utils/nocache"
import { hasPermission } from "../../utils/rbac"

/**
 * Admin aggregate payment-settings route (Requirements 4.5, 8.1, 8.3, 8.6).
 *
 *  - `GET /admin/payment-settings` → aggregate read combining the singleton COD
 *    settings, the configured bank accounts, payment feature flags, and the
 *    caller's permissions.
 *  - `PUT /admin/payment-settings` → finance-gated update of the COD settings.
 *
 * `/admin/*` is auto-protected by the framework's authenticated-admin
 * middleware. Authorization (`payment_settings:read` for GET,
 * `payment_settings:write` for PUT) is enforced centrally by the RBAC
 * middleware via the route→permission map.
 */

/** Body accepted by {@link PUT}. The COD settings fields are all optional. */
const updateSchema = z.object({
  enabled: z.boolean().optional(),
  instructions: z.string().optional(),
  selected_city_ids: z.array(z.string()).optional(),
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

/** Payment feature flags default to enabled unless explicitly disabled. */
function paymentFeatureFlags(): {
  FF_PAY_BANK_TRANSFER: boolean
  FF_PAY_COD: boolean
} {
  return {
    FF_PAY_BANK_TRANSFER: process.env.FF_PAY_BANK_TRANSFER !== "false",
    FF_PAY_COD: process.env.FF_PAY_COD !== "false",
  }
}

/**
 * Read the aggregate payment settings (COD + bank accounts + flags +
 * permissions).
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
    res.status(200).json({
      payment_settings: {
        cod: await paymentsService.getCODSettings(),
        bank_accounts: await paymentsService.listBankAccounts(),
      },
      feature_flags: paymentFeatureFlags(),
      permissions: {
        can_view: true,
        can_modify: hasPermission(req, "payment_settings:write"),
      },
    })
  } catch (error) {
    handleServiceError(error, res)
  }
}

/**
 * Finance-gated update of the COD settings (Requirement 8.3). Non-finance
 * callers are rejected with 403.
 */
export async function PUT(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  // Authorization is enforced centrally (payment_settings:write) by the RBAC
  // middleware.
  const parse = updateSchema.safeParse(req.body)
  if (!parse.success) {
    res.status(400).json({
      message: "Invalid payment settings payload",
      issues: parse.error.issues,
    })
    return
  }

  try {
    const paymentsService = req.scope.resolve<PaymentsModuleService>(
      PAYMENTS_MODULE
    )

    // Only touch COD settings when COD fields are present in the body.
    const { enabled, instructions, selected_city_ids } = parse.data
    const hasCodFields =
      enabled !== undefined ||
      instructions !== undefined ||
      selected_city_ids !== undefined

    const cod_settings = hasCodFields
      ? await paymentsService.updateCODSettings(parse.data)
      : await paymentsService.getCODSettings()

    nocache(res)
    res.status(200).json({
      success: true,
      updated_at: new Date().toISOString(),
      cod_settings,
    })
  } catch (error) {
    handleServiceError(error, res)
  }
}
