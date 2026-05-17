'use client'

import type { ReactNode } from 'react'
import { MobileLayoutProvider, useMobileLayout } from '@/components/mobile/MobileLayoutProvider'
import { CapacitorBridge } from '@/components/mobile/CapacitorBridge'
import { BottomNavigation } from '@/components/mobile/BottomNavigation'
import { MobileSidebar } from '@/components/mobile/MobileSidebar'
import { MobileTopBar } from '@/components/layout/mobile-topbar'
import { useNavGroups, pickBottomNavItems } from '@/components/layout/use-nav-groups'
import { useSafeArea } from '@/hooks'
import { cn } from '@/lib/utils'
import { OfflineProvider } from '@/components/offline/OfflineProvider'
import { PushProvider } from '@/lib/push/react/push-provider'
import { NativeProvider } from '@/lib/native/react/native-provider'
import { MoreHorizontal } from 'lucide-react'
import type { Features } from '@/lib/features'
import type { Branding } from '@/lib/branding'
import { useT } from '@/lib/i18n/language-provider'

interface StaffInfo {
  name: string
  role: string
  permissions: string[]
}

interface InnerProps {
  children: ReactNode
  features: Features
  staff?: StaffInfo
  companyName: string
  branding?: Branding | null
}

function DashboardMobileLayoutInner({ children, features, staff, companyName, branding }: InnerProps) {
  const { isMobile } = useMobileLayout()
  const safeArea = useSafeArea()
  const navGroups = useNavGroups(features, staff)
  const { t } = useT()

  // Bottom nav: first 4 most relevant items + "More" that opens the drawer
  const bottomItems = pickBottomNavItems(navGroups, 4)
  const moreItem = {
    label: t('mobile.more') || 'المزيد',
    href: '__open_drawer__',
    icon: MoreHorizontal,
  }
  const bottomNavItems = [...bottomItems.map((i) => ({ label: i.label, href: i.href, icon: i.icon })), moreItem]

  return (
    <>
      <div
        className={cn(isMobile && 'pb-16')}
        style={isMobile ? { paddingBottom: `calc(4rem + ${safeArea.bottom}px)` } : undefined}
      >
        {children}
      </div>

      {isMobile && (
        <>
          <MobileSidebar
            navGroups={navGroups}
            companyName={companyName}
            staffName={staff?.name}
            staffRole={staff?.role}
            featuresIcon={features.icon}
            featuresLabel={features.label}
            brandingLogo={branding?.logo_url || null}
          />
          <BottomNavigation items={bottomNavItems} />
        </>
      )}
    </>
  )
}

interface DashboardMobileLayoutProps {
  children: ReactNode
  companyId?: string
  userId?: string
  features: Features
  staff?: StaffInfo
  companyName: string
  branding?: Branding | null
}

export function DashboardMobileLayout({
  children,
  companyId,
  userId,
  features,
  staff,
  companyName,
  branding,
}: DashboardMobileLayoutProps) {
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
              <DashboardMobileLayoutInner
                features={features}
                staff={staff}
                companyName={companyName}
                branding={branding}
              >
                {children}
              </DashboardMobileLayoutInner>
            </OfflineProvider>
          </PushProvider>
        </NativeProvider>
      </MobileLayoutProvider>
    </CapacitorBridge>
  )
}
