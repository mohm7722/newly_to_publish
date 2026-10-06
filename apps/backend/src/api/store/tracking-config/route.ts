/**
 * Store tracking-config route.
 *
 * File-based handler for `GET /store/tracking-config`. Exposes only the public
 * client-side tracking identifier the storefront needs at runtime — the GTM
 * container id — plus the master `enabled` flag, backed by
 * `store.metadata.tracking`. This lets an administrator change the GTM id from
 * the admin dashboard and have the storefront pick it up without a redeploy.
 *
 * No secrets are ever returned. Store routes are publishable-key gated and
 * CORS-enabled by the framework's `/store/*` middleware.
 */

import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

import { loadTrackingConfig } from "../../../lib/tracking/config-store"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const cfg = await loadTrackingConfig(req.scope)
    return res.status(200).json({
      enabled: cfg.enabled,
      gtm_id: cfg.enabled ? cfg.gtm_id : "",
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error"
    return res.status(500).json({ message })
  }
}
