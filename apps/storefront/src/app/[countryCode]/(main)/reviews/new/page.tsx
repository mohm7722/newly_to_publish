import { Metadata } from "next"
import { Star } from "lucide-react"
import ReviewForm from "@modules/reviews/components/review-form"

export const metadata: Metadata = {
  title: "شارك رأيك | نيولي",
  description: "أخبرنا عن تجربتك مع متجر نيولي. رأيك يساعد عملاءنا وفريقنا.",
}

export default function SubmitReviewPage() {
  return (
    <main dir="rtl" className="bg-[#fcfafc] text-right">
      <section className="relative isolate overflow-hidden bg-[#270830] text-white">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_20%,rgba(179,23,74,0.35),transparent_34%),radial-gradient(circle_at_85%_85%,rgba(130,172,64,0.22),transparent_32%)]" />
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-16">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur-sm">
            <Star className="h-4 w-4" aria-hidden="true" />
            رأيك يهمّنا
          </div>
          <h1 className="text-3xl font-bold leading-tight md:text-4xl">شارك رأيك</h1>
          <p className="mt-3 max-w-2xl text-base leading-8 text-white/75">
            تجربتك تساعد غيرك على الاختيار وتساعدنا على التحسّن. تُنشر المراجعة بعد
            مراجعتها من قِبل الفريق.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <ReviewForm />
      </section>
    </main>
  )
}
