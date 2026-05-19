'use client'

import { useState, useMemo } from 'react'
import { Plus, Search, Trash2, Edit, Download, Calendar } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { Pagination } from '@/components/ui/pagination'
import { exportCSV } from '@/lib/export-csv'
import type { ConstructionWorkerLog, ConstructionWorker } from '@/types/construction'

interface Project {
  id: string
  name: string
}

const PAGE_SIZE = 25

const emptyForm = {
  project_id: '',
  worker_id: '',
  log_date: new Date().toISOString().slice(0, 10),
  days_worked: '1',
  amount_paid: '',
  notes: '',
}

export function AttendanceClient({
  logs: init,
  workers,
  projects,
}: {
  logs: ConstructionWorkerLog[]
  workers: ConstructionWorker[]
  projects: Project[]
}) {
  const [logs, setLogs] = useState(init)
  const [search, setSearch] = useState('')
  const [filterProject, setFilterProject] = useState('')
  const [filterWorker, setFilterWorker] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ConstructionWorkerLog | null>(null)
  const [form, setForm] = useState<any>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const workerMap = useMemo(() => {
    const m = new Map(workers.map((w) => [w.id, w]))
    return m
  }, [workers])

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase()
    return (
      (!q || (l.con_workers?.name || '').toLowerCase().includes(q) || (l.notes || '').toLowerCase().includes(q)) &&
      (!filterProject || l.project_id === filterProject) &&
      (!filterWorker || l.worker_id === filterWorker)
    )
  })

  const totalCount = filtered.length
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const totalAmount = filtered.reduce((s, l) => s + Number(l.amount_paid), 0)
  const totalDays = filtered.reduce((s, l) => s + Number(l.days_worked), 0)

  const handleWorkerChange = (workerId: string) => {
    const w = workerMap.get(workerId)
    const rate = w?.daily_rate || 0
    const days = Number(form.days_worked) || 1
    setForm((f: any) => ({
      ...f,
      worker_id: workerId,
      amount_paid: String(rate * days),
    }))
  }

  const handleDaysChange = (days: string) => {
    const w = workerMap.get(form.worker_id)
    const rate = w?.daily_rate || 0
    const d = Number(days) || 0
    setForm((f: any) => ({
      ...f,
      days_worked: days,
      amount_paid: String(rate * d),
    }))
  }

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        ...form,
        project_id: form.project_id || null,
        amount_paid: Number(form.amount_paid) || 0,
        days_worked: Number(form.days_worked) || 1,
        notes: form.notes || null,
      }
      const url = editing ? `/api/construction/worker-logs/${editing.id}` : '/api/construction/worker-logs'
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
        setLogs((prev) => prev.map((l) => (l.id === editing.id ? { ...l, ...data } : l)))
      } else {
        setLogs((prev) => [data, ...prev])
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

  const openEdit = (l: ConstructionWorkerLog) => {
    setForm({
      project_id: l.project_id || '',
      worker_id: l.worker_id,
      log_date: l.log_date,
      days_worked: String(l.days_worked),
      amount_paid: String(l.amount_paid),
      notes: l.notes || '',
    })
    setEditing(l)
    setError('')
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذا التسجيل؟')) {
      return
    }
    setDeleting(id)
    await fetch(`/api/construction/worker-logs/${id}`, { method: 'DELETE' })
    setLogs((prev) => prev.filter((l) => l.id !== id))
    setDeleting(null)
  }

  return (
    <ErrorBoundary>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">تسجيل الحضور</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              إجمالي الأيام: <span className="font-semibold">{totalDays.toFixed(1)}</span> | إجمالي المبالغ:{' '}
              <span className="font-semibold">{formatCurrency(totalAmount, 'SAR')}</span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() =>
                exportCSV(
                  filtered.map((l) => ({
                    التاريخ: l.log_date,
                    العامل: l.con_workers?.name || '',
                    المشروع: l.con_projects?.name || '',
                    'عدد الأيام': l.days_worked,
                    المبلغ: l.amount_paid,
                    ملاحظات: l.notes || '',
                  })),
                  [
                    { key: 'التاريخ', label: 'التاريخ' },
                    { key: 'العامل', label: 'العامل' },
                    { key: 'المشروع', label: 'المشروع' },
                    { key: 'عدد الأيام', label: 'عدد الأيام' },
                    { key: 'المبلغ', label: 'المبلغ' },
                    { key: 'ملاحظات', label: 'ملاحظات' },
                  ],
                  'الحضور',
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
              <Plus className="w-4 h-4" /> تسجيل جديد
            </button>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث باسم العامل..."
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
            value={filterWorker}
            onChange={(e) => {
              setFilterWorker(e.target.value)
              setPage(1)
            }}
            className="border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">كل العمال</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-card border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">التاريخ</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">العامل</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">المهنة</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">المشروع</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">عدد الأيام</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">المبلغ</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">ملاحظات</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {paged.map((l) => (
                <tr key={l.id} className="border-t hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      {l.log_date}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{l.con_workers?.name || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.con_workers?.job_type || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.con_projects?.name || '—'}</td>
                  <td className="px-4 py-3 font-medium">{Number(l.days_worked).toFixed(1)}</td>
                  <td className="px-4 py-3 font-medium text-left">{formatCurrency(Number(l.amount_paid), 'SAR')}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[150px] truncate">{l.notes || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(l)}
                        className="p-1.5 hover:bg-blue-50 rounded text-muted-foreground hover:text-blue-500 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(l.id)}
                        disabled={deleting === l.id}
                        className="p-1.5 hover:bg-red-50 rounded text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                    لا توجد تسجيلات حضور
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
                <h2 className="font-semibold">{editing ? 'تعديل تسجيل حضور' : 'تسجيل حضور جديد'}</h2>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg p-3">{error}</p>}
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">العامل *</label>
                    <select
                      required
                      value={form.worker_id}
                      onChange={(e) => handleWorkerChange(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">— اختر العامل —</option>
                      {workers.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({w.daily_rate} ريال/يوم)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">التاريخ</label>
                    <input
                      type="date"
                      value={form.log_date}
                      onChange={(e) => setForm((f: any) => ({ ...f, log_date: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
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
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">عدد الأيام *</label>
                    <input
                      required
                      type="number"
                      min="0.5"
                      max="30"
                      step="0.5"
                      value={form.days_worked}
                      onChange={(e) => handleDaysChange(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">المبلغ</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.amount_paid}
                      onChange={(e) => setForm((f: any) => ({ ...f, amount_paid: e.target.value }))}
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
                  {form.worker_id && Number(form.days_worked) > 0 && (
                    <div className="col-span-2 bg-primary/5 rounded-lg p-3 text-sm">
                      التكلفة المتوقعة:{' '}
                      <span className="font-bold text-primary">
                        {(workerMap.get(form.worker_id)?.daily_rate || 0) * Number(form.days_worked)} ريال
                      </span>
                      <span className="text-muted-foreground mr-2">
                        (بمعدل {workerMap.get(form.worker_id)?.daily_rate || 0} ريال/يوم)
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
                    {loading ? 'جاري الحفظ...' : editing ? 'حفظ التعديلات' : 'تسجيل الحضور'}
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
