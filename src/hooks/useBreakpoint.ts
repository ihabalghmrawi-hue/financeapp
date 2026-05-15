'use client'

import { useState, useEffect, useCallback } from 'react'

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

const BREAKPOINTS: Record<Breakpoint, number> = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
}

export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>('lg')

  useEffect(() => {
    const calculate = () => {
      const w = window.innerWidth
      if (w < 640) {
        setBp('xs')
      } else if (w < 768) {
        setBp('sm')
      } else if (w < 1024) {
        setBp('md')
      } else if (w < 1280) {
        setBp('lg')
      } else if (w < 1536) {
        setBp('xl')
      } else {
        setBp('2xl')
      }
    }
    calculate()
    window.addEventListener('resize', calculate)
    return () => window.removeEventListener('resize', calculate)
  }, [])

  return bp
}

export function useIsMobile(): boolean {
  const bp = useBreakpoint()
  return bp === 'xs' || bp === 'sm'
}

export function useIsTablet(): boolean {
  const bp = useBreakpoint()
  return bp === 'md' || bp === 'lg'
}

export function useIsDesktop(): boolean {
  const bp = useBreakpoint()
  return bp === 'xl' || bp === '2xl'
}

export function useBreakpointValue<T>(values: Partial<Record<Breakpoint, T>>, defaultValue: T): T {
  const bp = useBreakpoint()
  return values[bp] ?? defaultValue
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia(query)
    setMatches(mql.matches)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}

export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

export function useResponsiveGrid(columns: { mobile?: number; tablet?: number; desktop?: number } = {}) {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const isDesktop = useIsDesktop()

  const cols = isMobile ? (columns.mobile ?? 1) : isTablet ? (columns.tablet ?? 2) : (columns.desktop ?? 3)

  return { cols, isMobile, isTablet, isDesktop }
}

export function useResponsiveFontSize(base: number): number {
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  if (isMobile) {
    return Math.max(base * 0.875, 12)
  }
  if (isTablet) {
    return base * 0.9375
  }
  return base
}
