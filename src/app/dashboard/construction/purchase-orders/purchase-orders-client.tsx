'use client'

import { useState } from 'react'
import { Plus, Search, Trash2, Edit, Download, Eye, EyeOff, Send, PackageCheck, XCircle } from 'lucide-react'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { Pagination } from '@/components/ui/pagination'
import { exportCSV } from '@/lib/export-csv'
import type { ConstructionPurchaseOrder } from '@/types/construction'

interface Project {
  id: string
  name: string
}

const STATUS_AR: Record<string, string> = {
  pending: 'قيد الانتظار',
  sent: 'مرسل',
  partially_received: 'مستلم جزئياً',
  received: 'مستلم',
  cancelled: 'ملغي',
}
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  sent: 'bg-blue-100 text-blue-700',
  partially_received: 'bg-purple-100 text-purple-700',
  received: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-500',
}
const UNIT_OPTIONS = ['unit', 'kg', 'ton', 'm', 'm2', 'm3', 'liter', 'box', 'bag', 'roll', 'other']

const PAGE_SIZE = 20

const emptyForm = {
  project_id: '',
  supplier: '',
  order_date: new Date().toISOString().slice(0, 10),
  notes: '',
  items: [] as { material_name: string; quantity: string; unit: string; unit_price: string; total: string }[],
}

export function PurchaseOrdersClient({
  orders: init,
  projects,
}: {
  orders: ConstructionPurchaseOrder[]
  projects: Project[]
}) {
  const [orders, setOrders] = useState(init)
  const [search, setSearch] = useState('')
  const [filterProject, setFilterProject] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ConstructionPurchaseOrder | null>(null)
  const [form, setForm] = useState<any>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase()
    return (
      (!q ||
        o.supplier.toLowerCase().includes(q) ||
        (o.con_projects?.name || '').toLowerCase().includes(q) ||
        (o.notes || '').toLowerCase().includes(q)) &&
      (!filterProject || o.project_id === filterProject) &&
      (!filterStatus || o.status === filterStatus)
    )
  })

  const totalCount = filtered.length
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const addItem = () => {
    setForm((f: any) => ({
      ...f,
      items: [...f.items, { material_name: '', quantity: '1', unit: 'unit', unit_price: '0', total: '0' }],
    }))
  }

  const updateItem = (idx: number, field: string, value: string) => {
    setForm((f: any) => {
      const items = [...f.items]
      items[idx] = { ...items[idx], [field]: value }
      const q = Number(items[idx].quantity) || 0
      const p = Number(items[idx].unit_price) || 0
      items[idx].total = String(q * p)
      return { ...f, items }
    })
  }

  const removeItem = (idx: number) => {
    setForm((f: any) => ({ ...f, items: f.items.filter((_: any, i: number) => i !== idx) }))
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        ...form,
        project_id: form.project_id || null,
        notes: form.notes || null,
        items: form.items
          .filter((i: any) => i.material_name)
          .map((i: any) => ({
            material_name: i.material_name,
            quantity: Number(i.quantity) || 0,
            unit: i.unit || 'unit',
            unit_price: Number(i.unit_price) || 0,
            total: Number(i.total) || 0,
          })),
      }
      const url = editing ? `/api/construction/purchase-orders/${editing.id}` : '/api/construction/purchase-orders'
      const method = editing ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error)
      }
      if (editing) {
        setOrders((prev) => prev.map((o) => (o.id === editing.id ? { ...o, ...data } : o)))
      } else {
        setOrders((prev) => [data, ...prev])
      }
      setShowForm(false)
      setForm(emptyForm)
      setEditing(null)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const quickStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/construction/purchase-orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      const data = await res.json()
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...data } : o)))
    }
  }

  const openEdit = (o: ConstructionPurchaseOrder) => {
    setForm({
      project_id: o.project_id || '',
      supplier: o.supplier,
      order_date: o.order_date,
      notes: o.notes || '',
      items: (o.con_purchase_order_items || []).map((i) => ({
        material_name: i.material_name,
        quantity: String(i.quantity),
        unit: i.unit,
        unit_price: String(i.unit_price),
        total: String(i.total),
      })),
    })
    setEditing(o)
    setError('')
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف طلب الشراء هذا؟')) {
      return
    }
    setDeleting(id)
    await fetch(`/api/construction/purchase-orders/${id}`, { method: 'DELETE' })
    setOrders((prev) => prev.filter((o) => o.id !== id))
    setDeleting(null)
  }

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <ErrorBoundary>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">أوامر الشراء</h1>
          <div className="flex gap-2">
            <button
              onClick={() =>
                exportCSV(
                  filtered.map((o) => ({
                    التاريخ: o.order_date,
                    المورد: o.supplier,
                    المشروع: o.con_projects?.name || '',
                    الحالة: STATUS_AR[o.status] || o.status,
                    الإجمالي: o.total,
                    ملاحظات: o.notes || '',
                  })),
                  [
                    { key: 'التاريخ', label: 'التاريخ' },
                    { key: 'المورد', label: 'المورد' },
                    { key: 'المشروع', label: 'المشروع' },
                    { key: 'الحالة', label: 'الحالة' },
                    { key: 'الإجمالي', label: 'الإجمالي' },
                    { key: 'ملاحظات', label: 'ملاحظات' },
                  ],
                  'أوامر_الشراء',
                )
              }
              className="border rounded-lg px-3 py-2 text-sm hover:bg-accent flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> تصدير
            </button>
            <button
              onClick={() => {
                setForm(emptyForm)
                setEditing(null)
                setError('')
                setShowForm(true)
              }}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> أمر شراء جديد
            </button>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالمورد أو المشروع..."
              className="w-full border rounded-lg pr-9 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
            />
          </div>
          <select
            value={filterProject}
            onChange={(e) => {
              setFilterProject(e.target.value)
              setPage(1)
            }}
            className="border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">كل المشاريع</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value)
              setPage(1)
            }}
            className="border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">كل الحالات</option>
            {Object.entries(STATUS_AR).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-card border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 w-8" />
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">التاريخ</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">المورد</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">المشروع</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">الحالة</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">الإجمالي</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {paged.map((o) => (
                <tr key={o.id} className="border-t hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleExpand(o.id)}
                      className="p-1 hover:bg-accent rounded text-muted-foreground"
                    >
                      {expanded.has(o.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{o.order_date}</td>
                  <td className="px-4 py-3 font-medium">{o.supplier}</td>
                  <td className="px-4 py-3 text-muted-foreground">{o.con_projects?.name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status]}`}>
                      {STATUS_AR[o.status] || o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-left">{Number(o.total).toLocaleString()} ريال</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {o.status === 'pending' && (
                        <button
                          onClick={() => quickStatus(o.id, 'sent')}
                          className="p-1.5 hover:bg-blue-50 rounded text-blue-500 hover:text-blue-600"
                          title="إرسال"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {o.status === 'sent' && (
                        <button
                          onClick={() => quickStatus(o.id, 'received')}
                          className="p-1.5 hover:bg-green-50 rounded text-green-500 hover:text-green-600"
                          title="استلام"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {(o.status === 'pending' || o.status === 'sent') && (
                        <button
                          onClick={() => quickStatus(o.id, 'cancelled')}
                          className="p-1.5 hover:bg-red-50 rounded text-red-400 hover:text-red-500"
                          title="إلغاء"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(o)}
                        className="p-1.5 hover:bg-blue-50 rounded text-muted-foreground hover:text-blue-500"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(o.id)}
                        disabled={deleting === o.id}
                        className="p-1.5 hover:bg-red-50 rounded text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    لا توجد أوامر شراء
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalCount={totalCount}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
        />

        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-card border rounded-t-2xl sm:rounded-2xl w-full max-w-2xl shadow-2xl pb-safe-bottom max-h-[95vh] overflow-y-auto">
              <div className="p-5 border-b sticky top-0 bg-card z-10">
                <h2 className="font-semibold">{editing ? 'تعديل أمر شراء' : 'أمر شراء جديد'}</h2>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg p-3">{error}</p>}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">المورد *</label>
                    <input
                      required
                      value={form.supplier}
                      onChange={(e) => setForm((f: any) => ({ ...f, supplier: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">التاريخ</label>
                    <input
                      type="date"
                      value={form.order_date}
                      onChange={(e) => setForm((f: any) => ({ ...f, order_date: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">المشروع</label>
                    <select
                      value={form.project_id}
                      onChange={(e) => setForm((f: any) => ({ ...f, project_id: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">— بدون مشروع —</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">ملاحظات</label>
                    <textarea
                      rows={2}
                      value={form.notes}
                      onChange={(e) => setForm((f: any) => ({ ...f, notes: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>

                {/* Items */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">المواد ({form.items.length})</h3>
                    <button
                      type="button"
                      onClick={addItem}
                      className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded-lg hover:bg-primary/90"
                    >
                      + إضافة مادة
                    </button>
                  </div>
                  {form.items.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-4 border-2 border-dashed rounded-lg">
                      أضف المواد المطلوبة في أمر الشراء
                    </p>
                  )}
                  {form.items.map((item: any, idx: number) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 mb-2 items-end">
                      <div className="col-span-4">
                        <label className="text-xs text-muted-foreground mb-0.5 block">المادة *</label>
                        <input
                          required
                          value={item.material_name}
                          onChange={(e) => updateItem(idx, 'material_name', e.target.value)}
                          placeholder="اسم المادة"
                          className="w-full border rounded-lg px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-muted-foreground mb-0.5 block">الكمية</label>
                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                          className="w-full border rounded-lg px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-muted-foreground mb-0.5 block">الوحدة</label>
                        <select
                          value={item.unit}
                          onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                          className="w-full border rounded-lg px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                          {UNIT_OPTIONS.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="text-xs text-muted-foreground mb-0.5 block">سعر الوحدة</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => updateItem(idx, 'unit_price', e.target.value)}
                          className="w-full border rounded-lg px-2 py-1.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="text-xs text-muted-foreground mb-0.5 block">الإجمالي</label>
                        <div className="text-sm font-medium pt-1.5">
                          {(Number(item.quantity) * Number(item.unit_price)).toLocaleString()}
                        </div>
                      </div>
                      <div className="col-span-1">
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="p-1.5 hover:bg-red-50 rounded text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                  >
                    {loading ? 'جاري الحفظ...' : editing ? 'حفظ التعديلات' : 'إنشاء أمر الشراء'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="px-5 py-2 border rounded-lg text-sm hover:bg-accent"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}
