"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { Headphones, LockKeyhole, ShieldCheck, Truck } from "lucide-react"

import Register from "@modules/account/components/register"
import Login from "@modules/account/components/login"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export enum LOGIN_VIEW {
  SIGN_IN = "sign-in",
  REGISTER = "register",
}

const benefits = [
  { icon: Truck, text: "تابع طلباتك وشحناتك بسهولة" },
  { icon: ShieldCheck, text: "بياناتك محفوظة وتجربتك آمنة" },
  { icon: Headphones, text: "فريق نيولي جاهز لمساعدتك" },
]

const LoginTemplate = () => {
  const [currentView, setCurrentView] = useState<LOGIN_VIEW>(LOGIN_VIEW.SIGN_IN)
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect")

  const message =
    redirect === "/checkout"
      ? "يجب تسجيل الدخول أو إنشاء حساب لإكمال الطلب"
      : redirect === "/account/orders"
      ? "يجب تسجيل الدخول لعرض طلباتك وتتبعها"
      : null

  return (
    <section className="relative isolate flex min-h-[720px] items-center overflow-hidden bg-[#f8f5f8] px-4 py-8 sm:px-6 md:py-14">
      <div className="absolute right-0 top-0 -z-10 h-72 w-72 rounded-full bg-[#67285A]/5 blur-3xl" />
      <div className="absolute bottom-0 left-0 -z-10 h-72 w-72 rounded-full bg-[#B3174A]/5 blur-3xl" />

      <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-[#270830]/10 bg-white shadow-neoly-lg lg:grid-cols-[0.82fr_1.18fr]">
        <aside className="relative overflow-hidden bg-[#270830] px-6 py-8 text-white sm:px-10 lg:min-h-[650px] lg:py-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(179,23,74,0.4),transparent_36%),radial-gradient(circle_at_90%_90%,rgba(130,172,64,0.22),transparent_35%)]" />
          <div className="relative flex h-full flex-col">
            <LocalizedClientLink href="/" className="inline-flex w-fit" aria-label="العودة إلى نيولي">
              <img src="/logo-newly-wait-1.svg" alt="نيولي" className="h-11 w-auto" />
            </LocalizedClientLink>

            <div className="mt-8 lg:mt-auto lg:mb-auto">
              <p className="text-sm font-bold text-[#b9d889]">حسابك في نيولي</p>
              <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
                تجربة تسوق أسهل تبدأ من هنا
              </h2>
              <p className="mt-4 max-w-md leading-7 text-white/70">
                سجّل دخولك أو أنشئ حسابًا جديدًا لحفظ بياناتك والوصول إلى طلباتك في أي وقت.
              </p>

              <div className="mt-7 hidden space-y-4 sm:block">
                {benefits.map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3 text-sm text-white/85">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10">
                      <Icon className="h-4 w-4 text-[#b9d889]" aria-hidden="true" />
                    </span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div className="flex items-center justify-center px-5 py-8 sm:px-10 sm:py-12 lg:px-14">
          <div className="w-full max-w-md">
            {message && (
              <div
                className="mb-6 flex items-start gap-3 rounded-2xl border border-[#67285A]/15 bg-[#f9f6fb] p-4 text-sm leading-6 text-[#270830]"
                data-testid="auth-required-message"
              >
                <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-[#67285A]" aria-hidden="true" />
                <span>{message}</span>
              </div>
            )}
            {currentView === LOGIN_VIEW.SIGN_IN ? (
              <Login setCurrentView={setCurrentView} />
            ) : (
              <Register setCurrentView={setCurrentView} />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default LoginTemplate
