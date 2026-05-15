'use client'

import { useState, useMemo, useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Search,
  Filter,
  Eye,
  EyeOff,
  GripVertical,
  Settings2,
  Columns,
  Download,
  Trash2,
  Check,
  X,
  ArrowUpDown,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'
import { Button } from './button'
import { useIsMobile, useReducedMotion } from '@/hooks'

export interface EliteColumn<T = any> {
  id: string
  header: string
  accessor: (row: T) => any
  cell?: (value: any, row: T) => React.ReactNode
  sortable?: boolean
  filterable?: boolean
  width?: string
  minWidth?: string
  visible?: boolean
  align?: 'left' | 'center' | 'right'
  grow?: boolean
}

export interface EliteTableProps<T = any> {
  columns: EliteColumn<T>[]
  data: T[]
  rowKey?: string | ((row: T) => string)
  loading?: boolean
  selectable?: boolean
  sortable?: boolean
  filterable?: boolean
  searchable?: boolean
  paginated?: boolean
  pageSize?: number
  density?: 'compact' | 'normal' | 'comfortable'
  stickyHeader?: boolean
  rowActions?: (row: T) => React.ReactNode
  onRowClick?: (row: T) => void
  onSelectionChange?: (selected: Set<string>) => void
  emptyState?: React.ReactNode
  className?: string
  variant?: 'default' | 'premium' | 'glass'
  virtualize?: boolean
  savedViews?: boolean
  exportable?: boolean
}

const densityStyles = {
  compact: 'py-2 px-3 text-xs',
  normal: 'py-3 px-4 text-sm',
  comfortable: 'py-4 px-5 text-sm',
}

const headerDensityStyles = {
  compact: 'py-2 px-3 text-[10px]',
  normal: 'py-3 px-4 text-xs',
  comfortable: 'py-4 px-5 text-xs',
}

function EliteTableInner<T extends Record<string, any>>(props: EliteTableProps<T>, ref: React.Ref<any>) {
  const {
    columns: propColumns,
    data,
    rowKey = 'id',
    loading,
    selectable,
    sortable = true,
    filterable,
    searchable,
    paginated = true,
    pageSize = 25,
    density = 'normal',
    stickyHeader = true,
    rowActions,
    onRowClick,
    onSelectionChange,
    emptyState,
    className,
    variant = 'default',
    savedViews,
    exportable,
  } = props

  const isMobile = useIsMobile()
  const reducedMotion = useReducedMotion()

  const [sorts, setSorts] = useState<Array<{ id: string; dir: 'asc' | 'desc' }>>([])
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [showFilterRow, setShowFilterRow] = useState(false)
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({})
  const [showColumnMenu, setShowColumnMenu] = useState(false)
  const tableRef = useRef<HTMLDivElement>(null)

  const columns = useMemo(
    () => propColumns.filter((c) => columnVisibility[c.id] !== false),
    [propColumns, columnVisibility],
  )

  const processed = useMemo(() => {
    let result = [...data]

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter((row) =>
        propColumns.some((col) => {
          const val = col.accessor(row)
          return String(val ?? '')
            .toLowerCase()
            .includes(q)
        }),
      )
    }

    Object.entries(filters).forEach(([id, value]) => {
      if (!value) {
        return
      }
      const col = propColumns.find((c) => c.id === id)
      if (!col) {
        return
      }
      result = result.filter((row) => {
        const val = String(col.accessor(row) ?? '').toLowerCase()
        return val.includes(value.toLowerCase())
      })
    })

    if (sorts.length > 0) {
      result.sort((a, b) => {
        for (const sort of sorts) {
          const col = propColumns.find((c) => c.id === sort.id)
          if (!col) {
            continue
          }
          const va = col.accessor(a)
          const vb = col.accessor(b)
          const cmp = va < vb ? -1 : va > vb ? 1 : 0
          if (cmp !== 0) {
            return sort.dir === 'asc' ? cmp : -cmp
          }
        }
        return 0
      })
    }

    return result
  }, [data, propColumns, sorts, filters, searchQuery])

  const totalPages = Math.ceil(processed.length / pageSize)
  const paged = useMemo(
    () => (paginated ? processed.slice((page - 1) * pageSize, page * pageSize) : processed),
    [processed, page, pageSize, paginated],
  )

  const getKey = useCallback(
    (row: T, idx: number) => {
      if (typeof rowKey === 'function') {
        return rowKey(row)
      }
      return String(row[rowKey] ?? idx)
    },
    [rowKey],
  )

  const toggleSort = (colId: string) => {
    setSorts((prev) => {
      const existing = prev.find((s) => s.id === colId)
      if (!existing) {
        return [{ id: colId, dir: 'asc' }]
      }
      if (existing.dir === 'asc') {
        return [{ id: colId, dir: 'desc' }]
      }
      return prev.filter((s) => s.id !== colId)
    })
  }

  const toggleSelect = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      onSelectionChange?.(next)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === paged.length) {
      setSelected(new Set())
      onSelectionChange?.(new Set())
    } else {
      const all = new Set(paged.map((row, i) => getKey(row, i)))
      setSelected(all)
      onSelectionChange?.(all)
    }
  }

  useEffect(() => {
    setPage(1)
  }, [searchQuery, filters])

  const getSortIcon = (colId: string) => {
    const s = sorts.find((s) => s.id === colId)
    if (!s) {
      return <ChevronsUpDown className="w-3 h-3 text-muted-foreground/40" />
    }
    return s.dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
  }

  const renderCell = (col: EliteColumn, row: T, idx: number) => {
    const value = col.accessor(row)
    if (col.cell) {
      return col.cell(value, row)
    }
    return <span className="truncate">{String(value ?? '—')}</span>
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/50 bg-card',
        variant === 'premium' && 'shadow-lg shadow-black/5',
        variant === 'glass' && 'bg-white/5 backdrop-blur-xl dark:bg-black/20',
        className,
      )}
    >
      {/* Toolbar */}
      {(searchable || filterable || savedViews || exportable) && (
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50">
          {searchable && (
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="بحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 bg-muted/50 rounded-lg pl-3 pr-9 text-xs text-foreground placeholder:text-muted-foreground border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
          )}
          {filterable && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setShowFilterRow(!showFilterRow)}
              className={cn(showFilterRow && 'bg-primary/10 text-primary')}
            >
              <Filter className="w-3.5 h-3.5" />
            </Button>
          )}
          {savedViews && (
            <Button variant="ghost" size="icon-sm">
              <Eye className="w-3.5 h-3.5" />
            </Button>
          )}
          <div className="relative">
            <Button variant="ghost" size="icon-sm" onClick={() => setShowColumnMenu(!showColumnMenu)}>
              <Columns className="w-3.5 h-3.5" />
            </Button>
            {showColumnMenu && (
              <div className="absolute left-0 top-full mt-1 w-48 bg-popover border border-border/50 rounded-xl shadow-2xl p-2 z-50">
                {propColumns.map((col) => (
                  <button
                    key={col.id}
                    onClick={() =>
                      setColumnVisibility((prev) => ({ ...prev, [col.id]: prev[col.id] === false ? true : false }))
                    }
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs hover:bg-muted transition-colors"
                  >
                    {columnVisibility[col.id] === false ? (
                      <EyeOff className="w-3 h-3 text-muted-foreground" />
                    ) : (
                      <Eye className="w-3 h-3" />
                    )}
                    {col.header}
                  </button>
                ))}
              </div>
            )}
          </div>
          {exportable && (
            <Button variant="ghost" size="icon-sm">
              <Download className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      )}

      {/* Table */}
      <div ref={tableRef} className="overflow-x-auto mobile-scrollbar-none">
        <table className="w-full">
          <thead>
            {!reducedMotion && (
              <tr className={cn('border-b border-border/50 bg-muted/20', stickyHeader && 'sticky top-0 z-10')}>
                {selectable && (
                  <th className={cn('w-10', headerDensityStyles[density])}>
                    <input
                      type="checkbox"
                      checked={selected.size === paged.length && paged.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-border"
                    />
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.id}
                    className={cn(
                      'text-right font-medium text-muted-foreground tracking-wider uppercase',
                      headerDensityStyles[density],
                      col.sortable !== false && sortable && 'cursor-pointer hover:text-foreground select-none',
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-left',
                    )}
                    style={{ width: col.width, minWidth: col.minWidth }}
                    onClick={() => col.sortable !== false && sortable && toggleSort(col.id)}
                  >
                    <div
                      className={cn(
                        'flex items-center gap-1.5',
                        col.align === 'center' && 'justify-center',
                        col.align === 'right' && 'justify-end',
                      )}
                    >
                      <span>{col.header}</span>
                      {col.sortable !== false && sortable && (
                        <span
                          className={cn(
                            sorts.find((s) => s.id === col.id) ? 'text-primary' : 'text-muted-foreground/40',
                          )}
                        >
                          {getSortIcon(col.id)}
                        </span>
                      )}
                    </div>
                  </th>
                ))}
                {rowActions && <th className={cn('w-12', headerDensityStyles[density])} />}
              </tr>
            )}

            {/* Filter row */}
            {showFilterRow && (
              <tr className="border-b border-border/50 bg-muted/10">
                {selectable && <th className={headerDensityStyles[density]} />}
                {columns.map((col) => (
                  <th key={col.id} className={headerDensityStyles[density]}>
                    {col.filterable !== false && (
                      <input
                        type="text"
                        placeholder={`تصفية ${col.header}...`}
                        value={filters[col.id] || ''}
                        onChange={(e) => setFilters((prev) => ({ ...prev, [col.id]: e.target.value }))}
                        className="w-full h-7 bg-muted/50 rounded-md px-2 text-[11px] text-foreground placeholder:text-muted-foreground/50 border border-border/30 focus:outline-none"
                      />
                    )}
                  </th>
                ))}
                {rowActions && <th className={headerDensityStyles[density]} />}
              </tr>
            )}
          </thead>
          <tbody>
            {paged.map((row, idx) => {
              const key = getKey(row, idx)
              const isSelected = selected.has(key)

              return (
                <motion.tr
                  key={key}
                  initial={reducedMotion ? {} : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.15, delay: reducedMotion ? 0 : idx * 0.02 }}
                  className={cn(
                    'border-b border-border/30 transition-colors',
                    onRowClick && 'cursor-pointer',
                    isSelected && 'bg-primary/5',
                    !isSelected && 'hover:bg-muted/30',
                  )}
                  onClick={() => {
                    onRowClick?.(row)
                  }}
                >
                  {selectable && (
                    <td className={cn('w-10', densityStyles[density])}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(key)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-border"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className={cn(
                        densityStyles[density],
                        col.grow && 'w-full',
                        col.align === 'center' && 'text-center',
                        col.align === 'right' && 'text-left',
                      )}
                      style={{ width: col.width, minWidth: col.minWidth }}
                    >
                      {renderCell(col, row, idx)}
                    </td>
                  ))}
                  {rowActions && (
                    <td className={cn('w-12', densityStyles[density])} onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">{rowActions(row)}</div>
                    </td>
                  )}
                </motion.tr>
              )
            })}
          </tbody>
        </table>

        {!loading && paged.length === 0 && (
          <div className="py-12">
            {emptyState || (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">لا توجد بيانات</p>
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 animate-pulse">
                {columns.map((col) => (
                  <div key={col.id} className="h-4 bg-muted rounded shimmer" style={{ width: col.width || '100px' }} />
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {paginated && processed.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-muted/10">
          <span className="text-xs text-muted-foreground">
            {processed.length} نتيجة · صفحة {page} من {totalPages || 1}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4))
              const num = start + i
              if (num > totalPages) {
                return null
              }
              return (
                <Button
                  key={num}
                  variant={num === page ? 'default' : 'ghost'}
                  size="icon-sm"
                  onClick={() => setPage(num)}
                  className="text-xs w-7 h-7"
                >
                  {num}
                </Button>
              )
            })}
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export const EliteTable = forwardRef(EliteTableInner) as <T extends Record<string, any>>(
  props: EliteTableProps<T> & { ref?: React.Ref<any> },
) => React.ReactElement
