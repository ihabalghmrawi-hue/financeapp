'use client'

import { Moon, Sun, Search, Settings } from 'lucide-react'
import { useTheme } from 'next-themes'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import type { Features } from '@/lib/features'
import { NotificationsPanel } from './notifications-panel'

const pageTitles: Record<string, string> = {
  '/dashboard': 'الملخص المالي',
  '/dashboard/pos': 'نقطة البيع',
  '/dashboard/sales': 'فواتير المبيعات',
  '/dashboard/returns': 'المرتجعات',
  '/dashboard/customers': 'العملاء',
  '/dashboard/shifts': 'الورديات',
  '/dashboard/purchases': 'فواتير الشراء',
  '/dashboard/suppliers': 'الموردون',
  '/dashboard/inventory': 'المنتجات',
  '/dashboard/inventory/movements': 'حركة المخزون',
  '/dashboard/inventory/variants': 'المتغيرات',
  '/dashboard/expenses': 'المصروفات',
  '/dashboard/journal': 'قيود المحاسبة',
  '/dashboard/wallet': 'الصندوق',
  '/dashboard/reports': 'التقارير',
  '/dashboard/reports/profit-loss': 'الأرباح والخسائر',
  '/dashboard/admin/staff': 'إدارة الموظفين',
  '/dashboard/admin/audit': 'سجل الأحداث',
  '/dashboard/categories': 'الفئات',
  '/dashboard/settings': 'الإعدادات',
}

interface TopBarProps {
  company: any
  user: any
  staff?: { name: string; role: string; permissions: string[] }
  features: Features
}

export function TopBar({ company, user, staff, features }: TopBarProps) {
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const title = pageTitles[pathname] || 'لوحة التحكم'

  return (
    <header className="h-14 border-b border-border/50 bg-card/80 backdrop-blur-xl flex items-center px-6 gap-4 shrink-0">
      <div className="flex-1">
        <h1 className="text-base font-semibold text-foreground">{title}</h1>
      </div>

      <div className="hidden md:flex items-center gap-2 bg-secondary/50 border border-border/50 rounded-xl px-3.5 py-2 w-52 transition-all duration-200 focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/10">
        <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        <input
          type="text"
          placeholder="بحث..."
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
