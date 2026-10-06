export default function TermsPage() {
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
            <h1 className="text-3xl md:text-4xl font-bold mb-3">الشروط والأحكام</h1>
            <p className="text-gray-200">
              نُقدّم لك هنا الإطار القانوني لاستخدامك لمتجر نيولي يمن وخدماته.
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
                { id: "accept", label: "الموافقة على الشروط" },
                { id: "defs", label: "التعاريف" },
                { id: "account", label: "الأهلية والحساب" },
                { id: "orders", label: "الطلبات وإبرام العقد" },
                { id: "pricing", label: "الأسعار ووسائل الدفع" },
                { id: "shipping", label: "الشحن والتسليم" },
                { id: "returns", label: "الإرجاع والاستبدال" },
                { id: "products", label: "المنتجات والتوفّر" },
                { id: "promos", label: "العروض والقسائم" },
                { id: "conduct", label: "مسؤولياتك والاستخدامات المحظورة" },
                { id: "ip", label: "الملكية الفكرية" },
                { id: "ugc", label: "المحتوى الذي تنشئه" },
                { id: "third", label: "خدمات وأطراف ثالثة" },
                { id: "liability", label: "حدود المسؤولية" },
                { id: "force", label: "القوة القاهرة" },
                { id: "law", label: "القانون والاختصاص" },
                { id: "changes", label: "تحديث الشروط" },
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
              باستخدامك لمتجر نيولي يمن وخدماته، فإنك تقر بقراءة هذه الشروط وفهمها والموافقة عليها. إذا لم توافق على أي بند، يرجى التوقف عن استخدام الموقع.
            </p>
          </div>

          {/* SECTIONS */}
          <article className="space-y-8">
            <section id="accept" className="rounded-2xl border p-6 md:p-7" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#270830" }}>١) الموافقة على الشروط</h3>
              <p className="text-gray-800">
                تشكل هذه الشروط اتفاقًا ملزمًا بينك وبين نيولي يمن فيما يتعلق باستخدام الموقع والخدمات. قد نطلب منك الموافقة عليها صراحةً عند إنشاء حساب أو إتمام طلب.
              </p>
            </section>

            <section id="defs" className="rounded-2xl border p-6 md:p-7" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#270830" }}>٢) التعاريف</h3>
              <p className="text-gray-800">
                “الموقع” يعني متجر نيولي يمن الإلكتروني. “العميل/أنت” يعني أي شخص يستخدم الموقع أو يقدّم طلبًا. “المنتجات” تعني السلع المعروضة للبيع عبر الموقع.
              </p>
            </section>

            <section id="account" className="rounded-2xl border p-6 md:p-7" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#270830" }}>٣) الأهلية وإنشاء الحساب</h3>
              <ul className="space-y-2 text-gray-800">
                <li>تقر بأنك بلغت السن القانونية لإبرام العقود في بلدك.</li>
                <li>تلتزم بتقديم معلومات دقيقة وتحديثها عند الضرورة.</li>
                <li>أنت مسؤول عن سرية بيانات الدخول وأي نشاط يتم عبر حسابك.</li>
              </ul>
            </section>

            <section id="orders" className="rounded-2xl border p-6 md:p-7" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#270830" }}>٤) الطلبات وإبرام العقد</h3>
              <ul className="space-y-2 text-gray-800">
                <li>يُعد تقديمك طلب شراء عرضًا لشراء المنتجات المحددة.</li>
                <li>لا يعتبر الطلب مقبولًا ولا يُبرم العقد إلا عند تأكيدنا للطلب وإرسال إشعار الشحن.</li>
                <li>نحتفظ بالحق في رفض أو إلغاء أي طلب لأسباب منها: نفاد المخزون، تسعير خاطئ، أو الاشتباه بسلوك احتيالي.</li>
              </ul>
            </section>

            <section id="pricing" className="rounded-2xl border p-6 md:p-7" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#270830" }}>٥) الأسعار ووسائل الدفع</h3>
              <ul className="space-y-2 text-gray-800">
                <li>الأسعار تُعرض بالريال السعودي (أو ما نُبيّنه في صفحة المنتج) وقد تشمل أو لا تشمل تكاليف الشحن والضرائب.</li>
                <li>نقبل وسائل دفع محددة كما تظهر أثناء الدفع. قد تتم معالجة الدفع عبر مزوّدين خارجيين موثوقين.</li>
                <li>في حال وجود خطأ واضح في السعر، يحق لنا تصحيح السعر أو إلغاء الطلب قبل الشحن.</li>
              </ul>
            </section>

            <section id="shipping" className="rounded-2xl border p-6 md:p-7" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#270830" }}>٦) الشحن والتسليم</h3>
              <ul className="space-y-2 text-gray-800">
                <li>نقوم بالشحن إلى المدن المتاحة الموضحة أثناء إتمام الطلب.</li>
                <li>أوقات التسليم تقديرية وتتأثر بشركة الشحن وعنوانك وعوامل خارجة عن إرادتنا.</li>
                <li>تصبح المسؤولية عن المنتج عليك عند استلامه وفق بوليصة الشحن.</li>
              </ul>
            </section>

            <section id="returns" className="rounded-2xl border p-6 md:p-7" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#270830" }}>٧) الإرجاع والاستبدال</h3>
              <p className="text-gray-800 mb-2">
                نوفّر سياسة إرجاع خلال مدة محددة للمنتجات المطابقة للشروط. قد تُستثنى بعض الفئات (مثل المنتجات المفتوحة أو المستهلكة).
              </p>
              <p className="text-gray-700 text-sm">
                للمزيد، راجع صفحة <a href="/returns" className="underline" style={{ color: "#1074bc" }}>سياسة الإرجاع</a> إن وجدت.
              </p>
            </section>

            <section id="products" className="rounded-2xl border p-6 md:p-7" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#270830" }}>٨) المنتجات والتوفّر</h3>
              <ul className="space-y-2 text-gray-800">
                <li>نحرص على دقة الصور والوصف، وقد تختلف الألوان تبعًا لإعدادات الشاشة أو دفعات التصنيع.</li>
                <li>توافر المنتج والسعر قابلان للتغيير دون إشعار مسبق حتى تأكيد الطلب.</li>
              </ul>
            </section>

            <section id="promos" className="rounded-2xl border p-6 md:p-7" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#270830" }}>٩) العروض والقسائم</h3>
              <ul className="space-y-2 text-gray-800">
                <li>قد تُطبق شروط إضافية على العروض والقسائم (المدة، الحد الأدنى، الاستثناءات).</li>
                <li>العروض غير قابلة للاستبدال نقدًا وقد لا تُجمع مع عروض أخرى إلا إذا أوضحنا ذلك.</li>
              </ul>
            </section>

            <section id="conduct" className="rounded-2xl border p-6 md:p-7" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#270830" }}>١٠) مسؤولياتك والاستخدامات المحظورة</h3>
              <ul className="space-y-2 text-gray-800">
                <li>الالتزام بجميع القوانين والأنظمة المعمول بها.</li>
                <li>عدم إساءة استخدام الموقع، أو محاولة اختراقه، أو جمع بيانات المستخدمين بدون إذن.</li>
                <li>عدم نشر محتوى مسيء، أو مخالف للآداب العامة، أو منتهك لحقوق الغير.</li>
              </ul>
            </section>

            <section id="ip" className="rounded-2xl border p-6 md:p-7" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#270830" }}>١١) حقوق الملكية الفكرية</h3>
              <p className="text-gray-800">
                جميع حقوق الملكية الفكرية المتعلقة بالموقع ومحتواه وعلاماته التجارية (بما في ذلك شعار نيولي) مملوكة لنيولي يمن أو مرخصة لها. لا يُسمح باستخدامها دون موافقة خطية مسبقة.
              </p>
            </section>

            <section id="ugc" className="rounded-2xl border p-6 md:p-7" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#270830" }}>١٢) المراجعات والمحتوى الذي تنشئه</h3>
              <p className="text-gray-800">
                إذا قمت بنشر مراجعات أو تعليقات، فإنك تمنحنا ترخيصًا غير حصري لاستخدامها وعرضها وتعديلها ونشرها في حدود الترويج لمنتجاتنا وخدماتنا، مع التزامنا باحترام سياستنا للخصوصية.
              </p>
            </section>

            <section id="third" className="rounded-2xl border p-6 md:p-7" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#270830" }}>١٣) روابط وخدمات الأطراف الثالثة</h3>
              <p className="text-gray-800">
                قد يتضمن الموقع روابط أو تكاملات مع مزوّدين خارجيين (الدفع، الشحن، التحليلات). لسنا مسؤولين عن سياساتهم أو ممارساتهم؛ يُنصح بمراجعة سياساتهم بشكل مستقل.
              </p>
            </section>

            <section id="liability" className="rounded-2xl border p-6 md:p-7" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#270830" }}>١٤) حدود المسؤولية وإخلاء المسؤولية</h3>
              <p className="text-gray-800">
                إلى الحد الذي يسمح به القانون، لا نتحمّل أي مسؤولية عن أية أضرار غير مباشرة أو عرضية أو تبعية ناشئة عن استخدام الموقع أو عدم القدرة على استخدامه، بما في ذلك فقدان الأرباح أو البيانات.
              </p>
            </section>

            <section id="force" className="rounded-2xl border p-6 md:p-7" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#270830" }}>١٥) القوة القاهرة</h3>
              <p className="text-gray-800">
                لسنا مسؤولين عن التأخير أو الإخفاق في الأداء نتيجة أحداث خارجة عن السيطرة المعقولة (مثل الكوارث الطبيعية، انقطاع الخدمات، النزاعات، القرارات الحكومية).
              </p>
            </section>

            <section id="law" className="rounded-2xl border p-6 md:p-7" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#270830" }}>١٦) القانون الواجب والاختصاص</h3>
              <p className="text-gray-800">
                تخضع هذه الشروط وتُفسَّر وفق قوانين الجمهورية اليمنية ما لم يُنص على غير ذلك. يُفضّل حل أي نزاع وديًا أولاً، وإن تعذر يُحال إلى الجهات القضائية المختصة.
              </p>
            </section>

            <section id="changes" className="rounded-2xl border p-6 md:p-7" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#270830" }}>١٧) تحديث الشروط</h3>
              <p className="text-gray-800">
                قد نقوم بتعديل هذه الشروط من وقت لآخر. يسري التحديث من تاريخ نشره على هذه الصفحة، مع تعديل تاريخ آخر تحديث في الأعلى.
              </p>
            </section>

            <section id="contact" className="rounded-2xl border p-6 md:p-7" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#270830" }}>١٨) تواصل معنا</h3>
              <p className="text-gray-800 mb-4">
                لأي استفسارات بخصوص هذه الشروط، تواصل معنا عبر صفحة{" "}
                <a href="/contact" className="underline" style={{ color: "#1074bc" }}>اتصل بنا</a>، وسنرد خلال مدة معقولة.
              </p>
              <div className="rounded-xl bg-[#f9f6fb] p-4 text-sm text-gray-700">
                تنبيه قانوني: الغرض من هذه الصفحة توضيحي عام، ولا تُعدّ استشارة قانونية.
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
