import { Metadata } from "next"
import { redirect } from "next/navigation"
import StoreTemplate from "@modules/store/templates"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { listCategoriesNormalized } from "@lib/data/categories"

export const metadata: Metadata = {
  title: "المتجر",
  description: "استكشف جميع منتجاتنا.",
}

type Params = {
  params: Promise<{ countryCode: string; category?: string[] }>
  searchParams: Promise<{
    sortBy?: SortOptions
    page?: string
    q?: string
    categoryId?: string
    categoryName?: string
  }>
}

export default async function StoreSlugPage(props: Params) {
  const { countryCode, category } = await props.params
  const search = await props.searchParams

  // Backward compatibility: redirect from old query string to clean slug
  if (search.categoryId && !category?.length) {
    const cats = await listCategoriesNormalized(undefined, { fresh: true })
    const found = cats.find((c) => c.id === search.categoryId)
    if (found) {
      const qp = new URLSearchParams()
      if (search.sortBy) qp.set("sortBy", search.sortBy)
      if (search.page) qp.set("page", search.page)
      if (search.q) qp.set("q", search.q)
      redirect(
        `/${countryCode}/store/${found.handle}${
          qp.toString() ? `?${qp.toString()}` : ""
        }`
      )
    }
  }

  // Resolve slug -> categoryId
  let categoryId: string | undefined = undefined
  let categoryName: string | undefined = undefined
  if (category?.length) {
    const cats = await listCategoriesNormalized(undefined, { fresh: true })
    const handle = category[0]
    const found = cats.find((c) => c.handle === handle)
    if (found) {
      categoryId = found.id
      categoryName = found.name
    }
  } else if (search.categoryId) {
    categoryId = search.categoryId
    categoryName = search.categoryName
  }

  return (
    <StoreTemplate
      sortBy={search.sortBy}
      page={search.page}
      query={search.q}
      countryCode={countryCode}
      categoryId={categoryId}
      categoryName={categoryName}
    />
  )
}
