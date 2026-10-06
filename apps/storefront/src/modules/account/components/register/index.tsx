"use client"

import { useActionState } from "react"
import Input from "@modules/common/components/input"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import { usePostAuthRedirect } from "@modules/account/hooks/use-post-auth-redirect"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { signup } from "@lib/data/customer"

 type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Register = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(signup, null)

  usePostAuthRedirect(message?.state === "success")

  return (
    <div className="flex w-full flex-col" data-testid="register-page">
      <div className="mb-6">
        <p className="text-sm font-bold text-[#B3174A]">انضم إلى نيولي</p>
        <h1 className="mt-2 text-3xl font-bold text-[#270830]">إنشاء حساب جديد</h1>
        <p className="mt-2 leading-7 text-gray-500">
          أنشئ حسابك لتتبع الطلبات وحفظ بياناتك والاستمتاع بتجربة أسرع.
        </p>
      </div>

      {message?.state === "verification_required" && (
        <div
          className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900"
          data-testid="register-verification-message"
        >
          أرسلنا رابط تحقق إلى <bdi dir="ltr" className="font-bold">{message.email}</bdi>. يرجى تأكيد بريدك الإلكتروني، ثم سجّل الدخول.
        </div>
      )}

      <form className="flex w-full flex-col" action={formAction}>
        <div className="grid w-full gap-4 sm:grid-cols-2">
          <Input label="الاسم الأول" name="first_name" required autoComplete="given-name" data-testid="first-name-input" />
          <Input label="اسم العائلة" name="last_name" required autoComplete="family-name" data-testid="last-name-input" />
          <div className="sm:col-span-2">
            <Input label="البريد الإلكتروني" name="email" required type="email" autoComplete="email" data-testid="email-input" />
          </div>
          <div className="sm:col-span-2">
            <Input label="رقم الهاتف" name="phone" type="tel" autoComplete="tel" data-testid="phone-input" />
          </div>
          <div className="sm:col-span-2">
            <Input label="كلمة المرور" name="password" required type="password" autoComplete="new-password" data-testid="password-input" />
            <p className="mt-2 text-xs text-gray-500">اختر كلمة مرور قوية لا تستخدمها في حسابات أخرى.</p>
          </div>
        </div>

        <ErrorMessage error={message?.state === "error" ? message.error : null} data-testid="register-error" />

        <p className="mt-5 text-center text-xs leading-6 text-gray-500">
          بإنشاء حساب، فإنك توافق على{" "}
          <LocalizedClientLink href="/privacy" className="font-semibold text-[#67285A] hover:underline">
            سياسة الخصوصية
          </LocalizedClientLink>{" "}
          و{" "}
          <LocalizedClientLink href="/terms" className="font-semibold text-[#67285A] hover:underline">
            الشروط والأحكام
          </LocalizedClientLink>{" "}
          الخاصة بمتجر نيولي.
        </p>

        <SubmitButton
          className="mt-5 h-12 w-full rounded-xl bg-[#67285A] text-base font-bold text-white hover:bg-[#56214c]"
          data-testid="register-button"
        >
          إنشاء الحساب
        </SubmitButton>
      </form>

      <div className="mt-6 border-t border-gray-100 pt-5 text-center text-sm text-gray-600">
        لديك حساب بالفعل؟{" "}
        <button
          type="button"
          onClick={() => setCurrentView(LOGIN_VIEW.SIGN_IN)}
          className="font-bold text-[#67285A] transition hover:text-[#B3174A] hover:underline"
        >
          تسجيل الدخول
        </button>
      </div>
    </div>
  )
}

export default Register
