'use client'

import type { SafeAreaInsets } from '@/hooks/useSafeArea'

let Capacitor: any = null

try {
  if (typeof window !== 'undefined') {
    Capacitor = (window as any).Capacitor
  }
} catch {}

export function isNativePlatform(): boolean {
  return !!Capacitor?.isNative
}

export function getPlatform(): 'ios' | 'android' | 'web' {
  if (!Capacitor) {
    return 'web'
  }
  const platform = Capacitor.getPlatform()
  if (platform === 'ios') {
    return 'ios'
  }
  if (platform === 'android') {
    return 'android'
  }
  return 'web'
}

export async function getSafeAreaInsets(): Promise<SafeAreaInsets> {
  if (!isNativePlatform()) {
    return { top: 0, bottom: 0, left: 0, right: 0 }
  }
  try {
    const { StatusBar: SB } = await import('@capacitor/status-bar')
    const info = await SB.getInfo()
    const insets: SafeAreaInsets = { top: 0, bottom: 0, left: 0, right: 0 }
    if (getPlatform() === 'ios') {
      insets.top = info.visible ? 44 : 0
      insets.bottom = 34
    } else if (getPlatform() === 'android') {
      insets.top = info.visible ? 24 : 0
      insets.bottom = 0
    }
    return insets
  } catch {
    return { top: 0, bottom: 0, left: 0, right: 0 }
  }
}

export async function initializeCapacitorPlugins() {
  if (!isNativePlatform()) {
    return
  }

  try {
    const { StatusBar: SB } = await import('@capacitor/status-bar')
    await (SB as any).setStyle({ style: 'DARK' })
    await (SB as any).setBackgroundColor({ color: '#000000' })
  } catch {}

  try {
    const { SplashScreen: SS } = await import('@capacitor/splash-screen')
    await (SS as any).hide({ fadeOutDuration: 300 })
  } catch {}

  try {
    const { Keyboard: KB } = await import('@capacitor/keyboard')
    await (KB as any).setResizeMode({ mode: 'ionic' })
  } catch {}
}

export function setupHardwareBackButton(handlers: { onBack?: () => void; onExit?: () => void }) {
  if (!isNativePlatform()) {
    return () => {}
  }

  let cleanup: (() => void) | null = null

  const setup = async () => {
    try {
      const { App: AppPlugin } = await import('@capacitor/app')
      await AppPlugin.addListener('backButton', ({ canGoBack }: { canGoBack: boolean }) => {
        if (canGoBack) {
          handlers.onBack?.()
        } else {
          handlers.onExit?.()
        }
      })
      cleanup = () => {
        AppPlugin.removeAllListeners()
      }
    } catch {}
  }

  setup()

  return () => cleanup?.()
}

export function setupAppLifecycle(onReady?: () => void, onPause?: () => void, onResume?: () => void) {
  if (!isNativePlatform()) {
    return () => {}
  }

  const cleanup: (() => void)[] = []

  const setup = async () => {
    try {
      const { App: AppPlugin } = await import('@capacitor/app')
      AppPlugin.addListener('appStateChange', ({ isActive }: { isActive: boolean }) => {
        if (isActive) {
          onResume?.()
        } else {
          onPause?.()
        }
      })
      cleanup.push(() => AppPlugin.removeAllListeners())
    } catch {}
  }

  setup()
  onReady?.()

  return () => cleanup.forEach((fn) => fn())
}

export async function hideSplashScreen(fadeDuration = 300) {
  try {
    const { SplashScreen: SS } = await import('@capacitor/splash-screen')
    await (SS as any).hide({ fadeOutDuration: fadeDuration })
  } catch {}
}

export async function setStatusBarStyle(style: 'DARK' | 'LIGHT') {
  try {
    const { StatusBar: SB } = await import('@capacitor/status-bar')
    await (SB as any).setStyle({ style })
  } catch {}
}

export async function setStatusBarColor(color: string) {
  try {
    const { StatusBar: SB } = await import('@capacitor/status-bar')
    await (SB as any).setBackgroundColor({ color })
  } catch {}
}

export async function showStatusBar() {
  try {
    const { StatusBar: SB } = await import('@capacitor/status-bar')
    await (SB as any).show()
  } catch {}
}

export async function hideStatusBar() {
  try {
    const { StatusBar: SB } = await import('@capacitor/status-bar')
    await (SB as any).hide()
  } catch {}
}

export async function registerKeyboardListeners(onShow?: (height: number) => void, onHide?: () => void) {
  if (!isNativePlatform()) {
    return () => {}
  }

  try {
    const { Keyboard: KB } = await import('@capacitor/keyboard')
    KB.addListener('keyboardWillShow', (info: any) => onShow?.(info.keyboardHeight))
    KB.addListener('keyboardWillHide', () => onHide?.())
    return () => {
      KB.removeAllListeners()
    }
  } catch {
    return () => {}
  }
}

export async function registerBackgroundTask(task: () => Promise<void>, intervalMs: number = 300000) {
  const id = setInterval(task, intervalMs)
  return () => clearInterval(id)
}

export async function startBackgroundSync(syncFn: () => Promise<void>, intervalMs = 300000) {
  return registerBackgroundTask(async () => {
    try {
      await syncFn()
    } catch {}
  }, intervalMs)
}

export async function monitorNetworkConnectivity(onOnline: () => void, onOffline: () => void): Promise<() => void> {
  if (!isNativePlatform()) {
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }

  try {
    const { Network } = await import('@capacitor/network')
    Network.addListener('networkStatusChange', (status: any) => {
      if (status.connected) {
        onOnline()
      } else {
        onOffline()
      }
    })
    return () => {
      Network.removeAllListeners()
    }
  } catch {
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }
}

export async function getNetworkStatus(): Promise<{ connected: boolean; type: string }> {
  if (!isNativePlatform()) {
    return { connected: navigator.onLine, type: 'web' }
  }

  try {
    const { Network } = await import('@capacitor/network')
    const status = await Network.getStatus()
    return { connected: (status as any).connected ?? false, type: (status as any).connectionType ?? 'unknown' }
  } catch {
    return { connected: navigator.onLine, type: 'unknown' }
  }
}
