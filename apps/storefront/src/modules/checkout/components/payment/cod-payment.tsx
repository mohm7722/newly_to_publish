"use client"

import { COD_PAYMENT_METHOD } from "@lib/constants"
import {
  getCodSettings,
  type StoreCodSettings,
} from "@lib/data/payment-offline"
import { CreditCard } from "@medusajs/icons"
import { Radio as RadioGroupOption } from "@headlessui/react"
import Radio from "@modules/common/components/radio"
import { Text, clx } from "@modules/common/components/ui"
import { useEffect, useState } from "react"

type CODPaymentProps = {
  selectedPaymentOptionId: string | null
  /** Shipping city id used to resolve COD availability (city gating). */
  shippingCityId?: string
}

/**
 * Cash-on-Delivery offline payment option (Requirement 7.7).
 *
 * Reflects COD availability from `/store/payments/cod-settings`: the option is
 * only selectable when COD is enabled and available for the cart's shipping
 * city (city gating). The order itself is completed through the core manual
 * provider (`pp_system_default`); this component only drives selection and
 * displays the COD instructions.
 */
const CODPayment: React.FC<CODPaymentProps> = ({
  selectedPaymentOptionId,
  shippingCityId,
}) => {
  const [codSettings, setCodSettings] = useState<StoreCodSettings | null>(null)
  const [available, setAvailable] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const methodId = COD_PAYMENT_METHOD

  useEffect(() => {
    let active = true

    const fetchCodSettings = async () => {
      setIsLoading(true)
      const { cod_settings, available } = await getCodSettings(shippingCityId)
      if (!active) {
        return
      }
      setCodSettings(cod_settings)
      setAvailable(available)
      setIsLoading(false)
    }

    fetchCodSettings()

    return () => {
      active = false
    }
  }, [shippingCityId])

  const isSelectable = !isLoading && !!codSettings?.enabled && available

  const renderHeader = (checked: boolean) => (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-x-4">
        <Radio checked={checked} />
        <Text className="text-base-regular">الدفع عند الاستلام (COD)</Text>
      </div>
      <span className="justify-self-end text-ui-fg-base">
        <CreditCard />
      </span>
    </div>
  )

  if (isLoading) {
    return (
      <RadioGroupOption
        value={methodId}
        disabled
        className="mb-3 flex flex-col gap-3 rounded-2xl border border-gray-200 p-4 text-sm opacity-60 sm:px-5"
      >
        {renderHeader(false)}
        <Text className="text-sm text-ui-fg-subtle mt-2">
          جاري التحقق من توفر الدفع عند الاستلام...
        </Text>
      </RadioGroupOption>
    )
  }

  if (!isSelectable) {
    const message = !codSettings?.enabled
      ? "الدفع عند الاستلام غير متاح حالياً"
      : "الدفع عند الاستلام غير متاح لمدينة الشحن المحددة"

    return (
      <RadioGroupOption
        value={methodId}
        disabled
        className="mb-3 flex flex-col gap-3 rounded-2xl border border-gray-200 p-4 text-sm opacity-50 sm:px-5"
      >
        {renderHeader(false)}
        <Text className="text-sm text-ui-fg-error mt-2" data-testid="cod-unavailable-message">
          {message}
        </Text>
      </RadioGroupOption>
    )
  }

  return (
    <RadioGroupOption
      value={methodId}
      className={clx(
        "mb-3 flex cursor-pointer flex-col gap-3 rounded-2xl border border-gray-200 p-4 text-sm transition hover:border-[#67285A]/30 hover:bg-[#fcfafc] sm:px-5",
        {
          "border-[#67285A] bg-[#fcfafc] ring-2 ring-[#67285A]/10": selectedPaymentOptionId === methodId,
        }
      )}
      data-testid="cod-payment-option"
    >
      {renderHeader(selectedPaymentOptionId === methodId)}

      {selectedPaymentOptionId === methodId && (
        <div className="mt-4 space-y-2 p-3 border border-ui-border-base rounded-md bg-ui-bg-subtle">
          <Text className="text-sm text-ui-fg-subtle">
            ستقوم بدفع المبلغ نقداً عند استلام الطلب.
          </Text>
          {codSettings?.instructions && (
            <div>
              <Text className="text-sm text-ui-fg-subtle">تعليمات:</Text>
              <Text className="text-sm">{codSettings.instructions}</Text>
            </div>
          )}
        </div>
      )}
    </RadioGroupOption>
  )
}

export default CODPayment
