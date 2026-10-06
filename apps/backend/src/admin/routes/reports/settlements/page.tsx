import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Receipt } from "@medusajs/icons"
import { Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { ReportView } from "../../../components/reports/report-view"
import {
  fmtNumber,
  fmtMoney,
  fmtDate,
  fmtCurrencyMap,
  CURRENCY_OPTIONS,
} from "../../../components/reports/format"

type Row = {
  display_id: number | null
  base_currency_code: string
  currency_code: string
  rate: number
  total: number
  created_at: string | null
}

const SettlementsReport = () => {
  const { t } = useTranslation()
  return (
    <ReportView<Row>
      title={t("custom.reports.settlements.title")}
      description={t("custom.reports.settlements.description")}
      permission="settlements:read"
      endpoint="/admin/reports/settlements"
      exportFilename="settlements"
      filters={[
        { key: "date_from", label: t("custom.reports.common.dateFrom"), type: "date" },
        { key: "date_to", label: t("custom.reports.common.dateTo"), type: "date" },
        { key: "currency_code", label: t("custom.reports.settlements.settlementCurrency"), type: "select", options: CURRENCY_OPTIONS },
      ]}
      columns={[
        { key: "display_id", label: t("custom.reports.common.orderNo") },
        { key: "base_currency_code", label: t("custom.reports.settlements.colBaseCurrency") },
        { key: "currency_code", label: t("custom.reports.settlements.settlementCurrency") },
        { key: "rate", label: t("custom.reports.settlements.colRate"), align: "left" },
        { key: "total", label: t("custom.reports.settlements.colTotal"), align: "left" },
        { key: "created_at", label: t("custom.reports.common.date") },
      ]}
      mapRow={(r) => ({
        display_id: r.display_id != null ? `#${r.display_id}` : "—",
        base_currency_code: r.base_currency_code,
        currency_code: r.currency_code,
        rate: fmtNumber(r.rate),
        total: fmtMoney(r.total, r.currency_code),
        created_at: fmtDate(r.created_at),
      })}
      renderSummary={(data) => (
        <Text size="small" weight="plus">
          {t("custom.reports.settlements.summary", {
            value: fmtCurrencyMap(data?.totals?.value_by_currency),
          })}
        </Text>
      )}
    />
  )
}

export const config = defineRouteConfig({
  label: "التسويات",
  icon: Receipt,
})

export default SettlementsReport
