import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button, Heading } from "@modules/common/components/ui"

const Hero = () => {
  return (
    <div className="relative h-[75vh] w-full border-b border-ui-border-base bg-[#f9f6fb]">
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-6 p-6 text-center small:p-32">
        <span>
          <Heading level="h1" className="text-3xl font-bold leading-10 text-[#270830]">
            اكتشف تجربة نيولي
          </Heading>
          <Heading level="h2" className="mt-2 text-xl font-normal leading-9 text-ui-fg-subtle">
            منتجات مميزة وتسوق أسهل في مكان واحد
          </Heading>
        </span>
        <LocalizedClientLink href="/store">
          <Button className="bg-[#67285A] text-white hover:bg-[#56214c]">تسوق الآن</Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default Hero
