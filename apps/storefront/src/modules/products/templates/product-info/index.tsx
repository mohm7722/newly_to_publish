import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  return (
    <section id="product-info" className="rounded-3xl bg-[#270830] p-5 text-white shadow-sm sm:p-6">
      <div className="flex min-w-0 flex-col gap-y-4">
        {product.collection && (
          <LocalizedClientLink
            href={`/collections/${product.collection.handle}`}
            className="text-sm font-medium text-white/60 hover:text-white"
          >
            {product.collection.title}
          </LocalizedClientLink>
        )}
        <Heading
          level="h2"
          className="break-words text-2xl font-bold leading-10 text-white sm:text-3xl"
          data-testid="product-title"
        >
          {product.title}
        </Heading>

        <Text
          className="whitespace-pre-line text-sm leading-7 text-white/75"
          data-testid="product-description"
        >
          {product.description}
        </Text>
      </div>
    </section>
  )
}

export default ProductInfo
