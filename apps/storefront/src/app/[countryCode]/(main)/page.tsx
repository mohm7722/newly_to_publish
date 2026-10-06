// src/app/[countryCode]/(main)/page.tsx

import { Metadata } from "next"
import { getCollectionByHandle } from "@lib/data/collections"
import { listCategories } from "@lib/data/categories"
import { getRegion } from "@lib/data/regions"
import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import { getProductPrice } from "@lib/util/get-product-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductCard from "@modules/home/components/product-card"
import { ShoppingCart } from "@medusajs/icons"
import CountdownTimer from "@modules/common/components/countdown-timer"
import FxPrice from "@modules/common/components/fx-price"

type StoreProduct = HttpTypes.StoreProduct

export const metadata: Metadata = {
  title: "نيولي | متجر إلكتروني متكامل",
  description: "تسوق أجمل المنتجات بأسعار رائعة من متجر نيولي.",
}

type PageProps = {
  // Next 15: params is async
  params: Promise<{ countryCode: string }>
}

export default async function Page({ params }: PageProps) {
  const { countryCode } = await params
  const region = await getRegion(countryCode)

  if (!region?.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 bg-red-50 border border-red-200 rounded-2xl">
          <div className="text-red-600 text-xl mb-2">❌</div>
          <div className="text-red-700 font-medium">
            عذرًا، لم نتمكن من تحميل بيانات المنطقة.
          </div>
        </div>
      </div>
    )
  }

  const { response } = await listProducts({ regionId: region.id })
  const products: StoreProduct[] = response.products

  // Fetch only products in the "new-products" collection for the New Arrivals section
  const newCollection = await getCollectionByHandle("new-products")
  let newProducts: StoreProduct[] = []
  if (newCollection?.id) {
    const { response: newResponse } = await listProducts({
      regionId: region.id,
      queryParams: { collection_id: [newCollection.id] as any, limit: 12 } as any,
    })
    newProducts = newResponse.products
  }

  // Fetch products in the "featured-products" collection for the Featured section
  const featuredCollection = await getCollectionByHandle("featured-products")
  let featuredProducts: StoreProduct[] = []
  if (featuredCollection?.id) {
    const { response: featuredResponse } = await listProducts({
      regionId: region.id,
      queryParams: { collection_id: [featuredCollection.id] as any, limit: 10 } as any,
    })
    featuredProducts = featuredResponse.products
  }

  // Fetch up to 6 categories (ordered as returned from admin)
  const homepageCategories = await listCategories({ limit: 6 })

  return (
    <main className="min-h-screen bg-white">
      {/* === Newly Hero (Branded) === */}
      <section
        className="relative text-white overflow-hidden"
        style={{
          background:
            "radial-gradient(1200px 600px at 10% -10%, rgba(63,12,80,0.65), transparent 60%), radial-gradient(900px 500px at 95% 110%, rgba(208,30,92,0.35), transparent 60%), #270830",
        }}
      >
        {/* صورة خلفية خفيفة + تظليل */}
        <div className="absolute inset-0 opacity-10 mix-blend-screen pointer-events-none">
          <img
            src="https://images.pexels.com/photos/230544/pexels-photo-230544.jpeg?auto=compress&cs=tinysrgb&w=1600"
            alt="Shopping Background"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="max-w-container mx-auto px-4 py-16 md:py-20 relative z-10">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="max-w-3xl space-y-4">
              <h1 className="text-2xl md:text-3xl font-bold leading-tight">
                متجر نيولي يمن
              </h1>
              <p className="text-sm md:text-base text-gray-100/90 leading-relaxed max-w-xl mx-auto">
                نأتي بجميع وأحدث المنتجات المنتشرة على الانترنت
                <br />
                ووسائل التواصل الاجتماعي
              </p>

              {/* زر CTA بنفس روح الهوية */}
              <div className="pt-4">
                <LocalizedClientLink
                  href="/store"
                  className="inline-flex items-center gap-3 px-6 py-3 font-semibold rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.25)] transition-all duration-300 hover:scale-[1.03]"
                  style={{
                    background: "linear-gradient(90deg, #ef3e2e 0%, #d01e5c 100%)",
                  }}
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-white animate-pulse" />
                  تسوق الآن
                </LocalizedClientLink>
              </div>
            </div>
          </div>
        </div>

        {/* زخارف لطيفة */}
        <div className="absolute top-8 left-8 w-12 h-12 bg-yellow-400 rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute bottom-8 right-8 w-10 h-10 bg-pink-400 rounded-full opacity-10 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-8 h-8 bg-blue-400 rounded-full opacity-10 animate-pulse delay-500"></div>
      </section>

      {/* Featured Products - المنتجات المميزة (سلايدر أفقي) */}
      <section className="py-16 bg-white mb-3 md:mb-8">
        <div className="max-w-container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="text-right">
              <h2 className="text-[1.125rem] md:text-[1.4rem] font-bold text-neoly-primary">
                المنتجات المميزة
              </h2>
              <div className="h-1 w-32 bg-red-500 rounded-full ml-auto mt-1" />
            </div>
            <LocalizedClientLink
              href="/store/featured-products"
              className="inline-flex items-center space-x-2 space-x-reverse border border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50/40 rounded-full px-3 py-1 text-[13px] md:text-sm"
            >
              <span>مشاهدة الكل</span>
              <span className="inline-block leading-none">›</span>
            </LocalizedClientLink>
          </div>

          <div className="relative">
            <div
              dir="ltr"
              className="flex gap-4 overflow-x-auto no-scrollbar pr-6 -mr-6 pt-4 pb-8"
            >
              {featuredProducts?.slice(0, 10).map((product: StoreProduct) => (
                <div
                  key={product.id}
                  dir="rtl"
                  className="shrink-0 w-[47.5%] sm:w-[47%] md:w-[45%] lg:basis-1/4 lg:w-auto xl:basis-1/4"
                >
                  <ProductCard product={product} countryCode={countryCode} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* New Arrivals Grid - منتجات جديدة */}
      <section className="pt-2 pb-24 bg-white">
        <div className="max-w-container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="text-right">
              <h2 className="text-[1.125rem] md:text-[1.4rem] font-bold text-neoly-primary">
                منتجات جديدة
              </h2>
              <div className="h-1 w-32 bg-red-500 rounded-full ml-auto mt-1" />
            </div>
            <LocalizedClientLink
              href="/store/new-products"
              className="inline-flex items-center space-x-2 space-x-reverse border border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50/40 rounded-full px-3 py-1 text-[13px] md:text-sm"
            >
              <span>مشاهدة الكل</span>
              <span className="inline-block leading-none">›</span>
            </LocalizedClientLink>
          </div>

          <div className="relative">
            <div
              dir="ltr"
              className="flex gap-4 overflow-x-auto no-scrollbar pr-6 -mr-6 pt-4 pb-8"
            >
              {newProducts?.slice(0, 8).map((product: StoreProduct) => (
                <div
                  key={product.id}
                  dir="rtl"
                  className="shrink-0 w-[47.5%] sm:w-[47%] md:w-[45%] lg:basis-1/4 lg:w-auto xl:basis-1/4"
                >
                  <ProductCard product={product} countryCode={countryCode} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ====== العروض + بطاقات بنفس ستايل ProductCard ====== */}
      <section className="bg-gradient-to-r from-red-500 to-pink-600 text-white">
        <div className="max-w-container mx-auto px-4 py-12">
          <div className="text-center mb-6">
            <h2 className="text-xl md:text-2xl font-bold mb-2">
              🔥 عروض محدودة الوقت
            </h2>
            <p className="text-red-100">
              احصل على خصومات تصل إلى 70% - العرض ينتهي قريباً!
            </p>
          </div>

          {/* عداد خصومات صغير مع عدّ وهمي */}
          <div className="flex justify-center mb-6">
            <CountdownTimer initialHours={23} initialMinutes={45} initialSeconds={12} />
          </div>

          {/* المنتجات - عروض ببطاقات أقصر وتأثير رفع خفيف */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {products?.slice(0, 12).map((product: StoreProduct, index: number) => {
              const { cheapestPrice } = getProductPrice({ product })
              return (
                <div key={product.id} className={index >= 6 ? "hidden md:block" : ""}>
                  <LocalizedClientLink href={`/products/${product.handle}`}>
                    <div className="bg-white rounded-lg p-3 text-gray-900 transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 border border-gray-100">
                      <div className="relative overflow-hidden rounded-lg mb-2">
                        <div className="aspect-[4/3] bg-gray-100">
                          {product.thumbnail && (
                            <img
                              src={product.thumbnail}
                              alt={product.title || ""}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="absolute top-1 right-1 bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-bold">
                          عرض خاص
                        </div>
                      </div>
                      <h3 className="font-medium text-xs md:text-sm line-clamp-2 mb-1 text-right">
                        {product.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <div className="text-right">
                          <div className="text-red-600 font-bold text-sm">
                            {cheapestPrice && cheapestPrice.calculated_price_number > 0 ? (
                              <FxPrice amountSar={cheapestPrice.calculated_price_number} />
                            ) : (
                              <span className="text-gray-400">السعر غير متاح</span>
                            )}
                          </div>
                          {cheapestPrice?.price_type === "sale" &&
                            cheapestPrice.calculated_price_number > 0 &&
                            cheapestPrice.original_price_number > 0 && (
                            <div className="text-gray-500 line-through text-xs">
                              <FxPrice amountSar={cheapestPrice.original_price_number} />
                            </div>
                          )}
                        </div>
                        <button className="bg-red-500 text-white p-1.5 rounded-lg hover:bg-red-600 transition-colors">
                          <ShoppingCart className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </LocalizedClientLink>
                </div>
              )
            })}
          </div>

          {/* زر مشاهدة جميع العروض */}
          <div className="text-center mt-6">
            <LocalizedClientLink
              href="/store"
              className="inline-block bg-white text-red-600 hover:bg-gray-100 font-bold rounded-xl px-4 py-2"
            >
              مشاهدة جميع العروض
            </LocalizedClientLink>
          </div>
        </div>
      </section>

      {/* Store Benefits Section - مميزات المتجر */}
      <section className="bg-gray-50">
        <div className="max-w-container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-sm mb-1">جودة مضمونة</h3>
              <p className="text-xs text-gray-600">منتجات أصلية 100%</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-sm mb-1">أسعار منافسة</h3>
              <p className="text-xs text-gray-600">أفضل الأسعار في السوق</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293A1 1 0 005 16h12M7 13v4a2 2 0 002 2h4a2 2 0 002-2v-4m-6 2a2 2 0 100-4 2 2 0 000 4zm0 0h.01M15 15h.01"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-sm mb-1">شحن سريع</h3>
              <p className="text-xs text-gray-600">توصيل خلال 24 ساعة</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-orange-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-sm mb-1">دعم 24/7</h3>
              <p className="text-xs text-gray-600">خدمة عملاء متاحة دائماً</p>
            </div>
          </div>
        </div>
      </section>

      {/* Category Highlights - تصفح حسب الفئة */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <div className="text-right">
              <h2 className="text-[1.125rem] md:text-[1.4rem] font-bold text-neoly-primary">
                تصفح حسب الفئة
              </h2>
              <div className="h-1 w-32 bg-red-500 rounded-full ml-auto mt-1" />
            </div>
            <LocalizedClientLink
              href="/store"
              className="inline-flex items-center space-x-2 space-x-reverse border border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50/40 rounded-full px-3 py-1 text-[13px] md:text-sm"
            >
              <span>مشاهدة الكل</span>
              <span className="inline-block leading-none">›</span>
            </LocalizedClientLink>
          </div>

          {/* شبكة فئات بصور ثابتة والأسماء من لوحة التحكم، تقتصر على 6 عناصر */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-[0.6rem] md:gap-[0.8rem]">
            {(() => {
              const images = [
                "https://images.pexels.com/photos/271743/pexels-photo-271743.jpeg?auto=compress&cs=tinysrgb&w=800",
                "https://images.pexels.com/photos/1884581/pexels-photo-1884581.jpeg?auto=compress&cs=tinysrgb&w=800",
                "https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=800",
                "https://images.pexels.com/photos/2983464/pexels-photo-2983464.jpeg?auto=compress&cs=tinysrgb&w=800",
                "https://images.pexels.com/photos/607812/pexels-photo-607812.jpeg?auto=compress&cs=tinysrgb&w=800",
                "https://images.pexels.com/photos/18105/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800",
              ]
              return (homepageCategories || []).slice(0, 6).map((cat: any, index: number) => {
                const name = cat?.name || cat?.title || ""
                const image = images[index % images.length]
                const handle = (cat?.handle || name)
                  .toString()
                  .trim()
                  .toLowerCase()
                  .replace(/^\/+|\/+$/g, "")
                  .replace(/\s+/g, "-")
                const href = `/store/${encodeURIComponent(handle)}`
                return (
                  <LocalizedClientLink
                    key={cat.id || index}
                    href={href}
                    className="group block cursor-pointer text-center transform scale-[0.85]"
                  >
                    <div className="relative overflow-hidden aspect-square flex items-center justify-center rounded-xl shadow-neoly mb-1">
                      <img
                        src={image}
                        alt={name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-all duration-300" />
                      <div className="relative z-10 text-center text-white p-2">
                        <h3 className="font-bold text-sm md:text-base leading-tight drop-shadow-lg">
                          {name}
                        </h3>
                      </div>
                    </div>
                  </LocalizedClientLink>
                )
              })
            })()}
          </div>
        </div>
      </section>

      {/* Testimonials Section - سلايدر أفقي محسّن */}
      <section className="relative py-20 bg-white">
        <div className="max-w-container mx-auto px-4">
          {/* العنوان */}
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-neoly-primary mb-3">
              آراء العملاء
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              ماذا يقول عملاؤنا عن تجربتهم مع نيولي
            </p>
          </div>

          <div className="relative">
            {/* تلاشي الحواف */}
            <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent z-10" />
            <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-white to-transparent z-10" />

            {/* المسار القابل للتمرير (LTR للحركة، والبطاقات RTL) */}
            <div
              dir="ltr"
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory pr-4 -mr-4 no-scrollbar scroll-smooth"
            >
              {[
                {
                  name: "أحمد محمد",
                  comment:
                    "جودة ممتازة وسرعة في التوصيل. تجربة رائعة فعلًا! خدمة العملاء متجاوبة جدًا.",
                  rating: 5,
                  avatar: "👨‍💼",
                },
                {
                  name: "نورة علي",
                  comment:
                    "المنتجات مطابقة للوصف والتغليف أنيق. تصلني الطلبات في الوقت المحدد دائمًا.",
                  rating: 5,
                  avatar: "👩‍💼",
                },
                {
                  name: "سالم منصور",
                  comment:
                    "الأسعار مناسبة والخدمة ممتازة. بالتأكيد سأعيد الشراء مرة أخرى.",
                  rating: 4,
                  avatar: "👨‍🔧",
                },
                {
                  name: "ليان سامي",
                  comment:
                    "تجربة تسوق ممتعة وسهلة. المنتجات فعلاً كما في الصور — شكراً نيولي!",
                  rating: 5,
                  avatar: "👩‍🎓",
                },
              ].map((r, i) => (
                <div
                  key={i}
                  dir="rtl"
                  className="shrink-0 snap-start w-[85%] sm:w-[60%] md:w-[45%] lg:w-[32%]"
                >
                  <article className="relative h-full bg-white rounded-2xl border border-gray-100 p-6 shadow-neoly transition-all duration-300 hover:shadow-neoly-lg hover:-translate-y-1">
                    {/* شارة الاقتباس */}
                    <div className="absolute -top-3 -left-3 w-10 h-10 rounded-2xl bg-neoly-accent text-white flex items-center justify-center shadow-md">
                      <span className="text-xl leading-none">“</span>
                    </div>

                    {/* النجوم */}
                    <div className="flex items-center mb-4">
                      {[...Array(5)].map((_, idx) => (
                        <svg
                          key={idx}
                          className={`w-5 h-5 ${
                            idx < r.rating ? "text-rating" : "text-gray-300"
                          }`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>

                    {/* التعليق */}
                    <p className="text-gray-700 leading-relaxed mb-6">
                      “{r.comment}”
                    </p>

                    {/* العميل */}
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl ring-2 ring-neoly-accent/30">
                        {r.avatar}
                      </div>
                      <div>
                        <p className="font-semibold text-neoly-primary">{r.name}</p>
                        <p className="text-xs text-gray-500">عميل موثوق</p>
                      </div>
                    </div>
                  </article>
                </div>
              ))}
            </div>
          </div>

          {/* تلميح تمرير لطيف */}
          <div className="mt-4 flex justify-center">
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <span className="animate-pulse">⟵</span>
              <span>اسحب للاطلاع على المزيد</span>
              <span className="animate-pulse">⟶</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
