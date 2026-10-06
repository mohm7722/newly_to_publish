import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChartBar } from "@medusajs/icons"
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Select,
  Text,
} from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { adminFetch } from "../../lib/admin-fetch"
import { useMyPermissions, makeChecker } from "../../lib/use-my-permissions"
import { fmtNumber, fmtMoney, fmtCurrencyMap } from "../../components/reports/format"
import {
  ChartCard,
  Donut,
  HBars,
  KpiCard,
  TrendChart,
} from "../../components/analytics/charts"

/** Shape of the `/admin/analytics/dashboard` response (subset used here). */
type DashboardData = {
  range: { date_from: string | null; date_to: string | null }
  granularity: "day" | "week" | "month"
  truncated: boolean
  currencies: string[]
  fx: { enabled: boolean; base: string; rates: Record<string, number> }
  kpis: {
    orders_total: number
    orders_by_status: Record<string, number>
    revenue_by_currency: Record<string, number>
    revenue_sar: number
    revenue_sar_excluded_currencies: string[]
    aov_by_currency: Record<string, number>
    customers_total: number
    customers_new: number
    customers_returning: number
    abandoned_carts: number
    abandoned_recovered: number
    abandoned_recovery_rate: number
    low_stock_count: number
    low_stock_threshold: number
  }
  sales_trend: Array<{
    bucket: string
    orders: number
    revenue_by_currency: Record<string, number>
    revenue_sar: number
  }>
  payment_mix: Array<{
    method: string
    method_label: string
    orders: number
    share: number
    value_by_currency: Record<string, number>
    value_sar: number
  }>
  by_city: Array<{
    city: string
    orders: number
    value_by_currency: Record<string, number>
    value_sar: number
  }>
  top_products: Array<{
    label: string
    quantity: number
    value_by_currency: Record<string, number>
    value_sar: number
  }>
}

const GRANULARITY_OPTIONS = [
  { value: "day", label: "يومي" },
  { value: "week", label: "أسبوعي" },
  { value: "month", label: "شهري" },
]

const STATUS_LABELS: Record<string, string> = {
  pending: "قيد الانتظار",
  completed: "مكتمل",
  archived: "مؤرشف",
  canceled: "ملغى",
  requires_action: "يتطلب إجراء",
  draft: "مسودة",
  unknown: "غير محدد",
}

/** Normalize a native amount in `currency` to the SAR base (client-side). */
function toSar(
  amount: number,
  currency: string,
  rates: Record<string, number>
): number {
  const c = (currency ?? "").toUpperCase()
  if (c === "SAR") return amount
  const rate = rates?.[c]
  if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) return amount
  return amount / rate
}

const AnalyticsDashboard = () => {
  const { data: perms } = useMyPermissions()
  const can = makeChecker(perms)
  const allowed = can("analytics:read")

  const [draft, setDraft] = useState({
    date_from: "",
    date_to: "",
    granularity: "day",
  })
  const [applied, setApplied] = useState(draft)

  const queryString = useMemo(() => {
    const p = new URLSearchParams()
    if (applied.date_from) p.set("date_from", applied.date_from)
    if (applied.date_to) p.set("date_to", applied.date_to)
    if (applied.granularity) p.set("granularity", applied.granularity)
    const s = p.toString()
    return s ? `?${s}` : ""
  }, [applied])

  const { data, isFetching, isError, error } = useQuery({
    queryKey: ["admin", "analytics", "dashboard", applied],
    queryFn: () =>
      adminFetch<DashboardData>(`/admin/analytics/dashboard${queryString}`),
    enabled: allowed,
  })

  if (!allowed) {
    return (
      <Container className="p-6">
        <Heading level="h1">لوحة التحليلات</Heading>
        <Text className="text-ui-fg-subtle mt-2">
          لا تملك صلاحية عرض التحليلات.
        </Text>
      </Container>
    )
  }

  const kpis = data?.kpis
  const rates = data?.fx.rates ?? {}

  const trendPoints =
    data?.sales_trend.map((t) => ({
      label: t.bucket,
      bars: t.orders,
      line: t.revenue_sar,
    })) ?? []

  const paymentDonut =
    data?.payment_mix.map((p) => ({
      label: p.method_label,
      value: p.orders,
    })) ?? []

  const revenueByCurrencyBars =
    data && Object.entries(data.kpis.revenue_by_currency).map(([cur, amt]) => ({
      label: cur,
      value: toSar(amt, cur, rates),
      hint: fmtMoney(amt, cur),
    }))

  const cityBars =
    data?.by_city.slice(0, 10).map((c) => ({
      label: c.city,
      value: c.value_sar,
      hint: fmtCurrencyMap(c.value_by_currency),
    })) ?? []

  const productBars =
    data?.top_products.map((p) => ({
      label: p.label,
      value: p.quantity,
      hint: `${fmtNumber(p.quantity)} قطعة`,
    })) ?? []

  const statusSub = kpis
    ? Object.entries(kpis.orders_by_status)
        .map(([s, n]) => `${STATUS_LABELS[s] ?? s}: ${fmtNumber(n)}`)
        .join(" · ")
    : ""

  return (
    <Container className="p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">لوحة التحليلات والإحصاءات</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            نظرة عامة على المبيعات والإيرادات وطرق الدفع — بالعملات الأصلية ومطبّعة
            إلى الريال السعودي (SAR)
          </Text>
        </div>
      </div>

      {/* Filters */}
      <div className="border-ui-border-base grid grid-cols-1 gap-3 border-t px-6 py-4 md:grid-cols-4">
        <div className="flex flex-col gap-y-1">
          <Label size="small">من تاريخ</Label>
          <Input
            type="date"
            value={draft.date_from}
            onChange={(e) => setDraft((d) => ({ ...d, date_from: e.target.value }))}
          />
        </div>
        <div className="flex flex-col gap-y-1">
          <Label size="small">إلى تاريخ</Label>
          <Input
            type="date"
            value={draft.date_to}
            onChange={(e) => setDraft((d) => ({ ...d, date_to: e.target.value }))}
          />
        </div>
        <div className="flex flex-col gap-y-1">
          <Label size="small">التقسيم الزمني</Label>
          <Select
            value={draft.granularity}
            onValueChange={(v) => setDraft((d) => ({ ...d, granularity: v }))}
          >
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              {GRANULARITY_OPTIONS.map((o) => (
                <Select.Item key={o.value} value={o.value}>
                  {o.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
        <div className="flex items-end gap-2">
          <Button
            variant="primary"
            isLoading={isFetching}
            onClick={() => setApplied({ ...draft })}
          >
            تطبيق
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              const reset = { date_from: "", date_to: "", granularity: "day" }
              setDraft(reset)
              setApplied(reset)
            }}
          >
            إعادة تعيين
          </Button>
        </div>
      </div>

      {isError && (
        <div className="px-6 py-6">
          <Text className="text-ui-fg-error">
            تعذّر تحميل التحليلات: {(error as Error)?.message}
          </Text>
        </div>
      )}

      {data && (
        <div className="flex flex-col gap-y-6 px-6 py-6">
          {data.truncated && (
            <Text size="small" className="text-ui-fg-muted">
              ملاحظة: يُعرض حتى 5000 طلب ضمن النطاق المحدد. ضيّق نطاق التاريخ
              للحصول على أرقام دقيقة شاملة.
            </Text>
          )}

          {/* KPI cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <KpiCard
              label="إجمالي الإيرادات (مطبّع SAR)"
              value={fmtMoney(kpis!.revenue_sar, "SAR")}
              sub={
                fmtCurrencyMap(kpis!.revenue_by_currency) +
                (kpis!.revenue_sar_excluded_currencies.length
                  ? ` — مستثناة من التطبيع: ${kpis!.revenue_sar_excluded_currencies.join(", ")}`
                  : "")
              }
              accent="#10b981"
            />
            <KpiCard
              label="عدد الطلبات"
              value={fmtNumber(kpis!.orders_total)}
              sub={statusSub}
            />
            <KpiCard
              label="متوسط قيمة الطلب"
              value={fmtCurrencyMap(kpis!.aov_by_currency)}
            />
            <KpiCard
              label="العملاء"
              value={fmtNumber(kpis!.customers_total)}
              sub={`جديد: ${fmtNumber(kpis!.customers_new)} · عائد: ${fmtNumber(
                kpis!.customers_returning
              )}`}
            />
            <KpiCard
              label="السلال المهجورة"
              value={fmtNumber(kpis!.abandoned_carts)}
              sub={`مستردة: ${fmtNumber(kpis!.abandoned_recovered)} · معدل الاسترجاع: ${kpis!.abandoned_recovery_rate}%`}
            />
            <KpiCard
              label="أصناف منخفضة المخزون"
              value={fmtNumber(kpis!.low_stock_count)}
              sub={`عند أو تحت ${kpis!.low_stock_threshold} وحدة`}
              accent={kpis!.low_stock_count > 0 ? "#ef4444" : undefined}
            />
          </div>

          {/* Trend */}
          <ChartCard
            title="اتجاه المبيعات"
            description="عدد الطلبات (أعمدة) والإيراد المطبّع إلى SAR (خط) عبر الزمن"
          >
            <TrendChart
              points={trendPoints}
              barLabel="عدد الطلبات"
              lineLabel="الإيراد (SAR)"
              formatLine={(v) => fmtMoney(v, "SAR")}
            />
          </ChartCard>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ChartCard
              title="توزيع طرق الدفع"
              description="حسب عدد الطلبات (الدفع عند الاستلام / التحويل البنكي / أخرى)"
            >
              <Donut
                data={paymentDonut}
                formatValue={(v) => `${fmtNumber(v)} طلب`}
                centerLabel={fmtNumber(kpis!.orders_total)}
              />
            </ChartCard>

            <ChartCard
              title="الإيرادات حسب العملة"
              description="طول العمود مقارَن بالقيمة المطبّعة إلى SAR؛ القيمة الأصلية بجانبه"
            >
              <HBars
                data={revenueByCurrencyBars || []}
                formatValue={(v) => fmtMoney(v, "SAR")}
              />
            </ChartCard>

            <ChartCard
              title="المبيعات حسب مدينة الشحن"
              description="أعلى 10 مدن حسب الإيراد المطبّع إلى SAR"
            >
              <HBars data={cityBars} formatValue={(v) => fmtMoney(v, "SAR")} />
            </ChartCard>

            <ChartCard
              title="أفضل المنتجات مبيعاً"
              description="حسب الكمية المباعة"
            >
              <HBars data={productBars} formatValue={(v) => fmtNumber(v)} />
            </ChartCard>
          </div>
        </div>
      )}

      {isFetching && !data && (
        <div className="px-6 py-6">
          <Text className="text-ui-fg-subtle">جارٍ التحميل…</Text>
        </div>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "لوحة التحليلات",
  icon: ChartBar,
})

export default AnalyticsDashboard
