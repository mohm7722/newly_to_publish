"use client"

import { Button } from "@modules/common/components/ui"
import OrderCard from "../order-card"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { ShoppingBag } from "lucide-react"

const OrderOverview = ({ orders }: { orders: HttpTypes.StoreOrder[] }) => {
  if (orders?.length) {
    return <div className="space-y-4">{orders.map((order) => <OrderCard key={order.id} order={order} />)}</div>
  }

  return (
    <div className="flex w-full flex-col items-center gap-4 rounded-3xl border border-dashed border-gray-200 px-5 py-12 text-center" data-testid="no-orders-container">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f3edf5] text-[#67285A]"><ShoppingBag className="h-6 w-6" /></span>
      <h2 className="text-xl font-bold text-[#270830]">لا توجد طلبات حتى الآن</h2>
      <p className="text-sm text-gray-500">عندما تنشئ طلبًا جديدًا ستتمكن من متابعته من هنا.</p>
      <LocalizedClientLink href="/store" passHref><Button className="mt-2 bg-[#67285A] text-white" data-testid="continue-shopping-button">ابدأ التسوق</Button></LocalizedClientLink>
    </div>
  )
}

export default OrderOverview
