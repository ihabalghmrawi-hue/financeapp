'use client'

import type { ReactNode } from 'react'
import { MobileLayoutProvider, useMobileLayout } from '@/components/mobile/MobileLayoutProvider'
import { CapacitorBridge } from '@/components/mobile/CapacitorBridge'
import { BottomNavigation } from '@/components/mobile/BottomNavigation'
import { useSafeArea } from '@/hooks'
import { cn } from '@/lib/utils'
import { OfflineProvider } from '@/components/offline/OfflineProvider'
import { PushProvider } from '@/lib/push/react/push-provider'
import { NativeProvider } from '@/lib/native/react/native-provider'

function DashboardMobileLayoutInner({ children }: { children: ReactNode }) {
  const { isMobile } = useMobileLayout()
  const safeArea = useSafeArea()

  return (
    <>
      <div
        className={cn(isMobile && 'pb-16')}
        style={isMobile ? { paddingBottom: `calc(3.5rem + ${safeArea.bottom}px)` } : undefined}
      >
        {children}
      </div>
      {isMobile && <BottomNavigation />}
    </>
  )
}

interface DashboardMobileLayoutProps {
  children: ReactNode
  companyId?: string
  userId?: string
}

export function DashboardMobileLayout({ children, companyId, userId }: DashboardMobileLayoutProps) {
  return (
    <CapacitorBridge>
      <MobileLayoutProvider>
        <NativeProvider
          enableBiometricLock={false}
          enableScreenshotProtection={false}
          enableBackgroundProtection={true}
        >
          <PushProvider companyId={companyId} userId={userId}>
            <OfflineProvider companyId={companyId}>
              <DashboardMobileLayoutInner>{children}</DashboardMobileLayoutInner>
            </OfflineProvider>
          </PushProvider>
        </NativeProvider>
      </MobileLayoutProvider>
    </CapacitorBridge>
  )
}
