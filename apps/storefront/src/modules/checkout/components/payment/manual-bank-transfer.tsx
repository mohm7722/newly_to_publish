"use client"

import { Radio as RadioGroupOption } from "@headlessui/react"
import { CreditCard } from "@medusajs/icons"
import { MANUAL_BANK_TRANSFER_METHOD } from "@lib/constants"
import {
  clearCartManualTransfer,
  getCartManualTransfer,
  listBankAccounts,
  uploadCartManualTransferProof,
  type ManualTransferSubmission,
  type StoreBankAccount,
} from "@lib/data/payment-offline"
import { selectCurrency } from "@lib/data/fx-actions"
import {
  FX_CURRENCY_LABELS_AR,
  FX_SUPPORTED_CURRENCIES,
  rateOf,
  useFx,
  type FxCurrency,
} from "@lib/fx/context"
import Radio from "@modules/common/components/radio"
import { Button, Text, clx } from "@modules/common/components/ui"
import { useEffect, useRef, useState } from "react"

type Props = {
  cartId: string
  selectedPaymentOptionId: string | null
  onReadyChange: (ready: boolean) => void
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
const MAX_SIZE = 5 * 1024 * 1024

const ManualBankTransfer = ({ cartId, selectedPaymentOptionId, onReadyChange }: Props) => {
  const { currency, rates, setCurrency } = useFx()
  const [accounts, setAccounts] = useState<StoreBankAccount[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState("")
  const [submission, setSubmission] = useState<ManualTransferSubmission | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const selected = selectedPaymentOptionId === MANUAL_BANK_TRANSFER_METHOD

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([listBankAccounts(currency), getCartManualTransfer(cartId)])
      .then(([nextAccounts, existing]) => {
        if (!active) return
        setAccounts(nextAccounts)
        if (existing?.currency_code === currency && existing.status === "submitted") {
          setSubmission(existing)
          setSelectedAccountId(existing.bank_account_id)
          onReadyChange(true)
        } else {
          setSubmission(null)
          setSelectedAccountId("")
          onReadyChange(false)
        }
      })
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [cartId, currency, onReadyChange])

  const resetProof = () => {
    setSubmission(null)
    setFile(null)
    onReadyChange(false)
    if (fileInput.current) fileInput.current.value = ""
  }

  const changeCurrency = async (next: FxCurrency) => {
    if (next === currency) return
    if (rateOf(next, rates) === null) {
      setError(`سعر صرف ${FX_CURRENCY_LABELS_AR[next]} غير متاح حاليًا`)
      return
    }
    setLoading(true)
    setError(null)
    try {
      await clearCartManualTransfer(cartId)
      await selectCurrency(next)
      resetProof()
      setSelectedAccountId("")
      setCurrency(next)
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذر تغيير عملة الإيداع")
    } finally {
      setLoading(false)
    }
  }

  const chooseAccount = async (accountId: string) => {
    if (accountId === selectedAccountId) return
    setError(null)
    if (submission) {
      try { await clearCartManualTransfer(cartId) }
      catch (e) {
        setError(e instanceof Error ? e.message : "تعذر تغيير الحساب")
        return
      }
    }
    resetProof()
    setSelectedAccountId(accountId)
  }

  const chooseFile = (next: File | null) => {
    setError(null)
    resetProof()
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

  const upload = async () => {
    if (!selectedAccountId || !file) {
      setError("اختر الحساب وارفق إشعار الإيداع أولًا")
      return
    }
    setUploading(true)
    setError(null)
    try {
      const form = new FormData()
      form.set("cart_id", cartId)
      form.set("bank_account_id", selectedAccountId)
      form.set("currency_code", currency)
      form.set("proof", file)
      const result = await uploadCartManualTransferProof(form)
      if (!result) throw new Error("لم يتم حفظ الإشعار")
      setSubmission(result)
      setFile(null)
      onReadyChange(true)
      if (fileInput.current) fileInput.current.value = ""
    } catch (e) {
      onReadyChange(false)
      setError(e instanceof Error ? e.message : "تعذر رفع الإشعار")
    } finally {
      setUploading(false)
    }
  }

  const header = (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Radio checked={selected} />
        <Text className="text-base-regular">التحويل البنكي</Text>
      </div>
      <CreditCard />
    </div>
  )

  return (
    <RadioGroupOption
      value={MANUAL_BANK_TRANSFER_METHOD}
      className={clx(
        "mb-3 flex cursor-pointer flex-col gap-3 rounded-2xl border border-gray-200 p-4 text-sm transition sm:px-5",
        selected && "border-[#67285A] bg-[#fcfafc] ring-2 ring-[#67285A]/10"
      )}
      data-testid="manual-bank-transfer-option"
    >
      {header}
      {selected && (
        <div className="mt-3 space-y-4" onClick={(event) => event.stopPropagation()}>
          <div className="rounded-xl bg-[#f7f3f8] p-3">
            <label className="mb-2 block font-bold text-[#270830]">عملة الإيداع</label>
            <select
              value={currency}
              disabled={loading || uploading}
              onChange={(event) => changeCurrency(event.target.value as FxCurrency)}
              className="h-11 w-full rounded-lg border border-gray-200 bg-white px-3"
            >
              {FX_SUPPORTED_CURRENCIES.map((code) => (
                <option key={code} value={code}>{FX_CURRENCY_LABELS_AR[code]}</option>
              ))}
            </select>
            <Text className="mt-2 text-xs text-ui-fg-subtle">
              تغيير العملة يمسح الحساب والإشعار السابقين لمنع عدم التطابق.
            </Text>
          </div>

          <div>
            <Text className="mb-2 font-bold text-[#270830]">اختر الحساب البنكي</Text>
            {loading ? <Text>جاري تحميل الحسابات...</Text> : accounts.length === 0 ? (
              <Text className="rounded-xl bg-amber-50 p-3 text-amber-800">
                لا توجد حسابات نشطة بعملة {FX_CURRENCY_LABELS_AR[currency]}. اختر عملة أخرى.
              </Text>
            ) : (
              <div className="space-y-2">
                {accounts.map((account) => (
                  <button
                    type="button"
                    key={account.id}
                    onClick={() => chooseAccount(account.id)}
                    className={clx(
                      "w-full rounded-xl border p-3 text-right transition",
                      selectedAccountId === account.id
                        ? "border-[#67285A] bg-[#fcfafc]"
                        : "border-gray-200 bg-white hover:border-[#67285A]/40"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <Radio checked={selectedAccountId === account.id} />
                      <span className="min-w-0">
                        <span className="block font-bold">{account.bank_name}</span>
                        <span className="block font-mono text-sm" dir="ltr">{account.account_number}</span>
                        {account.instructions && (
                          <span className="mt-1 block text-xs text-ui-fg-subtle">{account.instructions}</span>
                        )}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedAccountId && (
            <div className="rounded-xl border border-dashed border-[#67285A]/30 p-3">
              <label className="mb-2 block font-bold text-[#270830]">
                إشعار الإيداع <span className="text-rose-600">(إلزامي)</span>
              </label>
              {submission ? (
                <div className="rounded-lg bg-emerald-50 p-3 text-emerald-800">
                  <p className="font-bold">✓ تم رفع الإشعار بنجاح</p>
                  <p className="mt-1 break-all text-xs">{submission.proof_original_name}</p>
                  <p className="mt-1 text-xs">
                    المبلغ المتوقع: {submission.expected_amount.toLocaleString("en-US")} {submission.currency_code}
                  </p>
                </div>
              ) : (
                <>
                  <input
                    ref={fileInput}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                    onChange={(event) => chooseFile(event.target.files?.[0] ?? null)}
                    className="block w-full rounded-lg border border-gray-200 bg-white p-2 text-sm"
                  />
                  <Text className="mt-2 text-xs text-ui-fg-subtle">ملف واحد حتى 5MB: JPG أو PNG أو WebP أو PDF.</Text>
                  {file && <Text className="mt-2 break-all text-xs">الملف المختار: {file.name}</Text>}
                  <Button
                    type="button"
                    onClick={upload}
                    disabled={!file || uploading}
                    isLoading={uploading}
                    className="mt-3 bg-[#67285A] text-white"
                  >
                    رفع الإشعار واعتماده
                  </Button>
                </>
              )}
            </div>
          )}

          {error && <Text className="rounded-lg bg-rose-50 p-3 text-rose-700" role="alert">{error}</Text>}
          <Text className="text-xs text-ui-fg-subtle">
            سيبقى الطلب قيد مراجعة الإدارة، ولن يبدأ التجهيز إلا بعد مطابقة الإيداع وقبوله.
          </Text>
        </div>
      )}
    </RadioGroupOption>
  )
}

export default ManualBankTransfer
