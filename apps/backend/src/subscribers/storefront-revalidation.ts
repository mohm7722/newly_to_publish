import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

const CATALOG_TAGS = ["products", "categories", "collections"]

/** Invalidate storefront catalog caches after catalog or pricing changes. */
export default async function storefrontRevalidationHandler({
  event,
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const url = process.env.STOREFRONT_REVALIDATE_URL
  const secret = process.env.STOREFRONT_REVALIDATE_SECRET

  if (!url || !secret) {
    logger.warn(
      "[storefront-revalidation] skipped: URL or secret is not configured"
    )
    return
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${secret}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ tags: CATALOG_TAGS }),
      signal: AbortSignal.timeout(5_000),
    })

    if (!response.ok) {
      throw new Error(`storefront returned HTTP ${response.status}`)
    }
  } catch (error) {
    logger.error(
      `[storefront-revalidation] failed for ${event.name} ${event.data.id}: ${
        (error as Error)?.message ?? error
      }`
    )
    throw error
  }
}

export const config: SubscriberConfig = {
  event: [
    "product.created",
    "product.updated",
    "product.deleted",
    "product-variant.created",
    "product-variant.updated",
    "product-variant.deleted",
    "product-category.created",
    "product-category.updated",
    "product-category.deleted",
    "product-collection.created",
    "product-collection.updated",
    "product-collection.deleted",
    "pricing.price.created",
    "pricing.price.updated",
    "pricing.price.deleted",
    "pricing.price.restored",
    "pricing.price-list.created",
    "pricing.price-list.updated",
    "pricing.price-list.deleted",
    "pricing.price-list.restored",
  ],
}
