/**
 * Store FX selection route.
 *
 * File-based handler for `POST /store/fx/select`. Validates the chosen display
 * currency against the supported set, sets the `fx_currency` cookie for the
 * Storefront, and (best-effort) mirrors the selection into the active cart's
 * metadata (`metadata.fx.ui`) when a cart id is supplied.
 *
 * The response shape mirrors the Old Store contract:
 * `{ ok: true, ui, message }`.
 *
 * Requirements:
 * - 2.5: store currency route reflecting the current FX configuration.
 * - 8.2: store API route exposing the Old Store resource path/method.
 * - 8.3: implemented as a Medusa 2.16 file-based route handler. Store routes are
 *   publishable-key gated and CORS-enabled by the framework's `/store/*`
 *   middleware.
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { z } from "zod"

import { SUPPORTED_CURRENCIES } from "../../../../lib/fx"

/** Cookie name and lifetime (30 days) for the persisted display currency. */
const FX_COOKIE = "fx_currency"
const FX_COOKIE_MAX_AGE = 60 * 60 * 24 * 30 * 1000

/** Request body schema: a required currency and an optional cart id. */
const selectSchema = z.object({
  currency: z.enum(SUPPORTED_CURRENCIES),
  cart_id: z.string().optional(),
})

/**
 * POST /store/fx/select
 *
 * Validates `{ currency, cart_id? }`. The `currency` must be one of
 * `SUPPORTED_CURRENCIES`; an unsupported value is rejected with 400. On success
 * the `fx_currency` cookie is set (persisted across sessions). If a `cart_id`
 * is supplied, the cart's `metadata.fx.ui` is updated on a best-effort basis;
 * failures there do not fail the request, and the cookie is always set.
 */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  try {
    const parsed = selectSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: "invalid currency" })
    }

    const { currency, cart_id } = parsed.data

    // Persist the selection for the Storefront across sessions.
    res.cookie(FX_COOKIE, currency, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: FX_COOKIE_MAX_AGE,
    })

    // Best-effort: mirror the selection into the supplied cart's metadata.
    if (cart_id) {
      try {
        const cartModuleService = req.scope.resolve(Modules.CART)
        const carts = await cartModuleService.listCarts({ id: [cart_id] })
        const currentCart = carts?.[0]

        if (currentCart) {
          const metadata = {
            ...(currentCart.metadata || {}),
            fx: { ui: currency },
          }
          await cartModuleService.updateCarts([{ id: cart_id, metadata }])
        }
      } catch {
        // Non-fatal: the cookie is the source of truth for display currency.
      }
    }

    return res.status(200).json({
      ok: true,
      ui: currency,
      message: "currency preference updated",
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error"
    return res.status(500).json({ message })
  }
}
