import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ReceiptPercent } from "@medusajs/icons"
import { Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { ReportView } from "../../../components/reports/report-view"
import {
  fmtMoney,
  fmtDate,
  fmtCurrencyMap,
  CURRENCY_OPTIONS,
} from "../../../components/reports/format"

type Row = {
  display_id: number
  created_at: string
  currency_code: string
  discount_total: number
  total: number
}

const DiscountsReport = () => {
  const { t } = useTranslation()
  return (
    <ReportView<Row>
      title={t("custom.reports.discounts.title")}
      description={t("custom.reports.discounts.description")}
      permission="orders:read"
      endpoint="/admin/reports/discounts"
      exportFilename="discounts"
      filters={[
        { key: "date_from", label: t("custom.reports.common.dateFrom"), type: "date" },
        { key: "date_to", label: t("custom.reports.common.dateTo"), type: "date" },
        { key: "currency_code", label: t("custom.reports.common.currency"), type: "select", options: CURRENCY_OPTIONS },
      ]}
      columns={[
        { key: "display_id", label: t("custom.reports.common.orderNo") },
        { key: "created_at", label: t("custom.reports.common.date") },
        { key: "discount_total", label: t("custom.reports.discounts.colDiscountTotal"), align: "left" },
        { key: "total", label: t("custom.reports.discounts.colOrderTotal"), align: "left" },
      ]}
      mapRow={(r) => ({
        display_id: `#${r.display_id}`,
        created_at: fmtDate(r.created_at),
        discount_total: fmtMoney(r.discount_total, r.currency_code),
        total: fmtMoney(r.total, r.currency_code),
      })}
      renderSummary={(data) => (
        <Text size="small" weight="plus">
          {t("custom.reports.discounts.summary", {
            value: fmtCurrencyMap(data?.totals?.discount_by_currency),
          })}
        </Text>
      )}
    />
  )
}

export const config = defineRouteConfig({
  label: "الخصومات",
  icon: ReceiptPercent,
})

export default DiscountsReport
