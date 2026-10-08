import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChatBubbleLeftRight } from "@medusajs/icons"
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
import { adminFetch } from "../../lib/admin-fetch"
import { useMyPermissions, makeChecker } from "../../lib/use-my-permissions"
import { fmtDate } from "../../components/reports/format"

type ReviewRow = {
  id: string
  rating: number
  title: string | null
  body: string
  author_name: string
  author_city: string | null
  product_id: string | null
  is_verified: boolean
  status: "pending" | "approved" | "rejected"
  is_featured: boolean
  created_at: string | null
}

const QUERY_KEY = ["admin", "reviews"] as const

const STATUS_OPTIONS = [
  { value: "all", label: "الكل" },
  { value: "pending", label: "بانتظار المراجعة" },
  { value: "approved", label: "معتمدة" },
  { value: "rejected", label: "مرفوضة" },
]

function Stars({ value }: { value: number }) {
  return (
    <span className="text-ui-tag-orange-text" aria-label={`${value} من 5`}>
      {"★".repeat(Math.max(0, Math.min(5, value)))}
      <span className="text-ui-fg-muted">
        {"★".repeat(Math.max(0, 5 - value))}
      </span>
    </span>
  )
}

const ReviewsPage = () => {
  const queryClient = useQueryClient()
  const { data: perms } = useMyPermissions()
  const can = makeChecker(perms)
  const canManage = can("reviews:update")
  const canDelete = can("reviews:delete")

  const [status, setStatus] = useState("all")
  const [deleteTarget, setDeleteTarget] = useState<ReviewRow | null>(null)

  const queryString = useMemo(() => {
    const p = new URLSearchParams()
    if (status !== "all") p.set("status", status)
    const s = p.toString()
    return s ? `?${s}` : ""
  }, [status])

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [...QUERY_KEY, status],
    queryFn: () =>
      adminFetch<{ reviews: ReviewRow[]; count: number }>(
        `/admin/reviews${queryString}`
      ),
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: QUERY_KEY })

  const updateMutation = useMutation({
    mutationFn: (vars: {
      id: string
      status?: ReviewRow["status"]
      is_featured?: boolean
    }) =>
      adminFetch(`/admin/reviews/${vars.id}`, {
        method: "POST",
        body: { status: vars.status, is_featured: vars.is_featured },
      }),
    onSuccess: async () => {
      await refresh()
      toast.success("تم تحديث المراجعة")
    },
    onError: (err: Error) => {
      toast.error("تعذّر تحديث المراجعة", { description: err.message })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (review: ReviewRow) =>
      adminFetch(`/admin/reviews/${review.id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await refresh()
      toast.success("تم حذف المراجعة")
      setDeleteTarget(null)
    },
    onError: (err: Error) => {
      toast.error("تعذّر حذف المراجعة", { description: err.message })
      setDeleteTarget(null)
    },
  })

  const reviews = data?.reviews ?? []

  const statusBadge = (r: ReviewRow) => {
    if (r.status === "approved")
      return <Badge color="green" size="small">معتمدة</Badge>
    if (r.status === "rejected")
      return <Badge color="red" size="small">مرفوضة</Badge>
    return <Badge color="orange" size="small">بانتظار</Badge>
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h1">آراء العملاء</Heading>
          <Text className="text-ui-fg-subtle" size="small">
            اعتماد أو رفض المراجعات، وتمييز ما يظهر في الصفحة الرئيسية
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
      </div>

      {isLoading && (
        <div className="px-6 py-8">
          <Text className="text-ui-fg-subtle">جارٍ تحميل المراجعات…</Text>
        </div>
      )}

      {isError && (
        <div className="px-6 py-8">
          <Text className="text-ui-fg-error">
            تعذّر تحميل المراجعات: {(error as Error)?.message}
          </Text>
        </div>
      )}

      {!isLoading && !isError && reviews.length === 0 && (
        <div className="px-6 py-8">
          <Text className="text-ui-fg-subtle">لا توجد مراجعات مطابقة.</Text>
        </div>
      )}

      {!isLoading && !isError && reviews.length > 0 && (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>العميل</Table.HeaderCell>
              <Table.HeaderCell>التقييم</Table.HeaderCell>
              <Table.HeaderCell>المراجعة</Table.HeaderCell>
              <Table.HeaderCell>التاريخ</Table.HeaderCell>
              <Table.HeaderCell>الحالة</Table.HeaderCell>
              <Table.HeaderCell>مميّزة</Table.HeaderCell>
              <Table.HeaderCell className="text-right">الإجراءات</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {reviews.map((r) => (
              <Table.Row key={r.id}>
                <Table.Cell>
                  <div className="flex flex-col">
                    <span className="font-medium">{r.author_name}</span>
                    <span className="text-ui-fg-subtle text-xs">
                      {r.author_city ?? "—"}
                      {r.is_verified ? " · موثوق" : ""}
                    </span>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <Stars value={r.rating} />
                </Table.Cell>
                <Table.Cell>
                  <span className="line-clamp-2 max-w-sm text-sm" title={r.body}>
                    {r.body}
                  </span>
                </Table.Cell>
                <Table.Cell>{fmtDate(r.created_at)}</Table.Cell>
                <Table.Cell>{statusBadge(r)}</Table.Cell>
                <Table.Cell>
                  {r.is_featured ? (
                    <Badge color="purple" size="small">مميّزة</Badge>
                  ) : (
                    <Text className="text-ui-fg-muted" size="small">—</Text>
                  )}
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center justify-end gap-2">
                    {canManage && r.status !== "approved" && (
                      <Button
                        variant="secondary"
                        size="small"
                        isLoading={
                          updateMutation.isPending &&
                          updateMutation.variables?.id === r.id &&
                          updateMutation.variables?.status === "approved"
                        }
                        onClick={() =>
                          updateMutation.mutate({ id: r.id, status: "approved" })
                        }
                      >
                        اعتماد
                      </Button>
                    )}
                    {canManage && r.status !== "rejected" && (
                      <Button
                        variant="secondary"
                        size="small"
                        isLoading={
                          updateMutation.isPending &&
                          updateMutation.variables?.id === r.id &&
                          updateMutation.variables?.status === "rejected"
                        }
                        onClick={() =>
                          updateMutation.mutate({ id: r.id, status: "rejected" })
                        }
                      >
                        رفض
                      </Button>
                    )}
                    {canManage && (
                      <Button
                        variant="transparent"
                        size="small"
                        isLoading={
                          updateMutation.isPending &&
                          updateMutation.variables?.id === r.id &&
                          updateMutation.variables?.is_featured !== undefined
                        }
                        onClick={() =>
                          updateMutation.mutate({
                            id: r.id,
                            is_featured: !r.is_featured,
                          })
                        }
                      >
                        {r.is_featured ? "إلغاء التمييز" : "تمييز"}
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="danger"
                        size="small"
                        onClick={() => setDeleteTarget(r)}
                      >
                        حذف
                      </Button>
                    )}
                  </div>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      )}

      <Prompt
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <Prompt.Content>
          <Prompt.Header>
            <Prompt.Title>حذف المراجعة</Prompt.Title>
            <Prompt.Description>
              سيتم حذف مراجعة {deleteTarget?.author_name ?? ""}. لا يمكن التراجع من
              الواجهة. هل تريد المتابعة؟
            </Prompt.Description>
          </Prompt.Header>
          <Prompt.Footer>
            <Prompt.Cancel>إلغاء</Prompt.Cancel>
            <Prompt.Action
              onClick={() => {
                if (deleteTarget) deleteMutation.mutate(deleteTarget)
              }}
            >
              حذف
            </Prompt.Action>
          </Prompt.Footer>
        </Prompt.Content>
      </Prompt>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "آراء العملاء",
  icon: ChatBubbleLeftRight,
})

export default ReviewsPage
