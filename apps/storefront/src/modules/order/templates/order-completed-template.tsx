import { Heading } from "@modules/common/components/ui"
import { cookies as nextCookies } from "next/headers"

import CartTotals from "@modules/common/components/cart-totals"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OnboardingCta from "@modules/order/components/onboarding-cta"
import OrderDetails from "@modules/order/components/order-details"
import ShippingDetails from "@modules/order/components/shipping-details"
import PaymentDetails from "@modules/order/components/payment-details"
import SettlementCommitter from "@modules/order/components/settlement-committer"
import PurchaseTracker from "@modules/analytics/purchase-tracker"
import ManualTransferStatus from "@modules/order/components/manual-transfer-status"
import { HttpTypes } from "@medusajs/types"

type OrderCompletedTemplateProps = {
  order: HttpTypes.StoreOrder
}

export default async function OrderCompletedTemplate({
  order,
}: OrderCompletedTemplateProps) {
  const cookies = await nextCookies()

  const isOnboarding = cookies.get("_medusa_onboarding")?.value === "true"
  const isManualTransfer =
    (order.metadata?.payment_method as string | undefined) ===
    "manual_bank_transfer"

  return (
    <main
      className="min-h-[calc(100vh-64px)] bg-[#fcfafc] py-6 sm:py-10"
      dir="rtl"
    >
      <div className="content-container flex w-full max-w-4xl flex-col gap-6">
        {isOnboarding && <OnboardingCta orderId={order.id} />}
        <SettlementCommitter orderId={order.id} />
        <PurchaseTracker order={order} />
        <div
          className="flex w-full min-w-0 flex-col gap-5"
          data-testid="order-complete-container"
        >
          <section className="relative overflow-hidden rounded-2xl bg-[#270830] p-5 text-white shadow-sm sm:p-8">
            <div className="absolute -left-12 -top-16 h-40 w-40 rounded-full bg-[#67285A]/60" />
            <div className="absolute -bottom-20 right-1/3 h-36 w-36 rounded-full bg-[#B3174A]/20" />
            <div className="relative flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-2xl font-bold sm:h-12 sm:w-12">
                ✓
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-white/60">اكتمل طلبك</p>
                <Heading
                  level="h1"
                  className="mt-1 flex flex-col gap-1 text-2xl font-bold leading-tight text-white sm:text-3xl"
                >
                  <span>شكراً لك!</span>
                  <span>
                    {isManualTransfer
                      ? "تم استلام طلبك وإشعار الإيداع."
                      : "تم تأكيد طلبك بنجاح."}
                  </span>
                </Heading>
                <p className="mt-3 text-sm leading-6 text-white/75">
                  {isManualTransfer
                    ? "الإشعار قيد المراجعة، وسنبدأ تجهيز الطلب بعد مطابقة الإيداع وقبوله."
                    : "سنرسل إليك تحديثات الطلب والتوصيل عبر بيانات التواصل المسجلة."}
                </p>
              </div>
            </div>
          </section>

          <ManualTransferStatus orderId={order.id} expected={isManualTransfer} />
          <OrderDetails order={order} />

          <div className="pt-1">
            <Heading level="h2" className="text-xl font-bold text-[#270830]">
              ملخص الطلب
            </Heading>
          </div>
          <Items order={order} />

          <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
            <Heading level="h2" className="mb-4 text-xl font-bold text-[#270830]">
              الإجمالي
            </Heading>
            <CartTotals totals={order} />
          </section>

          <ShippingDetails order={order} />

          <section className="min-w-0 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 [&>div>h2]:mt-0 [&>div>h2]:text-xl [&>div>h2]:font-bold [&>div>h2]:text-[#270830]">
            <PaymentDetails order={order} />
          </section>

          <section className="rounded-2xl border border-gray-100 bg-white px-5 pb-5 shadow-sm sm:px-6 sm:pb-6">
            <Help />
          </section>
        </div>
      </div>
    </main>
  )
}
