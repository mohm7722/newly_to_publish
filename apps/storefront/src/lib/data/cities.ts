"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders } from "./cookies"

/**
 * Shipping city data helper (Requirements 5.5, 5.6, 7.10).
 *
 * Reads the publishable-key-gated `GET /store/cities` store route exposed by
 * the backend Shipping_City_Module. That route returns only the shipping cities
 * whose `is_active` flag is true, each including its city name and
 * `delivery_price` (Requirement 5.5). Delivery prices are stored as
 * `numeric(10,2)` monetary amounts in the SAR base currency (major units), so
 * they can be passed straight to `FxPrice` / `formatFromSar` for display in the
 * customer's selected currency (Requirement 7.10).
 *
 * The Medusa JS SDK client (`sdk.client`) automatically injects the
 * `x-publishable-api-key` header configured in `@lib/config`, so no manual key
 * handling is required here. The response is read with `no-store` because the
 * backend serves it with no-cache headers (active-flag state is dynamic).
 */

/** Customer-facing shipping city shape returned by the store route. */
export type StoreCity = {
  id: string
  /** City name (the backend exposes both `city` and `name`; they are equal). */
  name: string
  /** Delivery price as a SAR base amount in major units (e.g. `25.5`). */
  delivery_price: number
}

/** Raw item shape returned by `GET /store/cities`. */
type RawStoreCity = {
  id?: string
  city?: string
  name?: string
  delivery_price?: number | string
  is_active?: boolean
}

/**
 * List the active shipping cities available for delivery, each with its name
 * and SAR-base delivery price.
 *
 * @returns The active cities, or an empty array on failure.
 */
export const listCities = async (): Promise<StoreCity[]> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.client
    .fetch<{ ok?: boolean; items?: RawStoreCity[] }>(`/store/cities`, {
      method: "GET",
      headers,
      cache: "no-store",
    })
    .then(({ items }) =>
      (items ?? []).map((c) => ({
        id: String(c.id ?? ""),
        name: String(c.name ?? c.city ?? ""),
        delivery_price: Number(c.delivery_price ?? 0),
      }))
    )
    .catch(() => [])
}
