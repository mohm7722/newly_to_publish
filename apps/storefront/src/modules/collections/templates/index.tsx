import { Suspense } from "react"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import { HttpTypes } from "@medusajs/types"

export default function CollectionTemplate({
  sortBy,
  collection,
  page,
  countryCode,
}: {
  sortBy?: SortOptions
  collection: HttpTypes.StoreCollection
  page?: string
  countryCode: string
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  return (
    <div className="content-container flex flex-col gap-5 py-4 small:flex-row small:items-start small:gap-6 small:py-8">
      <RefinementList sortBy={sort} />
      <div className="min-w-0 w-full">
        <div className="mb-6 rounded-3xl border border-[#67285A]/10 bg-[#fcfafc] p-5 small:p-6">
          <p className="text-sm font-bold text-[#B3174A]">مجموعة نيولي</p>
          <h1 className="mt-1 break-words text-2xl font-bold text-[#270830] small:text-3xl">
            {collection.title}
          </h1>
        </div>
        <Suspense
          fallback={
            <SkeletonProductGrid
              numberOfProducts={collection.products?.length}
            />
          }
        >
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            collectionId={collection.id}
            countryCode={countryCode}
          />
        </Suspense>
      </div>
    </div>
  )
}
