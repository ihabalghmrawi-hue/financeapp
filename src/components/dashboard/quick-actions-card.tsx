import Link from 'next/link'
import { ShoppingCart, Package, Users, DollarSign, Shirt, Tag, Layers } from 'lucide-react'
import type { Features } from '@/lib/features'
import { t } from '@/lib/i18n/server'

interface Props {
  features: Features
}

export function QuickActionsCard({ features }: Props) {
  const actions: Array<{ label: string; href: string; icon: any; primary: boolean; condition?: boolean }> = [
    {
      label: t('dashboard.overview.openPOSAction'),
      href: '/dashboard/pos',
      icon: ShoppingCart,
      primary: true,
      condition: features.showPOS,
    },
    { label: t('dashboard.overview.addProduct'), href: '/dashboard/inventory', icon: Package, primary: false },
    { label: t('dashboard.overview.addCustomer'), href: '/dashboard/customers', icon: Users, primary: false },
    { label: t('dashboard.overview.newExpense'), href: '/dashboard/expenses', icon: DollarSign, primary: false },
    {
      label: t('dashboard.overview.manageVariants'),
      href: '/dashboard/inventory',
      icon: Layers,
      primary: false,
      condition: features.hasVariants,
    },
    {
      label: t('dashboard.overview.manageBatches'),
      href: '/dashboard/inventory',
      icon: Tag,
      primary: false,
      condition: features.hasBatch,
    },
  ]

  return (
    <div className="premium-card p-5 space-y-2">
      <h3 className="font-semibold text-sm mb-3">{t('dashboard.overview.quickActions')}</h3>
      {actions
        .filter((a) => a.condition !== false)
        .map((action, i) => {
          const Icon = action.icon
          return (
            <Link
              key={i}
              href={action.href}
              className={`w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${action.primary ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/10' : 'hover:bg-secondary text-foreground border border-border/50'}`}
            >
              <Icon className="w-4 h-4" />
              {action.label}
            </Link>
          )
        })}
    </div>
  )
}
