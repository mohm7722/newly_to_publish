import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ShoppingBag } from "@medusajs/icons"
import { Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { ReportView } from "../../../components/reports/report-view"
import {
  fmtNumber,
  fmtCurrencyMap,
  CURRENCY_OPTIONS,
} from "../../../components/reports/format"

type Row = {
  group_label: string
  quantity: number
  orders: number
  value_by_currency: Record<string, number>
}

const SoldProductsReport = () => {
  const { t } = useTranslation()
  return (
    <ReportView<Row>
      title={t("custom.reports.soldProducts.title")}
      description={t("custom.reports.soldProducts.description")}
      permission="orders:read"
      endpoint="/admin/reports/sold-products"
      exportFilename="sold-products"
      filters={[
        {
          key: "group_by",
          label: t("custom.reports.soldProducts.groupBy"),
          type: "select",
          defaultValue: "product",
          placeholder: "__no_all__",
          options: [
            { value: "product", label: t("custom.reports.soldProducts.groupProduct") },
            { value: "category", label: t("custom.reports.soldProducts.groupCategory") },
            { value: "currency", label: t("custom.reports.soldProducts.groupCurrency") },
            { value: "region", label: t("custom.reports.soldProducts.groupRegion") },
            { value: "city", label: t("custom.reports.soldProducts.groupCity") },
            { value: "province", label: t("custom.reports.soldProducts.groupProvince") },
          ],
        },
        { key: "date_from", label: t("custom.reports.common.dateFrom"), type: "date" },
        { key: "date_to", label: t("custom.reports.common.dateTo"), type: "date" },
        { key: "currency_code", label: t("custom.reports.common.currency"), type: "select", options: CURRENCY_OPTIONS },
        { key: "city", label: t("custom.reports.common.city"), type: "text", placeholder: t("custom.reports.common.city") },
        { key: "province", label: t("custom.reports.common.province"), type: "text", placeholder: t("custom.reports.common.province") },
        {
          key: "category_id",
          label: t("custom.reports.soldProducts.category"),
          type: "async-select",
          endpoint: "/admin/product-categories?limit=200&fields=id,name",
          mapOptions: (d) =>
            (d?.product_categories ?? []).map((c: any) => ({
              value: c.id,
              label: c.name,
            })),
        },
      ]}
      columns={[
        { key: "group_label", label: t("custom.reports.soldProducts.colItem") },
        { key: "quantity", label: t("custom.reports.soldProducts.colQuantity"), align: "left" },
        { key: "orders", label: t("custom.reports.common.orders"), align: "left" },
        { key: "value", label: t("custom.reports.common.value"), align: "left" },
      ]}
      mapRow={(r) => ({
        group_label: r.group_label,
        quantity: fmtNumber(r.quantity),
        orders: fmtNumber(r.orders),
        value: fmtCurrencyMap(r.value_by_currency),
      })}
      renderSummary={(data) => (
        <Text size="small" weight="plus">
          {t("custom.reports.soldProducts.summary", {
            quantity: fmtNumber(data?.totals?.quantity ?? 0),
            value: fmtCurrencyMap(data?.totals?.value_by_currency),
          })}
        </Text>
      )}
    />
  )
}

export const config = defineRouteConfig({
  label: "المنتجات المباعة",
  icon: ShoppingBag,
})

export default SoldProductsReport
