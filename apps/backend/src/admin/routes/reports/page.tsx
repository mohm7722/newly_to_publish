import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChartBar } from "@medusajs/icons"
import { Container, Heading, Text } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { useMyPermissions, makeChecker } from "../../lib/use-my-permissions"

type ReportLink = {
  to: string
  /** Key under `custom.reports.index.links`. */
  key: string
  permission: string
}

const REPORTS: ReportLink[] = [
  { to: "/reports/sold-products", key: "soldProducts", permission: "orders:read" },
  { to: "/reports/sales-by-customer", key: "salesByCustomer", permission: "orders:read" },
  { to: "/reports/revenue-by-currency", key: "revenueByCurrency", permission: "settlements:read" },
  { to: "/reports/settlements", key: "settlements", permission: "settlements:read" },
  { to: "/reports/payment-methods", key: "paymentMethods", permission: "payments:read" },
  { to: "/reports/bank-transfers", key: "bankTransfers", permission: "payments:read" },
  { to: "/reports/discounts", key: "discounts", permission: "orders:read" },
  { to: "/reports/coupons", key: "coupons", permission: "promotions:read" },
  { to: "/reports/tax", key: "tax", permission: "orders:read" },
  { to: "/reports/shipping", key: "shipping", permission: "orders:read" },
  { to: "/reports/returns", key: "returns", permission: "returns:read" },
  { to: "/reports/inventory-stock", key: "inventoryStock", permission: "inventory:read" },
  { to: "/reports/low-stock", key: "lowStock", permission: "inventory:read" },
  { to: "/reports/daily-activity", key: "dailyActivity", permission: "orders:read" },
  { to: "/reports/abandoned-carts", key: "abandonedCarts", permission: "orders:read" },
]

const ReportsIndexPage = () => {
  const { t } = useTranslation()
  const { data: perms } = useMyPermissions()
  const can = makeChecker(perms)
  const visible = REPORTS.filter((r) => can(r.permission))

  return (
    <Container className="p-6">
      <Heading level="h1">{t("custom.reports.index.title")}</Heading>
      <Text size="small" className="text-ui-fg-subtle mb-4">
        {t("custom.reports.index.subtitle")}
      </Text>
      {visible.length === 0 ? (
        <Text className="text-ui-fg-subtle">
          {t("custom.reports.index.noPermission")}
        </Text>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((r) => (
            <Link
              key={r.to}
              to={r.to}
              className="border-ui-border-base hover:bg-ui-bg-subtle rounded-lg border p-4 transition-colors"
            >
              <Text weight="plus">
                {t(`custom.reports.index.links.${r.key}.title`)}
              </Text>
              <Text size="small" className="text-ui-fg-subtle">
                {t(`custom.reports.index.links.${r.key}.description`)}
              </Text>
            </Link>
          ))}
        </div>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "التقارير",
  icon: ChartBar,
})

export default ReportsIndexPage
