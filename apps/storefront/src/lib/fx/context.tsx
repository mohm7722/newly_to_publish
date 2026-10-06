"use client"

/**
 * FX React context for the storefront.
 *
 * Exposes the client-side `FxProvider` and `useFx` hook, seeded from a
 * server-built `FxSnapshot` (see `./server`). The provider tracks the selected
 * display currency in client state (initialised from the snapshot's cookie
 * value) and exposes `convert` / `format` bound to the current selection.
 *
 * The pure conversion/presentation helpers (`convertFromSar`, `formatFromSar`)
 * and the currency constants/types live in `./shared` so the server seed can
 * reuse them without crossing the client boundary; they are re-exported here
 * for convenient consumption from client components.
 *
 * Requirements: 7.3, 7.4, 7.11.
 */

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import {
  convertFromSar,
  formatFromSar,
  FX_DEFAULT_CURRENCY,
  type FxCurrency,
  type FxRates,
  type FxSnapshot,
} from "./shared"

// Re-export the shared helpers, constants, and types so they are available
// from the FX context module (the canonical storefront FX entry point).
export {
  convertFromSar,
  formatFromSar,
  rateOf,
  isSupportedCurrency,
  FX_SUPPORTED_CURRENCIES,
  FX_BASE_CURRENCY,
  FX_DEFAULT_CURRENCY,
  FX_COOKIE,
  FX_CURRENCY_LABELS_AR,
} from "./shared"
export type { FxCurrency, FxRates, FxSnapshot } from "./shared"

/** Value provided by {@link FxProvider} and consumed via {@link useFx}. */
export type FxContextValue = {
  /** The currently selected display currency. */
  currency: FxCurrency
  /** The canonical base currency reported by the backend (`SAR`). */
  base: string
  /** Quote rates (units of quote per 1 SAR), always including `SAR: 1`. */
  rates: FxRates
  /** FX feature-flag state from the backend. */
  enabled: boolean
  /** Update the selected display currency (client-side display state). */
  setCurrency: (currency: FxCurrency) => void
  /** Convert a SAR base amount to `target` (defaults to the selection). */
  convert: (amountSar: number, target?: FxCurrency) => number
  /** Format a SAR base amount in `target` (defaults to the selection). */
  format: (amountSar: number, target?: FxCurrency) => string
}

const FxContext = createContext<FxContextValue | null>(null)

/**
 * Provides FX state to client components. Seed it with the server-built
 * snapshot so the initial selection matches the `fx_currency` cookie (or the
 * `YER_NEW` default when no prior selection exists).
 */
export function FxProvider({
  snapshot,
  children,
}: {
  snapshot: FxSnapshot
  children: ReactNode
}) {
  const [currency, setCurrency] = useState<FxCurrency>(
    snapshot.currency ?? FX_DEFAULT_CURRENCY
  )

  const value = useMemo<FxContextValue>(
    () => ({
      currency,
      base: snapshot.base,
      rates: snapshot.rates,
      enabled: snapshot.enabled,
      setCurrency,
      convert: (amountSar: number, target: FxCurrency = currency) =>
        convertFromSar(amountSar, target, snapshot.rates),
      format: (amountSar: number, target: FxCurrency = currency) =>
        formatFromSar(amountSar, target, snapshot.rates),
    }),
    [currency, snapshot]
  )

  return <FxContext.Provider value={value}>{children}</FxContext.Provider>
}

/**
 * Access the FX context. Must be called within an {@link FxProvider}.
 *
 * @throws when used outside of an {@link FxProvider}.
 */
export function useFx(): FxContextValue {
  const ctx = useContext(FxContext)
  if (!ctx) {
    throw new Error("useFx must be used within an FxProvider")
  }
  return ctx
}
