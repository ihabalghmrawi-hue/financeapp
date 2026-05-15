'use client'

import dynamic from 'next/dynamic'
import { PremiumSkeleton } from '@/components/ui/premium-skeleton'
import { Suspense, type ComponentType } from 'react'

interface LazyLoadOptions {
  ssr?: boolean
  loading?: ComponentType
}

const defaultLoading = () => <PremiumSkeleton className="w-full h-48 rounded-2xl" />

export function lazyLoad<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {},
) {
  const { ssr = false, loading: Loading = defaultLoading } = options

  const Component = dynamic(importFn, {
    ssr,
    loading: () => <Loading />,
  })

  return Component
}

export function LazyLoad({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) {
  return <Suspense fallback={fallback || <PremiumSkeleton className="w-full h-48 rounded-2xl" />}>{children}</Suspense>
}

const lazyChartComponents = {
  AreaChart: () => import('recharts').then((m) => ({ default: m.AreaChart })),
  BarChart: () => import('recharts').then((m) => ({ default: m.BarChart })),
  LineChart: () => import('recharts').then((m) => ({ default: m.LineChart })),
  ResponsiveContainer: () => import('recharts').then((m) => ({ default: m.ResponsiveContainer })),
}

export const LazyAreaChart = lazyLoad(() => import('recharts').then((m) => ({ default: m.AreaChart })), { ssr: false })
export const LazyBarChart = lazyLoad(() => import('recharts').then((m) => ({ default: m.BarChart })), { ssr: false })
export const LazyLineChart = lazyLoad(() => import('recharts').then((m) => ({ default: m.LineChart })), { ssr: false })
export const LazyResponsiveContainer = lazyLoad(
  () => import('recharts').then((m) => ({ default: m.ResponsiveContainer })),
  { ssr: false },
)
