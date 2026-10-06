import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChartPie } from "@medusajs/icons"
import { useTranslation } from "react-i18next"
import { ReportView } from "../../../components/reports/report-view"
import { fmtNumber, fmtMoney } from "../../../components/reports/format"

type Row = {
  currency: string
  orders: number
  subtotal: number
  shipping: number
  tax: number
  discount: number
  total: number
}

const RevenueByCurrencyReport = () => {
  const { t } = useTranslation()
  return (
    <ReportView<Row>
      title={t("custom.reports.revenueByCurrency.title")}
      description={t("custom.reports.revenueByCurrency.description")}
      permission="settlements:read"
      endpoint="/admin/reports/revenue-by-currency"
      exportFilename="revenue-by-currency"
      orientation="portrait"
      filters={[
        { key: "date_from", label: t("custom.reports.common.dateFrom"), type: "date" },
        { key: "date_to", label: t("custom.reports.common.dateTo"), type: "date" },
      ]}
      columns={[
        { key: "currency", label: t("custom.reports.common.currency") },
        { key: "orders", label: t("custom.reports.common.orders"), align: "left" },
        { key: "subtotal", label: t("custom.reports.revenueByCurrency.colSubtotal"), align: "left" },
        { key: "shipping", label: t("custom.reports.revenueByCurrency.colShipping"), align: "left" },
        { key: "tax", label: t("custom.reports.revenueByCurrency.colTax"), align: "left" },
        { key: "discount", label: t("custom.reports.revenueByCurrency.colDiscount"), align: "left" },
        { key: "total", label: t("custom.reports.revenueByCurrency.colTotal"), align: "left" },
      ]}
      mapRow={(r) => ({
        currency: r.currency,
        orders: fmtNumber(r.orders),
        subtotal: fmtMoney(r.subtotal, r.currency),
        shipping: fmtMoney(r.shipping, r.currency),
        tax: fmtMoney(r.tax, r.currency),
        discount: fmtMoney(r.discount, r.currency),
        total: fmtMoney(r.total, r.currency),
      })}
    />
  )
}

export const config = defineRouteConfig({
  label: "الإيرادات حسب العملة",
  icon: ChartPie,
})

export default RevenueByCurrencyReport
