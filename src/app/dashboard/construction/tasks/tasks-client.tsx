'use client'

import { useState } from 'react'
import { Plus, Search, Trash2, Edit, Calendar, Flag, CheckCircle2, FolderKanban } from 'lucide-react'

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  progress: number
  project_id: string | null
  worker_id: string | null
  due_date: string | null
  completed_at: string | null
  notes: string | null
  con_projects?: { name: string } | null
  con_workers?: { name: string } | null
}
interface Project {
  id: string
  name: string
}
interface Worker {
  id: string
  name: string
}

const STATUSES = ['pending', 'in_progress', 'review', 'done', 'blocked']
const STATUS_AR: Record<string, string> = {
  pending: 'قيد الانتظار',
  todo: 'للتنفيذ',
  in_progress: 'قيد التنفيذ',
  review: 'مراجعة',
  done: 'مكتمل',
  blocked: 'موقوف',
  cancelled: 'ملغي',
}
const STATUS_COLORS: Record<string, string> = {
  pending: 'border-gray-200 bg-gray-50',
  todo: 'border-blue-200 bg-blue-50',
  in_progress: 'border-amber-200 bg-amber-50',
  review: 'border-purple-200 bg-purple-50',
  done: 'border-green-200 bg-green-50',
  blocked: 'border-red-200 bg-red-50',
  cancelled: 'border-gray-200 bg-gray-100',
}
const STATUS_HEADER: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-600',
  todo: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  review: 'bg-purple-100 text-purple-700',
  done: 'bg-green-100 text-green-700',
  blocked: 'bg-red-100 text-red-500',
  cancelled: 'bg-gray-100 text-gray-400',
}
const PROGRESS_MILESTONES = [0, 25, 50, 75, 100]
const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-gray-400',
  medium: 'text-blue-500',
  high: 'text-orange-500',
  urgent: 'text-red-500',
}
const PRIORITY_AR: Record<string, string> = { low: 'منخفض', medium: 'متوسط', high: 'عالي', urgent: 'عاجل' }

const emptyForm = {
  title: '',
  description: '',
  status: 'pending',
  priority: 'medium',
  progress: 0,
  project_id: '',
  worker_id: '',
  due_date: '',
  notes: '',
}

export function TasksClient({
  tasks: init,
  projects,
  workers,
}: {
  tasks: Task[]
  projects: Project[]
  workers: Worker[]
}) {
  const [tasks, setTasks] = useState(init)
  const [search, setSearch] = useState('')
  const [filterProject, setFilterProject] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Task | null>(null)
  const [form, setForm] = useState<any>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const filtered = tasks.filter((t) => {
    const q = search.toLowerCase()
    return (!q || t.title.toLowerCase().includes(q)) && (!filterProject || t.project_id === filterProject)
  })

  // Group tasks by project
  const projectMap = new Map<string, Task[]>()
  const noProject: Task[] = []
  for (const t of filtered) {
    if (t.project_id) {
      const arr = projectMap.get(t.project_id) || []
      arr.push(t)
      projectMap.set(t.project_id, arr)
    } else {
      noProject.push(t)
    }
  }
  const projectGroups: { name: string; tasks: Task[] }[] = []
  for (const [pid, ptasks] of projectMap) {
    const p = projects.find((p) => p.id === pid)
    projectGroups.push({ name: p?.name || 'مشروع محذوف', tasks: ptasks })
  }
  projectGroups.sort((a, b) => a.name.localeCompare(b.name))
  if (noProject.length > 0) {
    projectGroups.push({ name: 'بدون مشروع', tasks: noProject })
  }

  const openNew = () => {
    setForm(emptyForm)
    setEditing(null)
    setError('')
    setShowForm(true)
  }
  const openEdit = (t: Task) => {
    setForm({
      title: t.title,
      description: t.description || '',
      status: t.status,
      priority: t.priority,
      project_id: t.project_id || '',
      worker_id: t.worker_id || '',
      due_date: t.due_date || '',
      notes: t.notes || '',
    })
    setEditing(t)
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
        progress: Number(form.progress) || 0,
        project_id: form.project_id || null,
        worker_id: form.worker_id || null,
        due_date: form.due_date || null,
      }
      const url = editing ? `/api/construction/tasks/${editing.id}` : '/api/construction/tasks'
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
        setTasks((prev) => prev.map((t) => (t.id === editing.id ? { ...t, ...data } : t)))
      } else {
        setTasks((prev) => [data, ...prev])
      }
      setShowForm(false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذه المهمة؟')) {
      return
    }
    setDeleting(id)
    await fetch(`/api/construction/tasks/${id}`, { method: 'DELETE' })
    setTasks((prev) => prev.filter((t) => t.id !== id))
    setDeleting(null)
  }

  const quickStatus = async (t: Task, status: string, progress?: number) => {
    const body: Record<string, unknown> = { status }
    if (progress !== undefined) {
      body.progress = progress
    }
    const res = await fetch(`/api/construction/tasks/${t.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (res.ok) {
      setTasks((prev) => prev.map((x) => (x.id === t.id ? { ...x, ...data } : x)))
    }
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">المهام</h1>
        <button
          onClick={openNew}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> مهمة جديدة
        </button>
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

      {/* Kanban Board grouped by project */}
      {projectGroups.map((group) => {
        const byStatus = STATUSES.map((s) => ({ status: s, tasks: group.tasks.filter((t) => t.status === s) }))
        return (
          <section key={group.name} className="space-y-3">
            <h2 className="text-lg font-bold border-b pb-1 flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-primary" />
              {group.name}
              <span className="text-sm font-normal text-muted-foreground">({group.tasks.length} مهام)</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
              {byStatus.map((col) => (
                <div key={col.status} className="space-y-3">
                  <div
                    className={`flex items-center justify-between px-3 py-2 rounded-lg ${STATUS_HEADER[col.status]}`}
                  >
                    <span className="text-xs font-semibold">{STATUS_AR[col.status]}</span>
                    <span className="text-xs bg-white/50 px-1.5 py-0.5 rounded-full font-bold">{col.tasks.length}</span>
                  </div>
                  <div className="space-y-2 min-h-[100px]">
                    {col.tasks.map((t) => (
                      <div key={t.id} className={`border rounded-xl p-3 space-y-2 ${STATUS_COLORS[t.status]}`}>
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-sm font-medium leading-tight">{t.title}</p>
                          <Flag className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${PRIORITY_COLORS[t.priority]}`} />
                        </div>
                        {t.con_projects && <p className="text-xs text-muted-foreground">{t.con_projects.name}</p>}
                        {t.con_workers && <p className="text-xs text-muted-foreground">{t.con_workers.name}</p>}
                        {t.due_date && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            <span>{t.due_date}</span>
                          </div>
                        )}
                        {/* Progress Bar */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-black/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${(t.progress || 0) >= 100 ? 'bg-green-500' : 'bg-primary'}`}
                              style={{ width: `${t.progress || 0}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium tabular-nums w-7 text-left">{t.progress || 0}%</span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-black/5">
                          <div className="flex gap-1 flex-wrap">
                            {col.status !== 'done' && (
                              <button
                                onClick={() => quickStatus(t, 'done', 100)}
                                title="إتمام"
                                className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                              >
                                ✓ إتمام
                              </button>
                            )}
                            {col.status === 'pending' && (
                              <button
                                onClick={() => quickStatus(t, 'in_progress', 25)}
                                title="بدء"
                                className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full hover:bg-amber-200 transition-colors"
                              >
                                ▶ بدء
                              </button>
                            )}
                            {col.status === 'in_progress' && (
                              <>
                                {PROGRESS_MILESTONES.filter((m) => m > (t.progress || 0) && m < 100).map((m) => (
                                  <button
                                    key={m}
                                    onClick={() => quickStatus(t, 'in_progress', m)}
                                    className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                                  >
                                    {m}%
                                  </button>
                                ))}
                              </>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => openEdit(t)}
                              className="p-1 hover:bg-white/60 rounded text-muted-foreground hover:text-foreground"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDelete(t.id)}
                              disabled={deleting === t.id}
                              className="p-1 hover:bg-red-50 rounded text-muted-foreground hover:text-red-500"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {col.tasks.length === 0 && (
                      <div className="border-2 border-dashed border-muted rounded-xl p-4 text-center text-xs text-muted-foreground">
                        لا توجد مهام
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      })}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-card border rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl pb-safe-bottom max-h-[92vh] overflow-y-auto max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b">
              <h2 className="font-semibold">{editing ? 'تعديل مهمة' : 'مهمة جديدة'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg p-3">{error}</p>}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">عنوان المهمة *</label>
                  <input
                    required
                    value={form.title}
                    onChange={(e) => setForm((f: any) => ({ ...f, title: e.target.value }))}
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
                  <label className="text-xs text-muted-foreground mb-1 block">العامل المكلف</label>
                  <select
                    value={form.worker_id}
                    onChange={(e) => setForm((f: any) => ({ ...f, worker_id: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">— بدون تعيين —</option>
                    {workers.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">الأولوية</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm((f: any) => ({ ...f, priority: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {Object.entries(PRIORITY_AR).map(([v, l]) => (
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
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">نسبة الإنجاز</label>
                  <select
                    value={form.progress}
                    onChange={(e) => setForm((f: any) => ({ ...f, progress: Number(e.target.value) }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {PROGRESS_MILESTONES.map((m) => (
                      <option key={m} value={m}>
                        {m === 0 ? '0% - لم يبدأ' : m === 100 ? '100% - مكتمل' : `${m}%`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">تاريخ الاستحقاق</label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={(e) => setForm((f: any) => ({ ...f, due_date: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">الوصف</label>
                  <textarea
                    rows={2}
                    value={form.description}
                    onChange={(e) => setForm((f: any) => ({ ...f, description: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? 'جاري الحفظ...' : editing ? 'حفظ التعديلات' : 'إنشاء المهمة'}
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
  )
}
