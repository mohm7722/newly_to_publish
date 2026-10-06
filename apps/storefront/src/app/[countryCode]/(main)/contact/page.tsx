import LocalizedClientLink from "@modules/common/components/localized-client-link"
import {
  ArrowLeft,
  CheckCircle2,
  CircleHelp,
  Clock3,
  Headphones,
  Mail,
  MapPin,
  MessageCircle,
  PackageSearch,
  Phone,
  RefreshCcw,
} from "lucide-react"

const contacts = [
  {
    label: "واتساب",
    value: "+967 771 234 567",
    hint: "محادثة سريعة مع فريق الدعم",
    href: "https://wa.me/967771234567",
    icon: MessageCircle,
    iconStyle: "bg-emerald-50 text-emerald-600",
  },
  {
    label: "اتصل بنا",
    value: "+967 771 234 567",
    hint: "للمساعدة المباشرة هاتفيًا",
    href: "tel:+967771234567",
    icon: Phone,
    iconStyle: "bg-blue-50 text-blue-600",
  },
  {
    label: "البريد الإلكتروني",
    value: "info@newlystore.com",
    hint: "للاستفسارات والمرفقات",
    href: "mailto:info@newlystore.com",
    icon: Mail,
    iconStyle: "bg-rose-50 text-rose-600",
  },
  {
    label: "موقعنا",
    value: "عدن، اليمن",
    hint: "عرض الموقع على الخريطة",
    href: "https://maps.google.com/?q=%D8%B9%D8%AF%D9%86%D8%8C%20%D8%A7%D9%84%D9%8A%D9%85%D9%86",
    icon: MapPin,
    iconStyle: "bg-violet-50 text-violet-600",
  },
]

const supportLinks = [
  { label: "تتبع طلبك", hint: "اعرف حالة طلبك الآن", href: "/track", icon: PackageSearch },
  { label: "الاستبدال والإرجاع", hint: "اطّلع على السياسة والخطوات", href: "/returns", icon: RefreshCcw },
  { label: "الأسئلة الشائعة", hint: "إجابات سريعة لأكثر الأسئلة", href: "/faq", icon: CircleHelp },
]

export default function ContactPage() {
  return (
    <main dir="rtl" className="overflow-hidden bg-[#fcfafc] text-right">
      <section className="relative isolate overflow-hidden bg-[#270830] text-white">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_20%,rgba(179,23,74,0.35),transparent_34%),radial-gradient(circle_at_85%_85%,rgba(130,172,64,0.22),transparent_32%)]" />
        <div className="absolute -left-16 -top-20 -z-10 h-64 w-64 rounded-full border border-white/10" />
        <div className="mx-auto grid max-w-6xl items-center gap-9 px-4 py-14 sm:px-6 md:grid-cols-[1.3fr_0.7fr] md:py-20">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur-sm">
              <Headphones className="h-4 w-4" aria-hidden="true" />
              نحن هنا لمساعدتك
            </div>
            <h1 className="text-3xl font-bold leading-tight md:text-5xl">تواصل معنا بسهولة</h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-white/75 md:text-lg">
              سواء كان استفسارك عن طلب أو دفع أو شحن أو استبدال، اختر وسيلة التواصل المناسبة وسيسعد فريق نيولي بخدمتك.
            </p>
            <a
              href="https://wa.me/967771234567"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#82ac40] px-6 py-3 font-bold text-white shadow-lg shadow-black/15 transition hover:bg-[#739a38] focus:outline-none focus:ring-2 focus:ring-white/70"
            >
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              ابدأ محادثة واتساب
            </a>
          </div>

          <div className="rounded-3xl border border-white/15 bg-white/10 p-5 shadow-2xl backdrop-blur-md md:p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                <Clock3 className="h-6 w-6 text-[#b9d889]" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm text-white/65">أوقات الدعم</p>
                <p className="mt-1 font-bold">خدمة العملاء متاحة 24/7</p>
              </div>
            </div>
            <div className="my-5 h-px bg-white/10" />
            <div className="flex items-start gap-3 text-sm leading-7 text-white/75">
              <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#b9d889]" aria-hidden="true" />
              <p>جهّز رقم طلبك عند التواصل معنا لنتمكن من مساعدتك بصورة أسرع.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
        <div className="mb-7">
          <p className="text-sm font-bold text-[#B3174A]">قنوات التواصل</p>
          <h2 className="mt-2 text-2xl font-bold text-[#270830] md:text-3xl">اختر الطريقة الأنسب لك</h2>
          <p className="mt-2 text-gray-600">اضغط على أي بطاقة للانتقال مباشرة إلى وسيلة التواصل.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {contacts.map(({ icon: Icon, iconStyle, ...contact }) => (
            <a
              key={contact.label}
              href={contact.href}
              target={contact.href.startsWith("http") ? "_blank" : undefined}
              rel={contact.href.startsWith("http") ? "noopener noreferrer" : undefined}
              aria-label={`${contact.label}: ${contact.value}`}
              className="group flex min-h-36 items-center gap-4 rounded-2xl border border-[#270830]/10 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-[#67285A]/30 hover:shadow-neoly md:p-6"
            >
              <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${iconStyle}`}>
                <Icon className="h-6 w-6" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-gray-500">{contact.label}</span>
                <span className="mt-1 block break-words text-lg font-bold text-[#270830]">{contact.value}</span>
                <span className="mt-1 block text-sm text-gray-500">{contact.hint}</span>
              </span>
              <ArrowLeft className="h-5 w-5 shrink-0 text-gray-300 transition group-hover:-translate-x-1 group-hover:text-[#67285A]" aria-hidden="true" />
            </a>
          ))}
        </div>
      </section>

      <section className="border-y border-[#270830]/5 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
          <div className="mb-7 text-center">
            <p className="text-sm font-bold text-[#B3174A]">خدمة ذاتية سريعة</p>
            <h2 className="mt-2 text-2xl font-bold text-[#270830] md:text-3xl">قد تجد ما تبحث عنه هنا</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {supportLinks.map(({ icon: Icon, ...link }) => (
              <LocalizedClientLink
                key={link.href}
                href={link.href}
                className="group rounded-2xl bg-[#f9f6fb] p-5 transition hover:bg-[#f3edf5] md:p-6"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#67285A] text-white shadow-sm">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="mt-5 flex items-center justify-between gap-3">
                  <span>
                    <span className="block font-bold text-[#270830]">{link.label}</span>
                    <span className="mt-1 block text-sm text-gray-500">{link.hint}</span>
                  </span>
                  <ArrowLeft className="h-5 w-5 text-[#67285A] transition group-hover:-translate-x-1" aria-hidden="true" />
                </span>
              </LocalizedClientLink>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
