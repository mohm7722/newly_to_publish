import { Metadata } from "next"
import { notFound } from "next/navigation"
import { MapPin } from "lucide-react"
import AddressBook from "@modules/account/components/address-book"
import { getRegion } from "@lib/data/regions"
import { retrieveCustomer } from "@lib/data/customer"

export const metadata: Metadata = { title: "العناوين", description: "عرض عناوينك" }

export default async function Addresses(props: { params: Promise<{ countryCode: string }> }) {
  const { countryCode } = await props.params
  const customer = await retrieveCustomer()
  const region = await getRegion(countryCode)
  if (!customer || !region) notFound()

  return (
    <div className="w-full" data-testid="addresses-page-wrapper">
      <div className="mb-8 flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><MapPin className="h-6 w-6" /></span>
        <div>
          <p className="text-sm font-bold text-[#B3174A]">بيانات التوصيل</p>
          <h1 className="mt-1 text-2xl font-bold text-[#270830] sm:text-3xl">عناوين الشحن</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-gray-500">أضف عناوينك وحدّثها لتختار منها بسرعة عند إتمام الطلب.</p>
        </div>
      </div>
      <AddressBook customer={customer} region={region} />
    </div>
  )
}
