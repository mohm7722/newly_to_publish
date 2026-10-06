import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"
import { Table } from "@modules/common/components/ui"

import Item from "@modules/order/components/item"
import SkeletonLineItem from "@modules/skeletons/components/skeleton-line-item"

type ItemsProps = {
  order: HttpTypes.StoreOrder
}

const Items = ({ order }: ItemsProps) => {
  const items = order.items

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-3">
        <p className="text-xs font-bold text-[#B3174A]">محتويات الطلب</p>
        <h2 className="mt-1 text-xl font-bold text-[#270830]">المنتجات</h2>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <Table.Body data-testid="products-table">
            {items?.length
              ? [...items]
                  .sort((a, b) => {
                    return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
                  })
                  .map((item) => (
                    <Item
                      key={item.id}
                      item={item}
                      currencyCode={order.currency_code}
                    />
                  ))
              : repeat(5).map((i) => <SkeletonLineItem key={i} />)}
          </Table.Body>
        </Table>
      </div>
    </section>
  )
}

export default Items
