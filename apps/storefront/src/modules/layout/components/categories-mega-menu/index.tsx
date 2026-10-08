"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { clx } from "@modules/common/components/ui"
import { NavCategory } from "../nav-types"

type Props = {
  categories: NavCategory[]
}

/**
 * Desktop-only categories bar with a hover "mega menu" panel.
 *
 * Renders the top-level categories as a horizontal bar beneath the header; a
 * category that has children reveals a panel listing them on hover/focus.
 * Hidden on mobile (the side menu + bottom nav cover small screens).
 */
export default function CategoriesMegaMenu({ categories }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null)

  if (!categories.length) return null

  const active = categories.find((c) => c.id === activeId) || null

  return (
    <div
      dir="rtl"
      className="relative hidden border-b border-gray-100 bg-white md:block"
      onMouseLeave={() => setActiveId(null)}
    >
      <div className="max-w-container mx-auto px-4">
        <ul className="flex items-center gap-1">
          <li>
            <LocalizedClientLink
              href="/store"
              className="flex items-center gap-1 px-3 py-3 text-sm font-semibold text-neoly-primary hover:text-[#3a0f49]"
            >
              كل المنتجات
            </LocalizedClientLink>
          </li>
          {categories.map((cat) => (
            <li
              key={cat.id}
              onMouseEnter={() => setActiveId(cat.id)}
            >
              <LocalizedClientLink
                href={`/store/${cat.handle}`}
                className={clx(
                  "flex items-center gap-1 px-3 py-3 text-sm font-medium transition-colors",
                  activeId === cat.id
                    ? "text-neoly-primary"
                    : "text-gray-700 hover:text-neoly-primary"
                )}
              >
                {cat.name}
                {cat.children.length > 0 && (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </LocalizedClientLink>
            </li>
          ))}
        </ul>
      </div>

      {/* Panel */}
      {active && active.children.length > 0 && (
        <div className="absolute inset-x-0 top-full z-50 border-b border-gray-100 bg-white shadow-lg">
          <div className="max-w-container mx-auto px-4 py-6">
            <div className="mb-3 text-sm font-bold text-neoly-primary">
              {active.name}
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 md:grid-cols-3 lg:grid-cols-4">
              {active.children.map((child) => (
                <LocalizedClientLink
                  key={child.id}
                  href={`/store/${child.handle}`}
                  className="truncate rounded-lg px-2 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-neoly-primary"
                >
                  {child.name}
                </LocalizedClientLink>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
