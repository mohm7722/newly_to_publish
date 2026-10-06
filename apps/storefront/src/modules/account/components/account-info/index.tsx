"use client"

import { Button } from "@modules/common/components/ui"
import { AlertCircle, CheckCircle2, Pencil, X } from "lucide-react"
import { useEffect } from "react"
import useToggleState from "@lib/hooks/use-toggle-state"
import { useFormStatus } from "react-dom"

type AccountInfoProps = {
  label: string
  currentInfo: string | React.ReactNode
  isSuccess?: boolean
  isError?: boolean
  errorMessage?: string
  clearState: () => void
  children?: React.ReactNode
  "data-testid"?: string
}

const AccountInfo = ({
  label,
  currentInfo,
  isSuccess,
  isError,
  clearState,
  errorMessage = "حدث خطأ، يرجى المحاولة مرة أخرى",
  children,
  "data-testid": dataTestid,
}: AccountInfoProps) => {
  const { state, close, toggle } = useToggleState()
  const { pending } = useFormStatus()

  const handleToggle = () => {
    clearState()
    toggle()
  }

  useEffect(() => {
    if (isSuccess) close()
  }, [isSuccess, close])

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6" data-testid={dataTestid}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <span className="text-sm font-bold text-[#67285A]">{label}</span>
          <div className="mt-2 break-words text-sm leading-6 text-gray-700">
            {typeof currentInfo === "string" ? (
              <span className="font-semibold" data-testid="current-info">{currentInfo || "غير مضاف"}</span>
            ) : currentInfo}
          </div>
        </div>
        {children && (
          <Button
            variant="secondary"
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border-[#67285A]/15 text-[#67285A] sm:w-auto"
            onClick={handleToggle}
            type={state ? "reset" : "button"}
            data-testid="edit-button"
            data-active={state}
          >
            {state ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            {state ? "إلغاء" : "تعديل"}
          </Button>
        )}
      </div>

      {isSuccess && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700" data-testid="success-message">
          <CheckCircle2 className="h-4 w-4" /> تم تحديث {label} بنجاح
        </div>
      )}
      {isError && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-700" data-testid="error-message">
          <AlertCircle className="h-4 w-4" /> {errorMessage}
        </div>
      )}

      {state && children && (
        <div className="mt-5 border-t border-gray-100 pt-5">
          {children}
          <div className="mt-4 flex justify-end">
            <Button
              isLoading={pending}
              className="h-11 w-full rounded-xl bg-[#67285A] text-white hover:bg-[#56214c] sm:w-auto sm:min-w-[150px]"
              type="submit"
              data-testid="save-button"
            >
              حفظ التغييرات
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AccountInfo
