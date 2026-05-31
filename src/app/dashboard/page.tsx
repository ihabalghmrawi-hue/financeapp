import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { t } from '@/lib/i18n/server'
import { cookies, headers } from 'next/headers'
import type { Lang } from '@/lib/i18n'
import { getFeatures } from '@/lib/features'
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
import { getCompanyId, getCurrency } from '@/lib/tenant'
import { ConstructionDashboard } from '@/components/dashboards/construction-dashboard'
import { RentalDashboard } from '@/components/dashboards/rental-dashboard'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { ErpKpiCards } from '@/components/dashboard/erp-kpi-cards'
import { ErpLowStock } from '@/components/dashboard/erp-low-stock'
import { ErpRecentSales } from '@/components/dashboard/erp-recent-sales'
import { QuickStatsCard } from '@/components/dashboard/quick-stats-card'
import { QuickActionsCard } from '@/components/dashboard/quick-actions-card'
import { SkeletonCard } from '@/components/ui/skeleton'

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
  const rawBusinessType = dec(h.get('x-business-type'), 'retail')
  const features = getFeatures(rawBusinessType)
  const staffName = dec(h.get('x-staff-name'), 'المدير')
  const cookieStore = await cookies()
  const lang: Lang = (cookieStore.get('lang')?.value as Lang) || 'ar'

  const today = new Date().toISOString().slice(0, 10)
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
  const hour = new Date().getHours()
  const greeting =
    hour < 12
      ? t('dashboard.overview.morning')
      : hour < 17
        ? t('dashboard.overview.afternoon')
        : t('dashboard.overview.evening')

  // ── Rental dashboard ──
  if (features.hasRental) {
    return (
      <RentalDashboard
        companyId={COMPANY_ID}
        currency={CURRENCY}
        businessType={rawBusinessType}
        greeting={greeting}
        staffName={staffName}
        lang={lang}
      />
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
    const workersBusy = workersList.filter((w) => w.status === 'busy').length

    return (
      <ConstructionDashboard
        greeting={greeting}
        staffName={staffName}
        currency={CURRENCY}
        projects={projects || []}
        tasks={(tasks || []) as any}
        workersTotal={workersTotal}
        workersBusy={workersBusy}
        customersCount={customersCount || 0}
        aiInsights={aiInsights || []}
      />
    )
  }

  // ── Standard ERP dashboard ──
  const { count: productsCount } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', COMPANY_ID)
    .eq('business_type', rawBusinessType)
    .eq('is_active', true)

  const hasNoProducts = (productsCount ?? 0) === 0

  return (
    <DashboardShell greeting={greeting} staffName={staffName}>
      {hasNoProducts ? (
        <EmptyState
          icon={<Package className="w-full h-full" />}
          title={t('dashboard.overview.welcomeTo', { name: features.label })}
          description={t('dashboard.overview.noProductsDesc')}
          action={{ label: t('dashboard.overview.addFirstProduct'), href: '/dashboard/inventory' }}
          secondaryAction={
            features.showPOS ? { label: t('dashboard.overview.openPOS'), href: '/dashboard/pos' } : undefined
          }
          variant="premium"
          size="lg"
        />
      ) : (
        <>
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm text-muted-foreground">{t('dashboard.overview.startSelling')}</p>
            {features.showPOS && (
              <Link
                href="/dashboard/pos"
                data-tour="pos-btn"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                <ShoppingCart className="w-4 h-4" /> {t('dashboard.overview.pos')}
              </Link>
            )}
          </div>

          <Suspense fallback={<SkeletonCard className="min-h-[120px]" />}>
            <ErpKpiCards companyId={COMPANY_ID} currency={CURRENCY} businessType={rawBusinessType} />
          </Suspense>

          <DashboardOnboarding
            businessType={features.businessType}
            hasProducts={true}
            hasDresses={false}
            hasOrders={false}
            hasSales={true}
            hasBranding={false}
            hasPricingRules={false}
          />

          <Suspense fallback={<SkeletonCard className="min-h-[80px]" />}>
            <InsightsWidget initialInsights={[]} compact />
          </Suspense>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Suspense fallback={<SkeletonCard className="min-h-[200px]" />}>
              <ErpRecentSales companyId={COMPANY_ID} currency={CURRENCY} businessType={rawBusinessType} />
            </Suspense>
            <div className="space-y-4">
              <Suspense fallback={<SkeletonCard className="min-h-[160px]" />}>
                <ErpLowStock companyId={COMPANY_ID} businessType={rawBusinessType} lang={lang} />
              </Suspense>
              <QuickStatsCard customersCount={0} productsCount={productsCount ?? 0} />
              <QuickActionsCard features={features} />
            </div>
          </div>
        </>
      )}
    </DashboardShell>
  )
}
