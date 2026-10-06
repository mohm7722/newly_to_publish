/**
 * Resolved, dispatch-ready configuration for server-side ad tracking.
 *
 * Public identifiers come from the database (`store.metadata.tracking`, editable
 * from the admin dashboard); **secrets come only from environment variables**.
 * A provider is considered configured only when its public id (DB, or env
 * fallback) AND its secret env credential are both present, and the master
 * `enabled` switch is on. When not configured, the corresponding dispatch is
 * skipped so the feature stays inert.
 */

import { loadTrackingConfig, type TrackingScope } from "./config-store"

/** Meta Conversions API configuration. */
export type MetaConfig = {
  pixelId: string
  accessToken: string
  apiVersion: string
  testEventCode?: string
}

/** GA4 Measurement Protocol configuration. */
export type Ga4Config = {
  measurementId: string
  apiSecret: string
}

/**
 * Resolve Meta CAPI config: pixel id + api version + test code from the DB
 * (env fallback), access token from env. Null when disabled or incomplete.
 */
export async function resolveMetaConfig(
  scope: TrackingScope
): Promise<MetaConfig | null> {
  const cfg = await loadTrackingConfig(scope)
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN
  if (!cfg.enabled || !cfg.meta_pixel_id || !accessToken) {
    return null
  }
  return {
    pixelId: cfg.meta_pixel_id,
    accessToken,
    apiVersion: cfg.meta_api_version || "v19.0",
    testEventCode: cfg.meta_test_event_code || undefined,
  }
}

/**
 * Resolve GA4 Measurement Protocol config: measurement id from the DB (env
 * fallback), api secret from env. Null when disabled or incomplete.
 */
export async function resolveGa4Config(
  scope: TrackingScope
): Promise<Ga4Config | null> {
  const cfg = await loadTrackingConfig(scope)
  const apiSecret = process.env.GA4_API_SECRET
  if (!cfg.enabled || !cfg.ga4_measurement_id || !apiSecret) {
    return null
  }
  return {
    measurementId: cfg.ga4_measurement_id,
    apiSecret,
  }
}
