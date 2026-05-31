'use client'

import { useState, useMemo } from 'react'
import { Search, Truck, Plus, Loader2, Check, X, ArrowLeftRight, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n/language-provider'
import { localizedName } from '@/lib/i18n'

interface TransfersClientProps {
  transfers: any[]
  warehouses: any[]
  products: any[]
  inventory: any[]
  companyId: string
  currency: string
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'مسودة', color: 'bg-gray-100 text-gray-700' },
  pending: { label: 'قيد الانتظار', color: 'bg-yellow-100 text-yellow-700' },
  approved: { label: 'معتمد', color: 'bg-blue-100 text-blue-700' },
  transferred: { label: 'منقول', color: 'bg-green-100 text-green-700' },
  received: { label: 'مستلم', color: 'bg-green-100 text-green-700' },
  completed: { label: 'مكتمل', color: 'bg-green-100 text-green-700' },
  reversed: { label: 'ملغي', color: 'bg-orange-100 text-orange-700' },
  cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-700' },
}

export function TransfersClient({
  transfers: initialTransfers,
  warehouses,
  products,
  inventory,
  companyId,
  currency,
}: TransfersClientProps) {
  const { t, lang } = useT()
  const [transfers, setTransfers] = useState(initialTransfers)
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [transferForm, setTransferForm] = useState({
    from_warehouse_id: '',
    to_warehouse_id: '',
    reference: `TRF-${Date.now()}`,
    notes: '',
  })
  const [transferItems, setTransferItems] = useState([{ item_id: '', qty: 1 }])

  const productsByWarehouse = useMemo(() => {
    const map: Record<string, any[]> = {}
    for (const inv of inventory) {
      if (!map[inv.warehouse_id]) {
        map[inv.warehouse_id] = []
      }
      map[inv.warehouse_id].push(inv)
    }
    return map
  }, [inventory])

  const availableProducts = useMemo(() => {
    if (!transferForm.from_warehouse_id) {
      return products
    }
    const invItems = productsByWarehouse[transferForm.from_warehouse_id] || []
    const productIds = new Set(invItems.map((i: any) => i.product_id))
    return products.filter((p: any) => productIds.has(p.id))
  }, [products, productsByWarehouse, transferForm.from_warehouse_id])

  const filtered = useMemo(
    () =>
      transfers.filter((t) => {
        if (!search) {
          return true
        }
        const q = search.toLowerCase()
        return (
          (t.reference || '').toLowerCase().includes(q) ||
          (localizedName(t.from_warehouse || ({} as any), lang) || '').includes(search)
        )
      }),
    [transfers, search],
  )

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه التحويلة؟')) {
      return
    }
    setActionLoading(id)
    try {
      const res = await fetch(`/api/inventory/transfers/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message || 'فشل الحذف')
      }
      setTransfers((prev) => prev.filter((t) => t.id !== id))
    } catch (e: any) {
      alert(e.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleReverse = async (id: string) => {
    const reason = prompt('سبب الإلغاء (اختياري):')
    setActionLoading(id)
    try {
      const res = await fetch(`/api/inventory/transfers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reverse', reason }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error?.message || 'فشل الإلغاء')
      }
      setTransfers((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: 'reversed', notes: reason || t.notes } : t)),
      )
    } catch (e: any) {
      alert(e.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleAction = async (id: string, action: string) => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/inventory/transfers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error?.message || 'فشل العملية')
      }
      setTransfers((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, status: action === 'approve' ? 'approved' : action === 'receive' ? 'received' : 'cancelled' }
            : t,
        ),
      )
    } catch (e: any) {
      alert(e.message)
    } finally {
      setActionLoading(null)
    }
  }

  const addTransferItem = () => setTransferItems((prev) => [...prev, { item_id: '', qty: 1 }])
  const removeTransferItem = (idx: number) => setTransferItems((prev) => prev.filter((_, i) => i !== idx))
  const updateTransferItem = (idx: number, field: string, value: any) => {
    setTransferItems((prev) => {
      const updated = [...prev]
      updated[idx] = { ...updated[idx], [field]: value }
      return updated
    })
  }

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transferForm.from_warehouse_id || !transferForm.to_warehouse_id) {
      setError('اختر المستودع المصدر والمستودع الهدف')
      return
    }
    if (transferForm.from_warehouse_id === transferForm.to_warehouse_id) {
      setError('يجب أن يختلف المستودع المصدر عن المستودع الهدف')
      return
    }
    if (transferItems.some((i) => !i.item_id)) {
      setError('اختر المنتج لجميع الأصناف')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/inventory/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_warehouse_id: transferForm.from_warehouse_id,
          to_warehouse_id: transferForm.to_warehouse_id,
          notes: transferForm.notes,
          lines: transferItems,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error?.message || data.error || 'حدث خطأ')
      }
      setTransfers((prev) => [data.data || data, ...prev])
      setShowForm(false)
      setTransferForm({
        from_warehouse_id: '',
        to_warehouse_id: '',
        reference: `TRF-${Date.now()}`,
        notes: '',
      })
      setTransferItems([{ item_id: '', qty: 1 }])
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">التحويلات</h1>
          <p className="text-sm text-muted-foreground">{transfers.length} تحويلة</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          تحويلة جديدة
        </button>
      </div>

      <div className="relative flex-1">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث..."
          className="w-full border border-input rounded-lg px-3 py-2 pr-9 text-sm bg-background focus:outline-none"
        />
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">المرجع</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">من مستودع</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">إلى مستودع</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">الحالة</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">التاريخ</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    لا توجد تحويلات
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{t.reference || '—'}</td>
                    <td className="px-4 py-3">{localizedName(t.from_warehouse || ({} as any), lang) || '—'}</td>
                    <td className="px-4 py-3">{localizedName(t.to_warehouse || ({} as any), lang) || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={cn('text-xs px-2 py-0.5 rounded-full font-medium', STATUS_LABELS[t.status]?.color)}
                      >
                        {STATUS_LABELS[t.status]?.label || t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(t.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {t.status === 'draft' && (
                          <>
                            <button
                              onClick={() => handleAction(t.id, 'approve')}
                              disabled={actionLoading === t.id}
                              className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600"
                              title="اعتماد"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(t.id)}
                              disabled={actionLoading === t.id}
                              className="p-1.5 hover:bg-red-100 rounded-lg text-red-600"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {(t.status === 'completed' || t.status === 'received') && (
                          <button
                            onClick={() => handleReverse(t.id)}
                            disabled={actionLoading === t.id}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200"
                            title="إلغاء التحويلة وعكس حركة المخزون"
                          >
                            <ArrowLeftRight className="w-3 h-3" />
                            إلغاء
                          </button>
                        )}
                        {actionLoading === t.id && (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Transfer Modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
        >
          <div className="bg-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-lg">تحويلة جديدة</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-accent rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateTransfer} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">من مستودع</label>
                  <select
                    value={transferForm.from_warehouse_id}
                    onChange={(e) => setTransferForm((f) => ({ ...f, from_warehouse_id: e.target.value }))}
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none"
                    required
                  >
                    <option value="">اختر المستودع</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {localizedName(w, lang)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">إلى مستودع</label>
                  <select
                    value={transferForm.to_warehouse_id}
                    onChange={(e) => setTransferForm((f) => ({ ...f, to_warehouse_id: e.target.value }))}
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none"
                    required
                  >
                    <option value="">اختر المستودع</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {localizedName(w, lang)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">المرجع</label>
                <input
                  type="text"
                  value={transferForm.reference}
                  onChange={(e) => setTransferForm((f) => ({ ...f, reference: e.target.value }))}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none"
                />
              </div>

              {/* Transfer Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">المنتجات</label>
                  <button
                    type="button"
                    onClick={addTransferItem}
                    className="text-xs text-primary flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3 h-3" /> إضافة صنف
                  </button>
                </div>
                <div className="space-y-2">
                  {transferItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-7">
                        <select
                          value={item.item_id}
                          onChange={(e) => updateTransferItem(idx, 'item_id', e.target.value)}
                          className="w-full border border-input rounded-lg px-2 py-1.5 text-sm bg-background focus:outline-none"
                        >
                          <option value="">اختر المنتج</option>
                          {availableProducts.map((p: any) => (
                            <option key={p.id} value={p.id}>
                              {localizedName(p, lang)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          min="0.001"
                          step="0.001"
                          value={item.qty}
                          onChange={(e) => updateTransferItem(idx, 'qty', parseFloat(e.target.value) || 0)}
                          placeholder="الكمية"
                          className="w-full border border-input rounded-lg px-2 py-1.5 text-sm bg-background focus:outline-none text-center"
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        {transferItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeTransferItem(idx)}
                            className="text-muted-foreground hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">ملاحظات</label>
                <input
                  type="text"
                  value={transferForm.notes}
                  onChange={(e) => setTransferForm((f) => ({ ...f, notes: e.target.value }))}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none"
                />
              </div>

              {error && (
                <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  حفظ التحويلة
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 border border-input rounded-lg text-sm hover:bg-accent"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
