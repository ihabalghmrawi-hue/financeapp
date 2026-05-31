import Link from 'next/link'
import { Calendar, Plus, ArrowUpRight } from 'lucide-react'
import { t } from '@/lib/i18n/server'

interface Props {
  todayBookings: any[] | null
}

export function TodayBookingsCard({ todayBookings }: Props) {
  return (
    <div className="premium-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" /> {t('dashboard.overview.todayBookings')}
        </h3>
        <Link
          href="/dashboard/rentals/bookings"
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          {t('common.all')} <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
      {!todayBookings?.length ? (
        <div className="px-5 py-6 text-center">
          <p className="text-sm text-muted-foreground mb-3">{t('dashboard.overview.noBookingsToday')}</p>
          <Link
            href="/dashboard/rentals/bookings/new"
            className="inline-flex items-center gap-1.5 text-xs bg-primary/10 text-primary px-4 py-2 rounded-lg hover:bg-primary/20 transition-colors font-medium"
          >
            <Plus className="w-3.5 h-3.5" /> {t('dashboard.overview.createBookingNow')}
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-border/30">
          {todayBookings.map((o: any) => (
            <div key={o.id} className="flex items-center justify-between px-5 py-3.5">
              <div>
                <p className="text-sm font-medium">{o.customer_name}</p>
                <p className="text-xs text-muted-foreground">{o.dresses?.name}</p>
              </div>
              <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                {t('dashboard.overview.today')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
