'use client'

import { cn } from '@/lib/utils'
import { useIsMobile, useIsTablet } from '@/hooks'

interface AdaptiveTypographyProps {
  children: React.ReactNode
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'small' | 'caption'
  className?: string
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div'
  truncate?: boolean
}

export function AdaptiveTypography({
  children,
  variant = 'body',
  className,
  as: Tag = 'div',
  truncate = false,
}: AdaptiveTypographyProps) {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()

  const sizeClasses = {
    h1: isMobile ? 'text-xl font-bold' : isTablet ? 'text-2xl font-bold' : 'text-3xl font-bold',
    h2: isMobile ? 'text-lg font-bold' : isTablet ? 'text-xl font-bold' : 'text-2xl font-bold',
    h3: isMobile ? 'text-base font-semibold' : isTablet ? 'text-lg font-semibold' : 'text-xl font-semibold',
    h4: isMobile ? 'text-sm font-semibold' : isTablet ? 'text-base font-semibold' : 'text-lg font-semibold',
    body: isMobile ? 'text-sm' : isTablet ? 'text-sm' : 'text-base',
    small: isMobile ? 'text-xs' : 'text-sm',
    caption: isMobile ? 'text-[10px]' : 'text-xs',
  }

  return <Tag className={cn(sizeClasses[variant], truncate && 'truncate', className)}>{children}</Tag>
}

export function ResponsiveText({
  children,
  className,
  mobileSize = 'sm',
  tabletSize = 'sm',
  desktopSize = 'base',
  weight,
}: {
  children: React.ReactNode
  className?: string
  mobileSize?: 'xs' | 'sm' | 'base' | 'lg'
  tabletSize?: 'xs' | 'sm' | 'base' | 'lg'
  desktopSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl'
  weight?: string
}) {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()

  const size = isMobile ? mobileSize : isTablet ? tabletSize : desktopSize

  return <span className={cn(`text-${size}`, weight && `font-${weight}`, className)}>{children}</span>
}
