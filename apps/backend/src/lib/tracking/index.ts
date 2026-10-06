/**
 * Server-side ad tracking library.
 *
 * Barrel for the Meta Conversions API and GA4 Measurement Protocol dispatchers,
 * the DB/env configuration resolvers, and a small orchestrator that fans a
 * purchase out to both providers in parallel. Both providers are independently
 * optional (skipped when their resolved config is null), and every dispatch is
 * failure-isolated so tracking never affects order processing.
 */

import { sendMetaPurchase } from "./meta-capi"
import { sendGa4Purchase } from "./ga4-mp"
import type { MetaConfig, Ga4Config } from "./config"
import type { DispatchResult, PurchaseEvent } from "./types"

export * from "./types"
export * from "./config"
export * from "./config-store"
export { sendMetaPurchase } from "./meta-capi"
export { sendGa4Purchase } from "./ga4-mp"

/**
 * Dispatch a purchase to Meta CAPI and GA4 MP concurrently, using the resolved
 * per-provider configs. A null config means that provider is not configured and
 * is reported as `skipped`. Never throws: each provider result is returned for
 * logging.
 */
export async function dispatchPurchase(
  ev: PurchaseEvent,
  configs: { meta: MetaConfig | null; ga4: Ga4Config | null }
): Promise<DispatchResult[]> {
  const tasks: Array<Promise<DispatchResult>> = [
    configs.meta
      ? sendMetaPurchase(ev, configs.meta)
      : Promise.resolve<DispatchResult>({ provider: "meta", ok: false, skipped: true }),
    configs.ga4
      ? sendGa4Purchase(ev, configs.ga4)
      : Promise.resolve<DispatchResult>({ provider: "ga4", ok: false, skipped: true }),
  ]

  const results = await Promise.allSettled(tasks)

  return results.map((r, i) => {
    if (r.status === "fulfilled") {
      return r.value
    }
    return {
      provider: i === 0 ? "meta" : "ga4",
      ok: false,
      error: (r.reason as Error)?.message ?? "dispatch_failed",
    } as DispatchResult
  })
}
