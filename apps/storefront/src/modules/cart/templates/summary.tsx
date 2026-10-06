"use client"

import { Button, Heading } from "@modules/common/components/ui"

import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import DiscountCode from "@modules/checkout/components/discount-code"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

type SummaryProps = {
  cart: HttpTypes.StoreCart
  customer: HttpTypes.StoreCustomer | null
}

function getCheckoutStep(cart: HttpTypes.StoreCart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  } else if (cart?.shipping_methods?.length === 0) {
    return "delivery"
  } else {
    return "payment"
  }
}

const Summary = ({ cart, customer }: SummaryProps) => {
  const step = getCheckoutStep(cart)

  // Guests are sent to login/register first (with a redirect back to checkout).
  // This mirrors the server-side guard in `checkout/page.tsx` so the UI never
  // implies guest checkout is possible.
  const checkoutHref = customer
    ? `/checkout?step=${step}`
    : `/account?redirect=/checkout`

  return (
    <div className="flex flex-col gap-y-5">
      <div>
        <p className="text-xs font-bold text-[#B3174A]">تفاصيل الطلب</p>
        <Heading level="h2" className="mt-1 text-2xl font-bold text-[#270830]">الملخص</Heading>
      </div>
      <DiscountCode cart={cart} />
      <Divider />
      <CartTotals totals={cart} />
      <LocalizedClientLink href={checkoutHref} data-testid="checkout-button">
        <Button className="h-12 w-full rounded-xl bg-[#67285A] font-bold text-white hover:bg-[#56214c]">
          {customer ? "إتمام الشراء" : "تسجيل الدخول لإكمال الطلب"}
        </Button>
      </LocalizedClientLink>
    </div>
  )
}

export default Summary
