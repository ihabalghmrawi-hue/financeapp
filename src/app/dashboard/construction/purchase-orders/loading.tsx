import { SkeletonLine } from '@/components/ui/skeleton'

export default function PurchaseOrdersLoading() {
  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <SkeletonLine className="h-8 w-40" />
        <SkeletonLine className="h-10 w-32" />
      </div>
      <div className="bg-card border rounded-xl">
        <div className="p-4 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonLine key={i} className="h-14 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}
