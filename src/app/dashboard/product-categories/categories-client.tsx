'use client'

import { useState, useMemo } from 'react'
import { Plus, Search, X, Loader2, Pencil, Trash2, AlertTriangle, Save } from 'lucide-react'

interface Category {
  id: string
  name: string
  name_ar: string
  color: string
  icon: string
}

interface Props {
  categories: Category[]
  companyId: string
}

const ICONS = [
  'package',
  'shopping-cart',
  'coffee',
  'zap',
  'heart',
  'star',
  'home',
  'users',
  'briefcase',
  'trending-up',
  'shield',
  'file-text',
  'tool',
]

export function CategoriesClient({ categories: initial, companyId }: Props) {
  const [categories, setCategories] = useState(initial)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', name_ar: '', color: '#78716c', icon: 'package' })

  const filtered = useMemo(
    () => categories.filter((c) => !search || c.name_ar.includes(search) || c.name.includes(search)),
    [categories, search],
  )

  const openNew = () => {
    setEditing(null)
    setForm({ name: '', name_ar: '', color: '#78716c', icon: 'package' })
    setShowForm(true)
    setError('')
  }

  const openEdit = (cat: Category) => {
    setEditing(cat)
    setForm({ name: cat.name, name_ar: cat.name_ar, color: cat.color, icon: cat.icon })
    setShowForm(true)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name && !form.name_ar) {
      setError('يرجى إدخال الاسم')
      return
    }
    setLoading(true)
    setError('')
    try {
      if (editing) {
        const res = await fetch(`/api/inventory/categories/${editing.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'حدث خطأ')
        }
        setCategories((prev) => prev.map((c) => (c.id === editing.id ? data : c)))
      } else {
        const res = await fetch('/api/inventory/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        })
        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || 'حدث خطأ')
        }
        setCategories((prev) => [data, ...prev])
      }
      setShowForm(false)
      setEditing(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) {
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/inventory/categories', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: confirmDelete }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'حدث خطأ')
      }
      setCategories((prev) => prev.filter((c) => c.id !== confirmDelete))
      setConfirmDelete(null)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">تصنيفات المنتجات</h1>
          <p className="text-sm text-muted-foreground">{categories.length} تصنيف</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          تصنيف جديد
        </button>
      </div>

      <div className="relative flex-1">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث..."
          className="w-full border border-input rounded-lg px-3 py-2 pr-9 text-sm bg-background focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {filtered.map((cat) => (
          <div key={cat.id} className="bg-card rounded-xl border p-4 flex flex-col items-center gap-2 relative group">
            <span
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold"
              style={{ backgroundColor: cat.color }}
            >
              {cat.name_ar.charAt(0)}
            </span>
            <span className="text-sm font-medium text-center">{cat.name_ar || cat.name}</span>
            <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => openEdit(cat)}
                className="p-1.5 bg-white rounded-lg shadow hover:bg-accent"
                title="تعديل"
              >
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <button
                onClick={() => setConfirmDelete(cat.id)}
                className="p-1.5 bg-white rounded-lg shadow hover:bg-red-100"
                title="حذف"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">لا توجد تصنيفات</div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
        >
          <div className="bg-card rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-lg">{editing ? 'تعديل التصنيف' : 'تصنيف جديد'}</h2>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-accent rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">الاسم (عربي)</label>
                <input
                  type="text"
                  value={form.name_ar}
                  onChange={(e) => setForm((f) => ({ ...f, name_ar: e.target.value }))}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">الاسم (إنجليزي)</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">اللون</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                    className="w-10 h-10 rounded-lg border cursor-pointer"
                  />
                  <span className="text-xs text-muted-foreground">{form.color}</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">الأيقونة</label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, icon }))}
                      className={`px-2 py-1 text-xs rounded-lg border ${form.icon === icon ? 'border-primary bg-primary/10 text-primary' : 'border-input hover:bg-accent'}`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              {error && (
                <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">{error}</p>
              )}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editing ? 'تحديث' : 'حفظ'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 border border-input rounded-lg text-sm hover:bg-accent"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setConfirmDelete(null)}
        >
          <div className="bg-card rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h3 className="font-bold text-lg mb-2">حذف التصنيف</h3>
            <p className="text-sm text-muted-foreground mb-5">
              هل أنت متأكد من حذف هذا التصنيف؟ لن يتم حذف المنتجات المرتبطة به.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                حذف
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 border border-input rounded-lg text-sm hover:bg-accent"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
