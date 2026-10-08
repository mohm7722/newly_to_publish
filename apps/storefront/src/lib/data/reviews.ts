"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders } from "./cookies"

/**
 * Customer reviews data helper.
 *
 * Reads the publishable-key-gated `GET /store/reviews` store route exposed by
 * the backend Reviews Module. That route returns **only approved** reviews.
 * Two modes are supported:
 *   - no `product_id` → approved, featured, store-level testimonials for the
 *     homepage "آراء العملاء" slider.
 *   - `product_id` set → approved reviews for a product plus a rating summary.
 *
 * The Medusa JS SDK client injects the `x-publishable-api-key` header
 * automatically (see `@lib/config`). Responses are tagged for revalidation so a
 * newly approved review appears without a redeploy.
 */

/** Customer-facing review shape returned by the store route. */
export type StoreReview = {
  id: string
  rating: number
  title: string | null
  comment: string
  name: string
  city: string | null
  product_id: string | null
  is_verified: boolean
  created_at?: string
}

type RawReviewResponse = {
  ok?: boolean
  reviews?: Array<Record<string, unknown>>
  average?: number
  count?: number
}

function normalize(raw: Record<string, unknown>): StoreReview {
  return {
    id: String(raw.id ?? ""),
    rating: Number(raw.rating ?? 0),
    title: (raw.title as string) ?? null,
    comment: String(raw.comment ?? ""),
    name: String(raw.name ?? ""),
    city: (raw.city as string) ?? null,
    product_id: (raw.product_id as string) ?? null,
    is_verified: Boolean(raw.is_verified),
    created_at: raw.created_at ? String(raw.created_at) : undefined,
  }
}

/**
 * Featured store-level testimonials for the homepage.
 *
 * @returns Approved featured reviews, or an empty array on failure.
 */
export const listFeaturedReviews = async (
  limit = 8
): Promise<StoreReview[]> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.client
    .fetch<RawReviewResponse>(`/store/reviews`, {
      method: "GET",
      query: { featured: "true", limit },
      headers,
      next: { tags: ["reviews"], revalidate: 300 },
    })
    .then(({ reviews }) => (reviews ?? []).map(normalize))
    .catch(() => [])
}

/**
 * Approved reviews for a single product plus a rating summary.
 *
 * @returns `{ reviews, average, count }`; empty/zeroed on failure.
 */
export const listProductReviews = async (
  productId: string,
  limit = 20
): Promise<{ reviews: StoreReview[]; average: number; count: number }> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.client
    .fetch<RawReviewResponse>(`/store/reviews`, {
      method: "GET",
      query: { product_id: productId, limit },
      headers,
      next: { tags: ["reviews", `reviews-${productId}`], revalidate: 300 },
    })
    .then((res) => ({
      reviews: (res.reviews ?? []).map(normalize),
      average: Number(res.average ?? 0),
      count: Number(res.count ?? 0),
    }))
    .catch(() => ({ reviews: [], average: 0, count: 0 }))
}

/** Input for a customer-submitted review. */
export type SubmitReviewInput = {
  author_name: string
  body: string
  rating: number
  author_city?: string
  title?: string
  product_id?: string
}

/** Result of a submission attempt (safe to return to a client component). */
export type SubmitReviewResult = {
  ok: boolean
  message?: string
  errors?: string[]
}

/**
 * Submit a customer review to `POST /store/reviews`.
 *
 * The backend always stores it as `pending` (hidden until an admin approves)
 * and ignores any attempt to self-set a verified/featured flag. Returns a
 * result object instead of throwing so a client form can render field errors.
 */
export const submitReview = async (
  input: SubmitReviewInput
): Promise<SubmitReviewResult> => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  try {
    const res = await sdk.client.fetch<{
      ok?: boolean
      message?: string
      errors?: string[]
    }>(`/store/reviews`, {
      method: "POST",
      headers,
      body: {
        author_name: input.author_name,
        body: input.body,
        rating: input.rating,
        author_city: input.author_city,
        title: input.title,
        product_id: input.product_id,
      },
    })
    return {
      ok: Boolean(res.ok),
      message: res.message,
      errors: res.errors,
    }
  } catch (e: any) {
    // The SDK throws on non-2xx; surface server-provided validation errors.
    const payload = e?.response?.data ?? e?.body ?? e
    const errors: string[] | undefined = Array.isArray(payload?.errors)
      ? payload.errors
      : undefined
    return {
      ok: false,
      errors: errors ?? ["تعذّر إرسال المراجعة. حاول مرة أخرى."],
    }
  }
}
