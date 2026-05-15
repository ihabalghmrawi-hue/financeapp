'use client'

import { useState, useEffect, useCallback } from 'react'

export type Orientation = 'portrait' | 'landscape'

export interface OrientationInfo {
  orientation: Orientation
  angle: number
  isPortrait: boolean
  isLandscape: boolean
}

function getOrientation(): OrientationInfo {
  if (typeof window === 'undefined' || !window.screen) {
    return { orientation: 'portrait', angle: 0, isPortrait: true, isLandscape: false }
  }

  const angle = window.screen.orientation?.angle ?? 0
  const isPortrait = angle === 0 || angle === 180
  return {
    orientation: isPortrait ? 'portrait' : 'landscape',
    angle,
    isPortrait,
    isLandscape: !isPortrait,
  }
}

export function useOrientation(): OrientationInfo {
  const [info, setInfo] = useState<OrientationInfo>(getOrientation)

  useEffect(() => {
    const handler = () => setInfo(getOrientation())
    window.addEventListener('orientationchange', handler)
    window.addEventListener('resize', handler)
    return () => {
      window.removeEventListener('orientationchange', handler)
      window.removeEventListener('resize', handler)
    }
  }, [])

  return info
}

export function useIsPortrait(): boolean {
  return useOrientation().isPortrait
}

export function useIsLandscape(): boolean {
  return useOrientation().isLandscape
}

export function useOrientationClass(): string {
  const { isPortrait, isLandscape } = useOrientation()
  if (isPortrait) {
    return 'orientation-portrait'
  }
  return 'orientation-landscape'
}
