'use client'

import { useState, useEffect, useCallback } from 'react'
import { appLifecycleManager } from '../lifecycle/app-lifecycle'
import type { AppLifecycleState } from '../types'

export function useAppState() {
  const [state, setState] = useState<AppLifecycleState>(appLifecycleManager.currentState)

  useEffect(() => {
    const unsub = appLifecycleManager.on((s) => setState(s))
    appLifecycleManager.initialize()
    return unsub
  }, [])

  const onResume = useCallback((callback: () => void) => {
    appLifecycleManager.onResume(callback)
  }, [])

  const onBackground = useCallback((callback: () => void) => {
    appLifecycleManager.onBackground(callback)
  }, [])

  const onForeground = useCallback((callback: () => void) => {
    appLifecycleManager.onForeground(callback)
  }, [])

  return { state, isActive: state.isActive, isBackground: state.isBackground, onResume, onBackground, onForeground }
}
