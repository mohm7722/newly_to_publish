import FxPrice from "@modules/common/components/fx-price"
import { HttpTypes } from "@medusajs/types"

type OrderSummaryProps = { order: HttpTypes.StoreOrder }
const OrderSummary = ({ order }: OrderSummaryProps) => {
  const amount = (value?: number | null) => <FxPrice amountSar={value ?? 0} />
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 sm:p-6">
      <h2 className="text-lg font-bold text-[#270830]">ملخص الطلب</h2>
      <div className="mt-5 space-y-3 text-sm text-gray-600">
        <div className="flex justify-between"><span>المجموع الفرعي</span><strong>{amount(order.subtotal)}</strong></div>
        {order.discount_total > 0 && <div className="flex justify-between text-emerald-700"><span>الخصم</span><strong>- {amount(order.discount_total)}</strong></div>}
        {order.gift_card_total > 0 && <div className="flex justify-between text-emerald-700"><span>بطاقة هدية</span><strong>- {amount(order.gift_card_total)}</strong></div>}
        <div className="flex justify-between"><span>الشحن</span><strong>{amount(order.shipping_total)}</strong></div>
        <div className="flex justify-between"><span>الضرائب</span><strong>{amount(order.tax_total)}</strong></div>
        <div className="flex justify-between border-t border-dashed border-gray-200 pt-4 text-base text-[#270830]"><span className="font-bold">الإجمالي</span><strong className="text-lg">{amount(order.total)}</strong></div>
      </div>
    </section>
  )
}
export default OrderSummary
