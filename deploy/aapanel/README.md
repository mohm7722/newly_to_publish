# رفع متجر Newly على سيرفر aaPanel — دليل التشغيل

نشر متجر Medusa v2 (backend + admin) + واجهة Next.js على سيرفر واحد يُدار بلوحة
**aaPanel**، على الدومين **https://www.newlyye.com**، مع **ترحيل البيانات الحالية**
(الخيار أ: استيراد قاعدة البيانات + نقل الصور).

```
الإنترنت ──▶ Nginx (80/443, SSL)
                 ├── /                → Storefront  (Next.js  127.0.0.1:8000)
                 ├── /app             → Medusa Admin (127.0.0.1:9000)
                 └── /store /admin /auth /health /static /hooks … → Medusa API (127.0.0.1:9000)
PostgreSQL (127.0.0.1:5432) + Redis (127.0.0.1:6379)  — محلّيان، بدون وصول خارجي
PM2 يُدير العمليتين (medusa-backend + storefront)
```

> المنفذان 8000 و 9000 **داخليان فقط**. لا تفتحهما في الجدار الناري؛ Nginx وحده
> هو الواجهة العامة.

---

## 0) قبل أن تبدأ

- وجّه سجلّي DNS من النوع A لكل من `newlyye.com` و `www.newlyye.com` إلى IP السيرفر.
- ثبّت إضافات aaPanel: **Nginx**، **PostgreSQL Manager (15/16/17)**، **Redis**،
  **Node.js Version Manager (PM2)**، و **Git** (اختياري للسحب).
- ثبّت **Node v22 LTS** من مدير إصدارات Node في aaPanel (أو v20.19+).
- كل أوامر الطرفية أدناه تُنفَّذ من **aaPanel ▸ Terminal** أو عبر SSH.

مسار المشروع المعتمد في كل الإعدادات هو: **`/www/wwwroot/newly`**

---

## 1) إنشاء قاعدة البيانات (PostgreSQL Manager)

من **aaPanel ▸ Databases ▸ PgSQL** (الإصدار المثبّت: PostgreSQL 18 — يطابق مصدر
التصدير 18.4 تماماً):
1. القاعدة والمستخدم موجودان بالفعل باسم `medusa_store`. إن لم تكن موجودة أنشئها:
   - الاسم: `medusa_store`
   - المستخدم: `medusa_store`
   - كلمة مرور قوية (احتفظ بها — اعرضها من زر Password في صف القاعدة).
2. اترك الوصول عن بُعد **مُعطّلاً** (الاتصال محلي عبر `127.0.0.1`).

## 2) تفعيل Redis

ثبّت **Redis** من الـ App Store وشغّله. اتركه على `127.0.0.1:6379` بدون وصول خارجي.
إن ضبطت كلمة مرور لـ Redis، استخدم لاحقاً `redis://:PASSWORD@localhost:6379`.

## 3) إحضار الكود إلى السيرفر

ضع المستودع في `/www/wwwroot/newly`. إمّا:
- **Git:** `git clone <repo-url> /www/wwwroot/newly` ، أو
- **رفع يدوي:** ارفع المشروع (بدون `node_modules` و `.medusa` و `.next`) عبر
  مدير الملفات في aaPanel ثم فُكّ الضغط في `/www/wwwroot/newly`.

ارفع أيضاً ملف `medusa-store-export.sql` إلى `/www/wwwroot/newly/`.

إن رفعت الكود يدوياً من ويندوز، طبّع نهايات أسطر السكربتات مرة واحدة (السحب عبر
Git لا يحتاج ذلك بفضل `.gitattributes`):
```bash
cd /www/wwwroot/newly
find . -path ./node_modules -prune -o -name '*.sh' -print | xargs sed -i 's/\r$//'
```

## 4) إعداد ملفات البيئة

**الـ backend:**
```bash
cd /www/wwwroot/newly/apps/backend
cp .env.production.template .env
# ولّد ثلاثة أسرار:
openssl rand -hex 32   # ← JWT_SECRET
openssl rand -hex 32   # ← COOKIE_SECRET
openssl rand -hex 32   # ← AUTH_MFA_ENCRYPTION_KEY
nano .env              # الصق الأسرار + كلمة مرور قاعدة البيانات في DATABASE_URL
```
تأكّد داخل `.env` من:
- `DATABASE_URL=postgres://newly:<كلمة_المرور>@localhost:5432/medusa-store`
- `COOKIE_SECURE=true` و CORS على `https://www.newlyye.com`
- `FILE_BACKEND_URL=https://www.newlyye.com/static`

**الـ storefront:**
```bash
cd /www/wwwroot/newly/apps/storefront
cp .env.production.template .env.production
# القيم جاهزة (الدومين + مفتاح publishable الحالي + المنطقة ye).
# غيّر STOREFRONT_REVALIDATE_SECRET ليطابق قيمة الـ backend.
```

## 5) استيراد قاعدة البيانات (الخيار أ)

```bash
cd /www/wwwroot/newly/deploy/aapanel
sed -i 's/\r$//' *.sh fix-image-urls.sql   # ضمان نهايات أسطر LF (لو رُفعت من ويندوز)
chmod +x *.sh
export PGPASSWORD='كلمة_مرور_قاعدة_البيانات'
./import-database.sh medusa_store medusa_store /www/wwwroot/newly/medusa-store-export.sql
```
السكربت يرفض الاستيراد فوق قاعدة غير فارغة، ويزيل تلقائياً أسطر
`\restrict/\unrestrict` إن رفضها إصدار psql لديك.

## 6) نقل الصور وإصلاح روابطها

```bash
cd /www/wwwroot/newly/deploy/aapanel
./migrate-assets.sh medusa_store medusa_store
```
هذا ينسخ `apps/backend/static/*` إلى `runtime-data/uploads/`، وإثباتات التحويل
البنكي إلى `runtime-data/manual-transfer-proofs/`، ويعيد كتابة روابط الصور من
`http://localhost:9000/static/` إلى `https://www.newlyye.com/static/` داخل قاعدة
البيانات. يجب أن يُظهر التقرير `0` روابط متبقية على localhost.

## 7) البناء + الترحيل

```bash
cd /www/wwwroot/newly/deploy/aapanel
./build-and-migrate.sh
```
يُثبّت الاعتماديات، يبني الـ backend (الخادم + لوحة الأدمن)، يُشغّل الترحيلات
(لا تأثير فعلي لأن الاستيراد بنفس الإصدار — لن تُمسح أي بيانات)، ثم يبني الـ storefront.

## 8) تشغيل العمليتين عبر PM2

```bash
cd /www/wwwroot/newly
pm2 start ecosystem.config.js
pm2 save
pm2 startup    # نفّذ السطر الذي يطبعه ليعمل PM2 تلقائياً بعد إعادة التشغيل
pm2 status
```
تحقّق محلياً قبل ربط الدومين:
```bash
curl -I http://127.0.0.1:9000/health   # الـ backend
curl -I http://127.0.0.1:8000/         # الـ storefront
```

## 9) إنشاء الموقع + Reverse Proxy + SSL (من واجهة aaPanel)

1. **Website ▸ Add site**: أضف الدومينين `www.newlyye.com` و `newlyye.com`
   (نوع PHP/ثابت، سنستبدل إعداده بالبروكسي).
2. **SSL ▸ Let's Encrypt**: أصدر الشهادة للدومينين، ثم فعّل **Force HTTPS**.
3. **Config** (إعداد الموقع): افتح كتلة `server` الخاصة بالمنفذ 443، واضبط
   `client_max_body_size 25m;` ثم الصق كتل `location` من:
   `deploy/aapanel/nginx-newly.conf` (القسم **A**) مكان `location /` الافتراضية.
4. وجّه `newlyye.com` إلى `www` (في aaPanel فعّل إعادة التوجيه إلى www، أو أضف
   `return 301 https://www.newlyye.com$request_uri;` لموقع الدومين المجرّد).
5. **Nginx ▸ Reload**.

> تفاصيل اللصق والبدائل موجودة بالكامل في تعليقات `nginx-newly.conf`.

## 10) التحقق النهائي

- `https://www.newlyye.com/` ▸ تظهر الواجهة والمنتجات **مع صورها**.
- `https://www.newlyye.com/app` ▸ تفتح لوحة الأدمن وتسجّل الدخول.
- `https://www.newlyye.com/health` ▸ ترجع `OK`.
- افتح صورة منتج مباشرة: `https://www.newlyye.com/static/<اسم_ملف>` يجب أن تُحمّل.
- تحقّق أن `http://<IP>:8000` و `:9000` **غير** متاحين من الخارج.

---

## تسجيل الدخول للأدمن

بما أنك رحّلت البيانات، **مستخدمو الأدمن القدامى موجودون** (مثل `admin@newlyye.com`).
إن لم تعرف كلمة المرور، أنشئ/عدّل مستخدماً:
```bash
cd /www/wwwroot/newly/apps/backend
npx medusa user -e you@newlyye.com -p 'كلمة_مرور_قوية'
```

## التحديثات المستقبلية

```bash
cd /www/wwwroot/newly
git pull                      # أو ارفع التغييرات
./deploy/aapanel/build-and-migrate.sh
pm2 restart all --update-env
```
الصور وإثباتات التحويل محفوظة في `runtime-data/` خارج مجلد البناء، فلا تتأثر
بإعادة البناء (`run-server.sh` يعيد ربط `.medusa/server/static` بها تلقائياً).

## ملاحظات

- **الأسرار:** `apps/backend/.env` مُستثنى من git. لا ترفعه إلى المستودع.
- **النسخ الاحتياطي:** فعّل نسخ PostgreSQL الدورية من aaPanel، وانسخ مجلد
  `runtime-data/` احتياطياً دورياً.
- **البريد (اختياري):** لإرسال تذكيرات السلة المهجورة فعلياً، اضبط `SENDGRID_API_KEY`
  و `SENDGRID_FROM` في `.env`.
- **وضع العامل (توسّع لاحق):** عند نموّ الحِمل يمكن فصل عملية worker مستقلة؛
  Redis مُفعّل بالفعل لدعم ذلك.
