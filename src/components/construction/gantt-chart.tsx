'use client'

import { useMemo } from 'react'
import type { ConstructionTask } from '@/types/construction'

interface GanttTask extends ConstructionTask {
  projectName?: string
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#9ca3af',
  todo: '#60a5fa',
  in_progress: '#f59e0b',
  review: '#a78bfa',
  done: '#22c55e',
  blocked: '#ef4444',
  cancelled: '#d1d5db',
}

const TASK_STATUS_AR: Record<string, string> = {
  pending: 'قيد الانتظار',
  todo: 'للتنفيذ',
  in_progress: 'قيد التنفيذ',
  review: 'مراجعة',
  done: 'مكتمل',
  blocked: 'موقوف',
  cancelled: 'ملغي',
}

export function GanttChart({ tasks }: { tasks: GanttTask[] }) {
  const { startDay, totalDays, weeks, rows } = useMemo(() => {
    const withDates = tasks.filter((t) => t.start_date && t.due_date)
    if (withDates.length === 0) {
      return { startDay: new Date(), totalDays: 30, weeks: [], rows: [] }
    }

    const minDate = withDates.reduce((m, t) => (t.start_date! < m ? t.start_date! : m), withDates[0].start_date!)
    const maxDate = withDates.reduce((m, t) => (t.due_date! > m ? t.due_date! : m), withDates[0].due_date!)

    const start = new Date(minDate)
    const end = new Date(maxDate)
    start.setHours(0, 0, 0, 0)
    end.setHours(0, 0, 0, 0)

    const padStart = 7
    const padEnd = 7
    start.setDate(start.getDate() - padStart)
    end.setDate(end.getDate() + padEnd)

    const total = Math.max(30, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const weekList: { start: Date; label: string }[] = []
    const cursor = new Date(start)
    while (cursor <= end) {
      const weekStart = new Date(cursor)
      cursor.setDate(cursor.getDate() + 7)
      weekList.push({
        start: weekStart,
        label: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
      })
    }

    const dayMs = 1000 * 60 * 60 * 24

    const rowList = withDates.map((t) => {
      const taskStart = new Date(t.start_date!)
      const taskEnd = new Date(t.due_date!)
      taskStart.setHours(0, 0, 0, 0)
      taskEnd.setHours(0, 0, 0, 0)

      const left = Math.max(0, Math.round((taskStart.getTime() - start.getTime()) / dayMs))
      const width = Math.max(1, Math.round((taskEnd.getTime() - taskStart.getTime()) / dayMs) + 1)
      const isLate = t.status !== 'done' && t.status !== 'cancelled' && taskEnd < today

      return { task: t, left, width, isLate }
    })

    return {
      startDay: start,
      totalDays: total,
      weeks: weekList,
      rows: rowList,
    }
  }, [tasks])

  const groups = useMemo(() => {
    const map = new Map<string, typeof rows>()
    for (const r of rows) {
      const pn = r.task.projectName || r.task.con_projects?.name || 'بدون مشروع'
      const g = map.get(pn) || []
      g.push(r)
      map.set(pn, g)
    }
    return Array.from(map.entries())
  }, [rows])

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>لا توجد مهام لعرضها</p>
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>المهام تحتاج إلى تاريخ بداية ونهاية للعرض على المخطط الزمني</p>
      </div>
    )
  }

  const dayPx = Math.max(20, Math.min(40, 800 / totalDays))
  const headerHeight = 44
  const rowHeight = 36
  const groupHeaderHeight = 28
  const timelineWidth = totalDays * dayPx

  let yOffset = 0
  const groupOffsets = groups.map(([name, items]) => {
    const offset = yOffset
    yOffset += groupHeaderHeight + items.length * rowHeight + 4
    return { name, items, offset }
  })

  const totalHeight = yOffset + 16

  return (
    <div className="bg-card border rounded-xl overflow-hidden" dir="ltr">
      <div className="overflow-x-auto">
        <div className="relative" style={{ width: `${timelineWidth + 220}px`, minHeight: `${totalHeight}px` }}>
          {/* Header - Week labels */}
          <div
            className="sticky top-0 z-10 bg-card border-b"
            style={{ height: `${headerHeight}px`, marginRight: '220px' }}
          >
            <div className="relative h-full" style={{ width: `${timelineWidth}px` }}>
              {weeks.map((w, i) => {
                const left = Math.round((w.start.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24)) * dayPx
                return (
                  <div
                    key={i}
                    className="absolute top-0 text-xs text-muted-foreground border-r"
                    style={{
                      left: `${left}px`,
                      width: `${dayPx * 7}px`,
                      height: `${headerHeight}px`,
                      paddingTop: '12px',
                      paddingRight: '4px',
                    }}
                  >
                    {w.label}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Task name column */}
          <div className="absolute top-0 right-0 bottom-0 w-[220px] border-l bg-card z-10">
            {groups.map(([name, items]) => (
              <div key={name}>
                <div
                  className="text-xs font-medium text-muted-foreground px-3 flex items-center border-b bg-muted/30"
                  style={{ height: `${groupHeaderHeight}px` }}
                >
                  {name}
                </div>
                {items.map((r) => (
                  <div
                    key={r.task.id}
                    className="text-xs truncate px-3 flex items-center border-b"
                    style={{ height: `${rowHeight}px` }}
                    title={r.task.title}
                  >
                    {r.task.title}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Timeline area */}
          <div className="absolute top-0" style={{ left: 0, right: '220px', bottom: 0 }}>
            {/* Today line */}
            {(() => {
              const today = new Date()
              today.setHours(0, 0, 0, 0)
              const todayLeft = Math.round((today.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24)) * dayPx
              if (todayLeft < 0 || todayLeft > timelineWidth) {
                return null
              }
              return (
                <div
                  className="absolute top-0 w-0.5 bg-red-400 z-10"
                  style={{ left: `${todayLeft}px`, height: `${totalHeight}px` }}
                />
              )
            })()}

            {/* Grid lines */}
            {weeks.map((w, i) => {
              const left = Math.round((w.start.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24)) * dayPx
              return (
                <div
                  key={i}
                  className="absolute top-0 w-px bg-muted/40"
                  style={{ left: `${left}px`, height: `${totalHeight}px` }}
                />
              )
            })}

            {/* Group headers + task bars */}
            {groupOffsets.map(({ name, items, offset }) => (
              <div key={name}>
                {/* Group header spacer */}
                <div style={{ height: `${groupHeaderHeight}px` }} />
                {items.map((r) => {
                  const y = offset + groupHeaderHeight + items.indexOf(r) * rowHeight
                  return (
                    <div
                      key={r.task.id}
                      className="absolute rounded"
                      style={{
                        left: `${r.left * dayPx}px`,
                        top: `${y + 2}px`,
                        width: `${r.width * dayPx}px`,
                        height: `${rowHeight - 4}px`,
                        backgroundColor: STATUS_COLORS[r.task.status] || '#9ca3af',
                        opacity: 0.85,
                        minWidth: '4px',
                      }}
                      title={`${r.task.title}${r.isLate ? ' (متأخر)' : ''}`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 px-4 py-2 border-t text-xs text-muted-foreground flex-wrap">
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
            <span>{TASK_STATUS_AR[status] || status}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 mr-4">
          <div className="w-0.5 h-4 bg-red-400" />
          <span>اليوم</span>
        </div>
      </div>
    </div>
  )
}
