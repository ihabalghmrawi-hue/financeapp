import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { t } from '@/lib/i18n/server'
import Link from 'next/link'
import { ShoppingCart, ArrowUpRight } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'

export async function ErpRecentSales({
  companyId,
  currency,
  businessType,
}: {
  companyId: string
  currency: string
  businessType: string
}) {
  const supabase = createClient()

  const { data: recentSales } = await supabase
    .from('sales')
    .select('invoice_number, total, sale_date, customers(name), payment_status')
    .eq('company_id', companyId)
    .eq('business_type', businessType)
    .order('sale_date', { ascending: false })
    .limit(5)

  const hasNoSales = !recentSales || recentSales.length === 0

  return (
    <div className="lg:col-span-2 premium-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50">
        <h2 className="font-bold text-sm">{t('dashboard.overview.recentSales')}</h2>
        <Link href="/dashboard/sales" className="text-xs text-primary flex items-center gap-1 hover:underline">
          {t('dashboard.overview.viewAll')} <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>
      {hasNoSales ? (
        <EmptyState
          icon={<ShoppingCart className="w-full h-full" />}
          title={t('dashboard.overview.noSalesYet')}
          description={t('dashboard.overview.noSalesDesc')}
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
                <p className="text-xs text-muted-foreground">
                  {(sale.customers as any)?.name || t('dashboard.overview.cash')}
                </p>
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-primary">{formatCurrency(sale.total, currency)}</p>
                <p className="text-xs text-muted-foreground">{new Date(sale.sale_date).toLocaleDateString('ar-SA')}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
