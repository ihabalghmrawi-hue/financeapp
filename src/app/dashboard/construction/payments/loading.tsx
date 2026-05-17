import { SkeletonLine, SkeletonTable } from '@/components/ui/skeleton'

export default function PaymentsLoading() {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <SkeletonLine className="h-8 w-32" />
        <SkeletonLine className="h-10 w-28" />
      </div>
      <SkeletonTable rows={8} columns={7} />
    </div>
  )
}
