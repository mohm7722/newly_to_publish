"use client"

import { Heading, clx } from "@modules/common/components/ui"

import PaymentButton from "../payment-button"
import { useSearchParams } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

const Review = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  const searchParams = useSearchParams()

  const isOpen = searchParams.get("step") === "review"

  const paidByGiftcard = !!(
    (cart as unknown as Record<string, unknown>)?.gift_cards && ((cart as unknown as Record<string, unknown>)?.gift_cards as unknown[])?.length > 0 && cart?.total === 0
  )

  const previousStepsCompleted =
    cart.shipping_address &&
    (cart.shipping_methods?.length ?? 0) > 0 &&
    (cart.payment_collection || paidByGiftcard)

  return (
    <section className="overflow-hidden rounded-3xl border border-[#67285A]/10 bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-6 flex items-center gap-3">
        <span className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-bold ${isOpen ? "bg-[#f3edf5] text-[#67285A]" : "bg-gray-100 text-gray-400"}`}>4</span>
        <Heading
          level="h2"
          className={clx("text-xl font-bold text-[#270830] sm:text-2xl", {
            "opacity-50 pointer-events-none select-none": !isOpen,
          })}
        >
          مراجعة الطلب
        </Heading>
      </div>
      {isOpen && previousStepsCompleted && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-[#82ac40]/20 bg-[#f7faef] p-4 text-sm leading-7 text-[#3f5f18]">
            راجع عنوانك وطريقة التوصيل والدفع وملخص المبلغ قبل تأكيد الطلب. بالضغط على زر التأكيد، فإنك توافق على شروط الاستخدام والبيع وسياسة الإرجاع والخصوصية الخاصة بمتجر نيولي.
          </div>
          <PaymentButton cart={cart} data-testid="submit-order-button" />
        </div>
      )}
    </section>
  )
}

export default Review
