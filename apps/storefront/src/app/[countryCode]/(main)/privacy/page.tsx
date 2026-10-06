export default function PrivacyPage() {
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
            <h1 className="text-3xl md:text-4xl font-bold mb-3">سياسة الخصوصية</h1>
            <p className="text-gray-200">
              نحرص في نيولي يمن على حماية بياناتك الشخصية والالتزام بمعايير الأمان والشفافية.
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
                { id: "scope", label: "نطاق السياسة" },
                { id: "data", label: "البيانات التي نجمعها" },
                { id: "use", label: "كيف نستخدم بياناتك" },
                { id: "cookies", label: "ملفات تعريف الارتباط (الكوكيز)" },
                { id: "share", label: "متى نشارك بياناتك" },
                { id: "security", label: "الأمان وحماية البيانات" },
                { id: "retention", label: "مدة الاحتفاظ بالبيانات" },
                { id: "rights", label: "حقوقك وخياراتك" },
                { id: "children", label: "خصوصية الأطفال" },
                { id: "changes", label: "تحديثات السياسة" },
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

          {/* INTRO SUMMARY */}
          <div className="rounded-2xl p-6 md:p-7 mb-8 bg-[#f9f6fb]">
            <h2 className="text-lg md:text-xl font-bold mb-3" style={{ color: "#270830" }}>ملخّص سريع</h2>
            <ul className="list-disc pr-6 space-y-2 text-gray-800">
              <li>لا نبيع بياناتك الشخصية لأطراف تجارية.</li>
              <li>نستخدم المعلومات لتحسين تجربتك وإتمام طلباتك فقط.</li>
              <li>يمكنك طلب الوصول إلى بياناتك أو تصحيحها أو حذفها في أي وقت.</li>
            </ul>
          </div>

          {/* SECTIONS */}
          <article className="space-y-8">
            <section id="scope" className="rounded-2xl border p-6 md:p-7" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#270830" }}>١) نطاق السياسة</h3>
              <p className="text-gray-800">
                تنطبق هذه السياسة على موقع ومتجر نيولي يمن وخدماته الرقمية، بما في ذلك صفحات الويب والتطبيقات وخدمات ما بعد البيع.
                باستخدامك لخدماتنا فإنك توافق على بنود هذه السياسة.
              </p>
            </section>

            <section id="data" className="rounded-2xl border p-6 md:p-7" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#270830" }}>٢) البيانات التي نجمعها</h3>
              <ul className="space-y-2 text-gray-800">
                <li><span className="font-semibold">بيانات الهوية والاتصال:</span> الاسم، رقم الجوال، البريد الإلكتروني، العنوان.</li>
                <li><span className="font-semibold">بيانات الطلب والدفع:</span> المنتجات المطلوبة، طريقة الدفع، حالة الدفع (لا نخزن تفاصيل البطاقات على خوادمنا).</li>
                <li><span className="font-semibold">بيانات الاستخدام:</span> صفحات تمت زيارتها، مدة الجلسة، التفاعلات الأساسية لتحسين الأداء.</li>
                <li><span className="font-semibold">بيانات الجهاز والمتصفح:</span> نوع الجهاز، نظام التشغيل، المتصفح، عنوان IP.</li>
              </ul>
            </section>

            <section id="use" className="rounded-2xl border p-6 md:p-7" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#270830" }}>٣) كيف نستخدم بياناتك</h3>
              <ul className="space-y-2 text-gray-800">
                <li>إتمام الطلبات، الشحن، وخدمة ما بعد البيع.</li>
                <li>إدارة الحساب، الإشعارات، وتحديثات حالة الطلب.</li>
                <li>تحسين تجربة المستخدم، اختبار الميزات، وتحليل الأداء.</li>
                <li>الامتثال للمتطلبات القانونية وحماية حقوقنا وحقوق المستخدمين.</li>
              </ul>
            </section>

            <section id="cookies" className="rounded-2xl border p-6 md:p-7" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#270830" }}>٤) ملفات تعريف الارتباط (الكوكيز)</h3>
              <p className="text-gray-800 mb-3">
                نستخدم الكوكيز لتحسين الأداء وتخصيص المحتوى وقياس الفعالية. يمكنك إدارة تفضيلات الكوكيز من إعدادات المتصفح لديك.
              </p>
              <ul className="space-y-2 text-gray-800">
                <li><span className="font-semibold">كوكيز أساسية:</span> لازمة لتشغيل الموقع وإتمام الطلب.</li>
                <li><span className="font-semibold">كوكيز الأداء:</span> لفهم كيفية استخدام الموقع وتحسينه.</li>
                <li><span className="font-semibold">كوكيز التخصيص:</span> لتذكر تفضيلاتك وإعداداتك.</li>
              </ul>
            </section>

            <section id="share" className="rounded-2xl border p-6 md:p-7" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#270830" }}>٥) متى نشارك بياناتك</h3>
              <p className="text-gray-800 mb-2">قد نشارك بياناتك فقط في الحالات التالية:</p>
              <ul className="space-y-2 text-gray-800">
                <li>مع شركاء الشحن والدفع لتنفيذ طلباتك.</li>
                <li>مع مزوّدي الخدمات التقنيّة (الاستضافة، التحليلات) مع التزامهم بالسرية والحماية.</li>
                <li>عند الطلب القانوني أو لحماية حقوقنا وحقوق الآخرين.</li>
              </ul>
            </section>

            <section id="security" className="rounded-2xl border p-6 md:p-7" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#270830" }}>٦) الأمان وحماية البيانات</h3>
              <p className="text-gray-800">
                نعتمد تدابير تقنية وتنظيمية معقولة لحماية بياناتك (تشفير اتصال HTTPS، سياسات وصول محدودة، نسخ احتياطي دوري).
                رغم ذلك، لا يمكن ضمان أمان كامل بنسبة 100% عبر الإنترنت.
              </p>
            </section>

            <section id="retention" className="rounded-2xl border p-6 md:p-7" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#270830" }}>٧) مدة الاحتفاظ بالبيانات</h3>
              <p className="text-gray-800">
                نحتفظ بالبيانات للمدّة اللازمة لتحقيق الأغراض المذكورة أعلاه والامتثال للالتزامات القانونية، ثم نقوم بحذفها أو إخفاء هويتها بشكل آمن.
              </p>
            </section>

            <section id="rights" className="rounded-2xl border p-6 md:p-7" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#270830" }}>٨) حقوقك وخياراتك</h3>
              <ul className="space-y-2 text-gray-800">
                <li>طلب الوصول إلى بياناتك الشخصية أو الحصول على نسخة منها.</li>
                <li>طلب تصحيح بيانات غير دقيقة أو تحديثها.</li>
                <li>طلب حذف البيانات أو الاعتراض على معالجتها متى كان ذلك ممكنًا.</li>
                <li>إلغاء الاشتراك من الرسائل التسويقية في أي وقت.</li>
              </ul>
              <p className="text-gray-700 mt-2 text-sm">
                لممارسة حقوقك، تواصل معنا عبر صفحة{" "}
                <a href="/contact" className="underline" style={{ color: "#1074bc" }}>اتصل بنا</a>،
                وسنرد خلال مدة معقولة.
              </p>
            </section>

            <section id="children" className="rounded-2xl border p-6 md:p-7" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#270830" }}>٩) خصوصية الأطفال</h3>
              <p className="text-gray-800">
                خدماتنا موجّهة للجمهور العام ولا تستهدف الأطفال دون سن 13 عامًا. إذا ظننت أن طفلاً قد زوّدنا ببياناته،
                يُرجى التواصل معنا لحذفها فورًا.
              </p>
            </section>

            <section id="changes" className="rounded-2xl border p-6 md:p-7" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#270830" }}>١٠) تحديثات السياسة</h3>
              <p className="text-gray-800">
                قد نُحدّث هذه السياسة من وقت لآخر لتعكس تغييرات في ممارساتنا أو لأسباب قانونية. سننشر أي تحديث هنا مع تعديل تاريخ
                آخر تحديث في الأعلى.
              </p>
            </section>

            <section id="contact" className="rounded-2xl border p-6 md:p-7" style={{ borderColor: "rgba(39,8,48,0.08)" }}>
              <h3 className="text-xl font-bold mb-3" style={{ color: "#270830" }}>١١) تواصل معنا</h3>
              <p className="text-gray-800 mb-4">
                للأسئلة حول سياسة الخصوصية أو طريقة معالجة بياناتك، يُرجى التواصل معنا عبر صفحة{" "}
                <a href="/contact" className="underline" style={{ color: "#1074bc" }}>اتصل بنا</a>.
              </p>
              <div className="rounded-xl bg-[#f9f6fb] p-4 text-sm text-gray-700">
                ملاحظة: تهدف هذه الصفحة إلى التوضيح العام ولا تُعد استشارة قانونية.
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
