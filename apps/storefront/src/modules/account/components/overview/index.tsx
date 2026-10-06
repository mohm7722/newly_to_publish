import LocalizedClientLink from "@modules/common/components/localized-client-link"
import FxPrice from "@modules/common/components/fx-price"
import { HttpTypes } from "@medusajs/types"
import { ArrowLeft, MapPin, Package, UserRound } from "lucide-react"

type OverviewProps = {
  customer: HttpTypes.StoreCustomer | null
  orders: HttpTypes.StoreOrder[] | null
}

const formatDate = (value: string | Date) =>
  new Intl.DateTimeFormat("ar-YE", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value))

const Overview = ({ customer, orders }: OverviewProps) => {
  const completion = getProfileCompletion(customer)
  const name = customer?.first_name || "عميل نيولي"

  return (
    <div className="space-y-8" data-testid="overview-page-wrapper">
      <section className="relative overflow-hidden rounded-3xl bg-[#270830] p-6 text-white sm:p-8">
        <div className="absolute -left-12 -top-16 h-48 w-48 rounded-full bg-[#B3174A]/30 blur-2xl" />
        <div className="relative">
          <p className="text-sm text-white/65">لوحة حسابك</p>
          <h1 className="mt-2 text-2xl font-bold sm:text-3xl" data-testid="welcome-message" data-value={customer?.first_name}>
            مرحبًا {name}
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-7 text-white/70">
            تابع طلباتك وحدّث بياناتك وعناوينك من مكان واحد.
          </p>
          <bdi dir="ltr" className="mt-5 inline-flex rounded-full bg-white/10 px-4 py-2 text-xs text-white/80" data-testid="customer-email" data-value={customer?.email}>
            {customer?.email}
          </bdi>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <LocalizedClientLink href="/account/profile" className="group rounded-2xl border border-gray-100 bg-[#fcfafc] p-5 transition hover:border-[#67285A]/20 hover:shadow-neoly">
          <div className="flex items-start justify-between">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f3edf5] text-[#67285A]"><UserRound className="h-5 w-5" /></span>
            <ArrowLeft className="h-5 w-5 text-gray-300 transition group-hover:-translate-x-1 group-hover:text-[#67285A]" />
          </div>
          <p className="mt-5 text-sm text-gray-500">اكتمال الملف الشخصي</p>
          <div className="mt-1 flex items-end gap-2">
            <strong className="text-3xl text-[#270830]" data-testid="customer-profile-completion" data-value={completion}>{completion}%</strong>
            <span className="pb-1 text-sm text-gray-500">مكتمل</span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#67285A]/10"><div className="h-full rounded-full bg-[#82ac40]" style={{ width: `${completion}%` }} /></div>
        </LocalizedClientLink>

        <LocalizedClientLink href="/account/addresses" className="group rounded-2xl border border-gray-100 bg-[#fcfafc] p-5 transition hover:border-[#67285A]/20 hover:shadow-neoly">
          <div className="flex items-start justify-between">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><MapPin className="h-5 w-5" /></span>
            <ArrowLeft className="h-5 w-5 text-gray-300 transition group-hover:-translate-x-1 group-hover:text-[#67285A]" />
          </div>
          <p className="mt-5 text-sm text-gray-500">العناوين المحفوظة</p>
          <div className="mt-1 flex items-end gap-2">
            <strong className="text-3xl text-[#270830]" data-testid="addresses-count" data-value={customer?.addresses?.length || 0}>{customer?.addresses?.length || 0}</strong>
            <span className="pb-1 text-sm text-gray-500">عنوان</span>
          </div>
          <p className="mt-4 text-sm text-gray-500">استخدمها لتسريع إتمام الطلب.</p>
        </LocalizedClientLink>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-[#B3174A]">نشاطك</p>
            <h2 className="mt-1 text-xl font-bold text-[#270830]">أحدث الطلبات</h2>
          </div>
          <LocalizedClientLink href="/account/orders" className="text-sm font-bold text-[#67285A] hover:underline">عرض الكل</LocalizedClientLink>
        </div>

        <ul className="space-y-3" data-testid="orders-wrapper">
          {orders && orders.length > 0 ? orders.slice(0, 5).map((order) => (
            <li key={order.id} data-testid="order-wrapper" data-value={order.id}>
              <LocalizedClientLink href={`/account/orders/details/${order.id}`} className="group flex flex-col gap-4 rounded-2xl border border-gray-100 p-4 transition hover:border-[#67285A]/20 hover:bg-[#fcfafc] sm:flex-row sm:items-center">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f3edf5] text-[#67285A]"><Package className="h-5 w-5" /></span>
                <span className="grid flex-1 grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                  <span><span className="block text-xs text-gray-500">رقم الطلب</span><strong className="mt-1 block" data-testid="order-id" data-value={order.display_id}>#{order.display_id}</strong></span>
                  <span><span className="block text-xs text-gray-500">التاريخ</span><span className="mt-1 block" data-testid="order-created-date">{formatDate(order.created_at)}</span></span>
                  <span><span className="block text-xs text-gray-500">الإجمالي</span><strong className="mt-1 block text-[#67285A]" data-testid="order-amount"><FxPrice amountSar={order.total} /></strong></span>
                </span>
                <span className="self-end text-[#67285A] transition group-hover:-translate-x-1 sm:self-auto" data-testid="open-order-button"><ArrowLeft className="h-5 w-5" /></span>
              </LocalizedClientLink>
            </li>
          )) : (
            <li className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500" data-testid="no-orders-message">لا توجد طلبات حديثة حتى الآن.</li>
          )}
        </ul>
      </section>
    </div>
  )
}

const getProfileCompletion = (customer: HttpTypes.StoreCustomer | null) => {
  if (!customer) return 0
  let count = 0
  if (customer.email) count++
  if (customer.first_name && customer.last_name) count++
  if (customer.phone) count++
  if (customer.addresses?.some((address) => address.is_default_billing)) count++
  return (count / 4) * 100
}

export default Overview
