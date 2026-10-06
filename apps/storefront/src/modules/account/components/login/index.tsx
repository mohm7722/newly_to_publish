"use client"

import { login } from "@lib/data/customer"
import { LOGIN_VIEW } from "@modules/account/templates/login-template"
import { usePostAuthRedirect } from "@modules/account/hooks/use-post-auth-redirect"
import ErrorMessage from "@modules/checkout/components/error-message"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import Input from "@modules/common/components/input"
import { useActionState } from "react"

 type Props = {
  setCurrentView: (view: LOGIN_VIEW) => void
}

const Login = ({ setCurrentView }: Props) => {
  const [message, formAction] = useActionState(login, null)

  usePostAuthRedirect(message?.state === "success")

  return (
    <div className="flex w-full flex-col" data-testid="login-page">
      <div className="mb-7">
        <p className="text-sm font-bold text-[#B3174A]">مرحبًا بعودتك</p>
        <h1 className="mt-2 text-3xl font-bold text-[#270830]">تسجيل الدخول</h1>
        <p className="mt-2 leading-7 text-gray-500">
          أدخل بياناتك للوصول إلى حسابك وطلباتك في نيولي.
        </p>
      </div>

      {message?.state === "verification_required" && (
        <div
          className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900"
          data-testid="login-verification-message"
        >
          أرسلنا رابط تحقق إلى <bdi dir="ltr" className="font-bold">{message.email}</bdi>. يرجى التحقق من بريدك الإلكتروني، ثم سجّل الدخول.
        </div>
      )}

      <form className="w-full" action={formAction}>
        <div className="flex w-full flex-col gap-4">
          <Input
            label="البريد الإلكتروني"
            name="email"
            type="email"
            title="أدخل بريدًا إلكترونيًا صالحًا."
            autoComplete="email"
            required
            data-testid="email-input"
          />
          <Input
            label="كلمة المرور"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            data-testid="password-input"
          />
        </div>
        <ErrorMessage
          error={message?.state === "error" ? message.error : null}
          data-testid="login-error-message"
        />
        <SubmitButton
          data-testid="sign-in-button"
          className="mt-6 h-12 w-full rounded-xl bg-[#67285A] text-base font-bold text-white hover:bg-[#56214c]"
        >
          تسجيل الدخول
        </SubmitButton>
      </form>

      <div className="mt-7 border-t border-gray-100 pt-6 text-center text-sm text-gray-600">
        ليس لديك حساب؟{" "}
        <button
          type="button"
          onClick={() => setCurrentView(LOGIN_VIEW.REGISTER)}
          className="font-bold text-[#67285A] transition hover:text-[#B3174A] hover:underline"
          data-testid="register-button"
        >
          أنشئ حسابًا جديدًا
        </button>
      </div>
    </div>
  )
}

export default Login
