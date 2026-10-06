import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { SHIPPING_CITY_MODULE } from "../../../modules/shipping-city"
import type ShippingCityModuleService from "../../../modules/shipping-city/service"

/**
 * Admin shipping-cities collection routes (Requirements 5.3, 8.1, 8.3, 8.6).
 *
 * File-based handlers under `/admin/shipping-cities`. `/admin/*` is
 * auto-protected by the framework (Req 8.6), so these handlers focus on input
 * validation, delegating to the validated module service, and mapping
 * `MedusaError` types to HTTP status codes for Old Store response parity
 * (Req 8.4).
 */

/**
 * Map a thrown error to its HTTP status / `{ error }` body and send it
 * (Requirement 8.3): INVALID_DATA → 400, NOT_FOUND → 404, otherwise 500.
 */
function handleError(res: MedusaResponse, error: unknown): void {
  if (error instanceof MedusaError) {
    if (error.type === MedusaError.Types.INVALID_DATA) {
      res.status(400).json({ error: error.message })
      return
    }
    if (error.type === MedusaError.Types.NOT_FOUND) {
      res.status(404).json({ error: error.message })
      return
    }
  }
  console.error("Error in /admin/shipping-cities:", error)
  res.status(500).json({ error: "Internal server error" })
}

/** GET /admin/shipping-cities — list every shipping city ordered by name. */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const shippingCityService: ShippingCityModuleService =
      req.scope.resolve(SHIPPING_CITY_MODULE)
    res.json({ ok: true, items: await shippingCityService.listAll() })
  } catch (error) {
    handleError(res, error)
  }
}

/** POST /admin/shipping-cities — create or update a city (upsert by name). */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { city, delivery_price, is_active = true } = (req.body ?? {}) as any

    // Pre-validate input for Old Store parity error messages (Req 8.4).
    if (!city || typeof city !== "string") {
      return res
        .status(400)
        .json({ error: "City name is required and must be a string" })
    }
    if (
      delivery_price === undefined ||
      typeof delivery_price !== "number" ||
      delivery_price < 0
    ) {
      return res
        .status(400)
        .json({ error: "Delivery price is required and must be a positive number" })
    }

    const shippingCityService: ShippingCityModuleService =
      req.scope.resolve(SHIPPING_CITY_MODULE)
    const item = await shippingCityService.upsertCity({
      city,
      delivery_price,
      is_active,
    })

    res.json({ ok: true, item })
  } catch (error) {
    handleError(res, error)
  }
}
