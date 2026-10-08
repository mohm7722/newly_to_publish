"use client"

import { Popover, PopoverButton, PopoverPanel, Transition } from "@headlessui/react"
import useToggleState from "@lib/hooks/use-toggle-state"
import { ArrowRightMini } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Text, clx } from "@modules/common/components/ui"
import { Fragment } from "react"
import {
  Menu,
  X,
  Home,
  Store,
  User,
  ShoppingBag,
  Globe,
  MapPin,
  Coins,
  ChevronLeft,
} from "lucide-react"
import { useParams, usePathname } from "next/navigation"
import CountrySelect from "../country-select"
import CurrencySwitcher from "../currency-switcher"
import LanguageSelect from "../language-select"
import { Locale } from "@lib/data/locales"

const iconBtn =
  "p-2.5 rounded-xl text-gray-700 hover:text-red-600 hover:bg-gray-50 active:scale-95 transition-colors transition-transform"

const SideMenuItems = [
  { name: "الرئيسية", href: "/", icon: Home },
  { name: "المتجر", href: "/store", icon: Store },
  { name: "الحساب", href: "/account", icon: User },
  { name: "السلة", href: "/cart", icon: ShoppingBag },
]

type SideMenuProps = {
  regions: HttpTypes.StoreRegion[] | null
  locales: Locale[] | null
  currentLocale: string | null
}

const SideMenu = ({ regions, locales, currentLocale }: SideMenuProps) => {
  const countryToggleState = useToggleState()
  const languageToggleState = useToggleState()
  const currencyToggleState = useToggleState()

  const { countryCode } = useParams()
  const pathname = usePathname()

  const isActive = (href: string) => {
    const base = `/${countryCode}`
    if (href === "/") {
      return pathname === base || pathname === `${base}/`
    }
    return pathname === `${base}${href}` || pathname.startsWith(`${base}${href}/`)
  }

  return (
    <div className="h-full">
      <div className="flex items-center h-full">
        <Popover className="h-full flex">
          {({ open, close }) => (
            <>
              <div className="relative flex h-full">
                <PopoverButton
                  data-testid="nav-menu-button"
                  className={`${iconBtn} relative h-full flex items-center focus:outline-none`}
                  aria-label="القائمة"
                >
                  <Menu className="w-7 h-7" />
                </PopoverButton>
              </div>

              {/* Backdrop */}
              <Transition
                show={open}
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div
                  className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
                  onClick={close}
                  data-testid="side-menu-backdrop"
                  aria-hidden="true"
                />
              </Transition>

              {/* Drawer */}
              <Transition
                show={open}
                as={Fragment}
                enter="transition ease-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transition ease-in duration-200"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <PopoverPanel
                  static
                  dir="rtl"
                  className="fixed right-0 top-0 z-[61] h-screen w-[360px] max-w-[88vw] bg-white shadow-2xl flex flex-col"
                  data-testid="nav-menu-popup"
                >
                  {/* Header */}
                  <div
                    className="relative px-6 py-5 text-white overflow-hidden shrink-0"
                    style={{
                      background:
                        "radial-gradient(700px 300px at 90% -20%, rgba(208,30,92,0.45), transparent 60%), #270830",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <LocalizedClientLink href="/" onClick={close}>
                        <img
                          src="/logo-newly-wait-1.svg"
                          alt="نيولي"
                          className="h-9 w-auto"
                        />
                      </LocalizedClientLink>
                      <button
                        data-testid="close-menu-button"
                        onClick={close}
                        aria-label="إغلاق القائمة"
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="mt-3 text-sm text-white/80">
                      أهلاً بك في متجر نيولي
                    </p>
                  </div>

                  {/* Navigation */}
                  <nav className="flex-1 overflow-y-auto px-3 py-4">
                    <p className="px-3 pb-2 text-xs font-semibold text-gray-400">
                      التصفّح
                    </p>
                    <ul className="flex flex-col gap-1">
                      {SideMenuItems.map(({ name, href, icon: Icon }) => {
                        const active = isActive(href)
                        return (
                          <li key={name}>
                            <LocalizedClientLink
                              href={href}
                              onClick={close}
                              data-testid={`${name}-link`}
                              className={clx(
                                "group flex items-center justify-between rounded-xl px-3 py-3 transition-colors",
                                active
                                  ? "bg-neoly-primary/10 text-neoly-primary"
                                  : "text-gray-700 hover:bg-gray-50 hover:text-neoly-primary"
                              )}
                            >
                              <span className="flex items-center gap-3">
                                <span
                                  className={clx(
                                    "flex items-center justify-center w-9 h-9 rounded-lg transition-colors",
                                    active
                                      ? "bg-neoly-primary text-white"
                                      : "bg-gray-100 text-gray-600 group-hover:bg-neoly-primary/10 group-hover:text-neoly-primary"
                                  )}
                                >
                                  <Icon className="w-5 h-5" />
                                </span>
                                <span className="text-base font-medium">
                                  {name}
                                </span>
                              </span>
                              <ChevronLeft
                                className={clx(
                                  "w-4 h-4 transition-transform",
                                  active
                                    ? "text-neoly-primary"
                                    : "text-gray-300 group-hover:text-neoly-primary group-hover:-translate-x-0.5"
                                )}
                              />
                            </LocalizedClientLink>
                          </li>
                        )
                      })}
                    </ul>
                  </nav>

                  {/* Settings */}
                  <div className="shrink-0 border-t border-gray-100 px-3 py-4">
                    <p className="px-3 pb-2 text-xs font-semibold text-gray-400">
                      الإعدادات
                    </p>
                    <div className="flex flex-col gap-1">
                      {!!locales?.length && (
                        <div
                          className="flex items-center justify-between gap-2 rounded-xl px-3 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                          onMouseEnter={languageToggleState.open}
                          onMouseLeave={languageToggleState.close}
                        >
                          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 text-gray-600 shrink-0">
                            <Globe className="w-5 h-5" />
                          </span>
                          <div className="flex-1 min-w-0">
                            <LanguageSelect
                              toggleState={languageToggleState}
                              locales={locales}
                              currentLocale={currentLocale}
                            />
                          </div>
                          <ArrowRightMini
                            className={clx(
                              "transition-transform duration-150 text-gray-400 shrink-0",
                              languageToggleState.state ? "-rotate-90" : ""
                            )}
                          />
                        </div>
                      )}

                      {regions && (
                        <div
                          className="flex items-center justify-between gap-2 rounded-xl px-3 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                          onMouseEnter={countryToggleState.open}
                          onMouseLeave={countryToggleState.close}
                        >
                          <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 text-gray-600 shrink-0">
                            <MapPin className="w-5 h-5" />
                          </span>
                          <div className="flex-1 min-w-0">
                            <CountrySelect
                              toggleState={countryToggleState}
                              regions={regions}
                            />
                          </div>
                          <ArrowRightMini
                            className={clx(
                              "transition-transform duration-150 text-gray-400 shrink-0",
                              countryToggleState.state ? "-rotate-90" : ""
                            )}
                          />
                        </div>
                      )}

                      <div
                        className="flex items-center justify-between gap-2 rounded-xl px-3 py-3 text-gray-700 hover:bg-gray-50 transition-colors"
                        onMouseEnter={currencyToggleState.open}
                        onMouseLeave={currencyToggleState.close}
                      >
                        <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 text-gray-600 shrink-0">
                          <Coins className="w-5 h-5" />
                        </span>
                        <div className="flex-1 min-w-0">
                          <CurrencySwitcher toggleState={currencyToggleState} />
                        </div>
                        <ArrowRightMini
                          className={clx(
                            "transition-transform duration-150 text-gray-400 shrink-0",
                            currencyToggleState.state ? "-rotate-90" : ""
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="shrink-0 border-t border-gray-100 px-6 py-4">
                    <Text className="text-xs text-gray-400">
                      © {new Date().getFullYear()} متجر نيولي. جميع الحقوق
                      محفوظة.
                    </Text>
                  </div>
                </PopoverPanel>
              </Transition>
            </>
          )}
        </Popover>
      </div>
    </div>
  )
}

export default SideMenu
