'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Handshake, Edit, Trash2, Phone, Star } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import type { ConstructionSubcontractor } from '@/types/construction'

const STATUS_AR: Record<string, string> = { active: 'نشط', completed: 'مكتمل', cancelled: 'ملغي' }
const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-500',
}
const SPECIALTIES: Record<string, string> = {
  general: 'مقاول عام',
  electrical: 'كهرباء',
  plumbing: 'سباكة',
  painting: 'دهان',
  tiling: 'بلاط',
  carpentry: 'نجارة',
  welding: 'لحام',
  hvac: 'تكييف',
  glass: 'زجاج',
  aluminum: 'ألمنيوم',
  demolition: 'هدم',
  landscaping: 'تنسيق حدائق',
  other: 'أخرى',
}

const emptyForm = {
  name: '',
  phone: '',
  specialty: 'general',
  contract_value: '',
  start_date: '',
  end_date: '',
  status: 'active',
  rating: '',
  notes: '',
}

export function SubcontractorsClient({ currency }: { currency: string }) {
  const [items, setItems] = useState<ConstructionSubcontractor[]>([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ConstructionSubcontractor | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const fmt = (n: number) => formatCurrency(n, currency)

  useEffect(() => {
    fetch('/api/construction/subcontractors')
      .then((r) => r.json())
      .then(setItems)
  }, [])

  const filtered = items.filter((i) => {
    const q = search.toLowerCase()
    return (
      (!q || i.name.toLowerCase().includes(q) || (SPECIALTIES[i.specialty] || '').includes(q)) &&
      (!filterStatus || i.status === filterStatus)
    )
  })

  const openNew = () => {
    setForm(emptyForm)
    setEditing(null)
    setError('')
    setShowForm(true)
  }
  const openEdit = (item: ConstructionSubcontractor) => {
    setForm({
      name: item.name,
      phone: item.phone || '',
      specialty: item.specialty,
      contract_value: String(item.contract_value),
      start_date: item.start_date || '',
      end_date: item.end_date || '',
      status: item.status,
      rating: item.rating !== null ? String(item.rating) : '',
      notes: item.notes || '',
    })
    setEditing(item)
    setError('')
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        ...form,
        contract_value: Number(form.contract_value) || 0,
        rating: form.rating !== '' ? Number(form.rating) : null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      }
      const url = editing ? `/api/construction/subcontractors/${editing.id}` : '/api/construction/subcontractors'
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
        setItems((prev) => prev.map((i) => (i.id === editing.id ? { ...i, ...data } : i)))
      } else {
        setItems((prev) => [data, ...prev])
      }
      setShowForm(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذا المقاول؟')) {
      return
    }
    setDeleting(id)
    await fetch(`/api/construction/subcontractors/${id}`, { method: 'DELETE' })
    setItems((prev) => prev.filter((i) => i.id !== id))
    setDeleting(null)
  }

  return (
    <ErrorBoundary>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">مقاولي الباطن</h1>
          <button
            onClick={openNew}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> مقاول جديد
          </button>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث باسم المقاول..."
              className="w-full border rounded-lg pr-9 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm bg-background"
          >
            <option value="">كل الحالات</option>
            {Object.entries(STATUS_AR).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((item) => (
            <div key={item.id} className="bg-card border rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <Handshake className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{item.name}</h3>
                    <p className="text-xs text-muted-foreground">{SPECIALTIES[item.specialty] || item.specialty}</p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLORS[item.status] || ''}`}
                >
                  {STATUS_AR[item.status] || item.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-muted/40 rounded-lg p-2">
                  <p className="text-muted-foreground">قيمة العقد</p>
                  <p className="font-semibold text-sm mt-0.5">{fmt(item.contract_value)}</p>
                </div>
                <div className="bg-muted/40 rounded-lg p-2">
                  <p className="text-muted-foreground">التقييم</p>
                  <p className="font-semibold text-sm mt-0.5">
                    {item.rating ?? '—'} <Star className="w-3 h-3 inline text-yellow-500 fill-yellow-500" />
                  </p>
                </div>
              </div>

              {(item.start_date || item.end_date) && (
                <div className="flex gap-3 text-xs text-muted-foreground">
                  {item.start_date && <span>من: {item.start_date}</span>}
                  {item.end_date && <span>إلى: {item.end_date}</span>}
                </div>
              )}

              {item.phone && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="w-3.5 h-3.5" />
                  <span dir="ltr">{item.phone}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-1 pt-1 border-t">
                <button
                  onClick={() => openEdit(item)}
                  className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  disabled={deleting === item.id}
                  className="p-1.5 hover:bg-red-50 rounded-lg text-muted-foreground hover:text-red-500"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              <Handshake className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>لا يوجد مقاولي باطن</p>
            </div>
          )}
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-card border rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl max-h-[92vh] overflow-y-auto">
              <div className="p-5 border-b">
                <h2 className="font-semibold">{editing ? 'تعديل مقاول' : 'مقاول جديد'}</h2>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg p-3">{error}</p>}
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">الاسم *</label>
                    <input
                      required
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">الهاتف</label>
                    <input
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">التخصص</label>
                    <select
                      value={form.specialty}
                      onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                    >
                      {Object.entries(SPECIALTIES).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">قيمة العقد</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.contract_value}
                      onChange={(e) => setForm((f) => ({ ...f, contract_value: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">تاريخ البداية</label>
                    <input
                      type="date"
                      value={form.start_date}
                      onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">تاريخ النهاية</label>
                    <input
                      type="date"
                      value={form.end_date}
                      onChange={(e) => setForm((f) => ({ ...f, end_date: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">الحالة</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                    >
                      {Object.entries(STATUS_AR).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">التقييم (1-5)</label>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      step="0.1"
                      value={form.rating}
                      onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">ملاحظات</label>
                    <textarea
                      rows={2}
                      value={form.notes}
                      onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                  >
                    {loading ? 'جاري الحفظ...' : editing ? 'حفظ التعديلات' : 'إضافة المقاول'}
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
