import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { MANUAL_TRANSFER_MODULE } from "../modules/manual-transfer"
import type ManualTransferModuleService from "../modules/manual-transfer/service"

export default async function manualTransferOrderPlaced({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const service = container.resolve<ManualTransferModuleService>(MANUAL_TRANSFER_MODULE)

  const { data: orders } = await query.graph({
    entity: "order",
    fields: ["id", "cart.id"],
    filters: { id: data.id },
  })
  const cartId = (orders?.[0] as any)?.cart?.id
  if (!cartId) return

  const attached = await service.attachOrder(cartId, data.id)
  if (attached) {
    logger.info(`[manual-transfer] attached cart ${cartId} proof to order ${data.id}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
