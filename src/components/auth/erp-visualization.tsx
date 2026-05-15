'use client'

import { cn } from '@/lib/utils'

const bgMap: Record<string, Record<string, string>> = {
  en: { dark: '/3.png', light: '/6.png' },
  ar: { dark: '/4.png', light: '/5.png' },
}

export function ErpVisualization({
  isDark = true,
  language = 'ar',
  className,
}: {
  isDark?: boolean
  language?: string
  className?: string
}) {
  const bg = bgMap[language]?.[isDark ? 'dark' : 'light'] || '/3.png'

  return (
    <div
      className={cn('absolute inset-0 bg-cover bg-center bg-no-repeat', className)}
      style={{ backgroundImage: `url(${bg})` }}
    />
  )
}
