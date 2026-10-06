import { HttpTypes } from "@medusajs/types"
import { Text } from "@modules/common/components/ui"

const fulfillmentLabels: Record<string, string> = { not_fulfilled: "قيد التجهيز", partially_fulfilled: "تم تجهيز جزء منه", fulfilled: "تم التجهيز", partially_shipped: "تم شحن جزء منه", shipped: "تم الشحن", partially_delivered: "تم تسليم جزء منه", delivered: "تم التسليم", canceled: "ملغي" }
const paymentLabels: Record<string, string> = { not_paid: "غير مدفوع", awaiting: "بانتظار الدفع", authorized: "تم اعتماد الدفع", partially_authorized: "اعتماد جزئي", captured: "مدفوع", partially_captured: "مدفوع جزئيًا", refunded: "مسترد", partially_refunded: "مسترد جزئيًا", canceled: "ملغي" }

type OrderDetailsProps = { order: HttpTypes.StoreOrder; showStatus?: boolean }

const OrderDetails = ({ order, showStatus }: OrderDetailsProps) => (
  <div className="rounded-2xl bg-[#fcfafc] p-5 sm:p-6">
    <div className="grid gap-4 sm:grid-cols-3">
      <div><Text className="text-xs text-gray-500">رقم الطلب</Text><Text className="mt-1 font-bold text-[#270830]" data-testid="order-id">#{order.display_id}</Text></div>
      <div><Text className="text-xs text-gray-500">تاريخ الطلب</Text><Text className="mt-1 font-semibold" data-testid="order-date">{new Intl.DateTimeFormat("ar-YE", { dateStyle: "medium" }).format(new Date(order.created_at))}</Text></div>
      <div><Text className="text-xs text-gray-500">البريد الإلكتروني</Text><bdi dir="ltr" className="mt-1 block truncate text-sm font-semibold" data-testid="order-email">{order.email}</bdi></div>
    </div>
    {showStatus && <div className="mt-5 flex flex-wrap gap-3 border-t border-gray-100 pt-4 text-sm">
      <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">حالة الطلب: <strong data-testid="order-status">{fulfillmentLabels[order.fulfillment_status] || order.fulfillment_status}</strong></span>
      <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">حالة الدفع: <strong data-testid="order-payment-status">{paymentLabels[order.payment_status] || order.payment_status}</strong></span>
    </div>}
  </div>
)

export default OrderDetails
