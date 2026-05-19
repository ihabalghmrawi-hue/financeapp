import { SkeletonLine } from '@/components/ui/skeleton'

export default function AttendanceLoading() {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <SkeletonLine className="h-8 w-40" />
        <SkeletonLine className="h-10 w-32" />
      </div>
      <div className="flex gap-3">
        <SkeletonLine className="h-9 w-60" />
        <SkeletonLine className="h-9 w-40" />
      </div>
      <div className="bg-card border rounded-xl">
        <div className="p-4 space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonLine key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}
