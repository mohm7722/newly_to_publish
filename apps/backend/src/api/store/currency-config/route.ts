/**
 * Store currency-config route.
 *
 * File-based handler for `GET /store/currency-config`. Exposes the public FX
 * currency configuration to the Storefront, backed by
 * `store.metadata.currency_fx` via the FX config accessors.
 *
 * The response shape mirrors the Old Store contract exactly:
 * `{ enabled, default, base, rates }`, where `base` is the canonical SAR base
 * and `rates` is the raw configured per-quote rate map.
 *
 * Requirements:
 * - 2.5: reading a store currency route returns the current FX configuration.
 * - 8.2: store API route exposing the Old Store resource path/method.
 * - 8.3: implemented as a Medusa 2.16 file-based route handler. Store routes are
 *   publishable-key gated and CORS-enabled by the framework's `/store/*`
 *   middleware.
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { loadFxConfig } from "../../../lib/fx"

/**
 * GET /store/currency-config
 *
 * Returns the enabled currency list, the default currency, the SAR base, and
 * the configured rate map.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const cfg = await loadFxConfig(req.scope)
    return res.status(200).json({
      enabled: cfg.enabled,
      default: cfg.default,
      base: "SAR",
      rates: cfg.rates,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error"
    return res.status(500).json({ message })
  }
}
