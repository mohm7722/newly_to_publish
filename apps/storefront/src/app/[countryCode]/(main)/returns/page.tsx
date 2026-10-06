export default function ReturnsPage() {
  const updated = "أغسطس 2025";
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
            <h1 className="text-3xl md:text-4xl font-bold mb-3">سياسة الاستبدال والإرجاع</h1>
            <p className="text-gray-200">
              نسعى لأن تكون تجربتك خالية من المتاعب — هذه السياسة توضّح الحقوق والخطوات بوضوح.
            </p>
            <p className="text-gray-300 mt-2 text-sm">آخر تحديث: {updated}</p>
          </div>
        </div>
      </section>

      {/* CONTENT */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 md:py-14">
          {/* TOC */}
          <div className="rounded-2xl border p-5 md:p-6 mb-8" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
            <h2 className="text-xl font-bold mb-4" style={{ color: "#270830" }}>محتويات هذه الصفحة</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              {[
                { id: "scope", label: "النطاق والتعاريف" },
                { id: "window", label: "مدة الإرجاع والاستبدال" },
                { id: "conditions", label: "شروط قبول الإرجاع" },
                { id: "exclusions", label: "منتجات غير قابلة للإرجاع" },
                { id: "steps", label: "خطوات الإرجاع/الاستبدال" },
                { id: "fees", label: "الشحن والرسوم" },
                { id: "refunds", label: "طريقة ومدة الاسترداد" },
                { id: "exchange", label: "الاستبدال (مقاسات/ألوان)" },
                { id: "damaged", label: "المنتجات التالفة/الخطأ" },
                { id: "gifts", label: "الهدايا والعروض" },
                { id: "contact", label: "تواصل معنا" },
              ].map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="rounded-xl px-4 py-2 border hover:shadow-sm transition"
                  style={{ borderColor: "rgba(39,8,48,0.12)", color: "#270830" }}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          {/* INTRO NOTE */}
          <div className="rounded-2xl p-6 md:p-7 mb-8 bg-[#f9f6fb]">
            <p className="text-gray-800">
              هذه السياسة تنطبق على مشترياتك من متجر نيولي يمن عبر الموقع أو قنواتنا الرسمية. هدفنا أن تكون الإجراءات سهلة وسريعة وواضحة.
            </p>
          </div>

          {/* SECTIONS */}
          <article className="space-y-8">
            <section id="scope" className="rounded-2xl border p-6 md:p-7" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#270830" }}>١) النطاق والتعاريف</h3>
              <p className="text-gray-800">
                المقصود بـ <span className="font-semibold">الإرجاع</span> إعادة المنتج واسترداد القيمة،
                و<span className="font-semibold">الاستبدال</span> استبداله بمقاس/لون/منتج آخر حسب التوفّر.
              </p>
            </section>

            <section id="window" className="rounded-2xl border p-6 md:p-7" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#270830" }}>٢) مدة الإرجاع والاستبدال</h3>
              <ul className="space-y-2 text-gray-800">
                <li>الإرجاع أو الاستبدال خلال <span className="font-semibold">7 أيام</span> من تاريخ الاستلام.</li>
                <li>في حال وجود عيب مصنعي أو استلام منتج خاطئ، نتحمّل الشحن بالكامل.</li>
              </ul>
            </section>

            <section id="conditions" className="rounded-2xl border p-6 md:p-7" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#270830" }}>٣) شروط قبول الإرجاع</h3>
              <ul className="space-y-2 text-gray-800">
                <li>أن يكون المنتج <span className="font-semibold">بحالته الأصلية</span> وغير مستخدم.</li>
                <li>وجود <span className="font-semibold">التغليف والملصقات</span> كاملة وغير متضرّرة.</li>
                <li>إرفاق <span className="font-semibold">فاتورة الشراء</span> أو رقم الطلب.</li>
                <li>حفظ الملحقات والهدايا (إن وُجدت) مع المنتج.</li>
              </ul>
            </section>

            <section id="exclusions" className="rounded-2xl border p-6 md:p-7" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#270830" }}>٤) منتجات غير قابلة للإرجاع</h3>
              <ul className="space-y-2 text-gray-800">
                <li>المنتجات المُستهلكة أو الصحية/العناية الشخصية بعد فتحها.</li>
                <li>البطاقات/الأكواد الرقمية والبرمجيات بعد التسليم.</li>
                <li>المنتجات المُخصّصة حسب طلب العميل.</li>
                <li>أي منتج تظهر عليه آثار استخدام أو تلف.</li>
              </ul>
            </section>

            <section id="steps" className="rounded-2xl border p-6 md:p-7" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: "#270830" }}>٥) خطوات الإرجاع/الاستبدال</h3>
              <ol className="list-decimal pr-5 space-y-2 text-gray-800">
                <li>ارسِل طلبًا عبر صفحة <a href="/contact" className="underline" style={{ color: "#1074bc" }}>اتصل بنا</a> مع رقم الطلب وصور توضح الحالة (عند الحاجة).</li>
                <li>نؤكد الطلب ونزوّدك بتعليمات الشحن أو نقطة التسليم.</li>
                <li>أعد تغليف المنتج بشكل آمن لتجنّب التلف أثناء النقل.</li>
                <li>بعد الاستلام، يتم <span className="font-semibold">الفحص خلال 1–3 أيام عمل</span>.</li>
                <li>نرسل لك نتيجة الفحص ونكمل <span className="font-semibold">الاستبدال</span> أو <span className="font-semibold">الاسترداد</span>.</li>
              </ol>
            </section>

            <section id="fees" className="rounded-2xl border p-6 md:p-7" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#270830" }}>٦) الشحن والرسوم</h3>
              <ul className="space-y-2 text-gray-800">
                <li>الإرجاع/الاستبدال بسبب <span className="font-semibold">عيب أو خطأ في الطلب</span>: تتحمّله نيولي.</li>
                <li>لأسباب شخصية (مقاس/لون/تغيّر رأي): قد يتحمّل العميل رسوم الشحن.</li>
                <li>لا تُسترد رسوم الشحن الأصلية ما لم يكن الخطأ منّا.</li>
              </ul>
            </section>

            <section id="refunds" className="rounded-2xl border p-6 md:p-7" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#270830" }}>٧) طريقة ومدة الاسترداد</h3>
              <ul className="space-y-2 text-gray-800">
                <li>الاسترداد يتم إلى <span className="font-semibold">وسيلة الدفع الأصلية</span> أو رصيد متجر حسب اختيارك.</li>
                <li>قد تستغرق العملية <span className="font-semibold">3–14 يوم عمل</span> حسب البنك/مزود الدفع.</li>
                <li>في حال الاستبدال بمنتج أعلى/أقل سعرًا، يتم تحصيل/إرجاع الفارق.</li>
              </ul>
            </section>

            <section id="exchange" className="rounded-2xl border p-6 md:p-7" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#270830" }}>٨) الاستبدال (المقاسات/الألوان)</h3>
              <p className="text-gray-800">
                يتوفر الاستبدال حسب التوفّر في المخزون. إن لم يتوفر الخيار المطلوب، نقترح بديلًا مناسبًا أو استرداد المبلغ.
              </p>
            </section>

            <section id="damaged" className="rounded-2xl border p-6 md:p-7" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#270830" }}>٩) المنتجات التالفة أو الخطأ</h3>
              <p className="text-gray-800">
                إذا استلمت منتجًا تالفًا أو غير مطابق، يُرجى إرسال صور واضحة خلال <span className="font-semibold">24–48 ساعة</span> من الاستلام ليتم تعويضك أو الاستبدال فورًا.
              </p>
            </section>

            <section id="gifts" className="rounded-2xl border p-6 md:p-7" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#270830" }}>١٠) الهدايا والعروض</h3>
              <ul className="space-y-2 text-gray-800">
                <li>في حال إرجاع منتج تم ضمن عرض، قد يتأثر سعر السلة النهائي بعد خصم قيمة الهدية/الخصم.</li>
                <li>يجب إرجاع الهدايا المرفقة غير المستهلكة مع المنتج (إن وُجدت).</li>
              </ul>
            </section>

            <section id="contact" className="rounded-2xl border p-6 md:p-7" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#270830" }}>١١) تواصل معنا</h3>
              <p className="text-gray-800 mb-4">
                فريق الدعم جاهز لمساعدتك في أي وقت خلال أوقات العمل. أرسل طلبك عبر صفحة{" "}
                <a href="/contact" className="underline" style={{ color: "#1074bc" }}>اتصل بنا</a>، وسنرد خلال مدة معقولة.
              </p>
              <div className="rounded-xl bg-[#f9f6fb] p-4 text-sm text-gray-700">
                ملاحظة: هذه السياسة تهدف للتوضيح العام وقد تختلف تفاصيلها حسب المنتج وحالته.
              </div>
            </section>
          </article>
        </div>
      </section>

      {/* FINAL CTA */}
      <section
        className="py-12 md:py-16 text-white text-center"
        style={{
          background:
            "radial-gradient(900px 500px at 0% 100%, rgba(16,116,188,0.25), transparent 60%), #270830",
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">جاهز ترجع للتسوّق؟</h3>
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
