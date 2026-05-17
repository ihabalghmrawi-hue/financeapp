import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { t } from '@/lib/i18n/server'
import Link from 'next/link'
import { headers } from 'next/headers'
import { getFeatures } from '@/lib/features'
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
import { getCompanyId, getCurrency } from '@/lib/tenant'
import { ConstructionDashboard } from '@/components/dashboards/construction-dashboard'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const COMPANY_ID = await getCompanyId()
  const CURRENCY = await getCurrency()
  const supabase = createClient()
  const h = await headers()
  const dec = (v: string | null, fb = '') => {
    try {
      return decodeURIComponent(v || fb)
    } catch {
      return v || fb
    }
  }
  const features = getFeatures(dec(h.get('x-business-type'), 'retail'))
  const staffName = dec(h.get('x-staff-name'), 'المدير')

  const today = new Date().toISOString().slice(0, 10)
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
  const hour = new Date().getHours()
  const greeting =
    hour < 12
      ? t('dashboard.overview.morning')
      : hour < 17
        ? t('dashboard.overview.afternoon')
        : t('dashboard.overview.evening')

  // ── Rental dashboard data ──
  if (features.hasRental) {
    const [
      { data: dresses },
      { data: orders },
      { data: lateOrders },
      { data: todayBookings },
      { data: pricingRules },
      { data: branding },
    ] = await Promise.all([
      supabase.from('dresses').select('status').eq('company_id', COMPANY_ID).neq('status', 'retired'),
      supabase
        .from('rental_orders')
        .select('total_price, amount_paid, status')
        .eq('company_id', COMPANY_ID)
        .neq('status', 'cancelled'),
      supabase
        .from('rental_orders')
        .select('id, customer_name, end_date, dresses(name)')
        .eq('company_id', COMPANY_ID)
        .eq('status', 'active')
        .lt('end_date', today)
        .order('end_date')
        .limit(5),
      supabase
        .from('rental_orders')
        .select('id, customer_name, start_date, dresses(name)')
        .eq('company_id', COMPANY_ID)
        .eq('status', 'booked')
        .eq('start_date', today)
        .limit(5),
      supabase
        .from('rental_pricing_rules')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', COMPANY_ID)
        .eq('active', true),
      supabase.from('company_settings').select('logo_url').eq('company_id', COMPANY_ID).maybeSingle(),
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
                  currency={CURRENCY}
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
                  currency={CURRENCY}
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
          hasBranding={!!(branding as any)?.logo_url}
          hasPricingRules={(pricingRules as any)?.length > 0}
        />
      </DashboardShell>
    )
  }

  // ── Construction dashboard ──
  if (features.hasConstruction) {
    const [{ data: projects }, { data: tasks }, { data: workers }, { count: customersCount }, { data: aiInsights }] =
      await Promise.all([
        supabase
          .from('con_projects')
          .select(
            'id, name, status, progress_pct, client_name, engineer_name, contract_value, actual_cost, start_date, end_date',
          )
          .eq('company_id', COMPANY_ID)
          .order('created_at', { ascending: false }),
        supabase
          .from('con_tasks')
          .select('id, title, status, project_id, con_workers(name, job_type)')
          .eq('company_id', COMPANY_ID)
          .eq('status', 'in_progress'),
        supabase.from('con_workers').select('id, status').eq('company_id', COMPANY_ID),
        supabase.from('customers').select('id', { count: 'exact', head: true }).eq('company_id', COMPANY_ID),
        supabase
          .from('ai_insights')
          .select('*')
          .eq('company_id', COMPANY_ID)
          .gte('expires_at', new Date().toISOString())
          .order('generated_at', { ascending: false }),
      ])

    const workersList = workers || []
    const workersTotal = workersList.length
    const workersBusy = workersList.filter((w: any) => w.status === 'busy').length

    return (
      <ConstructionDashboard
        greeting={greeting}
        staffName={staffName}
        currency={CURRENCY}
        projects={(projects as any) || []}
        tasks={(tasks as any) || []}
        workersTotal={workersTotal}
        workersBusy={workersBusy}
        customersCount={customersCount || 0}
        aiInsights={(aiInsights as any) || []}
      />
    )
  }

  // ── Standard ERP dashboard ──
  const [
    { data: aiInsights },
    { data: todaySales },
    { data: monthSales },
    { data: monthPurchases },
    { data: monthExpenses },
    { data: lowStockProducts },
    { data: recentSales },
    { data: customersCount },
    { data: productsCount },
  ] = await Promise.all([
    supabase
      .from('ai_insights')
      .select('*')
      .eq('company_id', COMPANY_ID)
      .gte('expires_at', new Date().toISOString())
      .order('generated_at', { ascending: false }),
    supabase
      .from('sales')
      .select('total')
      .eq('company_id', COMPANY_ID)
      .gte('sale_date', today)
      .eq('status', 'completed'),
    supabase
      .from('sales')
      .select('total')
      .eq('company_id', COMPANY_ID)
      .gte('sale_date', monthStart)
      .eq('status', 'completed'),
    supabase.from('purchases').select('total').eq('company_id', COMPANY_ID).gte('purchase_date', monthStart),
    supabase.from('expenses').select('amount').eq('company_id', COMPANY_ID).gte('expense_date', monthStart),
    supabase
      .from('products')
      .select('id, name, name_ar, min_stock_level, inventory(quantity)')
      .eq('company_id', COMPANY_ID)
      .eq('track_inventory', true)
      .eq('is_active', true),
    supabase
      .from('sales')
      .select('invoice_number, total, sale_date, customers(name), payment_status')
      .eq('company_id', COMPANY_ID)
      .order('sale_date', { ascending: false })
      .limit(5),
    supabase
      .from('customers')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', COMPANY_ID)
      .eq('is_active', true),
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', COMPANY_ID)
      .eq('is_active', true),
  ])

  const todayTotal = todaySales?.reduce((s, x) => s + x.total, 0) || 0
  const monthTotal = monthSales?.reduce((s, x) => s + x.total, 0) || 0
  const monthCost = monthPurchases?.reduce((s, x) => s + x.total, 0) || 0
  const monthExpTot = monthExpenses?.reduce((s, x) => s + x.amount, 0) || 0
  const monthProfit = monthTotal - monthCost - monthExpTot

  const lowStock = (lowStockProducts || []).filter((p) => {
    const qty = (p.inventory as any[])?.reduce((s: number, i: any) => s + i.quantity, 0) || 0
    return qty <= p.min_stock_level
  })

  const hasNoSales = !recentSales || recentSales.length === 0
  const hasNoProducts = (productsCount as any)?.length === 0

  return (
    <DashboardShell greeting={greeting} staffName={staffName}>
      {hasNoProducts ? (
        <EmptyState
          icon={<Package className="w-full h-full" />}
          title={`مرحباً في ${features.label}!`}
          description="لم تُضف أي منتجات بعد. ابدأ بإضافة منتجاتك لتتمكن من البيع والتتبع"
          action={{ label: 'أضف أول منتج', href: '/dashboard/inventory' }}
          secondaryAction={features.showPOS ? { label: 'افتح نقطة البيع', href: '/dashboard/pos' } : undefined}
          variant="premium"
          size="lg"
        />
      ) : (
        <>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-muted-foreground">
              {hasNoSales ? 'ابدأ بتسجيل أول عملية بيع' : `${todaySales?.length || 0} فاتورة اليوم`}
            </p>
            {features.showPOS && (
              <Link
                href="/dashboard/pos"
                data-tour="pos-btn"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                <ShoppingCart className="w-4 h-4" /> نقطة البيع
              </Link>
            )}
          </div>

          <div data-tour="dashboard-stats" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Link href="/dashboard/sales">
              <AnimatedKPICounter
                title="مبيعات اليوم"
                value={todayTotal}
                format="currency"
                currency={CURRENCY}
                icon={<Receipt className="w-5 h-5" />}
                subtitle={`${todaySales?.length || 0} فاتورة`}
                variant="primary"
              />
            </Link>
            <Link href="/dashboard/sales">
              <AnimatedKPICounter
                title="مبيعات الشهر"
                value={monthTotal}
                format="currency"
                currency={CURRENCY}
                icon={<TrendingUp className="w-5 h-5" />}
                subtitle="هذا الشهر"
                variant="success"
                delay={0.1}
              />
            </Link>
            <Link href="/dashboard/reports">
              <AnimatedKPICounter
                title="صافي الربح"
                value={monthProfit}
                format="currency"
                currency={CURRENCY}
                icon={monthProfit >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                subtitle="بعد المصروفات"
                variant={monthProfit >= 0 ? 'default' : 'danger'}
                delay={0.15}
              />
            </Link>
            <Link href="/dashboard/expenses">
              <AnimatedKPICounter
                title="المصروفات"
                value={monthExpTot}
                format="currency"
                currency={CURRENCY}
                icon={<DollarSign className="w-5 h-5" />}
                subtitle="هذا الشهر"
                variant="danger"
                delay={0.2}
              />
            </Link>
          </div>

          <DashboardOnboarding
            businessType={features.businessType}
            hasProducts={(productsCount as any)?.length > 0}
            hasDresses={false}
            hasOrders={false}
            hasSales={(recentSales?.length || 0) > 0}
            hasBranding={false}
            hasPricingRules={false}
          />

          <InsightsWidget initialInsights={(aiInsights as any) || []} compact />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 premium-card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50">
                <h2 className="font-bold text-sm">آخر المبيعات</h2>
                <Link href="/dashboard/sales" className="text-xs text-primary flex items-center gap-1 hover:underline">
                  عرض الكل <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
              {hasNoSales ? (
                <EmptyState
                  icon={<ShoppingCart className="w-full h-full" />}
                  title="لا توجد مبيعات بعد"
                  description="ابدأ بإنشاء أول عملية بيع"
                  action={features.showPOS ? { label: 'افتح نقطة البيع', href: '/dashboard/pos' } : undefined}
                  variant="minimal"
                  size="sm"
                />
              ) : (
                <div className="divide-y divide-border/30">
                  {recentSales!.map((sale) => (
                    <div
                      key={sale.invoice_number}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-secondary/30 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium font-mono tracking-tight">{sale.invoice_number}</p>
                        <p className="text-xs text-muted-foreground">{(sale.customers as any)?.name || 'نقدي'}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold text-primary">{formatCurrency(sale.total, CURRENCY)}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(sale.sale_date).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <LowStockCard lowStock={lowStock} />
              <QuickStatsCard
                customersCount={(customersCount as any)?.length || 0}
                productsCount={(productsCount as any)?.length || 0}
              />
              <QuickActionsCard features={features} />
            </div>
          </div>
        </>
      )}
    </DashboardShell>
  )
}

// ── Sub-components ──

function DashboardShell({
  greeting,
  staffName,
  children,
}: {
  greeting: string
  staffName: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-5" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {greeting}، {staffName}
        </h1>
      </div>
      {children}
    </div>
  )
}

const colorMap: Record<string, { bg: string; icon: string; gradient: string }> = {
  green: { bg: 'bg-success/5', icon: 'text-success', gradient: 'from-success/10 to-transparent' },
  blue: { bg: 'bg-blue-500/5', icon: 'text-blue-500', gradient: 'from-blue-500/10 to-transparent' },
  purple: { bg: 'bg-purple-500/5', icon: 'text-purple-500', gradient: 'from-purple-500/10 to-transparent' },
  amber: { bg: 'bg-amber-500/5', icon: 'text-amber-500', gradient: 'from-amber-500/10 to-transparent' },
  emerald: { bg: 'bg-emerald-500/5', icon: 'text-emerald-500', gradient: 'from-emerald-500/10 to-transparent' },
  red: { bg: 'bg-red-500/5', icon: 'text-red-500', gradient: 'from-red-500/10 to-transparent' },
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  href,
  color = 'green',
  isText,
}: {
  label: string
  value: string | number
  sub: string
  icon: any
  href: string
  color?: string
  isText?: boolean
}) {
  const c = colorMap[color] || colorMap.green
  return (
    <Link
      href={href}
      className={`premium-card p-5 hover:shadow-elevation-2 transition-all duration-300 group relative overflow-hidden`}
    >
      <div className={`absolute inset-0 bg-gradient-to-b ${c.gradient} opacity-50`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground font-medium">{label}</p>
          <div className={`w-8 h-8 rounded-xl ${c.bg} flex items-center justify-center ${c.icon}`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
        <p className={`font-bold text-foreground ${isText ? 'text-lg' : 'text-2xl'}`}>{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </div>
    </Link>
  )
}

function LateReturnsCard({ lateOrders }: { lateOrders: any }) {
  const hasLate = lateOrders?.length > 0
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
            ? t('dashboard.overview.lateReturnsWithCount', { count: lateOrders.length })
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
      ) : (
        <div className="divide-y divide-border/30">
          {lateOrders.map((o: any) => {
            const lateDays = Math.floor((Date.now() - new Date(o.end_date).getTime()) / 86400000)
            return (
              <div key={o.id} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium">{o.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{(o.dresses as any)?.name}</p>
                </div>
                <span className="text-xs bg-destructive/10 text-destructive px-2.5 py-1 rounded-full font-medium">
                  {t('dashboard.overview.lateDays', { days: lateDays })}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TodayBookingsCard({ todayBookings }: { todayBookings: any }) {
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
                <p className="text-xs text-muted-foreground">{(o.dresses as any)?.name}</p>
              </div>
              <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">اليوم</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function QuickLink({
  href,
  label,
  icon: Icon,
  count,
  tour,
}: {
  href: string
  label: string
  icon: any
  count: string
  tour?: string
}) {
  return (
    <Link
      href={href}
      {...(tour ? { 'data-tour': tour } : {})}
      className="premium-card p-4 hover:shadow-elevation-2 transition-all duration-300 group flex items-center gap-3"
    >
      <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <p className="font-semibold text-sm group-hover:text-primary transition-colors">{label}</p>
        <p className="text-xs text-muted-foreground">{count}</p>
      </div>
    </Link>
  )
}

function LowStockCard({ lowStock }: { lowStock: any[] }) {
  return (
    <div className="premium-card overflow-hidden">
      <div
        className={`flex items-center gap-2 px-4 py-3.5 border-b border-border/50 text-sm font-semibold ${lowStock.length > 0 ? 'bg-warning/5 text-warning' : 'bg-success/5 text-success'}`}
      >
        {lowStock.length > 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
        تنبيهات المخزون
        {lowStock.length > 0 && (
          <span className="bg-destructive/10 text-destructive text-xs px-1.5 py-0.5 rounded-full mr-auto">
            {lowStock.length}
          </span>
        )}
      </div>
      {lowStock.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-5">المخزون بحالة جيدة ✓</p>
      ) : (
        <div className="divide-y divide-border/30">
          {lowStock.slice(0, 4).map((p) => {
            const qty = (p.inventory as any[])?.reduce((s: number, i: any) => s + i.quantity, 0) || 0
            return (
              <div key={p.id} className="flex justify-between items-center px-4 py-2.5 text-sm hover:bg-secondary/30">
                <span className="text-muted-foreground truncate">{p.name_ar || p.name}</span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${qty <= 0 ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}
                >
                  {qty <= 0 ? 'نفذ' : qty}
                </span>
              </div>
            )
          })}
          {lowStock.length > 4 && (
            <div className="px-4 py-2">
              <Link href="/dashboard/inventory" className="text-xs text-primary hover:underline">
                +{lowStock.length - 4} منتج آخر
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function QuickStatsCard({ customersCount, productsCount }: { customersCount: number; productsCount: number }) {
  return (
    <div className="premium-card p-5 space-y-3">
      <h3 className="font-semibold text-sm">ملخص سريع</h3>
      {[
        { label: 'العملاء', value: customersCount, icon: Users, href: '/dashboard/customers', color: 'text-blue-500' },
        { label: 'المنتجات', value: productsCount, icon: Package, href: '/dashboard/inventory', color: 'text-success' },
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

function QuickActionsCard({ features }: { features: any }) {
  return (
    <div className="premium-card p-5 space-y-2">
      <h3 className="font-semibold text-sm mb-3">إجراءات سريعة</h3>
      {[
        features.showPOS && { label: 'فتح نقطة البيع', href: '/dashboard/pos', icon: ShoppingCart, primary: true },
        { label: 'إضافة منتج', href: '/dashboard/inventory', icon: Package, primary: false },
        { label: 'إضافة عميل', href: '/dashboard/customers', icon: Users, primary: false },
        { label: 'مصروف جديد', href: '/dashboard/expenses', icon: DollarSign, primary: false },
      ]
        .filter(Boolean)
        .map((action: any, i) => {
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
