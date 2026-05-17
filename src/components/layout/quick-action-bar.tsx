'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ShoppingCart,
  Calendar,
  Plus,
  User,
  Package,
  DollarSign,
  RotateCcw,
  Shirt,
  Building2,
  HardHat,
  CheckSquare,
  PackageOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n/language-provider'
import type { Features } from '@/lib/features'

interface Action {
  label: string
  href: string
  icon: React.ElementType
  primary?: boolean
}

type Translator = (key: string, params?: Record<string, string | number>) => string

function getActions(features: Features, t: Translator): Action[] {
  if (features.hasRental) {
    return [
      {
        label: t('layout.quickActions.newBooking'),
        href: '/dashboard/rentals/bookings/new',
        icon: Calendar,
        primary: true,
      },
      { label: t('layout.quickActions.newDress'), href: '/dashboard/rentals/dresses', icon: Shirt },
      { label: t('layout.quickActions.calendar'), href: '/dashboard/rentals/calendar', icon: Calendar },
      { label: t('layout.quickActions.return'), href: '/dashboard/rentals/returns', icon: RotateCcw },
    ]
  }
  if (features.hasConstruction) {
    // Construction companies execute projects, not products. Surface
    // project / task / worker / material / expense flows instead.
    return [
      { label: 'مشروع جديد', href: '/dashboard/construction/projects', icon: Building2, primary: true },
      { label: 'مهمة', href: '/dashboard/construction/tasks', icon: CheckSquare },
      { label: 'عامل', href: '/dashboard/construction/workers', icon: HardHat },
      { label: 'مواد', href: '/dashboard/construction/materials', icon: PackageOpen },
      { label: 'مصروف', href: '/dashboard/construction/expenses', icon: DollarSign },
      { label: 'عميل', href: '/dashboard/customers', icon: User },
    ]
  }
  const actions: Action[] = []
  if (features.showPOS) {
    actions.push({ label: t('layout.quickActions.newSale'), href: '/dashboard/pos', icon: ShoppingCart, primary: true })
  }
  actions.push({
    label: t('layout.quickActions.newProduct'),
    href: '/dashboard/inventory',
    icon: Package,
    primary: !features.showPOS,
  })
  actions.push({ label: t('layout.quickActions.newCustomer'), href: '/dashboard/customers', icon: User })
  if (features.showPurchases) {
    actions.push({ label: t('layout.quickActions.purchaseInvoice'), href: '/dashboard/purchases', icon: Plus })
  }
  actions.push({ label: t('layout.quickActions.expense'), href: '/dashboard/expenses', icon: DollarSign })
  return actions
}

const HIDDEN_PATHS = ['/dashboard/pos', '/dashboard/rentals/bookings/new']

export function QuickActionBar({ features }: { features: Features }) {
  const { t } = useT()
  const pathname = usePathname()
  if (HIDDEN_PATHS.some((p) => pathname.startsWith(p))) {
    return null
  }

  const actions = getActions(features, t)

  return (
    <div
      data-tour="quick-action-bar"
      className="flex items-center gap-2 px-4 py-2.5 border-b border-border/50 bg-card/50 backdrop-blur shrink-0 overflow-x-auto no-scrollbar"
    >
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <Link
            key={action.href}
            href={action.href}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all shrink-0 whitespace-nowrap',
              action.primary
                ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/10 hover:bg-primary/90'
                : 'bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/30',
            )}
          >
            <Icon className="w-3.5 h-3.5" />
            {action.label}
          </Link>
        )
      })}
    </div>
  )
}
