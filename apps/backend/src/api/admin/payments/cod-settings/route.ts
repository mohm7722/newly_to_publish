import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { z } from "zod"
import { PAYMENTS_MODULE } from "../../../../modules/payments"
import type PaymentsModuleService from "../../../../modules/payments/service"
import { nocache } from "../../../utils/nocache"

/**
 * Admin COD-settings route (Requirements 4.5, 8.1, 8.3, 8.6).
 *
 *  - `GET  /admin/payments/cod-settings` → read the singleton COD settings
 *    (defaults are returned when no row exists yet).
 *  - `POST /admin/payments/cod-settings` → upsert the singleton COD settings.
 *
 * `/admin/*` is auto-protected (Requirement 8.6). Field validation is enforced
 * by the service; its typed `MedusaError`s are mapped to HTTP status codes
 * below (Requirement 8.3).
 */

/** Body accepted by {@link POST}. */
const upsertSchema = z.object({
  enabled: z.boolean(),
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

/**
 * Read the singleton COD settings.
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
      .json({ cod_settings: await paymentsService.getCODSettings() })
  } catch (error) {
    handleServiceError(error, res)
  }
}

/**
 * Upsert the singleton COD settings. Invalid input → 400.
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  const parse = upsertSchema.safeParse(req.body)
  if (!parse.success) {
    res.status(400).json({
      message: "Invalid COD settings payload",
      issues: parse.error.issues,
    })
    return
  }

  try {
    const paymentsService = req.scope.resolve<PaymentsModuleService>(
      PAYMENTS_MODULE
    )

    const cod_settings = await paymentsService.updateCODSettings(parse.data)

    nocache(res)
    res.status(200).json({ cod_settings })
  } catch (error) {
    handleServiceError(error, res)
  }
}
