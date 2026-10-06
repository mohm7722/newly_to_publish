"use client"

import FxPrice from "@modules/common/components/fx-price"
import React from "react"

type CartTotalsProps = {
  totals: {
    total?: number | null
    subtotal?: number | null
    tax_total?: number | null
    currency_code: string
    item_subtotal?: number | null
    shipping_subtotal?: number | null
    discount_subtotal?: number | null
  }
}

const CartTotals: React.FC<CartTotalsProps> = ({ totals }) => {
  const {
    total,
    tax_total,
    item_subtotal,
    shipping_subtotal,
    discount_subtotal,
  } = totals

  return (
    <div>
      <div className="flex flex-col gap-y-3 text-sm text-gray-600">
        <div className="flex items-center justify-between">
          <span>المجموع الفرعي (باستثناء الشحن والضرائب)</span>
          <span data-testid="cart-subtotal" data-value={item_subtotal || 0}>
            <FxPrice amountSar={item_subtotal ?? 0} />
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>الشحن</span>
          <span data-testid="cart-shipping" data-value={shipping_subtotal || 0}>
            <FxPrice amountSar={shipping_subtotal ?? 0} />
          </span>
        </div>
        {!!discount_subtotal && (
          <div className="flex items-center justify-between">
            <span>الخصم</span>
            <span
              className="text-ui-fg-interactive"
              data-testid="cart-discount"
              data-value={discount_subtotal || 0}
            >
              -{" "}
              <FxPrice amountSar={discount_subtotal ?? 0} />
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="flex gap-x-1 items-center ">الضرائب</span>
          <span data-testid="cart-taxes" data-value={tax_total || 0}>
            <FxPrice amountSar={tax_total ?? 0} />
          </span>
        </div>
      </div>
      <div className="h-px w-full border-b border-gray-200 my-4" />
      <div className="mt-4 flex items-center justify-between rounded-2xl bg-[#270830] p-4 text-white">
        <span className="font-bold">المجموع</span>
        <span
          className="text-xl font-bold"
          data-testid="cart-total"
          data-value={total || 0}
        >
          <FxPrice amountSar={total ?? 0} />
        </span>
      </div>
    </div>
  )
}

export default CartTotals
