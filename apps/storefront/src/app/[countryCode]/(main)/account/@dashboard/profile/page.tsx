import { Metadata } from "next"
import { UserRound } from "lucide-react"

import ProfilePhone from "@modules/account/components/profile-phone"
import ProfileEmail from "@modules/account/components/profile-email"
import ProfileName from "@modules/account/components/profile-name"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { notFound } from "next/navigation"
import { retrieveCustomer } from "@lib/data/customer"

export const metadata: Metadata = {
  title: "الملف الشخصي",
  description: "عرض وتعديل ملفك الشخصي في متجر نيولي.",
}

export default async function Profile() {
  const customer = await retrieveCustomer()

  if (!customer) notFound()

  return (
    <div className="w-full" data-testid="profile-page-wrapper">
      <div className="mb-8 flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f3edf5] text-[#67285A]">
          <UserRound className="h-6 w-6" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-bold text-[#B3174A]">إعدادات الحساب</p>
          <h1 className="mt-1 text-2xl font-bold text-[#270830] sm:text-3xl">الملف الشخصي</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-gray-500">
            حدّث اسمك ورقم هاتفك. بريد تسجيل الدخول ظاهر للقراءة فقط حفاظًا على أمان الحساب.
          </p>
        </div>
      </div>
      <div className="space-y-4">
        <ProfileName customer={customer} />
        <ProfileEmail customer={customer} />
        <ProfilePhone customer={customer} />
      </div>
      <p className="mt-6 rounded-2xl bg-[#fcfafc] px-4 py-3 text-sm leading-7 text-gray-500">
        العناوين تُدار من صفحة{" "}
        <LocalizedClientLink
          href="/account/addresses"
          className="font-bold text-[#67285A] underline"
        >
          عناويني
        </LocalizedClientLink>
        . تُستخدم نفس العناوين للتوصيل وإصدار الفاتورة، فلا توجد حقول فوترة
        منفصلة.
      </p>
    </div>
  )
}
