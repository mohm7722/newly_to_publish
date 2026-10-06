"use client"

/**
 * City delivery price display (Requirements 7.10, 5.5, 5.6).
 *
 * Renders, during the checkout shipping step, the delivery price of the city
 * currently selected for the cart, converted to the customer's selected
 * display currency.
 *
 * The active cities (with their SAR-base `delivery_price`) are loaded
 * server-side via `lib/data/cities.listCities` and passed in as `cities`. The
 * selected city is carried in the cart metadata (`city_id` / `city_name`),
 * which the backend `city-shipping` route keeps in sync when a city is applied
 * to the cart. We match by id first, then fall back to a normalized
 * (trimmed, case-insensitive) city-name comparison, mirroring the backend.
 *
 * When no city is matched (no metadata, or the stored city is no longer active)
 * the component renders nothing — a neutral state — rather than a misleading
 * price.
 *
 * Conversion + presentation are delegated entirely to `FxPrice`
 * (`useFx().format`): the SAR base amount is converted to the selected currency
 * rounded to 2 dp and presented with an Arabic-friendly label (2 dp for SAR,
 * 0 dp for YER_NEW / YER_OLD). This component never duplicates that logic.
 */

import { HttpTypes } from "@medusajs/types"
import FxPrice from "@modules/common/components/fx-price"
import { Text } from "@modules/common/components/ui"
import type { StoreCity } from "@lib/data/cities"

/** Normalize a string for case-insensitive, trimmed comparison. */
function norm(value: unknown): string {
  return (value ?? "").toString().trim().toLowerCase()
}

/**
 * Resolve the cart's selected city from the active-cities list using the
 * cart metadata, returning `null` when nothing matches.
 */
function matchCity(
  cart: HttpTypes.StoreCart,
  cities: StoreCity[]
): StoreCity | null {
  const metadata = (cart.metadata ?? {}) as Record<string, unknown>
  const cityId = metadata.city_id
  const cityName = metadata.city_name

  if (cityId) {
    const byId = cities.find((c) => c.id === String(cityId))
    if (byId) {
      return byId
    }
  }

  if (cityName) {
    const byName = cities.find((c) => norm(c.name) === norm(cityName))
    if (byName) {
      return byName
    }
  }

  return null
}

type CityDeliveryPriceProps = {
  cart: HttpTypes.StoreCart
  cities: StoreCity[]
}

/**
 * Display the matched city's delivery price in the selected display currency.
 *
 * Must be used within an `FxProvider` (mounted at the storefront root layout).
 * Renders nothing when no active city is matched for the cart.
 */
export default function CityDeliveryPrice({
  cart,
  cities,
}: CityDeliveryPriceProps) {
  const city = matchCity(cart, cities)

  if (!city) {
    return null
  }

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border border-[#82ac40]/20 bg-[#f7faef] p-4 sm:flex-row sm:items-center sm:justify-between"
      data-testid="city-delivery-price"
    >
      <Text className="font-semibold text-[#3f5f18]">
        سعر التوصيل إلى {city.name}
      </Text>
      <Text className="text-lg font-bold text-[#270830]" data-testid="city-delivery-price-amount">
        <FxPrice amountSar={city.delivery_price} />
      </Text>
    </div>
  )
}
