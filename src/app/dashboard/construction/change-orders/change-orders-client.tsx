'use client'

import { useState } from 'react'
import { Plus, Search, Trash2, Edit, Download, CheckCircle, XCircle, Clock } from 'lucide-react'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { Pagination } from '@/components/ui/pagination'
import { exportCSV } from '@/lib/export-csv'
import type { ConstructionChangeOrder } from '@/types/construction'

interface Project {
  id: string
  name: string
}

const PAGE_SIZE = 25
const STATUS_AR: Record<string, string> = { pending: 'قيد الانتظار', approved: 'معتمد', rejected: 'مرفوض' }
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-500',
}
const STATUS_ICONS: Record<string, any> = { pending: Clock, approved: CheckCircle, rejected: XCircle }

const emptyForm = {
  project_id: '',
  title: '',
  description: '',
  amount_change: '',
  status: 'pending',
  approved_by: '',
  approved_at: '',
}

export function ChangeOrdersClient({
  orders: init,
  projects,
}: {
  orders: ConstructionChangeOrder[]
  projects: Project[]
}) {
  const [orders, setOrders] = useState(init)
  const [search, setSearch] = useState('')
  const [filterProject, setFilterProject] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ConstructionChangeOrder | null>(null)
  const [form, setForm] = useState<any>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const filtered = orders.filter((o) => {
    const q = search.toLowerCase()
    return (
      (!q || o.title.toLowerCase().includes(q) || (o.con_projects?.name || '').toLowerCase().includes(q)) &&
      (!filterProject || o.project_id === filterProject) &&
      (!filterStatus || o.status === filterStatus)
    )
  })

  const totalCount = filtered.length
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const totalChanges = filtered.reduce((s, o) => s + Number(o.amount_change), 0)

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        ...form,
        project_id: form.project_id,
        amount_change: Number(form.amount_change) || 0,
        approved_by: form.approved_by || null,
        approved_at: form.approved_at || null,
        description: form.description || null,
      }
      const url = editing ? `/api/construction/change-orders/${editing.id}` : '/api/construction/change-orders'
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
    const payload: Record<string, unknown> = { status }
    if (status === 'approved') {
      payload.approved_at = new Date().toISOString().slice(0, 10)
    }
    const res = await fetch(`/api/construction/change-orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      const data = await res.json()
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...data } : o)))
    }
  }

  const openEdit = (o: ConstructionChangeOrder) => {
    setForm({
      project_id: o.project_id,
      title: o.title,
      description: o.description || '',
      amount_change: String(o.amount_change),
      status: o.status,
      approved_by: o.approved_by || '',
      approved_at: o.approved_at || '',
    })
    setEditing(o)
    setError('')
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذا التغيير؟')) {
      return
    }
    setDeleting(id)
    await fetch(`/api/construction/change-orders/${id}`, { method: 'DELETE' })
    setOrders((prev) => prev.filter((o) => o.id !== id))
    setDeleting(null)
  }

  return (
    <ErrorBoundary>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">أوامر التغيير</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              إجمالي التغييرات: <span className="font-semibold">{Number(totalChanges).toLocaleString()} ريال</span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() =>
                exportCSV(
                  filtered.map((o) => ({
                    العنوان: o.title,
                    المشروع: o.con_projects?.name || '',
                    'قيمة التغيير': o.amount_change,
                    الحالة: STATUS_AR[o.status] || o.status,
                    'تاريخ الاعتماد': o.approved_at || '',
                    ملاحظات: o.description || '',
                  })),
                  [
                    { key: 'العنوان', label: 'العنوان' },
                    { key: 'المشروع', label: 'المشروع' },
                    { key: 'قيمة التغيير', label: 'قيمة التغيير' },
                    { key: 'الحالة', label: 'الحالة' },
                    { key: 'تاريخ الاعتماد', label: 'تاريخ الاعتماد' },
                    { key: 'ملاحظات', label: 'ملاحظات' },
                  ],
                  'أوامر_التغيير',
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
              <Plus className="w-4 h-4" /> تغيير جديد
            </button>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالعنوان..."
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
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">العنوان</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">المشروع</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">الحالة</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">قيمة التغيير</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">المعتمد من</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">تاريخ الاعتماد</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {paged.map((o) => {
                const Icon = STATUS_ICONS[o.status] || Clock
                return (
                  <tr key={o.id} className="border-t hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{o.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">{o.con_projects?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status]}`}
                      >
                        <Icon className="w-3 h-3" /> {STATUS_AR[o.status] || o.status}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-3 font-medium text-left ${Number(o.amount_change) >= 0 ? 'text-red-500' : 'text-green-600'}`}
                    >
                      {Number(o.amount_change) >= 0 ? '+' : ''}
                      {Number(o.amount_change).toLocaleString()} ريال
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{o.approved_by || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{o.approved_at || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {o.status === 'pending' && (
                          <>
                            <button
                              onClick={() => quickStatus(o.id, 'approved')}
                              className="p-1.5 hover:bg-green-50 rounded text-green-500"
                              title="اعتماد"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => quickStatus(o.id, 'rejected')}
                              className="p-1.5 hover:bg-red-50 rounded text-red-400"
                              title="رفض"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
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
                )
              })}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                    لا توجد أوامر تغيير
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
            <div className="bg-card border rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl pb-safe-bottom max-h-[92vh] overflow-y-auto">
              <div className="p-5 border-b">
                <h2 className="font-semibold">{editing ? 'تعديل أمر تغيير' : 'أمر تغيير جديد'}</h2>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg p-3">{error}</p>}
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">العنوان *</label>
                    <input
                      required
                      value={form.title}
                      onChange={(e) => setForm((f: any) => ({ ...f, title: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="col-span-2">
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
                    <label className="text-xs text-muted-foreground mb-1 block">قيمة التغيير *</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      value={form.amount_change}
                      onChange={(e) => setForm((f: any) => ({ ...f, amount_change: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">الحالة</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm((f: any) => ({ ...f, status: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      {Object.entries(STATUS_AR).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">الوصف</label>
                    <textarea
                      rows={3}
                      value={form.description}
                      onChange={(e) => setForm((f: any) => ({ ...f, description: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                </div>
                {form.status === 'approved' && (
                  <div className="grid grid-cols-2 gap-3 p-3 bg-green-50 rounded-lg">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">المعتمد من</label>
                      <input
                        value={form.approved_by}
                        onChange={(e) => setForm((f: any) => ({ ...f, approved_by: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">تاريخ الاعتماد</label>
                      <input
                        type="date"
                        value={form.approved_at}
                        onChange={(e) => setForm((f: any) => ({ ...f, approved_at: e.target.value }))}
                        className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                  >
                    {loading ? 'جاري الحفظ...' : editing ? 'حفظ التعديلات' : 'إنشاء أمر التغيير'}
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
