"use client";

// AboutPage – Newly Yemen (RTL, Tailwind)
// لا يحتاج مكتبات خارجية. يعمل مع Next.js (App أو Pages Router).

import React, { useEffect, useRef, useState } from "react";

/** عدّاد متحرك يظهر عند دخول القسم للواجهة */
function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement | null>(null);
  useEffect(() => {
    let frame = 0;
    let start: number | null = null;
    const step = (ts: number) => {
      if (start === null) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setValue(Math.floor(p * target));
      if (p < 1) frame = requestAnimationFrame(step);
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          frame = requestAnimationFrame(step);
          io.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    if (ref.current) io.observe(ref.current);
    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
    };
  }, [target, duration]);
  return { ref, value };
}

type Testimonial = { quote: string; author: string };

const testimonials: Testimonial[] = [
  { quote: "تعامل راقٍ وتوصيل سريع – أكيد بعيد التجربة.", author: "محمد س." },
  { quote: "المنتج مطابق للوصف وخدمة عملاء ممتازة.", author: "أروى ح." },
  { quote: "أسعار واضحة وخدمة ما بعد البيع فعّالة.", author: "ياسر ع." },
];

const faqs = [
  {
    q: "كيف تتم عملية الإرجاع؟",
    a: "الإرجاع خلال 7 أيام من الاستلام بحال كان المنتج غير مطابق للوصف أو به عيب مصنعي. تواصل معنا عبر واتساب وسنرشدك للخطوات.",
  },
  {
    q: "ما هي مدة التوصيل؟",
    a: "عادةً 1–5 أيام عمل حسب المدينة وشركة الشحن. ستصلك رسالة تتبع عند شحن طلبك.",
  },
  {
    q: "هل الأسعار تشمل الضريبة/الشحن؟",
    a: "أسعارنا ثابتة وواضحة لضمان الشفافية، وتُعرض بالعملة التي تختارها. تكاليف الشحن تُعرض عند إتمام الطلب حسب عنوانك.",
  },
];

export default function AboutPage() {
  // شهادات العملاء (كاروسيل بسيط)
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % testimonials.length), 5000);
    return () => clearInterval(t);
  }, []);

  // عدّادات الأرقام
  const orders = useCountUp(50000);
  const rating = useCountUp(48); // يُعرض كـ 4.8
  const products = useCountUp(2000);
  const cities = useCountUp(20);

  // أسئلة شائعة
  const [open, setOpen] = useState<number | null>(0);

  return (
    <main dir="rtl" className="min-h-screen text-right" style={{ backgroundColor: "#270830" }}>
      {/* HERO */}
      <section
        className="relative overflow-hidden text-white"
        style={{
          background:
            "radial-gradient(1200px 600px at 10% -10%, rgba(63,12,80,0.55), transparent 60%), radial-gradient(900px 500px at 95% 110%, rgba(208,30,92,0.25), transparent 60%), #270830",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-20">
          <div className="flex flex-col items-start gap-6 max-w-3xl">
            <span
              className="inline-flex items-center rounded-full px-4 py-1 text-sm"
              style={{
                backgroundColor: "rgba(16,116,188,0.15)",
                color: "#fff",
                border: "1px solid rgba(16,116,188,0.35)",
              }}
            >
              أهلاً بك في نيولي يمن
            </span>
            <h1 className="font-bold leading-tight" style={{ fontSize: "40px" }}>
              نيولي يمن – متجر واحد، ألف فرصة للتسوق الذكي
            </h1>
            <p className="text-gray-200 leading-relaxed">
              نوفّر لك منتجات مختارة بعناية وأسعار واضحة وخدمة موثوقة؛ لأن راحتك هي البداية والنهاية.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-2xl px-5 py-3 font-semibold"
                style={{ backgroundColor: "#82ac40", color: "#fff" }}
              >
                تسوّق الآن
              </a>
              <a
                href="/contact"
                className="inline-flex items-center justify-center rounded-2xl px-5 py-3 font-semibold border"
                style={{ borderColor: "#ffffff", color: "#ffffff" }}
              >
                تواصل معنا
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-12 md:py-16" style={{ backgroundColor: "#3f0c50" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl p-6 bg-white">
            <h2 className="text-xl font-bold mb-2" style={{ color: "#270830" }}>
              رسالتنا
            </h2>
            <p className="text-gray-700">
              تمكين تجربة تسوّق سهلة وآمنة مع التزام حقيقي بالجودة وخدمة ما بعد البيع.
            </p>
          </div>
          <div className="rounded-2xl p-6 bg-white">
            <h2 className="text-xl font-bold mb-2" style={{ color: "#270830" }}>
              رؤيتنا
            </h2>
            <p className="text-gray-700">أن نكون الوجهة المفضّلة للتسوق المنزلي الذكي في اليمن والمنطقة.</p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h3 className="text-2xl md:text-3xl font-bold mb-8" style={{ color: "#270830" }}>
            قيمنا الأساسية
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "المصداقية والوضوح", color: "#1074bc" },
              { title: "جودة بلا تنازل", color: "#82ac40" },
              { title: "سرعة في الخدمة", color: "#f48221" },
              { title: "دعم مستمر بعد الشراء", color: "#d01e5c" },
            ].map((v, i) => (
              <div key={i} className="rounded-2xl p-5 shadow-sm border" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
                <div
                  className="w-10 h-10 rounded-full mb-3"
                  style={{ backgroundColor: v.color, opacity: 0.2 }}
                  aria-hidden
                />
                <h4 className="font-semibold" style={{ color: "#270830" }}>
                  {v.title}
                </h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Newly */}
      <section className="py-12 md:py-16" style={{ backgroundColor: "#f9f6fb" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h3 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: "#270830" }}>
            لماذا نيولي؟
          </h3>
          <ul className="grid md:grid-cols-2 gap-3 text-gray-800">
            {[
              "أسعار واضحة وثابتة تُعرض بالعملة التي تختارها.",
              "توصيل سريع وشبكات شحن موثوقة.",
              "سياسات إرجاع مرنة وواضحة.",
              "فريق دعم يعرف احتياجك.",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1 inline-block w-2 h-2 rounded-full" style={{ backgroundColor: "#82ac40" }} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <span ref={orders.ref} className="block text-3xl md:text-4xl font-extrabold" style={{ color: "#270830" }}>
              {orders.value.toLocaleString()}+
            </span>
            <span className="text-gray-600">طلب مُنجز</span>
          </div>
          <div className="text-center">
            <span ref={rating.ref} className="block text-3xl md:text-4xl font-extrabold" style={{ color: "#270830" }}>
              {(rating.value / 10).toFixed(1)}/5
            </span>
            <span className="text-gray-600">معدل الرضا</span>
          </div>
          <div className="text-center">
            <span ref={products.ref} className="block text-3xl md:text-4xl font-extrabold" style={{ color: "#270830" }}>
              {products.value.toLocaleString()}+
            </span>
            <span className="text-gray-600">منتج متاح</span>
          </div>
          <div className="text-center">
            <span ref={cities.ref} className="block text-3xl md:text-4xl font-extrabold" style={{ color: "#270830" }}>
              {cities.value}+
            </span>
            <span className="text-gray-600">مدينة يشملها التوصيل</span>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-12 md:py-16" style={{ backgroundColor: "#3f0c50" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-8">رحلتنا</h3>
          <div className="relative border-s-2 ps-6 space-y-7" style={{ borderColor: "rgba(255,255,255,0.25)" }}>
            {[
              { y: "2019", t: "انطلقت فكرة نيولي." },
              { y: "2021", t: "تأسيس المخزن المركزي وتوسعة التشكيلة." },
              { y: "2024", t: "تحديث الهوية وتجربة المتجر." },
              { y: "2025", t: "نقلة نوعية في خدمة ما بعد البيع." },
            ].map((it, i) => (
              <div key={i} className="relative">
                <span
                  className="absolute -right-[18px] top-1 w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: "#d01e5c", boxShadow: "0 0 0 3px rgba(208,30,92,0.35)" }}
                  aria-hidden
                />
                <div className="rounded-2xl p-5 bg-white/95 backdrop-blur text-gray-800">
                  <div className="text-sm font-semibold" style={{ color: "#1074bc" }}>
                    {it.y}
                  </div>
                  <div className="font-semibold" style={{ color: "#270830" }}>
                    {it.t}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quality & Service */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid md:grid-cols-3 gap-6">
          {[
            {
              title: "ضمان الجودة",
              desc: "نفحص المنتجات قبل الشحن للتأكد من مطابقتها للوصف.",
              color: "#82ac40",
            },
            {
              title: "إرجاع سهل",
              desc: "سياسة واضحة خلال 7 أيام من الاستلام.",
              color: "#f48221",
            },
            {
              title: "دعم سريع",
              desc: "قنوات متعددة على واتساب والهاتف.",
              color: "#1074bc",
            },
          ].map((c, i) => (
            <div key={i} className="rounded-2xl p-6 border shadow-sm" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
              <div className="w-10 h-10 rounded-full mb-3" style={{ backgroundColor: c.color, opacity: 0.2 }} aria-hidden />
              <h4 className="font-semibold mb-1" style={{ color: "#270830" }}>
                {c.title}
              </h4>
              <p className="text-gray-700">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 md:py-16" style={{ backgroundColor: "#f9f6fb" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h3 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: "#270830" }}>
            آراء عملائنا
          </h3>
          <div className="relative rounded-2xl p-6 bg-white shadow-sm border" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
            <p className="text-gray-800 leading-relaxed">“{testimonials[idx].quote}”</p>
            <div className="mt-3 text-sm font-semibold" style={{ color: "#1074bc" }}>
              {testimonials[idx].author}
            </div>

            <div className="mt-5 flex justify-center gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  aria-label={`انتقال للشهادة ${i + 1}`}
                  onClick={() => setIdx(i)}
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: i === idx ? "#d01e5c" : "rgba(208,30,92,0.25)" }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        className="py-12 md:py-16 text-white text-center"
        style={{
          background:
            "radial-gradient(900px 500px at 0% 100%, rgba(16,116,188,0.25), transparent 60%), #270830",
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">جاهز تبدأ تجربة تسوّق أذكى؟</h3>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-2xl px-6 py-3 font-semibold"
            style={{ backgroundColor: "#82ac40", color: "#fff" }}
          >
            ابدأ التسوّق
          </a>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h3 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: "#270830" }}>
            أسئلة شائعة
          </h3>
          <div className="divide-y" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
            {faqs.map((f, i) => (
              <div key={i} className="py-4">
                <button
                  onClick={() => setOpen((o) => (o === i ? null : i))}
                  className="w-full flex items-center justify-between text-right"
                  aria-expanded={open === i}
                >
                  <span className="font-semibold" style={{ color: "#270830" }}>
                    {f.q}
                  </span>
                  <span
                    className={`transform transition-transform ${open === i ? "rotate-180" : ""}`}
                    aria-hidden
                    style={{ color: "#1074bc" }}
                  >
                    ▼
                  </span>
                </button>
                {open === i && <p className="mt-3 text-gray-700">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
