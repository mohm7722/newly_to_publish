import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Tag } from "@medusajs/icons"
import { useTranslation } from "react-i18next"
import { ReportView } from "../../../components/reports/report-view"
import { fmtNumber } from "../../../components/reports/format"

type Row = {
  code: string
  status: string
  type: string
  value: number | null
  currency_code: string | null
  redemptions: number | null
}

const CouponsReport = () => {
  const { t } = useTranslation()
  return (
    <ReportView<Row>
      title={t("custom.reports.coupons.title")}
      description={t("custom.reports.coupons.description")}
      permission="promotions:read"
      endpoint="/admin/reports/coupons"
      exportFilename="coupons"
      filters={[
        {
          key: "status",
          label: t("custom.reports.common.status"),
          type: "select",
          options: [
            { value: "active", label: t("custom.reports.coupons.statusActive") },
            { value: "inactive", label: t("custom.reports.coupons.statusInactive") },
            { value: "draft", label: t("custom.reports.coupons.statusDraft") },
          ],
        },
        { key: "q", label: t("custom.reports.coupons.code"), type: "text", placeholder: t("custom.reports.coupons.codePlaceholder") },
      ]}
      columns={[
        { key: "code", label: t("custom.reports.coupons.code") },
        { key: "status", label: t("custom.reports.common.status") },
        { key: "type", label: t("custom.reports.coupons.colType") },
        { key: "value", label: t("custom.reports.common.value"), align: "left" },
        { key: "redemptions", label: t("custom.reports.coupons.colRedemptions"), align: "left" },
      ]}
      mapRow={(r) => ({
        code: r.code,
        status: r.status,
        type: r.type === "percentage" ? t("custom.reports.coupons.typePercentage") : r.type === "fixed" ? t("custom.reports.coupons.typeFixed") : r.type,
        value:
          r.value == null
            ? "—"
            : r.type === "percentage"
              ? `${fmtNumber(r.value)}%`
              : `${fmtNumber(r.value)}${r.currency_code ? ` ${r.currency_code}` : ""}`,
        redemptions: r.redemptions == null ? "—" : fmtNumber(r.redemptions),
      })}
    />
  )
}

export const config = defineRouteConfig({
  label: "القسائم",
  icon: Tag,
})

export default CouponsReport
