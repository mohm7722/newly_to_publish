import { Suspense } from "react"
import { ShoppingCart, User } from "lucide-react"

import { getLocale } from "@lib/data/locale-actions"
import { listRegions } from "@lib/data/regions"
import { StoreRegion } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"

export default async function Nav() {
  const [regions, currentLocale] = await Promise.all([
    listRegions().then((regions: StoreRegion[]) => regions),
    getLocale(),
  ])

  // Multi-language switching is not enabled: the backend has no `/store/locales`
  // endpoint, so we skip the call (which only produced 404 noise) and let the
  // SideMenu hide the language switcher via its `!!locales?.length` guard.
  const locales = null

  const iconBtn =
    "p-2.5 rounded-xl text-gray-700 hover:text-red-600 hover:bg-gray-50 active:scale-95 transition-colors transition-transform"

  return (
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
          <nav className="flex items-center justify-between h-[60px]">
            {/* Left Side - Hamburger Menu (with locale/region/currency) */}
            <div className="flex items-center">
              <div className="h-full">
                <SideMenu
                  regions={regions}
                  locales={locales}
                  currentLocale={currentLocale}
                />
              </div>
            </div>

            {/* Center - Logo */}
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

            {/* Right Side - Cart + Account */}
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
        </div>
      </header>
    </div>
  )
}
