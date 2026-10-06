/**
 * Store-metadata FX configuration accessors.
 *
 * Reads and writes the FX configuration stored under
 * `store.metadata.currency_fx` via the core Store module service, preserving
 * the Old Store metadata shape (`{ enabled, default, rates, logs }`) for data
 * continuity. Replaces the Old Store `api/admin/utils/currency-fx.ts` helpers.
 *
 * All writes preserve every other `store.metadata` key untouched and only
 * modify the `currency_fx` namespace.
 */

import { Modules } from "@medusajs/framework/utils"
import type { IStoreModuleService } from "@medusajs/framework/types"

import type { FxConfig, FxLog } from "./types"

/**
 * The Medusa request/container scope. Only the `resolve` capability is required
 * to obtain the core Store module service.
 */
export type FxScope = { resolve: <T = unknown>(key: string) => T }

/** Metadata namespace under which the FX configuration is stored. */
const FX_METADATA_KEY = "currency_fx"

/** Defaults mirror the Old Store `ensureDefaults` behavior. */
const DEFAULT_ENABLED: string[] = ["SAR", "YER_OLD", "YER_NEW"]
const DEFAULT_CURRENCY = "SAR"

/** Maximum number of audit log entries retained (newest-first). */
const MAX_LOGS = 500

type StoreMetadata = Record<string, unknown>

function getStoreModule(scope: FxScope): IStoreModuleService {
  return scope.resolve<IStoreModuleService>(Modules.STORE)
}

/**
 * Load the singleton store record. Throws when no store exists, mirroring the
 * Old Store `loadStore` behavior.
 */
async function loadStore(
  scope: FxScope
): Promise<{ id: string; metadata: StoreMetadata | null }> {
  const storeModule = getStoreModule(scope)
  const stores = await storeModule.listStores({}, { take: 1 })
  if (!Array.isArray(stores) || stores.length === 0) {
    throw new Error("No Store found")
  }
  const store = stores[0]
  return { id: store.id, metadata: (store.metadata ?? null) as StoreMetadata | null }
}

/**
 * Normalize a raw FX metadata blob into a complete `FxConfig`, filling in
 * sensible defaults for any missing or malformed field.
 */
function normalizeFxConfig(raw: unknown): FxConfig {
  const fx = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>

  const enabled = Array.isArray(fx.enabled)
    ? (fx.enabled as unknown[]).filter((c): c is string => typeof c === "string")
    : [...DEFAULT_ENABLED]

  const def = typeof fx.default === "string" ? (fx.default as string) : DEFAULT_CURRENCY

  const rates =
    fx.rates && typeof fx.rates === "object" && !Array.isArray(fx.rates)
      ? ({ ...(fx.rates as Record<string, number>) } as Record<string, number>)
      : ({} as Record<string, number>)

  const logs = Array.isArray(fx.logs) ? ([...(fx.logs as FxLog[])] as FxLog[]) : []

  return { enabled, default: def, rates, logs }
}

/**
 * Persist the FX config back into `store.metadata.currency_fx`, leaving all
 * other metadata keys untouched.
 */
async function saveFxMetadata(
  scope: FxScope,
  storeId: string,
  existingMetadata: StoreMetadata | null,
  fx: FxConfig
): Promise<void> {
  const storeModule = getStoreModule(scope)
  const metadata: StoreMetadata = {
    ...(existingMetadata ?? {}),
    [FX_METADATA_KEY]: fx,
  }
  await storeModule.updateStores(storeId, { metadata })
}

/**
 * Read the current FX configuration from `store.metadata.currency_fx`. Returns
 * sensible defaults when the metadata is absent or incomplete.
 */
export async function loadFxConfig(scope: FxScope): Promise<FxConfig> {
  const store = await loadStore(scope)
  return normalizeFxConfig(store.metadata?.[FX_METADATA_KEY])
}

/**
 * Merge `next` into the current FX configuration and persist it, returning the
 * persisted config. Only the provided fields are overwritten; omitted fields
 * retain their current values.
 *
 * An `actor` may be supplied to attribute the change; it is currently used only
 * by `writeRate` for audit logging but is accepted here for signature parity.
 */
export async function saveFxConfig(
  scope: FxScope,
  next: Partial<FxConfig>,
  _actor?: string
): Promise<FxConfig> {
  const store = await loadStore(scope)
  const current = normalizeFxConfig(store.metadata?.[FX_METADATA_KEY])

  const merged: FxConfig = {
    enabled: next.enabled ?? current.enabled,
    default: next.default ?? current.default,
    rates: next.rates ? { ...current.rates, ...next.rates } : current.rates,
    logs: next.logs ?? current.logs,
  }

  await saveFxMetadata(scope, store.id, store.metadata, merged)
  return merged
}

/**
 * Update a single quote currency's rate and append an audit log entry to
 * `logs`, then persist. The new log entry records the previous rate (`old`,
 * or `null` if none existed), the actor, the quote, the new rate, and a
 * timestamp. Returns the persisted FX configuration.
 */
export async function writeRate(
  scope: FxScope,
  quote: string,
  rate: number,
  actor?: string
): Promise<FxConfig> {
  const store = await loadStore(scope)
  const current = normalizeFxConfig(store.metadata?.[FX_METADATA_KEY])

  const old: number | null =
    typeof current.rates[quote] === "number" ? current.rates[quote] : null

  const entry: FxLog = {
    at: new Date().toISOString(),
    by: actor || "unknown",
    quote,
    old,
    rate,
  }

  const updated: FxConfig = {
    ...current,
    rates: { ...current.rates, [quote]: rate },
    logs: [entry, ...current.logs].slice(0, MAX_LOGS),
  }

  await saveFxMetadata(scope, store.id, store.metadata, updated)
  return updated
}

/**
 * The FX feature flag. Mirrors the Old Store `feature-flags.ts` behavior: the
 * flag is on when an FX configuration is present in store metadata (the
 * `currency_fx` namespace exists with a non-empty `enabled` list) OR the
 * `FF_FX` environment variable is truthy.
 */
export async function isFxEnabled(scope: FxScope): Promise<boolean> {
  if (isFxEnvFlagOn()) {
    return true
  }
  const store = await loadStore(scope)
  return hasFxMetadata(store.metadata?.[FX_METADATA_KEY])
}

/**
 * Synchronous variant of the FX feature flag for callers that already hold the
 * store's metadata (e.g. inside a route handler that just loaded the store).
 */
export function isFxEnabledFromMetadata(metadata: StoreMetadata | null | undefined): boolean {
  return isFxEnvFlagOn() || hasFxMetadata(metadata?.[FX_METADATA_KEY])
}

function isFxEnvFlagOn(): boolean {
  const v = process.env.FF_FX
  if (!v) {
    return false
  }
  const normalized = v.trim().toLowerCase()
  return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "on"
}

function hasFxMetadata(raw: unknown): boolean {
  if (!raw || typeof raw !== "object") {
    return false
  }
  const fx = raw as Record<string, unknown>
  return Array.isArray(fx.enabled) && fx.enabled.length > 0
}
