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

  // Guest checkout: everyone goes straight to checkout. Signing in is an
  // optional convenience (saved addresses, order history), never a gate.
  const checkoutHref = `/checkout?step=${step}`

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
          إتمام الشراء
        </Button>
      </LocalizedClientLink>
      {!customer && (
        <p className="text-center text-xs leading-6 text-gray-500">
          لا حاجة لإنشاء حساب — أكمل طلبك بالاسم ورقم الهاتف فقط.
        </p>
      )}
    </div>
  )
}

export default Summary
