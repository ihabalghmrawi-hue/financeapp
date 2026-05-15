'use client'

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react'
import { useBreakpoint, useSafeArea, useDeviceDetection, useOrientation } from '@/hooks'
import { isNativePlatform, initializeCapacitorPlugins, setupAppLifecycle } from '@/lib/capacitor'
import { cn } from '@/lib/utils'

export type MobileNavVariant = 'bottom-tabs' | 'sidebar' | 'drawer'
export type SidebarState = 'open' | 'closed' | 'collapsed'

interface MobileLayoutState {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  sidebarState: SidebarState
  bottomNavOpen: boolean
  mobileNavVariant: MobileNavVariant
  isCapacitor: boolean
  safeAreaInsets: { top: number; bottom: number; left: number; right: number }
  orientation: 'portrait' | 'landscape'
  isKeyboardOpen: boolean
  keyboardHeight: number
}

interface MobileLayoutActions {
  setSidebarState: (state: SidebarState) => void
  toggleSidebar: () => void
  setBottomNavOpen: (open: boolean) => void
  setMobileNavVariant: (variant: MobileNavVariant) => void
  openSidebar: () => void
  closeSidebar: () => void
}

const MobileLayoutContext = createContext<(MobileLayoutState & MobileLayoutActions) | null>(null)

export function useMobileLayout() {
  const ctx = useContext(MobileLayoutContext)
  if (!ctx) {
    throw new Error('useMobileLayout must be used within MobileLayoutProvider')
  }
  return ctx
}

interface MobileLayoutProviderProps {
  children: ReactNode
  defaultNavVariant?: MobileNavVariant
}

export function MobileLayoutProvider({ children, defaultNavVariant = 'bottom-tabs' }: MobileLayoutProviderProps) {
  const bp = useBreakpoint()
  const device = useDeviceDetection()
  const safeArea = useSafeArea()
  const orientation = useOrientation()
  const [sidebarState, setSidebarState] = useState<SidebarState>('closed')
  const [bottomNavOpen, setBottomNavOpen] = useState(true)
  const [mobileNavVariant, setMobileNavVariant] = useState<MobileNavVariant>(defaultNavVariant)
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const initialized = useRef(false)

  const isMobile = bp === 'xs' || bp === 'sm'
  const isTablet = bp === 'md' || (bp === 'lg' && device.isTouch)
  const isDesktop = !isMobile && !isTablet

  useEffect(() => {
    if (isDesktop) {
      setSidebarState('open')
    } else {
      setSidebarState('closed')
    }
  }, [isDesktop])

  useEffect(() => {
    if (initialized.current || !device.isCapacitor) {
      return
    }
    initialized.current = true
    initializeCapacitorPlugins()
    setupAppLifecycle()
  }, [device.isCapacitor])

  useEffect(() => {
    if (!device.isCapacitor) {
      return
    }
    const setupKeyboard = async () => {
      try {
        const { Keyboard } = await import('@capacitor/keyboard')
        Keyboard.addListener('keyboardWillShow', (info: any) => {
          setIsKeyboardOpen(true)
          setKeyboardHeight(info.keyboardHeight)
        })
        Keyboard.addListener('keyboardWillHide', () => {
          setIsKeyboardOpen(false)
          setKeyboardHeight(0)
        })
      } catch {}
    }
    setupKeyboard()
  }, [device.isCapacitor])

  const toggleSidebar = useCallback(() => {
    setSidebarState((prev) => (prev === 'open' ? 'closed' : 'open'))
  }, [])

  const openSidebar = useCallback(() => setSidebarState('open'), [])
  const closeSidebar = useCallback(() => setSidebarState('closed'), [])

  return (
    <MobileLayoutContext.Provider
      value={{
        isMobile,
        isTablet,
        isDesktop,
        sidebarState,
        bottomNavOpen,
        mobileNavVariant,
        isCapacitor: device.isCapacitor,
        safeAreaInsets: safeArea,
        orientation: orientation.orientation,
        isKeyboardOpen,
        keyboardHeight,
        setSidebarState,
        toggleSidebar,
        setBottomNavOpen,
        setMobileNavVariant,
        openSidebar,
        closeSidebar,
      }}
    >
      {children}
    </MobileLayoutContext.Provider>
  )
}

export function MobileLayoutContent({ children, className }: { children: ReactNode; className?: string }) {
  const { isMobile, isDesktop, sidebarState, safeAreaInsets, keyboardHeight } = useMobileLayout()

  const sidebarOffset = isDesktop && sidebarState === 'open' ? 240 : 0

  return (
    <div
      className={cn('flex flex-col flex-1 transition-all duration-300 ease-in-out', className)}
      style={{
        paddingTop: isMobile ? safeAreaInsets.top : 0,
        paddingBottom: isMobile ? safeAreaInsets.bottom + keyboardHeight : 0,
        marginRight: sidebarOffset,
      }}
    >
      {children}
    </div>
  )
}
