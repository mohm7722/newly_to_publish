import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import {
  addShippingMethodToCartWorkflow,
  deletePaymentSessionsWorkflow,
  listShippingOptionsForCartWithPricingWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  loadCheckoutCart,
  reconcileCheckoutShipping,
  resolveActiveCheckoutCity,
} from "../../../../utils/checkout"

type ShippingMethodsBody = { option_id?: string }

const isPickup = (option: any) =>
  option?.service_zone?.fulfillment_set?.type === "pickup"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const cartId = req.params.id
  const { option_id: optionId } = (req.body ?? {}) as ShippingMethodsBody

  if (!optionId) {
    return res.status(400).json({ message: "option_id is required" })
  }

  try {
    const cart = await loadCheckoutCart(req.scope, cartId)
    if (!cart) {
      return res.status(404).json({ message: "السلة غير موجودة" })
    }
    const actorId = (
      req as unknown as { auth_context?: { actor_id?: string } }
    ).auth_context?.actor_id
    if (!actorId || cart.customer_id !== actorId) {
      return res.status(401).json({ message: "لا يمكنك تعديل سلة لا تخص حسابك" })
    }
    const city = await resolveActiveCheckoutCity(req.scope, {
      cityId: cart.metadata?.city_id,
      cityName: cart.shipping_address?.city,
    })

    const { result: eligibleOptions } =
      await listShippingOptionsForCartWithPricingWorkflow(req.scope).run({
        input: { cart_id: cartId, options: [{ id: optionId }] } as any,
      })
    const selectedOption = (eligibleOptions ?? []).find(
      (option: any) => option.id === optionId && !isPickup(option)
    )
    if (!selectedOption) {
      return res.status(422).json({
        message: "طريقة الشحن غير متاحة لهذه السلة أو المدينة",
      })
    }

    const previousSessionIds = (
      cart.payment_collection?.payment_sessions ?? []
    ).map((session: any) => session.id).filter(Boolean)
    if (previousSessionIds.length) {
      await deletePaymentSessionsWorkflow(req.scope).run({
        input: { ids: previousSessionIds },
      })
    }

    await addShippingMethodToCartWorkflow(req.scope).run({
      input: { cart_id: cartId, options: [{ id: optionId }] },
    })

    const updatedCart = await loadCheckoutCart(req.scope, cartId)
    const matchingMethods = (updatedCart?.shipping_methods ?? [])
      .filter((method: any) => method.shipping_option_id === optionId)
      .sort(
        (left: any, right: any) =>
          new Date(right.created_at ?? 0).getTime() -
          new Date(left.created_at ?? 0).getTime()
      )
    const method = matchingMethods[0]
    if (!method?.id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "تعذر ربط طريقة الشحن بالسلة"
      )
    }

    const cartService = req.scope.resolve<any>(Modules.CART)
    await cartService.updateCarts([
      {
        id: cartId,
        metadata: {
          ...(updatedCart.metadata ?? {}),
          city_shipping_method_id: method.id,
          payment_method: null,
        },
      },
    ])

    const result = await reconcileCheckoutShipping(req.scope, cartId, city)
    return res.status(200).json({ cart: result.cart })
  } catch (error) {
    const logger = req.scope.resolve<any>("logger")
    logger.error(
      `[shipping-methods] cart=${cartId}: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
    const status =
      error instanceof MedusaError &&
      error.type === MedusaError.Types.INVALID_DATA
        ? 422
        : 500
    return res.status(status).json({
      message:
        error instanceof Error
          ? error.message
          : "تعذر إضافة طريقة الشحن",
    })
  }
}