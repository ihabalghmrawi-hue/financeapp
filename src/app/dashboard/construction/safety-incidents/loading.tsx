import { PremiumSkeleton } from '@/components/ui/premium-skeleton'

export default function SafetyIncidentsLoading() {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <PremiumSkeleton className="w-40 h-7" />
        <PremiumSkeleton className="w-28 h-9 rounded-lg" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border rounded-xl p-4">
            <PremiumSkeleton className="w-3/4 h-4 mb-2" />
            <PremiumSkeleton className="w-1/2 h-3" />
          </div>
        ))}
      </div>
    </div>
  )
}
