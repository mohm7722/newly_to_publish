import InteractiveLink from "@modules/common/components/interactive-link"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "404",
  description: "حدث خطأ ما",
}

export default async function NotFound() {
  return (
    <div className="flex flex-col gap-4 items-center justify-center min-h-[calc(100vh-64px)]">
      <h1 className="text-2xl-semi text-ui-fg-base">الصفحة غير موجودة</h1>
      <p className="text-small-regular text-ui-fg-base">
        الصفحة التي تحاول الوصول إليها غير موجودة.
      </p>
      <InteractiveLink href="/">العودة إلى الرئيسية</InteractiveLink>
    </div>
  )
}
