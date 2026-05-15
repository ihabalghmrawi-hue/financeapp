'use client'

import { cn } from '@/lib/utils'

export function ErpVisualization({ isDark = true, className }: { isDark?: boolean; className?: string }) {
  return (
    <div
      className={cn('absolute inset-0 bg-cover bg-center bg-no-repeat', className)}
      style={{ backgroundImage: isDark ? 'url(/1.png)' : 'url(/5.png)' }}
    />
  )
}
