"use client"
import { createTransferRequest } from "@lib/data/orders"
import { CheckCircleMiniSolid, XCircleSolid } from "@medusajs/icons"
import { Heading, IconButton, Input, Text } from "@modules/common/components/ui"
import { useActionState } from "react"
// TODO: Re-add Toaster component when needed
import { SubmitButton } from "@modules/checkout/components/submit-button"
import { useEffect, useState } from "react"

export default function TransferRequestForm() {
  const [showSuccess, setShowSuccess] = useState(false)

  const [state, formAction] = useActionState(createTransferRequest, {
    success: false,
    error: null,
    order: null,
  })

  useEffect(() => {
    if (state.success && state.order) {
      setShowSuccess(true)
    }
  }, [state.success, state.order])

  return (
    <div className="w-full space-y-4">
      <div className="grid w-full gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,1fr)] lg:items-end">
        <div>
          <Heading level="h3" className="!text-base font-bold text-[#270830]">
            تحويل الطلبات
          </Heading>
          <p className="mt-2 text-sm leading-6 text-neutral-500">
            لا تجد طلبك في القائمة؟ أدخل رقم الطلب لربطه بحسابك.
          </p>
        </div>
        <form action={formAction} className="w-full">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <Input
              className="w-full"
              name="order_id"
              placeholder="رقم الطلب"
              aria-label="رقم الطلب"
              required
            />
            <SubmitButton
              variant="secondary"
              size="small"
              className="w-full whitespace-nowrap sm:w-auto"
            >
              طلب التحويل
            </SubmitButton>
          </div>
        </form>
      </div>
      {!state.success && state.error && (
        <Text className="rounded-xl bg-rose-50 px-4 py-3 text-right text-sm text-rose-600">
          {state.error}
        </Text>
      )}
      {showSuccess && (
        <div className="flex w-full items-start justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
          <div className="flex min-w-0 items-start gap-3">
            <CheckCircleMiniSolid className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div className="min-w-0">
              <Text className="font-semibold text-neutral-950">
                تم طلب تحويل الطلب {state.order?.id}
              </Text>
              <Text className="mt-1 break-words text-sm text-neutral-600">
                تم إرسال بريد إلكتروني بطلب التحويل إلى{" "}
                <bdi dir="ltr">{state.order?.email}</bdi>
              </Text>
            </div>
          </div>
          <IconButton
            type="button"
            className="h-fit shrink-0"
            onClick={() => setShowSuccess(false)}
            aria-label="إغلاق رسالة النجاح"
          >
            <XCircleSolid className="h-4 w-4 text-neutral-500" />
          </IconButton>
        </div>
      )}
    </div>
  )
}
