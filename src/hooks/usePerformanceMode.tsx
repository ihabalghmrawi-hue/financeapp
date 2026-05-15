'use client'

import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react'
import { useReducedMotion } from './useBreakpoint'
import { Capacitor } from '@capacitor/core'

type PerformanceLevel = 'high' | 'medium' | 'low'

export interface PerformanceMode {
  level: PerformanceLevel
  isLowEnd: boolean
  disableAnimations: boolean
  reducedParticleEffects: boolean
  disableGlassBlur: boolean
  chartSimplified: boolean
  throttleAnimations: boolean
  deviceMemory: number
  deviceCores: number
}

const defaultPerformance: PerformanceMode = {
  level: 'high',
  isLowEnd: false,
  disableAnimations: false,
  reducedParticleEffects: false,
  disableGlassBlur: false,
  chartSimplified: false,
  throttleAnimations: false,
  deviceMemory: 0,
  deviceCores: 0,
}

const PerformanceContext = createContext<PerformanceMode>(defaultPerformance)

function detectPerformanceLevel(): PerformanceMode {
  const mem = (navigator as any).deviceMemory || 8
  const cores = navigator.hardwareConcurrency || 8
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  const isCapacitor = Capacitor.isNativePlatform()

  const isLowEnd = (mem <= 2 && cores <= 4) || (isMobile && cores <= 4 && mem <= 3)
  const isMidRange = (mem <= 4 && cores <= 6) || (isMobile && cores <= 6 && mem <= 4)

  return {
    level: isLowEnd ? 'low' : isMidRange ? 'medium' : 'high',
    isLowEnd,
    disableAnimations: isLowEnd,
    reducedParticleEffects: isLowEnd || isMidRange,
    disableGlassBlur: isLowEnd,
    chartSimplified: isLowEnd,
    throttleAnimations: isLowEnd || isMidRange,
    deviceMemory: mem,
    deviceCores: cores,
  }
}

export function PerformanceProvider({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion()
  const [perf, setPerf] = useState<PerformanceMode>(defaultPerformance)

  useEffect(() => {
    setPerf(detectPerformanceLevel())
  }, [])

  const value = useMemo(
    () => ({
      ...perf,
      disableAnimations: perf.disableAnimations || reducedMotion,
    }),
    [perf, reducedMotion],
  )

  return <PerformanceContext.Provider value={value}>{children}</PerformanceContext.Provider>
}

export function usePerformanceMode() {
  return useContext(PerformanceContext)
}

export function useAnimationConfig() {
  const perf = usePerformanceMode()

  return useMemo(
    () => ({
      disabled: perf.disableAnimations,
      reduced: perf.disableAnimations,
      duration: perf.disableAnimations ? 0 : undefined,
      transition: perf.throttleAnimations ? { duration: 0.15 } : undefined,
      initial: perf.disableAnimations ? { opacity: 1, y: 0 } : undefined,
      animate: perf.disableAnimations ? { opacity: 1, y: 0 } : undefined,
    }),
    [perf],
  )
}
