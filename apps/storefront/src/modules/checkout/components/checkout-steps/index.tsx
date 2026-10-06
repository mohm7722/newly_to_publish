"use client"

import { Check } from "lucide-react"
import { useSearchParams } from "next/navigation"

const steps = [
  { key: "address", label: "العنوان" },
  { key: "delivery", label: "التوصيل" },
  { key: "payment", label: "الدفع" },
  { key: "review", label: "المراجعة" },
]

export default function CheckoutSteps() {
  const current = useSearchParams().get("step") || "address"
  const activeIndex = Math.max(0, steps.findIndex((step) => step.key === current))

  return (
    <nav className="rounded-2xl border border-[#67285A]/10 bg-white p-3 shadow-sm sm:p-4" aria-label="خطوات إتمام الطلب">
      <ol className="grid grid-cols-4 gap-1 sm:gap-3">
        {steps.map((step, index) => {
          const complete = index < activeIndex
          const active = index === activeIndex
          return (
            <li key={step.key} className="flex min-w-0 flex-col items-center gap-2 text-center">
              <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition sm:h-10 sm:w-10 ${complete ? "bg-[#82ac40] text-white" : active ? "bg-[#67285A] text-white ring-4 ring-[#67285A]/10" : "bg-gray-100 text-gray-400"}`}>
                {complete ? <Check className="h-4 w-4" aria-hidden="true" /> : index + 1}
              </span>
              <span className={`truncate text-[11px] font-medium sm:text-sm ${active || complete ? "text-[#270830]" : "text-gray-400"}`}>{step.label}</span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}