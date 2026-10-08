import { loadEnv, defineConfig, Modules } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

/**
 * Notification provider selection for the abandoned-cart reminder (and any
 * future transactional email). When `SENDGRID_API_KEY` is set we send real
 * email through SendGrid; otherwise we fall back to the local provider, which
 * logs the notification — so the feature works out of the box in development
 * without any external credentials.
 */
const notificationProviders = process.env.SENDGRID_API_KEY
  ? [
      {
        resolve: "@medusajs/notification-sendgrid",
        id: "sendgrid",
        options: {
          channels: ["email"],
          api_key: process.env.SENDGRID_API_KEY,
          from: process.env.SENDGRID_FROM,
        },
      },
    ]
  : [
      {
        resolve: "@medusajs/notification-local",
        id: "local",
        options: {
          name: "Local Notification Provider",
          channels: ["email"],
        },
      },
    ]

/**
 * Production infrastructure modules backed by Redis.
 *
 * In production (NODE_ENV=production) with `REDIS_URL` set, register Redis-backed
 * Cache, Event Bus, Workflow Engine, and distributed Locking so the backend
 * works correctly across restarts and multiple processes (e.g. a dedicated
 * worker). Outside production — or with no `REDIS_URL` — these are omitted and
 * Medusa falls back to its in-memory implementations, so local development
 * keeps working even if Redis is not installed/running.
 */
const useRedis =
  process.env.NODE_ENV === "production" && !!process.env.REDIS_URL
const redisModules = useRedis
  ? [
      {
        key: Modules.CACHE,
        resolve: "@medusajs/cache-redis",
        options: { redisUrl: process.env.REDIS_URL },
      },
      {
        key: Modules.EVENT_BUS,
        resolve: "@medusajs/event-bus-redis",
        options: { redisUrl: process.env.REDIS_URL },
      },
      {
        key: Modules.WORKFLOW_ENGINE,
        resolve: "@medusajs/workflow-engine-redis",
        options: { redis: { url: process.env.REDIS_URL } },
      },
      {
        key: Modules.LOCKING,
        resolve: "@medusajs/locking",
        options: {
          providers: [
            {
              resolve: "@medusajs/locking-redis",
              id: "locking-redis",
              is_default: true,
              options: { redisUrl: process.env.REDIS_URL },
            },
          ],
        },
      },
    ]
  : []

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    },
    // In production Medusa marks the admin session cookie as `Secure`, which
    // browsers reject over plain HTTP — breaking admin login on HTTP-only
    // deployments. Keep it non-secure by default and flip it on once the site
    // is served over HTTPS by setting COOKIE_SECURE=true.
    cookieOptions: {
      secure: process.env.COOKIE_SECURE === "true",
    },
  },
  plugins: [
    // Core draft-order system (manual/draft orders); settlement layers on top of this.
    // draft-order is a Medusa plugin, so it is registered here (not in `modules`).
    {
      resolve: "@medusajs/draft-order",
      options: {},
    },
  ],
  modules: [
    // Redis-backed infrastructure (cache, event bus, workflow engine, locking).
    // Only present when REDIS_URL is set; empty in local development.
    ...redisModules,
    // Schema-preservation preflight guard (loader-only, no data model).
    // Registered first so it runs before the data-bearing custom modules and
    // halts startup on any destructive change to the protected tables.
    { resolve: "./src/modules/schema-guard" },
    // Custom modules migrated from the Old Store
    { resolve: "./src/modules/shipping-city" },
    { resolve: "./src/modules/payments" },
    { resolve: "./src/modules/settlement" },
    // Private bank-transfer proof submissions and immutable review audit events.
    { resolve: "./src/modules/manual-transfer" },
    // Admin users, roles, and permissions (RBAC).
    { resolve: "./src/modules/rbac" },
    // Accounting documents (invoices) with independent numbering.
    { resolve: "./src/modules/invoicing" },
    // Abandoned-cart reminder tracking (reminder counts + cooldown state).
    { resolve: "./src/modules/abandoned-cart" },
    // Customer reviews / testimonials (store-level + per-product).
    { resolve: "./src/modules/reviews" },
    // File storage (local disk). `backend_url` is what gets baked into stored
    // image URLs at upload time, so in production set FILE_BACKEND_URL to the
    // public HTTPS origin (e.g. https://www.newlyye.com/static); otherwise new
    // uploads would be saved with a localhost URL. Files are written to the
    // default `static` dir, which `run-server.sh` symlinks to a persistent
    // location so they survive every rebuild.
    {
      key: Modules.FILE,
      resolve: "@medusajs/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/file-local",
            id: "local",
            options: {
              backend_url:
                process.env.FILE_BACKEND_URL || "http://localhost:9000/static",
            },
          },
        ],
      },
    },
    // Notification Module used to deliver abandoned-cart reminder emails.
    {
      resolve: "@medusajs/notification",
      options: {
        providers: notificationProviders,
      },
    },
  ],
})
