'use client'

import { useCallback, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  BarChart3,
  Settings,
  MoreHorizontal,
  Wallet,
  Users,
  Receipt,
  Warehouse,
  ArrowLeftRight,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSafeArea, useIsCapacitor } from '@/hooks'
import { useMobileLayout } from './MobileLayoutProvider'
import { useT } from '@/lib/i18n/language-provider'
import { useNetworkStatus } from '@/lib/offline/react/use-network-status'
import { useSyncStatus } from '@/lib/offline/react/use-sync-status'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

const getDefaultItems = (t: (key: string) => string): NavItem[] => [
  { label: t('nav.dashboard'), href: '/dashboard', icon: LayoutDashboard },
  { label: t('nav.sales'), href: '/dashboard/sales', icon: Receipt },
  { label: t('nav.inventory'), href: '/dashboard/inventory', icon: Package },
  { label: t('nav.expenses'), href: '/dashboard/expenses', icon: Wallet },
  { label: t('mobile.more'), href: '#', icon: MoreHorizontal },
]

interface BottomNavigationProps {
  items?: NavItem[]
  className?: string
}

export function BottomNavigation({ items, className }: BottomNavigationProps) {
  const { t } = useT()
  const resolvedItems = items ?? getDefaultItems(t)
  const pathname = usePathname()
  const safeArea = useSafeArea()
  const isCapacitor = useIsCapacitor()
  const { isKeyboardOpen } = useMobileLayout()
  const { isOnline } = useNetworkStatus()
  const { pendingCount, failedCount, isSyncing } = useSyncStatus()

  const isActive = useCallback(
    (href: string) => {
      if (href === '#') {
        return false
      }
      if (href === '/dashboard') {
        return pathname === '/dashboard'
      }
      return pathname.startsWith(href)
    },
    [pathname],
  )

  const visibleItems = useMemo(() => resolvedItems.slice(0, 5), [resolvedItems])

  if (isKeyboardOpen) {
    return null
  }

  return (
    <nav
      className={cn(
        'fixed bottom-0 inset-x-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border/50 safe-area-bottom',
        className,
      )}
      style={{
        paddingBottom: isCapacitor ? safeArea.bottom : 0,
      }}
    >
      <div className="flex items-center justify-around h-16">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 min-w-[64px] h-full px-2 py-1.5 rounded-2xl transition-all duration-200',
                active ? 'text-primary' : 'text-muted-foreground/60 hover:text-muted-foreground',
              )}
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200',
                  active && 'bg-primary/10',
                )}
              >
                <Icon className={cn('h-5 w-5', active && '')} />
              </div>
              <span className={cn('text-[10px] leading-tight', active ? 'font-semibold' : 'font-medium')}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>

      {/* Status indicators */}
      <div className="absolute top-1 right-1 flex gap-1">
        {!isOnline && <div className="h-2 w-2 rounded-full bg-destructive shadow-sm" title={t('mobile.offline')} />}
        {isSyncing && (
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse-soft shadow-sm" title={t('mobile.syncing')} />
        )}
        {failedCount > 0 && (
          <div className="h-2 w-2 rounded-full bg-warning shadow-sm" title={`${failedCount} ${t('mobile.failed')}`} />
        )}
      </div>
    </nav>
  )
}

export function MobileTabBar({ className }: { className?: string }) {
  return <BottomNavigation className={className} />
}
