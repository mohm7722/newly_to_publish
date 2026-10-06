import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, HttpTypes } from "@medusajs/framework/types"
import {
  Button,
  Container,
  Heading,
  Label,
  Select,
  Text,
  Textarea,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { settlementQueryKey } from "./settlement-order-details"

/**
 * Settlement currency-editor widget.
 *
 * Injected at the `order.details.after` zone of the admin order detail page
 * (Requirements 6.2, 6.4). It lets an administrator select a settlement
 * currency for the order and submit it via `PUT /admin/settlements/:id/currency`
 * (the settlement id is the order id). The FX rate applied to the selected
 * currency is read from `GET /admin/fx/rates` (`SAR` is always `1`) and sent
 * with the request, mirroring the route contract `{ currency_code, rate,
 * reason }`.
 *
 * The widget indicates the in-progress state while the request runs
 * (Requirement 6.6) and, on failure, surfaces the error returned by the route
 * without mutating the displayed values (Requirement 6.7). On success it
 * invalidates the shared settlement query so the read-only details widget
 * refreshes with the recomputed currency and amount (Requirement 6.5).
 */

/** Supported settlement currency codes (Requirement 3.6). */
const SUPPORTED_CURRENCIES = ["SAR", "YER_NEW", "YER_OLD"] as const
type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]

type SettlementResponse = {
  currency_code: string
}

/** Fetch the current settlement to seed the selected currency. */
async function fetchSettlementCurrency(
  orderId: string
): Promise<string | null> {
  const res = await fetch(`/admin/orders/${orderId}/settlement`, {
    credentials: "include",
  })
  if (res.status === 404) {
    return null
  }
  if (!res.ok) {
    throw new Error("Failed to load settlement data")
  }
  const json = (await res.json()) as SettlementResponse
  return json.currency_code ?? null
}

/** Fetch the configured FX rates (`{ SAR: 1, YER_NEW?, YER_OLD? }`). */
async function fetchRates(): Promise<Record<string, number>> {
  const res = await fetch(`/admin/fx/rates`, { credentials: "include" })
  if (!res.ok) {
    throw new Error("Failed to load FX rates")
  }
  return (await res.json()) as Record<string, number>
}

type UpdatePayload = {
  currency_code: CurrencyCode
  rate: number
  reason: string
}

/** Submit the currency change to `PUT /admin/settlements/:id/currency`. */
async function updateSettlementCurrency(
  orderId: string,
  payload: UpdatePayload
): Promise<void> {
  const res = await fetch(`/admin/settlements/${orderId}/currency`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  const json = (await res.json().catch(() => ({}))) as {
    error?: string
    message?: string
  }

  if (!res.ok) {
    throw new Error(
      json.error || json.message || "Failed to update settlement currency"
    )
  }
}

const SettlementCurrencyEditorWidget = ({
  data: order,
}: DetailWidgetProps<HttpTypes.AdminOrder>) => {
  const orderId = order.id
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  const currencyLabel = (code: CurrencyCode): string => {
    const key = `custom.currencies.${code}_long`
    const translated = t(key)
    return translated === key ? code : translated
  }

  const [currency, setCurrency] = useState<CurrencyCode>("SAR")
  const [reason, setReason] = useState("")
  const [touchedSelection, setTouchedSelection] = useState(false)

  const { data: currentCurrency } = useQuery({
    queryKey: ["order-settlement-currency", orderId],
    queryFn: () => fetchSettlementCurrency(orderId),
  })

  const { data: rates, isLoading: ratesLoading } = useQuery({
    queryKey: ["fx-rates"],
    queryFn: fetchRates,
  })

  // Seed the selected currency from the existing settlement once it loads,
  // unless the admin has already changed the selection.
  useEffect(() => {
    if (
      !touchedSelection &&
      currentCurrency &&
      (SUPPORTED_CURRENCIES as readonly string[]).includes(currentCurrency)
    ) {
      setCurrency(currentCurrency as CurrencyCode)
    }
  }, [currentCurrency, touchedSelection])

  const resolveRate = (code: CurrencyCode): number | undefined => {
    if (code === "SAR") {
      return 1
    }
    const rate = rates?.[code]
    return typeof rate === "number" && Number.isFinite(rate) && rate > 0
      ? rate
      : undefined
  }

  const selectedRate = resolveRate(currency)
  const rateUnavailable = !ratesLoading && selectedRate === undefined

  const mutation = useMutation({
    mutationFn: () => {
      if (selectedRate === undefined) {
        return Promise.reject(
          new Error(
            t("custom.settlement.noRateConfigured", { currency })
          )
        )
      }
      return updateSettlementCurrency(orderId, {
        currency_code: currency,
        rate: selectedRate,
        reason: reason.trim() || t("custom.settlement.defaultReason"),
      })
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: settlementQueryKey(orderId),
        }),
        queryClient.invalidateQueries({
          queryKey: ["order-settlement-currency", orderId],
        }),
      ])
    },
  })

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">{t("custom.settlement.editorTitle")}</Heading>
      </div>

      <div className="flex flex-col gap-y-4 px-6 py-4">
        <div className="flex flex-col gap-y-2">
          <Label htmlFor="settlement-currency" size="small" weight="plus">
            {t("custom.settlement.settlementCurrency")}
          </Label>
          <Select
            value={currency}
            onValueChange={(value) => {
              setTouchedSelection(true)
              setCurrency(value as CurrencyCode)
            }}
          >
            <Select.Trigger id="settlement-currency">
              <Select.Value placeholder={t("custom.common.selectCurrency")} />
            </Select.Trigger>
            <Select.Content>
              {SUPPORTED_CURRENCIES.map((code) => (
                <Select.Item key={code} value={code}>
                  {currencyLabel(code)}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>

        <div className="flex flex-col gap-y-2">
          <Label htmlFor="settlement-reason" size="small" weight="plus">
            {t("custom.settlement.reason")}
          </Label>
          <Textarea
            id="settlement-reason"
            placeholder={t("custom.settlement.reasonPlaceholder")}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Text size="small" className="text-ui-fg-subtle">
            {ratesLoading
              ? t("custom.settlement.rateLoading")
              : selectedRate !== undefined
                ? t("custom.settlement.rateApplied", { rate: selectedRate })
                : t("custom.settlement.rateUnavailable")}
          </Text>
          <Button
            variant="primary"
            size="small"
            isLoading={mutation.isPending}
            disabled={mutation.isPending || rateUnavailable}
            onClick={() => mutation.mutate()}
          >
            {t("custom.common.save")}
          </Button>
        </div>

        {mutation.isError ? (
          <Text size="small" className="text-ui-fg-error">
            {mutation.error instanceof Error
              ? mutation.error.message
              : t("custom.settlement.updateError")}
          </Text>
        ) : null}

        {mutation.isSuccess ? (
          <Text size="small" className="text-ui-fg-subtle">
            {t("custom.settlement.updatedTo", { currency })}
          </Text>
        ) : null}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.after",
})

export default SettlementCurrencyEditorWidget
