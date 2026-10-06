import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps, HttpTypes } from "@medusajs/framework/types"
import { Badge, Button, Container, Heading, Text, Textarea } from "@medusajs/ui"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { adminFetch } from "../lib/admin-fetch"
import { makeChecker, useMyPermissions } from "../lib/use-my-permissions"

type Submission = {
  id: string
  status: "submitted" | "rejected" | "approved"
  bank_name: string
  account_number: string
  currency_code: string
  expected_amount: number
  fx_rate: number
  proof_original_name: string
  proof_mime_type: string
  proof_size: number
  submitted_at: string
  reviewed_at: string | null
  reviewed_by: string | null
  rejection_reason: string | null
}

type Event = {
  id: string
  event_type: string
  actor_type: string
  actor_id: string | null
  note: string | null
  created_at: string
}

type Response = { manual_transfer: Submission; events: Event[] }

const key = (orderId: string) => ["manual-transfer", orderId]

async function fetchTransfer(orderId: string): Promise<Response | null> {
  try {
    return await adminFetch<Response>(`/admin/orders/${orderId}/manual-transfer`)
  } catch (error) {
    if ((error as { status?: number }).status === 404) return null
    throw error
  }
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-x-4">
      <Text size="small" className="text-ui-fg-subtle">{label}</Text>
      <Text size="small" weight="plus" className="text-right break-all">{value}</Text>
    </div>
  )
}

const ManualTransferOrderDetails = ({
  data: order,
}: DetailWidgetProps<HttpTypes.AdminOrder>) => {
  const client = useQueryClient()
  const { data: permissionData } = useMyPermissions()
  const can = makeChecker(permissionData)
  const canRead = can("manual_transfers.read")
  const canReview = can("manual_transfers.review")
  const [reason, setReason] = useState("")

  const query = useQuery({
    queryKey: key(order.id),
    queryFn: () => fetchTransfer(order.id),
    enabled: canRead,
    retry: false,
  })

  const approve = useMutation({
    mutationFn: () => adminFetch(`/admin/orders/${order.id}/manual-transfer/approve`, { method: "POST" }),
    onSuccess: () => client.invalidateQueries({ queryKey: key(order.id) }),
  })
  const reject = useMutation({
    mutationFn: () => adminFetch(`/admin/orders/${order.id}/manual-transfer/reject`, {
      method: "POST",
      body: { reason: reason.trim() },
    }),
    onSuccess: () => {
      setReason("")
      client.invalidateQueries({ queryKey: key(order.id) })
    },
  })

  if (!canRead || (!query.isLoading && !query.data)) return null
  const submission = query.data?.manual_transfer
  const statusLabel = submission?.status === "approved"
    ? "مقبول"
    : submission?.status === "rejected"
      ? "مرفوض - بانتظار إعادة الرفع"
      : "قيد المراجعة"

  return (
    <Container className="divide-y p-0" dir="rtl">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">مراجعة التحويل البنكي</Heading>
        {submission && <Badge size="2xsmall">{statusLabel}</Badge>}
      </div>
      <div className="px-6 py-4">
        {query.isLoading ? (
          <Text size="small" className="text-ui-fg-subtle">جاري تحميل إشعار الإيداع...</Text>
        ) : query.isError ? (
          <Text size="small" className="text-ui-fg-error">تعذر تحميل بيانات التحويل.</Text>
        ) : submission ? (
          <div className="flex flex-col gap-y-3">
            <Row label="البنك" value={submission.bank_name} />
            <Row label="رقم الحساب" value={submission.account_number} />
            <Row label="عملة الإيداع" value={submission.currency_code} />
            <Row
              label="المبلغ المتوقع"
              value={`${Number(submission.expected_amount).toLocaleString("en-US")} ${submission.currency_code}`}
            />
            <Row label="سعر الصرف المحفوظ" value={String(submission.fx_rate)} />
            <Row label="تاريخ الرفع" value={new Date(submission.submitted_at).toLocaleString("ar")} />
            <Button
              variant="secondary"
              size="small"
              onClick={() => window.open(`/admin/orders/${order.id}/manual-transfer/proof`, "_blank")}
            >
              فتح الإشعار: {submission.proof_original_name}
            </Button>

            {submission.rejection_reason && (
              <div className="rounded-md bg-ui-bg-subtle p-3">
                <Text size="small" weight="plus">سبب الرفض</Text>
                <Text size="small">{submission.rejection_reason}</Text>
              </div>
            )}

            {canReview && submission.status === "submitted" && (
              <div className="flex flex-col gap-y-3 border-t pt-4">
                <Textarea
                  placeholder="سبب الرفض (إلزامي عند الرفض)"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
                <div className="flex gap-x-2">
                  <Button
                    size="small"
                    isLoading={approve.isPending}
                    disabled={reject.isPending}
                    onClick={() => {
                      if (window.confirm("هل طابقت الإيداع وتريد قبول الدفع؟")) approve.mutate()
                    }}
                  >
                    قبول الإيداع وتسجيل الدفع
                  </Button>
                  <Button
                    variant="danger"
                    size="small"
                    isLoading={reject.isPending}
                    disabled={!reason.trim() || approve.isPending}
                    onClick={() => reject.mutate()}
                  >
                    رفض وطلب إشعار جديد
                  </Button>
                </div>
              </div>
            )}

            {(approve.isError || reject.isError) && (
              <Text size="small" className="text-ui-fg-error">
                {(approve.error || reject.error) instanceof Error
                  ? (approve.error || reject.error as Error)?.message
                  : "تعذر تنفيذ المراجعة"}
              </Text>
            )}

            {query.data?.events?.length ? (
              <div className="border-t pt-4">
                <Text size="small" weight="plus">سجل المراجعة</Text>
                <div className="mt-2 flex flex-col gap-y-2">
                  {query.data.events.map((event) => (
                    <div key={event.id} className="rounded-md bg-ui-bg-subtle p-2">
                      <Text size="xsmall" weight="plus">{event.event_type}</Text>
                      <Text size="xsmall" className="text-ui-fg-subtle">
                        {new Date(event.created_at).toLocaleString("ar")} — {event.actor_id || event.actor_type}
                      </Text>
                      {event.note && <Text size="xsmall">{event.note}</Text>}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({ zone: "order.details.after" })
export default ManualTransferOrderDetails
