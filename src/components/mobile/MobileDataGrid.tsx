'use client'

import { forwardRef, useMemo, useState, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useIsMobile, useIsTablet } from '@/hooks'
import { ChevronLeft, ChevronRight, ArrowUpDown, Search, Filter } from 'lucide-react'
import type { Column, DataGridProps, DataGridHandlers, FilterConfig } from '@/lib/datagrid/types'
import { formatCellValue, getRowValue, filterData, sortData, paginateData } from '@/lib/datagrid/types'

interface MobileDataGridProps<T extends Record<string, any>> extends DataGridProps<T> {
  cardView?: boolean
  compact?: boolean
}

function MobileDataGridInner<T extends Record<string, any>>(
  props: MobileDataGridProps<T>,
  ref: React.Ref<DataGridHandlers>,
) {
  const {
    columns: propColumns,
    data,
    loading,
    error,
    selectable,
    sortable = true,
    sorts: externalSorts,
    onSortChange,
    filterable = true,
    filters: externalFilters,
    onFilterChange,
    pagination: externalPagination,
    onPaginationChange,
    rowKey = (row: T) => String(row.id ?? Math.random()),
    rowActions,
    emptyState,
    onRowClick,
    className,
    cardView: forceCardView,
    compact = false,
  } = props

  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const cardView = forceCardView ?? (isMobile || (isTablet && propColumns.length > 4))

  const [internalSorts, setInternalSorts] = useState<typeof externalSorts>([])
  const [internalFilters, setInternalFilters] = useState<typeof externalFilters>([])
  const [internalPagination, setInternalPagination] = useState({ page: 1, pageSize: 25, total: 0 })
  const [showFilters, setShowFilters] = useState(false)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  const sorts = externalSorts ?? internalSorts
  const setSorts = onSortChange ?? setInternalSorts
  const filters = (externalFilters ?? internalFilters) as FilterConfig[]
  const setFilters = (onFilterChange ?? setInternalFilters) as React.Dispatch<React.SetStateAction<FilterConfig[]>>
  const pagination = externalPagination ?? internalPagination
  const setPagination = onPaginationChange ?? setInternalPagination

  const processed = useMemo(() => {
    const filtered = filterData(data, propColumns, filters)
    const sorted = sortData(filtered, propColumns, sorts ?? [])
    return { filtered, sorted }
  }, [data, propColumns, filters, sorts])

  const { sorted } = processed
  const totalFiltered = processed.filtered.length
  const totalPages = Math.ceil(totalFiltered / pagination.pageSize)
  const paged = paginateData(sorted, { ...pagination, total: totalFiltered })

  const visibleColumns = useMemo(() => propColumns.filter((c) => c.visible !== false), [propColumns])

  const toggleSort = (colId: string) => {
    const existing = sorts?.find((s) => s.id === colId)
    if (!existing) {
      setSorts([...(sorts ?? []), { id: colId, dir: 'asc' }])
    } else if (existing.dir === 'asc') {
      setSorts((sorts ?? []).map((s) => (s.id === colId ? { ...s, dir: 'desc' } : s)))
    } else {
      setSorts((sorts ?? []).filter((s) => s.id !== colId))
    }
  }

  const setFilter = (colId: string, value: any) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      setFilters((filters ?? []).filter((f) => f.id !== colId))
    } else {
      const existing = filters?.find((f) => f.id === colId)
      if (existing) {
        setFilters((filters ?? []).map((f) => (f.id === colId ? { ...f, value } : f)))
      } else {
        setFilters([...(filters ?? []), { id: colId, type: 'text', operator: 'contains', value, label: '' }])
      }
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-card rounded-2xl border border-border/50 m-4">
        <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center mb-3">
          <span className="text-destructive text-xl font-bold">!</span>
        </div>
        <p className="font-semibold text-destructive">حدث خطأ في تحميل البيانات</p>
        <p className="text-sm text-muted-foreground/70 mt-1">{error}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: compact ? 3 : 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 bg-card rounded-2xl border border-border/50 p-4 animate-pulse-soft"
          >
            <div className="w-10 h-10 rounded-xl bg-muted shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-muted rounded-full w-3/4" style={{ animationDelay: `${i * 100}ms` }} />
              <div className="h-2 bg-muted/60 rounded-full w-1/2" style={{ animationDelay: `${i * 100}ms` }} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!loading && sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-card rounded-2xl border border-border/50 m-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center mb-3">
          <span className="text-primary/40 text-2xl">~</span>
        </div>
        <p className="font-semibold text-foreground/60">لا توجد بيانات</p>
        {emptyState || <p className="text-sm text-muted-foreground/60 mt-0.5">لم يتم العثور على سجلات</p>}
      </div>
    )
  }

  if (cardView) {
    const primaryCol = visibleColumns[0]
    const secondaryCols = visibleColumns.slice(1, compact ? 3 : 5)

    return (
      <div className={cn('flex flex-col', className)}>
        {/* Mobile Card View */}
        {showFilters && (
          <div className="p-3 border-b border-border/50 space-y-2 bg-muted/20">
            {visibleColumns
              .filter((c) => c.filterable !== false)
              .slice(0, 3)
              .map((col) => (
                <input
                  key={col.id}
                  placeholder={`بحث ${col.title}`}
                  value={filters?.find((f) => f.id === col.id)?.value ?? ''}
                  onChange={(e) => setFilter(col.id, e.target.value)}
                  className="w-full h-9 px-3 text-sm bg-background border border-border/50 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all"
                />
              ))}
          </div>
        )}

        <div className="divide-y divide-border/10 px-3 py-2 space-y-2">
          {paged.map((row, idx) => {
            const key = rowKey(row)
            const isExpanded = expandedCard === key
            return (
              <div
                key={key}
                className={cn(
                  'bg-card rounded-2xl border border-border/50 overflow-hidden transition-all duration-200',
                  isExpanded && 'shadow-sm',
                  onRowClick && 'cursor-pointer active:scale-[0.99]',
                )}
                onClick={() => {
                  if (compact) {
                    onRowClick?.(row)
                    return
                  }
                  setExpandedCard(isExpanded ? null : key)
                }}
              >
                {/* Primary row */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex-1 min-w-0">
                    {primaryCol && (
                      <div className="font-semibold text-sm text-foreground truncate">
                        {primaryCol.render
                          ? primaryCol.render(getRowValue(row, primaryCol), row, idx)
                          : formatCellValue(getRowValue(row, primaryCol), primaryCol)}
                      </div>
                    )}
                    <div className="flex items-center gap-3 mt-0.5">
                      {secondaryCols.map((col) => (
                        <span key={col.id} className="text-xs text-muted-foreground/70">
                          <span className="text-muted-foreground/40">{col.title}: </span>
                          {col.render
                            ? col.render(getRowValue(row, col), row, idx)
                            : formatCellValue(getRowValue(row, col), col)}
                        </span>
                      ))}
                    </div>
                  </div>
                  {selectable && (
                    <input
                      type="checkbox"
                      className="mr-2 rounded-lg border-border/50 h-4 w-4 shrink-0 text-primary focus:ring-primary/20"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                  {!compact && (
                    <ChevronLeft
                      className={cn(
                        'h-4 w-4 text-muted-foreground/40 mr-2 transition-transform duration-200 shrink-0',
                        isExpanded && 'rotate-180',
                      )}
                    />
                  )}
                </div>

                {/* Expanded detail */}
                {isExpanded && !compact && (
                  <div className="mx-4 pb-3 pt-2 border-t border-border/20 space-y-2">
                    {visibleColumns.slice(1).map((col) => (
                      <div key={col.id} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground/60 text-xs">{col.title}</span>
                        <span className="font-medium text-foreground/80">
                          {col.render
                            ? col.render(getRowValue(row, col), row, idx)
                            : formatCellValue(getRowValue(row, col), col)}
                        </span>
                      </div>
                    ))}
                    {rowActions && (
                      <div className="pt-2 flex justify-end" onClick={(e) => e.stopPropagation()}>
                        {rowActions(row)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Mobile pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 text-sm">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              className="flex items-center gap-1 px-3 py-1.5 text-sm hover:bg-secondary rounded-xl disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
              السابق
            </button>
            <span className="text-muted-foreground/60 text-xs font-medium tabular-nums">
              {pagination.page} / {totalPages}
            </span>
            <button
              disabled={pagination.page >= totalPages}
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              className="flex items-center gap-1 px-3 py-1.5 text-sm hover:bg-secondary rounded-xl disabled:opacity-30 transition-colors"
            >
              التالي
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    )
  }

  /* ============ Standard (non-card) view for tablet/desktop ============ */
  return (
    <div className={cn('flex flex-col', className)}>
      {showFilters && (
        <div className="px-4 py-3 border-b border-border/50 bg-muted/10 flex items-center gap-2 overflow-x-auto">
          {visibleColumns
            .filter((c) => c.filterable !== false)
            .slice(0, 5)
            .map((col) => (
              <input
                key={col.id}
                placeholder={`بحث ${col.title}`}
                value={filters?.find((f) => f.id === col.id)?.value ?? ''}
                onChange={(e) => setFilter(col.id, e.target.value)}
                className="h-9 px-3 text-xs bg-background border border-border/50 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/30 transition-all min-w-[130px]"
              />
            ))}
        </div>
      )}

      <div className="overflow-auto rounded-2xl border border-border/50 mx-4 mb-2">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 bg-muted/20">
              {visibleColumns.map((col) => (
                <th
                  key={col.id}
                  className={cn(
                    'px-4 py-3 text-right font-semibold text-muted-foreground/80 whitespace-nowrap select-none text-xs uppercase tracking-wider',
                    col.sortable && sortable && 'cursor-pointer hover:text-foreground',
                  )}
                  style={{ width: col.width, minWidth: col.minWidth, textAlign: col.align }}
                  onClick={() => col.sortable && sortable && toggleSort(col.id)}
                >
                  <div className="flex items-center gap-1">
                    <span>{col.title}</span>
                    {col.sortable && sortable && <ArrowUpDown className="h-3 w-3 text-muted-foreground/30" />}
                  </div>
                </th>
              ))}
              {rowActions && <th className="w-10 px-2 py-3" />}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, idx) => (
              <tr
                key={rowKey(row)}
                className="border-b border-border/30 hover:bg-accent/20 transition-colors cursor-pointer last:border-b-0"
                onClick={() => onRowClick?.(row)}
              >
                {visibleColumns.map((col) => (
                  <td
                    key={col.id}
                    className={cn('px-4 py-3 text-foreground/80', compact && 'py-2')}
                    style={{ textAlign: col.align }}
                  >
                    {col.render ? (
                      col.render(getRowValue(row, col), row, idx)
                    ) : (
                      <span className={cn(col.dataType === 'currency' && 'font-mono tabular-nums')}>
                        {formatCellValue(getRowValue(row, col), col)}
                      </span>
                    )}
                  </td>
                ))}
                {rowActions && (
                  <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                    {rowActions(row)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-muted/10 text-sm rounded-b-2xl">
        <span className="text-muted-foreground/60 text-xs font-medium">
          {totalFiltered > 0
            ? `${(pagination.page - 1) * pagination.pageSize + 1}-${Math.min(pagination.page * pagination.pageSize, totalFiltered)} من ${totalFiltered}`
            : 'لا توجد نتائج'}
        </span>
        <div className="flex items-center gap-1">
          <button
            disabled={pagination.page <= 1}
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            className="p-1.5 hover:bg-secondary rounded-xl disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            let pn: number
            if (totalPages <= 5) {
              pn = i + 1
            } else if (pagination.page <= 3) {
              pn = i + 1
            } else if (pagination.page >= totalPages - 2) {
              pn = totalPages - 4 + i
            } else {
              pn = pagination.page - 2 + i
            }
            return (
              <button
                key={pn}
                onClick={() => setPagination({ ...pagination, page: pn })}
                className={cn(
                  'min-w-[28px] h-7 text-xs rounded-xl font-medium transition-all',
                  pagination.page === pn
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-secondary',
                )}
              >
                {pn}
              </button>
            )
          })}
          <button
            disabled={pagination.page >= totalPages}
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            className="p-1.5 hover:bg-secondary rounded-xl disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export const MobileDataGrid = forwardRef(MobileDataGridInner) as <T extends Record<string, any>>(
  props: MobileDataGridProps<T> & { ref?: React.Ref<DataGridHandlers> },
) => React.ReactElement
