/**
 * Typed FX error classes.
 *
 * These are thrown by the pure conversion/validation functions and are
 * consumed by the admin/store route handlers, which map them to `400`/`422`
 * responses (Requirements 2.8, 2.9).
 */

/**
 * Thrown when a source or target currency code is outside the supported set
 * {SAR, YER_NEW, YER_OLD} (Requirement 2.8).
 */
export class UnsupportedCurrencyError extends Error {
  readonly code = "UNSUPPORTED_CURRENCY"
  readonly currency: string

  constructor(currency: string) {
    super(`Unsupported currency code: ${String(currency)}`)
    this.name = "UnsupportedCurrencyError"
    this.currency = String(currency)
    // Restore prototype chain when targeting ES5-ish transpilation.
    Object.setPrototypeOf(this, UnsupportedCurrencyError.prototype)
  }
}

/**
 * Thrown when an amount is non-numeric, less than 0.01, or greater than
 * 999,999,999.99 (Requirement 2.9).
 */
export class InvalidAmountError extends Error {
  readonly code = "INVALID_AMOUNT"
  readonly amount: unknown

  constructor(amount: unknown, reason?: string) {
    super(
      reason
        ? `Invalid amount: ${reason}`
        : `Invalid amount: ${String(amount)}`
    )
    this.name = "InvalidAmountError"
    this.amount = amount
    Object.setPrototypeOf(this, InvalidAmountError.prototype)
  }
}
