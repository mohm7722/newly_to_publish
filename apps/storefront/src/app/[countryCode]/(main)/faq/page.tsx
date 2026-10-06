"use client";

import React, { useMemo, useState } from "react";

type FaqItem = {
  q: string;
  a: React.ReactNode;
  cat: string;
};

const ALL = "الكل";

const FAQS: FaqItem[] = [
  {
    q: "كيف أتابع حالة طلبي؟",
    a: (
      <>
        بمجرد شحن طلبك سنرسل لك رسالة تتبّع عبر البريد/الواتساب. يمكنك أيضًا مراجعة صفحة{" "}
        <a href="/account" className="underline" style={{ color: "#1074bc" }}>
          حسابي
        </a>{" "}
        للاطلاع على أحدث الحالة.
      </>
    ),
    cat: "الطلبات",
  },
  {
    q: "ما هي مدة التوصيل المتوقعة؟",
    a: "عادةً 1–5 أيام عمل حسب المدينة وشركة الشحن. قد تتأثر المدة بالعطل الرسمية والظروف الخارجة عن الإرادة.",
    cat: "الشحن",
  },
  {
    q: "هل أستطيع الدفع عند الاستلام؟",
    a: "نعم، الدفع عند الاستلام متاح في مدن محددة ويظهر الخيار عند إتمام الطلب إن كان متاحًا لعنوانك.",
    cat: "الدفع",
  },
  {
    q: "هل الأسعار تشمل الشحن والضرائب؟",
    a: "أسعار المنتجات تُعرض بالريال السعودي لضمان الوضوح. تكاليف الشحن تُحسب وتظهر قبل تأكيد الطلب، والضرائب تُطبّق حسب الأنظمة.",
    cat: "الأسعار",
  },
  {
    q: "كيف تتم عملية الإرجاع؟",
    a: "الإرجاع خلال 7 أيام من الاستلام إذا كان المنتج غير مطابق للوصف أو به عيب مصنعي. تواصل معنا وسنزوّدك بخطوات الإرجاع.",
    cat: "الإرجاع",
  },
  {
    q: "استلمت منتجًا تالفًا، ماذا أفعل؟",
    a: "صوّر المنتج والتغليف فورًا وتواصل معنا خلال 24–48 ساعة لنساعدك في الاستبدال أو الإرجاع حسب الحالة.",
    cat: "الإرجاع",
  },
  {
    q: "هل أحتاج إلى حساب للشراء؟",
    a: (
      <>
        ليس شرطًا، لكن إنشاء حساب يسهّل تتبّع الطلبات وحفظ العناوين. يمكنك إنشاء حساب من{" "}
        <a href="/account" className="underline" style={{ color: "#1074bc" }}>
          هنا
        </a>
        .
      </>
    ),
    cat: "الحساب",
  },
  {
    q: "هل يمكن تعديل العنوان بعد تأكيد الطلب؟",
    a: "إذا لم يتم شحن الطلب بعد، يمكننا تعديل العنوان. راسلنا بأسرع وقت عبر الدعم وسنساعدك.",
    cat: "الطلبات",
  },
  {
    q: "المنتج غير متوفر، هل سيعود للمخزون؟",
    a: "نعمل على تحديث المخزون دوريًا. إن كان المنتج مفضلًا لديك، أضفه للقائمة المفضّلة وفعّل الإشعارات إن توفرت.",
    cat: "المنتجات",
  },
  {
    q: "كيف نحمي بياناتي؟",
    a: (
      <>
        نلتزم بتطبيق تدابير أمان مناسبة. راجع{" "}
        <a href="/privacy" className="underline" style={{ color: "#1074bc" }}>
          سياسة الخصوصية
        </a>{" "}
        لمزيد من التفاصيل.
      </>
    ),
    cat: "الخصوصية",
  },
  {
    q: "ما هي طرق التواصل مع الدعم؟",
    a: "يمكنك التواصل عبر واتساب أو نموذج التواصل في صفحة اتصل بنا. فريقنا متواجد للرد خلال أوقات العمل.",
    cat: "الدعم",
  },
  {
    q: "أريد إلغاء الطلب، ماذا أفعل؟",
    a: "إذا لم يتم الشحن بعد نستطيع إلغاء الطلب وإعادة المبلغ وفق سياسة الدفع المستخدمة. تواصل معنا فورًا لإجراء اللازم.",
    cat: "الطلبات",
  },
];

export default function FaqPage() {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>(ALL);
  const [open, setOpen] = useState<number | null>(0);

  const categories = useMemo(() => {
    const set = new Set<string>([ALL]);
    FAQS.forEach((f) => set.add(f.cat));
    return Array.from(set);
  }, []);

  const normalized = (s: string) => s.toLowerCase().trim();
  const list = useMemo(() => {
    const qn = normalized(query);
    return FAQS.filter((f) => {
      const inCat = activeCat === ALL || f.cat === activeCat;
      const inSearch =
        !qn ||
        normalized(typeof f.a === "string" ? f.a : (f.a as any).props?.children?.toString?.() ?? "").includes(qn) ||
        normalized(f.q).includes(qn);
      return inCat && inSearch;
    });
  }, [query, activeCat]);

  return (
    <main dir="rtl" className="text-right">
      {/* HERO */}
      <section
        className="relative overflow-hidden text-white"
        style={{
          background:
            "radial-gradient(1200px 600px at 10% -10%, rgba(63,12,80,0.55), transparent 60%), radial-gradient(900px 500px at 95% 110%, rgba(208,30,92,0.25), transparent 60%), #270830",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 md:py-18">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">الأسئلة الشائعة</h1>
            <p className="text-gray-200">
              هنا تجد إجابات لأكثر الأسئلة تكرارًا حول الطلبات، الشحن، الدفع، الإرجاع وغيرها.
            </p>
          </div>
        </div>
      </section>

      {/* SEARCH & CATEGORIES */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-10">
          <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between mb-4">
            <div className="relative w-full md:w-1/2">
              <input
                dir="rtl"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث في الأسئلة…"
                className="w-full rounded-xl border px-4 py-3 pr-10 outline-none"
                style={{ borderColor: "rgba(39,8,48,0.15)" }}
                aria-label="بحث في الأسئلة الشائعة"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2" aria-hidden>
                🔎
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setActiveCat(c)}
                  className="rounded-xl border px-4 py-2 text-sm font-semibold transition"
                  style={{
                    borderColor: activeCat === c ? "#82ac40" : "rgba(39,8,48,0.12)",
                    backgroundColor: activeCat === c ? "rgba(130,172,64,0.15)" : "#fff",
                    color: "#270830",
                  }}
                  aria-pressed={activeCat === c}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* RESULTS COUNT */}
          <div className="text-sm text-gray-600 mb-4">
            {list.length} نتيجة
            {query ? ` للبحث عن "${query}"` : ""}
            {activeCat !== ALL ? ` ضمن فئة ${activeCat}` : ""}
          </div>

          {/* FAQ LIST */}
          <div className="divide-y rounded-2xl border" style={{ borderColor: "rgba(39,8,48,0.12)" }}>
            {list.map((f, i) => {
              const id = `faq-${i}`;
              const expanded = open === i;
              return (
                <div key={id} className="p-4 md:p-5">
                  <button
                    className="w-full flex items-center justify-between gap-4 text-right"
                    onClick={() => setOpen((o) => (o === i ? null : i))}
                    aria-expanded={expanded}
                    aria-controls={`${id}-panel`}
                  >
                    <div>
                      <div className="text-sm text-gray-500 mb-1">{f.cat}</div>
                      <h3 className="font-semibold" style={{ color: "#270830" }}>
                        {f.q}
                      </h3>
                    </div>
                    <span
                      className={`transition-transform ${expanded ? "rotate-180" : ""}`}
                      aria-hidden
                      style={{ color: "#1074bc" }}
                    >
                      ▼
                    </span>
                  </button>
                  {expanded && (
                    <div id={`${id}-panel`} className="mt-3 text-gray-800 leading-relaxed">
                      {f.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* CONTACT PROMPT */}
          <div className="mt-8 rounded-2xl p-5 md:p-6" style={{ backgroundColor: "#f9f6fb" }}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h4 className="font-bold mb-1" style={{ color: "#270830" }}>
                  لم تجد إجابتك؟
                </h4>
                <p className="text-gray-700 text-sm">
                  تواصل معنا وسيقوم فريق الدعم بمساعدتك خلال أوقات العمل.
                </p>
              </div>
              <div className="flex gap-3">
                <a
                  href="/contact"
                  className="rounded-xl px-5 py-3 font-semibold"
                  style={{ backgroundColor: "#82ac40", color: "#fff" }}
                >
                  اتصل بنا
                </a>
                <a
                  href="/privacy"
                  className="rounded-xl px-5 py-3 font-semibold border"
                  style={{ borderColor: "#270830", color: "#270830" }}
                >
                  سياسة الخصوصية
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA (brand-consistent) */}
      <section
        className="py-12 md:py-16 text-white text-center"
        style={{
          background:
            "radial-gradient(900px 500px at 0% 100%, rgba(16,116,188,0.25), transparent 60%), #270830",
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">جاهز تعود للتسوّق؟</h3>
          <a
            href="/shop"
            className="inline-flex items-center justify-center rounded-2xl px-6 py-3 font-semibold"
            style={{ backgroundColor: "#82ac40", color: "#fff" }}
          >
            ابدأ التسوّق
          </a>
        </div>
      </section>
    </main>
  );
}
