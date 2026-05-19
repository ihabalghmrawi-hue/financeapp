'use client'

import { useState } from 'react'
import { Plus, Search, Trash2, Edit, Download, Sun, Cloud, CloudRain, Calendar } from 'lucide-react'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { Pagination } from '@/components/ui/pagination'
import { exportCSV } from '@/lib/export-csv'
import type { ConstructionDailyLog } from '@/types/construction'

interface Project {
  id: string
  name: string
}

const PAGE_SIZE = 25
const WEATHER_OPTIONS = ['sunny', 'cloudy', 'rainy', 'dusty', 'hot', 'cold', 'other']
const WEATHER_AR: Record<string, string> = {
  sunny: 'مشمس',
  cloudy: 'غائم',
  rainy: 'ممطر',
  dusty: 'مغبر',
  hot: 'حار',
  cold: 'بارد',
  other: 'أخرى',
}

const emptyForm = {
  project_id: '',
  log_date: new Date().toISOString().slice(0, 10),
  weather: '',
  workers_count: '0',
  hours_worked: '8',
  notes: '',
}

export function DailyLogsClient({ logs: init, projects }: { logs: ConstructionDailyLog[]; projects: Project[] }) {
  const [logs, setLogs] = useState(init)
  const [search, setSearch] = useState('')
  const [filterProject, setFilterProject] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ConstructionDailyLog | null>(null)
  const [form, setForm] = useState<any>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const filtered = logs.filter((l) => {
    const q = search.toLowerCase()
    return (
      (!q || (l.notes || '').toLowerCase().includes(q) || (l.con_projects?.name || '').toLowerCase().includes(q)) &&
      (!filterProject || l.project_id === filterProject)
    )
  })

  const totalCount = filtered.length
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        ...form,
        project_id: form.project_id,
        workers_count: Number(form.workers_count) || 0,
        hours_worked: Number(form.hours_worked) || 8,
        weather: form.weather || null,
        notes: form.notes || null,
      }
      const url = editing ? `/api/construction/daily-logs/${editing.id}` : '/api/construction/daily-logs'
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

  const openEdit = (l: ConstructionDailyLog) => {
    setForm({
      project_id: l.project_id,
      log_date: l.log_date,
      weather: l.weather || '',
      workers_count: String(l.workers_count),
      hours_worked: String(l.hours_worked),
      notes: l.notes || '',
    })
    setEditing(l)
    setError('')
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذا التقرير؟')) {
      return
    }
    setDeleting(id)
    await fetch(`/api/construction/daily-logs/${id}`, { method: 'DELETE' })
    setLogs((prev) => prev.filter((l) => l.id !== id))
    setDeleting(null)
  }

  const weatherIcon = (w: string | null) => {
    if (!w) {
      return null
    }
    if (w === 'sunny') {
      return <Sun className="w-3.5 h-3.5 text-amber-500" />
    }
    if (w === 'cloudy') {
      return <Cloud className="w-3.5 h-3.5 text-gray-400" />
    }
    if (w === 'rainy') {
      return <CloudRain className="w-3.5 h-3.5 text-blue-400" />
    }
    return null
  }

  return (
    <ErrorBoundary>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">التقارير اليومية</h1>
          <div className="flex gap-2">
            <button
              onClick={() =>
                exportCSV(
                  filtered.map((l) => ({
                    التاريخ: l.log_date,
                    المشروع: l.con_projects?.name || '',
                    الطقس: WEATHER_AR[l.weather || ''] || '',
                    'عدد العمال': l.workers_count,
                    'ساعات العمل': l.hours_worked,
                    ملاحظات: l.notes || '',
                  })),
                  [
                    { key: 'التاريخ', label: 'التاريخ' },
                    { key: 'المشروع', label: 'المشروع' },
                    { key: 'الطقس', label: 'الطقس' },
                    { key: 'عدد العمال', label: 'عدد العمال' },
                    { key: 'ساعات العمل', label: 'ساعات العمل' },
                    { key: 'ملاحظات', label: 'ملاحظات' },
                  ],
                  'التقارير_اليومية',
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
              <Plus className="w-4 h-4" /> تقرير جديد
            </button>
          </div>
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
        </div>

        <div className="bg-card border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">التاريخ</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">المشروع</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">الطقس</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">عدد العمال</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">ساعات العمل</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">ملاحظات</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {paged.map((l) => (
                <tr key={l.id} className="border-t hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" /> {l.log_date}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">{l.con_projects?.name || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {weatherIcon(l.weather)}
                      <span className="text-muted-foreground">{WEATHER_AR[l.weather || ''] || '—'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-left">{l.workers_count}</td>
                  <td className="px-4 py-3 font-medium text-left">{Number(l.hours_worked).toFixed(1)}</td>
                  <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{l.notes || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(l)}
                        className="p-1.5 hover:bg-blue-50 rounded text-muted-foreground hover:text-blue-500"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(l.id)}
                        disabled={deleting === l.id}
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
                    لا توجد تقارير يومية
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
                <h2 className="font-semibold">{editing ? 'تعديل تقرير يومي' : 'تقرير يومي جديد'}</h2>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg p-3">{error}</p>}
                <div className="grid grid-cols-2 gap-3">
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
                    <label className="text-xs text-muted-foreground mb-1 block">التاريخ</label>
                    <input
                      type="date"
                      value={form.log_date}
                      onChange={(e) => setForm((f: any) => ({ ...f, log_date: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">الطقس</label>
                    <select
                      value={form.weather}
                      onChange={(e) => setForm((f: any) => ({ ...f, weather: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">— بدون —</option>
                      {WEATHER_OPTIONS.map((w) => (
                        <option key={w} value={w}>
                          {WEATHER_AR[w]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">عدد العمال *</label>
                    <input
                      required
                      type="number"
                      min="0"
                      value={form.workers_count}
                      onChange={(e) => setForm((f: any) => ({ ...f, workers_count: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">ساعات العمل *</label>
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.5"
                      value={form.hours_worked}
                      onChange={(e) => setForm((f: any) => ({ ...f, hours_worked: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">ملاحظات</label>
                    <textarea
                      rows={3}
                      value={form.notes}
                      onChange={(e) => setForm((f: any) => ({ ...f, notes: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="ملاحظات الموقع، الإنجازات، المشاكل..."
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                  >
                    {loading ? 'جاري الحفظ...' : editing ? 'حفظ التعديلات' : 'إضافة التقرير'}
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
