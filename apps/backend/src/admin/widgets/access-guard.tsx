import { defineWidgetConfig } from "@medusajs/admin-sdk"
import AccessGuard from "../components/access-guard"

/**
 * Mounts the {@link AccessGuard} (cosmetic nav-hiding + no-access redirect) on
 * every core page that exposes an injection zone — both `*.list.before` and
 * `*.details.before` across catalog, sales, customers, marketing, pricing,
 * inventory, fulfillment and the settings pages (store/region/tax/user/profile/
 * api-keys/sales-channels/…).
 *
 * The admin SDK has no single global zone, so we register across all primary
 * content zones to maximize coverage. Because the sidebar persists across
 * client-side navigation, the guard's nav-hiding carries through the session,
 * and a no-role user is redirected to `/no-access` as soon as they land on any
 * of these pages. Authorization itself is always enforced server-side.
 */
const AccessGuardWidget = () => {
  return <AccessGuard />
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
    "shipping_option_type.details.before",
    "shipping_option_type.list.before",
    "product_tag.details.before",
    "product_tag.list.before",
    "price_list.details.before",
    "price_list.list.before",
    "promotion.details.before",
    "promotion.list.before",
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
    "workflow.details.before",
    "workflow.list.before",
    "campaign.details.before",
    "campaign.list.before",
    "tax.details.before",
    "tax.list.before",
    "return_reason.list.before",
    "refund_reason.list.before",
    "inventory_item.details.before",
    "inventory_item.list.before",
    "role.details.before",
    "role.list.before",
    "policy.details.before",
    "policy.list.before",
    "draft_order.details.before",
    "draft_order.list.before",
    "store_credit_account.details.before",
    "store_credit_account.list.before",
    "gift_card.details.before",
    "gift_card.list.before",
    "gift_card_product.details.before",
    "gift_card_product.list.before",
  ],
})

export default AccessGuardWidget
