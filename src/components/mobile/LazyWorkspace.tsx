'use client'

import dynamic from 'next/dynamic'
import { Suspense, memo, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks'
import { Skeleton } from '@/components/ui/skeleton'

interface LazyWorkspaceProps {
  componentPath: string
  fallback?: React.ReactNode
  className?: string
  props?: Record<string, any>
}

const componentCache = new Map<string, React.ComponentType<any>>()

function getOrCreateLazyComponent(path: string): React.ComponentType<any> {
  if (componentCache.has(path)) {
    return componentCache.get(path)!
  }

  const LazyComp = dynamic(() => import(`@/components/${path}`), {
    loading: () => (
      <div className="space-y-3 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    ),
  })

  componentCache.set(path, LazyComp)
  return LazyComp
}

export function LazyWorkspace({ componentPath, fallback, className, props = {} }: LazyWorkspaceProps) {
  const Component = useMemo(() => getOrCreateLazyComponent(componentPath), [componentPath])

  return (
    <Suspense fallback={fallback ?? <DefaultWorkspaceFallback />}>
      <div className={cn('animate-fade-in', className)}>
        <Component {...props} />
      </div>
    </Suspense>
  )
}

function DefaultWorkspaceFallback() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}

export const MemoizedWorkspace = memo(function MemoizedWorkspace({
  children,
  id,
}: {
  children: React.ReactNode
  id: string
}) {
  return <div data-workspace-id={id}>{children}</div>
})

export function MobileFallback({ lines = 4, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-3 p-4', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('rounded-lg', i === 0 ? 'h-8 w-3/4' : 'h-12 w-full')} />
      ))}
    </div>
  )
}
