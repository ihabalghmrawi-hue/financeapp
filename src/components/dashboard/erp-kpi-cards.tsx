import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { t } from '@/lib/i18n/server'
import Link from 'next/link'
import { AnimatedKPICounter } from '@/components/charts'
import { Receipt, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

export async function ErpKpiCards({
  companyId,
  currency,
  businessType,
}: {
  companyId: string
  currency: string
  businessType: string
}) {
  const supabase = createClient()
  const today = new Date().toISOString().slice(0, 10)
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

  const [{ data: todaySales }, { data: monthSales }, { data: monthPurchases }, { data: monthExpenses }] =
    await Promise.all([
      supabase
        .from('sales')
        .select('total')
        .eq('company_id', companyId)
        .eq('business_type', businessType)
        .gte('sale_date', today)
        .eq('status', 'completed'),
      supabase
        .from('sales')
        .select('total')
        .eq('company_id', companyId)
        .eq('business_type', businessType)
        .gte('sale_date', monthStart)
        .eq('status', 'completed'),
      supabase.from('purchases').select('total').eq('company_id', companyId).gte('purchase_date', monthStart),
      supabase.from('expenses').select('amount').eq('company_id', companyId).gte('expense_date', monthStart),
    ])

  const todayTotal = todaySales?.reduce((s, x) => s + x.total, 0) || 0
  const monthTotal = monthSales?.reduce((s, x) => s + x.total, 0) || 0
  const monthProfit =
    monthTotal -
    (monthPurchases?.reduce((s, x) => s + x.total, 0) || 0) -
    (monthExpenses?.reduce((s, x) => s + x.amount, 0) || 0)
  const monthExpTot = monthExpenses?.reduce((s, x) => s + x.amount, 0) || 0

  return (
    <div data-tour="dashboard-stats" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Link href="/dashboard/sales">
        <AnimatedKPICounter
          title={t('dashboard.overview.todaySales')}
          value={todayTotal}
          format="currency"
          currency={currency}
          icon={<Receipt className="w-5 h-5" />}
          subtitle={t('dashboard.overview.todayInvoices', { count: todaySales?.length || 0 })}
          variant="primary"
        />
      </Link>
      <Link href="/dashboard/sales">
        <AnimatedKPICounter
          title={t('dashboard.overview.monthSales')}
          value={monthTotal}
          format="currency"
          currency={currency}
          icon={<TrendingUp className="w-5 h-5" />}
          subtitle={t('dashboard.overview.thisMonth')}
          variant="success"
          delay={0.1}
        />
      </Link>
      <Link href="/dashboard/reports">
        <AnimatedKPICounter
          title={t('dashboard.overview.netProfit')}
          value={monthProfit}
          format="currency"
          currency={currency}
          icon={monthProfit >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          subtitle={t('dashboard.overview.afterExpenses')}
          variant={monthProfit >= 0 ? 'default' : 'danger'}
          delay={0.15}
        />
      </Link>
      <Link href="/dashboard/expenses">
        <AnimatedKPICounter
          title={t('dashboard.overview.expenses')}
          value={monthExpTot}
          format="currency"
          currency={currency}
          icon={<DollarSign className="w-5 h-5" />}
          subtitle={t('dashboard.overview.thisMonth')}
          variant="danger"
          delay={0.2}
        />
      </Link>
    </div>
  )
}
