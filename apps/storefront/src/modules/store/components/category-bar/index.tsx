"use client"

import { useCallback } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import CategoryTabs from "@modules/home/components/category-tabs"

type Category = { id: string; title: string; handle?: string }

export default function StoreCategoryBar({
  categories,
  activeId,
}: {
  categories: Category[]
  activeId?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const onSelect = useCallback(
    (id: string) => {
      const params = new URLSearchParams(searchParams)
      const selected = categories.find((c) => c.id === id)

      // keep other filters
      // remove existing categoryId/Name remnants from query
      params.delete("categoryId")
      params.delete("categoryName")
      const qp = params.toString()

      const STORE_SEGMENT = "/store"
      const storeIdx = pathname.indexOf(STORE_SEGMENT)
      const storeBase =
        storeIdx >= 0 ? pathname.slice(0, storeIdx + STORE_SEGMENT.length) : pathname

      if (id === "all") {
        router.push(`${storeBase}${qp ? `?${qp}` : ""}`)
        return
      }

      // navigate to clean slug route (reset after /store) using handle from backend
      const rawHandle = (selected?.handle || "")
        .toString()
        .trim()
        .toLowerCase()
        .replace(/^\/+|\/+$/g, "")
      if (!rawHandle) {
        // If no handle available, fall back to base store (document missing handle)
        router.push(`${storeBase}${qp ? `?${qp}` : ""}`)
        return
      }
      router.push(
        `${storeBase}/${encodeURIComponent(rawHandle)}${qp ? `?${qp}` : ""}`
      )
    },
    [categories, pathname, router, searchParams]
  )

  const items: Category[] = [{ id: "all", title: "الكل" }, ...categories]
  const currentActive = activeId || "all"

  return (
    <CategoryTabs categories={items} activeId={currentActive} onSelect={onSelect} />
  )
}
