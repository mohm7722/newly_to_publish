import { Suspense } from "react"
import { ShoppingCart, User } from "lucide-react"

import { getLocale } from "@lib/data/locale-actions"
import { listRegions } from "@lib/data/regions"
import { listCategories } from "@lib/data/categories"
import { retrieveCart } from "@lib/data/cart"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"
import HeaderSearch from "@modules/layout/components/header-search"
import CategoriesMegaMenu from "@modules/layout/components/categories-mega-menu"
import MobileBottomNav from "@modules/layout/components/mobile-bottom-nav"
import { NavCategory } from "@modules/layout/components/nav-types"

/** Build a top-level category tree (parent + direct children) for the nav. */
function buildCategoryTree(raw: any[]): NavCategory[] {
  return (raw || [])
    .filter((c) => !c?.parent_category)
    .map((c) => ({
      id: c.id as string,
      name: (c?.name || c?.title || "") as string,
      handle: (c?.handle || "") as string,
      children: (c?.category_children || [])
        .map((ch: any) => ({
          id: ch.id as string,
          name: (ch?.name || ch?.title || "") as string,
          handle: (ch?.handle || "") as string,
        }))
        .filter((ch: NavCategory["children"][number]) => ch.name && ch.handle),
    }))
    .filter((c) => c.name && c.handle)
}

export default async function Nav() {
  const [regions, currentLocale, rawCategories, cart] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    getLocale(),
    listCategories({ limit: 100 }).catch(() => [] as any[]),
    retrieveCart().catch(() => null),
  ])

  // Multi-language switching is not enabled: the backend has no `/store/locales`
  // endpoint, so we skip the call (which only produced 404 noise) and let the
  // SideMenu hide the language switcher via its `!!locales?.length` guard.
  const locales = null

  const categories = buildCategoryTree(rawCategories)
  const cartCount =
    (cart?.items ?? []).reduce(
      (sum: number, item: any) => sum + (Number(item?.quantity) || 0),
      0
    ) || 0

  const iconBtn =
    "p-2.5 rounded-xl text-gray-700 hover:text-red-600 hover:bg-gray-50 active:scale-95 transition-colors transition-transform"

  return (
    <>
      <div className="sticky top-0 inset-x-0 z-50 group">
        {/* Announcement Bar */}
        <div style={{ backgroundColor: "#d01e5c" }} className="text-white">
          <div className="max-w-container mx-auto px-4">
            <div dir="rtl" className="overflow-hidden py-2 text-sm">
              <div className="marquee-rtl whitespace-nowrap">
                <span className="mx-6">
                  مرحبا بك في متجر نيولي — خصومات مميزة هذا الأسبوع
                </span>
                <span className="mx-6">شحن سريع وخدمة عملاء 24/7</span>
                <span className="mx-6">استخدم كود NEOLY10 للحصول على خصم 10%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Header - هيدر علوي: لوجو وقائمة همبرغر */}
        <header className="relative bg-white border-b border-gray-100 shadow-neoly">
          <div className="max-w-container mx-auto px-4">
            <nav className="flex items-center justify-between h-[60px] gap-3">
              {/* Right (RTL) - Hamburger Menu + categories */}
              <div className="flex items-center">
                <div className="h-full">
                  <SideMenu
                    regions={regions}
                    locales={locales}
                    currentLocale={currentLocale}
                    categories={categories}
                  />
                </div>
              </div>

              {/* Logo */}
              <div className="flex items-center">
                <LocalizedClientLink
                  href="/"
                  data-testid="nav-store-link"
                  className="inline-flex items-center"
                >
                  <img
                    src="/logo-newly.svg"
                    alt="نيولي"
                    className="h-[2.02rem] md:h-[2.31rem] w-auto"
                  />
                </LocalizedClientLink>
              </div>

              {/* Inline search (desktop only) */}
              <div className="hidden flex-1 md:block">
                <div className="mx-auto max-w-xl">
                  <HeaderSearch />
                </div>
              </div>

              {/* Left (RTL) - Cart + Account */}
              <div className="flex items-center gap-3">
                <Suspense
                  fallback={
                    <LocalizedClientLink
                      className={`relative ${iconBtn} order-2`}
                      href="/cart"
                      data-testid="nav-cart-link"
                    >
                      <ShoppingCart className="w-6 h-6" />
                    </LocalizedClientLink>
                  }
                >
                  <div className="order-2">
                    <CartButton />
                  </div>
                </Suspense>
                <LocalizedClientLink
                  href="/account"
                  className={`${iconBtn} order-3`}
                  aria-label="حسابي"
                >
                  <User className="w-6 h-6" />
                </LocalizedClientLink>
              </div>
            </nav>

            {/* Search row - mobile only (desktop search is inline above) */}
            <div className="pb-3 md:hidden">
              <HeaderSearch />
            </div>
          </div>

          {/* Desktop categories mega menu */}
          <CategoriesMegaMenu categories={categories} />
        </header>
      </div>

      {/* Mobile fixed bottom navigation */}
      <MobileBottomNav cartCount={cartCount} />
    </>
  )
}
