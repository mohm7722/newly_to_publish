#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * cleanup-remaining-data.cjs
 * ============================================================================
 * تنظيف المرحلة الثانية: مفاتيح النشر، المفاتيح السرّية، العملاء، قنوات البيع،
 * مفاتيح legacy في metadata، والسلال المهجورة — فقط.
 *
 * ⚠️  يعدّل قاعدة بيانات الإنتاج. خذ نسخة احتياطية أولًا:
 *        pg_dump "$DATABASE_URL" > backup_$(date +%F_%H%M).sql
 *
 * السلوك الافتراضي = معاينة فقط (dry-run) لا يغيّر أي شيء.
 * للتنفيذ الفعلي أضف --apply.
 *
 * الاستخدام:
 *   node scripts/cleanup-remaining-data.cjs                 # معاينة كل الفئات
 *   node scripts/cleanup-remaining-data.cjs --apply         # تنفيذ كل الفئات الستّ
 *   node scripts/cleanup-remaining-data.cjs --apply --only=pub-keys,customers
 *   node scripts/cleanup-remaining-data.cjs --apply --skip=old-carts
 *
 * الفئات (كلها تعمل افتراضيًا):
 *   pub-keys        حذف ناعم لمفاتيح النشر (publishable) عدا المفتاح الفعّال
 *   secret-keys     حذف ناعم للمفاتيح السرّية المُبطَلة (يتخطّى غير المُبطَلة احتياطًا)
 *   customers       حذف ناعم للعملاء التجريبيين (قائمة بريد صريحة قابلة للتعديل)
 *   sales-channels  حذف ناعم لقنوات "Default Sales Channel" الفارغة والمكرّرة
 *   legacy-meta     إزالة مفاتيح legacy من store.metadata (محميّة بتحقق)
 *   old-carts       حذف ناعم للسلال المهجورة الأقدم من 30 يومًا
 *
 * كل الحذف هنا "ناعم" (soft-delete: ضبط deleted_at)، أي قابل للتراجع بتصفير
 * deleted_at. المفاتيح السرّية غير المُبطَلة وقنوات البيع المستخدمة لا تُلمس.
 *
 * ── عدّل هنا عند الحاجة ──────────────────────────────────────────────────────
 */

// العملاء التجريبيون المراد حذفهم (بالبريد). عدّل القائمة حسب حاجتك.
const TEST_CUSTOMER_EMAILS = ["admin@azaam.com", "ali@gamil.com"]

// عتبة عمر السلال المهجورة (بالأيام).
const OLD_CART_DAYS = 30
// ============================================================================

const fs = require("fs")
const path = require("path")

// --- pg loader (monorepo: pg مرفوع إلى node_modules في جذر المشروع) ----------
let Client
try {
  ;({ Client } = require("pg"))
} catch (_) {
  try {
    ;({ Client } = require(path.join(__dirname, "..", "..", "..", "node_modules", "pg")))
  } catch (e) {
    console.error("تعذّر تحميل حزمة pg.")
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

// --- env (DATABASE_URL) ------------------------------------------------------
function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
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
  return true // كل الفئات مفعّلة افتراضيًا
}

// ── 1) مفاتيح النشر ───────────────────────────────────────────────────────────
async function cat_pub_keys(client, apply) {
  const envKey =
    process.env.STOREFRONT_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ||
    null

  // محفوظ: أي مفتاح نشر مربوط بقناة فيها منتجات حيّة (يحمي مفتاحك الفعّال kk).
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
    console.log("⚠️  تعذّر تحديد المفتاح الفعّال بثقة — تخطّي لتفادي كسر المتجر.")
    console.log("    صدّر NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ثم أعد التشغيل.")
    return 0
  }

  const all = await client.query(
    `select id, title, redacted from api_key where type='publishable' and deleted_at is null`
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

// ── 2) المفاتيح السرّية ────────────────────────────────────────────────────────
async function cat_secret_keys(client, apply) {
  // غير المُبطَلة قد تكون مُستخدمة في تكامل خارجي → تُعرض وتُترك.
  const active = await client.query(
    `select id, title, redacted from api_key where type='secret' and revoked_at is null and deleted_at is null`
  )
  if (active.rowCount > 0) {
    console.log(`مفاتيح سرّية غير مُبطَلة ستُترك (قد تكون مُستخدمة): ${active.rowCount}`)
    active.rows.forEach((r) => console.log(`  • (مُبقى) ${r.title} (${r.redacted})`))
  }

  const revoked = await client.query(
    `select id, title, redacted from api_key where type='secret' and revoked_at is not null and deleted_at is null`
  )
  console.log(`مفاتيح سرّية مُبطَلة للحذف الناعم: ${revoked.rowCount}`)
  revoked.rows.forEach((r) => console.log(`  - ${r.title} (${r.redacted}) [${r.id}]`))
  if (apply && revoked.rowCount > 0) {
    await client.query(
      `update api_key set deleted_at = now(), updated_at = now() where id = any($1::text[])`,
      [revoked.rows.map((r) => r.id)]
    )
    console.log("  ✓ تم الحذف الناعم")
  }
  return revoked.rowCount
}

// ── 3) العملاء ────────────────────────────────────────────────────────────────
async function cat_customers(client, apply) {
  const r = await client.query(
    `select id, email from customer where email = any($1::text[]) and deleted_at is null`,
    [TEST_CUSTOMER_EMAILS]
  )
  console.log(`عملاء تجريبيون للحذف الناعم: ${r.rowCount}`)
  r.rows.forEach((x) => console.log(`  - ${x.email} [${x.id}]`))
  if (apply && r.rowCount > 0) {
    await client.query(
      `update customer set deleted_at = now(), updated_at = now() where email = any($1::text[]) and deleted_at is null`,
      [TEST_CUSTOMER_EMAILS]
    )
    console.log("  ✓ تم الحذف الناعم")
  }
  return r.rowCount
}

// ── 4) قنوات البيع ────────────────────────────────────────────────────────────
async function cat_sales_channels(client, apply) {
  // مرشّحة للحذف: اسمها 'Default Sales Channel'، غير مرتبطة بمنتجات حيّة،
  // وليست القناة الافتراضية لأي متجر فعّال، ولا طلبات عليها.
  const hasOrderChannelCol = await columnExists(client, "order", "sales_channel_id")

  const candidates = await client.query(
    `select sc.id, sc.name
       from sales_channel sc
      where sc.deleted_at is null
        and sc.name = 'Default Sales Channel'
        and sc.id not in (
          select default_sales_channel_id from store
           where deleted_at is null and default_sales_channel_id is not null
        )`
  )
  console.log(`قنوات "Default Sales Channel" مرشّحة: ${candidates.rowCount}`)

  const removable = []
  for (const ch of candidates.rows) {
    const prod = await client.query(
      `select count(*)::int n from product_sales_channel where sales_channel_id = $1 and deleted_at is null`,
      [ch.id]
    )
    let orders = 0
    if (hasOrderChannelCol) {
      const o = await client.query(
        `select count(*)::int n from "order" where sales_channel_id = $1`,
        [ch.id]
      )
      orders = o.rows[0].n
    }
    const safe = prod.rows[0].n === 0 && orders === 0
    console.log(`  - ${ch.id} | منتجات: ${prod.rows[0].n} | طلبات: ${orders} | ${safe ? "قابلة للحذف" : "متخطّاة"}`)
    if (safe) removable.push(ch.id)
  }

  if (apply && removable.length > 0) {
    await client.query(
      `update sales_channel set deleted_at = now(), updated_at = now() where id = any($1::text[])`,
      [removable]
    )
    console.log(`  ✓ حُذف ناعمًا ${removable.length} قناة فارغة`)
  }
  return removable.length
}

// ── 5) legacy-meta ───────────────────────────────────────────────────────────
async function cat_legacy_meta(client, apply) {
  const stores = await client.query(
    `select id, metadata from store
      where deleted_at is null and (default_region_id is not null or (metadata ? 'currency_fx'))`
  )
  if (stores.rowCount === 0) {
    console.log("⚠️  لا يوجد متجر رئيسي واضح — تخطّي.")
    return 0
  }

  const banksRows = (await tableExists(client, "bank_accounts"))
    ? (await client.query(`select count(*)::int n from bank_accounts`)).rows[0].n
    : 0
  const codRows = (await tableExists(client, "cod_settings"))
    ? (await client.query(`select count(*)::int n from cod_settings`)).rows[0].n
    : 0

  const alwaysDrop = ["fx_logs", "fx_rates", "currency_config"]
  const condDrop = []
  if (banksRows > 0) condDrop.push("bank_accounts")
  else console.log("  ملاحظة: جدول bank_accounts فارغ — سيُبقى مفتاح bank_accounts في metadata.")
  if (codRows > 0) condDrop.push("cod_settings")
  else console.log("  ملاحظة: جدول cod_settings فارغ — سيُبقى مفتاح cod_settings في metadata.")

  const dropKeys = [...alwaysDrop, ...condDrop]
  let affected = 0
  for (const s of stores.rows) {
    const present = dropKeys.filter(
      (k) => s.metadata && Object.prototype.hasOwnProperty.call(s.metadata, k)
    )
    if (present.length === 0) continue
    affected++
    console.log(`  store ${s.id}: إزالة مفاتيح ${present.join(", ")}`)
    if (apply) {
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

// ── 6) old-carts ─────────────────────────────────────────────────────────────
async function cat_old_carts(client, apply) {
  if (!(await columnExists(client, "cart", "deleted_at"))) {
    console.log("⚠️  جدول cart لا يملك عمود deleted_at — تخطّي.")
    return 0
  }
  const r = await client.query(
    `select count(*)::int n from cart
      where completed_at is null and deleted_at is null
        and updated_at < now() - ($1 || ' days')::interval`,
    [String(OLD_CART_DAYS)]
  )
  const n = r.rows[0].n
  console.log(`سلال مهجورة أقدم من ${OLD_CART_DAYS} يومًا للحذف الناعم: ${n}`)
  if (apply && n > 0) {
    await client.query(
      `update cart set deleted_at = now(), updated_at = now()
        where completed_at is null and deleted_at is null
          and updated_at < now() - ($1 || ' days')::interval`,
      [String(OLD_CART_DAYS)]
    )
    console.log("  ✓ تم الحذف الناعم")
  }
  return n
}

const CATEGORIES = [
  ["pub-keys", cat_pub_keys, "حذف ناعم لمفاتيح النشر الزائدة"],
  ["secret-keys", cat_secret_keys, "حذف ناعم للمفاتيح السرّية المُبطَلة"],
  ["customers", cat_customers, "حذف ناعم للعملاء التجريبيين"],
  ["sales-channels", cat_sales_channels, "حذف ناعم لقنوات البيع الفارغة المكرّرة"],
  ["legacy-meta", cat_legacy_meta, "تنظيف مفاتيح legacy من store.metadata"],
  ["old-carts", cat_old_carts, "حذف ناعم للسلال المهجورة"],
]

async function main() {
  const dbUrl = loadDatabaseUrl()
  if (!dbUrl) {
    console.error("DATABASE_URL غير مضبوط ولم يُعثر عليه في apps/backend/.env")
    process.exit(1)
  }

  const known = new Set(CATEGORIES.map((c) => c[0]))
  for (const n of [...(ONLY || []), ...SKIP]) {
    if (!known.has(n)) {
      console.error(`فئة غير معروفة: ${n}`)
      console.error(`الفئات المتاحة: ${[...known].join(", ")}`)
      process.exit(1)
    }
  }
  if (ALL) {
    /* --all لا يضيف شيئًا هنا لأن كل الفئات مفعّلة افتراضيًا */
  }

  const client = new Client({ connectionString: dbUrl })
  await client.connect()

  const dbName = (await client.query("select current_database() db")).rows[0].db
  section(`الاتصال بقاعدة البيانات: ${dbName}`)
  console.log(`الوضع: ${APPLY ? "⚠️  تنفيذ فعلي (--apply)" : "معاينة فقط (dry-run)"}`)
  console.log(
    `الفئات المختارة: ${CATEGORIES.filter((c) => wanted(c[0])).map((c) => c[0]).join(", ") || "(لا شيء)"}`
  )
  if (!APPLY) console.log("لن يتم أي تغيير. أضف --apply للتنفيذ بعد مراجعة المعاينة.")

  const summary = []
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
    console.log("\nخطوات التنفيذ:")
    console.log("  1) نسخة احتياطية:  pg_dump \"$DATABASE_URL\" > backup.sql")
    console.log("  2) تنفيذ الكل:     node scripts/cleanup-remaining-data.cjs --apply")
    console.log("  3) أو فئات محدّدة: node scripts/cleanup-remaining-data.cjs --apply --only=pub-keys,secret-keys")
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
