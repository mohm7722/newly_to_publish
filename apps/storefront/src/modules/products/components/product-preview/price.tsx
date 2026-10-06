import { Text, clx } from "@modules/common/components/ui"
import FxPrice from "@modules/common/components/fx-price"
import { VariantPrice } from "types/global"

export default async function PreviewPrice({ price }: { price: VariantPrice }) {
  // Guard against missing or non-positive (0) prices — a 0 price is a data gap
  // (product not priced in admin) and must not be shown as a misleading "0".
  if (!price || !(price.calculated_price_number > 0)) {
    return (
      <Text className="text-ui-fg-muted" data-testid="price">
        السعر غير متاح
      </Text>
    )
  }

  return (
    <>
      {price.price_type === "sale" && price.original_price_number > 0 && (
        <Text
          className="line-through text-ui-fg-muted"
          data-testid="original-price"
        >
          <FxPrice amountSar={price.original_price_number} />
        </Text>
      )}
      <Text
        className={clx("text-ui-fg-muted", {
          "text-ui-fg-interactive": price.price_type === "sale",
        })}
        data-testid="price"
      >
        <FxPrice amountSar={price.calculated_price_number} />
      </Text>
    </>
  )
}
