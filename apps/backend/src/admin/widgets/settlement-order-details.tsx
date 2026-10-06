import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, HttpTypes } from "@medusajs/framework/types"
import { Badge, Container, Heading, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

/**
 * Settlement order-details widget (read-only view).
 *
 * Injected at the `order.details.after` zone of the admin order detail page
 * (Requirements 6.2, 6.4). It reads the committed settlement for the order via
 * `GET /admin/orders/:id/settlement` and displays the computed settlement
 * currency and amount together with the converted breakdown (Requirement 6.2).
 *
 * The widget never mutates the displayed values: while the request is in
 * progress it shows an in-progress state (Requirement 6.6), and on failure it
 * surfaces an error message without changing what is displayed
 * (Requirement 6.7). The companion editor widget invalidates the shared query
 * key below after a successful currency change so this view refreshes
 * automatically.
 */

/** Shared query key so the editor widget can invalidate this view on success. */
export const settlementQueryKey = (orderId: string) => [
  "order-settlement",
  orderId,
]

/** Shape returned by `GET /admin/orders/:id/settlement`. */
type SettlementResponse = {
  ok: boolean
  order_id: string
  currency_code: string
  base_currency_code: string
  rate: number
  subtotal: number
  shipping: number
  tax: number
  discount: number
  total: number
  snapshot_json: Record<string, unknown> | null
  created_at: string | null
}

/**
 * Fetch the settlement for an order. Resolves to `null` when no settlement has
 * been committed yet (the route returns `404`), and throws on any other error
 * so the caller can surface it without mutating the displayed values.
 */
async function fetchSettlement(
  orderId: string
): Promise<SettlementResponse | null> {
  const res = await fetch(`/admin/orders/${orderId}/settlement`, {
    credentials: "include",
  })

  if (res.status === 404) {
    return null
  }

  if (!res.ok) {
    throw new Error("Failed to load settlement data")
  }

  return (await res.json()) as SettlementResponse
}

/** Format a stored amount: SAR keeps 2 decimals, YER uses integer presentation. */
function formatAmount(amount: number, currencyCode: string): string {
  const fractionDigits = currencyCode === "SAR" ? 2 : 0
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(Number.isFinite(amount) ? amount : 0)
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <Text size="small" className="text-ui-fg-subtle">
        {label}
      </Text>
      <Text size="small" weight="plus">
        {value}
      </Text>
    </div>
  )
}

const SettlementOrderDetailsWidget = ({
  data: order,
}: DetailWidgetProps<HttpTypes.AdminOrder>) => {
  const orderId = order.id
  const { t } = useTranslation()

  const currencyLabel = (code: string): string => {
    const key = `custom.currencies.${code}_long`
    const translated = t(key)
    return translated === key ? code : translated
  }

  const { data, isLoading, isError } = useQuery({
    queryKey: settlementQueryKey(orderId),
    queryFn: () => fetchSettlement(orderId),
  })

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">{t("custom.settlement.title")}</Heading>
        {data ? (
          <Badge size="2xsmall">{data.currency_code}</Badge>
        ) : null}
      </div>

      <div className="px-6 py-4">
        {isLoading ? (
          <Text size="small" className="text-ui-fg-subtle">
            {t("custom.settlement.loading")}
          </Text>
        ) : isError ? (
          <Text size="small" className="text-ui-fg-error">
            {t("custom.settlement.loadError")}
          </Text>
        ) : !data ? (
          <Text size="small" className="text-ui-fg-subtle">
            {t("custom.settlement.empty")}
          </Text>
        ) : (
          <div className="flex flex-col gap-y-3">
            <div className="flex items-center justify-between">
              <Text size="small" className="text-ui-fg-subtle">
                {t("custom.settlement.settlementCurrency")}
              </Text>
              <Text size="small" weight="plus">
                {currencyLabel(data.currency_code)}
              </Text>
            </div>

            <div className="flex items-center justify-between">
              <Text size="base" weight="plus">
                {t("custom.settlement.settlementTotal")}
              </Text>
              <Text size="base" weight="plus">
                {formatAmount(data.total, data.currency_code)}{" "}
                {data.currency_code}
              </Text>
            </div>

            <div className="flex flex-col gap-y-2 border-t pt-3">
              <Row
                label={t("custom.settlement.subtotal")}
                value={`${formatAmount(data.subtotal, data.currency_code)} ${data.currency_code}`}
              />
              <Row
                label={t("custom.settlement.shipping")}
                value={`${formatAmount(data.shipping, data.currency_code)} ${data.currency_code}`}
              />
              <Row
                label={t("custom.settlement.tax")}
                value={`${formatAmount(data.tax, data.currency_code)} ${data.currency_code}`}
              />
              <Row
                label={t("custom.settlement.discount")}
                value={`${formatAmount(data.discount, data.currency_code)} ${data.currency_code}`}
              />
              <Row
                label={t("custom.settlement.rate", {
                  base: data.base_currency_code,
                })}
                value={String(data.rate)}
              />
            </div>
          </div>
        )}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.after",
})

export default SettlementOrderDetailsWidget
