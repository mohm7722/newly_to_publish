import SkeletonOrderInformation from "@modules/skeletons/components/skeleton-order-information"
import SkeletonOrderItems from "@modules/skeletons/components/skeleton-order-items"

const SkeletonOrderConfirmed = () => {
  return (
    <div className="min-h-[calc(100vh-64px)] animate-pulse bg-[#fcfafc] py-6 sm:py-10" dir="rtl">
      <div className="content-container flex w-full max-w-4xl flex-col gap-5">
        <div className="relative overflow-hidden rounded-2xl bg-[#270830] p-5 sm:p-8">
          <div className="absolute -left-12 -top-16 h-40 w-40 rounded-full bg-[#67285A]/50" />
          <div className="relative flex items-start gap-4">
            <div className="h-11 w-11 shrink-0 rounded-full bg-white/15 sm:h-12 sm:w-12" />
            <div className="w-full max-w-lg space-y-3 pt-1">
              <div className="h-3 w-24 rounded bg-white/15" />
              <div className="h-7 w-3/4 rounded bg-white/20" />
              <div className="h-4 w-full rounded bg-white/15" />
            </div>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
          <SkeletonOrderItems />
        </div>
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
          <SkeletonOrderInformation />
        </div>
      </div>
    </div>
  )
}

export default SkeletonOrderConfirmed
