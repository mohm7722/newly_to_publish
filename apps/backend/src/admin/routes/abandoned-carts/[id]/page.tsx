import {
  Badge,
  Button,
  Container,
  Heading,
  Prompt,
  Table,
  Text,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { adminFetch } from "../../../lib/admin-fetch"
import { useMyPermissions, makeChecker } from "../../../lib/use-my-permissions"
import { fmtMoney, fmtDate, fmtNumber } from "../../../components/reports/format"

type CartItem = {
  id: string
  title: string | null
  variant_title: string | null
  quantity: number
  unit_price: number
  thumbnail: string | null
}

type CartDetail = {
  cart_id: string
  email: string | null
  currency_code: string | null
  completed: boolean
  created_at: string | null
  updated_at: string | null
  customer: {
    id: string
    first_name: string | null
    last_name: string | null
  } | null
  item_count: number
  total: number
  items: CartItem[]
  reminder: {
    reminder_count: number
    last_reminder_at: string | null
    recovered: boolean
    dismissed: boolean
    created_at: string | null
  } | null
}

const AbandonedCartDetailPage = () => {
  const { id } = useParams()
  const queryClient = useQueryClient()
  const { data: perms } = useMyPermissions()
  const can = makeChecker(perms)
  const canManage = can("abandoned_carts:update")

  const [remindOpen, setRemindOpen] = useState(false)

  const queryKey = ["admin", "abandoned-carts", id] as const

  const { data, isLoading, isError, error } = useQuery({
    queryKey,
    queryFn: () =>
      adminFetch<{ cart: CartDetail }>(`/admin/abandoned-carts/${id}`),
    enabled: !!id,
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey })

  const remindMutation = useMutation({
    mutationFn: () =>
      adminFetch(`/admin/abandoned-carts/${id}/remind`, { method: "POST" }),
    onSuccess: async () => {
      await refresh()
      toast.success("تم إرسال التذكير بنجاح")
      setRemindOpen(false)
    },
    onError: (err: Error) => {
      toast.error("تعذّر إرسال التذكير", { description: err.message })
      setRemindOpen(false)
    },
  })

  const dismissMutation = useMutation({
    mutationFn: (dismissed: boolean) =>
      adminFetch(`/admin/abandoned-carts/${id}/dismiss`, {
        method: "POST",
        body: { dismissed },
      }),
    onSuccess: async (_res, dismissed) => {
      await refresh()
      toast.success(dismissed ? "تم استبعاد السلة" : "تم إلغاء الاستبعاد")
    },
    onError: (err: Error) => {
      toast.error("تعذّر تحديث حالة الاستبعاد", { description: err.message })
    },
  })

  const cart = data?.cart
  const currency = cart?.currency_code ?? "SAR"
  const customerName = cart?.customer
    ? [cart.customer.first_name, cart.customer.last_name]
        .filter(Boolean)
        .join(" ")
        .trim()
    : ""

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">تفاصيل السلة المهجورة</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            {cart?.email ?? id}
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/abandoned-carts">
            <Button variant="secondary" size="small">
              رجوع
            </Button>
          </Link>
          {canManage && cart && (
            <>
              <Button
                variant="secondary"
                size="small"
                disabled={!cart.email || cart.completed}
                onClick={() => setRemindOpen(true)}
              >
                إرسال تذكير
              </Button>
              <Button
                variant={cart.reminder?.dismissed ? "primary" : "danger"}
                size="small"
                isLoading={dismissMutation.isPending}
                onClick={() =>
                  dismissMutation.mutate(!cart.reminder?.dismissed)
                }
              >
                {cart.reminder?.dismissed ? "إلغاء الاستبعاد" : "استبعاد"}
              </Button>
            </>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="px-6 py-8">
          <Text className="text-ui-fg-subtle">جارٍ التحميل…</Text>
        </div>
      )}

      {isError && (
        <div className="px-6 py-8">
          <Text className="text-ui-fg-error">
            تعذّر تحميل التفاصيل: {(error as Error)?.message}
          </Text>
        </div>
      )}

      {cart && (
        <>
          <div className="grid grid-cols-1 gap-x-6 gap-y-3 px-6 py-4 md:grid-cols-2">
            <Info label="البريد الإلكتروني" value={cart.email ?? "—"} />
            <Info label="العميل" value={customerName || "زائر"} />
            <Info label="العملة" value={cart.currency_code ?? "—"} />
            <Info
              label="الإجمالي"
              value={fmtMoney(cart.total, currency)}
            />
            <Info label="عدد العناصر" value={fmtNumber(cart.item_count)} />
            <Info label="آخر نشاط" value={fmtDate(cart.updated_at)} />
          </div>

          <div className="px-6 py-4">
            <Heading level="h2" className="mb-2 text-base">
              حالة التذكير
            </Heading>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <Text size="small">
                عدد التذكيرات: {fmtNumber(cart.reminder?.reminder_count ?? 0)}
              </Text>
              <Text size="small">
                آخر تذكير: {fmtDate(cart.reminder?.last_reminder_at ?? null)}
              </Text>
              <span>
                {cart.reminder?.recovered ? (
                  <Badge color="green" size="small">مُسترجعة</Badge>
                ) : cart.reminder?.dismissed ? (
                  <Badge color="grey" size="small">مُستبعدة</Badge>
                ) : (cart.reminder?.reminder_count ?? 0) > 0 ? (
                  <Badge color="blue" size="small">تم تذكيرها</Badge>
                ) : (
                  <Badge color="orange" size="small">بانتظار</Badge>
                )}
              </span>
            </div>
          </div>

          <div className="px-6 py-4">
            <Heading level="h2" className="mb-2 text-base">
              العناصر
            </Heading>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>المنتج</Table.HeaderCell>
                  <Table.HeaderCell>الكمية</Table.HeaderCell>
                  <Table.HeaderCell>السعر</Table.HeaderCell>
                  <Table.HeaderCell>الإجمالي</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {cart.items.map((item) => (
                  <Table.Row key={item.id}>
                    <Table.Cell>
                      <div className="flex items-center gap-2">
                        {item.thumbnail && (
                          <img
                            src={item.thumbnail}
                            alt=""
                            className="h-8 w-8 rounded object-cover"
                          />
                        )}
                        <span>
                          {item.title ?? "—"}
                          {item.variant_title ? ` — ${item.variant_title}` : ""}
                        </span>
                      </div>
                    </Table.Cell>
                    <Table.Cell>{fmtNumber(item.quantity)}</Table.Cell>
                    <Table.Cell>{fmtMoney(item.unit_price, currency)}</Table.Cell>
                    <Table.Cell>
                      {fmtMoney(item.unit_price * item.quantity, currency)}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        </>
      )}

      <Prompt
        open={remindOpen}
        onOpenChange={(open) => {
          if (!open) setRemindOpen(false)
        }}
      >
        <Prompt.Content>
          <Prompt.Header>
            <Prompt.Title>إرسال تذكير</Prompt.Title>
            <Prompt.Description>
              سيتم إرسال تذكير بالسلة إلى {cart?.email ?? ""}. هل تريد المتابعة؟
            </Prompt.Description>
          </Prompt.Header>
          <Prompt.Footer>
            <Prompt.Cancel>إلغاء</Prompt.Cancel>
            <Prompt.Action onClick={() => remindMutation.mutate()}>
              إرسال
            </Prompt.Action>
          </Prompt.Footer>
        </Prompt.Content>
      </Prompt>
    </Container>
  )
}

const Info = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-y-0.5">
    <Text size="small" className="text-ui-fg-subtle">
      {label}
    </Text>
    <Text size="small" weight="plus">
      {value}
    </Text>
  </div>
)

export default AbandonedCartDetailPage
