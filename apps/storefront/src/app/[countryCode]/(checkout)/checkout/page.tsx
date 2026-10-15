import { retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import PaymentWrapper from "@modules/checkout/components/payment-wrapper"
import CheckoutForm from "@modules/checkout/templates/checkout-form"
import CheckoutSummary from "@modules/checkout/templates/checkout-summary"
import BeginCheckoutTracker from "@modules/analytics/begin-checkout-tracker"
import { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "إتمام الطلب",
}

type CheckoutStep = "address" | "delivery" | "payment" | "review"

type CheckoutProps = {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ step?: string | string[] }>
}

const checkoutSteps: CheckoutStep[] = [
  "address",
  "delivery",
  "payment",
  "review",
]

export default async function Checkout({ params, searchParams }: CheckoutProps) {
  const { countryCode } = await params
  const { step: rawStep } = await searchParams
  const step = typeof rawStep === "string" ? rawStep : undefined

  if (!step || !checkoutSteps.includes(step as CheckoutStep)) {
    redirect(`/${countryCode}/checkout?step=address`)
  }

  // Guest checkout: no account is required to reach or complete checkout. The
  // customer is still loaded (when signed in) so saved addresses and profile
  // details can prefill the form.
  const customer = await retrieveCustomer().catch(() => null)

  const cart = await retrieveCart()

  if (!cart) {
    return notFound()
  }

  // Email is optional for guests, so address completeness is judged on the
  // address itself plus the selected governorate.
  const hasAddress = Boolean(
    cart.shipping_address?.address_1 &&
      cart.shipping_address?.phone &&
      cart.metadata?.city_id
  )
  const hasShippingMethod = (cart.shipping_methods?.length ?? 0) > 0
  const pendingPaymentSession =
    cart.payment_collection?.payment_sessions?.find(
      (session) => session.status === "pending"
    )
  const paymentMethod = cart.metadata?.payment_method
  const isOfflineMethod =
    paymentMethod === "cod" || paymentMethod === "manual_bank_transfer"
  const hasValidPaymentMethod = Boolean(
    pendingPaymentSession &&
      typeof paymentMethod === "string" &&
      (isOfflineMethod
        ? pendingPaymentSession.provider_id === "pp_system_default"
        : pendingPaymentSession.provider_id === paymentMethod)
  )

  if (step !== "address" && !hasAddress) {
    redirect(`/${countryCode}/checkout?step=address`)
  }

  if ((step === "payment" || step === "review") && !hasShippingMethod) {
    redirect(`/${countryCode}/checkout?step=delivery`)
  }

  if (step === "review" && !hasValidPaymentMethod) {
    redirect(`/${countryCode}/checkout?step=payment`)
  }

  return (
    <main className="content-container grid min-w-0 grid-cols-1 gap-8 px-4 py-6 sm:px-6 sm:py-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-8 xl:grid-cols-[minmax(0,1fr)_416px] xl:gap-12">
      <BeginCheckoutTracker cart={cart} />
      <div className="min-w-0">
        <PaymentWrapper cart={cart}>
          <CheckoutForm cart={cart} customer={customer} />
        </PaymentWrapper>
      </div>
      <CheckoutSummary cart={cart} />
    </main>
  )
}
