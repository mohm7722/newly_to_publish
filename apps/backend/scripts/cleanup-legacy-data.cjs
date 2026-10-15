#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * cleanup-legacy-data.cjs
 * ============================================================================
 * سكربت تنظيف بيانات المتجر القديم / البيانات التجريبية الزائدة.
 * Legacy / demo data cleanup for the Newly Medusa store.
 *
 * ⚠️  هذا السكربت يعدّل قاعدة بيانات الإنتاج. خذ نسخة احتياطية أولًا:
 *        pg_dump "$DATABASE_URL" > backup_$(date +%F_%H%M).sql
 *
 * السلوك الافتراضي = معاينة فقط (dry-run) لا يغيّر أي شيء.
 * للتنفيذ الفعلي أضف العلم --apply.
 *
 * الاستخدام:
 *   node scripts/cleanup-legacy-data.cjs                 # معاينة كل الفئات
 *   node scripts/cleanup-legacy-data.cjs --apply         # تنفيذ الفئات الآمنة الافتراضية
 *   node scripts/cleanup-legacy-data.cjs --apply --all   # تنفيذ كل الفئات (يشمل الحساسة)
 *   node scripts/cleanup-legacy-data.cjs --apply --only=security,dup-stores,legacy-rows
 *   node scripts/cleanup-legacy-data.cjs --only=old-carts # معاينة فئة واحدة
 *
 * الفئات (categories):
 *   [افتراضية / default-on]
 *     security      إبطال المفاتيح السرّية (secret API keys) غير المُبطَلة
 *     legacy-rows   حذف صفوف جداول قديمة لا يستخدمها الكود (fx_rates, order_activity_log)
 *     dup-stores    حذف ناعم للمتاجر المكرّرة "Default Store" وقنواتها الفارغة
 *
 *   [اختيارية / opt-in — عبر --all أو --only]
 *     extra-keys    حذف ناعم لمفاتيح النشر (publishable) غير المستخدمة عدا المفتاح الفعّال
 *     demo-catalog  حذف ناعم لمنتجات Medusa التجريبية وتصنيفاتها
 *     demo-tax      حذف ناعم للمناطق الضريبية الأوروبية التجريبية
 *     legacy-meta   إزالة مفاتيح legacy من store.metadata (محميّة بتحقق)
 *     test-users    حذف ناعم لمستخدمي الإدارة والعملاء التجريبيين
 *     stray-geo     حذف ناعم لمناطق جغرافية عشوائية (dz, as, ad, ao)
 *     orphan-regions حذف ناعم لمناطق YER-O / YER-N الفارغة
 *     old-carts     حذف ناعم للسلال المهجورة الأقدم من 30 يومًا
 *     seed-reviews  حذف الآراء الأربعة التجريبية (البذرة)
 *
 * كل الحذف هنا "ناعم" (soft-delete: ضبط deleted_at) حيثما توفّر العمود، أي قابل
 * للتراجع، باستثناء صفوف الجداول القديمة (legacy-rows) والآراء (seed-reviews)
 * التي تُحذف فعليًا لأنها بيانات اختبار بحتة.
 * ============================================================================
 */

const fs = require("fs")
const path = require("path")

// --- pg loader (monorepo: pg is hoisted to the repo root node_modules) -------
let Client
try {
  ;({ Client } = require("pg"))
} catch (_) {
  try {
    ;({ Client } = require(path.join(__dirname, "..", "..", "..", "node_modules", "pg")))
  } catch (e) {
    console.error("تعذّر تحميل حزمة pg. شغّل السكربت من داخل مشروع يحتوي عليها.")
    process.exit(1)
  }
}

// --- CLI args ----------------------------------------------------------------
const argv = process.argv.slice(2)
const APPLY = argv.includes("--apply")
const ALL = argv.includes("--all")
const onlyArg = argv.find((a) => a.startsWith("--only="))
const skipArg = argv.find((a) => a.startsWith("--skip="))
const ONLY = onlyArg ? onlyArg.split("=")[1].split(",").map((s) => s.trim()).filter(Boolean) : null
const SKIP = skipArg ? skipArg.split("=")[1].split(",").map((s) => s.trim()).filter(Boolean) : []

const DEFAULT_ON = new Set(["security", "legacy-rows", "dup-stores"])

// --- env (DATABASE_URL) ------------------------------------------------------
function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  // fallback: parse apps/backend/.env (two levels up from scripts/)
  const envPath = path.join(__dirname, "..", ".env")
  if (fs.existsSync(envPath)) {
    const txt = fs.readFileSync(envPath, "utf8")
    const m = txt.match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/m)
    if (m) return m[1].trim().replace(/^["']|["']$/g, "")
  }
  return null
}

// --- helpers -----------------------------------------------------------------
async function tableExists(client, name) {
  const r = await client.query("select to_regclass($1) as t", [`public.${name}`])
  return r.rows[0].t !== null
}

async function columnExists(client, table, column) {
  const r = await client.query(
    `select 1 from information_schema.columns where table_schema='public' and table_name=$1 and column_name=$2`,
    [table, column]
  )
  return r.rowCount > 0
}

function section(title) {
  console.log("\n" + "─".repeat(72))
  console.log(title)
  console.log("─".repeat(72))
}

function wanted(name) {
  if (ONLY) return ONLY.includes(name)
  if (SKIP.includes(name)) return false
  if (ALL) return true
  return DEFAULT_ON.has(name)
}

// Each category reports { preview } always, and performs changes only on apply.
// Changes run inside a per-category SAVEPOINT so one failure never aborts the
// rest of the run.

async function cat_security(client, apply) {
  const preview = await client.query(
    `select id, title, redacted from api_key
      where type='secret' and revoked_at is null and deleted_at is null`
  )
  console.log(`مفاتيح سرّية غير مُبطَلة سيتم إبطالها: ${preview.rowCount}`)
  preview.rows.forEach((r) => console.log(`  - ${r.title} (${r.redacted}) [${r.id}]`))
  if (apply && preview.rowCount > 0) {
    await client.query(
      `update api_key set revoked_at = now(), revoked_by = 'legacy-cleanup', updated_at = now()
        where type='secret' and revoked_at is null and deleted_at is null`
    )
    console.log("  ✓ تم الإبطال")
  }
  return preview.rowCount
}

async function cat_legacy_rows(client, apply) {
  let total = 0
  for (const tbl of ["fx_rates", "order_activity_log"]) {
    if (!(await tableExists(client, tbl))) {
      console.log(`الجدول ${tbl}: غير موجود — تخطّي`)
      continue
    }
    const c = await client.query(`select count(*)::int n from ${tbl}`)
    const n = c.rows[0].n
    total += n
    console.log(`الجدول ${tbl}: ${n} صف سيُحذف`)
    if (apply && n > 0) {
      await client.query(`delete from ${tbl}`)
      console.log(`  ✓ حُذفت صفوف ${tbl}`)
    }
  }
  return total
}

async function cat_dup_stores(client, apply) {
  // Keep any store that carries real configuration (default region or FX meta).
  const keep = await client.query(
    `select id, name from store
      where deleted_at is null
        and (default_region_id is not null or (metadata ? 'currency_fx'))`
  )
  if (keep.rowCount === 0) {
    console.log("⚠️  لم يُعثر على متجر رئيسي واضح — تخطّي هذه الفئة لتفادي أي خطر.")
    return 0
  }
  console.log(`المتجر الرئيسي المحفوظ: ${keep.rows.map((r) => `${r.name} [${r.id}]`).join(", ")}`)

  const dups = await client.query(
    `select id, name, default_sales_channel_id
       from store
      where deleted_at is null
        and name = 'Default Store'
        and default_region_id is null
        and (metadata is null or not (metadata ? 'currency_fx'))`
  )
  console.log(`متاجر مكرّرة مرشّحة للحذف الناعم: ${dups.rowCount}`)

  let removed = 0
  for (const store of dups.rows) {
    const channelId = store.default_sales_channel_id
    let channelSafe = false
    if (channelId) {
      const prod = await client.query(
        `select count(*)::int n from product_sales_channel
          where sales_channel_id = $1 and deleted_at is null`,
        [channelId]
      )
      channelSafe = prod.rows[0].n === 0
    }
    console.log(
      `  - store ${store.id} | channel ${channelId || "—"} | قناة فارغة: ${channelSafe ? "نعم" : "لا"}`
    )
    if (!channelSafe && channelId) {
      console.log("    ⚠️  القناة ليست فارغة — تخطّي هذا المتجر احتياطًا.")
      continue
    }
    removed++
    if (apply) {
      await client.query(
        `update store set deleted_at = now(), updated_at = now() where id = $1 and deleted_at is null`,
        [store.id]
      )
      if (channelId) {
        await client.query(
          `update sales_channel set deleted_at = now(), updated_at = now() where id = $1 and deleted_at is null`,
          [channelId]
        )
      }
    }
  }
  if (apply && removed > 0) console.log(`  ✓ حُذف ناعمًا ${removed} متجر مكرّر وقنواتها الفارغة`)
  return removed
}

async function cat_extra_keys(client, apply) {
  // Keep the publishable key that the storefront actually uses. Resolve it from
  // NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY if present; otherwise fall back to any
  // key still linked to a live sales channel that has products.
  const envKey =
    process.env.STOREFRONT_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ||
    null

  // Candidate "active" keys: linked to a channel that has live products.
  const activeByChannel = await client.query(
    `select distinct a.id
       from api_key a
       join publishable_api_key_sales_channel l on l.publishable_key_id = a.id and l.deleted_at is null
       join product_sales_channel psc on psc.sales_channel_id = l.sales_channel_id and psc.deleted_at is null
      where a.type='publishable' and a.deleted_at is null and a.revoked_at is null`
  )
  const keepIds = new Set(activeByChannel.rows.map((r) => r.id))

  if (envKey) {
    const byToken = await client.query(
      `select id from api_key where type='publishable' and token = $1`,
      [envKey]
    )
    byToken.rows.forEach((r) => keepIds.add(r.id))
  }

  if (keepIds.size === 0) {
    console.log("⚠️  تعذّر تحديد المفتاح الفعّال بثقة — تخطّي هذه الفئة لتفادي كسر المتجر.")
    console.log("    مرّر المفتاح عبر NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ثم أعد التشغيل.")
    return 0
  }

  const all = await client.query(
    `select id, title, redacted from api_key
      where type='publishable' and deleted_at is null`
  )
  const toRemove = all.rows.filter((r) => !keepIds.has(r.id))
  console.log(`مفاتيح نشر محفوظة (فعّالة): ${keepIds.size}`)
  console.log(`مفاتيح نشر زائدة للحذف الناعم: ${toRemove.length}`)
  toRemove.forEach((r) => console.log(`  - ${r.title} (${r.redacted}) [${r.id}]`))
  if (apply && toRemove.length > 0) {
    await client.query(
      `update api_key set deleted_at = now(), updated_at = now() where id = any($1::text[])`,
      [toRemove.map((r) => r.id)]
    )
    console.log("  ✓ تم الحذف الناعم")
  }
  return toRemove.length
}

async function cat_demo_catalog(client, apply) {
  const productHandles = ["t-shirt", "sweatshirt", "sweatpants", "shorts"]
  const categoryHandles = ["pants", "merch", "sweatshirts", "shirts"]

  const prod = await client.query(
    `select id, title, handle from product where handle = any($1::text[]) and deleted_at is null`,
    [productHandles]
  )
  console.log(`منتجات Medusa تجريبية للحذف الناعم: ${prod.rowCount}`)
  prod.rows.forEach((r) => console.log(`  - ${r.title} (${r.handle})`))

  const cat = await client.query(
    `select id, name, handle from product_category where handle = any($1::text[]) and deleted_at is null`,
    [categoryHandles]
  )
  console.log(`تصنيفات تجريبية للحذف الناعم: ${cat.rowCount}`)
  cat.rows.forEach((r) => console.log(`  - ${r.name} (${r.handle})`))

  if (apply) {
    if (prod.rowCount > 0) {
      await client.query(
        `update product set deleted_at = now(), updated_at = now() where handle = any($1::text[]) and deleted_at is null`,
        [productHandles]
      )
    }
    if (cat.rowCount > 0) {
      await client.query(
        `update product_category set deleted_at = now(), updated_at = now() where handle = any($1::text[]) and deleted_at is null`,
        [categoryHandles]
      )
    }
    console.log("  ✓ تم الحذف الناعم")
  }
  return prod.rowCount + cat.rowCount
}

async function cat_demo_tax(client, apply) {
  const countries = ["gb", "de", "dk", "se", "fr", "es", "it"]
  const r = await client.query(
    `select id, country_code from tax_region
      where country_code = any($1::text[]) and province_code is null and deleted_at is null`,
    [countries]
  )
  console.log(`مناطق ضريبية أوروبية تجريبية للحذف الناعم: ${r.rowCount}`)
  r.rows.forEach((x) => console.log(`  - ${x.country_code}`))
  if (apply && r.rowCount > 0) {
    await client.query(
      `update tax_region set deleted_at = now(), updated_at = now()
        where country_code = any($1::text[]) and province_code is null and deleted_at is null`,
      [countries]
    )
    console.log("  ✓ تم الحذف الناعم")
  }
  return r.rowCount
}

async function cat_legacy_meta(client, apply) {
  // Strip superseded metadata keys from the kept store only. Keys that still
  // back live data (bank_accounts / cod_settings) are only stripped when their
  // dedicated module tables are populated — otherwise they are preserved.
  const stores = await client.query(
    `select id, metadata from store
      where deleted_at is null and (default_region_id is not null or (metadata ? 'currency_fx'))`
  )
  if (stores.rowCount === 0) {
    console.log("⚠️  لا يوجد متجر رئيسي — تخطّي.")
    return 0
  }

  const banksRows = (await tableExists(client, "bank_accounts"))
    ? (await client.query(`select count(*)::int n from bank_accounts`)).rows[0].n
    : 0
  const codRows = (await tableExists(client, "cod_settings"))
    ? (await client.query(`select count(*)::int n from cod_settings`)).rows[0].n
    : 0

  // Always safe to drop (fully superseded by currency_fx / module tables).
  const alwaysDrop = ["fx_logs", "fx_rates", "currency_config"]
  const condDrop = []
  if (banksRows > 0) condDrop.push("bank_accounts")
  else console.log("  ملاحظة: جدول bank_accounts فارغ — سيُبقى مفتاح bank_accounts في metadata.")
  if (codRows > 0) condDrop.push("cod_settings")
  else console.log("  ملاحظة: جدول cod_settings فارغ — سيُبقى مفتاح cod_settings في metadata.")

  const dropKeys = [...alwaysDrop, ...condDrop]
  let affected = 0
  for (const s of stores.rows) {
    const present = dropKeys.filter((k) => s.metadata && Object.prototype.hasOwnProperty.call(s.metadata, k))
    if (present.length === 0) continue
    affected++
    console.log(`  store ${s.id}: إزالة مفاتيح ${present.join(", ")}`)
    if (apply) {
      // metadata - 'k1' - 'k2' ...
      const expr = present.map((_, i) => `- $${i + 2}`).join(" ")
      await client.query(
        `update store set metadata = metadata ${expr}, updated_at = now() where id = $1`,
        [s.id, ...present]
      )
    }
  }
  if (apply && affected > 0) console.log("  ✓ تم تنظيف metadata")
  return affected
}

async function cat_test_users(client, apply) {
  const userEmails = ["admin@medusa-test.com"]
  const customerEmails = ["admin@azaam.com", "ali@gamil.com"]

  const u = await client.query(
    `select id, email from "user" where email = any($1::text[]) and deleted_at is null`,
    [userEmails]
  )
  console.log(`مستخدمو إدارة تجريبيون للحذف الناعم: ${u.rowCount}`)
  u.rows.forEach((r) => console.log(`  - ${r.email}`))

  const c = await client.query(
    `select id, email from customer where email = any($1::text[]) and deleted_at is null`,
    [customerEmails]
  )
  console.log(`عملاء تجريبيون للحذف الناعم: ${c.rowCount}`)
  c.rows.forEach((r) => console.log(`  - ${r.email}`))

  if (apply) {
    if (u.rowCount > 0) {
      await client.query(
        `update "user" set deleted_at = now(), updated_at = now() where email = any($1::text[]) and deleted_at is null`,
        [userEmails]
      )
    }
    if (c.rowCount > 0) {
      await client.query(
        `update customer set deleted_at = now(), updated_at = now() where email = any($1::text[]) and deleted_at is null`,
        [customerEmails]
      )
    }
    console.log("  ✓ تم الحذف الناعم")
  }
  return u.rowCount + c.rowCount
}

async function cat_stray_geo(client, apply) {
  // Random country geo zones that leaked into the live "south" service zone.
  const codes = ["dz", "as", "ad", "ao"]
  const r = await client.query(
    `select gz.id, gz.country_code, sz.name zone
       from geo_zone gz
       join service_zone sz on sz.id = gz.service_zone_id and sz.deleted_at is null
      where gz.country_code = any($1::text[]) and gz.deleted_at is null`,
    [codes]
  )
  console.log(`مناطق جغرافية عشوائية للحذف الناعم: ${r.rowCount}`)
  r.rows.forEach((x) => console.log(`  - ${x.country_code} في منطقة "${x.zone}"`))
  if (apply && r.rowCount > 0) {
    await client.query(
      `update geo_zone set deleted_at = now(), updated_at = now()
        where country_code = any($1::text[]) and deleted_at is null`,
      [codes]
    )
    console.log("  ✓ تم الحذف الناعم")
  }
  return r.rowCount
}

async function cat_orphan_regions(client, apply) {
  // YER-O / YER-N regions carry no countries and are not referenced by code.
  const r = await client.query(
    `select r.id, r.name
       from region r
      where r.deleted_at is null
        and r.name in ('Yemen – YER-O', 'Yemen – YER-N')
        and not exists (select 1 from region_country rc where rc.region_id = r.id)`
  )
  console.log(`مناطق YER فارغة للحذف الناعم: ${r.rowCount}`)
  r.rows.forEach((x) => console.log(`  - ${x.name} [${x.id}]`))
  if (apply && r.rowCount > 0) {
    await client.query(
      `update region set deleted_at = now(), updated_at = now() where id = any($1::text[])`,
      [r.rows.map((x) => x.id)]
    )
    console.log("  ✓ تم الحذف الناعم")
  }
  return r.rowCount
}

async function cat_old_carts(client, apply) {
  if (!(await columnExists(client, "cart", "deleted_at"))) {
    console.log("⚠️  جدول cart لا يملك عمود deleted_at — تخطّي.")
    return 0
  }
  const r = await client.query(
    `select count(*)::int n from cart
      where completed_at is null and deleted_at is null
        and updated_at < now() - interval '30 days'`
  )
  const n = r.rows[0].n
  console.log(`سلال مهجورة أقدم من 30 يومًا للحذف الناعم: ${n}`)
  if (apply && n > 0) {
    await client.query(
      `update cart set deleted_at = now(), updated_at = now()
        where completed_at is null and deleted_at is null
          and updated_at < now() - interval '30 days'`
    )
    console.log("  ✓ تم الحذف الناعم")
  }
  return n
}

async function cat_seed_reviews(client, apply) {
  if (!(await tableExists(client, "product_review"))) {
    console.log("الجدول product_review غير موجود — تخطّي.")
    return 0
  }
  // Target only the 4 seeded placeholder testimonials by their exact content.
  const seeds = [
    ["أحمد محمد", "تعز"],
    ["نورة علي", "عدن"],
    ["سالم منصور", "صنعاء"],
    ["ليان سامي", "الحديدة"],
  ]
  const names = seeds.map((s) => s[0])
  const r = await client.query(
    `select id, author_name, author_city from product_review
      where author_name = any($1::text[]) and is_featured = true and status = 'approved'`,
    [names]
  )
  // Match name+city pairs precisely to avoid deleting real reviews.
  const match = r.rows.filter((row) =>
    seeds.some(([n, city]) => row.author_name === n && row.author_city === city)
  )
  console.log(`آراء تجريبية (بذرة) للحذف الفعلي: ${match.length}`)
  match.forEach((x) => console.log(`  - ${x.author_name} / ${x.author_city}`))
  if (apply && match.length > 0) {
    await client.query(`delete from product_review where id = any($1::text[])`, [
      match.map((x) => x.id),
    ])
    console.log("  ✓ تم الحذف")
  }
  return match.length
}

const CATEGORIES = [
  ["security", cat_security, "إبطال المفاتيح السرّية غير المُبطَلة"],
  ["legacy-rows", cat_legacy_rows, "حذف صفوف الجداول القديمة (fx_rates, order_activity_log)"],
  ["dup-stores", cat_dup_stores, "حذف ناعم للمتاجر المكرّرة وقنواتها الفارغة"],
  ["extra-keys", cat_extra_keys, "حذف ناعم لمفاتيح النشر الزائدة"],
  ["demo-catalog", cat_demo_catalog, "حذف ناعم لمنتجات/تصنيفات Medusa التجريبية"],
  ["demo-tax", cat_demo_tax, "حذف ناعم للمناطق الضريبية الأوروبية التجريبية"],
  ["legacy-meta", cat_legacy_meta, "تنظيف مفاتيح legacy من store.metadata"],
  ["test-users", cat_test_users, "حذف ناعم للمستخدمين/العملاء التجريبيين"],
  ["stray-geo", cat_stray_geo, "حذف ناعم للمناطق الجغرافية العشوائية"],
  ["orphan-regions", cat_orphan_regions, "حذف ناعم لمناطق YER الفارغة"],
  ["old-carts", cat_old_carts, "حذف ناعم للسلال المهجورة (>30 يومًا)"],
  ["seed-reviews", cat_seed_reviews, "حذف الآراء التجريبية (البذرة)"],
]

async function main() {
  const dbUrl = loadDatabaseUrl()
  if (!dbUrl) {
    console.error("DATABASE_URL غير مضبوط ولم يُعثر عليه في apps/backend/.env")
    process.exit(1)
  }

  // Validate category names passed via --only/--skip.
  const known = new Set(CATEGORIES.map((c) => c[0]))
  for (const n of [...(ONLY || []), ...SKIP]) {
    if (!known.has(n)) {
      console.error(`فئة غير معروفة: ${n}`)
      console.error(`الفئات المتاحة: ${[...known].join(", ")}`)
      process.exit(1)
    }
  }

  const client = new Client({ connectionString: dbUrl })
  await client.connect()

  const dbName = (await client.query("select current_database() db")).rows[0].db
  section(`الاتصال بقاعدة البيانات: ${dbName}`)
  console.log(`الوضع: ${APPLY ? "⚠️  تنفيذ فعلي (--apply)" : "معاينة فقط (dry-run)"}`)
  console.log(
    `الفئات المختارة: ${CATEGORIES.filter((c) => wanted(c[0])).map((c) => c[0]).join(", ") || "(لا شيء)"}`
  )
  if (!APPLY) {
    console.log("لن يتم أي تغيير. أضف --apply للتنفيذ بعد مراجعة المعاينة.")
  }

  const summary = []
  // Everything runs inside one transaction. In dry-run we ROLLBACK at the end;
  // in apply we COMMIT. Each category gets a SAVEPOINT so a single failure is
  // isolated and does not abort the others.
  await client.query("begin")
  try {
    for (const [name, fn, desc] of CATEGORIES) {
      if (!wanted(name)) continue
      section(`[${name}] ${desc}`)
      await client.query("savepoint sp")
      try {
        const count = await fn(client, APPLY)
        await client.query("release savepoint sp")
        summary.push([name, count])
      } catch (e) {
        await client.query("rollback to savepoint sp")
        console.error(`  ✗ فشلت الفئة ${name}: ${e.message}`)
        summary.push([name, `خطأ: ${e.message}`])
      }
    }

    if (APPLY) {
      await client.query("commit")
      console.log("\n✓ تم تثبيت التغييرات (COMMIT).")
    } else {
      await client.query("rollback")
      console.log("\n↩︎ معاينة فقط — تم التراجع (ROLLBACK)، لم يتغيّر شيء.")
    }
  } catch (e) {
    await client.query("rollback")
    console.error(`\n✗ خطأ عام — تم التراجع الكامل: ${e.message}`)
    process.exitCode = 1
  } finally {
    await client.end()
  }

  section("الملخّص")
  summary.forEach(([n, c]) => console.log(`  ${n.padEnd(16)} : ${c}`))
  if (!APPLY) {
    console.log("\nخطوات التنفيذ المقترحة:")
    console.log("  1) خذ نسخة احتياطية:  pg_dump \"$DATABASE_URL\" > backup.sql")
    console.log("  2) نفّذ الفئات الآمنة: node scripts/cleanup-legacy-data.cjs --apply")
    console.log("  3) أو فئات محدّدة:     node scripts/cleanup-legacy-data.cjs --apply --only=demo-catalog")
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
