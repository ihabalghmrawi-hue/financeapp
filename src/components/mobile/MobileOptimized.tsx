'use client'

import { memo, useMemo, useCallback, type ReactNode } from 'react'
import { useIsMobile } from '@/hooks'
import { useMobileLayout } from './MobileLayoutProvider'

export const MobileOptimizedRow = memo(function MobileOptimizedRow({
  children,
  className,
  onClick,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
}) {
  const isMobile = useIsMobile()

  const handlers = useMemo(
    () => ({
      onClick,
      onTouchEnd: isMobile ? undefined : undefined,
    }),
    [onClick, isMobile],
  )

  return (
    <div className={className} {...handlers}>
      {children}
    </div>
  )
})

export function useMobileRender(fn: () => ReactNode, deps: any[]): ReactNode {
  return useMemo(fn, deps)
}

export function MobileRenderer({
  mobile,
  tablet,
  desktop,
  fallback = null,
}: {
  mobile?: ReactNode
  tablet?: ReactNode
  desktop?: ReactNode
  fallback?: ReactNode
}) {
  const { isMobile, isTablet, isDesktop } = useMobileLayout()

  if (isMobile && mobile) {
    return <>{mobile}</>
  }
  if (isTablet && tablet) {
    return <>{tablet}</>
  }
  if (isDesktop && desktop) {
    return <>{desktop}</>
  }
  return <>{fallback}</>
}

export const MobileRenderBool = memo(function MobileRenderBool({
  children,
  showOn = 'mobile',
}: {
  children: ReactNode
  showOn?: 'mobile' | 'tablet' | 'desktop' | 'mobile+tablet'
}) {
  const { isMobile, isTablet, isDesktop } = useMobileLayout()

  if (showOn === 'mobile' && !isMobile) {
    return null
  }
  if (showOn === 'tablet' && !isTablet) {
    return null
  }
  if (showOn === 'desktop' && !isDesktop) {
    return null
  }
  if (showOn === 'mobile+tablet' && isDesktop) {
    return null
  }

  return <>{children}</>
})

export function useTouchOptimized<T extends (...args: any[]) => any>(callback: T, deps: any[]): T {
  return useCallback((...args: any[]) => {
    callback(...args)
  }, deps) as unknown as T
}
