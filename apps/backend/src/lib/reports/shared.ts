/**
 * Shared helpers for the admin reporting routes (`/admin/reports/*`).
 *
 * Pure, framework-agnostic utilities reused across every report handler so the
 * routes stay small and consistent: numeric coercion (BigNumber/string/number),
 * payment-method classification (mirrors the invoice/processing-orders logic),
 * and a created-at date-range filter builder.
 */

/** Coerce a BigNumber/string/number/`{ value }` into a finite number. */
export function toNum(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0
  if (typeof v === "string") {
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
  }
  if (v && typeof v === "object") {
    // Medusa's computed money fields are BigNumber-like objects that expose
    // their numeric value through valueOf(), rather than a public `value` key.
    const n = Number(v)
    if (Number.isFinite(n)) return n
    if ("value" in v) {
      return toNum((v as { value: unknown }).value)
    }
  }
  return 0
}

/** Is this payment provider id a Cash-on-Delivery method? */
export function isCod(providerId?: string | null): boolean {
  if (!providerId) return false
  const id = providerId.toLowerCase()
  return id.includes("cod") || id.includes("cash")
}

/** Is this payment provider id a bank-transfer method (vs COD)? */
export function isBankTransfer(providerId?: string | null): boolean {
  if (!providerId) return false
  const id = providerId.toLowerCase()
  if (isCod(id)) return false
  return (
    id.includes("transfer") ||
    id.includes("bank") ||
    id.includes("manual") ||
    id.includes("system")
  )
}

export type PaymentMethod = "cod" | "bank_transfer" | "other"

/** Classify a payment provider id into one of the three method buckets. */
export function classifyPaymentMethod(providerId?: string | null): PaymentMethod {
  if (isCod(providerId)) return "cod"
  if (isBankTransfer(providerId)) return "bank_transfer"
  return "other"
}

/** Arabic label for a payment method bucket. */
export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cod: "الدفع عند الاستلام",
  bank_transfer: "تحويل بنكي",
  other: "أخرى",
}

/**
 * Build a `created_at` range filter from optional ISO `date_from` / `date_to`
 * query params. The end date is treated as inclusive end-of-day. Returns
 * `undefined` when neither bound is supplied.
 */
export function buildCreatedAtFilter(
  dateFrom?: string,
  dateTo?: string
): Record<string, Date> | undefined {
  if (!dateFrom && !dateTo) return undefined
  const created: Record<string, Date> = {}
  if (dateFrom) created.$gte = new Date(dateFrom)
  if (dateTo) {
    const end = new Date(dateTo)
    end.setHours(23, 59, 59, 999)
    created.$lte = end
  }
  return created
}

/** Read a trimmed string query param, or undefined when blank/missing. */
export function strParam(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined
  const t = v.trim()
  return t.length > 0 ? t : undefined
}

/** Compose a full customer display name from first/last parts. */
export function fullName(first?: string | null, last?: string | null): string {
  const name = [first, last].filter(Boolean).join(" ").trim()
  return name.length > 0 ? name : "—"
}

/** Add `amount` into a numeric accumulator map keyed by `key`. */
export function accumulate(
  map: Map<string, number>,
  key: string,
  amount: number
): void {
  map.set(key, (map.get(key) ?? 0) + amount)
}
