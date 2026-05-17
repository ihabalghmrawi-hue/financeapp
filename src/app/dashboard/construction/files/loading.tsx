import { SkeletonLine } from '@/components/ui/skeleton'

export default function FilesLoading() {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <SkeletonLine className="h-8 w-32" />
        <SkeletonLine className="h-10 w-28" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card border rounded-xl p-4 space-y-2">
            <div className="flex items-start gap-2">
              <SkeletonLine className="h-5 w-5" />
              <div className="flex-1 space-y-1">
                <SkeletonLine className="h-4 w-3/4" />
                <SkeletonLine className="h-3 w-1/3" />
              </div>
            </div>
            <SkeletonLine className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}
