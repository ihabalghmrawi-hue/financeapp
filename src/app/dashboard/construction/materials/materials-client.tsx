'use client'

import { useState } from 'react'
import { Plus, Search, Trash2, Edit, Download } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { exportCSV } from '@/lib/export-csv'
import type { ConstructionMaterial } from '@/types/construction'

interface Project {
  id: string
  name: string
}

// DB CHECK: ('unit','kg','ton','m','m2','m3','liter','box','bag','roll','other')
const UNITS: Record<string, string> = {
  unit: 'وحدة',
  kg: 'كيلو',
  ton: 'طن',
  m: 'متر',
  m2: 'متر مربع',
  m3: 'متر مكعب',
  liter: 'لتر',
  box: 'صندوق',
  bag: 'كيس',
  roll: 'رول',
  other: 'أخرى',
}

const emptyForm = {
  project_id: '',
  name: '',
  supplier: '',
  unit: 'unit',
  quantity: '',
  unit_price: '',
  purchase_date: new Date().toISOString().slice(0, 10),
  notes: '',
}

export function MaterialsClient({
  materials: init,
  projects,
  currency,
}: {
  materials: ConstructionMaterial[]
  projects: Project[]
  currency: string
}) {
  const [materials, setMaterials] = useState(init)
  const [search, setSearch] = useState('')
  const [filterProject, setFilterProject] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<any>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editing, setEditing] = useState<ConstructionMaterial | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  const fmt = (n: number) => formatCurrency(n, currency)

  const filtered = materials.filter((m) => {
    const q = search.toLowerCase()
    return (
      (!q || m.name.toLowerCase().includes(q) || (m.supplier || '').toLowerCase().includes(q)) &&
      (!filterProject || m.project_id === filterProject)
    )
  })

  const total = filtered.reduce((s, m) => s + Number(m.total_cost || Number(m.quantity) * Number(m.unit_price)), 0)

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        ...form,
        quantity: Number(form.quantity) || 0,
        unit_price: Number(form.unit_price) || 0,
        project_id: form.project_id || null,
        supplier: form.supplier || null,
        notes: form.notes || null,
      }
      const url = editing ? `/api/construction/materials/${editing.id}` : '/api/construction/materials'
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
        setMaterials((prev) => prev.map((m) => (m.id === editing.id ? { ...m, ...data } : m)))
      } else {
        setMaterials((prev) => [data, ...prev])
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

  const openEdit = (m: ConstructionMaterial) => {
    setForm({
      project_id: m.project_id || '',
      name: m.name,
      supplier: m.supplier || '',
      unit: m.unit,
      quantity: String(m.quantity),
      unit_price: String(m.unit_price),
      purchase_date: m.purchase_date || new Date().toISOString().slice(0, 10),
      notes: m.notes || '',
    })
    setEditing(m)
    setError('')
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذا الصنف؟')) {
      return
    }
    setDeleting(id)
    await fetch(`/api/construction/materials/${id}`, { method: 'DELETE' })
    setMaterials((prev) => prev.filter((m) => m.id !== id))
    setDeleting(null)
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map((m) => m.id)))
    }
  }

  const bulkDelete = async () => {
    if (!confirm(`هل تريد حذف ${selected.size} صنف؟`)) {
      return
    }
    setBulkLoading(true)
    const ids = Array.from(selected)
    await Promise.all(ids.map((id) => fetch(`/api/construction/materials/${id}`, { method: 'DELETE' })))
    setMaterials((prev) => prev.filter((m) => !selected.has(m.id)))
    setSelected(new Set())
    setBulkLoading(false)
  }

  return (
    <ErrorBoundary>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">المواد والمشتريات</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              الإجمالي: <span className="font-semibold text-foreground">{fmt(total)}</span>
            </p>
          </div>
          <button
            onClick={() => {
              setForm(emptyForm)
              setEditing(null)
              setError('')
              setShowForm(true)
            }}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> إضافة مواد
          </button>
          <button
            onClick={() =>
              exportCSV(
                filtered.map((m) => ({
                  التاريخ: m.purchase_date,
                  المادة: m.name,
                  المشروع: m.con_projects?.name || '',
                  المورد: m.supplier || '',
                  الكمية: `${m.quantity} ${UNITS[m.unit] || m.unit}`,
                  'سعر الوحدة': m.unit_price,
                  الإجمالي: m.total_cost || m.quantity * m.unit_price,
                })),
                [
                  { key: 'التاريخ', label: 'التاريخ' },
                  { key: 'المادة', label: 'المادة' },
                  { key: 'المشروع', label: 'المشروع' },
                  { key: 'المورد', label: 'المورد' },
                  { key: 'الكمية', label: 'الكمية' },
                  { key: 'سعر الوحدة', label: 'سعر الوحدة' },
                  { key: 'الإجمالي', label: 'الإجمالي' },
                ],
                'المواد',
              )
            }
            className="border rounded-lg px-3 py-2 text-sm hover:bg-accent flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> تصدير
          </button>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالمادة أو المورد..."
              className="w-full border rounded-lg pr-9 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
            />
          </div>
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">كل المشاريع</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-card border rounded-xl overflow-x-auto">
          {selected.size > 0 && (
            <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/5 border-b">
              <span className="text-sm font-medium">{selected.size} مختار</span>
              <button
                onClick={bulkDelete}
                disabled={bulkLoading}
                className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Trash2 className="w-3 h-3" /> حذف المحدد
              </button>
              <button
                onClick={() => setSelected(new Set())}
                className="text-xs border px-3 py-1.5 rounded-lg hover:bg-accent"
              >
                إلغاء التحديد
              </button>
            </div>
          )}
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-2 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                  />
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">التاريخ</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">المادة</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">المشروع</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">المورد</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">الكمية</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">سعر الوحدة</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">الإجمالي</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr
                  key={m.id}
                  className={`border-t hover:bg-muted/20 transition-colors ${selected.has(m.id) ? 'bg-primary/5' : ''}`}
                >
                  <td className="px-2 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(m.id)}
                      onChange={() => toggleSelect(m.id)}
                      className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                    />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{m.purchase_date}</td>
                  <td className="px-4 py-3 font-medium">{m.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.con_projects?.name || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.supplier || '—'}</td>
                  <td className="px-4 py-3">
                    {Number(m.quantity)} {UNITS[m.unit] || m.unit}
                  </td>
                  <td className="px-4 py-3">{fmt(Number(m.unit_price))}</td>
                  <td className="px-4 py-3 font-medium text-left">
                    {fmt(Number(m.total_cost || Number(m.quantity) * Number(m.unit_price)))}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(m)}
                        className="p-1.5 hover:bg-blue-50 rounded text-muted-foreground hover:text-blue-500 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        disabled={deleting === m.id}
                        className="p-1.5 hover:bg-red-50 rounded text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground">
                    لا توجد مواد
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-card border rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl pb-safe-bottom max-h-[92vh] overflow-y-auto">
              <div className="p-5 border-b">
                <h2 className="font-semibold">{editing ? 'تعديل المواد' : 'إضافة مواد'}</h2>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg p-3">{error}</p>}
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">اسم المادة *</label>
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">المشروع *</label>
                    <select
                      required
                      value={form.project_id}
                      onChange={(e) => setForm((f: any) => ({ ...f, project_id: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">— اختر مشروعاً —</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">المورد</label>
                    <input
                      value={form.supplier}
                      onChange={(e) => setForm((f: any) => ({ ...f, supplier: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">الكمية *</label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.001"
                      value={form.quantity}
                      onChange={(e) => setForm((f: any) => ({ ...f, quantity: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">الوحدة</label>
                    <select
                      value={form.unit}
                      onChange={(e) => setForm((f: any) => ({ ...f, unit: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {Object.entries(UNITS).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">سعر الوحدة *</label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.unit_price}
                      onChange={(e) => setForm((f: any) => ({ ...f, unit_price: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">تاريخ الشراء</label>
                    <input
                      type="date"
                      value={form.purchase_date}
                      onChange={(e) => setForm((f: any) => ({ ...f, purchase_date: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
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
                  {form.quantity && form.unit_price && (
                    <div className="col-span-2 bg-primary/5 rounded-lg p-3 text-sm">
                      الإجمالي:{' '}
                      <span className="font-bold text-primary">
                        {fmt(Number(form.quantity) * Number(form.unit_price))}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                  >
                    {loading ? 'جاري الحفظ...' : editing ? 'حفظ التعديلات' : 'إضافة المواد'}
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
