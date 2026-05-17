'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface MobilePageHeaderProps {
  title: ReactNode
  description?: ReactNode
  /** Right-aligned actions (primary action button, etc). */
  actions?: ReactNode
  /** When true (default), title becomes sticky at the top of the scroll container. */
  sticky?: boolean
  /** Optional secondary row rendered below (filters, tabs). */
  belowRow?: ReactNode
  className?: string
}

/**
 * Standardized page header used across workspaces.
 * - On mobile: compact, single line, primary action prominently right-aligned.
 * - On tablet+: title + description stack with actions to the side.
 */
export function MobilePageHeader({
  title,
  description,
  actions,
  sticky = false,
  belowRow,
  className,
}: MobilePageHeaderProps) {
  return (
    <div
      className={cn(
        'bg-background',
        sticky &&
          'sticky top-0 z-20 -mx-3 sm:-mx-4 lg:-mx-6 px-3 sm:px-4 lg:px-6 py-2 border-b border-border/40 backdrop-blur-xl bg-background/85',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-foreground truncate">{title}</h1>
          {description && (
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 hidden sm:block">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      {belowRow && <div className="mt-3">{belowRow}</div>}
    </div>
  )
}
