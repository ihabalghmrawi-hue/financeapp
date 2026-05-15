'use client'

import { useCallback } from 'react'
import { hapticsService } from '../haptics-service'
import type { HapticType } from '../haptics-service'

export function useHaptics() {
  const impact = useCallback(async (type: HapticType = 'medium') => {
    await hapticsService.impact(type)
  }, [])

  const success = useCallback(async () => {
    await hapticsService.success()
  }, [])
  const warning = useCallback(async () => {
    await hapticsService.warning()
  }, [])
  const error = useCallback(async () => {
    await hapticsService.error()
  }, [])
  const selection = useCallback(async () => {
    await hapticsService.selection()
  }, [])
  const vibrate = useCallback(async (ms = 50) => {
    await hapticsService.vibrate(ms)
  }, [])

  return { impact, success, warning, error, selection, vibrate }
}
