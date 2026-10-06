/**
 * Shared helpers for the admin analytics dashboard (`/admin/analytics/*`).
 *
 * Pure, framework-agnostic utilities for the read-only aggregation endpoint:
 * currency normalization to the SAR base (using the store FX rates), 2-decimal
 * rounding, and time-bucket keys for trend series. These complement the
 * reporting helpers in `lib/reports/shared.ts` (which this dashboard also
 * reuses for `toNum`, payment-method classification, and date-range filters).
 *
 * Currency semantics mirror `lib/fx`: `rates` are expressed as units of the
 * quote currency per 1 SAR, and `rateOf(SAR)` is implicitly 1. Converting an
 * amount from a quote currency back to the SAR base therefore divides by the
 * quote rate.
 */

/** Trend series granularity. */
export type Granularity = "day" | "week" | "month"

/** The supported granularities, for query-param validation. */
export const GRANULARITIES: readonly Granularity[] = ["day", "week", "month"]

/** Round a value to 2 decimal places, avoiding common float representation drift. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/**
 * Normalize a currency code to the FX canonical uppercase form (e.g. `sar` →
 * `SAR`). Blank/nullish input becomes an empty string.
 */
export function normCurrency(code?: string | null): string {
  return (code ?? "").toUpperCase()
}

/**
 * Convert `amount` (expressed in `currency`) to the SAR base using the store FX
 * `rates` (units of quote per 1 SAR; `SAR` implicitly 1).
 *
 * Returns the SAR-normalized amount rounded to 2 decimals, or `null` when the
 * currency has no usable rate — so callers can track un-normalizable currencies
 * instead of silently dropping or mis-summing them.
 */
export function toSar(
  amount: number,
  currency: string,
  rates: Record<string, number>
): number | null {
  if (!Number.isFinite(amount)) return null
  const c = normCurrency(currency)
  if (c === "SAR") return round2(amount)
  const rate = rates?.[c]
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
    return null
  }
  return round2(amount / rate)
}

/**
 * Build a sortable time-bucket key for a date at the given granularity:
 *   - `day`   → `YYYY-MM-DD`
 *   - `week`  → `YYYY-MM-DD` of the ISO week start (Monday, UTC)
 *   - `month` → `YYYY-MM`
 *
 * All keys are computed in UTC so buckets are stable regardless of server
 * timezone, and lexical sorting matches chronological order.
 */
export function bucketKey(date: Date, granularity: Granularity): string {
  if (granularity === "month") {
    return date.toISOString().slice(0, 7)
  }
  if (granularity === "week") {
    const d = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
    )
    // ISO weekday: Monday = 1 … Sunday = 7.
    const weekday = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() - weekday + 1)
    return d.toISOString().slice(0, 10)
  }
  return date.toISOString().slice(0, 10)
}

/**
 * Add `amount` into a numeric accumulator map keyed by `key` (mutating). A
 * small convenience mirroring `lib/reports/shared.accumulate`, colocated here
 * so analytics handlers need only one import.
 */
export function addTo(map: Map<string, number>, key: string, amount: number): void {
  map.set(key, (map.get(key) ?? 0) + amount)
}
