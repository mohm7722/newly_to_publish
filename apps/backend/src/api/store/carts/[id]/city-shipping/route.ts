import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import {
  deletePaymentSessionsWorkflow,
  updateCartWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  loadCheckoutCart,
  reconcileCheckoutShipping,
  resolveActiveCheckoutCity,
} from "../../../../utils/checkout"
import { requestActorId, resolveCartAccess } from "../../../../utils/cart-access"
import { cityShippingLabel } from "../../../../../lib/checkout/city-shipping-price"

type AddressInput = Record<string, unknown>
type CityShippingBody = {
  city_id?: string
  city_name?: string
  reconcile?: boolean
  cart?: {
    email?: unknown
    shipping_address?: AddressInput
  }
}

const text = (value: unknown) =>
  typeof value === "string" ? value.trim() : ""

const sanitizeAddress = (
  input: AddressInput | undefined,
  cityName: string
) => {
  if (!input) return undefined
  return {
    first_name: text(input.first_name),
    last_name: text(input.last_name),
    address_1: text(input.address_1),
    address_2: text(input.address_2),
    city: cityName,
    country_code: text(input.country_code).toLowerCase(),
    province: text(input.province),
    phone: text(input.phone),
  }
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const cartId = req.params.id
  const body = (req.body ?? {}) as CityShippingBody

  try {
    const currentCart = await loadCheckoutCart(req.scope, cartId)
    if (!currentCart) {
      return res.status(404).json({ error: "السلة غير موجودة" })
    }
    // Guest checkout: a cart without a registered owner is authorized by
    // possession of the cart id. A signed-in customer's cart still requires a
    // matching actor.
    const access = await resolveCartAccess(
      req.scope,
      { id: currentCart.id, customer_id: currentCart.customer_id },
      requestActorId(req)
    )
    if (!access.authorized) {
      return res.status(401).json({ error: "لا يمكنك تعديل سلة لا تخص حسابك" })
    }

    const city = await resolveActiveCheckoutCity(req.scope, {
      cityId: body.city_id ?? currentCart.metadata?.city_id,
      cityName:
        body.city_name ??
        currentCart.metadata?.city_name ??
        currentCart.shipping_address?.city,
    })

    if (body.reconcile) {
      const result = await reconcileCheckoutShipping(req.scope, cartId, city)
      return res.status(200).json({ success: true, cart: result.cart })
    }

    // One address only. The invoice is issued with exactly the address the
    // shopper entered, so the billing address is always a copy of the shipping
    // address — there is no separate billing address to collect or store.
    const shippingAddress = sanitizeAddress(
      body.cart?.shipping_address,
      city.city
    )
    const billingAddress = shippingAddress
    // Email is optional for guest checkout. An empty string must not be written
    // onto the cart: Medusa validates the value and derives the guest customer
    // from it, so an absent email is simply left untouched.
    const email = text(body.cart?.email)
    const cityLabel = cityShippingLabel(city.city)

    await updateCartWorkflow(req.scope).run({
      input: {
        id: cartId,
        ...(body.cart
          ? {
              ...(email ? { email } : {}),
              shipping_address: shippingAddress,
              billing_address: billingAddress,
            }
          : {}),
        metadata: {
          ...(currentCart.metadata ?? {}),
          city_id: city.id,
          city_name: city.city,
          city_shipping_label: cityLabel,
          city_version: Date.now(),
          payment_method: null,
        },
      },
    })

    const sessionIds = (
      currentCart.payment_collection?.payment_sessions ?? []
    ).map((session: any) => session.id).filter(Boolean)
    if (sessionIds.length) {
      await deletePaymentSessionsWorkflow(req.scope).run({
        input: { ids: sessionIds },
      })
    }

    const result = await reconcileCheckoutShipping(req.scope, cartId, city)
    return res.status(200).json({
      success: true,
      message: "تم تحديث العنوان ومدينة الشحن",
      cart: result.cart,
    })
  } catch (error) {
    const status =
      error instanceof MedusaError &&
      error.type === MedusaError.Types.INVALID_DATA
        ? 422
        : 500
    const message =
      error instanceof Error ? error.message : "تعذر تحديث مدينة الشحن"
    return res.status(status).json({ error: message })
  }
}