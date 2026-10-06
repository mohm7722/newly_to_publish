import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Calendar } from "@medusajs/icons"
import { useTranslation } from "react-i18next"
import { ReportView } from "../../../components/reports/report-view"
import { fmtNumber, fmtCurrencyMap } from "../../../components/reports/format"

type Row = {
  day: string
  orders: number
  canceled: number
  value_by_currency: Record<string, number>
}

const DailyActivityReport = () => {
  const { t } = useTranslation()
  return (
    <ReportView<Row>
      title={t("custom.reports.dailyActivity.title")}
      description={t("custom.reports.dailyActivity.description")}
      permission="orders:read"
      endpoint="/admin/reports/daily-activity"
      exportFilename="daily-activity"
      filters={[
        { key: "date_from", label: t("custom.reports.common.dateFrom"), type: "date" },
        { key: "date_to", label: t("custom.reports.common.dateTo"), type: "date" },
      ]}
      columns={[
        { key: "day", label: t("custom.reports.dailyActivity.colDay") },
        { key: "orders", label: t("custom.reports.common.orders"), align: "left" },
        { key: "canceled", label: t("custom.reports.dailyActivity.colCanceled"), align: "left" },
        { key: "value", label: t("custom.reports.dailyActivity.colValue"), align: "left" },
      ]}
      mapRow={(r) => ({
        day: r.day,
        orders: fmtNumber(r.orders),
        canceled: fmtNumber(r.canceled),
        value: fmtCurrencyMap(r.value_by_currency),
      })}
    />
  )
}

export const config = defineRouteConfig({
  label: "النشاط اليومي",
  icon: Calendar,
})

export default DailyActivityReport
