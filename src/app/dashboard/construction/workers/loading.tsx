import { SkeletonLine } from '@/components/ui/skeleton'

export default function WorkersLoading() {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <SkeletonLine className="h-8 w-32" />
        <SkeletonLine className="h-10 w-28" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card border rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <SkeletonLine className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-1">
                <SkeletonLine className="h-4 w-32" />
                <SkeletonLine className="h-3 w-20" />
              </div>
              <SkeletonLine className="h-6 w-14 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <SkeletonLine className="h-12" />
              <SkeletonLine className="h-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
