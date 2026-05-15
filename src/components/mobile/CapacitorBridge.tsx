'use client'

import { useEffect, useRef } from 'react'
import { useDeviceDetection, useSafeArea } from '@/hooks'
import {
  initializeCapacitorPlugins,
  hideSplashScreen,
  setStatusBarStyle,
  setupHardwareBackButton,
  setupAppLifecycle,
} from '@/lib/capacitor'

interface CapacitorBridgeProps {
  children: React.ReactNode
}

export function CapacitorBridge({ children }: CapacitorBridgeProps) {
  const device = useDeviceDetection()
  const safeArea = useSafeArea()
  const initialized = useRef(false)

  useEffect(() => {
    if (!device.isCapacitor || initialized.current) {
      return
    }
    initialized.current = true

    initializeCapacitorPlugins()

    hideSplashScreen(300)

    const theme = document.documentElement.classList.contains('dark') ? 'DARK' : 'LIGHT'
    setStatusBarStyle(theme)

    const cleanupBack = setupHardwareBackButton({
      onBack: () => window.history.back(),
    })

    const cleanupLifecycle = setupAppLifecycle(
      () => {},
      () => {},
      () => {},
    )

    return () => {
      cleanupBack?.()
      cleanupLifecycle?.()
    }
  }, [device.isCapacitor])

  useEffect(() => {
    if (!device.isCapacitor) {
      return
    }
    const theme = document.documentElement.classList.contains('dark') ? 'DARK' : 'LIGHT'
    setStatusBarStyle(theme)
  }, [device.isCapacitor])

  useEffect(() => {
    if (!device.isCapacitor) {
      return
    }
    const style = document.createElement('style')
    style.id = 'capacitor-safe-area'
    style.textContent = `
      :root {
        --safe-area-top: ${safeArea.top}px;
        --safe-area-bottom: ${safeArea.bottom}px;
        --safe-area-left: ${safeArea.left}px;
        --safe-area-right: ${safeArea.right}px;
      }
    `
    document.head.appendChild(style)
    return () => style.remove()
  }, [device.isCapacitor, safeArea])

  return <>{children}</>
}

export function AndroidSafeArea() {
  const device = useDeviceDetection()
  const safeArea = useSafeArea()

  if (!device.isCapacitor) {
    return null
  }
  const isAndroid = device.os === 'android'

  if (!isAndroid) {
    return null
  }

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9999]"
      style={{
        paddingTop: safeArea.top,
        paddingBottom: safeArea.bottom,
        paddingLeft: safeArea.left,
        paddingRight: safeArea.right,
      }}
    >
      <div
        className="w-full h-full border border-transparent"
        style={{
          borderTopColor: safeArea.top > 0 ? 'transparent' : undefined,
          borderBottomColor: safeArea.bottom > 0 ? 'transparent' : undefined,
        }}
      />
    </div>
  )
}
