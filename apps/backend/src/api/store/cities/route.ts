import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SHIPPING_CITY_MODULE } from "../../../modules/shipping-city"
import type ShippingCityModuleService from "../../../modules/shipping-city/service"

/**
 * Store cities route (Requirements 5.5, 8.2, 8.3).
 *
 * `GET /store/cities` returns only the shipping cities whose `is_active` flag
 * is true, each including its city name and delivery price, and excludes every
 * inactive record. `/store/*` is gated by the framework's publishable-key
 * middleware. The response preserves the Old Store shape
 * (`{ ok: true, items }`) for behavior parity (Requirement 8.4).
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const shippingCityService: ShippingCityModuleService =
      req.scope.resolve(SHIPPING_CITY_MODULE)

    const all = await shippingCityService.listAll()
    // Active-only filtering (Requirement 5.5): exclude every inactive record.
    const items = all
      .filter((c: any) => c.is_active)
      .map((c: any) => ({
        id: c.id,
        city: c.city,
        name: c.city,
        delivery_price: Number(c.delivery_price),
        is_active: c.is_active,
      }))

    res.json({ ok: true, items })
  } catch (error) {
    console.error("Error fetching active cities:", error)
    res.status(500).json({ error: "Failed to fetch cities" })
  }
}
