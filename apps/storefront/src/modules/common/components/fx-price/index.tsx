"use client"

/**
 * FxPrice display component.
 *
 * Converts a SAR base amount (the storefront's canonical base currency) to the
 * customer's selected display currency and renders it, for use in product
 * prices and cart totals.
 *
 * Conversion + presentation are delegated entirely to the FX context
 * (`useFx().format`, which is bound to `formatFromSar` from `lib/fx/shared`):
 * amounts are converted by rounding `amountSar * rate` to 2 decimal places and
 * presented with 2 dp for SAR and 0 dp for YER_NEW / YER_OLD, with an
 * Arabic-friendly currency label. This component never duplicates that logic.
 *
 * The component renders the formatted string only (no wrapping element) so it
 * can be dropped directly into the existing price markup, preserving the
 * surrounding `data-testid` / `data-value` attributes used by tests.
 *
 * Requirements: 7.5.
 */

import { useFx, type FxCurrency } from "@lib/fx/context"

export type FxPriceProps = {
  /** Base amount in SAR (the storefront base currency) to convert + display. */
  amountSar: number
  /**
   * Optional explicit target currency. Defaults to the customer's currently
   * selected display currency from the FX context.
   */
  currency?: FxCurrency
}

/**
 * Render a SAR base amount in the customer's selected display currency.
 *
 * Must be used within an `FxProvider` (mounted at the storefront root layout
 * and seeded by `lib/fx/server.ts`). The selection defaults to `YER_NEW` when
 * the customer has no prior choice.
 */
export default function FxPrice({ amountSar, currency }: FxPriceProps) {
  const { format } = useFx()

  return <>{format(amountSar, currency)}</>
}
