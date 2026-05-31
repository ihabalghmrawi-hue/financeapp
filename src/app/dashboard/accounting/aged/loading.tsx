import { SkeletonCard, SkeletonTable, SkeletonLine } from '@/components/ui/skeleton'

export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <SkeletonLine className="h-8 w-48" />
        <SkeletonLine className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      <SkeletonTable rows={6} columns={5} />
    </div>
  )
}
