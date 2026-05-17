'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ShoppingBag,
  Users,
  Truck,
  BarChart3,
  Settings,
  Wallet,
  Receipt,
  DollarSign,
  Tag,
  Warehouse,
  TrendingUp,
  RotateCcw,
  Clock,
  Shield,
  UserCog,
  LogOut,
  Layers,
  Shirt,
  Calendar,
  CalendarDays,
  Trash2 as Trash2Icon,
  AlertOctagon,
  ShieldCheck,
  Building2,
  HardHat,
  CheckSquare,
  PackageOpen,
  CreditCard,
  ChevronLeft,
  FileText,
} from 'lucide-react'
import { cn, getInitials } from '@/lib/utils'
import type { Features } from '@/lib/features'
import type { Branding } from '@/lib/branding'
import type { Company } from '@/types/database'
import { motion } from 'framer-motion'
import { useT } from '@/lib/i18n/language-provider'

interface StaffInfo {
  name: string
  role: string
  permissions: string[]
}

interface SidebarProps {
  company: Company
  user: any
  staff?: StaffInfo
  features: Features
  branding?: Branding
}

function can(staff: StaffInfo | undefined, perm: string): boolean {
  if (!staff) {
    return true
  }
  if (staff.role === 'admin' || staff.role === 'owner') {
    return true
  }
  if (staff.permissions.includes('*')) {
    return true
  }
  return staff.permissions.includes(perm)
}

export function Sidebar({ company, user, staff, features, branding }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useT()

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/staff-login')
  }

  const navGroups = [
    {
      label: t('nav.main'),
      items: [{ label: t('nav.dashboard'), href: '/dashboard', icon: LayoutDashboard, show: true }],
    },
    {
      label: t('nav.salesSection'),
      items: [
        {
          label: t('nav.pos'),
          href: '/dashboard/pos',
          icon: ShoppingCart,
          show: features.showPOS && can(staff, 'pos.access'),
        },
        {
          label: t('nav.sales'),
          href: '/dashboard/sales',
          icon: Receipt,
          show: features.showPOS && can(staff, 'returns.view'),
        },
        {
          label: t('nav.returns'),
          href: '/dashboard/returns',
          icon: RotateCcw,
          show: features.showReturns && can(staff, 'returns.view'),
        },
        {
          label: t('nav.customers'),
          href: '/dashboard/customers',
          icon: Users,
          show: features.showPOS && can(staff, 'customers.view'),
        },
        {
          label: t('nav.shifts'),
          href: '/dashboard/shifts',
          icon: Clock,
          show: features.showShifts && can(staff, 'shifts.manage'),
        },
      ],
    },
    {
      label: t('nav.purchasesSection'),
      items: [
        {
          label: t('nav.purchases'),
          href: '/dashboard/purchases',
          icon: ShoppingBag,
          show: features.showPurchases && can(staff, 'purchases.view'),
        },
        {
          label: t('nav.suppliers'),
          href: '/dashboard/suppliers',
          icon: Truck,
          show: features.showPurchases && can(staff, 'purchases.view'),
        },
      ],
    },
    {
      label: t('nav.warehouseSection'),
      items: [
        {
          label: t('nav.inventory'),
          href: '/dashboard/inventory',
          icon: Package,
          show: features.showInventory && can(staff, 'inventory.view'),
        },
        {
          label: t('nav.warehouses'),
          href: '/dashboard/warehouses',
          icon: Building2,
          show: features.showInventory && can(staff, 'inventory.view'),
        },
        {
          label: t('nav.inventoryMovements'),
          href: '/dashboard/inventory/movements',
          icon: Warehouse,
          show: features.showInventory && can(staff, 'inventory.view'),
        },
      ],
    },
    {
      label: t('nav.financialSection'),
      items: [
        {
          label: t('nav.expenses'),
          href: '/dashboard/expenses',
          icon: DollarSign,
          show: !features.hasConstruction && can(staff, 'expenses.view'),
        },
        {
          label: t('nav.wallet'),
          href: '/dashboard/wallet',
          icon: Wallet,
          show: !features.hasConstruction && can(staff, 'reports.view'),
        },
      ],
    },
    {
      label: t('nav.reportsSection'),
      items: [
        {
          label: t('nav.reports'),
          href: '/dashboard/reports',
          icon: BarChart3,
          show: !features.hasConstruction && can(staff, 'reports.view'),
        },
        {
          label: t('nav.profitLoss'),
          href: '/dashboard/reports/profit-loss',
          icon: TrendingUp,
          show: !features.hasConstruction && can(staff, 'reports.view'),
        },
      ],
    },
    {
      label: t('nav.constructionSection'),
      items: [
        {
          label: t('nav.construction'),
          href: '/dashboard/construction',
          icon: HardHat,
          show: features.hasConstruction,
        },
        {
          label: t('nav.constructionProjects'),
          href: '/dashboard/construction/projects',
          icon: Building2,
          show: features.hasConstruction,
        },
        {
          label: t('nav.constructionWorkers'),
          href: '/dashboard/construction/workers',
          icon: Users,
          show: features.hasConstruction,
        },
        {
          label: t('nav.constructionTasks'),
          href: '/dashboard/construction/tasks',
          icon: CheckSquare,
          show: features.hasConstruction,
        },
        {
          label: t('nav.constructionMaterials'),
          href: '/dashboard/construction/materials',
          icon: PackageOpen,
          show: features.hasConstruction,
        },
        {
          label: t('nav.constructionPayments'),
          href: '/dashboard/construction/payments',
          icon: CreditCard,
          show: features.hasConstruction,
        },
        {
          label: t('nav.constructionFiles'),
          href: '/dashboard/construction/files',
          icon: FileText,
          show: features.hasConstruction,
        },
        {
          label: t('nav.constructionReports'),
          href: '/dashboard/construction/reports',
          icon: BarChart3,
          show: features.hasConstruction,
        },
      ],
    },
    {
      label: t('nav.rentalSection'),
      items: [
        { label: t('nav.rentals'), href: '/dashboard/rentals', icon: LayoutDashboard, show: features.hasRental },
        { label: t('nav.dresses'), href: '/dashboard/rentals/dresses', icon: Shirt, show: features.hasRental },
        {
          label: t('nav.quickBooking'),
          href: '/dashboard/rentals/bookings/new',
          icon: Calendar,
          show: features.hasRental,
        },
        { label: t('nav.bookings'), href: '/dashboard/rentals/bookings', icon: CalendarDays, show: features.hasRental },
        {
          label: t('nav.rentalCalendar'),
          href: '/dashboard/rentals/calendar',
          icon: CalendarDays,
          show: features.hasRental,
        },
        {
          label: t('nav.rentalReturns'),
          href: '/dashboard/rentals/returns',
          icon: RotateCcw,
          show: features.hasRental,
        },
        { label: t('nav.pricingRules'), href: '/dashboard/rentals/pricing', icon: Tag, show: features.hasRental },
      ],
    },
    {
      label: t('nav.managementSection'),
      items: [
        { label: t('nav.staff'), href: '/dashboard/admin/staff', icon: UserCog, show: can(staff, 'admin.staff') },
        { label: t('nav.auditLog'), href: '/dashboard/admin/audit', icon: Shield, show: can(staff, 'admin.audit') },
        {
          label: t('nav.dataIntegrity'),
          href: '/dashboard/admin/integrity',
          icon: ShieldCheck,
          show: can(staff, 'admin.audit'),
        },
        { label: t('nav.categories'), href: '/dashboard/categories', icon: Tag, show: can(staff, 'admin.settings') },
        { label: t('nav.settings'), href: '/dashboard/settings', icon: Settings, show: can(staff, 'admin.settings') },
        {
          label: t('nav.backup'),
          href: '/dashboard/settings/backup',
          icon: Shield,
          show: can(staff, 'admin.settings'),
        },
        {
          label: t('nav.trash'),
          href: '/dashboard/settings/trash',
          icon: Trash2Icon,
          show: can(staff, 'admin.settings'),
        },
        {
          label: t('nav.dangerZone'),
          href: '/dashboard/settings/danger',
          icon: AlertOctagon,
          show: can(staff, 'admin.settings'),
        },
      ],
    },
  ]

  const ROLE_LABELS: Record<string, string> = {
    admin: t('roles.admin'),
    manager: t('roles.manager'),
    cashier: t('roles.cashier'),
  }

  return (
    <aside className="w-60 bg-card border-l border-border/50 flex flex-col h-screen shrink-0">
      {/* Company Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          {branding?.logo_url ? (
            <img
              src={branding.logo_url}
              alt="logo"
              className="w-9 h-9 rounded-xl object-contain bg-card p-0.5 shadow-sm shrink-0"
            />
          ) : (
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold text-sm shadow-sm shrink-0">
              {getInitials(branding?.name_ar || company?.name || 'ش')}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">
              {branding?.name_ar || company?.name || 'شركتي'}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span>{features.icon}</span>
              <span>{features.label}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 no-scrollbar">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((i) => i.show)
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
                    className={cn(
                      'flex items-center gap-2.5 px-4 py-2 mx-2 rounded-xl text-sm transition-all duration-200',
                      active
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/70',
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                    {active && (
                      <motion.div layoutId="sidebar-active" className="w-1 h-1 rounded-full bg-primary mr-auto" />
                    )}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* Staff Footer */}
      <div className="p-3 border-t border-border/50">
        <div className="flex items-center gap-2 px-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0">
            {(staff?.name || 'م')[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{staff?.name || 'المدير'}</p>
            <p className="text-[10px] text-muted-foreground">{ROLE_LABELS[staff?.role || 'admin'] || staff?.role}</p>
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
    </aside>
  )
}
