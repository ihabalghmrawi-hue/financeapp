'use client'

import { useState, useCallback } from 'react'
import { Bell, BellOff, Moon, Volume2, Vibrate, BadgeCheck, AlertTriangle, Save } from 'lucide-react'
import { usePush } from '@/lib/push/react/push-provider'
import { CATEGORY_LABELS } from '@/lib/push/types'
import type { PushNotificationCategory, PushNotificationPriority } from '@/lib/push/types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const PRIORITY_OPTIONS: { value: PushNotificationPriority; label: string }[] = [
  { value: 'low', label: 'منخفضة' },
  { value: 'normal', label: 'متوسطة' },
  { value: 'high', label: 'عالية' },
  { value: 'critical', label: 'حرجة' },
]

const CATEGORY_ICONS: Record<PushNotificationCategory, React.ReactNode> = {
  approval: <Bell className="h-4 w-4" />,
  sla_breach: <AlertTriangle className="h-4 w-4" />,
  workflow_failed: <AlertTriangle className="h-4 w-4" />,
  inventory: <Bell className="h-4 w-4" />,
  payment: <Bell className="h-4 w-4" />,
  accounting_anomaly: <AlertTriangle className="h-4 w-4" />,
  integration: <Bell className="h-4 w-4" />,
  escalation: <AlertTriangle className="h-4 w-4" />,
  security: <AlertTriangle className="h-4 w-4" />,
  system: <Bell className="h-4 w-4" />,
  sync: <Bell className="h-4 w-4" />,
  reminder: <Bell className="h-4 w-4" />,
}

interface ToggleRowProps {
  label: string
  description?: string
  checked: boolean
  onChange: (checked: boolean) => void
  icon?: React.ReactNode
}

function ToggleRow({ label, description, checked, onChange, icon }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        {icon && (
          <div
            className={cn('rounded-lg p-2', checked ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}
          >
            {icon}
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          checked ? 'bg-primary' : 'bg-input',
        )}
      >
        <span
          className={cn(
            'inline-block h-5 w-5 rounded-full bg-white shadow-sm transform transition-transform',
            checked ? 'translate-x-5' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  )
}

interface TimeInputProps {
  label: string
  value: string
  onChange: (value: string) => void
}

function TimeInput({ label, value, onChange }: TimeInputProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 rounded-lg border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        dir="ltr"
      />
    </div>
  )
}

export function NotificationPreferences() {
  const { preferences, initialized, updatePreferences, updateCategoryPreference } = usePush()

  const handleMasterToggle = useCallback(
    async (enabled: boolean) => {
      await updatePreferences({ enabled })
    },
    [updatePreferences],
  )

  const handleQuietHoursToggle = useCallback(
    async (enabled: boolean) => {
      await updatePreferences({
        quietHoursEnabled: enabled,
        quietHoursStart: preferences?.quietHoursStart || '22:00',
        quietHoursEnd: preferences?.quietHoursEnd || '07:00',
      })
    },
    [updatePreferences, preferences],
  )

  const handleQuietHoursStart = useCallback(
    async (value: string) => {
      await updatePreferences({ quietHoursStart: value })
    },
    [updatePreferences],
  )

  const handleQuietHoursEnd = useCallback(
    async (value: string) => {
      await updatePreferences({ quietHoursEnd: value })
    },
    [updatePreferences],
  )

  const handlePriorityThreshold = useCallback(
    async (value: PushNotificationPriority) => {
      await updatePreferences({ priorityThreshold: value })
    },
    [updatePreferences],
  )

  const handleSoundToggle = useCallback(
    async (enabled: boolean) => {
      await updatePreferences({ soundEnabled: enabled })
    },
    [updatePreferences],
  )

  const handleVibrationToggle = useCallback(
    async (enabled: boolean) => {
      await updatePreferences({ vibrationEnabled: enabled })
    },
    [updatePreferences],
  )

  const handleBadgeToggle = useCallback(
    async (enabled: boolean) => {
      await updatePreferences({ badgeEnabled: enabled })
    },
    [updatePreferences],
  )

  const handleCategoryToggle = useCallback(
    async (category: PushNotificationCategory, enabled: boolean) => {
      await updateCategoryPreference(category, enabled)
    },
    [updateCategoryPreference],
  )

  if (!initialized || !preferences) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  const categories = Object.entries(CATEGORY_LABELS) as [
    PushNotificationCategory,
    (typeof CATEGORY_LABELS)[PushNotificationCategory],
  ][]
  const allEnabled = Object.values(preferences.categoryPreferences).every((p) => p.enabled)
  const someEnabled = Object.values(preferences.categoryPreferences).some((p) => p.enabled)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {preferences.enabled ? (
              <Bell className="h-5 w-5 text-primary" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
            الإشعارات
          </CardTitle>
          <CardDescription>إدارة تفضيلات الإشعارات وتحديد أولوياتها</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleRow
            label={preferences.enabled ? 'الإشعارات مفعلة' : 'الإشعارات متوقفة'}
            description="تشغيل أو إيقاف جميع الإشعارات"
            checked={preferences.enabled}
            onChange={handleMasterToggle}
            icon={preferences.enabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
          />

          {preferences.enabled && (
            <>
              <div className="border-t pt-4 space-y-4">
                <h4 className="text-sm font-semibold text-foreground px-1">الإعدادات العامة</h4>

                <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg p-2 bg-muted text-muted-foreground">
                      <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">الحد الأدنى للأولوية</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        عرض الإشعارات التي تساوي أو تزيد عن هذه الأولوية
                      </p>
                    </div>
                  </div>
                  <select
                    value={preferences.priorityThreshold}
                    onChange={(e) => handlePriorityThreshold(e.target.value as PushNotificationPriority)}
                    className="h-9 rounded-lg border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {PRIORITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <ToggleRow
                  label="الصوت"
                  description="تشغيل الصوت عند وصول الإشعار"
                  checked={preferences.soundEnabled}
                  onChange={handleSoundToggle}
                  icon={<Volume2 className="h-4 w-4" />}
                />

                <ToggleRow
                  label="الاهتزاز"
                  description="تشغيل الاهتزاز عند وصول الإشعار"
                  checked={preferences.vibrationEnabled}
                  onChange={handleVibrationToggle}
                  icon={<Vibrate className="h-4 w-4" />}
                />

                <ToggleRow
                  label="الشارة (Badge)"
                  description="عرض عدد الإشعارات غير المقروءة على أيقونة التطبيق"
                  checked={preferences.badgeEnabled}
                  onChange={handleBadgeToggle}
                  icon={<BadgeCheck className="h-4 w-4" />}
                />

                <div className="border-t pt-4">
                  <ToggleRow
                    label="ساعات الهدوء"
                    description="إيقاف الإشعارات مؤقتاً خلال ساعات محددة"
                    checked={preferences.quietHoursEnabled}
                    onChange={handleQuietHoursToggle}
                    icon={<Moon className="h-4 w-4" />}
                  />

                  {preferences.quietHoursEnabled && (
                    <div className="flex items-center gap-4 pr-16 pb-3 pt-1">
                      <TimeInput
                        label="من"
                        value={preferences.quietHoursStart || '22:00'}
                        onChange={handleQuietHoursStart}
                      />
                      <TimeInput
                        label="إلى"
                        value={preferences.quietHoursEnd || '07:00'}
                        onChange={handleQuietHoursEnd}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4 space-y-1">
                <div className="flex items-center justify-between px-1 mb-2">
                  <h4 className="text-sm font-semibold text-foreground">تصنيفات الإشعارات</h4>
                  <span className="text-xs text-muted-foreground">
                    {allEnabled ? 'الكل مفعل' : someEnabled ? 'بعضها مفعل' : 'الكل متوقف'}
                  </span>
                </div>

                {categories.map(([category, labels]) => {
                  const catPref = preferences.categoryPreferences[category]
                  return (
                    <ToggleRow
                      key={category}
                      label={labels.title}
                      description={labels.description}
                      checked={catPref?.enabled ?? true}
                      onChange={(enabled) => handleCategoryToggle(category, enabled)}
                      icon={CATEGORY_ICONS[category]}
                    />
                  )
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
