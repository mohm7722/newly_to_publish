import { Heading, Text } from "@modules/common/components/ui"
import TransferActions from "@modules/order/components/transfer-actions"
import TransferImage from "@modules/order/components/transfer-image"

export default async function TransferPage({
  params,
}: {
  params: { id: string; token: string }
}) {
  const { id, token } = params

  return (
    <main className="min-h-[calc(100vh-64px)] bg-[#fcfafc] py-6 sm:py-10" dir="rtl">
      <div className="content-container mx-auto w-full max-w-4xl space-y-5">
        <section className="relative overflow-hidden rounded-2xl bg-[#270830] p-5 text-white shadow-sm sm:p-8">
          <div className="absolute -left-16 -top-20 h-48 w-48 rounded-full bg-[#67285A]/60" />
          <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white/60">إدارة ملكية الطلب</p>
              <Heading level="h1" className="mt-1 text-2xl font-bold leading-tight text-white sm:text-3xl">
                طلب نقل ملكية الطلب <bdi dir="ltr">#{id}</bdi>
              </Heading>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/75">
                راجع تفاصيل الطلب بعناية قبل قبول نقل الملكية أو رفضه.
              </p>
            </div>
            <div className="w-full max-w-[280px] self-center rounded-2xl bg-white/95 p-2 sm:w-[240px] sm:shrink-0 [&_svg]:h-auto [&_svg]:w-full">
              <TransferImage />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">
          <div className="space-y-5">
            <Text className="text-sm leading-7 text-zinc-600 sm:text-base">
              لقد تلقيت طلبًا لنقل ملكية طلبك (<bdi dir="ltr">{id}</bdi>).
              إذا وافقت على هذا الطلب، يمكنك الموافقة على النقل بالضغط على الزر أدناه.
            </Text>
            <div className="h-px w-full bg-zinc-100" />
            <div className="rounded-xl bg-[#fcfafc] p-4 sm:p-5">
              <Text className="text-sm leading-7 text-zinc-600 sm:text-base">
                إذا قبلت، فسيتولى المالك الجديد جميع المسؤوليات والصلاحيات المرتبطة بهذا الطلب.
              </Text>
              <Text className="mt-3 text-sm leading-7 text-zinc-600 sm:text-base">
                إذا كنت لا تعرف هذا الطلب أو ترغب في الاحتفاظ بالملكية، فلا حاجة لاتخاذ أي إجراء إضافي.
              </Text>
            </div>
            <div className="h-px w-full bg-zinc-100" />
            <div className="w-full [&_button]:min-h-[44px] [&_button]:min-w-0 [&_button]:flex-1 sm:[&_button]:flex-none">
              <TransferActions id={id} token={token} />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
