"use client"

import { signout } from "@lib/data/customer"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { clx } from "@modules/common/components/ui"
import {
  ChevronLeft,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  UserRound,
} from "lucide-react"
import { useParams, usePathname } from "next/navigation"

const navItems = [
  { href: "/account", label: "نظرة عامة", icon: LayoutDashboard, testId: "overview-link" },
  { href: "/account/profile", label: "الملف الشخصي", icon: UserRound, testId: "profile-link" },
  { href: "/account/addresses", label: "العناوين", icon: MapPin, testId: "addresses-link" },
  { href: "/account/orders", label: "الطلبات", icon: Package, testId: "orders-link" },
]

const AccountNav = ({ customer }: { customer: HttpTypes.StoreCustomer | null }) => {
  const route = usePathname() || ""
  const { countryCode } = useParams() as { countryCode: string }
  const name = [customer?.first_name, customer?.last_name].filter(Boolean).join(" ") || "عميل نيولي"
  const initial = name.trim().charAt(0) || "ن"

  const isActive = (href: string) => {
    const current = route.replace(`/${countryCode}`, "") || "/account"
    return href === "/account" ? current === href : current.startsWith(href)
  }

  const handleLogout = async () => {
    await signout(countryCode)
  }

  return (
    <div>
      <div className="rounded-2xl border border-[#270830]/5 bg-white p-4 shadow-sm lg:hidden" data-testid="mobile-account-nav">
        <div className="mb-4 flex items-center gap-3 px-1">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#67285A] text-lg font-bold text-white">{initial}</span>
          <div className="min-w-0">
            <p className="truncate font-bold text-[#270830]">{name}</p>
            <bdi dir="ltr" className="block truncate text-xs text-gray-500">{customer?.email}</bdi>
          </div>
        </div>
        <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="تنقل الحساب">
          {navItems.map(({ href, label, icon: Icon, testId }) => (
            <LocalizedClientLink
              key={href}
              href={href}
              className={clx(
                "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
                isActive(href) ? "bg-[#67285A] text-white" : "bg-[#f8f5f8] text-gray-600 hover:text-[#67285A]"
              )}
              data-testid={testId}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </LocalizedClientLink>
          ))}
        </nav>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-100"
          data-testid="mobile-logout-button"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          تسجيل الخروج
        </button>
        <LocalizedClientLink href="/account" className="sr-only" data-testid="account-main-link">الحساب</LocalizedClientLink>
      </div>

      <div className="hidden overflow-hidden rounded-3xl border border-[#270830]/5 bg-white shadow-sm lg:block" data-testid="account-nav">
        <div className="bg-[#270830] p-6 text-white">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl font-bold">{initial}</span>
          <h2 className="mt-4 truncate text-lg font-bold">{name}</h2>
          <bdi dir="ltr" className="mt-1 block truncate text-xs text-white/60">{customer?.email}</bdi>
        </div>
        <nav className="space-y-1 p-3" aria-label="تنقل الحساب">
          {navItems.map(({ href, label, icon: Icon, testId }) => (
            <LocalizedClientLink
              key={href}
              href={href}
              className={clx(
                "group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition",
                isActive(href) ? "bg-[#f3edf5] text-[#67285A]" : "text-gray-600 hover:bg-gray-50 hover:text-[#67285A]"
              )}
              data-testid={testId}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="flex-1">{label}</span>
              <ChevronLeft className="h-4 w-4 opacity-40 transition group-hover:-translate-x-0.5" aria-hidden="true" />
            </LocalizedClientLink>
          ))}
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
            data-testid="logout-button"
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
            تسجيل الخروج
          </button>
        </nav>
      </div>
    </div>
  )
}

export default AccountNav
