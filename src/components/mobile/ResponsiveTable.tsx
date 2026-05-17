'use client'

import { type ReactNode, type Key } from 'react'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMobileLayout } from './MobileLayoutProvider'

export interface Column<T> {
  /** Unique key for this column. */
  key: string
  /** Header label. */
  header: ReactNode
  /** Renders the cell. */
  render: (row: T) => ReactNode
  /** CSS classes for the desktop cell. */
  className?: string
  /** Header alignment. Default 'right' (RTL-friendly). */
  align?: 'right' | 'left' | 'center'
  /**
   * Visibility priority on mobile:
   *  - 'primary': shown prominently in the card title row
   *  - 'secondary': shown as a small subtitle / amount
   *  - 'meta': shown as a chip / inline meta row
   *  - 'hidden': never rendered on mobile
   *  - 'detail' (default): shown in the expanded label/value list
   */
  mobile?: 'primary' | 'secondary' | 'meta' | 'detail' | 'hidden'
  /** Optional label override for mobile detail rows. */
  mobileLabel?: ReactNode
}

interface ResponsiveTableProps<T> {
  data: T[]
  columns: Column<T>[]
  rowKey: (row: T) => Key
  /** Optional handler when a row is tapped. Renders an arrow on mobile when provided. */
  onRowClick?: (row: T) => void
  /** Empty state content. */
  empty?: ReactNode
  /** Optional className for the wrapping element. */
  className?: string
  /** Force render mode (useful for testing). */
  forceMode?: 'table' | 'cards'
}

/**
 * Renders a wide enterprise table on tablet+ screens and switches to a
 * stack of touch-friendly cards on phones. Column metadata (`mobile`)
 * controls how each field is displayed in card mode.
 */
export function ResponsiveTable<T>({
  data,
  columns,
  rowKey,
  onRowClick,
  empty,
  className,
  forceMode,
}: ResponsiveTableProps<T>) {
  const { isMobile } = useMobileLayout()
  const useCards = forceMode === 'cards' || (forceMode !== 'table' && isMobile)

  if (data.length === 0) {
    return (
      <div className={cn('p-8 text-center text-sm text-muted-foreground', className)}>{empty ?? 'لا توجد بيانات'}</div>
    )
  }

  if (useCards) {
    return (
      <div className={cn('space-y-2', className)}>
        {data.map((row) => {
          const primary = columns.find((c) => c.mobile === 'primary')
          const secondary = columns.find((c) => c.mobile === 'secondary')
          const metas = columns.filter((c) => c.mobile === 'meta')
          const details = columns.filter((c) => !c.mobile || c.mobile === 'detail')
          const clickable = !!onRowClick

          return (
            <button
              key={rowKey(row)}
              type="button"
              onClick={clickable ? () => onRowClick!(row) : undefined}
              className={cn(
                'w-full text-right bg-card border rounded-xl p-3 transition-colors',
                clickable && 'active:bg-secondary/40 hover:bg-secondary/20 cursor-pointer',
                !clickable && 'cursor-default',
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  {primary && (
                    <div className="text-sm font-semibold text-foreground truncate">{primary.render(row)}</div>
                  )}
                  {metas.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                      {metas.map((c) => (
                        <span key={c.key} className="truncate max-w-[140px]">
                          {c.render(row)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {secondary && (
                  <div className="text-sm font-medium text-foreground/90 shrink-0 text-left">
                    {secondary.render(row)}
                  </div>
                )}
                {clickable && <ChevronLeft className="w-4 h-4 text-muted-foreground/60 shrink-0 mt-0.5" />}
              </div>

              {details.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border/50 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  {details.map((c) => (
                    <div key={c.key} className="flex items-center justify-between gap-2 min-w-0">
                      <span className="text-muted-foreground truncate">{c.mobileLabel ?? c.header}</span>
                      <span className="text-foreground font-medium truncate text-left">{c.render(row)}</span>
                    </div>
                  ))}
                </div>
              )}
            </button>
          )
        })}
      </div>
    )
  }

  // Desktop table
  return (
    <div className={cn('bg-card border rounded-xl overflow-x-auto', className)}>
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                className={cn(
                  'px-4 py-3 font-medium text-muted-foreground whitespace-nowrap',
                  c.align === 'left' && 'text-left',
                  c.align === 'center' && 'text-center',
                  (!c.align || c.align === 'right') && 'text-right',
                  c.className,
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn('border-t transition-colors', onRowClick && 'cursor-pointer hover:bg-muted/20')}
            >
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={cn(
                    'px-4 py-3 whitespace-nowrap',
                    c.align === 'left' && 'text-left',
                    c.align === 'center' && 'text-center',
                    (!c.align || c.align === 'right') && 'text-right',
                    c.className,
                  )}
                >
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
