import Link from 'next/link'
import { AlertTriangle, CheckCircle, ArrowUpRight } from 'lucide-react'
import { t } from '@/lib/i18n/server'

interface Props {
  lateOrders: any[] | null
}

export function LateReturnsCard({ lateOrders }: Props) {
  const items = lateOrders ?? []
  const hasLate = items.length > 0
  return (
    <div className="premium-card overflow-hidden">
      <div
        className={`flex items-center justify-between px-5 py-3.5 border-b border-border/50 ${hasLate ? 'bg-destructive/5' : 'bg-success/5'}`}
      >
        <h3
          className={`font-semibold text-sm flex items-center gap-2 ${hasLate ? 'text-destructive' : 'text-success'}`}
        >
          {hasLate ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {hasLate
            ? t('dashboard.overview.lateReturnsWithCount', { count: items.length })
            : t('dashboard.overview.lateReturns')}
        </h3>
        <Link
          href="/dashboard/rentals/returns"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          {t('dashboard.overview.manage')} <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
      {!hasLate ? (
        <div className="px-5 py-6 text-sm text-success flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {t('dashboard.overview.noLateReturns')}
        </div>
      ) : items.length > 0 ? (
        <div className="divide-y divide-border/30">
          {items.map((o: any) => {
            const lateDays = Math.floor((Date.now() - new Date(o.end_date).getTime()) / 86400000)
            return (
              <div key={o.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium">{o.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{o.dresses?.name}</p>
                </div>
                <span className="text-xs bg-destructive/10 text-destructive px-2.5 py-1 rounded-full font-medium">
                  {t('dashboard.overview.lateDays', { days: lateDays })}
                </span>
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
