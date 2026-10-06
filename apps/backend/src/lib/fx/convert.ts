/**
 * Pure FX conversion.
 *
 * Conversion semantics (parity with the Old Store + Requirement 2):
 *   rateOf(c)            = c === "SAR" ? 1 : rates[c]
 *   convert(a, from, to) = round2( a * (rateOf(to) / rateOf(from)) )   // enabled
 *   convert(a, from, to) = a                                           // disabled
 *
 * Rates are expressed as units of the quote currency per 1 SAR; `rates.SAR`
 * is implicitly 1. The result is rounded to 2 decimal places (Requirement
 * 2.2). YER 0-decimal display rounding is a presentation concern handled in
 * the storefront/settlement layers, not here.
 */
import { UnsupportedCurrencyError } from "./errors"
import { CurrencyCode } from "./types"
import { assertValidAmount, isSupported } from "./validation"

/** Round a value to 2 decimal places, avoiding common float representation drift. */
function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/**
 * Resolve the rate of a currency relative to the SAR base.
 *
 * `SAR` is always 1. For other supported currencies the rate is read from the
 * provided `rates` map and must be a positive finite number.
 */
function rateOf(code: CurrencyCode, rates: Record<string, number>): number {
  if (code === "SAR") {
    return 1
  }

  const rate = rates?.[code]
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
    throw new UnsupportedCurrencyError(code)
  }

  return rate
}

/**
 * Convert `amount` from currency `from` to currency `to` using SAR-relative
 * `rates`.
 *
 * When `opts.enabled` is `false`, the FX feature flag is disabled and the
 * input amount is returned unchanged without any validation or conversion
 * (Requirement 2.6). Otherwise the currencies and amount are validated and the
 * converted, 2-decimal-rounded amount is returned (Requirements 2.1, 2.2).
 *
 * @throws {UnsupportedCurrencyError} when `from` or `to` is outside
 *   {SAR, YER_NEW, YER_OLD} (Requirement 2.8).
 * @throws {InvalidAmountError} when `amount` is non-numeric, `< 0.01`, or
 *   `> 999,999,999.99` (Requirement 2.9).
 */
export function convertAmount(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates: Record<string, number>,
  opts?: { enabled: boolean }
): number {
  // FX flag disabled: passthrough unchanged (Requirement 2.6).
  if (opts && opts.enabled === false) {
    return amount
  }

  if (!isSupported(from)) {
    throw new UnsupportedCurrencyError(from)
  }
  if (!isSupported(to)) {
    throw new UnsupportedCurrencyError(to)
  }

  const validAmount = assertValidAmount(amount)

  const converted = validAmount * (rateOf(to, rates) / rateOf(from, rates))

  return round2(converted)
}
