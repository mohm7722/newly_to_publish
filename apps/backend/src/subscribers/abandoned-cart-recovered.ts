import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { ABANDONED_CART_MODULE } from "../modules/abandoned-cart"
import type AbandonedCartModuleService from "../modules/abandoned-cart/service"

/**
 * order.placed subscriber — abandoned-cart recovery tracking.
 *
 * When an order is placed, the cart it originated from has been "recovered".
 * We resolve the originating cart through the core order↔cart link and, if a
 * reminder record exists for that cart, flag it `recovered = true`. This powers
 * a basic recovery-rate report (reminded carts vs. recovered carts) without
 * ever mutating core data.
 */
export default async function abandonedCartRecoveredHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const abandonedCartService = container.resolve<AbandonedCartModuleService>(
    ABANDONED_CART_MODULE
  )

  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    fields: ["id", "cart.id"],
    filters: { id: data.id },
  })

  const cartId = order?.cart?.id
  if (!cartId) {
    return
  }

  const updated = await abandonedCartService.markRecovered(cartId)
  if (updated) {
    logger.info(
      `[abandoned-cart] cart ${cartId} recovered via order ${data.id}`
    )
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
