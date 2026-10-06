import { Heading, Text } from "@modules/common/components/ui"

import InteractiveLink from "@modules/common/components/interactive-link"

const EmptyCartMessage = () => {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center px-5 py-16 text-center" data-testid="empty-cart-message">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f3edf5] text-3xl" aria-hidden="true">🛍️</span>
      <Heading level="h1" className="mt-5 text-2xl font-bold text-[#270830] sm:text-3xl">سلتك فارغة</Heading>
      <Text className="mb-7 mt-3 max-w-md text-sm leading-7 text-gray-500">لم تضف أي منتج بعد. استكشف منتجات نيولي واختر ما يناسبك.</Text>
      <div className="rounded-xl bg-[#67285A] px-5 py-3 font-bold text-white transition hover:bg-[#56214c]">
        <InteractiveLink href="/store">استكشاف المنتجات</InteractiveLink>
      </div>
    </div>
  )
}

export default EmptyCartMessage
