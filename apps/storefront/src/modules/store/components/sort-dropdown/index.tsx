"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import type { SortOptions } from "@modules/store/components/refinement-list/sort-products"

const OPTIONS: { value: SortOptions; label: string }[] = [
  { value: "created_at", label: "الأحدث" },
  { value: "price_asc", label: "السعر: الأقل إلى الأعلى" },
  { value: "price_desc", label: "السعر: الأعلى إلى الأقل" },
]

export default function SortDropdown({ sortBy }: { sortBy: SortOptions }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  const wrapperRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  const current =
    (sortBy || (params.get("sortBy") as SortOptions) || "created_at") as SortOptions
  const active = OPTIONS.find((o) => o.value === current) ?? OPTIONS[0]

  const apply = (v: SortOptions) => {
    const sp = new URLSearchParams(params.toString())
    if (v === "created_at") sp.delete("sortBy")
    else sp.set("sortBy", v)
    router.replace(`${pathname}?${sp.toString()}`, { scroll: false })
    setOpen(false)
  }

  // إغلاق عند الضغط خارج/ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current) return
      if (!wrapperRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("mousedown", onClick)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("mousedown", onClick)
    }
  }, [])

  return (
    <div ref={wrapperRef} className="relative inline-block" dir="rtl">
      {/* زر صغير، يتكيّف مع النص، وسهم واحد فقط */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="
          relative inline-flex items-center
          h-9 pr-3 pl-9
          rounded-full border border-gray-200 bg-white shadow-sm
          text-sm whitespace-nowrap truncate
          min-w-[140px] max-w-[70vw] md:max-w-[260px]
          focus:outline-none focus:ring-2 focus:ring-rose-100 focus:border-rose-300
        "
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{active.label}</span>

        {/* السهم مثبت عند طرف الزر اليسار */}
        <svg
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-60"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M5.5 7l4.5 4.5L14.5 7" />
        </svg>
      </button>

      {/* منسدلة أنيقة ومحددة بعرض الشاشة */}
      {open && (
        <div
          className="
            absolute left-0 mt-1 z-50
            w-max min-w-[220px] max-w-[80vw] md:max-w-[320px]
          "
        >
          <ul
            role="listbox"
            className="
              rounded-xl border border-gray-200 bg-white shadow-lg p-1
              max-h-60 overflow-auto
            "
          >
            {OPTIONS.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => apply(opt.value)}
                  className={`
                    block w-full text-right px-3 py-2 text-sm rounded-lg
                    hover:bg-gray-50
                    ${opt.value === current ? "bg-gray-100 font-medium" : ""}
                  `}
                >
                  {opt.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
