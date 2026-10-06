import { Suspense } from "react"
import { Metadata } from "next"

import { getCollectionByHandle } from "@lib/data/collections"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"

export const metadata: Metadata = {
  title: "منتجات جديدة",
  description: "استعرض جميع المنتجات ضمن مجموعة المنتجات الجديدة.",
}

type Params = {
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
  }>
  params: Promise<{
    countryCode: string
  }>
}

export default async function NewProductsStorePage(props: Params) {
  const params = await props.params
  const searchParams = await props.searchParams
  const { sortBy, page } = searchParams

  const sort = sortBy || "created_at"
  const pageNumber = page ? parseInt(page) : 1

  const collection = await getCollectionByHandle("new-products")

  return (
    <div
      className="content-container flex flex-col gap-5 py-4 small:flex-row small:items-start small:gap-6 small:py-8"
      data-testid="category-container"
    >
      <RefinementList sortBy={sort} />
      <div className="min-w-0 w-full">
        <div className="mb-6 rounded-3xl border border-[#67285A]/10 bg-[#fcfafc] p-5 small:p-6">
          <p className="text-sm font-bold text-[#B3174A]">وصل حديثاً</p>
          <h1
            className="mt-1 text-2xl font-bold text-[#270830] small:text-3xl"
            data-testid="store-page-title"
          >
            منتجات جديدة
          </h1>
        </div>
        <Suspense fallback={<SkeletonProductGrid />}>
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            countryCode={params.countryCode}
            collectionId={collection?.id}
          />
        </Suspense>
      </div>
    </div>
  )
}
