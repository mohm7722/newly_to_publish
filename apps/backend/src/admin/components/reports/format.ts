/**
 * Shared formatting helpers for the admin report pages.
 */

/** Format an ISO date string as a localized Arabic short date. */
export function fmtDate(v?: string | null): string {
  if (!v) return "—"
  try {
    return new Intl.DateTimeFormat("ar", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(v))
  } catch {
    return v
  }
}

/** Format a number with up to 2 decimals (Arabic locale). */
export function fmtNumber(n: number): string {
  return new Intl.NumberFormat("ar", { maximumFractionDigits: 2 }).format(n)
}

/** Format an amount with a currency code suffix. */
export function fmtMoney(n: number, currency?: string | null): string {
  const c = currency ? ` ${currency.toUpperCase()}` : ""
  return `${fmtNumber(n)}${c}`
}

/**
 * Format a `{ [currency]: amount }` map into a readable multi-currency string,
 * e.g. `1,200 SAR + 50,000 YER-NEW`. Returns `—` when empty.
 */
export function fmtCurrencyMap(
  map?: Record<string, number> | null
): string {
  if (!map) return "—"
  const entries = Object.entries(map).filter(([, v]) => v !== 0)
  if (entries.length === 0) return "—"
  return entries.map(([cur, amt]) => fmtMoney(amt, cur)).join(" + ")
}

/** The FX currency codes supported by the store, as select options. */
export const CURRENCY_OPTIONS: { value: string; label: string }[] = [
  { value: "YER-NEW", label: "ريال يمني جديد (YER-NEW)" },
  { value: "YER-OLD", label: "ريال يمني قديم (YER-OLD)" },
  { value: "SAR", label: "ريال سعودي (SAR)" },
]
