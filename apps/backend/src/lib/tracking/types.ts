/**
 * Shared types for server-side ad tracking (Meta CAPI + GA4 Measurement
 * Protocol).
 */

/** A purchased line item, in the order's original currency. */
export type TrackingItem = {
  id: string
  name?: string
  quantity?: number
  price?: number
}

/**
 * A normalized purchase event, assembled from a placed order and dispatched to
 * both Meta and Google. `eventId` is the shared deduplication key (the order
 * id) that matches the browser-side Pixel `eventID` / GA4 `transaction_id`.
 *
 * `currency`/`value` are always in the **original order currency** — never a
 * converted display value.
 */
export type PurchaseEvent = {
  orderId: string
  eventId: string
  currency: string
  value: number
  items: TrackingItem[]

  // User-provided data for advanced matching (hashed before transmission).
  email?: string | null
  phone?: string | null
  firstName?: string | null
  lastName?: string | null
  city?: string | null

  // Optional web context (present only when forwarded from the browser).
  clientId?: string | null
  fbp?: string | null
  fbc?: string | null
  eventSourceUrl?: string | null
  clientIpAddress?: string | null
  clientUserAgent?: string | null
}

/** Result of a single provider dispatch. */
export type DispatchResult = {
  provider: "meta" | "ga4"
  ok: boolean
  skipped?: boolean
  status?: number
  error?: string
}
