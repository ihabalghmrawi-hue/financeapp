import { SkeletonLine } from '@/components/ui/skeleton'

export default function ProjectsLoading() {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <SkeletonLine className="h-8 w-40" />
        <SkeletonLine className="h-10 w-28" />
      </div>
      <div className="flex gap-3">
        <SkeletonLine className="h-10 flex-1" />
        <SkeletonLine className="h-10 w-40" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-card border rounded-xl p-5 space-y-3">
            <SkeletonLine className="h-5 w-3/4" />
            <SkeletonLine className="h-4 w-1/2" />
            <SkeletonLine className="h-4 w-full" />
            <div className="flex gap-3">
              <SkeletonLine className="h-8 flex-1" />
              <SkeletonLine className="h-8 flex-1" />
              <SkeletonLine className="h-8 flex-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
