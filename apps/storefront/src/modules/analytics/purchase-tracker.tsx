"use client"

import { useEffect, useRef } from "react"
import { HttpTypes } from "@medusajs/types"

import { trackPurchase, type TrackItem } from "@lib/analytics/events"

/**
 * Fires the `purchase` ecommerce event exactly once per order per browser
 * session, on the order-confirmed page. Uses the original order currency and
 * the order id as the dedup key, so it deduplicates against the server-side
 * Conversions API / Measurement Protocol purchase for the same order.
 *
 * Guarded against React Strict Mode's double mount (ref) and against reloads in
 * the same tab (`sessionStorage`). Never throws — analytics must not break the
 * confirmation page.
 */
const PurchaseTracker = ({ order }: { order: HttpTypes.StoreOrder }) => {
  const hasRun = useRef(false)

  useEffect(() => {
    if (!order?.id || hasRun.current) {
      return
    }
    hasRun.current = true

    const sessionKey = `purchase-tracked:${order.id}`
    try {
      if (
        typeof window !== "undefined" &&
        window.sessionStorage.getItem(sessionKey)
      ) {
        return
      }
    } catch {
      // sessionStorage unavailable (private mode) — proceed; platform-side
      // dedup by event_id/transaction_id still prevents double counting.
    }

    try {
      const items: TrackItem[] = (order.items ?? []).map((it) => ({
        item_id: (it.product_id as string) || it.id,
        item_name: it.product_title || it.title || "",
        item_variant: it.variant_title || undefined,
        price: Number(it.unit_price) || undefined,
        quantity: Number(it.quantity) || undefined,
      }))

      trackPurchase({
        orderId: order.id,
        currency: order.currency_code,
        value: Number(order.total) || undefined,
        shipping: Number(order.shipping_total) || undefined,
        tax: Number(order.tax_total) || undefined,
        items,
      })

      try {
        window.sessionStorage.setItem(sessionKey, "1")
      } catch {
        // Ignore storage failures; the event push itself succeeded.
      }
    } catch (error) {
      console.error("[purchase-tracker] failed to push purchase event", error)
    }
  }, [order])

  return null
}

export default PurchaseTracker
