import { HttpTypes } from "@medusajs/types"
import { clx } from "@modules/common/components/ui"
import FxPrice from "@modules/common/components/fx-price"

type LineItemUnitPriceProps = {
  item: HttpTypes.StoreCartLineItem | HttpTypes.StoreOrderLineItem
  style?: "default" | "tight"
  currencyCode: string
}

const LineItemUnitPrice = ({
  item,
  style = "default",
}: LineItemUnitPriceProps) => {
  const total = item.total ?? 0
  const original_total = item.original_total ?? 0
  const hasReducedPrice = total < original_total

  const percentage_diff = Math.round(
    ((original_total - total) / original_total) * 100
  )

  return (
    <div className="flex flex-col text-ui-fg-muted justify-center h-full">
      {hasReducedPrice && (
        <>
          <p>
            {style === "default" && (
              <span className="text-ui-fg-muted">السعر الأصلي: </span>
            )}
            <span
              className="line-through"
              data-testid="product-unit-original-price"
            >
              <FxPrice amountSar={original_total / item.quantity} />
            </span>
          </p>
          {style === "default" && (
            <span className="text-ui-fg-interactive">-{percentage_diff}%</span>
          )}
        </>
      )}
      <span
        className={clx("text-base-regular", {
          "text-ui-fg-interactive": hasReducedPrice,
        })}
        data-testid="product-unit-price"
      >
        <FxPrice amountSar={total / item.quantity} />
      </span>
    </div>
  )
}

export default LineItemUnitPrice
