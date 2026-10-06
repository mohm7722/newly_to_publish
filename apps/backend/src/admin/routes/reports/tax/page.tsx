import { defineRouteConfig } from "@medusajs/admin-sdk"
import { BuildingTax } from "@medusajs/icons"
import { useTranslation } from "react-i18next"
import { ReportView } from "../../../components/reports/report-view"
import { fmtNumber, fmtMoney } from "../../../components/reports/format"

type Row = {
  currency: string
  orders: number
  taxable_subtotal: number
  tax_total: number
}

const TaxReport = () => {
  const { t } = useTranslation()
  return (
    <ReportView<Row>
      title={t("custom.reports.tax.title")}
      description={t("custom.reports.tax.description")}
      permission="orders:read"
      endpoint="/admin/reports/tax"
      exportFilename="tax"
      orientation="portrait"
      filters={[
        { key: "date_from", label: t("custom.reports.common.dateFrom"), type: "date" },
        { key: "date_to", label: t("custom.reports.common.dateTo"), type: "date" },
      ]}
      columns={[
        { key: "currency", label: t("custom.reports.common.currency") },
        { key: "orders", label: t("custom.reports.common.orders"), align: "left" },
        { key: "taxable_subtotal", label: t("custom.reports.tax.colTaxable"), align: "left" },
        { key: "tax_total", label: t("custom.reports.tax.colTaxTotal"), align: "left" },
      ]}
      mapRow={(r) => ({
        currency: r.currency,
        orders: fmtNumber(r.orders),
        taxable_subtotal: fmtMoney(r.taxable_subtotal, r.currency),
        tax_total: fmtMoney(r.tax_total, r.currency),
      })}
    />
  )
}

export const config = defineRouteConfig({
  label: "الضرائب",
  icon: BuildingTax,
})

export default TaxReport
