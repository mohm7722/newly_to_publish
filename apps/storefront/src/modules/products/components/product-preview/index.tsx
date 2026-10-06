import { Text } from "@modules/common/components/ui"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"

export default async function ProductPreview({
  product,
  isFeatured,
  region: _region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  // const pricedProduct = await listProducts({
  //   regionId: region.id,
  //   queryParams: { id: [product.id!] },
  // }).then(({ response }) => response.products[0])

  // if (!pricedProduct) {
  //   return null
  // }

  const { cheapestPrice } = getProductPrice({
    product,
  })

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      className="group block h-full min-w-0"
    >
      <div
        className="h-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-neoly transition-all duration-300 hover:-translate-y-1 hover:shadow-neoly-lg"
        data-testid="product-wrapper"
      >
        <Thumbnail
          thumbnail={product.thumbnail}
          images={product.images}
          size="full"
          isFeatured={isFeatured}
          className="rounded-none border-0 shadow-none group-hover:shadow-none"
        />
        <div className="flex min-w-0 flex-col gap-2 p-3 small:p-4" dir="rtl">
          <Text
            className="line-clamp-2 min-h-12 break-words text-start text-sm font-semibold leading-6 text-[#270830]"
            data-testid="product-title"
          >
            {product.title}
          </Text>
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 text-start text-sm font-bold text-[#67285A]">
            {cheapestPrice ? (
              <PreviewPrice price={cheapestPrice} />
            ) : (
              <Text className="text-ui-fg-muted" data-testid="price">
                السعر غير متاح
              </Text>
            )}
          </div>
        </div>
      </div>
    </LocalizedClientLink>
  )
}
