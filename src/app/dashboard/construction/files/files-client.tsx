'use client'

import { useState } from 'react'
import { Plus, Search, Trash2, FileText, ExternalLink, Upload } from 'lucide-react'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import type { ConstructionFile } from '@/types/construction'

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
  type: 'document',
  notes: '',
}

export function FilesClient({ files: init, projects }: { files: ConstructionFile[]; projects: Project[] }) {
  const [files, setFiles] = useState(init)
  const [search, setSearch] = useState('')
  const [filterProject, setFilterProject] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<any>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

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
    if (!selectedFile) {
      setError('يرجى اختيار ملف للرفع')
      return
    }
    setLoading(true)
    setUploadProgress(0)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', selectedFile)
      fd.append('project_id', form.project_id || '')
      fd.append('type', form.type)
      if (form.notes) {
        fd.append('notes', form.notes)
      }

      const xhr = new XMLHttpRequest()
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100))
        }
      })

      const result = await new Promise<any>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(JSON.parse(xhr.responseText))
          } else {
            try {
              reject(new Error(JSON.parse(xhr.responseText).error))
            } catch {
              reject(new Error('فشل رفع الملف'))
            }
          }
        }
        xhr.onerror = () => reject(new Error('فشل الاتصال'))
        xhr.open('POST', '/api/construction/files/upload')
        xhr.send(fd)
      })

      setFiles((prev) => [result, ...prev])
      setShowForm(false)
      setForm(emptyForm)
      setSelectedFile(null)
      setUploadProgress(0)
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
    <ErrorBoundary>
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">الملفات</h1>
          <button
            onClick={() => {
              setForm(emptyForm)
              setSelectedFile(null)
              setUploadProgress(0)
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
                <span className="text-xs text-muted-foreground">{f.created_at?.slice(0, 10)}</span>
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
                    <label className="text-xs text-muted-foreground mb-1 block">الملف *</label>
                    <input
                      required
                      type="file"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.zip"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="w-full border rounded-lg px-3 py-2 text-sm bg-background file:bg-primary file:text-primary-foreground file:border-0 file:rounded file:px-3 file:py-1 file:text-xs file:font-medium hover:file:bg-primary/90 cursor-pointer"
                    />
                    {selectedFile && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                  </div>
                  {uploadProgress > 0 && (
                    <div className="col-span-2">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{uploadProgress}%</p>
                    </div>
                  )}
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
    </ErrorBoundary>
  )
}
