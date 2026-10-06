/**
 * Store FX rates route.
 *
 * File-based handler for `GET /store/fx/rates`. Exposes the public FX rate map
 * and the FX feature-flag state to the Storefront, backed by
 * `store.metadata.currency_fx` via the FX config accessors.
 *
 * The response shape is `{ base: "SAR", rates, enabled }`, where:
 * - `base` is the canonical SAR base.
 * - `rates` is a `Record<string, number>` that always contains `SAR: 1` plus
 *   each configured `YER_*` quote rate (mirroring the admin `/admin/fx/rates`
 *   GET handler shape).
 * - `enabled` is the FX feature-flag boolean from `isFxEnabled`.
 *
 * Requirements:
 * - 2.5: reading a store currency route returns the current FX configuration.
 * - 8.2: store API route exposing the Old Store resource path/method.
 * - 8.3: implemented as a Medusa 2.16 file-based route handler. Store routes are
 *   publishable-key gated and CORS-enabled by the framework's `/store/*`
 *   middleware.
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { loadFxConfig, isFxEnabled, SUPPORTED_CURRENCIES } from "../../../../lib/fx"

/**
 * GET /store/fx/rates
 *
 * Returns the SAR base, the per-quote rate map (always including `SAR: 1` and
 * each configured `YER_*` rate), and the FX feature-flag boolean.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const [cfg, enabled] = await Promise.all([
      loadFxConfig(req.scope),
      isFxEnabled(req.scope),
    ])

    const rates: Record<string, number> = { SAR: 1 }
    for (const code of SUPPORTED_CURRENCIES) {
      if (code === "SAR") {
        continue
      }
      if (typeof cfg.rates[code] === "number") {
        rates[code] = cfg.rates[code]
      }
    }

    return res.status(200).json({ base: "SAR", rates, enabled })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error"
    return res.status(500).json({ message })
  }
}
