import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { t } from '@/lib/i18n/server'
import { cookies, headers } from 'next/headers'
import Link from 'next/link'
import {
  ShoppingCart,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  DollarSign,
  ArrowUpRight,
  Receipt,
  Zap,
  Calendar,
  Shirt,
  RotateCcw,
  CheckCircle,
  Plus,
} from 'lucide-react'
import { AnimatedKPICounter, GlassChartCard, TrendIndicator, ActivityFeed } from '@/components/charts'
import { EmptyState } from '@/components/ui/empty-state'
import { InsightsWidget } from '@/components/insights-widget'
import { DashboardOnboarding } from '@/components/onboarding/dashboard-onboarding'
import { getFeatures } from '@/lib/features'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { LateReturnsCard } from '@/components/dashboard/late-returns-card'
import { TodayBookingsCard } from '@/components/dashboard/today-bookings-card'
import { QuickLink } from '@/components/dashboard/quick-link'

interface Props {
  companyId: string
  currency: string
  businessType: string
  greeting: string
  staffName: string
  lang: string
}

export async function RentalDashboard({ companyId, currency, businessType, greeting, staffName, lang }: Props) {
  const supabase = createClient()
  const today = new Date().toISOString().slice(0, 10)

  const [
    { data: dresses },
    { data: orders },
    { data: lateOrders },
    { data: todayBookings },
    { data: pricingRules },
    { data: branding },
  ] = await Promise.all([
    supabase.from('dresses').select('status').eq('company_id', companyId).neq('status', 'retired'),
    supabase
      .from('rental_orders')
      .select('total_price, amount_paid, status')
      .eq('company_id', companyId)
      .neq('status', 'cancelled'),
    supabase
      .from('rental_orders')
      .select('id, customer_name, end_date, dresses(name)')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .lt('end_date', today)
      .order('end_date')
      .limit(5),
    supabase
      .from('rental_orders')
      .select('id, customer_name, start_date, dresses(name)')
      .eq('company_id', companyId)
      .eq('status', 'booked')
      .eq('start_date', today)
      .limit(5),
    supabase
      .from('rental_pricing_rules')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('active', true),
    supabase.from('company_settings').select('logo_url').eq('company_id', companyId).maybeSingle(),
  ])

  const available = dresses?.filter((d) => d.status === 'available').length || 0
  const rented = dresses?.filter((d) => d.status === 'rented').length || 0
  const maintenance = dresses?.filter((d) => d.status === 'maintenance').length || 0
  const totalDresses = dresses?.length || 0
  const revenue = orders?.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + Number(o.total_price), 0) || 0
  const pending =
    orders
      ?.filter((o) => ['booked', 'active'].includes(o.status))
      .reduce((s, o) => s + Number(o.total_price) - Number(o.amount_paid), 0) || 0
  const isEmpty = totalDresses === 0

  return (
    <DashboardShell greeting={greeting} staffName={staffName}>
      {isEmpty ? (
        <EmptyState
          icon={<Shirt className="w-full h-full" />}
          title={t('dashboard.overview.noDressesYet')}
          description={t('dashboard.overview.noDressesDesc')}
          action={{ label: t('dashboard.overview.addFirstDress'), href: '/dashboard/rentals/dresses' }}
          secondaryAction={{ label: t('dashboard.overview.browseCalendar'), href: '/dashboard/rentals/calendar' }}
          variant="premium"
          size="lg"
        />
      ) : (
        <>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-muted-foreground">
              {t('dashboard.overview.dressesAvailable', { available, rented, late: lateOrders?.length || 0 })}
            </p>
            <Link
              href="/dashboard/rentals/bookings/new"
              data-tour="new-booking-btn"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              <Plus className="w-4 h-4" /> {t('dashboard.overview.newBooking')}
            </Link>
          </div>

          <div data-tour="dashboard-stats" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/dashboard/rentals/dresses">
              <AnimatedKPICounter
                title={t('dashboard.overview.availableDresses')}
                value={available}
                format="number"
                icon={<Shirt className="w-5 h-5" />}
                subtitle={t('dashboard.overview.outOfTotal', { total: totalDresses })}
                variant="primary"
              />
            </Link>
            <Link href="/dashboard/rentals/bookings">
              <AnimatedKPICounter
                title={t('dashboard.overview.rentedNow')}
                value={rented}
                format="number"
                icon={<Calendar className="w-5 h-5" />}
                subtitle={t('dashboard.overview.activeBooking')}
                variant="success"
                delay={0.1}
              />
            </Link>
            <Link href="/dashboard/rentals/bookings">
              <AnimatedKPICounter
                title={t('dashboard.overview.totalRevenue')}
                value={revenue}
                format="currency"
                currency={currency}
                icon={<TrendingUp className="w-5 h-5" />}
                subtitle={t('dashboard.overview.allTime')}
                variant="default"
                delay={0.15}
              />
            </Link>
            <Link href="/dashboard/rentals/returns">
              <AnimatedKPICounter
                title={t('dashboard.overview.pendingPayments')}
                value={pending}
                format="currency"
                currency={currency}
                icon={<DollarSign className="w-5 h-5" />}
                subtitle={t('dashboard.overview.uncollected')}
                variant="warning"
                delay={0.2}
              />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <LateReturnsCard lateOrders={lateOrders} />
            <TodayBookingsCard todayBookings={todayBookings} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                href: '/dashboard/rentals/dresses',
                label: t('dashboard.overview.dresses'),
                icon: Shirt,
                count: t('dashboard.overview.dressCount', { count: totalDresses }),
              },
              {
                href: '/dashboard/rentals/bookings/new',
                label: t('dashboard.overview.quickBooking'),
                icon: Zap,
                count: t('common.instant'),
              },
              {
                href: '/dashboard/rentals/calendar',
                label: t('dashboard.overview.calendar'),
                icon: Calendar,
                count: t('dashboard.overview.fullView'),
                tour: 'calendar-link',
              },
              {
                href: '/dashboard/rentals/pricing',
                label: t('dashboard.overview.pricing'),
                icon: DollarSign,
                count: t('dashboard.overview.packagesAndPrices'),
              },
            ].map((link: any) => (
              <QuickLink key={link.href} {...link} />
            ))}
          </div>
        </>
      )}

      <DashboardOnboarding
        businessType="dress_rental"
        hasProducts={false}
        hasDresses={totalDresses > 0}
        hasOrders={(orders?.length || 0) > 0}
        hasSales={false}
        hasBranding={!!branding?.logo_url}
        hasPricingRules={pricingRules?.length ? pricingRules.length > 0 : false}
      />
    </DashboardShell>
  )
}
