'use client'

import { useBreakpoint, useDeviceDetection, useOrientation } from './index'

export interface MobileInfo {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isTouch: boolean
  isAndroid: boolean
  isIOS: boolean
  isCapacitor: boolean
  isStandalone: boolean
  isPortrait: boolean
  isLandscape: boolean
  hasNotch: boolean
}

export function useMobileInfo(): MobileInfo {
  const bp = useBreakpoint()
  const device = useDeviceDetection()
  const orientation = useOrientation()

  return {
    isMobile: bp === 'xs' || bp === 'sm',
    isTablet: bp === 'md' || (bp === 'lg' && device.isTouch),
    isDesktop: bp === 'xl' || bp === '2xl' || (bp === 'lg' && !device.isTouch),
    isTouch: device.isTouch,
    isAndroid: device.os === 'android',
    isIOS: device.os === 'ios',
    isCapacitor: device.isCapacitor,
    isStandalone: device.isStandalone,
    isPortrait: orientation.isPortrait,
    isLandscape: orientation.isLandscape,
    hasNotch: device.hasNotch,
  }
}
