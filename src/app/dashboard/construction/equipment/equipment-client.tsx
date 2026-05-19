'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Wrench, Edit, Trash2, Calendar, Cpu } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import type { ConstructionEquipment } from '@/types/construction'

const STATUS_AR: Record<string, string> = { available: 'متاح', busy: 'مستخدم', maintenance: 'صيانة', retired: 'متقاعد' }
const STATUS_COLORS: Record<string, string> = {
  available: 'bg-green-100 text-green-700',
  busy: 'bg-blue-100 text-blue-700',
  maintenance: 'bg-yellow-100 text-yellow-700',
  retired: 'bg-gray-100 text-gray-600',
}
const EQUIP_TYPES: Record<string, string> = {
  excavator: 'حفارة',
  crane: 'رافعة',
  mixer: 'خلاطة',
  generator: 'مولد',
  compressor: 'ضاغط',
  pump: 'مضخة',
  welder: 'لحام',
  saw: 'منشار',
  drill: 'مثقاب',
  truck: 'شاحنة',
  forklift: 'رافعة شوكية',
  roller: 'مدحلة',
  scaffolding: 'سقالة',
  other: 'أخرى',
}

const emptyForm = {
  name: '',
  type: 'other',
  model: '',
  serial_number: '',
  status: 'available',
  daily_rate: '',
  purchase_date: '',
  last_maintenance: '',
  next_maintenance: '',
  notes: '',
}

export function EquipmentClient({ currency }: { currency: string }) {
  const [items, setItems] = useState<ConstructionEquipment[]>([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ConstructionEquipment | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const fmt = (n: number) => formatCurrency(n, currency)

  useEffect(() => {
    fetch('/api/construction/equipment')
      .then((r) => r.json())
      .then(setItems)
  }, [])

  const filtered = items.filter((i) => {
    const q = search.toLowerCase()
    return (
      (!q || i.name.toLowerCase().includes(q) || (EQUIP_TYPES[i.type] || '').includes(q)) &&
      (!filterStatus || i.status === filterStatus)
    )
  })

  const openNew = () => {
    setForm(emptyForm)
    setEditing(null)
    setError('')
    setShowForm(true)
  }
  const openEdit = (item: ConstructionEquipment) => {
    setForm({
      name: item.name,
      type: item.type,
      model: item.model || '',
      serial_number: item.serial_number || '',
      status: item.status,
      daily_rate: String(item.daily_rate),
      purchase_date: item.purchase_date || '',
      last_maintenance: item.last_maintenance || '',
      next_maintenance: item.next_maintenance || '',
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
        daily_rate: Number(form.daily_rate) || 0,
        purchase_date: form.purchase_date || null,
        last_maintenance: form.last_maintenance || null,
        next_maintenance: form.next_maintenance || null,
      }
      const url = editing ? `/api/construction/equipment/${editing.id}` : '/api/construction/equipment'
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
    if (!confirm('هل تريد حذف هذه المعدة؟')) {
      return
    }
    setDeleting(id)
    await fetch(`/api/construction/equipment/${id}`, { method: 'DELETE' })
    setItems((prev) => prev.filter((i) => i.id !== id))
    setDeleting(null)
  }

  return (
    <ErrorBoundary>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">المعدات والآليات</h1>
          <button
            onClick={openNew}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> معدة جديدة
          </button>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث باسم المعدة..."
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
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{item.name}</h3>
                    <p className="text-xs text-muted-foreground">{EQUIP_TYPES[item.type] || item.type}</p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLORS[item.status] || ''}`}
                >
                  {STATUS_AR[item.status] || item.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {item.model && (
                  <div className="bg-muted/40 rounded-lg p-2">
                    <p className="text-muted-foreground">الموديل</p>
                    <p className="font-semibold text-sm mt-0.5">{item.model}</p>
                  </div>
                )}
                <div className="bg-muted/40 rounded-lg p-2">
                  <p className="text-muted-foreground">السعر اليومي</p>
                  <p className="font-semibold text-sm mt-0.5">{fmt(item.daily_rate)}</p>
                </div>
                {item.serial_number && (
                  <div className="bg-muted/40 rounded-lg p-2 col-span-2">
                    <p className="text-muted-foreground">الرقم التسلسلي</p>
                    <p className="font-medium text-sm mt-0.5" dir="ltr">
                      {item.serial_number}
                    </p>
                  </div>
                )}
              </div>

              {item.next_maintenance && (
                <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 rounded-lg p-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>الصيانة القادمة: {item.next_maintenance}</span>
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
              <Cpu className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد معدات</p>
            </div>
          )}
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-card border rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl max-h-[92vh] overflow-y-auto">
              <div className="p-5 border-b">
                <h2 className="font-semibold">{editing ? 'تعديل معدة' : 'معدة جديدة'}</h2>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg p-3">{error}</p>}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">الاسم *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">النوع</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                    >
                      {Object.entries(EQUIP_TYPES).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
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
                    <label className="text-xs text-muted-foreground mb-1 block">الموديل</label>
                    <input
                      value={form.model}
                      onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">الرقم التسلسلي</label>
                    <input
                      value={form.serial_number}
                      onChange={(e) => setForm((f) => ({ ...f, serial_number: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">السعر اليومي</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.daily_rate}
                      onChange={(e) => setForm((f) => ({ ...f, daily_rate: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">تاريخ الشراء</label>
                    <input
                      type="date"
                      value={form.purchase_date}
                      onChange={(e) => setForm((f) => ({ ...f, purchase_date: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">آخر صيانة</label>
                    <input
                      type="date"
                      value={form.last_maintenance}
                      onChange={(e) => setForm((f) => ({ ...f, last_maintenance: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">الصيانة القادمة</label>
                    <input
                      type="date"
                      value={form.next_maintenance}
                      onChange={(e) => setForm((f) => ({ ...f, next_maintenance: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">ملاحظات</label>
                  <textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                  >
                    {loading ? 'جاري الحفظ...' : editing ? 'حفظ التعديلات' : 'إضافة المعدة'}
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
