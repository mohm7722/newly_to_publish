"use client"

import { useEffect, useRef } from "react"
import { HttpTypes } from "@medusajs/types"

import { trackBeginCheckout, type TrackItem } from "@lib/analytics/events"

/**
 * Fires the `begin_checkout` ecommerce event once when the checkout page mounts,
 * using the cart's items, total, and currency.
 */
const BeginCheckoutTracker = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  const hasRun = useRef(false)

  useEffect(() => {
    if (!cart?.id || hasRun.current) {
      return
    }
    hasRun.current = true

    try {
      const items: TrackItem[] = (cart.items ?? []).map((it) => ({
        item_id: (it.product_id as string) || it.id,
        item_name: it.product_title || it.title || "",
        item_variant: it.variant_title || undefined,
        price: Number(it.unit_price) || undefined,
        quantity: Number(it.quantity) || undefined,
      }))

      trackBeginCheckout({
        currency: cart.currency_code,
        value: Number(cart.total) || undefined,
        items,
      })
    } catch (error) {
      console.error(
        "[begin-checkout-tracker] failed to push begin_checkout event",
        error
      )
    }
  }, [cart])

  return null
}

export default BeginCheckoutTracker
