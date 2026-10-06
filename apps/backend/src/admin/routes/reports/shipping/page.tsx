import { defineRouteConfig } from "@medusajs/admin-sdk"
import { TruckFast } from "@medusajs/icons"
import { useTranslation } from "react-i18next"
import { ReportView } from "../../../components/reports/report-view"
import { fmtNumber, fmtCurrencyMap } from "../../../components/reports/format"

type Row = {
  city: string
  province: string
  orders: number
  value_by_currency: Record<string, number>
}

const ShippingReport = () => {
  const { t } = useTranslation()
  return (
    <ReportView<Row>
      title={t("custom.reports.shipping.title")}
      description={t("custom.reports.shipping.description")}
      permission="orders:read"
      endpoint="/admin/reports/shipping"
      exportFilename="shipping"
      filters={[
        { key: "date_from", label: t("custom.reports.common.dateFrom"), type: "date" },
        { key: "date_to", label: t("custom.reports.common.dateTo"), type: "date" },
        { key: "province", label: t("custom.reports.common.province"), type: "text", placeholder: t("custom.reports.common.province") },
      ]}
      columns={[
        { key: "city", label: t("custom.reports.common.city") },
        { key: "province", label: t("custom.reports.common.province") },
        { key: "orders", label: t("custom.reports.common.orders"), align: "left" },
        { key: "value", label: t("custom.reports.shipping.colValue"), align: "left" },
      ]}
      mapRow={(r) => ({
        city: r.city,
        province: r.province,
        orders: fmtNumber(r.orders),
        value: fmtCurrencyMap(r.value_by_currency),
      })}
    />
  )
}

export const config = defineRouteConfig({
  label: "الشحن",
  icon: TruckFast,
})

export default ShippingReport
