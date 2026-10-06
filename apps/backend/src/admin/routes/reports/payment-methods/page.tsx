import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CurrencyDollar } from "@medusajs/icons"
import { useTranslation } from "react-i18next"
import { ReportView } from "../../../components/reports/report-view"
import {
  fmtNumber,
  fmtCurrencyMap,
  CURRENCY_OPTIONS,
} from "../../../components/reports/format"

type Row = {
  method_label: string
  orders: number
  share: number
  value_by_currency: Record<string, number>
}

const PaymentMethodsReport = () => {
  const { t } = useTranslation()
  return (
    <ReportView<Row>
      title={t("custom.reports.paymentMethods.title")}
      description={t("custom.reports.paymentMethods.description")}
      permission="payments:read"
      endpoint="/admin/reports/payment-methods"
      exportFilename="payment-methods"
      orientation="portrait"
      filters={[
        { key: "date_from", label: t("custom.reports.common.dateFrom"), type: "date" },
        { key: "date_to", label: t("custom.reports.common.dateTo"), type: "date" },
        { key: "currency_code", label: t("custom.reports.common.currency"), type: "select", options: CURRENCY_OPTIONS },
      ]}
      columns={[
        { key: "method_label", label: t("custom.reports.paymentMethods.colMethod") },
        { key: "orders", label: t("custom.reports.common.orders"), align: "left" },
        { key: "share", label: t("custom.reports.paymentMethods.colShare"), align: "left" },
        { key: "value", label: t("custom.reports.common.value"), align: "left" },
      ]}
      mapRow={(r) => ({
        method_label: r.method_label,
        orders: fmtNumber(r.orders),
        share: `${fmtNumber(r.share)}%`,
        value: fmtCurrencyMap(r.value_by_currency),
      })}
    />
  )
}

export const config = defineRouteConfig({
  label: "توزيع طرق الدفع",
  icon: CurrencyDollar,
})

export default PaymentMethodsReport
