import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useEffect } from "react"

/**
 * Injects global RTL correction styles into the admin.
 *
 * Why this exists:
 * - When the panel language is Arabic, the document direction becomes `rtl`.
 * - The Medusa UI `Switch` positions its thumb with `inline-flex` + a positive
 *   `translateX`. Under `dir="rtl"` the flex main-axis starts on the right, so
 *   the positive translate pushes the thumb outside the track and the toggle
 *   renders incorrectly.
 * - A toggle is direction-agnostic, so we force the switch control back to LTR.
 *   This restores the intended flex-start + translateX layout without touching
 *   surrounding RTL content.
 *
 * The admin SDK has no single global zone, so — like the access guard — we
 * register across all primary content zones. The style is appended to
 * `document.head` once and persists across client-side navigation for the whole
 * session (including route modals such as "Create Draft Order").
 */
const STYLE_ID = "rtl-fixes-global"

const RTL_CSS = `
/* Keep toggle switches rendering LTR so the thumb stays inside the track. */
[dir="rtl"] [role="switch"] {
  direction: ltr;
}
`

const RtlFixesWidget = () => {
  useEffect(() => {
    if (typeof document === "undefined") {
      return
    }
    if (document.getElementById(STYLE_ID)) {
      return
    }
    const style = document.createElement("style")
    style.id = STYLE_ID
    style.textContent = RTL_CSS
    document.head.appendChild(style)
  }, [])

  return null
}

export const config = defineWidgetConfig({
  zone: [
    "order.details.before",
    "order.list.before",
    "customer.details.before",
    "customer.list.before",
    "customer_group.details.before",
    "customer_group.list.before",
    "product.details.before",
    "product.list.before",
    "product_variant.details.before",
    "product_collection.details.before",
    "product_collection.list.before",
    "product_category.details.before",
    "product_category.list.before",
    "product_type.details.before",
    "product_type.list.before",
    "product_tag.details.before",
    "product_tag.list.before",
    "price_list.details.before",
    "price_list.list.before",
    "promotion.details.before",
    "promotion.list.before",
    "campaign.details.before",
    "campaign.list.before",
    "user.details.before",
    "user.list.before",
    "store.details.before",
    "profile.details.before",
    "region.details.before",
    "region.list.before",
    "shipping_profile.details.before",
    "shipping_profile.list.before",
    "location.details.before",
    "location.list.before",
    "sales_channel.details.before",
    "sales_channel.list.before",
    "reservation.details.before",
    "reservation.list.before",
    "api_key.details.before",
    "api_key.list.before",
    "tax.details.before",
    "tax.list.before",
    "inventory_item.details.before",
    "inventory_item.list.before",
    "draft_order.details.before",
    "draft_order.list.before",
  ],
})

export default RtlFixesWidget
