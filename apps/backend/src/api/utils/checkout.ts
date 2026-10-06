import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import { SHIPPING_CITY_MODULE } from "../../modules/shipping-city"
import type ShippingCityModuleService from "../../modules/shipping-city/service"
import { PAYMENTS_MODULE } from "../../modules/payments"
import type PaymentsModuleService from "../../modules/payments/service"

export type CheckoutScope = { resolve: <T = unknown>(key: string) => T }

type CheckoutCity = {
  id: string
  city: string
  delivery_price: number
  is_active: boolean
}

const normalize = (value: unknown) =>
  String(value ?? "").trim().toLocaleLowerCase("ar")

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

export async function loadCheckoutCart(scope: CheckoutScope, cartId: string) {
  const query = scope.resolve<any>(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "cart",
    filters: { id: cartId },
    fields: [
      "id", "customer_id", "email", "currency_code", "total", "metadata",
      "shipping_address.*", "billing_address.*", "shipping_methods.*",
      "payment_collection.id", "payment_collection.amount",
      "payment_collection.payment_sessions.*",
    ],
  })
  return data?.[0] ?? null
}

export async function resolveActiveCheckoutCity(
  scope: CheckoutScope,
  input: { cityId?: string; cityName?: string }
): Promise<CheckoutCity> {
  const service = scope.resolve<ShippingCityModuleService>(SHIPPING_CITY_MODULE)
  const cities = (await service.listAll()) as unknown as CheckoutCity[]
  const city = cities.find(
    (item) =>
      item.is_active &&
      ((input.cityId && item.id === input.cityId) ||
        (input.cityName && normalize(item.city) === normalize(input.cityName)))
  )

  if (!city) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "مدينة الشحن غير متاحة حاليًا"
    )
  }
  return { ...city, delivery_price: toNumber(city.delivery_price) }
}

export async function reconcileCheckoutShipping(
  scope: CheckoutScope,
  cartId: string,
  explicitCity?: CheckoutCity
) {
  const cart = await loadCheckoutCart(scope, cartId)
  if (!cart) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "السلة غير موجودة")
  }

  const city =
    explicitCity ??
    (await resolveActiveCheckoutCity(scope, {
      cityId: cart.metadata?.city_id,
      cityName: cart.metadata?.city_name ?? cart.shipping_address?.city,
    }))
  const methods = Array.isArray(cart.shipping_methods) ? cart.shipping_methods : []
  const storedMethodId = cart.metadata?.city_shipping_method_id
  const method =
    methods.find((item: any) => item.id === storedMethodId) ??
    methods.find((item: any) => normalize(item.name).startsWith("توصيل إلى"))

  if (!method?.id) {
    return { cart, city, shippingMethod: null }
  }

  const label = `توصيل إلى ${city.city}`
  const cartService = scope.resolve<any>(Modules.CART)
  await cartService.updateShippingMethods([
    {
      id: method.id,
      amount: city.delivery_price,
      name: label,
    },
  ])
  await cartService.updateCarts([
    {
      id: cartId,
      metadata: {
        ...(cart.metadata ?? {}),
        city_id: city.id,
        city_name: city.city,
        city_shipping_label: label,
        city_shipping_method_id: method.id,
        city_version: Date.now(),
      },
    },
  ])

  const refreshed = await loadCheckoutCart(scope, cartId)
  const paymentCollection = refreshed?.payment_collection
  const total = toNumber(refreshed?.total)

  if (paymentCollection?.id && Number.isFinite(total)) {
    const paymentService = scope.resolve<any>(Modules.PAYMENT)
    await paymentService.updatePaymentCollections(paymentCollection.id, {
      amount: total,
    })

    const manualSessions = (paymentCollection.payment_sessions ?? []).filter(
      (session: any) =>
        session.status === "pending" && session.provider_id === "pp_system_default"
    )
    for (const session of manualSessions) {
      await paymentService.updatePaymentSession({ id: session.id, amount: total })
    }
  }

  return {
    cart: await loadCheckoutCart(scope, cartId),
    city,
    shippingMethod: method,
  }
}

export async function validateCheckoutCart(
  scope: CheckoutScope,
  cartId: string,
  actorId?: string
) {
  let cart = await loadCheckoutCart(scope, cartId)
  if (!cart) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "السلة غير موجودة")
  }
  if (!actorId || !cart.customer_id || cart.customer_id !== actorId) {
    throw new MedusaError(
      MedusaError.Types.UNAUTHORIZED,
      "لا يمكنك إكمال سلة لا تخص حسابك"
    )
  }

  const address = cart.shipping_address
  if (
    !cart.email || !address?.first_name || !address?.last_name ||
    !address?.address_1 || !address?.phone || !address?.country_code
  ) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "بيانات الشحن غير مكتملة")
  }

  const city = await resolveActiveCheckoutCity(scope, {
    cityId: cart.metadata?.city_id,
    cityName: address.city,
  })
  if (normalize(address.city) !== normalize(city.city)) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "مدينة العنوان لا تطابق مدينة الشحن المختارة"
    )
  }

  await reconcileCheckoutShipping(scope, cartId, city)
  cart = await loadCheckoutCart(scope, cartId)
  const method = (cart.shipping_methods ?? []).find(
    (item: any) => item.id === cart.metadata?.city_shipping_method_id
  )
  if (!method || Math.abs(toNumber(method.amount) - city.delivery_price) > 0.001) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "سعر الشحن غير صالح")
  }

  const paymentMethod = cart.metadata?.payment_method
  const pendingSession = (cart.payment_collection?.payment_sessions ?? []).find(
    (session: any) => session.status === "pending"
  )
  const offline = paymentMethod === "cod" || paymentMethod === "manual_bank_transfer"

  if (
    !pendingSession ||
    !paymentMethod ||
    (offline
      ? pendingSession.provider_id !== "pp_system_default"
      : pendingSession.provider_id !== paymentMethod)
  ) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "طريقة الدفع غير مكتملة أو لا تطابق جلسة الدفع"
    )
  }

  if (paymentMethod === "cod") {
    const payments = scope.resolve<PaymentsModuleService>(PAYMENTS_MODULE)
    if (!(await payments.isCodAvailableForCity(city.id))) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "الدفع عند الاستلام غير متاح لهذه المدينة"
      )
    }
  }

  return { cart, city, method, paymentMethod, pendingSession }
}