"use client"

import { XMark } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OrderDetails from "@modules/order/components/order-details"
import OrderSummary from "@modules/order/components/order-summary"
import ShippingDetails from "@modules/order/components/shipping-details"
import ManualTransferStatus from "@modules/order/components/manual-transfer-status"
import React from "react"

type OrderDetailsTemplateProps = {
  order: HttpTypes.StoreOrder
}

const OrderDetailsTemplate: React.FC<OrderDetailsTemplateProps> = ({
  order,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl bg-[#270830] p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-xs text-white/60">حسابي / الطلبات</p>
          <h1 className="mt-1 text-2xl font-bold">تفاصيل الطلب</h1>
        </div>
        <LocalizedClientLink
          href="/account/orders"
          className="inline-flex w-fit items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          data-testid="back-to-overview-button"
        >
          <XMark className="h-4 w-4" /> العودة إلى الطلبات
        </LocalizedClientLink>
      </div>
      <div
        className="flex h-full w-full flex-col gap-5"
        data-testid="order-details-container"
      >
        <OrderDetails order={order} showStatus />
        <ManualTransferStatus
          orderId={order.id}
          expected={(order.metadata?.payment_method as string | undefined) === "manual_bank_transfer"}
        />
        <Items order={order} />
        <ShippingDetails order={order} />
        <OrderSummary order={order} />
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <Help />
        </div>
      </div>
    </div>
  )
}

export default OrderDetailsTemplate
