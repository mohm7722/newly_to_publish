import "server-only"

/**
 * Server-side resolver for the storefront GTM container id.
 *
 * The public GTM id is managed in the admin dashboard and stored in the
 * database; the storefront fetches it at runtime from the backend store route
 * `GET /store/tracking-config` so changes take effect without a redeploy. The
 * build-time `NEXT_PUBLIC_GTM_ID` env var is used as a fallback when the request
 * fails or returns nothing.
 */

import { sdk } from "@lib/config"

import { GTM_ID as ENV_GTM_ID } from "./gtm"

type TrackingConfigResponse = {
  enabled?: boolean
  gtm_id?: string
}

/**
 * Resolve the effective GTM container id (DB value first, env fallback). Returns
 * an empty string when tracking is disabled or unconfigured, in which case no
 * GTM scripts are injected.
 */
export async function getStorefrontGtmId(): Promise<string> {
  try {
    const data = await sdk.client.fetch<TrackingConfigResponse>(
      `/store/tracking-config`,
      { method: "GET", cache: "no-store" }
    )
    if (data?.enabled === false) {
      return ""
    }
    const id = (data?.gtm_id ?? "").trim()
    if (id) {
      return id
    }
  } catch {
    // Fall back to the build-time env value below.
  }
  return ENV_GTM_ID
}
