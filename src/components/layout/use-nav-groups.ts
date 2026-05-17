'use client'

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
  type LucideIcon,
} from 'lucide-react'
import type { Features } from '@/lib/features'
import { useT } from '@/lib/i18n/language-provider'

interface StaffInfo {
  name: string
  role: string
  permissions: string[]
}

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  show: boolean
}

export interface NavGroup {
  label: string
  items: NavItem[]
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

export function useNavGroups(features: Features, staff?: StaffInfo): NavGroup[] {
  const { t } = useT()

  return [
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
}

/**
 * Picks up to N most relevant items from the nav groups for the bottom nav.
 * Honors business features, then falls back to dashboard.
 */
export function pickBottomNavItems(groups: NavGroup[], max = 4): NavItem[] {
  const flat = groups.flatMap((g) => g.items).filter((i) => i.show)
  const dash = flat.find((i) => i.href === '/dashboard')
  const rest = flat.filter((i) => i.href !== '/dashboard')
  const picked = [dash, ...rest].filter(Boolean).slice(0, max) as NavItem[]
  return picked
}
