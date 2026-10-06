"use client"

import { HttpTypes } from "@medusajs/types"
import { getProductPrice } from "@lib/util/get-product-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { addToCart } from "@lib/data/cart"
import { useState, Fragment } from "react"
import { Dialog, Transition } from "@headlessui/react"
import X from "@modules/common/icons/x"
import { ShoppingCart } from "@medusajs/icons"
import FxPrice from "@modules/common/components/fx-price"

type ProductCardProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

const ProductCard = ({ product, countryCode }: ProductCardProps) => {
  const [isAdding, setIsAdding] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const { cheapestPrice } = getProductPrice({ product })

  // A product with no price or a 0 price is a data gap (not priced in admin);
  // it must not display a misleading "0" and must not be addable to the cart.
  const hasValidPrice =
    !!cheapestPrice && cheapestPrice.calculated_price_number > 0

  // Check if product has variants
  const hasVariants = product.variants && product.variants.length > 1

  const variantHasValidPrice = (
    variant?: HttpTypes.StoreProductVariant
  ): boolean => {
    const amount = (
      variant as unknown as { calculated_price?: { calculated_amount?: number } }
    )?.calculated_price?.calculated_amount
    return typeof amount === "number" && amount > 0
  }

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Never add an unpriced/0-price product to the cart.
    if (!hasValidPrice) return

    if (hasVariants) {
      // Show modal for variant selection
      setShowModal(true)
    } else {
      // Add directly if no variants
      await addProductToCart()
    }
  }

  const addProductToCart = async () => {
    if (!product.variants?.[0]?.id) return
    if (!variantHasValidPrice(product.variants[0])) return

    setIsAdding(true)

    try {
      await addToCart({
        variantId: product.variants[0].id,
        quantity: 1,
        countryCode,
      })
      setShowModal(false)
    } catch (error) {
      console.error("Error adding to cart:", error)
    } finally {
      setIsAdding(false)
    }
  }

  const handleOptionSelect = (optionId: string, value: string) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  const getSelectedVariant = () => {
    if (!product.variants) return null

    return product.variants.find((variant) => {
      if (!variant.options) return false

      return variant.options.every(
        (option) =>
          option.option_id && selectedOptions[option.option_id] === option.value
      )
    })
  }

  const handleAddSelectedToCart = async () => {
    const selectedVariant = getSelectedVariant()
    if (!selectedVariant) return
    if (!variantHasValidPrice(selectedVariant)) return

    setIsAdding(true)

    try {
      await addToCart({
        variantId: selectedVariant.id,
        quantity: 1,
        countryCode,
      })
      setShowModal(false)
    } catch (error) {
      console.error("Error adding to cart:", error)
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <>
      <LocalizedClientLink href={`/products/${product.handle}`} className="group">
        <div className="bg-white rounded-2xl shadow-neoly hover:shadow-neoly-lg transition-all duration-500 transform hover:-translate-y-3 overflow-hidden border border-gray-100">
          {/* Product Image */}
          <div className="aspect-square overflow-hidden">
            <Thumbnail
              thumbnail={product.thumbnail}
              images={product.images}
              size="full"
              isFeatured={true}
            />
          </div>

          {/* Product Info */}
          <div className="p-5">
            <h3 className="text-sm font-semibold text-neoly-primary mb-3 text-right line-clamp-2 leading-relaxed">
              {product.title}
            </h3>

            {/* Price */}
            <div className="flex items-center justify-between">
              <div className="text-right">
                {hasValidPrice ? (
                  <div className="flex flex-col items-end">
                    {/* reserve space for original price to keep equal height */}
                    {cheapestPrice!.price_type === "sale" &&
                    cheapestPrice!.original_price_number > 0 ? (
                      <span className="text-xs text-gray-400 line-through min-h-[16px]">
                        <FxPrice amountSar={cheapestPrice!.original_price_number} />
                      </span>
                    ) : (
                      <span className="text-xs min-h-[16px] opacity-0 select-none">
                        placeholder
                      </span>
                    )}
                    <span className="text-lg font-bold text-neoly-primary">
                      <FxPrice amountSar={cheapestPrice!.calculated_price_number} />
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-400 text-right text-sm">
                    السعر غير متاح
                  </span>
                )}
              </div>

              {/* Add to Cart Button (icon only) — disabled for unpriced products */}
              <button
                onClick={handleAddToCart}
                disabled={isAdding || !hasValidPrice}
                className="bg-red-500 text-white p-1.5 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className={isAdding ? "w-4 h-4 opacity-70" : "w-4 h-4"} />
              </button>
            </div>
          </div>
        </div>
      </LocalizedClientLink>

      {/* Variant Selection Modal */}
      <Transition appear show={showModal} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-[300]"
          onClose={() => setShowModal(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 z-[300] bg-gray-700 bg-opacity-75 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed bottom-0 inset-x-0 z-[310]">
            <div className="flex min-h-full h-full items-center justify-center text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Dialog.Panel className="w-full h-full transform overflow-hidden text-left flex flex-col gap-y-3 z-[320]">
                  <div className="w-full flex justify-end pr-6">
                    <button
                      onClick={() => setShowModal(false)}
                      className="bg-white w-12 h-12 rounded-full text-ui-fg-base flex justify-center items-center"
                    >
                      <X />
                    </button>
                  </div>
                  <div className="bg-white px-6 py-12">
                    <div className="flex flex-col gap-y-6">
                      {product.options?.map((option) => (
                        <div key={option.id}>
                          <h3 className="text-lg font-semibold text-neoly-primary mb-4 text-right">
                            {option.title} اختر
                          </h3>
                          <div className="flex flex-wrap gap-3">
                            {option.values?.map((value) => (
                              <button
                                key={value.value}
                                onClick={() =>
                                  handleOptionSelect(option.id, value.value)
                                }
                                className={`px-4 py-2 rounded-lg border transition-all duration-200 ${
                                  selectedOptions[option.id] === value.value
                                    ? "border-neoly-primary bg-neoly-primary text-white"
                                    : "border-gray-300 text-gray-700 hover:border-neoly-primary"
                                }`}
                              >
                                {value.value}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={handleAddSelectedToCart}
                        disabled={
                          isAdding ||
                          !getSelectedVariant() ||
                          !variantHasValidPrice(getSelectedVariant() ?? undefined)
                        }
                        className="w-full bg-neoly-primary text-white py-4 rounded-xl font-semibold text-lg hover:bg-neoly-accent transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isAdding
                          ? "جاري الإضافة..."
                          : getSelectedVariant() &&
                            !variantHasValidPrice(getSelectedVariant() ?? undefined)
                          ? "السعر غير متاح"
                          : "أضف إلى السلة"}
                      </button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}

export default ProductCard
