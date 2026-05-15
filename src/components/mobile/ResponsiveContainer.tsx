'use client'

import { cn } from '@/lib/utils'
import { useIsMobile, useIsTablet, useSafeArea, useIsCapacitor, useKeyboardAwareStyle } from '@/hooks'
import { useMobileLayout } from './MobileLayoutProvider'

interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  as?: 'div' | 'main' | 'section' | 'article'
  noPadding?: boolean
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

const MAX_WIDTHS = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  full: 'max-w-full',
}

export function ResponsiveContainer({
  children,
  className,
  as: Tag = 'div',
  noPadding = false,
  maxWidth = 'full',
}: ResponsiveContainerProps) {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const keyboardStyle = useKeyboardAwareStyle()
  const { bottomNavOpen } = useMobileLayout()

  return (
    <Tag
      className={cn(
        'w-full mx-auto',
        MAX_WIDTHS[maxWidth],
        !noPadding && (isMobile ? 'px-3' : isTablet ? 'px-4' : 'px-6'),
        className,
      )}
      style={{
        ...keyboardStyle,
        paddingBottom:
          bottomNavOpen && isMobile
            ? `calc(3.5rem + ${keyboardStyle.paddingBottom || 0}px)`
            : keyboardStyle.paddingBottom,
      }}
    >
      {children}
    </Tag>
  )
}

export function ResponsiveGrid({
  children,
  className,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = { mobile: 3, tablet: 4, desktop: 6 },
}: {
  children: React.ReactNode
  className?: string
  cols?: { mobile?: number; tablet?: number; desktop?: number }
  gap?: { mobile?: number; tablet?: number; desktop?: number }
}) {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()

  const gridCols = isMobile ? (cols.mobile ?? 1) : isTablet ? (cols.tablet ?? 2) : (cols.desktop ?? 3)
  const gridGap = isMobile ? (gap.mobile ?? 3) : isTablet ? (gap.tablet ?? 4) : (gap.desktop ?? 6)

  return (
    <div
      className={cn('grid', className)}
      style={{
        gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
        gap: `${gridGap * 0.25}rem`,
      }}
    >
      {children}
    </div>
  )
}

export function MobileOnly({ children, className }: { children: React.ReactNode; className?: string }) {
  const isMobile = useIsMobile()
  if (!isMobile) {
    return null
  }
  return <div className={className}>{children}</div>
}

export function DesktopOnly({ children, className }: { children: React.ReactNode; className?: string }) {
  const isMobile = useIsMobile()
  if (isMobile) {
    return null
  }
  return <div className={className}>{children}</div>
}

export function TabletOnly({ children, className }: { children: React.ReactNode; className?: string }) {
  const isTablet = useIsTablet()
  if (!isTablet) {
    return null
  }
  return <div className={className}>{children}</div>
}

export function ResponsiveVisibility({
  children,
  mobile,
  tablet,
  desktop,
  className,
}: {
  children: React.ReactNode
  mobile?: boolean
  tablet?: boolean
  desktop?: boolean
  className?: string
}) {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const isDesktop = !isMobile && !isTablet

  const show = (mobile ?? true) && (tablet ?? true) && (desktop ?? true)

  const visibility =
    (isMobile && (mobile ?? true)) || (isTablet && (tablet ?? true)) || (isDesktop && (desktop ?? true))

  if (!visibility) {
    return null
  }

  return <div className={className}>{children}</div>
}
