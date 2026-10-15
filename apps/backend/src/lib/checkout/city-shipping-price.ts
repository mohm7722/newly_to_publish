import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { SHIPPING_CITY_MODULE } from "../../modules/shipping-city"
import type ShippingCityModuleService from "../../modules/shipping-city/service"

/**
 * City delivery-price enforcement.
 *
 * ## The problem this solves
 *
 * Delivery is priced per Yemeni governorate by the Shipping_City_Module, but
 * that price is **not** part of the underlying Medusa shipping option. The
 * `GET /store/shipping-options` route overlays the governorate price and label
 * (`توصيل إلى <city>`) on top of a single base option, and the
 * `city-shipping` / `shipping-methods` routes write that amount onto the cart's
 * shipping method directly through the cart module.
 *
 * Medusa does not know about any of that. Every cart mutation that goes through
 * `POST /store/carts/:id`, line-item changes, promo codes, email updates, etc.
 * runs `refreshCartItemsWorkflow`, which runs
 * `refreshCartShippingMethodsWorkflow`. That workflow re-reads the *raw*
 * shipping option through `listShippingOptionsForCartWithPricingWorkflow` and
 * overwrites each shipping method's `amount` **and** `name` with the option's
 * own values — silently discarding the governorate price and label.
 *
 * Two bugs follow from that:
 *
 *  1. **Wrong amount charged.** The order is placed with the base option price
 *     instead of the governorate price (e.g. 10 instead of 15 for عدن), and the
 *     delivery line reverts to the raw option name.
 *  2. **Payment sessions silently deleted.** The reverted price changes the cart
 *     total. `refreshPaymentCollectionForCartWorkflow` then sees
 *     `payment_collection.amount !== cart.total`, takes its mismatch branch and
 *     **deletes every payment session**. The storefront had just created one
 *     (selecting COD / bank transfer), so the shopper ends up with
 *     `metadata.payment_method` set but no pending session — and the checkout
 *     page guard bounces them from `step=review` back to `step=payment`, which
 *     looks like "the continue button does nothing". It only appeared to work
 *     after re-picking a method because the price drift is a one-time event per
 *     cart: the first selection paid for it with its session.
 *
 * ## The fix
 *
 * This helper restores the governorate price and label onto the cart's shipping
 * method. It is invoked from the `beforeRefreshingPaymentCollection` hook of
 * `refreshCartItemsWorkflow`, which runs *after* the shipping-method refresh
 * has clobbered the price and *before* the payment-collection refresh compares
 * amounts — so the total is already correct when that comparison happens, and
 * no payment session is dropped.
 *
 * It writes through the cart module service (not a workflow), so it cannot
 * re-trigger `refreshCartItemsWorkflow` and cannot recurse.
 *
 * Idempotent and conservative: it is a no-op unless the cart resolves to an
 * active shipping city, has a shipping method, and that method's amount or name
 * actually drifted.
 */

export type CityPriceScope = { resolve: <T = unknown>(key: string) => T }

/** Normalize a value for trimmed, Arabic-aware case-insensitive comparison. */
const normalize = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLocaleLowerCase("ar")

const toNumber = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0
  if (typeof value === "string") return Number(value) || 0
  if (value && typeof value === "object") {
    const numeric = Number(value)
    if (Number.isFinite(numeric)) return numeric
    const raw = value as { value?: unknown; numeric_?: unknown }
    return toNumber(raw.value ?? raw.numeric_)
  }
  return 0
}

/** Build the customer-facing delivery label for a governorate. */
export const cityShippingLabel = (cityName: string) => `توصيل إلى ${cityName}`

export type EnforceResult = {
  /** Whether a drifted shipping method was corrected. */
  corrected: boolean
  /** Why nothing was done, for logging. */
  reason?: string
}

/**
 * Re-apply the resolved governorate delivery price and label to a cart's
 * shipping method.
 *
 * @param scope Container scope used to resolve the query, cart and city modules.
 * @param cartId The cart to correct.
 */
export async function enforceCityShippingPrice(
  scope: CityPriceScope,
  cartId: string
): Promise<EnforceResult> {
  if (!cartId) {
    return { corrected: false, reason: "no cart id" }
  }

  const query = scope.resolve<any>(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "cart",
    filters: { id: cartId },
    fields: [
      "id",
      "metadata",
      "shipping_address.city",
      "shipping_methods.id",
      "shipping_methods.name",
      "shipping_methods.amount",
    ],
  })

  const cart = data?.[0]
  if (!cart) {
    return { corrected: false, reason: "cart not found" }
  }

  const methods = Array.isArray(cart.shipping_methods)
    ? cart.shipping_methods
    : []
  if (!methods.length) {
    // Address step: nothing to price yet.
    return { corrected: false, reason: "no shipping methods" }
  }

  const metadata = (cart.metadata ?? {}) as Record<string, unknown>
  const cityId = metadata.city_id as string | undefined
  const cityName =
    (metadata.city_name as string | undefined) ?? cart.shipping_address?.city

  if (!cityId && !cityName) {
    // Cart is not part of the city-shipping flow — leave Medusa's pricing alone.
    return { corrected: false, reason: "no city on cart" }
  }

  const cityService =
    scope.resolve<ShippingCityModuleService>(SHIPPING_CITY_MODULE)
  const cities = (await cityService.listAll()) as Array<Record<string, unknown>>
  const city = cities.find(
    (item) =>
      item.is_active === true &&
      ((cityId && item.id === cityId) ||
        (cityName && normalize(item.city) === normalize(cityName)))
  )

  if (!city) {
    // Inactive or unknown city: do not invent a price.
    return { corrected: false, reason: "city not active" }
  }

  const expectedAmount = toNumber(city.delivery_price)
  const expectedName = cityShippingLabel(String(city.city))

  // Identify the delivery method this price belongs to. The stored id is the
  // authoritative match, because the refresh may already have overwritten the
  // name (so matching on the label alone is not reliable).
  const storedMethodId = metadata.city_shipping_method_id as string | undefined
  const method =
    methods.find((item: any) => item.id === storedMethodId) ??
    methods.find((item: any) => normalize(item.name) === normalize(expectedName)) ??
    (methods.length === 1 ? methods[0] : undefined)

  if (!method?.id) {
    return { corrected: false, reason: "city shipping method not identifiable" }
  }

  const currentAmount = toNumber(method.amount)
  const amountDrifted = Math.abs(currentAmount - expectedAmount) > 0.001
  const nameDrifted = String(method.name ?? "") !== expectedName

  if (!amountDrifted && !nameDrifted) {
    return { corrected: false, reason: "already correct" }
  }

  const cartService = scope.resolve<any>(Modules.CART)
  await cartService.updateShippingMethods([
    {
      id: method.id,
      amount: expectedAmount,
      name: expectedName,
    },
  ])

  return { corrected: true }
}
