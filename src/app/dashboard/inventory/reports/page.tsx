'use client'

import { useState, useEffect } from 'react'
import { Loader2, AlertTriangle, BarChart3, TrendingDown, TrendingUp, Package } from 'lucide-react'

export default function InventoryReportsPage() {
  const [valuation, setValuation] = useState<any>(null)
  const [lowStock, setLowStock] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'valuation' | 'low-stock'>('valuation')

  useEffect(() => {
    async function fetchReports() {
      try {
        const [vRes, lRes] = await Promise.all([
          fetch('/api/inventory/reports?type=valuation'),
          fetch('/api/inventory/reports?type=low-stock'),
        ])
        if (vRes.ok) {
          const v = await vRes.json()
          setValuation(v.data || v)
        } else {
          const v = await vRes.json().catch(() => ({}))
          setError(v.error?.message || v.error || 'فشل تحميل تقييم المخزون')
        }
        if (lRes.ok) {
          const l = await lRes.json()
          setLowStock(l.data?.items || l.data || l)
        } else {
          const l = await lRes.json().catch(() => ({}))
          if (!error) {
            setError(l.error?.message || l.error || 'فشل تحميل المخزون المنخفض')
          }
        }
      } catch (e: any) {
        setError(e.message || 'حدث خطأ في الاتصال')
      } finally {
        setLoading(false)
      }
    }
    fetchReports()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  const totalProducts = valuation?.items?.length || 0
  const totalValue = valuation?.items?.reduce((s: number, i: any) => s + (i.quantity || 0) * (i.unit_cost || 0), 0) || 0
  const lowStockCount = lowStock?.length || 0
  const outOfStockCount = lowStock?.filter((i: any) => (i.quantity || 0) <= 0).length || 0

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">تقارير المخزون</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">إجمالي المنتجات</span>
          </div>
          <p className="text-2xl font-bold">{totalProducts}</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-xs text-muted-foreground">قيمة المخزون</span>
          </div>
          <p className="text-2xl font-bold">{totalValue.toLocaleString()}</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-muted-foreground">مخزون منخفض</span>
          </div>
          <p className="text-2xl font-bold">{lowStockCount}</p>
        </div>
        <div className="bg-card rounded-xl border p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <span className="text-xs text-muted-foreground">نافد</span>
          </div>
          <p className="text-2xl font-bold">{outOfStockCount}</p>
        </div>
      </div>

      <div className="flex gap-2 border-b mb-4">
        <button
          onClick={() => setTab('valuation')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'valuation' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
        >
          تقييم المخزون
        </button>
        <button
          onClick={() => setTab('low-stock')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'low-stock' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
        >
          مخزون منخفض
        </button>
      </div>

      {tab === 'valuation' && valuation?.items && (
        <div className="bg-card rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">المنتج</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">الكمية</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">متوسط التكلفة</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">القيمة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {valuation.items.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-muted/30">
                    <td className="px-4 py-3">{item.name_ar || item.name || item.product}</td>
                    <td className="px-4 py-3">{item.quantity ?? item.qty ?? 0}</td>
                    <td className="px-4 py-3">{(item.unit_cost || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      {((item.quantity || item.qty || 0) * (item.unit_cost || 0)).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'low-stock' && (
        <div className="bg-card rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">المنتج</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">الكمية الحالية</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">الحد الأدنى</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {!lowStock || lowStock.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center py-12 text-muted-foreground">
                      لا توجد منتجات منخفضة المخزون
                    </td>
                  </tr>
                ) : (
                  lowStock.map((item: any, idx: number) => (
                    <tr key={idx} className="hover:bg-muted/30">
                      <td className="px-4 py-3">{item.name_ar || item.name || item.product}</td>
                      <td className="px-4 py-3">
                        <span className={item.quantity <= 0 ? 'text-red-600 font-medium' : 'text-yellow-600'}>
                          {item.quantity ?? item.qty ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">{item.min_stock ?? item.minimum_quantity ?? 0}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
