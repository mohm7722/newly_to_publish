// src/modules/layout/templates/footer/index.tsx
import {
  MapPin,
  Clock,
  Shield,
  Truck,
  CreditCard,
  Headphones,
  MessageCircle,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Youtube,
} from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const quickLinks = [
  { name: "من نحن", href: "/about" },
  { name: "سياسة الخصوصية", href: "/privacy" },
  { name: "الشروط والأحكام", href: "/terms" },
  { name: "أسئلة شائعة", href: "/faq" },
  { name: "الاستبدال والإرجاع", href: "/returns" },
  { name: "تتبع الطلب", href: "/track" },
]

const socialLinks = [
  { icon: <Facebook className="w-5 h-5" />, href: "https://www.facebook.com/newlyy", name: "Facebook", extra: "hover:text-blue-400" },
  { icon: <Instagram className="w-5 h-5" />, href: "https://www.instagram.com/newlyye", name: "Instagram", extra: "hover:text-pink-400" },
  { icon: <Twitter className="w-5 h-5" />, href: "https://x.com/newlyye", name: "Twitter", extra: "hover:text-blue-300" },
  { icon: <Youtube className="w-5 h-5" />, href: "https://youtube.com/@newlyye", name: "Youtube", extra: "hover:text-red-400" },
]

const services = [
  { icon: <Truck className="w-5 h-5 text-green-400" />, text: "شحن مجاني للطلبات أكثر من 500 ريال" },
  { icon: <Shield className="w-5 h-5 text-blue-400" />, text: "ضمان الجودة والأصالة" },
  { icon: <CreditCard className="w-5 h-5 text-purple-400" />, text: "دفع آمن ومضمون" },
  { icon: <Headphones className="w-5 h-5 text-orange-400" />, text: "دعم فني 24/7" },
]

export default function Footer() {
  return (
    <footer style={{ backgroundColor: "#270830" }} className="text-white">
      <div className="max-w-container mx-auto px-4 py-12">
        {/* الأعمدة الثلاثة العلوية */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* معلومات المتجر + السوشيال */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center mb-4">
                <img
                  src="/logo-newly-wait-1.svg"
                  alt="نيولي"
                  className="h-[2.295rem] md:h-[2.6775rem] w-auto"
                />
              </div>
              <p className="text-gray-300 text-sm md:text-base leading-relaxed md:leading-7 max-w-2xl">
                متجرك الإلكتروني المتكامل لأحدث المنتجات والعروض المميزة. نقدم لك
                تجربة تسوق فريدة مع أفضل الأسعار وأسرع خدمة توصيل.
              </p>
            </div>

            {/* وسائل التواصل الاجتماعي */}
            <div>
              <h4 className="font-semibold mb-3 text-white">تابعنا على</h4>
              <div className="flex items-center space-x-3 space-x-reverse">
                {socialLinks.map((s, i) => (
                  <a
                    key={i}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all duration-300 ${s.extra}`}
                    aria-label={s.name}
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* روابط سريعة */}
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-bold text-white mb-8 relative">
                روابط سريعة
                <div className="absolute bottom-0 right-0 w-12 h-0.5 bg-gradient-to-r from-red-500 to-pink-500" />
              </h4>

              {/* الديسكتوب */}
              <ul className="space-y-2 hidden md:block">
                {quickLinks.map((l, i) => (
                  <li key={i}>
                    <LocalizedClientLink
                      href={l.href}
                      className="text-gray-300 hover:text-white text-sm transition-colors duration-300 hover:translate-x-1 inline-block"
                    >
                      {l.name}
                    </LocalizedClientLink>
                  </li>
                ))}
              </ul>

              {/* الجوال - صفوف مزدوجة */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 md:hidden">
                {quickLinks.map((l, i) => (
                  <LocalizedClientLink
                    key={i}
                    href={l.href}
                    className="text-gray-300 hover:text-white text-sm transition-colors duration-300 hover:translate-x-1 inline-block"
                  >
                    {l.name}
                  </LocalizedClientLink>
                ))}
              </div>
            </div>
          </div>

          {/* تواصل معنا */}
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-bold text-white mb-4 relative">
                تواصل معنا
                <div className="absolute bottom-0 right-0 w-12 h-0.5 bg-gradient-to-r from-red-500 to-pink-500" />
              </h4>

              {/* الديسكتوب – قابل للنقر */}
              <div className="hidden md:block space-y-3">
                <a
                  href="https://wa.me/967770900014"
                  className="flex items-center space-x-3 space-x-reverse group"
                  aria-label="واتساب"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-300 group-hover:text-white transition-colors">
                      واتساب
                    </p>
                    <p className="text-white font-medium">+967 770 900 014</p>
                  </div>
                </a>

                <a
                  href="tel:+967770900014"
                  className="flex items-center space-x-3 space-x-reverse group"
                  aria-label="هاتف"
                >
                  <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Phone className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-300 group-hover:text-white transition-colors">
                      هاتف
                    </p>
                    <p className="text-white font-medium">+967 770 900 014</p>
                  </div>
                </a>

                <a
                  href="mailto:admin@newlyye.com"
                  className="flex items-center space-x-3 space-x-reverse group"
                  aria-label="البريد الإلكتروني"
                >
                  <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center">
                    <Mail className="w-4 h-4 text-red-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-300 group-hover:text-white transition-colors">
                      البريد الإلكتروني
                    </p>
                    <p className="text-white font-medium">admin@newlyye.com</p>
                  </div>
                </a>

                <a
                  href="https://maps.google.com/?q=%D9%85%D8%AA%D8%AC%D8%B1%20%D9%86%D9%8A%D9%88%D9%84%D9%8A%20%D9%8A%D9%85%D9%86%D8%8C%20%D9%85%D9%82%D8%A7%D8%A8%D9%84%20%D8%A8%D9%86%D9%83%20%D8%A7%D9%84%D8%AA%D8%B6%D8%A7%D9%85%D9%86%D8%8C%20%D8%AC%D9%85%D8%A7%D9%84%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D9%86%D8%A7%D8%B5%D8%B1%D8%8C%20%D8%AA%D8%B9%D8%B2%D8%8C%20%D8%A7%D9%84%D9%8A%D9%85%D9%86"
                  className="flex items-center space-x-3 space-x-reverse group"
                  aria-label="العنوان"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-300 group-hover:text-white transition-colors">
                      العنوان
                    </p>
                    <p className="text-white font-medium">تعز، اليمن</p>
                  </div>
                </a>
              </div>

              {/* الجوال – صف واحد مع روابط */}
              <div className="grid grid-cols-4 gap-4 mt-4 md:hidden">
                <a
                  href="https://wa.me/967770900014"
                  className="flex flex-col items-center text-center group"
                  aria-label="واتساب"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="mt-2 text-sm text-gray-300 group-hover:text-white transition-colors">
                    واتساب
                  </span>
                </a>

                <a
                  href="tel:+967770900014"
                  className="flex flex-col items-center text-center group"
                  aria-label="هاتف"
                >
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Phone className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="mt-2 text-sm text-gray-300 group-hover:text-white transition-colors">
                    هاتف
                  </span>
                </a>

                <a
                  href="mailto:admin@newlyye.com"
                  className="flex flex-col items-center text-center group"
                  aria-label="البريد الإلكتروني"
                >
                  <div className="w-10 h-10 bg-red-500/20 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-red-400" />
                  </div>
                  <span className="mt-2 text-sm text-gray-300 group-hover:text-white transition-colors">
                    البريد الإلكتروني
                  </span>
                </a>

                <a
                  href="https://maps.google.com/?q=%D9%85%D8%AA%D8%AC%D8%B1%20%D9%86%D9%8A%D9%88%D9%84%D9%8A%20%D9%8A%D9%85%D9%86%D8%8C%20%D9%85%D9%82%D8%A7%D8%A8%D9%84%20%D8%A8%D9%86%D9%83%20%D8%A7%D9%84%D8%AA%D8%B6%D8%A7%D9%85%D9%86%D8%8C%20%D8%AC%D9%85%D8%A7%D9%84%20%D8%B9%D8%A8%D8%AF%20%D8%A7%D9%84%D9%86%D8%A7%D8%B5%D8%B1%D8%8C%20%D8%AA%D8%B9%D8%B2%D8%8C%20%D8%A7%D9%84%D9%8A%D9%85%D9%86"
                  className="flex flex-col items-center text-center group"
                  aria-label="العنوان"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="mt-2 text-sm text-gray-300 group-hover:text-white transition-colors">
                    العنوان
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* خدماتنا المميزة */}
        <div className="border-t border-white/10 mt-8 pt-8">
          {/* الديسكتوب */}
          <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {services.map((s, i) => (
              <div
                key={i}
                className="flex items-center space-x-3 space-x-reverse bg-white/5 rounded-lg p-3"
              >
                {s.icon}
                <span className="text-sm text-gray-300">{s.text}</span>
              </div>
            ))}
          </div>

          {/* الجوال - صفوف مزدوجة */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {[0, 2].map((start) => (
              <div key={start} className="grid grid-cols-2 gap-3">
                {services.slice(start, start + 2).map((s, j) => (
                  <div
                    key={start + j}
                    className="flex items-center space-x-2 space-x-reverse bg-white/5 rounded-lg p-2"
                  >
                    <div className="flex-shrink-0">{s.icon}</div>
                    <span className="text-xs text-gray-300 leading-tight">{s.text}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* حقوق النشر */}
        <div className="border-t border-white/10 mt-8 pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between text-sm text-gray-400">
            <p className="mb-2 md:mb-0">
              © {new Date().getFullYear()} متجر نيولي. جميع الحقوق محفوظة
            </p>
            <div className="flex items-center space-x-4 space-x-reverse">
              <span>صُنع بـ ❤️ بواسطة نيولي</span>
              <div className="flex items-center space-x-1 space-x-reverse">
                <Clock className="w-4 h-4" />
                <span>نعمل 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
