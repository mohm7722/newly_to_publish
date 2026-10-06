import React, { Suspense } from "react"

import ImageGallery from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import ProductActionsWrapper from "./product-actions-wrapper"
import ViewItemTracker from "@modules/analytics/view-item-tracker"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  images,
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  return (
    <>
      <div
        className="content-container relative grid grid-cols-1 gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:py-10"
        data-testid="product-container"
      >
        <ViewItemTracker product={product} region={region} />
        <div className="min-w-0 overflow-hidden rounded-3xl border border-gray-100 bg-white p-3 shadow-sm sm:p-5">
          <ImageGallery
            images={images}
            imageLabels={
              (product.metadata?.image_labels as Record<string, string> | undefined) ?? {}
            }
          />
        </div>
        <aside className="min-w-0 space-y-5 lg:sticky lg:top-24">
          <ProductInfo product={product} />
          <div className="rounded-3xl border border-[#67285A]/10 bg-white p-5 shadow-sm sm:p-6">
            <ProductTabs product={product} />
          </div>
          <div className="rounded-3xl border border-[#67285A]/10 bg-white p-5 shadow-sm sm:p-6">
            <ProductOnboardingCta />
            <Suspense fallback={<ProductActions disabled product={product} region={region} />}>
              <ProductActionsWrapper id={product.id} region={region} />
            </Suspense>
          </div>
        </aside>
      </div>
      <div
        className="content-container my-16 small:my-32"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </>
  )
}

export default ProductTemplate
