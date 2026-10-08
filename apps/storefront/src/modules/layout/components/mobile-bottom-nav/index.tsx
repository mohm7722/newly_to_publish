"use client"

import { Home, LayoutGrid, Search, ShoppingBag, User } from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { clx } from "@modules/common/components/ui"
import { useParams, usePathname } from "next/navigation"

type Props = {
  cartCount?: number
}

/**
 * Fixed bottom navigation for mobile (hidden on md+). Standard commerce tab bar:
 * home / categories / search / cart / account, with a live cart count. The
 * "بحث" tab focuses the header search input (`#site-search`) and scrolls to top
 * rather than navigating, keeping search in one place.
 */
export default function MobileBottomNav({ cartCount = 0 }: Props) {
  const { countryCode } = useParams()
  const pathname = usePathname()

  const base = `/${countryCode}`
  const isActive = (href: string) => {
    if (href === "/") return pathname === base || pathname === `${base}/`
    return pathname === `${base}${href}` || pathname.startsWith(`${base}${href}/`)
  }

  const focusSearch = () => {
    if (typeof document === "undefined") return
    window.scrollTo({ top: 0, behavior: "smooth" })
    const el = document.getElementById("site-search") as HTMLInputElement | null
    el?.focus()
  }

  const itemBase =
    "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors"

  return (
    <nav
      dir="rtl"
      aria-label="التنقّل السريع"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-100 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(0,0,0,0.06)] backdrop-blur md:hidden"
    >
      <div className="mx-auto flex max-w-container items-stretch">
        <LocalizedClientLink
          href="/"
          className={clx(itemBase, isActive("/") ? "text-neoly-primary" : "text-gray-500")}
        >
          <Home className="h-6 w-6" />
          <span>الرئيسية</span>
        </LocalizedClientLink>

        <LocalizedClientLink
          href="/store"
          className={clx(
            itemBase,
            isActive("/store") ? "text-neoly-primary" : "text-gray-500"
          )}
        >
          <LayoutGrid className="h-6 w-6" />
          <span>التصنيفات</span>
        </LocalizedClientLink>

        <button type="button" onClick={focusSearch} className={clx(itemBase, "text-gray-500")}>
          <Search className="h-6 w-6" />
          <span>بحث</span>
        </button>

        <LocalizedClientLink
          href="/cart"
          className={clx(
            itemBase,
            "relative",
            isActive("/cart") ? "text-neoly-primary" : "text-gray-500"
          )}
        >
          <span className="relative">
            <ShoppingBag className="h-6 w-6" />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#d01e5c] px-1 text-[10px] font-bold text-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </span>
          <span>السلة</span>
        </LocalizedClientLink>

        <LocalizedClientLink
          href="/account"
          className={clx(
            itemBase,
            isActive("/account") ? "text-neoly-primary" : "text-gray-500"
          )}
        >
          <User className="h-6 w-6" />
          <span>حسابي</span>
        </LocalizedClientLink>
      </div>
    </nav>
  )
}
