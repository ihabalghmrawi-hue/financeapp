'use client'

import { useState, useEffect } from 'react'

export interface SafeAreaInsets {
  top: number
  bottom: number
  left: number
  right: number
}

function getCSSVar(name: string, fallback = '0px'): number {
  if (typeof document === 'undefined') {
    return 0
  }
  const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
  return parseInt(val, 10) || 0
}

function detectSafeArea(): SafeAreaInsets {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { top: 0, bottom: 0, left: 0, right: 0 }
  }

  const env = (name: string) => {
    try {
      return CSS.supports(`padding-top: env(${name})`) ? `env(${name})` : '0px'
    } catch {
      return '0px'
    }
  }

  const top = getCSSVar('--safe-area-top') || parseInt(env('safe-area-inset-top')) || 0
  const bottom = getCSSVar('--safe-area-bottom') || parseInt(env('safe-area-inset-bottom')) || 0
  const left = getCSSVar('--safe-area-left') || parseInt(env('safe-area-inset-left')) || 0
  const right = getCSSVar('--safe-area-right') || parseInt(env('safe-area-inset-right')) || 0

  const testDiv = document.createElement('div')
  testDiv.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:-9999'
  document.body.appendChild(testDiv)
  const computedTop = parseInt(window.getComputedStyle(testDiv).top) || 0
  document.body.removeChild(testDiv)

  return { top, bottom, left, right }
}

export function useSafeArea(): SafeAreaInsets {
  const [insets, setInsets] = useState<SafeAreaInsets>({ top: 0, bottom: 0, left: 0, right: 0 })

  useEffect(() => {
    setInsets(detectSafeArea())

    const handler = () => setInsets(detectSafeArea())
    window.addEventListener('resize', handler)
    window.addEventListener('orientationchange', handler)
    return () => {
      window.removeEventListener('resize', handler)
      window.removeEventListener('orientationchange', handler)
    }
  }, [])

  return insets
}

export function useSafeAreaStyle(): React.CSSProperties {
  const insets = useSafeArea()
  return {
    paddingTop: insets.top,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  }
}

export function useBottomInset(): number {
  return useSafeArea().bottom
}
