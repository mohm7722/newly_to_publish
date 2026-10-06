import { Suspense } from "react"
import StickyStoreCategoryBar from "@modules/store/components/category-bar/sticky"
import StoreSearchBar from "@modules/store/components/store-search-bar"
import SortDropdown from "@modules/store/components/sort-dropdown"

import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

import PaginatedProducts from "./paginated-products"
import { listCategoriesNormalized } from "@lib/data/categories"

const StoreTemplate = async ({
  sortBy,
  page,
  query,
  countryCode,
  categoryId,
  categoryName,
}: {
  sortBy?: SortOptions
  page?: string
  query?: string
  countryCode: string
  categoryId?: string
  categoryName?: string
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"
  const categories = await listCategoriesNormalized({ limit: 50 }, { fresh: true })

  return (
    <div
      className="content-container py-4 small:py-8"
      data-testid="category-container"
    >
      {/* شريط البحث (يختفي عند التثبيت لتوفير مساحة) */}
      <div className="mb-4">
        <StoreSearchBar placeholder="ابحث عن اي منتج" defaultValue={query} />
      </div>

      {/* قائمة الفئات الأفقية (تصميم مسطح مثل مكسبي) */}
      {/* توضع أسفل شريط البحث بشكل طبيعي، وعند التمرير تصبح sticky تحت الهيدر */}
      <div className="mb-4">
        <StickyStoreCategoryBar
          categories={categories.map((c) => ({
            id: c.id,
            title: c.name,
            handle: c.handle,
          }))}
          activeId={categoryId}
        />
      </div>

      {/* فهرس */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#67285A]/10 bg-[#fcfafc] px-4 py-3 small:px-5">
        <div className="min-w-0 text-sm font-semibold text-[#67285A]">
          / {categoryName || "الكل"}
        </div>
        {/* زر الفرز */}
        <SortDropdown sortBy={sort} />
      </div>

      <Suspense fallback={<SkeletonProductGrid />}>
        <PaginatedProducts
          sortBy={sort}
          page={pageNumber}
          query={query}
          categoryId={categoryId}
          countryCode={countryCode}
          desktopCols={5}
        />
      </Suspense>
    </div>
  )
}

export default StoreTemplate
