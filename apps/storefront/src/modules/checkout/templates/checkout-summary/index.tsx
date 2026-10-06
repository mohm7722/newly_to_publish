import { Heading } from "@modules/common/components/ui"

import ItemsPreviewTemplate from "@modules/cart/templates/preview"
import DiscountCode from "@modules/checkout/components/discount-code"
import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import { HttpTypes } from "@medusajs/types"

const CheckoutSummary = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  return (
    <aside className="min-w-0 lg:sticky lg:top-24">
      <div className="overflow-hidden rounded-3xl border border-[#67285A]/10 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-[#B3174A]">ملخص طلبك</p>
            <Heading level="h2" className="mt-1 text-xl font-bold text-[#270830]">
              محتويات السلة
            </Heading>
          </div>
          <span className="rounded-full bg-[#f3edf5] px-3 py-1 text-xs font-bold text-[#67285A]">
            {cart.items?.length ?? 0} منتج
          </span>
        </div>
        <ItemsPreviewTemplate cart={cart} />
        <Divider className="my-5" />
        <CartTotals totals={cart} />
        <div className="mt-5 rounded-2xl bg-[#fcfafc] p-4">
          <DiscountCode cart={cart} />
        </div>
        <p className="mt-4 text-center text-xs leading-5 text-gray-500">
          لن يتم تأكيد الطلب إلا بعد مراجعة جميع البيانات.
        </p>
      </div>
    </aside>
  )
}

export default CheckoutSummary
