'use client'

import { useState, useEffect } from 'react'

export type DeviceType = 'mobile' | 'tablet' | 'desktop'
export type Platform = 'ios' | 'android' | 'web'
export type OS = 'ios' | 'android' | 'windows' | 'mac' | 'linux' | 'unknown'

export interface DeviceInfo {
  type: DeviceType
  platform: Platform
  os: OS
  isTouch: boolean
  isCapacitor: boolean
  isStandalone: boolean
  pixelRatio: number
  screenWidth: number
  screenHeight: number
  hasNotch: boolean
}

function detectDevice(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      type: 'desktop',
      platform: 'web',
      os: 'unknown',
      isTouch: false,
      isCapacitor: false,
      isStandalone: false,
      pixelRatio: 1,
      screenWidth: 1024,
      screenHeight: 768,
      hasNotch: false,
    }
  }

  const ua = navigator.userAgent
  const isCapacitor = typeof (window as any).Capacitor !== 'undefined' && !!(window as any).Capacitor.isNative
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Mac') && 'ontouchend' in document)
  const isAndroid = /Android/.test(ua)
  const isTouch = 'ontouchend' in document
  const pixelRatio = window.devicePixelRatio || 1
  const w = window.innerWidth
  const h = window.innerHeight

  let type: DeviceType = 'desktop'
  if (isTouch && w < 768) {
    type = 'mobile'
  } else if (isTouch && w < 1024) {
    type = 'tablet'
  }

  let platform: Platform = 'web'
  if (isCapacitor && isIOS) {
    platform = 'ios'
  } else if (isCapacitor && isAndroid) {
    platform = 'android'
  }

  let os: OS = 'unknown'
  if (isIOS) {
    os = 'ios'
  } else if (isAndroid) {
    os = 'android'
  } else if (ua.includes('Windows')) {
    os = 'windows'
  } else if (ua.includes('Mac')) {
    os = 'mac'
  } else if (ua.includes('Linux')) {
    os = 'linux'
  }

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true

  const hasNotch = isIOS && (pixelRatio >= 3 || (w === 375 && h >= 812) || (w === 414 && h >= 896))

  return {
    type,
    platform,
    os,
    isTouch,
    isCapacitor,
    isStandalone,
    pixelRatio,
    screenWidth: w,
    screenHeight: h,
    hasNotch,
  }
}

export function useDeviceDetection(): DeviceInfo {
  const [info, setInfo] = useState<DeviceInfo>(detectDevice)

  useEffect(() => {
    setInfo(detectDevice())
    const handler = () => setInfo(detectDevice())
    window.addEventListener('resize', handler)
    window.addEventListener('orientationchange', handler)
    return () => {
      window.removeEventListener('resize', handler)
      window.removeEventListener('orientationchange', handler)
    }
  }, [])

  return info
}

export function useIsCapacitor(): boolean {
  const info = useDeviceDetection()
  return info.isCapacitor
}
