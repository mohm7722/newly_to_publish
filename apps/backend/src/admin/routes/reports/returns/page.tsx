import { defineRouteConfig } from "@medusajs/admin-sdk"
import { HandTruck } from "@medusajs/icons"
import { useTranslation } from "react-i18next"
import { ReportView } from "../../../components/reports/report-view"
import { fmtNumber, fmtDate } from "../../../components/reports/format"

type Row = {
  id: string
  display_id: number | null
  status: string
  items_count: number
  currency_code: string | null
  created_at: string | null
}

const ReturnsReport = () => {
  const { t } = useTranslation()
  return (
    <ReportView<Row>
      title={t("custom.reports.returns.title")}
      description={t("custom.reports.returns.description")}
      permission="returns:read"
      endpoint="/admin/reports/returns"
      exportFilename="returns"
      filters={[
        { key: "date_from", label: t("custom.reports.common.dateFrom"), type: "date" },
        { key: "date_to", label: t("custom.reports.common.dateTo"), type: "date" },
        {
          key: "status",
          label: t("custom.reports.common.status"),
          type: "select",
          options: [
            { value: "requested", label: t("custom.reports.returns.statusRequested") },
            { value: "received", label: t("custom.reports.returns.statusReceived") },
            { value: "partially_received", label: t("custom.reports.returns.statusPartiallyReceived") },
            { value: "canceled", label: t("custom.reports.returns.statusCanceled") },
          ],
        },
      ]}
      columns={[
        { key: "display_id", label: t("custom.reports.common.orderNo") },
        { key: "status", label: t("custom.reports.common.status") },
        { key: "items_count", label: t("custom.reports.returns.colItemsCount"), align: "left" },
        { key: "created_at", label: t("custom.reports.common.date") },
      ]}
      mapRow={(r) => ({
        display_id: r.display_id != null ? `#${r.display_id}` : "—",
        status: r.status,
        items_count: fmtNumber(r.items_count),
        created_at: fmtDate(r.created_at),
      })}
    />
  )
}

export const config = defineRouteConfig({
  label: "المرتجعات",
  icon: HandTruck,
})

export default ReturnsReport
