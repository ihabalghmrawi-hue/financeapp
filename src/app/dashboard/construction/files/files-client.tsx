'use client'

import { useState } from 'react'
import { Plus, Search, Trash2, FileText, ExternalLink, Upload } from 'lucide-react'

interface ConFile {
  id: string
  project_id: string | null
  name: string
  url: string
  type: string
  size_bytes: number
  notes: string | null
  uploaded_at: string
  con_projects?: { name: string } | null
}
interface Project {
  id: string
  name: string
}

const FILE_TYPES: Record<string, string> = {
  document: 'مستند',
  image: 'صورة',
  drawing: 'مخطط',
  contract: 'عقد',
  invoice: 'فاتورة',
  report: 'تقرير',
  other: 'أخرى',
}

const emptyForm = {
  project_id: '',
  name: '',
  url: '',
  type: 'document',
  notes: '',
}

export function FilesClient({ files: init, projects }: { files: ConFile[]; projects: Project[] }) {
  const [files, setFiles] = useState(init)
  const [search, setSearch] = useState('')
  const [filterProject, setFilterProject] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<any>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const filtered = files.filter((f) => {
    const q = search.toLowerCase()
    return (
      (!q ||
        f.name.toLowerCase().includes(q) ||
        (f.notes || '').toLowerCase().includes(q) ||
        (FILE_TYPES[f.type] || f.type).toLowerCase().includes(q)) &&
      (!filterProject || f.project_id === filterProject)
    )
  })

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = {
        ...form,
        project_id: form.project_id || null,
        notes: form.notes || null,
      }
      const res = await fetch('/api/construction/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error)
      }
      setFiles((prev) => [data, ...prev])
      setShowForm(false)
      setForm(emptyForm)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل تريد حذف هذا الملف؟')) {
      return
    }
    setDeleting(id)
    await fetch(`/api/construction/files/${id}`, { method: 'DELETE' })
    setFiles((prev) => prev.filter((f) => f.id !== id))
    setDeleting(null)
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">الملفات</h1>
        <button
          onClick={() => {
            setForm(emptyForm)
            setError('')
            setShowForm(true)
          }}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
        >
          <Upload className="w-4 h-4" /> إضافة ملف
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((f) => (
          <div key={f.id} className="bg-card border rounded-xl p-4 space-y-2 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-5 h-5 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{FILE_TYPES[f.type] || f.type}</p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(f.id)}
                disabled={deleting === f.id}
                className="p-1 hover:bg-red-50 rounded text-muted-foreground hover:text-red-500 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">{f.con_projects?.name || '—'}</p>
            {f.notes && <p className="text-xs text-muted-foreground">{f.notes}</p>}
            <div className="flex items-center justify-between pt-1">
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                فتح الملف
              </a>
              <span className="text-xs text-muted-foreground">{f.uploaded_at?.slice(0, 10)}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>لا توجد ملفات</p>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-card border rounded-t-2xl sm:rounded-2xl w-full max-w-md shadow-2xl pb-safe-bottom max-h-[92vh] overflow-y-auto">
            <div className="p-5 border-b">
              <h2 className="font-semibold">إضافة ملف</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg p-3">{error}</p>}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">اسم الملف *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">رابط الملف *</label>
                  <input
                    required
                    type="url"
                    placeholder="https://..."
                    value={form.url}
                    onChange={(e) => setForm((f: any) => ({ ...f, url: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">نوع الملف</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f: any) => ({ ...f, type: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {Object.entries(FILE_TYPES).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
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
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? 'جاري الحفظ...' : 'إضافة الملف'}
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
