'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, AlertTriangle, Info, Package, Receipt, Users, BarChart3, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n/language-provider'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  severity: 'info' | 'warning' | 'error'
  created_at: string
  read: boolean
}

const ICONS: Record<string, React.ElementType> = {
  low_stock: Package,
  out_of_stock: Package,
  unpaid_invoices: Receipt,
  daily_summary: BarChart3,
  customer_debt: Users,
}

const SEVERITY_STYLES = {
  error: 'bg-destructive/10 text-destructive',
  warning: 'bg-warning/10 text-warning',
  info: 'bg-primary/10 text-primary',
}

export function NotificationsPanel() {
  const { t } = useT()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 120_000)
    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/notifications')
      if (!res.ok) {
        return
      }
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnread(data.unread || 0)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }

  const markAllRead = async () => {
    const allIds = new Set(notifications.map((n) => n.id))
    setReadIds(allIds)
    setUnread(0)
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        body: '{}',
        headers: { 'Content-Type': 'application/json' },
      })
    } catch {
      /* ignore */
    }
  }

  const markRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
    setUnread((prev) => Math.max(0, prev - 1))
  }

  const isRead = (n: Notification) => n.read || readIds.has(n.id)

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => {
          setOpen((o) => !o)
          if (!open) {
            fetchNotifications()
          }
        }}
        className="relative p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-all duration-200"
        title={t('layout.notifications.title')}
      >
        <Bell className={cn('w-4 h-4', loading && 'animate-pulse-soft')} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-destructive text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 shadow-sm">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-2 w-80 bg-card border border-border/50 rounded-2xl shadow-premium z-50 overflow-hidden"
          dir="rtl"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-secondary/30">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">{t('layout.notifications.title')}</span>
              {unread > 0 && (
                <span className="bg-destructive text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                  {unread}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button onClick={markAllRead} className="text-[11px] text-primary hover:underline px-2">
                  {t('layout.notifications.markAllRead')}
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-secondary rounded-lg">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto max-h-96">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">{t('layout.notifications.noNotifications')}</p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = ICONS[n.type] || Info
                const read = isRead(n)
                return (
                  <button
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={cn(
                      'w-full text-right flex items-start gap-3 px-4 py-3 border-b border-border/30 last:border-0 transition-colors hover:bg-secondary/50',
                      !read && 'bg-primary/[0.03]',
                    )}
                  >
                    <div
                      className={cn(
                        'mt-0.5 w-7 h-7 rounded-xl flex items-center justify-center shrink-0',
                        SEVERITY_STYLES[n.severity],
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0 text-right">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={cn(
                            'text-xs font-semibold',
                            !read && 'text-foreground',
                            read && 'text-muted-foreground',
                          )}
                        >
                          {n.title}
                        </p>
                        {!read && <span className="w-1.5 h-1.5 bg-primary rounded-full shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-border/50 bg-secondary/20 text-center">
            <button onClick={fetchNotifications} className="text-xs text-primary hover:underline">
              {t('layout.notifications.refresh')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
