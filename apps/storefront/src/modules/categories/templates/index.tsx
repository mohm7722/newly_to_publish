import { notFound } from "next/navigation"
import { Suspense } from "react"

import InteractiveLink from "@modules/common/components/interactive-link"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

export default function CategoryTemplate({
  category,
  sortBy,
  page,
  countryCode,
}: {
  category: HttpTypes.StoreProductCategory
  sortBy?: SortOptions
  page?: string
  countryCode: string
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"

  if (!category || !countryCode) notFound()

  const parents = [] as HttpTypes.StoreProductCategory[]

  const getParents = (category: HttpTypes.StoreProductCategory) => {
    if (category.parent_category) {
      parents.push(category.parent_category)
      getParents(category.parent_category)
    }
  }

  getParents(category)

  return (
    <div
      className="content-container flex flex-col gap-5 py-4 small:flex-row small:items-start small:gap-6 small:py-8"
      data-testid="category-container"
    >
      <RefinementList sortBy={sort} data-testid="sort-by-container" />
      <div className="min-w-0 w-full">
        <div className="mb-6 rounded-3xl border border-[#67285A]/10 bg-[#fcfafc] p-5 small:p-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-semibold text-[#67285A]">
            {parents &&
              parents.map((parent) => (
                <span key={parent.id} className="flex items-center gap-2 text-gray-500">
                  <LocalizedClientLink
                    className="transition-colors hover:text-[#67285A]"
                    href={`/categories/${parent.handle}`}
                    data-testid="sort-by-link"
                  >
                    {parent.name}
                  </LocalizedClientLink>
                  <span aria-hidden="true">/</span>
                </span>
              ))}
            <h1
              className="min-w-0 break-words text-2xl font-bold text-[#270830] small:text-3xl"
              data-testid="category-page-title"
            >
              {category.name}
            </h1>
          </div>
          {category.description && (
            <div className="mt-4 max-w-3xl text-sm leading-7 text-gray-600 small:text-base">
              <p>{category.description}</p>
            </div>
          )}
          {category.category_children && (
            <div className="mt-5 text-sm font-semibold">
              <ul className="flex flex-wrap gap-2">
                {category.category_children?.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-xl border border-[#67285A]/10 bg-white px-3 py-2 text-[#67285A]"
                  >
                    <InteractiveLink href={`/categories/${c.handle}`}>
                      {c.name}
                    </InteractiveLink>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <Suspense
          fallback={
            <SkeletonProductGrid
              numberOfProducts={category.products?.length ?? 8}
            />
          }
        >
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            categoryId={category.id}
            countryCode={countryCode}
          />
        </Suspense>
      </div>
    </div>
  )
}
