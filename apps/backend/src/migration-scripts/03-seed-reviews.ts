import type { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { REVIEWS_MODULE } from "../modules/reviews"
import type ReviewsModuleService from "../modules/reviews/service"

/**
 * Reviews seed migration script.
 *
 * Seeds a small set of **approved, featured, store-level** testimonials so the
 * homepage "آراء العملاء" section has content on a fresh install. Runs with the
 * full application container as part of the `medusa db:migrate` batch.
 *
 * Idempotent: it only seeds when the `product_review` table is completely
 * empty, so it never duplicates rows and never clobbers reviews added later via
 * the admin/API. Once real customer reviews exist, this seed stops doing
 * anything.
 *
 * NOTE: these are placeholder testimonials meant to be replaced with real
 * customer reviews (edit/remove them from the database or the forthcoming admin
 * moderation UI). They are kept here only so the section is not empty on first
 * boot and to exercise the full data path.
 *
 * Failures are logged and swallowed so this script never blocks the migration
 * batch.
 */
export default async function seed_reviews({
  container,
}: {
  container: MedusaContainer
}): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    const reviews = container.resolve<ReviewsModuleService>(REVIEWS_MODULE)

    // Only seed on a completely empty table (idempotent / non-destructive).
    const existing = await reviews.listProductReviews({}, { take: 1 })
    if (existing.length > 0) {
      logger.info("[reviews] seed skipped (reviews already present)")
      return
    }

    await reviews.createProductReviews([
      {
        author_name: "أحمد محمد",
        author_city: "تعز",
        rating: 5,
        body: "جودة ممتازة وسرعة في التوصيل. تجربة رائعة فعلًا! خدمة العملاء متجاوبة جدًا.",
        status: "approved",
        is_featured: true,
      },
      {
        author_name: "نورة علي",
        author_city: "عدن",
        rating: 5,
        body: "المنتجات مطابقة للوصف والتغليف أنيق. تصلني الطلبات في الوقت المحدد دائمًا.",
        status: "approved",
        is_featured: true,
      },
      {
        author_name: "سالم منصور",
        author_city: "صنعاء",
        rating: 4,
        body: "الأسعار مناسبة والخدمة ممتازة. بالتأكيد سأعيد الشراء مرة أخرى.",
        status: "approved",
        is_featured: true,
      },
      {
        author_name: "ليان سامي",
        author_city: "الحديدة",
        rating: 5,
        body: "تجربة تسوق ممتعة وسهلة. المنتجات فعلاً كما في الصور — شكراً نيولي!",
        status: "approved",
        is_featured: true,
      },
    ])

    logger.info("[reviews] seeded 4 placeholder testimonials")
  } catch (err) {
    logger.error(
      `[reviews] seed script failed (continuing): ${
        (err as Error)?.message ?? err
      }`
    )
  }
}
