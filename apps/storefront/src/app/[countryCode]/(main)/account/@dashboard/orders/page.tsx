import { Metadata } from "next"
import { Package } from "lucide-react"
import OrderOverview from "@modules/account/components/order-overview"
import { redirect } from "next/navigation"
import { listOrders } from "@lib/data/orders"
import TransferRequestForm from "@modules/account/components/transfer-request-form"

export const metadata: Metadata = { title: "الطلبات", description: "نظرة عامة على طلباتك السابقة." }
type OrdersPageProps = { params: Promise<{ countryCode: string }> }

export default async function Orders({ params }: OrdersPageProps) {
  const orders = await listOrders()
  if (!orders) {
    const { countryCode } = await params
    redirect(`/${countryCode}/account?redirect=/account/orders`)
  }

  return (
    <div className="w-full" data-testid="orders-page-wrapper">
      <div className="mb-8 flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f3edf5] text-[#67285A]"><Package className="h-6 w-6" /></span>
        <div>
          <p className="text-sm font-bold text-[#B3174A]">سجل مشترياتك</p>
          <h1 className="mt-1 text-2xl font-bold text-[#270830] sm:text-3xl">الطلبات</h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-gray-500">تابع طلباتك السابقة وحالتها، وافتح أي طلب للاطلاع على تفاصيله.</p>
        </div>
      </div>
      <OrderOverview orders={orders} />
      <div className="mt-8 rounded-2xl border border-gray-100 bg-[#fcfafc] p-5 sm:p-6"><TransferRequestForm /></div>
    </div>
  )
}
