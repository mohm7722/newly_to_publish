import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Users } from "@medusajs/icons"
import { useTranslation } from "react-i18next"
import { ReportView } from "../../../components/reports/report-view"
import {
  fmtNumber,
  fmtCurrencyMap,
  fmtDate,
  CURRENCY_OPTIONS,
} from "../../../components/reports/format"

type Row = {
  customer_name: string
  email: string | null
  orders: number
  value_by_currency: Record<string, number>
  last_order: string | null
}

const SalesByCustomerReport = () => {
  const { t } = useTranslation()
  return (
    <ReportView<Row>
      title={t("custom.reports.salesByCustomer.title")}
      description={t("custom.reports.salesByCustomer.description")}
      permission="orders:read"
      endpoint="/admin/reports/sales-by-customer"
      exportFilename="sales-by-customer"
      filters={[
        { key: "date_from", label: t("custom.reports.common.dateFrom"), type: "date" },
        { key: "date_to", label: t("custom.reports.common.dateTo"), type: "date" },
        { key: "currency_code", label: t("custom.reports.common.currency"), type: "select", options: CURRENCY_OPTIONS },
        { key: "customer", label: t("custom.reports.salesByCustomer.customer"), type: "text", placeholder: t("custom.reports.salesByCustomer.customerPlaceholder") },
      ]}
      columns={[
        { key: "customer_name", label: t("custom.reports.salesByCustomer.customer") },
        { key: "email", label: t("custom.reports.salesByCustomer.colEmail") },
        { key: "orders", label: t("custom.reports.common.orders"), align: "left" },
        { key: "value", label: t("custom.reports.salesByCustomer.colValue"), align: "left" },
        { key: "last_order", label: t("custom.reports.salesByCustomer.colLastOrder") },
      ]}
      mapRow={(r) => ({
        customer_name: r.customer_name,
        email: r.email ?? "—",
        orders: fmtNumber(r.orders),
        value: fmtCurrencyMap(r.value_by_currency),
        last_order: fmtDate(r.last_order),
      })}
    />
  )
}

export const config = defineRouteConfig({
  label: "المبيعات حسب العميل",
  icon: Users,
})

export default SalesByCustomerReport
