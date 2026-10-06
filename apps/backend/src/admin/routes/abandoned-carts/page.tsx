import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ShoppingBag } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  Heading,
  Label,
  Prompt,
  Select,
  Table,
  Text,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { adminFetch } from "../../lib/admin-fetch"
import { useMyPermissions, makeChecker } from "../../lib/use-my-permissions"
import { fmtMoney, fmtDate, fmtNumber } from "../../components/reports/format"

type CartRow = {
  cart_id: string
  email: string | null
  currency_code: string | null
  item_count: number
  total: number
  updated_at: string | null
  created_at: string | null
  reminder_count: number
  last_reminder_at: string | null
  recovered: boolean
  dismissed: boolean
}

const QUERY_KEY = ["admin", "abandoned-carts"] as const

const STATUS_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "reminded", label: "تم تذكيرها" },
  { value: "not_reminded", label: "لم يتم تذكيرها" },
  { value: "dismissed", label: "مُستبعدة" },
]

const EMAIL_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "yes", label: "لديها بريد" },
  { value: "no", label: "بدون بريد" },
]

const AbandonedCartsPage = () => {
  const queryClient = useQueryClient()
  const { data: perms } = useMyPermissions()
  const can = makeChecker(perms)
  const canManage = can("abandoned_carts:update")

  const [status, setStatus] = useState("all")
  const [hasEmail, setHasEmail] = useState("all")
  const [remindTarget, setRemindTarget] = useState<CartRow | null>(null)

  const queryString = useMemo(() => {
    const p = new URLSearchParams()
    if (status !== "all") p.set("status", status)
    if (hasEmail !== "all") p.set("has_email", hasEmail)
    const s = p.toString()
    return s ? `?${s}` : ""
  }, [status, hasEmail])

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [...QUERY_KEY, status, hasEmail],
    queryFn: () =>
      adminFetch<{ carts: CartRow[]; count: number }>(
        `/admin/abandoned-carts${queryString}`
      ),
  })

  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: QUERY_KEY })

  const remindMutation = useMutation({
    mutationFn: (cart: CartRow) =>
      adminFetch(`/admin/abandoned-carts/${cart.cart_id}/remind`, {
        method: "POST",
      }),
    onSuccess: async () => {
      await refresh()
      toast.success("تم إرسال التذكير بنجاح")
      setRemindTarget(null)
    },
    onError: (err: Error) => {
      toast.error("تعذّر إرسال التذكير", { description: err.message })
      setRemindTarget(null)
    },
  })

  const dismissMutation = useMutation({
    mutationFn: (cart: CartRow) =>
      adminFetch(`/admin/abandoned-carts/${cart.cart_id}/dismiss`, {
        method: "POST",
        body: { dismissed: !cart.dismissed },
      }),
    onSuccess: async (_res, cart) => {
      await refresh()
      toast.success(cart.dismissed ? "تم إلغاء الاستبعاد" : "تم استبعاد السلة")
    },
    onError: (err: Error) => {
      toast.error("تعذّر تحديث حالة الاستبعاد", { description: err.message })
    },
  })

  const carts = data?.carts ?? []

  const statusBadge = (c: CartRow) => {
    if (c.recovered) return <Badge color="green" size="small">مُسترجعة</Badge>
    if (c.dismissed) return <Badge color="grey" size="small">مُستبعدة</Badge>
    if (c.reminder_count > 0)
      return <Badge color="blue" size="small">تم تذكيرها</Badge>
    return <Badge color="orange" size="small">بانتظار</Badge>
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">السلال المهجورة</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            إدارة السلال التي لم تكتمل، وإرسال تذكيرات الاسترجاع للعملاء
          </Text>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 px-6 py-4 md:grid-cols-3">
        <div className="flex flex-col gap-y-1">
          <Label size="small">الحالة</Label>
          <Select value={status} onValueChange={setStatus}>
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              {STATUS_OPTIONS.map((o) => (
                <Select.Item key={o.value} value={o.value}>
                  {o.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
        <div className="flex flex-col gap-y-1">
          <Label size="small">البريد الإلكتروني</Label>
          <Select value={hasEmail} onValueChange={setHasEmail}>
            <Select.Trigger>
              <Select.Value />
            </Select.Trigger>
            <Select.Content>
              {EMAIL_OPTIONS.map((o) => (
                <Select.Item key={o.value} value={o.value}>
                  {o.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
      </div>

      {isLoading && (
        <div className="px-6 py-8">
          <Text className="text-ui-fg-subtle">جارٍ تحميل السلال…</Text>
        </div>
      )}

      {isError && (
        <div className="px-6 py-8">
          <Text className="text-ui-fg-error">
            تعذّر تحميل السلال: {(error as Error)?.message}
          </Text>
        </div>
      )}

      {!isLoading && !isError && carts.length === 0 && (
        <div className="px-6 py-8">
          <Text className="text-ui-fg-subtle">لا توجد سلال مهجورة مطابقة.</Text>
        </div>
      )}

      {!isLoading && !isError && carts.length > 0 && (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>البريد الإلكتروني</Table.HeaderCell>
              <Table.HeaderCell>العناصر</Table.HeaderCell>
              <Table.HeaderCell>الإجمالي</Table.HeaderCell>
              <Table.HeaderCell>آخر نشاط</Table.HeaderCell>
              <Table.HeaderCell>التذكيرات</Table.HeaderCell>
              <Table.HeaderCell>الحالة</Table.HeaderCell>
              <Table.HeaderCell className="text-right">الإجراءات</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {carts.map((c) => (
              <Table.Row key={c.cart_id}>
                <Table.Cell>{c.email ?? "—"}</Table.Cell>
                <Table.Cell>{fmtNumber(c.item_count)}</Table.Cell>
                <Table.Cell>
                  {fmtMoney(c.total, c.currency_code ?? "SAR")}
                </Table.Cell>
                <Table.Cell>{fmtDate(c.updated_at)}</Table.Cell>
                <Table.Cell>{fmtNumber(c.reminder_count)}</Table.Cell>
                <Table.Cell>{statusBadge(c)}</Table.Cell>
                <Table.Cell>
                  <div className="flex items-center justify-end gap-2">
                    <Link to={`/abandoned-carts/${c.cart_id}`}>
                      <Button variant="secondary" size="small">
                        تفاصيل
                      </Button>
                    </Link>
                    {canManage && (
                      <>
                        <Button
                          variant="secondary"
                          size="small"
                          disabled={!c.email || c.recovered}
                          isLoading={
                            remindMutation.isPending &&
                            remindMutation.variables?.cart_id === c.cart_id
                          }
                          onClick={() => setRemindTarget(c)}
                        >
                          إرسال تذكير
                        </Button>
                        <Button
                          variant={c.dismissed ? "primary" : "danger"}
                          size="small"
                          isLoading={
                            dismissMutation.isPending &&
                            dismissMutation.variables?.cart_id === c.cart_id
                          }
                          onClick={() => dismissMutation.mutate(c)}
                        >
                          {c.dismissed ? "إلغاء الاستبعاد" : "استبعاد"}
                        </Button>
                      </>
                    )}
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}

      <Prompt
        open={remindTarget !== null}
        onOpenChange={(open) => {
          if (!open) setRemindTarget(null)
        }}
      >
        <Prompt.Content>
          <Prompt.Header>
            <Prompt.Title>إرسال تذكير</Prompt.Title>
            <Prompt.Description>
              سيتم إرسال تذكير بالسلة إلى {remindTarget?.email ?? ""}. هل تريد
              المتابعة؟
            </Prompt.Description>
          </Prompt.Header>
          <Prompt.Footer>
            <Prompt.Cancel>إلغاء</Prompt.Cancel>
            <Prompt.Action
              onClick={() => {
                if (remindTarget) remindMutation.mutate(remindTarget)
              }}
            >
              إرسال
            </Prompt.Action>
          </Prompt.Footer>
        </Prompt.Content>
      </Prompt>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "السلال المهجورة",
  icon: ShoppingBag,
})

export default AbandonedCartsPage
