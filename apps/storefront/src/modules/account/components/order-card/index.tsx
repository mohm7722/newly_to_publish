import { useMemo } from "react"
import Thumbnail from "@modules/products/components/thumbnail"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import FxPrice from "@modules/common/components/fx-price"
import { HttpTypes } from "@medusajs/types"
import { ArrowLeft, CalendarDays } from "lucide-react"

type OrderCardProps = { order: HttpTypes.StoreOrder }
const formatDate = (value: string | Date) => new Intl.DateTimeFormat("ar-YE", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value))

const OrderCard = ({ order }: OrderCardProps) => {
  const itemCount = useMemo(() => order.items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0, [order])
  const products = order.items ?? []
  const hiddenProducts = Math.max(products.length - 3, 0)

  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-[#67285A]/20 hover:shadow-neoly" data-testid="order-card">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-gray-500">رقم الطلب</p>
          <h2 className="mt-1 text-xl font-bold text-[#270830]">#<span data-testid="order-display-id">{order.display_id}</span></h2>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
          <span className="flex items-center gap-2" data-testid="order-created-at"><CalendarDays className="h-4 w-4" />{formatDate(order.created_at)}</span>
          <strong className="rounded-full bg-[#f3edf5] px-3 py-1 text-[#67285A]" data-testid="order-amount"><FxPrice amountSar={order.total} /></strong>
          <span>{itemCount} {itemCount === 1 ? "منتج" : "منتجات"}</span>
        </div>
      </div>

      {products.length > 0 && (
        <div className="my-5 grid grid-cols-3 gap-3 sm:grid-cols-4">
          {products.slice(0, 3).map((item) => (
            <div key={item.id} className="min-w-0" data-testid="order-item">
              <div className="overflow-hidden rounded-xl bg-gray-50"><Thumbnail thumbnail={item.thumbnail} images={[]} size="full" /></div>
              <p className="mt-2 truncate text-xs font-semibold" data-testid="item-title">{item.title}</p>
              <span className="text-xs text-gray-500">الكمية: <span data-testid="item-quantity">{item.quantity}</span></span>
            </div>
          ))}
          {hiddenProducts > 0 && <div className="flex min-h-24 flex-col items-center justify-center rounded-xl bg-[#f9f6fb] text-[#67285A]"><strong>+{hiddenProducts}</strong><span className="text-xs">منتجات أخرى</span></div>}
        </div>
      )}

      <LocalizedClientLink href={`/account/orders/details/${order.id}`} className="flex items-center justify-end gap-2 border-t border-gray-100 pt-4 text-sm font-bold text-[#67285A]" data-testid="order-details-link">
        عرض التفاصيل <ArrowLeft className="h-4 w-4" />
      </LocalizedClientLink>
    </article>
  )
}

export default OrderCard
