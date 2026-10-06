"use server"

/**
 * FX selection server actions for the storefront.
 *
 * Backs the currency switcher (`modules/layout/components/currency-switcher`).
 * `selectCurrency` persists the customer's chosen display currency by:
 *  1. POSTing to the backend store route `POST /store/fx/select` (validates the
 *     currency, mirrors the selection into the active cart's `metadata.fx.ui`
 *     when a cart exists, and sets the backend-side `fx_currency` cookie), and
 *  2. writing the `fx_currency` cookie on the storefront domain so the
 *     server-side FX snapshot seed (`lib/fx/server.ts`, which reads the cookie
 *     via `next/headers`) reflects the new selection on the next render.
 *
 * The switcher calls `router.refresh()` after this action resolves so server
 * components re-render with converted prices. The unavailable-rate guard lives
 * in the client component (it inspects the FX snapshot before calling this
 * action) so an unavailable rate never reaches the backend and the cart is left
 * unchanged (Requirement 7.6).
 *
 * Requirements: 7.2, 7.4, 7.6.
 */

import { sdk } from "@lib/config"
import { FX_COOKIE, isSupportedCurrency, type FxCurrency } from "@lib/fx/shared"
import { cookies as nextCookies } from "next/headers"

import { getAuthHeaders, getCartId } from "./cookies"

/** Cookie lifetime (30 days) mirroring the backend `fx_currency` cookie. */
const FX_COOKIE_MAX_AGE = 60 * 60 * 24 * 30

/** Response shape of the backend `POST /store/fx/select` route. */
type FxSelectResponse = {
  ok: boolean
  ui: FxCurrency
  message: string
}

/**
 * Persist the selected display currency.
 *
 * Validates the currency, notifies the backend (which also mirrors the
 * selection into the active cart's metadata), and writes the storefront-side
 * `fx_currency` cookie so the FX snapshot seed reads the new value.
 *
 * @throws when `currency` is unsupported or the backend request fails. The
 * caller keeps the previously selected currency and surfaces the error.
 */
export const selectCurrency = async (
  currency: FxCurrency
): Promise<FxCurrency> => {
  if (!isSupportedCurrency(currency)) {
    throw new Error("Unsupported currency")
  }

  const cartId = await getCartId()

  await sdk.client.fetch<FxSelectResponse>(`/store/fx/select`, {
    method: "POST",
    headers: {
      ...(await getAuthHeaders()),
    },
    body: {
      currency,
      ...(cartId ? { cart_id: cartId } : {}),
    },
  })

  // Persist on the storefront domain so the server-side snapshot seed (which
  // reads `fx_currency` via next/headers) reflects the selection on refresh.
  const cookies = await nextCookies()
  cookies.set(FX_COOKIE, currency, {
    maxAge: FX_COOKIE_MAX_AGE,
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  })

  return currency
}
