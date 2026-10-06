import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { SHIPPING_CITY_MODULE } from "../../../modules/shipping-city"
import type ShippingCityModuleService from "../../../modules/shipping-city/service"

/** Normalize a string for case-insensitive, trimmed comparison. */
function norm(s?: string): string {
  return (s ?? "").toString().trim().toLowerCase()
}

/**
 * Store shipping-options route (Requirements 5.5, 5.6, 8.2, 8.3).
 *
 * `GET /store/shipping-options?cart_id=...` returns a single city-priced
 * shipping option when the cart resolves to an active shipping city, or an
 * empty option list otherwise (so the storefront never falls back to default
 * pricing). The delivery price applied is the active city's stored
 * `delivery_price` (SAR major units), matching the Old Store. Inactive or
 * unknown cities yield an empty list rather than a priced option (Requirement
 * 5.7 — no default price is surfaced).
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const logger: any = req.scope.resolve("logger")
  try {
    const fulfillment = req.scope.resolve(Modules.FULFILLMENT) as any
    const cartModuleService = req.scope.resolve(Modules.CART) as any

    const cartId = (req.query?.cart_id as string) || ""

    const shippingOptions = await fulfillment.listShippingOptions()

    // Without a concrete cart we cannot resolve a city; return options as-is.
    if (!cartId || cartId === "test") {
      return res.json({ shipping_options: shippingOptions })
    }

    let options: any[] = []

    const cart = await cartModuleService.retrieveCart(cartId, {
      relations: ["shipping_address"],
    })
    const cityId = cart?.metadata?.city_id as string | undefined
    const addrCity = cart?.shipping_address?.city as string | undefined
    const metaCity =
      (cart?.metadata?.city_name as string | undefined) ||
      (cart?.metadata?.city as string | undefined)

    // Prefer the shipping-address city when it differs from cart metadata.
    let cityName: string | undefined
    if (addrCity && norm(addrCity) !== norm(metaCity)) {
      cityName = addrCity
    } else {
      cityName = addrCity || metaCity
    }

    if (cityId || cityName) {
      const citySvc: ShippingCityModuleService =
        req.scope.resolve(SHIPPING_CITY_MODULE)
      const cities = await citySvc.listAll()

      let city: any = null
      if (cityId) {
        city = cities.find((c: any) => c.id === cityId && c.is_active)
      }
      if (!city && cityName) {
        city = cities.find(
          (c: any) => norm(c.city) === norm(cityName) && c.is_active
        )
      }

      if (city && shippingOptions.length > 0) {
        // Prefer a delivery option; never relabel a pickup option as delivery.
        const baseOption =
          shippingOptions.find(
            (option: any) =>
              option?.service_zone?.fulfillment_set?.type !== "pickup"
          ) || shippingOptions[0]
        const amount = Number(city.delivery_price || 0)
        options = [
          {
            ...baseOption,
            amount,
            price_type: "flat",
            name: `توصيل إلى ${city.city}`,
            title: `توصيل إلى ${city.city}`,
          },
        ]
      } else {
        // No active city match → empty list to avoid default pricing.
        options = []
      }
    } else {
      // No city resolvable from the cart → empty list to avoid default pricing.
      options = []
    }

    return res.json({ shipping_options: options })
  } catch (e) {
    logger?.error?.(`shipping-options error: ${(e as any)?.message || e}`)
    return res.status(500).json({ message: "Failed to list shipping options" })
  }
}
