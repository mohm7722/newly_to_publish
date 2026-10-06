import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { PAYMENTS_MODULE } from "../../../../modules/payments"
import type PaymentsModuleService from "../../../../modules/payments/service"
import { nocache } from "../../../utils/nocache"

/**
 * Store COD-settings route (Requirements 4.6, 8.2, 8.3).
 *
 *  - `GET /store/payments/cod-settings` → read the singleton COD settings plus
 *    the current COD availability.
 *
 * `/store/*` is auto-protected by the framework's publishable-key middleware,
 * so no custom auth gate is applied here.
 *
 * The response preserves the Old Store `{ cod_settings }` shape and augments it
 * with an `available` boolean reflecting the current COD availability. When an
 * optional `?city_id=<id>` query is supplied, availability is resolved for that
 * shipping city via the service's `isCodAvailableForCity` predicate; otherwise
 * availability is resolved with no city, so a configured city restriction
 * yields `false` until a city is provided. The service's typed `MedusaError`s
 * are mapped to HTTP status codes below (Requirement 8.3).
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
 * Read the singleton COD settings together with current availability.
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    const paymentsService = req.scope.resolve<PaymentsModuleService>(
      PAYMENTS_MODULE
    )

    const cod_settings = await paymentsService.getCODSettings()

    // Resolve availability for the (optional) cart shipping city. An unset city
    // against a configured restriction excludes COD.
    const cityId =
      typeof req.query.city_id === "string" ? req.query.city_id : undefined

    const available = await paymentsService.isCodAvailableForCity(cityId)

    nocache(res)
    res.status(200).json({ cod_settings, available })
  } catch (error) {
    handleServiceError(error, res)
  }
}
