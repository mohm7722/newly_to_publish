import { acceptTransferRequest } from "@lib/data/orders"
import { Heading, Text } from "@modules/common/components/ui"
import TransferImage from "@modules/order/components/transfer-image"

export default async function TransferPage({
  params,
}: {
  params: { id: string; token: string }
}) {
  const { id, token } = params
  const { success, error } = await acceptTransferRequest(id, token)

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#fcfafc] py-6 sm:py-10" dir="rtl">
      <div className="content-container mx-auto w-full max-w-3xl space-y-5">
        <section className="relative overflow-hidden rounded-2xl bg-[#270830] p-5 text-white shadow-sm sm:p-8">
          <div className="absolute -left-16 -top-20 h-48 w-48 rounded-full bg-[#67285A]/60" />
          <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white/60">إدارة ملكية الطلب</p>
              <Heading level="h1" className="mt-1 text-2xl font-bold leading-tight text-white sm:text-3xl">
                نتيجة قبول نقل الطلب
              </Heading>
              <p className="mt-3 text-sm text-white/75">الطلب <bdi dir="ltr">#{id}</bdi></p>
            </div>
            <div className="w-full max-w-[280px] self-center rounded-2xl bg-white/95 p-2 sm:w-[220px] sm:shrink-0 [&_svg]:h-auto [&_svg]:w-full">
              <TransferImage />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
          {success ? (
            <div className="rounded-xl bg-emerald-50 p-5">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-xl font-bold text-emerald-700">✓</div>
              <Heading level="h2" className="text-xl font-bold text-[#270830]">تم نقل الطلب!</Heading>
              <Text className="mt-2 leading-7 text-zinc-600">تم نقل الطلب <bdi dir="ltr">{id}</bdi> بنجاح إلى المالك الجديد.</Text>
            </div>
          ) : (
            <div className="rounded-xl bg-red-50 p-5">
              <Heading level="h2" className="text-xl font-bold text-[#270830]">تعذر قبول النقل</Heading>
              <Text className="mt-2 leading-7 text-zinc-600">حدث خطأ أثناء قبول النقل. يرجى إعادة المحاولة.</Text>
              {error && <Text className="mt-3 break-words rounded-lg bg-white/70 p-3 text-sm text-red-600">رسالة الخطأ: {error}</Text>}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
