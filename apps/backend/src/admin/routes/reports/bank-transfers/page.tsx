import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Buildings } from "@medusajs/icons"
import { useTranslation } from "react-i18next"
import { ReportView } from "../../../components/reports/report-view"
import {
  fmtNumber,
  fmtMoney,
  CURRENCY_OPTIONS,
} from "../../../components/reports/format"

type Row = {
  currency: string
  orders: number
  value: number
  accounts: string[]
}

const BankTransfersReport = () => {
  const { t } = useTranslation()
  return (
    <ReportView<Row>
      title={t("custom.reports.bankTransfers.title")}
      description={t("custom.reports.bankTransfers.description")}
      permission="payments:read"
      endpoint="/admin/reports/bank-transfers"
      exportFilename="bank-transfers"
      filters={[
        { key: "date_from", label: t("custom.reports.common.dateFrom"), type: "date" },
        { key: "date_to", label: t("custom.reports.common.dateTo"), type: "date" },
        { key: "currency_code", label: t("custom.reports.common.currency"), type: "select", options: CURRENCY_OPTIONS },
      ]}
      columns={[
        { key: "currency", label: t("custom.reports.common.currency") },
        { key: "orders", label: t("custom.reports.common.orders"), align: "left" },
        { key: "value", label: t("custom.reports.bankTransfers.colValue"), align: "left" },
        { key: "accounts", label: t("custom.reports.bankTransfers.colAccounts") },
      ]}
      mapRow={(r) => ({
        currency: r.currency,
        orders: fmtNumber(r.orders),
        value: fmtMoney(r.value, r.currency),
        accounts: r.accounts.length > 0 ? r.accounts.join("، ") : "—",
      })}
    />
  )
}

export const config = defineRouteConfig({
  label: "التحويلات البنكية",
  icon: Buildings,
})

export default BankTransfersReport
