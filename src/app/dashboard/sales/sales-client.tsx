'use client'

import { useState, useMemo } from 'react'
import { Search, ShoppingBag, Pencil, Trash2, X, Check, Loader2 } from 'lucide-react'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import type { Sale } from '@/types/erp'
import Link from 'next/link'

interface SalesClientProps {
  sales: Sale[]
  customers: any[]
  products: any[]
  currency: string
  companyId: string
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  completed: { label: 'مكتملة', color: 'bg-green-100 text-green-700 dark:bg-green-900/30' },
  draft: { label: 'مسودة', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30' },
  cancelled: { label: 'ملغاة', color: 'bg-red-100 text-red-700 dark:bg-red-900/30' },
  returned: { label: 'مرتجعة', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30' },
}

const PAYMENT_STATUS: Record<string, { label: string; color: string }> = {
  paid: { label: 'مدفوعة', color: 'bg-green-100 text-green-700 dark:bg-green-900/30' },
  partial: { label: 'جزئي', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30' },
  unpaid: { label: 'غير مدفوعة', color: 'bg-red-100 text-red-700 dark:bg-red-900/30' },
  refunded: { label: 'مسترجعة', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30' },
}

export function SalesClient({ sales: initial, customers, products, currency, companyId }: SalesClientProps) {
  const [sales, setSales] = useState(initial)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPayment, setFilterPayment] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingSale, setEditingSale] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [form, setForm] = useState({
    customer_id: '',
    notes: '',
    payment_status: 'paid',
  })

  const filtered = useMemo(
    () =>
      sales.filter((s) => {
        const matchSearch =
          !search ||
          s.invoice_number.includes(search) ||
          (s.customers as any)?.name?.toLowerCase().includes(search.toLowerCase())
        const matchStatus = !filterStatus || s.status === filterStatus
        const matchPayment = !filterPayment || s.payment_status === filterPayment
        return matchSearch && matchStatus && matchPayment
      }),
    [sales, search, filterStatus, filterPayment],
  )

  const today = new Date().toDateString()
  const todaySales = sales.filter((s) => new Date(s.sale_date).toDateString() === today && s.status === 'completed')
  const totalToday = todaySales.reduce((s, sale) => s + sale.total, 0)
  const totalMonth = sales
    .filter((s) => {
      const d = new Date(s.sale_date)
      const now = new Date()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && s.status === 'completed'
    })
    .reduce((s, sale) => s + sale.total, 0)
  const unpaidTotal = sales
    .filter((s) => s.payment_status === 'unpaid' || s.payment_status === 'partial')
    .reduce((s, sale) => s + sale.due_amount, 0)

  const openEdit = (s: any) => {
    setEditingSale(s)
    setForm({
      customer_id: s.customer_id || '',
      notes: s.notes || '',
      payment_status: s.payment_status || 'paid',
    })
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingSale(null)
    setForm({ customer_id: '', notes: '', payment_status: 'paid' })
    setError('')
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingSale) {
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/sales/${editingSale.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ')
      }
      setSales((prev) => prev.map((s) => (s.id === editingSale.id ? { ...s, ...data.sale } : s)))
      closeForm()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/sales/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'حدث خطأ')
      }
      setSales((prev) => prev.filter((s) => s.id !== id))
      setConfirmDelete(null)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">فواتير المبيعات</h1>
          <p className="text-sm text-muted-foreground">{sales.length} فاتورة</p>
        </div>
        <Link
          href="/dashboard/pos"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90"
        >
          <ShoppingBag className="w-4 h-4" />
          فاتورة جديدة (POS)
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
          <p className="text-xs text-green-600 opacity-70">مبيعات اليوم</p>
          <p className="text-lg font-bold text-green-700 mt-0.5 truncate">{formatCurrency(totalToday, currency)}</p>
          <p className="text-xs text-green-600">{todaySales.length} فاتورة</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
          <p className="text-xs text-blue-600 opacity-70">مبيعات الشهر</p>
          <p className="text-lg font-bold text-blue-700 mt-0.5 truncate">{formatCurrency(totalMonth, currency)}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
          <p className="text-xs text-red-600 opacity-70">فواتير مستحقة</p>
          <p className="text-lg font-bold text-red-700 mt-0.5 truncate">{formatCurrency(unpaidTotal, currency)}</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3">
          <p className="text-xs text-purple-600 opacity-70">إجمالي الفواتير</p>
          <p className="text-2xl font-bold text-purple-700">{sales.length}</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث برقم الفاتورة أو العميل..."
            className="w-full border border-input rounded-lg pr-9 pl-3 h-11 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-input rounded-lg px-3 h-11 text-sm bg-background focus:outline-none min-w-[120px]"
        >
          <option value="">كل الحالات</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <select
          value={filterPayment}
          onChange={(e) => setFilterPayment(e.target.value)}
          className="border border-input rounded-lg px-3 h-11 text-sm bg-background focus:outline-none min-w-[120px]"
        >
          <option value="">كل المدفوعات</option>
          {Object.entries(PAYMENT_STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">رقم الفاتورة</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">العميل</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">التاريخ</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">الإجمالي</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">الحالة</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">الدفع</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-muted-foreground">
                    لا توجد فواتير
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-primary">{s.invoice_number}</td>
                    <td className="px-4 py-3">
                      {(s.customers as any)?.name || <span className="text-muted-foreground">نقدي</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{formatDate(s.sale_date)}</td>
                    <td className="px-4 py-3 font-bold">{formatCurrency(s.total, currency)}</td>
                    <td className="px-4 py-3">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full', STATUS_LABELS[s.status]?.color)}>
                        {STATUS_LABELS[s.status]?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <span
                          className={cn('text-xs px-2 py-0.5 rounded-full', PAYMENT_STATUS[s.payment_status]?.color)}
                        >
                          {PAYMENT_STATUS[s.payment_status]?.label}
                        </span>
                        {s.due_amount > 0 && (
                          <p className="text-xs text-red-500">{formatCurrency(s.due_amount, currency)}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {s.status !== 'cancelled' && (
                          <button
                            onClick={() => openEdit(s)}
                            className="p-1.5 hover:bg-accent rounded-lg transition-colors"
                            title="تعديل"
                          >
                            <Pencil className="w-4 h-4 text-muted-foreground" />
                          </button>
                        )}
                        <button
                          onClick={() => setConfirmDelete(s.id)}
                          className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showForm && editingSale && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={(e) => e.target === e.currentTarget && closeForm()}
        >
          <div className="bg-card rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-lg">تعديل فاتورة مبيعات</h2>
              <button onClick={closeForm} className="p-2 hover:bg-accent rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">رقم الفاتورة</label>
                  <input
                    type="text"
                    value={editingSale.invoice_number}
                    disabled
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-muted focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">الإجمالي</label>
                  <input
                    type="text"
                    value={formatCurrency(editingSale.total, currency)}
                    disabled
                    className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-muted focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">العميل</label>
                <select
                  value={form.customer_id}
                  onChange={(e) => setForm((f) => ({ ...f, customer_id: e.target.value }))}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none"
                >
                  <option value="">نقدي</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">حالة الدفع</label>
                <select
                  value={form.payment_status}
                  onChange={(e) => setForm((f) => ({ ...f, payment_status: e.target.value }))}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none"
                >
                  <option value="paid">مدفوعة</option>
                  <option value="partial">دفع جزئي</option>
                  <option value="unpaid">غير مدفوعة</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">ملاحظات</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
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
                  حفظ التعديلات
                </button>
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 border border-input rounded-lg text-sm hover:bg-accent"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setConfirmDelete(null)}
        >
          <div className="bg-card rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
            <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="font-bold text-lg mb-2">حذف الفاتورة</h3>
            <p className="text-sm text-muted-foreground mb-5">
              هل أنت متأكد من حذف هذه الفاتورة؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={loading}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                حذف
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 border border-input rounded-lg text-sm hover:bg-accent"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
