/**
 * Store-metadata accessors for the tracking configuration.
 *
 * The **public**, non-secret tracking identifiers (GTM container id, Meta Pixel
 * id, GA4 Measurement id) are persisted in `store.metadata.tracking` — i.e. in
 * the database — so an administrator can edit them from the admin dashboard
 * without a redeploy. This mirrors the FX config pattern (`lib/fx/config.ts`)
 * and adds no new table (schema-safe).
 *
 * **Secrets** (`META_CAPI_ACCESS_TOKEN`, `GA4_API_SECRET`) are deliberately NOT
 * stored here — they remain in environment variables and are only ever surfaced
 * as a boolean "configured?" status (see `getSecretStatus`).
 *
 * Environment values act as fallbacks for the public ids, so existing env-only
 * setups keep working; a value saved in the database takes precedence.
 */

import { Modules } from "@medusajs/framework/utils"
import type { IStoreModuleService } from "@medusajs/framework/types"

/** Scope capable of resolving the core Store module service. */
export type TrackingScope = { resolve: <T = unknown>(key: string) => T }

/** Metadata namespace under which the tracking config is stored. */
const TRACKING_METADATA_KEY = "tracking"

/** Public, editable tracking configuration (safe to store in the DB). */
export type TrackingConfig = {
  /** Master on/off switch for all tracking. */
  enabled: boolean
  /** Google Tag Manager container id (e.g. `GTM-XXXXXXX`). */
  gtm_id: string
  /** Meta Pixel id (used by the server Conversions API). */
  meta_pixel_id: string
  /** Meta Graph API version for the Conversions API. */
  meta_api_version: string
  /** Optional Meta test-event code (Events Manager "Test events" tab). */
  meta_test_event_code: string
  /** GA4 Measurement id (e.g. `G-XXXXXXXXXX`). */
  ga4_measurement_id: string
}

type StoreMetadata = Record<string, unknown>

function getStoreModule(scope: TrackingScope): IStoreModuleService {
  return scope.resolve<IStoreModuleService>(Modules.STORE)
}

async function loadStore(
  scope: TrackingScope
): Promise<{ id: string; metadata: StoreMetadata | null }> {
  const storeModule = getStoreModule(scope)
  const stores = await storeModule.listStores({}, { take: 1 })
  if (!Array.isArray(stores) || stores.length === 0) {
    throw new Error("No Store found")
  }
  const store = stores[0]
  return {
    id: store.id,
    metadata: (store.metadata ?? null) as StoreMetadata | null,
  }
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

/**
 * Normalize a raw tracking metadata blob into a complete {@link TrackingConfig},
 * falling back to environment variables for any unset public id.
 */
function normalizeTrackingConfig(raw: unknown): TrackingConfig {
  const t = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>

  return {
    enabled: typeof t.enabled === "boolean" ? t.enabled : true,
    gtm_id: str(t.gtm_id) || str(process.env.GTM_ID),
    meta_pixel_id: str(t.meta_pixel_id) || str(process.env.META_PIXEL_ID),
    meta_api_version:
      str(t.meta_api_version) || str(process.env.META_API_VERSION) || "v19.0",
    meta_test_event_code:
      str(t.meta_test_event_code) || str(process.env.META_TEST_EVENT_CODE),
    ga4_measurement_id:
      str(t.ga4_measurement_id) || str(process.env.GA4_MEASUREMENT_ID),
  }
}

/** Load the current tracking config (DB values, env fallbacks). */
export async function loadTrackingConfig(
  scope: TrackingScope
): Promise<TrackingConfig> {
  const store = await loadStore(scope)
  return normalizeTrackingConfig(store.metadata?.[TRACKING_METADATA_KEY])
}

/**
 * Merge `next` public fields into the stored tracking config and persist it,
 * leaving every other `store.metadata` key untouched. Secret env values are
 * never written here.
 */
export async function saveTrackingConfig(
  scope: TrackingScope,
  next: Partial<TrackingConfig>
): Promise<TrackingConfig> {
  const store = await loadStore(scope)
  const current = normalizeTrackingConfig(store.metadata?.[TRACKING_METADATA_KEY])

  const merged: TrackingConfig = {
    enabled: next.enabled ?? current.enabled,
    gtm_id: next.gtm_id !== undefined ? str(next.gtm_id) : current.gtm_id,
    meta_pixel_id:
      next.meta_pixel_id !== undefined
        ? str(next.meta_pixel_id)
        : current.meta_pixel_id,
    meta_api_version:
      next.meta_api_version !== undefined
        ? str(next.meta_api_version) || "v19.0"
        : current.meta_api_version,
    meta_test_event_code:
      next.meta_test_event_code !== undefined
        ? str(next.meta_test_event_code)
        : current.meta_test_event_code,
    ga4_measurement_id:
      next.ga4_measurement_id !== undefined
        ? str(next.ga4_measurement_id)
        : current.ga4_measurement_id,
  }

  const storeModule = getStoreModule(scope)
  await storeModule.updateStores(store.id, {
    metadata: {
      ...(store.metadata ?? {}),
      [TRACKING_METADATA_KEY]: merged,
    },
  })
  return merged
}

/** Presence (not value) of the secret env credentials. */
export type SecretStatus = {
  meta_capi_access_token: boolean
  ga4_api_secret: boolean
}

/** Report which secret env credentials are configured, without revealing them. */
export function getSecretStatus(): SecretStatus {
  return {
    meta_capi_access_token: Boolean(process.env.META_CAPI_ACCESS_TOKEN),
    ga4_api_secret: Boolean(process.env.GA4_API_SECRET),
  }
}
