/**
 * Google Tag Manager / dataLayer plumbing for the storefront.
 *
 * GTM is the single container that loads and manages the client-side Meta Pixel
 * and the GA4 tag. Application code never talks to Meta/Google directly on the
 * client — it only pushes standardized ecommerce events onto `window.dataLayer`,
 * and the GTM container (configured in the GTM UI) fans them out to each tag.
 *
 * Server-side tracking (Meta Conversions API + GA4 Measurement Protocol) is
 * handled separately in the backend, deduplicated against these client events
 * via a shared `event_id` (the order id for purchases).
 */

/** GTM container id (e.g. `GTM-XXXXXXX`). Tracking is inert when unset. */
export const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID || ""

/** Whether GTM is configured for this environment. */
export const isGtmEnabled = (): boolean => GTM_ID.length > 0

/** A generic dataLayer record. */
export type DataLayerObject = Record<string, unknown>

type DataLayerWindow = Window & { dataLayer?: DataLayerObject[] }

/**
 * Push an object onto `window.dataLayer`, creating it if needed. No-op on the
 * server (SSR) and safe to call whether or not GTM is installed — the push is
 * simply buffered until the container loads.
 */
export function pushToDataLayer(obj: DataLayerObject): void {
  if (typeof window === "undefined") {
    return
  }
  const w = window as DataLayerWindow
  w.dataLayer = w.dataLayer || []
  w.dataLayer.push(obj)
}

/**
 * Clear the previous `ecommerce` object before pushing a new ecommerce event,
 * as recommended by GA4 so values from a prior event never leak into the next.
 */
export function clearEcommerce(): void {
  pushToDataLayer({ ecommerce: null })
}
