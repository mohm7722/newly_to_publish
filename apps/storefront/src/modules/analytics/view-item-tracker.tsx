"use client"

import { useEffect, useRef } from "react"
import { HttpTypes } from "@medusajs/types"

import { trackViewItem } from "@lib/analytics/events"

/**
 * Fires the `view_item` ecommerce event once when a product detail page mounts.
 * Price/value are best-effort from the cheapest variant's calculated price and
 * are omitted when pricing is unavailable; currency comes from the region.
 */
const ViewItemTracker = ({
  product,
  region,
}: {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
}) => {
  const hasRun = useRef(false)

  useEffect(() => {
    if (!product?.id || hasRun.current) {
      return
    }
    hasRun.current = true

    try {
      const prices = (product.variants ?? [])
        .map((v) => v.calculated_price?.calculated_amount)
        .filter((a): a is number => typeof a === "number")
      const value = prices.length > 0 ? Math.min(...prices) : undefined

      trackViewItem({
        currency: region?.currency_code,
        value,
        items: [
          {
            item_id: product.id,
            item_name: product.title || "",
            price: value,
            quantity: 1,
          },
        ],
      })
    } catch (error) {
      console.error("[view-item-tracker] failed to push view_item event", error)
    }
  }, [product, region])

  return null
}

export default ViewItemTracker
