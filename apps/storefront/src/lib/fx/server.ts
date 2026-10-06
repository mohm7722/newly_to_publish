import "server-only"

/**
 * Server-side FX snapshot seed.
 *
 * Builds the {@link FxSnapshot} used to seed the client `FxProvider`. Runs on
 * the server: it reads the persisted display currency from the `fx_currency`
 * cookie (via the awaited Next.js 15.5 `cookies()` API) and fetches the public
 * rate map from the backend store route `GET /store/fx/rates`, which returns
 * `{ base: "SAR", rates, enabled }`.
 *
 * When no prior selection exists the display currency defaults to `YER_NEW`
 * (Requirement 7.3). The selection persists in the `fx_currency` cookie across
 * sessions (Requirement 7.4) — the cookie is written by the currency switcher
 * (`POST /store/fx/select`); here it is only read.
 *
 * If the rate fetch fails, the snapshot falls back gracefully to the SAR base
 * with `{ SAR: 1 }` rates and `enabled: false` so the storefront keeps
 * rendering; the switcher surfaces user-facing errors (Requirement 7.6).
 *
 * Requirements: 7.3, 7.4, 7.11.
 */

import { cookies } from "next/headers"

import { sdk } from "@lib/config"

import {
  FX_COOKIE,
  FX_DEFAULT_CURRENCY,
  isSupportedCurrency,
  type FxCurrency,
  type FxRates,
  type FxSnapshot,
} from "./shared"

/** Response shape of the backend `GET /store/fx/rates` route. */
type FxRatesResponse = {
  base: string
  rates: FxRates
  enabled: boolean
}

/**
 * Read the persisted display currency from the `fx_currency` cookie, returning
 * {@link FX_DEFAULT_CURRENCY} (`YER_NEW`) when it is absent or unrecognised.
 */
async function readSelectedCurrency(): Promise<FxCurrency> {
  try {
    const cookieStore = await cookies()
    const stored = cookieStore.get(FX_COOKIE)?.value
    if (isSupportedCurrency(stored)) {
      return stored
    }
  } catch {
    // No request scope / cookies unavailable: fall back to the default.
  }
  return FX_DEFAULT_CURRENCY
}

/**
 * Fetch the public FX rate map and feature-flag state from the backend store
 * route. Always returns `SAR: 1` in the rate map; falls back to a base-only,
 * disabled snapshot when the request fails.
 */
async function fetchFxRates(): Promise<Omit<FxSnapshot, "currency">> {
  try {
    const data = await sdk.client.fetch<FxRatesResponse>(`/store/fx/rates`, {
      method: "GET",
      cache: "no-store",
    })

    return {
      base: data?.base ?? "SAR",
      rates: { SAR: 1, ...(data?.rates ?? {}) },
      enabled: Boolean(data?.enabled),
    }
  } catch {
    // Graceful fallback: keep the SAR base so the storefront still renders.
    return { base: "SAR", rates: { SAR: 1 }, enabled: false }
  }
}

/**
 * Build the server-side {@link FxSnapshot} used to seed the client
 * `FxProvider`. Combines the cookie-derived display currency with the backend
 * rate map.
 */
export async function getFxSnapshot(): Promise<FxSnapshot> {
  const [currency, rateData] = await Promise.all([
    readSelectedCurrency(),
    fetchFxRates(),
  ])

  return { ...rateData, currency }
}
