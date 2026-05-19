import { PremiumSkeleton } from '@/components/ui/premium-skeleton'

export default function SubcontractorsLoading() {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <PremiumSkeleton className="w-32 h-7" />
        <PremiumSkeleton className="w-28 h-9 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card border rounded-xl p-4 space-y-3">
            <PremiumSkeleton className="w-full h-4" />
            <PremiumSkeleton className="w-2/3 h-3" />
            <PremiumSkeleton className="w-full h-8" />
          </div>
        ))}
      </div>
    </div>
  )
}
