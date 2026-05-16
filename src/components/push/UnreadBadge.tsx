'use client'

import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n/language-provider'

interface UnreadBadgeProps {
  count: number
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function UnreadBadge({ count, className, size = 'md' }: UnreadBadgeProps) {
  const { t } = useT()
  if (count === 0) {
    return null
  }

  const sizeClasses = {
    sm: 'min-w-[16px] h-4 text-[9px] px-1',
    md: 'min-w-[20px] h-5 text-[10px] px-1.5',
    lg: 'min-w-[24px] h-6 text-xs px-2',
  }

  const displayCount = count > 99 ? '99+' : String(count)

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-destructive text-destructive-foreground font-bold leading-none',
        sizeClasses[size],
        className,
      )}
      aria-label={t('notification.push.ariaUnread', { count })}
    >
      {displayCount}
    </span>
  )
}
