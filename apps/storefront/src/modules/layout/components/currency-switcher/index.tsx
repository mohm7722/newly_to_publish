"use client"

/**
 * Currency switcher.
 *
 * Lets the customer choose the display currency among YER_NEW, YER_OLD, and
 * SAR (Requirement 7.2). Selection state is read from the FX context
 * (`useFx`), which is seeded server-side from the `fx_currency` cookie.
 *
 * On selection:
 *  - If the chosen currency has no available FX rate in the snapshot (and is
 *    not SAR, which is implicitly 1), the switcher KEEPS the previously
 *    selected currency, surfaces an error, and does not contact the backend —
 *    so the cart is left unchanged (Requirement 7.6).
 *  - Otherwise it calls the `selectCurrency` server action (which persists the
 *    `fx_currency` cookie and notifies the backend), updates the client
 *    selection, and refreshes server components so converted prices update.
 *
 * Mirrors the structure of the sibling `country-select` / `language-select`
 * layout components (Headless UI `Listbox` driven by a shared toggle state).
 *
 * Requirements: 7.2, 7.6.
 */

import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react"
import { useRouter } from "next/navigation"
import { Fragment, useState, useTransition } from "react"

import { selectCurrency } from "@lib/data/fx-actions"
import {
  FX_CURRENCY_LABELS_AR,
  FX_SUPPORTED_CURRENCIES,
  rateOf,
  useFx,
  type FxCurrency,
} from "@lib/fx/context"
import { StateType } from "@lib/hooks/use-toggle-state"

type CurrencySwitcherProps = {
  toggleState: StateType
}

const CurrencySwitcher = ({ toggleState }: CurrencySwitcherProps) => {
  const { currency, rates, setCurrency } = useFx()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const { state, close } = toggleState

  const handleChange = (next: FxCurrency) => {
    if (next === currency) {
      close()
      return
    }

    // Unavailable-rate guard: keep the previous currency, surface an error, and
    // do not contact the backend so the cart stays unchanged (Requirement 7.6).
    if (rateOf(next, rates) === null) {
      setError(
        `سعر الصرف للعملة ${FX_CURRENCY_LABELS_AR[next]} غير متاح حالياً`
      )
      close()
      return
    }

    setError(null)

    startTransition(async () => {
      try {
        await selectCurrency(next)
        setCurrency(next)
        close()
        router.refresh()
      } catch {
        // Persisting failed: retain the previously selected currency and show
        // an error. The cart is left unchanged (no client-side mutation).
        setError(
          `تعذّر تغيير العملة إلى ${FX_CURRENCY_LABELS_AR[next]}`
        )
      }
    })
  }

  return (
    <div>
      <Listbox
        as="span"
        value={currency}
        onChange={handleChange}
        disabled={isPending}
      >
        <ListboxButton className="py-1 w-full">
          <div className="txt-compact-small flex items-start gap-x-2">
            <span>العملة:</span>
            <span className="txt-compact-small flex items-center gap-x-2">
              {isPending ? "..." : FX_CURRENCY_LABELS_AR[currency]}
            </span>
          </div>
        </ListboxButton>
        <div className="flex relative w-full min-w-[320px]">
          <Transition
            show={state}
            as={Fragment}
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <ListboxOptions
              className="absolute -bottom-[calc(100%-36px)] left-0 xsmall:left-auto xsmall:right-0 max-h-[442px] overflow-y-scroll z-[900] bg-white drop-shadow-md text-small-regular text-black no-scrollbar rounded-rounded w-full"
              static
            >
              {FX_SUPPORTED_CURRENCIES.map((code) => (
                <ListboxOption
                  key={code}
                  value={code}
                  className="py-2 hover:bg-gray-200 px-3 cursor-pointer flex items-center gap-x-2"
                >
                  {FX_CURRENCY_LABELS_AR[code]}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Transition>
        </div>
      </Listbox>
      {error && (
        <p
          className="txt-compact-small text-rose-500 mt-1"
          role="alert"
          data-testid="currency-switcher-error"
        >
          {error}
        </p>
      )}
    </div>
  )
}

export default CurrencySwitcher
