import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { toNum } from "../lib/reports/shared"
import {
  dispatchPurchase,
  resolveMetaConfig,
  resolveGa4Config,
  type PurchaseEvent,
  type TrackingItem,
} from "../lib/tracking"

/**
 * order.placed subscriber — server-side ad conversion tracking.
 *
 * On every placed order this dispatches a `Purchase` conversion to Meta
 * (Conversions API) and Google (GA4 Measurement Protocol / Enhanced
 * Conversions), using the order id as the shared `event_id` / `transaction_id`
 * so it deduplicates against the browser Pixel/gtag purchase for the same order.
 *
 * The monetary value is reported in the **original order currency**. The
 * handler is fully failure-isolated: any tracking error is logged and never
 * affects order processing, and it is a no-op when neither provider is
 * configured.
 */
export default async function orderPlacedTrackingHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  // Resolve per-provider config (public ids from DB, secrets from env).
  const [meta, ga4] = await Promise.all([
    resolveMetaConfig(container).catch(() => null),
    resolveGa4Config(container).catch(() => null),
  ])

  // Skip entirely when no provider is configured/enabled.
  if (!meta && !ga4) {
    return
  }

  try {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)

    const {
      data: [order],
    } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "currency_code",
        "total",
        "email",
        "items.product_id",
        "items.title",
        "items.product_title",
        "items.variant_title",
        "items.unit_price",
        "items.quantity",
        "shipping_address.first_name",
        "shipping_address.last_name",
        "shipping_address.city",
        "shipping_address.phone",
        "customer.email",
        "customer.phone",
      ],
      filters: { id: data.id },
    })

    if (!order) {
      return
    }

    const o = order as any

    const items: TrackingItem[] = (o.items ?? []).map((it: any) => ({
      id: (it.product_id as string) || (it.id as string),
      name: it.product_title || it.title || undefined,
      quantity: toNum(it.quantity) || 1,
      price: toNum(it.unit_price) || undefined,
    }))

    const ev: PurchaseEvent = {
      orderId: o.id,
      eventId: o.id,
      currency: String(o.currency_code ?? "").toUpperCase(),
      value: toNum(o.total),
      items,
      email: o.email ?? o.customer?.email ?? null,
      phone: o.shipping_address?.phone ?? o.customer?.phone ?? null,
      firstName: o.shipping_address?.first_name ?? null,
      lastName: o.shipping_address?.last_name ?? null,
      city: o.shipping_address?.city ?? null,
    }

    const results = await dispatchPurchase(ev, { meta, ga4 })

    for (const r of results) {
      if (r.skipped) continue
      if (r.ok) {
        logger.info(
          `[tracking] ${r.provider} purchase sent for order ${o.id} (${r.status})`
        )
      } else {
        logger.warn(
          `[tracking] ${r.provider} purchase failed for order ${o.id}: ${
            r.error ?? r.status
          }`
        )
      }
    }
  } catch (error) {
    logger.error(
      `[tracking] order.placed handler error for ${data.id}: ${
        (error as Error)?.message ?? error
      }`
    )
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
