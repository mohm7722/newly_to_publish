import { ShieldCheck } from "lucide-react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const NewlyBrand = () => {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <ShieldCheck className="h-4 w-4 text-[#82ac40]" aria-hidden="true" />
      <span>تسوق آمن وموثوق مع</span>
      <LocalizedClientLink href="/" className="font-bold text-[#67285A] hover:text-[#B3174A]">
        نيولي
      </LocalizedClientLink>
    </div>
  )
}

export default NewlyBrand
