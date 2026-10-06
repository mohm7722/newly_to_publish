import { defineRouteConfig } from "@medusajs/admin-sdk"
import { CircleStack } from "@medusajs/icons"
import { Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { ReportView } from "../../../components/reports/report-view"
import { fmtNumber } from "../../../components/reports/format"

type Row = {
  sku: string
  title: string
  location: string
  stocked: number
  reserved: number
  available: number
}

const InventoryStockReport = () => {
  const { t } = useTranslation()
  return (
    <ReportView<Row>
      title={t("custom.reports.inventoryStock.title")}
      description={t("custom.reports.inventoryStock.description")}
      permission="inventory:read"
      endpoint="/admin/reports/inventory-stock"
      exportFilename="inventory-stock"
      filters={[
        { key: "q", label: t("custom.reports.inventoryStock.searchLabel"), type: "text", placeholder: t("custom.reports.inventoryStock.searchPlaceholder") },
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
        { key: "stocked", label: t("custom.reports.inventoryStock.colStocked"), align: "left" },
        { key: "reserved", label: t("custom.reports.inventoryStock.colReserved"), align: "left" },
        { key: "available", label: t("custom.reports.common.available"), align: "left" },
      ]}
      mapRow={(r) => ({
        sku: r.sku,
        title: r.title,
        location: r.location,
        stocked: fmtNumber(r.stocked),
        reserved: fmtNumber(r.reserved),
        available: fmtNumber(r.available),
      })}
      renderSummary={(data) => (
        <Text size="small" weight="plus">
          {t("custom.reports.inventoryStock.summary", {
            stocked: fmtNumber(data?.totals?.stocked ?? 0),
            reserved: fmtNumber(data?.totals?.reserved ?? 0),
            available: fmtNumber(data?.totals?.available ?? 0),
          })}
        </Text>
      )}
    />
  )
}

export const config = defineRouteConfig({
  label: "المخزون حسب المستودع",
  icon: CircleStack,
})

export default InventoryStockReport
