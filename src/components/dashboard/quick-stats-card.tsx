import Link from 'next/link'
import { Users, Package } from 'lucide-react'
import { t } from '@/lib/i18n/server'

interface Props {
  customersCount: number
  productsCount: number
}

export function QuickStatsCard({ customersCount, productsCount }: Props) {
  return (
    <div className="premium-card p-5 space-y-3">
      <h3 className="font-semibold text-sm">{t('dashboard.overview.quickSummary')}</h3>
      {[
        {
          label: t('dashboard.overview.customers'),
          value: customersCount,
          icon: Users,
          href: '/dashboard/customers',
          color: 'text-blue-500',
        },
        {
          label: t('dashboard.overview.products'),
          value: productsCount,
          icon: Package,
          href: '/dashboard/inventory',
          color: 'text-success',
        },
      ].map((item, i) => {
        const Icon = item.icon
        return (
          <Link
            key={i}
            href={item.href}
            className="flex items-center justify-between hover:bg-secondary/50 -mx-2 px-2 py-1.5 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-2">
              <Icon className={`w-4 h-4 ${item.color}`} />
              <span className="text-sm text-muted-foreground">{item.label}</span>
            </div>
            <span className="font-bold text-sm">{item.value}</span>
          </Link>
        )
      })}
    </div>
  )
}
