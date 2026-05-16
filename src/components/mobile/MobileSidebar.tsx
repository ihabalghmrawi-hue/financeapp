'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { X, LogOut, type LucideIcon } from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import { useMobileLayout } from './MobileLayoutProvider'
import { useT } from '@/lib/i18n/language-provider'
import { useSwipeGesture } from '@/hooks'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
}

interface MobileSidebarProps {
  navGroups: Array<{
    label: string
    items: Array<{ label: string; href: string; icon: LucideIcon; show?: boolean }>
  }>
  companyName: string
  staffName?: string
  staffRole?: string
  featuresIcon?: string
  featuresLabel?: string
  brandingLogo?: string | null
  top?: number
  userName?: string
  userEmail?: string
}

export function MobileSidebar({
  navGroups,
  companyName,
  staffName,
  staffRole,
  featuresIcon,
  featuresLabel,
  brandingLogo,
  top = 0,
  userName,
  userEmail,
}: MobileSidebarProps) {
  const { t } = useT()
  const pathname = usePathname()
  const router = useRouter()
  const { sidebarState, closeSidebar } = useMobileLayout()
  const closeMobileSidebar = closeSidebar
  const isMobileSidebarOpen = sidebarState === 'open'
  const sidebarRef = useRef<HTMLDivElement>(null)
  const { onTouchStart, onTouchMove, onTouchEnd } = useSwipeGesture(
    { onSwipeLeft: closeMobileSidebar },
    { threshold: 80 },
  )

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/staff-login')
  }

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const ROLE_LABELS: Record<string, string> = {
    admin: t('roles.admin'),
    manager: t('roles.manager'),
    cashier: t('roles.cashier'),
  }

  if (!isMobileSidebarOpen) {
    return null
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 animate-fade-in" onClick={closeMobileSidebar} />

      {/* Sidebar panel */}
      <div
        ref={sidebarRef}
        className="fixed right-0 top-0 bottom-0 w-72 bg-card border-l border-border/50 z-50 shadow-premium-lg animate-slide-in overflow-hidden"
        dir="rtl"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {brandingLogo ? (
                <img
                  src={brandingLogo}
                  alt="logo"
                  className="w-9 h-9 rounded-xl object-contain bg-card p-0.5 shadow-sm shrink-0"
                />
              ) : (
                <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold text-sm shadow-sm shrink-0">
                  {getInitials(companyName)}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">{companyName}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <span>{featuresIcon}</span>
                  <span>{featuresLabel}</span>
                </p>
              </div>
            </div>
            <button
              onClick={closeMobileSidebar}
              className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-3 no-scrollbar">
            {navGroups.map((group) => {
              const visibleItems = group.items.filter((i) => i.show !== false)
              if (visibleItems.length === 0) {
                return null
              }
              return (
                <div key={group.label} className="mb-1">
                  <p className="text-[10px] font-semibold text-muted-foreground/40 uppercase tracking-widest px-4 py-1.5">
                    {group.label}
                  </p>
                  {visibleItems.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMobileSidebar}
                        className={cn(
                          'flex items-center gap-2.5 px-4 py-2.5 mx-2 rounded-xl text-sm transition-all duration-200',
                          active
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70',
                        )}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    )
                  })}
                </div>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-border/50">
            <div className="flex items-center gap-2 px-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0">
                {(staffName || userName || 'م')[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">
                  {staffName || userName || t('roles.manager')}
                </p>
                <p className="text-[10px] text-muted-foreground">{ROLE_LABELS[staffRole || 'admin'] || staffRole}</p>
              </div>
              <button
                onClick={handleLogout}
                title={t('common.logout')}
                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
