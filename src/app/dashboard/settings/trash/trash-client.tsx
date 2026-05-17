'use client'

import { useState, useCallback } from 'react'
import {
  Trash2,
  RotateCcw,
  RefreshCw,
  Filter,
  Search,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  XCircle,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n/language-provider'
import type { TrashItem } from '@/lib/data-lifecycle'

interface Props {
  initialItems: TrashItem[]
  modules: string[]
}

const MODULE_COLORS: Record<string, string> = {
  sales: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  purchases: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  inventory: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  finance: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  rental: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
}

export function TrashClient({ initialItems, modules }: Props) {
  const { t, formatDate } = useT()
  const [items, setItems] = useState<TrashItem[]>(initialItems)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<string>('')
  const [search, setSearch] = useState('')
  const [working, setWorking] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const notify = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 4000)
  }, [])

  const reload = useCallback(async (mod?: string) => {
    setLoading(true)
    const url = mod ? `/api/trash?module=${mod}` : '/api/trash'
    const res = await fetch(url)
    if (res.ok) {
      setItems(await res.json())
    }
    setLoading(false)
  }, [])

  const handleFilter = (mod: string) => {
    setFilter(mod)
    setSelected(new Set())
    reload(mod || undefined)
  }

  // ── Restore single item ───────────────────────────────────────────────────
  const handleRestore = useCallback(
    async (item: TrashItem) => {
      setWorking(item.id)
      const res = await fetch(`/api/entity/restore/${item.type}/${item.id}`, { method: 'POST' })
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== item.id))
        notify(t('trash.restored', { name: item.name }))
      } else {
        const j = await res.json()
        notify(j.error || t('trash.restoreFailed'), 'error')
      }
      setWorking(null)
    },
    [notify],
  )

  // ── Hard delete single item ───────────────────────────────────────────────
  const handleHardDelete = useCallback(
    async (item: TrashItem) => {
      if (!confirm(t('trash.confirmHardDelete', { name: item.name }))) {
        return
      }
      setWorking(item.id)
      const res = await fetch(`/api/entity/hard-delete/${item.type}/${item.id}`, { method: 'DELETE' })
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== item.id))
        notify(t('trash.hardDeleted'))
      } else {
        const j = await res.json()
        notify(j.error || t('trash.deleteFailed'), 'error')
      }
      setWorking(null)
    },
    [notify],
  )

  // ── Bulk restore ──────────────────────────────────────────────────────────
  const handleBulkRestore = useCallback(async () => {
    const toRestore = items.filter((i) => selected.has(i.id))
    setWorking('bulk')
    let ok = 0
    for (const item of toRestore) {
      const res = await fetch(`/api/entity/restore/${item.type}/${item.id}`, { method: 'POST' })
      if (res.ok) {
        ok++
      }
    }
    notify(t('trash.bulkRestored', { count: ok }))
    setSelected(new Set())
    await reload(filter || undefined)
    setWorking(null)
  }, [items, selected, filter, notify, reload])

  // ── Bulk hard delete ──────────────────────────────────────────────────────
  const handleBulkDelete = useCallback(async () => {
    const toBulk = items.filter((i) => selected.has(i.id))
    if (!confirm(t('trash.confirmBulkDelete', { count: toBulk.length }))) {
      return
    }
    setWorking('bulk')
    let ok = 0
    for (const item of toBulk) {
      const res = await fetch(`/api/entity/hard-delete/${item.type}/${item.id}`, { method: 'DELETE' })
      if (res.ok) {
        ok++
      }
    }
    notify(t('trash.bulkDeleted', { count: ok }))
    setSelected(new Set())
    await reload(filter || undefined)
    setWorking(null)
  }, [items, selected, filter, notify, reload])

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map((i) => i.id)))
    }
  }

  const filtered = items.filter((i) => {
    const matchMod = !filter || i.module === filter
    const matchQ = !search || i.name.includes(search) || i.labelArSing.includes(search)
    return matchMod && matchQ
  })

  return (
    <div className="space-y-5 max-w-5xl" dir="rtl">
      {/* Toast */}
      {toast && (
        <div
          className={cn(
            'fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-lg text-sm font-medium flex items-center gap-2',
            toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white',
          )}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-500" />
            {t('trash.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{t('trash.description')}</p>
        </div>
        <button
          onClick={() => reload(filter || undefined)}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-sm hover:bg-accent disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {t('trash.refresh')}
        </button>
      </div>

      {/* Filters + Search */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-xl">
          <button
            onClick={() => handleFilter('')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
              !filter ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t('trash.all', { count: items.length })}
          </button>
          {modules.map((mod) => {
            const cnt = items.filter((i) => i.module === mod).length
            if (cnt === 0) {
              return null
            }
            return (
              <button
                key={mod}
                onClick={() => handleFilter(mod)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                  filter === mod ? 'bg-card shadow-sm' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t(`trash.modules.${mod}`)} ({cnt})
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-2 bg-card border rounded-xl px-3 py-1.5 flex-1 min-w-48">
          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('common.search')}
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-primary/5 border border-primary/20 rounded-2xl">
          <span className="text-sm font-medium">{t('trash.selectedCount', { count: selected.size })}</span>
          <div className="flex items-center gap-2 mr-auto">
            <button
              onClick={handleBulkRestore}
              disabled={working === 'bulk'}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
            >
              {working === 'bulk' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5" />
              )}
              {t('trash.restoreAll')}
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={working === 'bulk'}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
            >
              {working === 'bulk' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              {t('trash.hardDelete')}
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="px-3 py-1.5 border rounded-lg text-sm hover:bg-accent"
            >
              {t('trash.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-card border rounded-2xl overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <Trash2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">{t('trash.empty')}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted/30 border-b">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                  />
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">{t('trash.name')}</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">{t('trash.type')}</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">{t('trash.module')}</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">{t('trash.deletedAt')}</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">{t('trash.deletedBy')}</th>
                <th className="px-4 py-3 w-32" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((item) => (
                <tr key={item.id} className={cn('hover:bg-muted/20', selected.has(item.id) && 'bg-primary/5')}>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      className="rounded"
                      checked={selected.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium max-w-[180px] truncate">{item.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.labelArSing}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        MODULE_COLORS[item.module] || 'bg-muted text-muted-foreground',
                      )}
                    >
                      {t(`trash.modules.${item.module}`)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(item.deleted_at)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{item.deleted_by || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => handleRestore(item)}
                        disabled={working === item.id}
                        title={t('trash.restore')}
                        className="p-1.5 rounded-lg hover:bg-green-100 text-muted-foreground hover:text-green-700 disabled:opacity-40"
                      >
                        {working === item.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleHardDelete(item)}
                        disabled={working === item.id}
                        title={t('trash.permanentDelete')}
                        className="p-1.5 rounded-lg hover:bg-red-100 text-muted-foreground hover:text-red-600 disabled:opacity-40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">{t('trash.footer', { count: filtered.length })}</p>
    </div>
  )
}
