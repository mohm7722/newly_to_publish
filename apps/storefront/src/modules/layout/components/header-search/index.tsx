"use client"

import React, { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Search } from "lucide-react"

type Props = {
  placeholder?: string
}

/**
 * Header search bar. Always routes to the store listing with a `q` query
 * (`/{countryCode}/store?q=...`), where results are rendered. The input carries
 * a stable id (`site-search`) so the mobile bottom-nav "بحث" tab can focus it.
 */
export default function HeaderSearch({ placeholder }: Props) {
  const router = useRouter()
  const { countryCode } = useParams()
  const [value, setValue] = useState("")

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const term = value.trim()
    const base = `/${countryCode}/store`
    router.push(term ? `${base}?q=${encodeURIComponent(term)}` : base)
  }

  return (
    <form onSubmit={onSubmit} dir="rtl" className="w-full">
      <div className="flex items-center gap-0 overflow-hidden rounded-full border border-gray-200 bg-white shadow-sm focus-within:border-neoly-primary/40">
        <span className="flex items-center pr-3 pl-2 text-gray-400">
          <Search className="h-5 w-5" />
        </span>
        <input
          id="site-search"
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder || "ابحث عن منتج…"}
          className="h-10 flex-1 bg-transparent px-2 text-sm text-gray-800 outline-none placeholder:text-gray-400 sm:h-11"
          aria-label="بحث في المتجر"
        />
        <button
          type="submit"
          className="h-full shrink-0 bg-neoly-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#3a0f49]"
        >
          بحث
        </button>
      </div>
    </form>
  )
}
