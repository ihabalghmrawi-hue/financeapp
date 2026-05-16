'use client'

import { Moon, Sun, Search, Settings } from 'lucide-react'
import { useTheme } from 'next-themes'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import type { Features } from '@/lib/features'
import { NotificationsPanel } from './notifications-panel'
import { useT } from '@/lib/i18n/language-provider'

const pageTitles: Record<string, string> = {
  '/dashboard': 'nav.dashboard',
  '/dashboard/pos': 'nav.pos',
  '/dashboard/sales': 'nav.sales',
  '/dashboard/returns': 'nav.returns',
  '/dashboard/customers': 'nav.customers',
  '/dashboard/shifts': 'nav.shifts',
  '/dashboard/purchases': 'nav.purchases',
  '/dashboard/suppliers': 'nav.suppliers',
  '/dashboard/inventory': 'nav.inventory',
  '/dashboard/inventory/movements': 'nav.inventoryMovements',
  '/dashboard/inventory/variants': 'nav.variants',
  '/dashboard/expenses': 'nav.expenses',
  '/dashboard/journal': 'nav.journal',
  '/dashboard/wallet': 'nav.wallet',
  '/dashboard/reports': 'nav.reports',
  '/dashboard/reports/profit-loss': 'nav.profitLoss',
  '/dashboard/admin/staff': 'nav.staff',
  '/dashboard/admin/audit': 'nav.auditLog',
  '/dashboard/categories': 'nav.categories',
  '/dashboard/settings': 'nav.settings',
}

interface TopBarProps {
  company: any
  user: any
  staff?: { name: string; role: string; permissions: string[] }
  features: Features
}

export function TopBar({ company, user, staff, features }: TopBarProps) {
  const { theme, setTheme } = useTheme()
  const { t } = useT()
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const titleKey = pageTitles[pathname] || 'nav.dashboard'
  const title = t(titleKey)

  return (
    <header className="h-14 border-b border-border/50 bg-card/80 backdrop-blur-xl flex items-center px-6 gap-4 shrink-0">
      <div className="flex-1">
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
      </div>

      <div className="hidden md:flex items-center gap-2 bg-secondary/50 border border-border/50 rounded-xl px-3.5 py-2 w-52 transition-all duration-200 focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/10">
        <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <input
          type="text"
          placeholder={t('topbar.search')}
          className="bg-transparent text-sm focus:outline-none text-foreground placeholder:text-muted-foreground/50 w-full"
        />
      </div>

      <div className="flex items-center gap-1">
        <span className="text-lg" title={features.label}>
          {features.icon}
        </span>

        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-all duration-200"
          suppressHydrationWarning
        >
          {mounted && theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <NotificationsPanel />

        {staff?.role === 'admin' && (
          <button
            onClick={() => router.push('/dashboard/settings')}
            className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-all duration-200"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  )
}
