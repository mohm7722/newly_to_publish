import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ReceiptPercent } from "@medusajs/icons"
import {
  Button,
  Container,
  Heading,
  Input,
  Label,
  Select,
  Table,
  Text,
  Badge,
} from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { adminFetch } from "../../lib/admin-fetch"
import { useMyPermissions, makeChecker } from "../../lib/use-my-permissions"
import { useDocumentExport } from "../../lib/printing/use-document-export"
import DocumentSheet from "../../components/documents/document-sheet"
import ListReportTemplate from "../../components/documents/list-report-template"

type ProcessingOrder = {
  id: string
  display_id: number
  created_at: string
  customer_name: string
  email: string | null
  city: string | null
  province: string | null
  total: number
  currency_code: string
  payment_status: string
  payment_method: string
  fulfillment_status: string
  sales_channel: string | null
}

type Filters = {
  date_from: string
  date_to: string
  city: string
  province: string
  payment_status: string
  payment_method: string
  sales_channel_id: string
  customer: string
  q: string
}

const EMPTY: Filters = {
  date_from: "",
  date_to: "",
  city: "",
  province: "",
  payment_status: "",
  payment_method: "",
  sales_channel_id: "",
  customer: "",
  q: "",
}

function buildQuery(f: Filters): string {
  const p = new URLSearchParams()
  Object.entries(f).forEach(([k, v]) => {
    if (v && v.trim().length > 0) p.set(k, v.trim())
  })
  const s = p.toString()
  return s ? `?${s}` : ""
}

function fmtDate(v: string): string {
  try {
    return new Intl.DateTimeFormat("ar", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(v))
  } catch {
    return v
  }
}
function fmtMoney(n: number, c: string): string {
  return `${new Intl.NumberFormat("ar", { maximumFractionDigits: 2 }).format(n)} ${c}`
}
const methodLabel: Record<string, string> = {
  cod: "الدفع عند الاستلام",
  bank_transfer: "تحويل بنكي",
  other: "أخرى",
}

const ProcessingOrdersPage = () => {
  const { data: perms } = useMyPermissions()
  const can = makeChecker(perms)
  const allowed = can("orders.processing.view")

  const [draft, setDraft] = useState<Filters>(EMPTY)
  const [applied, setApplied] = useState<Filters>(EMPTY)

  const { ref, exporting, exportPdf } = useDocumentExport()

  const channelsQuery = useQuery({
    queryKey: ["admin", "sales-channels", "list"],
    queryFn: () =>
      adminFetch<{ sales_channels: { id: string; name: string }[] }>(
        "/admin/sales-channels?limit=100"
      ),
    enabled: allowed,
  })

  const ordersQuery = useQuery({
    queryKey: ["admin", "reports", "processing-orders", applied],
    queryFn: () =>
      adminFetch<{ orders: ProcessingOrder[]; count: number }>(
        `/admin/reports/processing-orders${buildQuery(applied)}`
      ),
    enabled: allowed,
  })

  const set = (partial: Partial<Filters>) =>
    setDraft((prev) => ({ ...prev, ...partial }))

  const orders = ordersQuery.data?.orders ?? []
  const channels = channelsQuery.data?.sales_channels ?? []

  const reportRows = useMemo(
    () =>
      orders.map((o) => ({
        display_id: `#${o.display_id}`,
        created_at: fmtDate(o.created_at),
        customer_name: o.customer_name,
        city: o.city ?? "—",
        province: o.province ?? "—",
        total: fmtMoney(o.total, o.currency_code?.toUpperCase() ?? ""),
        payment_method: methodLabel[o.payment_method] ?? o.payment_method,
        payment_status: o.payment_status,
      })),
    [orders]
  )

  if (!allowed) {
    return (
      <Container className="p-6">
        <Heading level="h1">الطلبات قيد التجهيز</Heading>
        <Text className="text-ui-fg-subtle mt-2">
          لا تملك صلاحية عرض هذا الكشف.
        </Text>
      </Container>
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">الطلبات قيد التجهيز</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            الطلبات غير الملغاة، المدفوعة أو عند الاستلام، ولم تُشحَن بالكامل
          </Text>
        </div>
        <Button
          variant="primary"
          disabled={exporting || orders.length === 0}
          isLoading={exporting}
          onClick={() => exportPdf({ filename: "processing-orders", orientation: "landscape" })}
        >
          تصدير النتائج PDF
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 gap-3 px-6 py-4 md:grid-cols-3 lg:grid-cols-4">
        <div className="flex flex-col gap-y-1">
          <Label size="small">من تاريخ</Label>
          <Input type="date" value={draft.date_from} onChange={(e) => set({ date_from: e.target.value })} />
        </div>
        <div className="flex flex-col gap-y-1">
          <Label size="small">إلى تاريخ</Label>
          <Input type="date" value={draft.date_to} onChange={(e) => set({ date_to: e.target.value })} />
        </div>
        <div className="flex flex-col gap-y-1">
          <Label size="small">المدينة</Label>
          <Input value={draft.city} onChange={(e) => set({ city: e.target.value })} placeholder="المدينة" />
        </div>
        <div className="flex flex-col gap-y-1">
          <Label size="small">المحافظة</Label>
          <Input value={draft.province} onChange={(e) => set({ province: e.target.value })} placeholder="المحافظة" />
        </div>
        <div className="flex flex-col gap-y-1">
          <Label size="small">طريقة الدفع</Label>
          <Select value={draft.payment_method || "__all__"} onValueChange={(v) => set({ payment_method: v === "__all__" ? "" : v })}>
            <Select.Trigger><Select.Value placeholder="الكل" /></Select.Trigger>
            <Select.Content>
              <Select.Item value="__all__">الكل</Select.Item>
              <Select.Item value="cod">الدفع عند الاستلام</Select.Item>
              <Select.Item value="bank_transfer">تحويل بنكي</Select.Item>
            </Select.Content>
          </Select>
        </div>
        <div className="flex flex-col gap-y-1">
          <Label size="small">حالة الدفع</Label>
          <Select value={draft.payment_status || "__all__"} onValueChange={(v) => set({ payment_status: v === "__all__" ? "" : v })}>
            <Select.Trigger><Select.Value placeholder="الكل" /></Select.Trigger>
            <Select.Content>
              <Select.Item value="__all__">الكل</Select.Item>
              <Select.Item value="authorized">معتمد</Select.Item>
              <Select.Item value="captured">مكتمل</Select.Item>
              <Select.Item value="partially_captured">مكتمل جزئياً</Select.Item>
              <Select.Item value="partially_authorized">معتمد جزئياً</Select.Item>
            </Select.Content>
          </Select>
        </div>
        <div className="flex flex-col gap-y-1">
          <Label size="small">قناة البيع</Label>
          <Select value={draft.sales_channel_id || "__all__"} onValueChange={(v) => set({ sales_channel_id: v === "__all__" ? "" : v })}>
            <Select.Trigger><Select.Value placeholder="الكل" /></Select.Trigger>
            <Select.Content>
              <Select.Item value="__all__">الكل</Select.Item>
              {channels.map((c) => (
                <Select.Item key={c.id} value={c.id}>{c.name}</Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
        <div className="flex flex-col gap-y-1">
          <Label size="small">العميل</Label>
          <Input value={draft.customer} onChange={(e) => set({ customer: e.target.value })} placeholder="اسم أو بريد العميل" />
        </div>
        <div className="flex flex-col gap-y-1">
          <Label size="small">رقم الطلب</Label>
          <Input value={draft.q} onChange={(e) => set({ q: e.target.value })} placeholder="#1234" />
        </div>
        <div className="flex items-end gap-2">
          <Button variant="primary" onClick={() => setApplied(draft)} isLoading={ordersQuery.isFetching}>
            بحث
          </Button>
          <Button variant="secondary" onClick={() => { setDraft(EMPTY); setApplied(EMPTY) }}>
            إعادة تعيين
          </Button>
        </div>
      </div>

      {/* Results */}
      {ordersQuery.isError && (
        <div className="px-6 py-6">
          <Text className="text-ui-fg-error">تعذّر تحميل الكشف: {(ordersQuery.error as Error)?.message}</Text>
        </div>
      )}
      {!ordersQuery.isError && (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>رقم الطلب</Table.HeaderCell>
              <Table.HeaderCell>التاريخ</Table.HeaderCell>
              <Table.HeaderCell>العميل</Table.HeaderCell>
              <Table.HeaderCell>المدينة</Table.HeaderCell>
              <Table.HeaderCell>المحافظة</Table.HeaderCell>
              <Table.HeaderCell>الإجمالي</Table.HeaderCell>
              <Table.HeaderCell>طريقة الدفع</Table.HeaderCell>
              <Table.HeaderCell>حالة الدفع</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {orders.map((o) => (
              <Table.Row key={o.id}>
                <Table.Cell>#{o.display_id}</Table.Cell>
                <Table.Cell>{fmtDate(o.created_at)}</Table.Cell>
                <Table.Cell>{o.customer_name}</Table.Cell>
                <Table.Cell>{o.city ?? "—"}</Table.Cell>
                <Table.Cell>{o.province ?? "—"}</Table.Cell>
                <Table.Cell>{fmtMoney(o.total, o.currency_code?.toUpperCase() ?? "")}</Table.Cell>
                <Table.Cell>{methodLabel[o.payment_method] ?? o.payment_method}</Table.Cell>
                <Table.Cell><Badge size="small">{o.payment_status}</Badge></Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}
      {!ordersQuery.isError && orders.length === 0 && !ordersQuery.isFetching && (
        <div className="px-6 py-6">
          <Text className="text-ui-fg-subtle">لا توجد طلبات مطابقة.</Text>
        </div>
      )}

      {/* Off-screen printable report (export target) */}
      <div style={{ position: "absolute", left: -10000, top: 0 }} aria-hidden>
        <div ref={ref}>
          <DocumentSheet width={1100}>
            <ListReportTemplate
              title="كشف الطلبات قيد التجهيز"
              storeName={perms?.email ? undefined : undefined}
              generatedAt={fmtDate(new Date().toISOString())}
              columns={[
                { key: "display_id", label: "رقم الطلب" },
                { key: "created_at", label: "التاريخ" },
                { key: "customer_name", label: "العميل" },
                { key: "city", label: "المدينة" },
                { key: "province", label: "المحافظة" },
                { key: "total", label: "الإجمالي", align: "left" },
                { key: "payment_method", label: "طريقة الدفع" },
                { key: "payment_status", label: "حالة الدفع" },
              ]}
              rows={reportRows}
            />
          </DocumentSheet>
        </div>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "الطلبات قيد التجهيز",
  icon: ReceiptPercent,
})

export default ProcessingOrdersPage
