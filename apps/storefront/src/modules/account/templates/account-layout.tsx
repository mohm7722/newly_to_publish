import React from "react"

import UnderlineLink from "@modules/common/components/interactive-link"
import AccountNav from "../components/account-nav"
import { HttpTypes } from "@medusajs/types"
import { Headphones } from "lucide-react"

interface AccountLayoutProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}

const AccountLayout: React.FC<AccountLayoutProps> = ({ customer, children }) => {
  if (!customer) {
    return (
      <div className="flex-1" data-testid="account-page">
        {children}
      </div>
    )
  }

  return (
    <div className="flex-1 bg-[#f8f5f8] px-4 py-6 sm:px-6 lg:py-10" data-testid="account-page">
      <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8">
        <aside className="min-w-0">
          <AccountNav customer={customer} />
        </aside>
        <main className="min-w-0 rounded-3xl border border-[#270830]/5 bg-white p-5 shadow-sm sm:p-8 lg:p-10">
          {children}
        </main>
      </div>

      <div className="mx-auto mt-6 flex w-full max-w-7xl flex-col items-start justify-between gap-5 rounded-2xl border border-[#67285A]/10 bg-white px-5 py-5 sm:flex-row sm:items-center sm:px-7">
        <div className="flex items-center gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f3edf5] text-[#67285A]">
            <Headphones className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-bold text-[#270830]">هل تحتاج إلى مساعدة؟</h3>
            <p className="mt-1 text-sm text-gray-500">ستجد الإجابات الشائعة وطرق التواصل مع فريق نيولي.</p>
          </div>
        </div>
        <UnderlineLink href="/faq">مركز المساعدة</UnderlineLink>
      </div>
    </div>
  )
}

export default AccountLayout
