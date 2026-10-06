"use client"

import useToggleState from "@lib/hooks/use-toggle-state"
import CurrencySwitcher from "@modules/layout/components/currency-switcher"

/**
 * Standalone wrapper around the FX `CurrencySwitcher` for use directly in the
 * site header (the nav). The shared `CurrencySwitcher` requires a `toggleState`
 * prop (it is normally driven by the SideMenu), so this client wrapper owns a
 * local toggle state and opens/closes the dropdown on hover, mirroring the
 * SideMenu behaviour. All currency/FX wiring stays in `CurrencySwitcher`.
 */
const NavCurrencySwitcher = () => {
  const currencyToggleState = useToggleState()

  return (
    <div
      onMouseEnter={currencyToggleState.open}
      onMouseLeave={currencyToggleState.close}
      className="text-gray-700"
    >
      <CurrencySwitcher toggleState={currencyToggleState} />
    </div>
  )
}

export default NavCurrencySwitcher
