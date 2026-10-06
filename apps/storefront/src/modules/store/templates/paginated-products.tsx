import { listProductsWithSort } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ProductPreview from "@modules/products/components/product-preview"
import { Pagination } from "@modules/store/components/pagination"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

const PRODUCT_LIMIT = 12

type PaginatedProductsParams = {
  limit: number
  collection_id?: string[]
  category_id?: string[]
  id?: string[]
  order?: string
}

export default async function PaginatedProducts({
  sortBy,
  page,
  collectionId,
  categoryId,
  productsIds,
  query,
  countryCode,
  desktopCols,
}: {
  sortBy?: SortOptions
  page: number
  collectionId?: string
  categoryId?: string
  productsIds?: string[]
  query?: string
  countryCode: string
  desktopCols?: 4 | 5
}) {
  const queryParams: PaginatedProductsParams = {
    limit: 12,
  }

  if (collectionId) {
    queryParams["collection_id"] = [collectionId]
  }

  if (categoryId) {
    queryParams["category_id"] = [categoryId]
  }

  if (productsIds) {
    queryParams["id"] = productsIds
  }

  if (sortBy === "created_at") {
    queryParams["order"] = "created_at"
  }

  if (query && query.trim().length > 0) {
    // يدعم Medusa البحث عبر البارام q؛ نمررها كما هي إلى الـ SDK
    // @ts-ignore - الحقل موجود في واجهة Medusa
    ;(queryParams as any)["q"] = query.trim()
  }

  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const {
    response: { products, count },
  } = await listProductsWithSort({
    page,
    queryParams,
    sortBy,
    countryCode,
  })

  const totalPages = Math.ceil(count / PRODUCT_LIMIT)

  return (
    <>
      <ul
        className={`grid w-full grid-cols-2 gap-x-3 gap-y-5 small:grid-cols-3 small:gap-5 ${
          desktopCols === 5 ? "medium:grid-cols-5" : "medium:grid-cols-4"
        } medium:gap-6`}
        data-testid="products-list"
      >
        {products.length > 0 ? (
          products.map((p) => (
            <li key={p.id} className="h-full min-w-0">
              <ProductPreview product={p} region={region} />
            </li>
          ))
        ) : (
          <li className="col-span-full">
            <div
              className="flex min-h-64 flex-col items-center justify-center rounded-3xl border border-dashed border-[#67285A]/20 bg-[#fcfafc] px-5 py-12 text-center"
              role="status"
            >
              <span
                className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f3edf5] text-2xl text-[#67285A]"
                aria-hidden="true"
              >
                ✦
              </span>
              <h2 className="text-lg font-bold text-[#270830]">
                لم نعثر على منتجات
              </h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
                جرّب تغيير خيارات الفرز أو البحث، أو تصفّح فئة أخرى.
              </p>
            </div>
          </li>
        )}
      </ul>
      {totalPages > 1 && (
        <Pagination
          data-testid="product-pagination"
          page={page}
          totalPages={totalPages}
        />
      )}
    </>
  )
}
