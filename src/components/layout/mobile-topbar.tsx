'use client'

import { Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useMobileLayout } from '@/components/mobile/MobileLayoutProvider'
import { useT } from '@/lib/i18n/language-provider'
import { useSafeArea, useIsCapacitor } from '@/hooks'
import { NotificationsPanel } from './notifications-panel'

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
  '/dashboard/construction': 'nav.construction',
  '/dashboard/construction/projects': 'nav.constructionProjects',
  '/dashboard/construction/workers': 'nav.constructionWorkers',
  '/dashboard/construction/tasks': 'nav.constructionTasks',

  '/dashboard/construction/materials': 'nav.constructionMaterials',
  '/dashboard/construction/payments': 'nav.constructionPayments',
  '/dashboard/construction/files': 'nav.constructionFiles',
  '/dashboard/construction/reports': 'nav.constructionReports',
  '/dashboard/construction/gantt': 'nav.constructionGantt',
  '/dashboard/construction/attendance': 'nav.constructionAttendance',
  '/dashboard/construction/purchase-orders': 'nav.constructionPurchaseOrders',
  '/dashboard/construction/daily-logs': 'nav.constructionDailyLogs',
  '/dashboard/construction/change-orders': 'nav.constructionChangeOrders',
}

function resolveTitle(pathname: string, t: (k: string) => string): string {
  if (pageTitles[pathname]) {
    return t(pageTitles[pathname])
  }
  // Fallback: walk up the path
  const parts = pathname.split('/').filter(Boolean)
  while (parts.length > 0) {
    parts.pop()
    const candidate = `/${parts.join('/')}`
    if (pageTitles[candidate]) {
      return t(pageTitles[candidate])
    }
  }
  return t('nav.dashboard')
}

export function MobileTopBar() {
  const { t } = useT()
  const pathname = usePathname()
  const { openSidebar } = useMobileLayout()
  const safeArea = useSafeArea()
  const isCapacitor = useIsCapacitor()
  const title = resolveTitle(pathname, t)

  return (
    <header
      className="sticky top-0 z-30 bg-card/90 backdrop-blur-xl border-b border-border/50 flex items-center px-3 gap-2 h-14 shrink-0"
      style={{ paddingTop: isCapacitor ? safeArea.top : 0 }}
    >
      <button
        onClick={openSidebar}
        aria-label={t('mobile.menu') || 'Menu'}
        className="p-2 -m-2 rounded-xl hover:bg-secondary active:bg-secondary/70 text-foreground transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
      >
        <Menu className="w-5 h-5" />
      </button>
      <h1 className="flex-1 text-base font-semibold text-foreground truncate">{title}</h1>
      <NotificationsPanel />
    </header>
  )
}
