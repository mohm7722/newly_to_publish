"use client"

import { useState } from "react"
import { submitReview } from "@lib/data/reviews"

type Props = {
  /** When set, the review targets a specific product. */
  productId?: string
  /** Optional callback after a successful submission. */
  onSubmitted?: () => void
}

/**
 * Customer review submission form (client component).
 *
 * Collects name, city, rating, and comment and sends them to the backend via
 * the `submitReview` server action. The backend stores the review as `pending`
 * (hidden until an admin approves it), so after a successful submit we show a
 * thank-you/awaiting-moderation message rather than the review itself.
 */
export default function ReviewForm({ productId, onSubmitted }: Props) {
  const [name, setName] = useState("")
  const [city, setCity] = useState("")
  const [comment, setComment] = useState("")
  const [rating, setRating] = useState(5)
  const [hover, setHover] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setErrors([])
    setSubmitting(true)
    try {
      const result = await submitReview({
        author_name: name,
        author_city: city || undefined,
        body: comment,
        rating,
        product_id: productId,
      })
      if (result.ok) {
        setDone(true)
        onSubmitted?.()
      } else {
        setErrors(result.errors ?? ["تعذّر إرسال المراجعة. حاول مرة أخرى."])
      }
    } catch {
      setErrors(["تعذّر إرسال المراجعة. حاول مرة أخرى."])
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div
        dir="rtl"
        className="rounded-2xl border border-[#82ac40]/30 bg-[#f3f8ea] p-6 text-center"
      >
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#82ac40] text-white text-2xl">
          ✓
        </div>
        <h3 className="text-lg font-bold text-[#270830]">شكرًا لمشاركتك!</h3>
        <p className="mt-2 text-sm text-gray-600">
          تم استلام مراجعتك وستظهر بعد مراجعتها من قِبل الفريق.
        </p>
      </div>
    )
  }

  return (
    <form
      dir="rtl"
      onSubmit={handleSubmit}
      className="space-y-5 rounded-2xl border border-[#270830]/10 bg-white p-6 shadow-sm"
    >
      {errors.length > 0 && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          <ul className="list-disc pr-5 space-y-1">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* التقييم بالنجوم */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-[#270830]">
          تقييمك
        </label>
        <div className="flex items-center gap-1" role="radiogroup" aria-label="التقييم">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={rating === star}
              aria-label={`${star} من 5`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
              className="p-1 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#B3174A]/40 rounded"
            >
              <svg
                className={`h-8 w-8 ${
                  (hover || rating) >= star ? "text-rating" : "text-gray-300"
                }`}
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            </button>
          ))}
        </div>
      </div>

      {/* الاسم */}
      <div>
        <label htmlFor="review-name" className="mb-1 block text-sm font-semibold text-[#270830]">
          الاسم
        </label>
        <input
          id="review-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          required
          placeholder="اسمك الكريم"
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#B3174A] focus:ring-2 focus:ring-[#B3174A]/20"
        />
      </div>

      {/* المدينة (اختياري) */}
      <div>
        <label htmlFor="review-city" className="mb-1 block text-sm font-semibold text-[#270830]">
          المدينة <span className="font-normal text-gray-400">(اختياري)</span>
        </label>
        <input
          id="review-city"
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          maxLength={80}
          placeholder="مثال: تعز"
          className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#B3174A] focus:ring-2 focus:ring-[#B3174A]/20"
        />
      </div>

      {/* نص المراجعة */}
      <div>
        <label htmlFor="review-body" className="mb-1 block text-sm font-semibold text-[#270830]">
          رأيك
        </label>
        <textarea
          id="review-body"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={2000}
          required
          rows={4}
          placeholder="شاركنا تجربتك مع المنتج أو الخدمة…"
          className="w-full resize-y rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-[#B3174A] focus:ring-2 focus:ring-[#B3174A]/20"
        />
        <p className="mt-1 text-left text-xs text-gray-400">{comment.length}/2000</p>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#270830] px-6 py-3 font-bold text-white transition hover:bg-[#3a0f49] focus:outline-none focus:ring-2 focus:ring-[#B3174A]/50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "جارٍ الإرسال…" : "إرسال المراجعة"}
      </button>
    </form>
  )
}
