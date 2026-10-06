/**
 * FX shared, framework-agnostic logic for the storefront.
 *
 * Holds the canonical currency set, conversion semantics, and Arabic-friendly
 * presentation helpers used by both the client `FxProvider`/`useFx`
 * (`./context`) and the server-side snapshot seed (`./server`).
 *
 * This module intentionally carries no `"use client"` / `"server-only"`
 * directive so it can be imported from both the client context module and the
 * server seed without crossing a React Server/Client boundary.
 *
 * Conversion semantics (canonical, mirrors the backend `lib/fx`):
 * - Supported currencies: SAR, YER_NEW, YER_OLD.
 * - `rateOf(SAR) = 1`; `rateOf(YER_*) = rates[YER_*]` (units of the quote per
 *   1 SAR).
 * - `convertFromSar(amountSar, target, rates)` rounds `amountSar * rateOf(target)`
 *   to 2 decimal places.
 * - `formatFromSar` presents the converted amount: 2 dp for SAR, 0 dp for
 *   YER_NEW / YER_OLD, with the currency label in Arabic-friendly formatting.
 * - If the rate for the selected currency is unavailable, conversion/format
 *   fall back gracefully to the SAR base (the switcher surfaces user-facing
 *   errors).
 *
 * Requirements: 7.3, 7.4, 7.11.
 */

/** Supported display currency codes in their canonical underscore form. */
export const FX_SUPPORTED_CURRENCIES = ["SAR", "YER_NEW", "YER_OLD"] as const

/** A supported display currency code. */
export type FxCurrency = (typeof FX_SUPPORTED_CURRENCIES)[number]

/** Canonical base currency. `rateOf(SAR)` is always 1. */
export const FX_BASE_CURRENCY: FxCurrency = "SAR"

/**
 * Default display currency when the customer has no prior selection
 * (Requirement 7.3). Note this differs from the backend's SAR default and
 * follows the storefront requirement.
 */
export const FX_DEFAULT_CURRENCY: FxCurrency = "YER_NEW"

/** Name of the cookie that persists the customer's display currency. */
export const FX_COOKIE = "fx_currency"

/** A map of quote currency code to units of that quote per 1 SAR. */
export type FxRates = Record<string, number>

/**
 * Server-seeded FX snapshot passed to the client `FxProvider`.
 *
 * - `base` is the canonical SAR base reported by `/store/fx/rates`.
 * - `rates` always includes `SAR: 1` plus any configured `YER_*` quotes.
 * - `enabled` is the FX feature-flag state.
 * - `currency` is the customer's selected display currency (from the
 *   `fx_currency` cookie) or `FX_DEFAULT_CURRENCY` when unset.
 */
export type FxSnapshot = {
  base: string
  rates: FxRates
  enabled: boolean
  currency: FxCurrency
}

/** Arabic-friendly currency labels appended by `formatFromSar`. */
export const FX_CURRENCY_LABELS_AR: Record<FxCurrency, string> = {
  SAR: "ر.س",
  YER_NEW: "ر.ي (جديد)",
  YER_OLD: "ر.ي (قديم)",
}

/** Narrowing guard: is `value` one of the supported currency codes? */
export function isSupportedCurrency(
  value: string | null | undefined
): value is FxCurrency {
  return (
    typeof value === "string" &&
    (FX_SUPPORTED_CURRENCIES as readonly string[]).includes(value)
  )
}

/** Round a value to 2 decimal places, avoiding float representation drift. */
function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/**
 * Resolve a currency's rate relative to the SAR base. `SAR` is always 1. For a
 * quote currency the rate is read from `rates` and must be a positive, finite
 * number; otherwise `null` is returned so callers can fall back gracefully.
 */
export function rateOf(code: FxCurrency, rates: FxRates): number | null {
  if (code === FX_BASE_CURRENCY) {
    return 1
  }
  const rate = rates?.[code]
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
    return null
  }
  return rate
}

/**
 * Convert a SAR base amount to `target`, rounded to 2 decimal places
 * (Requirement 7.5 semantics). If the rate for `target` is unavailable, the
 * amount falls back to the SAR base (rate 1) and is returned unchanged.
 */
export function convertFromSar(
  amountSar: number,
  target: FxCurrency,
  rates: FxRates
): number {
  const rate = rateOf(target, rates)
  // Graceful fallback: keep base/SAR when the selected rate is unavailable.
  const effectiveRate = rate ?? 1
  return round2(amountSar * effectiveRate)
}

/**
 * Present a SAR base amount in `target` using Arabic-friendly formatting:
 * 2 decimal places for SAR, 0 decimal places for YER_NEW / YER_OLD, with the
 * currency label appended. When the selected rate is unavailable, the amount is
 * presented in the SAR base instead.
 */
export function formatFromSar(
  amountSar: number,
  target: FxCurrency,
  rates: FxRates
): string {
  const rate = rateOf(target, rates)
  // Fall back to the SAR base presentation when the rate is unavailable.
  const effectiveCurrency: FxCurrency = rate === null ? FX_BASE_CURRENCY : target
  const converted = convertFromSar(amountSar, effectiveCurrency, rates)
  const fractionDigits = effectiveCurrency === FX_BASE_CURRENCY ? 2 : 0

  const formatted = new Intl.NumberFormat("ar", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(converted)

  return `${formatted} ${FX_CURRENCY_LABELS_AR[effectiveCurrency]}`
}
