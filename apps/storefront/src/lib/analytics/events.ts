/**
 * Standardized ecommerce event builders (client-side).
 *
 * Each helper pushes a GA4-shaped ecommerce event onto the dataLayer. The GTM
 * container maps these to both the GA4 tag (native `items`/`value`/`currency`
 * schema) and the Meta Pixel tag (Meta reads the same fields plus the top-level
 * `event_id` as the Pixel `eventID`, so browser and server events deduplicate).
 *
 * Currency policy: every monetary event carries the currency of its own
 * context — the region/cart currency for funnel events and the **original order
 * currency** for purchases — never a converted display value.
 */

import { clearEcommerce, pushToDataLayer } from "./gtm"

/** A single line item in GA4 ecommerce shape. */
export type TrackItem = {
  item_id: string
  item_name: string
  item_variant?: string
  price?: number
  quantity?: number
}

/** Drop `undefined` fields so events stay clean. */
function compactItem(item: TrackItem): TrackItem {
  const out: TrackItem = { item_id: item.item_id, item_name: item.item_name }
  if (item.item_variant) out.item_variant = item.item_variant
  if (typeof item.price === "number") out.price = item.price
  if (typeof item.quantity === "number") out.quantity = item.quantity
  return out
}

function currencyUpper(currency?: string | null): string | undefined {
  const c = (currency ?? "").toUpperCase()
  return c.length > 0 ? c : undefined
}

/** `view_item` — a product detail page view. */
export function trackViewItem(params: {
  currency?: string | null
  value?: number
  items: TrackItem[]
}): void {
  clearEcommerce()
  pushToDataLayer({
    event: "view_item",
    ecommerce: {
      currency: currencyUpper(params.currency),
      value: params.value,
      items: params.items.map(compactItem),
    },
  })
}

/** `add_to_cart` — a variant added to the cart. */
export function trackAddToCart(params: {
  currency?: string | null
  value?: number
  items: TrackItem[]
}): void {
  clearEcommerce()
  pushToDataLayer({
    event: "add_to_cart",
    ecommerce: {
      currency: currencyUpper(params.currency),
      value: params.value,
      items: params.items.map(compactItem),
    },
  })
}

/** `begin_checkout` — the checkout flow was entered. */
export function trackBeginCheckout(params: {
  currency?: string | null
  value?: number
  items: TrackItem[]
}): void {
  clearEcommerce()
  pushToDataLayer({
    event: "begin_checkout",
    ecommerce: {
      currency: currencyUpper(params.currency),
      value: params.value,
      items: params.items.map(compactItem),
    },
  })
}

/**
 * `purchase` — an order was placed.
 *
 * `transaction_id` (GA4) and the top-level `event_id` (Meta `eventID`) are both
 * set to the order id, so this browser event deduplicates against the
 * server-side Conversions API / Measurement Protocol events for the same order.
 */
export function trackPurchase(params: {
  orderId: string
  currency?: string | null
  value?: number
  shipping?: number
  tax?: number
  items: TrackItem[]
}): void {
  clearEcommerce()
  pushToDataLayer({
    event: "purchase",
    // Shared dedup key for the Meta Pixel `eventID`.
    event_id: params.orderId,
    ecommerce: {
      transaction_id: params.orderId,
      currency: currencyUpper(params.currency),
      value: params.value,
      shipping: params.shipping,
      tax: params.tax,
      items: params.items.map(compactItem),
    },
  })
}
