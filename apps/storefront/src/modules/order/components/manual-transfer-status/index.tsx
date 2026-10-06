"use client"

import {
  getOrderManualTransfer,
  reuploadOrderManualTransferProof,
  type ManualTransferSubmission,
} from "@lib/data/payment-offline"
import { Button } from "@modules/common/components/ui"
import { useCallback, useEffect, useState } from "react"

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
const MAX_SIZE = 5 * 1024 * 1024

export default function ManualTransferStatus({
  orderId,
  expected = false,
}: {
  orderId: string
  expected?: boolean
}) {
  const [submission, setSubmission] = useState<ManualTransferSubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const result = await getOrderManualTransfer(orderId)
    setSubmission(result)
    setLoading(false)
    return result
  }, [orderId])

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const poll = async (attempt: number) => {
      const result = await load()
      if (!cancelled && !result && expected && attempt < 3) {
        timer = setTimeout(() => poll(attempt + 1), 1200)
      }
    }
    poll(0)
    return () => { cancelled = true; if (timer) clearTimeout(timer) }
  }, [expected, load])

  if (!expected && !loading && !submission) return null

  const status = submission?.status ?? "submitted"
  const styles = status === "approved"
    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
    : status === "rejected"
      ? "border-rose-200 bg-rose-50 text-rose-900"
      : "border-amber-200 bg-amber-50 text-amber-900"
  const title = status === "approved"
    ? "تم قبول التحويل البنكي"
    : status === "rejected"
      ? "يحتاج إشعار الإيداع إلى إعادة رفع"
      : "إشعار الإيداع قيد المراجعة"

  const chooseFile = (next: File | null) => {
    setError(null)
    setFile(null)
    if (!next) return
    if (!ACCEPTED.includes(next.type)) {
      setError("يُسمح فقط بملفات JPG أو PNG أو WebP أو PDF")
      return
    }
    if (next.size > MAX_SIZE) {
      setError("حجم الإشعار يجب ألا يتجاوز 5MB")
      return
    }
    setFile(next)
  }

  const reupload = async () => {
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const form = new FormData()
      form.set("order_id", orderId)
      form.set("proof", file)
      await reuploadOrderManualTransferProof(form)
      setFile(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر إعادة رفع الإشعار")
    } finally {
      setUploading(false)
    }
  }

  return (
    <section className={`rounded-2xl border p-5 shadow-sm sm:p-6 ${styles}`} dir="rtl">
      <h2 className="text-lg font-bold">{title}</h2>
      {loading && !submission ? (
        <p className="mt-2 text-sm">جاري ربط الإشعار بالطلب...</p>
      ) : submission ? (
        <div className="mt-3 space-y-2 text-sm">
          <p>البنك: <strong>{submission.bank_name}</strong></p>
          <p>الحساب: <strong dir="ltr">{submission.account_number}</strong></p>
          <p>
            المبلغ المتوقع: <strong>{submission.expected_amount.toLocaleString("en-US")} {submission.currency_code}</strong>
          </p>
          <p className="break-all">الإشعار: {submission.proof_original_name}</p>
          {status === "submitted" && (
            <p>سنبدأ تجهيز الطلب بعد مطابقة الإيداع وقبوله من الإدارة.</p>
          )}
          {status === "approved" && (
            <p>تمت مطابقة الإيداع ويمكن متابعة تجهيز الطلب.</p>
          )}
          {status === "rejected" && (
            <div className="mt-4 rounded-xl bg-white/70 p-4">
              <p className="font-bold">سبب الرفض:</p>
              <p className="mt-1">{submission.rejection_reason}</p>
              <label className="mt-4 block font-bold">ارفع إشعارًا جديدًا</label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
                className="mt-2 block w-full rounded-lg border bg-white p-2"
              />
              <Button
                type="button"
                className="mt-3 bg-[#67285A] text-white"
                disabled={!file || uploading}
                isLoading={uploading}
                onClick={reupload}
              >
                إعادة رفع الإشعار
              </Button>
            </div>
          )}
        </div>
      ) : (
        <p className="mt-2 text-sm">لم يكتمل ربط إشعار الإيداع. حدّث الصفحة بعد لحظات.</p>
      )}
      {error && <p className="mt-3 rounded-lg bg-white/70 p-3 text-sm text-rose-700">{error}</p>}
    </section>
  )
}
