'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Shield, Edit, Trash2, AlertTriangle, Building2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import type { ConstructionSafetyIncident } from '@/types/construction'

const SEVERITY_AR: Record<string, string> = { low: 'بسيط', medium: 'متوسط', high: 'خطير', critical: 'حرج' }
const SEVERITY_COLORS: Record<string, string> = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-600',
}
const INCIDENT_TYPES: Record<string, string> = {
  fall: 'سقوط',
  'electric-shock': 'صعقة كهربائية',
  fire: 'حريق',
  collapse: 'انهيار',
  'equipment-failure': 'عطل معدات',
  'chemical-spill': 'تسرب كيميائي',
  injury: 'إصابة',
  'near-miss': 'حادث وشيك',
  theft: 'سرقة',
  vandalism: 'تخريب',
  other: 'أخرى',
}
const STATUS_AR: Record<string, string> = {
  open: 'مفتوح',
  investigating: 'قيد التحقيق',
  resolved: 'تم الحل',
  closed: 'مغلق',
}
const STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-100 text-red-600',
  investigating: 'bg-yellow-100 text-yellow-700',
  resolved: 'bg-blue-100 text-blue-700',
  closed: 'bg-gray-100 text-gray-600',
}

const emptyForm = {
  project_id: '',
  incident_date: new Date().toISOString().slice(0, 10),
  type: 'other',
  severity: 'low',
  description: '',
  location: '',
  reported_by: '',
  actions_taken: '',
  notes: '',
}

export function SafetyIncidentsClient({ currency }: { currency: string }) {
  const [items, setItems] = useState<ConstructionSafetyIncident[]>([])
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ConstructionSafetyIncident | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/construction/safety-incidents').then((r) => r.json()),
      fetch('/api/construction/projects').then((r) => r.json()),
    ]).then(([incidents, projs]) => {
      setItems(incidents)
      setProjects(projs)
    })
  }, [])

  const filtered = items.filter((i) => {
    const q = search.toLowerCase()
    return (
      (!q || i.description.toLowerCase().includes(q) || (INCIDENT_TYPES[i.type] || '').includes(q)) &&
      (!filterStatus || i.status === filterStatus)
    )
  })

  const openNew = () => {
    setForm(emptyForm)
    setEditing(null)
    setError('')
    setShowForm(true)
  }
  const openEdit = (item: ConstructionSafetyIncident) => {
    setForm({
      project_id: item.project_id || '',
      incident_date: item.incident_date,
      type: item.type,
      severity: item.severity,
      description: item.description,
      location: item.location || '',
      reported_by: item.reported_by || '',
      actions_taken: item.actions_taken || '',
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
      const payload = { ...form, project_id: form.project_id || null }
      const url = editing ? `/api/construction/safety-incidents/${editing.id}` : '/api/construction/safety-incidents'
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
    if (!confirm('هل تريد حذف هذا البلاغ؟')) {
      return
    }
    setDeleting(id)
    await fetch(`/api/construction/safety-incidents/${id}`, { method: 'DELETE' })
    setItems((prev) => prev.filter((i) => i.id !== id))
    setDeleting(null)
  }

  const updateStatus = async (item: ConstructionSafetyIncident, status: string) => {
    const res = await fetch(`/api/construction/safety-incidents/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        resolved_at:
          status === 'closed' || status === 'resolved' ? new Date().toISOString().slice(0, 10) : item.resolved_at,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, ...data } : i)))
    }
  }

  return (
    <ErrorBoundary>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">بلاغات السلامة</h1>
          <button
            onClick={openNew}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> بلاغ جديد
          </button>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث..."
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

        <div className="space-y-3">
          {filtered.map((item) => (
            <div key={item.id} className="bg-card border rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-semibold text-sm">{INCIDENT_TYPES[item.type] || item.type}</h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${SEVERITY_COLORS[item.severity] || ''}`}
                    >
                      {SEVERITY_AR[item.severity] || item.severity}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[item.status] || ''}`}
                    >
                      {STATUS_AR[item.status] || item.status}
                    </span>
                  </div>
                  <p className="text-sm mb-2">{item.description}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>{item.incident_date}</span>
                    {item.con_projects && (
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {item.con_projects.name}
                      </span>
                    )}
                    {item.location && <span>الموقع: {item.location}</span>}
                    {item.reported_by && <span>المبلغ: {item.reported_by}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {(item.status === 'open' || item.status === 'investigating') && (
                    <>
                      <button
                        onClick={() => updateStatus(item, 'investigating')}
                        className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200"
                      >
                        تحقيق
                      </button>
                      <button
                        onClick={() => updateStatus(item, 'resolved')}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                      >
                        حل
                      </button>
                    </>
                  )}
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
              {item.actions_taken && (
                <div className="mt-2 text-xs bg-blue-50 rounded-lg p-2">
                  <span className="font-medium">الإجراءات المتخذة: </span>
                  {item.actions_taken}
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>لا توجد بلاغات سلامة</p>
            </div>
          )}
        </div>

        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-card border rounded-t-2xl sm:rounded-2xl w-full max-w-lg shadow-2xl max-h-[92vh] overflow-y-auto">
              <div className="p-5 border-b">
                <h2 className="font-semibold">{editing ? 'تعديل بلاغ' : 'بلاغ سلامة جديد'}</h2>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg p-3">{error}</p>}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">المشروع</label>
                    <select
                      value={form.project_id}
                      onChange={(e) => setForm((f) => ({ ...f, project_id: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                    >
                      <option value="">بدون مشروع</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">تاريخ البلاغ *</label>
                    <input
                      type="date"
                      required
                      value={form.incident_date}
                      onChange={(e) => setForm((f) => ({ ...f, incident_date: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">النوع</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                    >
                      {Object.entries(INCIDENT_TYPES).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">الخطورة</label>
                    <select
                      value={form.severity}
                      onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                    >
                      {Object.entries(SEVERITY_AR).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">الوصف *</label>
                    <textarea
                      required
                      rows={3}
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">الموقع</label>
                    <input
                      value={form.location}
                      onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">المبلغ</label>
                    <input
                      value={form.reported_by}
                      onChange={(e) => setForm((f) => ({ ...f, reported_by: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">الإجراءات المتخذة</label>
                    <textarea
                      rows={2}
                      value={form.actions_taken}
                      onChange={(e) => setForm((f) => ({ ...f, actions_taken: e.target.value }))}
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
                    {loading ? 'جاري الحفظ...' : editing ? 'حفظ التعديلات' : 'إضافة البلاغ'}
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
