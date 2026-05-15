'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useEffect, useRef, useState } from 'react'

interface Activity {
  id: string
  title: string
  description?: string
  timestamp: string
  type: 'success' | 'warning' | 'info' | 'error' | 'default'
  icon?: React.ReactNode
}

interface ActivityFeedProps {
  activities: Activity[]
  className?: string
  maxItems?: number
  showTimestamps?: boolean
}

const typeStyles = {
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  info: 'bg-primary/10 text-primary border-primary/20',
  error: 'bg-destructive/10 text-destructive border-destructive/20',
  default: 'bg-muted text-muted-foreground border-border/50',
}

const dotColors = {
  success: 'bg-success',
  warning: 'bg-warning',
  info: 'bg-primary',
  error: 'bg-destructive',
  default: 'bg-muted-foreground',
}

export function ActivityFeed({ activities, className, maxItems = 20, showTimestamps = true }: ActivityFeedProps) {
  const [visibleActivities, setVisibleActivities] = useState<Activity[]>([])
  const [prevIds, setPrevIds] = useState<Set<string>>(new Set())
  const latestRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sliced = activities.slice(0, maxItems)
    const newIds = new Set(sliced.map((a) => a.id))
    setVisibleActivities(sliced)
    setPrevIds(newIds)
  }, [activities, maxItems])

  useEffect(() => {
    if (latestRef.current) {
      latestRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [visibleActivities])

  return (
    <div className={cn('space-y-1', className)}>
      <AnimatePresence initial={false}>
        {visibleActivities.map((activity, index) => {
          const isNew = index === 0 && !prevIds.has(activity.id)

          return (
            <motion.div
              key={activity.id}
              ref={index === 0 ? latestRef : undefined}
              initial={isNew ? { opacity: 0, x: -20, height: 0 } : { opacity: 1, x: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className={cn(
                'flex items-start gap-3 p-3 rounded-xl transition-colors duration-200 hover:bg-muted/50 group',
              )}
            >
              <div className="relative flex-shrink-0 mt-0.5">
                {activity.icon || <div className={cn('w-2 h-2 rounded-full mt-1.5', dotColors[activity.type])} />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
                  {showTimestamps && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                      {activity.timestamp}
                    </span>
                  )}
                </div>
                {activity.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{activity.description}</p>
                )}
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {activities.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">لا توجد نشاطات حديثة</p>
        </div>
      )}
    </div>
  )
}
