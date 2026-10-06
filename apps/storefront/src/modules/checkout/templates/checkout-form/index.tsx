import { listCities } from "@lib/data/cities"
import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { HttpTypes } from "@medusajs/types"
import Addresses from "@modules/checkout/components/addresses"
import CheckoutSteps from "@modules/checkout/components/checkout-steps"
import Payment from "@modules/checkout/components/payment"
import Review from "@modules/checkout/components/review"
import Shipping from "@modules/checkout/components/shipping"

export default async function CheckoutForm({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) {
  if (!cart) {
    return null
  }

  const shippingMethods = await listCartShippingMethods(cart.id)
  const paymentMethods = await listCartPaymentMethods(cart.region?.id ?? "")
  const cities = await listCities()

  if (!shippingMethods || !paymentMethods) {
    return null
  }

  return (
    <div className="space-y-6">
      <CheckoutSteps />
      <div className="grid w-full grid-cols-1 gap-y-5">
        <Addresses cart={cart} customer={customer} cities={cities} />

        <Shipping
          cart={cart}
          availableShippingMethods={shippingMethods}
        />

        <Payment cart={cart} availablePaymentMethods={paymentMethods} />

        <Review cart={cart} />
      </div>
    </div>
  )
}
