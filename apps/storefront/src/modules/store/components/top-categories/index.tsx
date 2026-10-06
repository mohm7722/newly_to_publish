"use client"

import React from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

type Category = {
  id: string
  name: string
}

export default function CategoryScroller({
  categories,
}: {
  categories: Category[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentId = searchParams.get("categoryId") || ""

  const onClick = (c: Category) => {
    const params = new URLSearchParams(searchParams)
    if (currentId === c.id) {
      params.delete("categoryId")
      params.delete("categoryName")
    } else {
      params.set("categoryId", c.id)
      params.set("categoryName", c.name)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  if (!categories || categories.length === 0) return null

  return (
    <div dir="ltr" className="overflow-x-auto no-scrollbar -mr-4 pr-4">
      <div dir="rtl" className="flex items-center gap-4">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onClick(c)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm transition-colors ${
              currentId === c.id
                ? "border-red-200 text-red-600 bg-red-50"
                : "border-gray-200 text-gray-700 bg-white hover:bg-gray-50"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>
    </div>
  )
}
