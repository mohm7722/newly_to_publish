/**
 * Store FX options route.
 *
 * File-based handler for `GET /store/fx/options`. Exposes the selectable
 * currency list to the Storefront's currency switcher, backed by
 * `store.metadata.currency_fx` via the FX config accessors.
 *
 * The response shape mirrors the Old Store contract exactly:
 * `{ currencies: string[] }`.
 *
 * Requirements:
 * - 2.5: reading a store currency route returns the current FX configuration.
 * - 8.2: store API route exposing the Old Store resource path/method.
 * - 8.3: implemented as a Medusa 2.16 file-based route handler. Store routes are
 *   publishable-key gated and CORS-enabled by the framework's `/store/*`
 *   middleware.
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { loadFxConfig } from "../../../../lib/fx"

/**
 * GET /store/fx/options
 *
 * Returns the enabled currency codes (e.g. `YER_NEW`, `YER_OLD`, `SAR`) offered
 * to customers.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const cfg = await loadFxConfig(req.scope)
    return res.status(200).json({ currencies: cfg.enabled })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error"
    return res.status(500).json({ message })
  }
}
