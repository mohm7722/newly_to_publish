/**
 * FX library shared types.
 *
 * Canonical type definitions for the FX conversion subsystem. These mirror the
 * Old Store `currency_fx` metadata shape exactly so existing stored
 * configuration continues to load without migration.
 *
 * This is the shared coordination module for the `src/lib/fx` folder: the pure
 * conversion/validation functions (task 2.1) and the Store-metadata config
 * accessors (task 2.7) both import the canonical types from here rather than
 * redefining them.
 */

/** Supported currency codes in their canonical underscore form. */
export const SUPPORTED_CURRENCIES = ["SAR", "YER_NEW", "YER_OLD"] as const

/** A supported currency code. */
export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]

/** Inclusive lower bound for a valid monetary amount. */
export const MIN_AMOUNT = 0.01

/** Inclusive upper bound for a valid monetary amount. */
export const MAX_AMOUNT = 999_999_999.99

/**
 * A single FX rate-change audit log entry, recorded whenever a quote rate is
 * written. `old` is the previous rate for the quote, or `null` if none existed.
 */
export type FxLog = {
  at: string
  by: string
  quote: string
  old: number | null
  rate: number
}

/**
 * FX configuration as persisted in `store.metadata.currency_fx`.
 *
 * - `enabled`: the list of currency codes offered to customers/admins.
 * - `default`: the default currency code.
 * - `rates`: units of the quote currency per 1 SAR; `rates.SAR` is implicitly 1.
 * - `logs`: newest-first audit trail of rate changes.
 */
export type FxConfig = {
  enabled: string[]
  default: string
  rates: Record<string, number>
  logs: FxLog[]
}
