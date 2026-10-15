import { refreshCartItemsWorkflow } from "@medusajs/medusa/core-flows"
import { enforceCityShippingPrice } from "../../lib/checkout/city-shipping-price"

/**
 * Keep the governorate delivery price attached to the cart on every refresh.
 *
 * `refreshCartItemsWorkflow` runs on effectively every cart mutation (cart
 * updates, line-item changes, promo codes, email, region). Internally it runs
 * `refreshCartShippingMethodsWorkflow`, which re-reads the raw Medusa shipping
 * option and overwrites the shipping method's `amount` and `name` — wiping the
 * per-governorate delivery price this store applies on top of a single base
 * option.
 *
 * This hook is the correct seam to repair that: it is declared in the workflow
 * *after* the shipping-method refresh and *before*
 * `refreshPaymentCollectionForCartWorkflow`. Restoring the price here means:
 *
 *  - the order is charged the governorate price, not the base option price; and
 *  - the cart total still matches `payment_collection.amount` when the payment
 *    collection is refreshed, so the shopper's freshly created payment session
 *    is **not** deleted. Without this, the first offline payment selection
 *    (COD / bank transfer) on a cart always lost its session, and the checkout
 *    page guard redirected `step=review` back to `step=payment` — the "continue
 *    to review does nothing until I switch payment methods and switch back"
 *    symptom.
 *
 * Failures are logged and swallowed: a pricing repair must never take down a
 * cart update. If it is skipped, the pre-existing `reconcileCheckoutShipping`
 * call on the custom city routes still corrects the cart on the next step.
 */
refreshCartItemsWorkflow.hooks.beforeRefreshingPaymentCollection(
  async ({ input }, { container }) => {
    const cartId = (input as { cart_id?: string } | undefined)?.cart_id

    if (!cartId) {
      return
    }

    try {
      await enforceCityShippingPrice(container, cartId)
    } catch (error) {
      const logger = container.resolve("logger") as {
        warn: (msg: string) => void
      }
      logger.warn(
        `[city-shipping] failed to re-apply the city delivery price to cart ${cartId}: ${
          (error as Error)?.message ?? error
        }`
      )
    }
  }
)
