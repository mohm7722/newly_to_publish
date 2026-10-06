/**
 * Pure validation helpers for the FX subsystem.
 */
import { InvalidAmountError } from "./errors"
import {
  CurrencyCode,
  MAX_AMOUNT,
  MIN_AMOUNT,
  SUPPORTED_CURRENCIES,
} from "./types"

/**
 * Type guard: is `code` one of the supported currency codes
 * {SAR, YER_NEW, YER_OLD}?
 */
export function isSupported(code: string): code is CurrencyCode {
  return (SUPPORTED_CURRENCIES as readonly string[]).includes(code)
}

/**
 * Validate a monetary amount.
 *
 * Returns the numeric amount when it is a finite number in the inclusive
 * range [0.01, 999,999,999.99]. Throws {@link InvalidAmountError} when the
 * amount is non-numeric (wrong type, `NaN`, or non-finite), below 0.01, or
 * above 999,999,999.99 (Requirement 2.9).
 */
export function assertValidAmount(amount: unknown): number {
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    throw new InvalidAmountError(amount, "amount must be a finite number")
  }

  if (amount < MIN_AMOUNT) {
    throw new InvalidAmountError(amount, `amount must be >= ${MIN_AMOUNT}`)
  }

  if (amount > MAX_AMOUNT) {
    throw new InvalidAmountError(amount, `amount must be <= ${MAX_AMOUNT}`)
  }

  return amount
}
