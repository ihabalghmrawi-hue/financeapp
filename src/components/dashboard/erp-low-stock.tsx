import { createClient } from '@/lib/supabase/server'
import { t } from '@/lib/i18n/server'
import Link from 'next/link'
import { AlertTriangle, CheckCircle } from 'lucide-react'

export async function ErpLowStock({
  companyId,
  businessType,
  lang,
}: {
  companyId: string
  businessType: string
  lang: string
}) {
  const supabase = createClient()

  const { data: lowStockProducts } = await supabase
    .from('products')
    .select('id, name, name_ar, min_stock_level, inventory(quantity)')
    .eq('company_id', companyId)
    .eq('business_type', businessType)
    .eq('track_inventory', true)
    .eq('is_active', true)

  const lowStock = (lowStockProducts || []).filter((p) => {
    const qty = (p.inventory as any[])?.reduce((s: number, i: any) => s + i.quantity, 0) || 0
    return qty <= p.min_stock_level
  })

  return (
    <div className="premium-card overflow-hidden">
      <div
        className={`flex items-center gap-2 px-4 py-3.5 border-b border-border/50 text-sm font-semibold ${lowStock.length > 0 ? 'bg-warning/5 text-warning' : 'bg-success/5 text-success'}`}
      >
        {lowStock.length > 0 ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
        {t('dashboard.overview.inventoryAlerts')}
        {lowStock.length > 0 && (
          <span className="bg-destructive/10 text-destructive text-xs px-1.5 py-0.5 rounded-full mr-auto">
            {lowStock.length}
          </span>
        )}
      </div>
      {lowStock.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-5">{t('dashboard.overview.inventoryGood')}</p>
      ) : (
        <div className="divide-y divide-border/30">
          {lowStock.slice(0, 4).map((p) => {
            const qty = (p.inventory as any[])?.reduce((s: number, i: any) => s + i.quantity, 0) || 0
            return (
              <div key={p.id} className="flex justify-between items-center px-4 py-2.5 text-sm hover:bg-secondary/30">
                <span className="text-muted-foreground truncate">
                  {lang === 'ar' ? p.name_ar || p.name : p.name || p.name_ar}
                </span>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${qty <= 0 ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'}`}
                >
                  {qty <= 0 ? t('dashboard.overview.outOfStock') : qty}
                </span>
              </div>
            )
          })}
          {lowStock.length > 4 && (
            <div className="px-4 py-2">
              <Link href="/dashboard/inventory" className="text-xs text-primary hover:underline">
                {t('dashboard.overview.moreProducts', { count: lowStock.length - 4 })}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
