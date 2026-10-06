import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { SHIPPING_CITY_MODULE } from "../../../../modules/shipping-city"
import type ShippingCityModuleService from "../../../../modules/shipping-city/service"

/**
 * Admin shipping-cities item routes (Requirements 5.3, 8.1, 8.3, 8.6).
 *
 * File-based handlers under `/admin/shipping-cities/[city]` keyed by city name.
 * `/admin/*` is auto-protected by the framework (Req 8.6). Each handler maps
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
  console.error("Error in /admin/shipping-cities/[city]:", error)
  res.status(500).json({ error: "Internal server error" })
}

/**
 * PATCH /admin/shipping-cities/:city — toggle active state and/or update the
 * delivery price for the city named in the path.
 */
export const PATCH = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { city } = req.params
    const { is_active, delivery_price } = (req.body ?? {}) as any

    const shippingCityService: ShippingCityModuleService =
      req.scope.resolve(SHIPPING_CITY_MODULE)

    if (typeof is_active === "boolean") {
      await shippingCityService.toggleCity(city, is_active)
    }

    let item: any = null
    if (typeof delivery_price === "number") {
      // Price change: upsert returns the latest record state.
      item = await shippingCityService.upsertCity({ city, delivery_price, is_active })
    } else {
      // No price change: return the matched city's latest state.
      const cities = await shippingCityService.listAll()
      item = cities.find((c: any) => c.city === city) ?? null
    }

    res.json({ ok: true, item })
  } catch (error) {
    handleError(res, error)
  }
}

/**
 * PUT /admin/shipping-cities/:city — full update (incl. rename) of the city
 * named in the path. Rejects renames that collide with an existing name.
 */
export const PUT = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { city } = req.params
    const { city: newCityName, delivery_price, is_active } = (req.body ?? {}) as any

    const shippingCityService: ShippingCityModuleService =
      req.scope.resolve(SHIPPING_CITY_MODULE)

    const cities = await shippingCityService.listAll()
    const existing = cities.find((c: any) => c.city === city)

    if (!existing) {
      return res.status(404).json({ error: "City not found" })
    }

    // Build a partial update, omitting undefined keys.
    const update: Record<string, unknown> = {}
    if (newCityName !== undefined) update.city = newCityName
    if (delivery_price !== undefined) update.delivery_price = delivery_price
    if (is_active !== undefined) update.is_active = is_active

    const item = await shippingCityService.updateCity(String(existing.id), update)

    res.json({ ok: true, item })
  } catch (error) {
    handleError(res, error)
  }
}

/** DELETE /admin/shipping-cities/:city — delete the city named in the path. */
export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const { city } = req.params

    const shippingCityService: ShippingCityModuleService =
      req.scope.resolve(SHIPPING_CITY_MODULE)
    await shippingCityService.deleteCity(city)

    res.json({ ok: true, message: "City deleted successfully" })
  } catch (error) {
    handleError(res, error)
  }
}
