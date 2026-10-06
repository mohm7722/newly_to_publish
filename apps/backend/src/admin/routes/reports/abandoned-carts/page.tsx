import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ShoppingCart } from "@medusajs/icons"
import { Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { ReportView } from "../../../components/reports/report-view"
import { fmtNumber, fmtDate } from "../../../components/reports/format"

type Row = {
  cart_id: string
  email: string | null
  reminder_count: number
  last_reminder_at: string | null
  recovered: boolean
  created_at: string | null
}

const AbandonedCartsReport = () => {
  const { t } = useTranslation()
  return (
    <ReportView<Row>
      title={t("custom.reports.abandonedCarts.title")}
      description={t("custom.reports.abandonedCarts.description")}
      permission="orders:read"
      endpoint="/admin/reports/abandoned-carts"
      exportFilename="abandoned-carts"
      filters={[
        { key: "date_from", label: t("custom.reports.common.dateFrom"), type: "date" },
        { key: "date_to", label: t("custom.reports.common.dateTo"), type: "date" },
      ]}
      columns={[
        { key: "email", label: t("custom.reports.abandonedCarts.colEmail") },
        { key: "reminder_count", label: t("custom.reports.abandonedCarts.colReminderCount"), align: "left" },
        { key: "last_reminder_at", label: t("custom.reports.abandonedCarts.colLastReminder") },
        { key: "recovered", label: t("custom.reports.abandonedCarts.colRecovered") },
        { key: "created_at", label: t("custom.reports.abandonedCarts.colCreatedAt") },
      ]}
      mapRow={(r) => ({
        email: r.email ?? "—",
        reminder_count: fmtNumber(r.reminder_count),
        last_reminder_at: fmtDate(r.last_reminder_at),
        recovered: r.recovered
          ? t("custom.reports.abandonedCarts.yes")
          : t("custom.reports.abandonedCarts.no"),
        created_at: fmtDate(r.created_at),
      })}
      renderSummary={(data) => {
        const totals = data?.totals ?? {}
        return (
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <Text size="small" weight="plus">
              {t("custom.reports.abandonedCarts.summaryReminded", {
                value: fmtNumber(totals.reminded_carts ?? 0),
              })}
            </Text>
            <Text size="small" weight="plus">
              {t("custom.reports.abandonedCarts.summaryRemindersSent", {
                value: fmtNumber(totals.reminders_sent ?? 0),
              })}
            </Text>
            <Text size="small" weight="plus">
              {t("custom.reports.abandonedCarts.summaryRecovered", {
                value: fmtNumber(totals.recovered_carts ?? 0),
              })}
            </Text>
            <Text size="small" weight="plus">
              {t("custom.reports.abandonedCarts.summaryRate", {
                rate: fmtNumber(totals.recovery_rate ?? 0),
              })}
            </Text>
          </div>
        )
      }}
    />
  )
}

export const config = defineRouteConfig({
  label: "السلال المهجورة",
  icon: ShoppingCart,
})

export default AbandonedCartsReport
