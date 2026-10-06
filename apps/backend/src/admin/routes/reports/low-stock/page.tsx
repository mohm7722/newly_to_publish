import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CubeSolid } from "@medusajs/icons"
import { useTranslation } from "react-i18next"
import { ReportView } from "../../../components/reports/report-view"
import { fmtNumber } from "../../../components/reports/format"

type Row = {
  sku: string
  title: string
  location: string
  available: number
  threshold: number
}

const LowStockReport = () => {
  const { t } = useTranslation()
  return (
    <ReportView<Row>
      title={t("custom.reports.lowStock.title")}
      description={t("custom.reports.lowStock.description")}
      permission="inventory:read"
      endpoint="/admin/reports/low-stock"
      exportFilename="low-stock"
      filters={[
        { key: "threshold", label: t("custom.reports.lowStock.threshold"), type: "text", placeholder: "5" },
        {
          key: "location_id",
          label: t("custom.reports.common.warehouse"),
          type: "async-select",
          endpoint: "/admin/stock-locations?limit=200&fields=id,name",
          mapOptions: (d) =>
            (d?.stock_locations ?? []).map((l: any) => ({
              value: l.id,
              label: l.name,
            })),
        },
      ]}
      columns={[
        { key: "sku", label: t("custom.reports.common.sku") },
        { key: "title", label: t("custom.reports.common.item") },
        { key: "location", label: t("custom.reports.common.warehouse") },
        { key: "available", label: t("custom.reports.common.available"), align: "left" },
        { key: "threshold", label: t("custom.reports.lowStock.threshold"), align: "left" },
      ]}
      mapRow={(r) => ({
        sku: r.sku,
        title: r.title,
        location: r.location,
        available: fmtNumber(r.available),
        threshold: fmtNumber(r.threshold),
      })}
    />
  )
}

export const config = defineRouteConfig({
  label: "الأصناف منخفضة المخزون",
  icon: CubeSolid,
})

export default LowStockReport
