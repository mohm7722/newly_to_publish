"use client"

import React, { useCallback, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

type Props = {
  placeholder?: string
  defaultValue?: string
}

export default function StoreSearchBar({ placeholder, defaultValue }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(defaultValue || "")

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      if (value && value.trim().length > 0) {
        params.set(name, value.trim())
      } else {
        params.delete(name)
      }
      return params.toString()
    },
    [searchParams]
  )

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const query = createQueryString("q", value)
    router.push(`${pathname}?${query}`)
  }

  return (
    <form onSubmit={onSubmit} className="w-full">
      {/* حاوية الحقل */}
      <div
        className="
          flex flex-row-reverse items-center gap-0
          bg-white rounded-full border border-gray-200 shadow-sm
          h-10 sm:h-11 pr-3 pl-0
          overflow-hidden
        "
      >
        {/* الزر ممتلئ من الطرف، بنفس ارتفاع الحقل */}
        <button
          type="submit"
          className="
            shrink-0 h-full px-4
            inline-flex items-center justify-center
            bg-gray-100 hover:bg-gray-200 text-gray-700
            rounded-none
            text-xs sm:text-sm transition-colors
          "
        >
          بحث
        </button>

        {/* الحقل */}
        <input
          type="search"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="
            flex-1 h-full py-0 px-3 outline-none bg-transparent
            text-sm text-gray-800
            placeholder:text-gray-400 placeholder:text-sm sm:placeholder:text-sm
            rtl-text-right
          "
          placeholder={placeholder || "ابحث عن منتج"}
        />
      </div>
    </form>
  )
}
