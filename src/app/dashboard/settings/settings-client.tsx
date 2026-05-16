'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
  Building2,
  Bell,
  Shield,
  Database,
  Loader2,
  CheckCircle,
  AlertCircle,
  Moon,
  Sun,
  Globe,
  DollarSign,
  Store,
  Palette,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { BUSINESS_TYPES, getFeatures, type BusinessType } from '@/lib/features'
import { BrandingSettings } from '@/components/branding-settings'
import { NotificationPreferences } from '@/components/push/NotificationPreferences'
import type { Company } from '@/types/database'
import { useT } from '@/lib/i18n/language-provider'

interface SettingsClientProps {
  company: Company
  user: any
  role: string
  currentBusinessType?: string
  branding?: any
}

export function SettingsClient({ company, user, role, currentBusinessType, branding }: SettingsClientProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const { t, setLang, formatDate } = useT()
  const [activeSection, setActiveSection] = useState('general')
  const [selectedBizType, setSelectedBizType] = useState<BusinessType>(
    (currentBusinessType as BusinessType) || 'retail',
  )
  const [savingBizType, setSavingBizType] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: company.name || '',
    name_ar: company.name_ar || '',
    email: company.email || '',
    phone: company.phone || '',
    address: company.address || '',
    tax_number: company.tax_number || '',
    currency: company.currency || 'USD',
    language: company.language || 'ar',
    timezone: company.timezone || 'Asia/Riyadh',
  })

  const [notifications, setNotifications] = useState(company.settings?.notifications_enabled ?? true)
  const [backupEnabled, setBackupEnabled] = useState(company.settings?.backup_enabled ?? true)

  const saveGeneral = async () => {
    setSaving(true)
    setSaveError(null)
    const res = await fetch('/api/company', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name || company.name,
        name_ar: form.name_ar || null,
        email: form.email || null,
        phone: form.phone || null,
        address: form.address || null,
        tax_number: form.tax_number || null,
        currency: form.currency,
        language: form.language,
        timezone: form.timezone,
      }),
    })
    setSaving(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setSaveError(d.error || t('settings.saveFailed'))
      return
    }
    setSaved(true)
    setLang(form.language as 'ar' | 'en')
    setTimeout(() => setSaved(false), 3000)
    router.refresh()
  }

  const saveNotifications = async () => {
    setSaving(true)
    setSaveError(null)
    const res = await fetch('/api/company', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        settings: {
          ...company.settings,
          notifications_enabled: notifications,
          backup_enabled: backupEnabled,
        },
      }),
    })
    setSaving(false)
    if (!res.ok) {
      const d = await res.json().catch(() => ({}))
      setSaveError(d.error || t('settings.saveFailed'))
      return
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const [resetting, setResetting] = useState(false)

  const saveBizType = async () => {
    setSavingBizType(true)
    await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_type: selectedBizType }),
    })
    setSavingBizType(false)
    router.refresh()
  }

  const resetToTemplate = async () => {
    if (!confirm(t('settings.confirmResetTemplate'))) {
      return
    }
    setResetting(true)
    await fetch('/api/onboarding/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_type: selectedBizType, reset: true }),
    })
    setResetting(false)
    router.refresh()
  }

  const sections = [
    { key: 'branding', label: t('settings.sectionBranding'), icon: Palette },
    { key: 'business', label: t('settings.sectionBusinessType'), icon: Store },
    { key: 'general', label: t('settings.general'), icon: Building2 },
    { key: 'preferences', label: t('settings.preferences'), icon: Globe },
    { key: 'notifications', label: t('settings.notifications'), icon: Bell },
    { key: 'security', label: t('settings.security'), icon: Shield },
    { key: 'backup', label: t('settings.backup'), icon: Database },
  ]

  const canEdit = ['owner', 'admin'].includes(role)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">{t('settings.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('settings.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Nav */}
        <div className="bg-card rounded-xl border p-3 shadow-sm h-fit">
          {sections.map((s) => {
            const Icon = s.icon
            return (
              <button
                key={s.key}
                onClick={() => setActiveSection(s.key)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-right',
                  activeSection === s.key
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {s.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="lg:col-span-3 bg-card rounded-xl border shadow-sm p-6">
          {saved && (
            <div className="mb-4 flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-sm p-3 rounded-lg border border-emerald-200">
              <CheckCircle className="w-4 h-4" />
              {t('settings.saved')}
            </div>
          )}
          {saveError && (
            <div className="mb-4 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 text-sm p-3 rounded-lg border border-red-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {saveError}
            </div>
          )}

          {/* Branding */}
          {activeSection === 'branding' && (
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground mb-4">{t('settings.sectionBranding')}</h3>
              <BrandingSettings initialData={branding} />
            </div>
          )}

          {/* Business Type */}
          {activeSection === 'business' && (
            <div className="space-y-5">
              <h3 className="font-semibold text-foreground">{t('settings.businessTypeTitle')}</h3>
              <p className="text-sm text-muted-foreground">{t('settings.businessTypeDesc')}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {BUSINESS_TYPES.map((type) => {
                  const f = getFeatures(type)
                  const isSelected = selectedBizType === type
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedBizType(type)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 text-center transition-all',
                        isSelected ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40',
                      )}
                    >
                      <span className="text-2xl">{f.icon}</span>
                      <span className="text-xs font-medium">{f.label}</span>
                    </button>
                  )
                })}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={saveBizType}
                  disabled={savingBizType}
                  className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
                >
                  {savingBizType ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {t('settings.saveBusinessType')}
                </button>
                <button
                  onClick={resetToTemplate}
                  disabled={resetting}
                  className="px-4 py-2.5 border border-amber-300 text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 rounded-lg text-sm font-medium hover:bg-amber-100 disabled:opacity-50 flex items-center gap-2"
                >
                  {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {t('settings.resetData')}
                </button>
              </div>
            </div>
          )}

          {/* General Settings */}
          {activeSection === 'general' && (
            <div className="space-y-5">
              <h3 className="font-semibold text-foreground">{t('settings.companyInfo')}</h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">{t('settings.companyNameAr')}</label>
                  <input
                    value={form.name_ar}
                    onChange={(e) => setForm({ ...form, name_ar: e.target.value })}
                    disabled={!canEdit}
                    placeholder={t('settings.companyNameAr')}
                    className="w-full border border-input bg-background rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="form-label">Company Name (English)</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    disabled={!canEdit}
                    placeholder="Company Name"
                    className="w-full border border-input bg-background rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">{t('settings.email')}</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    disabled={!canEdit}
                    placeholder="company@email.com"
                    className="w-full border border-input bg-background rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="form-label">{t('settings.phone')}</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    disabled={!canEdit}
                    placeholder="+966 XX XXX XXXX"
                    className="w-full border border-input bg-background rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="form-label">{t('settings.address')}</label>
                <textarea
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  disabled={!canEdit}
                  rows={2}
                  placeholder={t('settings.address')}
                  className="w-full border border-input bg-background rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed resize-none"
                />
              </div>

              <div>
                <label className="form-label">{t('settings.taxNumber')}</label>
                <input
                  value={form.tax_number}
                  onChange={(e) => setForm({ ...form, tax_number: e.target.value })}
                  disabled={!canEdit}
                  placeholder="VAT/TAX Number"
                  className="w-full border border-input bg-background rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed"
                  dir="ltr"
                />
              </div>

              {canEdit && (
                <button
                  onClick={saveGeneral}
                  disabled={saving}
                  className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 transition-colors"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('settings.saving')}
                    </>
                  ) : (
                    t('settings.save')
                  )}
                </button>
              )}
            </div>
          )}

          {/* Preferences */}
          {activeSection === 'preferences' && (
            <div className="space-y-5">
              <h3 className="font-semibold text-foreground">{t('settings.preferences')}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">{t('settings.defaultCurrency')}</label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    disabled={!canEdit}
                    className="w-full border border-input bg-background rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                  >
                    <option value="USD">{t('settings.currencyUSD')}</option>
                    <option value="SAR">{t('settings.currencySAR')}</option>
                    <option value="AED">{t('settings.currencyAED')}</option>
                    <option value="EGP">{t('settings.currencyEGP')}</option>
                    <option value="KWD">{t('settings.currencyKWD')}</option>
                    <option value="EUR">{t('settings.currencyEUR')}</option>
                    <option value="GBP">{t('settings.currencyGBP')}</option>
                  </select>
                </div>
                <div>
                  <label className="form-label">{t('settings.language')}</label>
                  <select
                    value={form.language}
                    onChange={(e) => setForm({ ...form, language: e.target.value })}
                    disabled={!canEdit}
                    className="w-full border border-input bg-background rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-60"
                  >
                    <option value="ar">{t('settings.arabic')}</option>
                    <option value="en">{t('settings.english')}</option>
                  </select>
                </div>
              </div>

              {/* Theme */}
              <div>
                <label className="form-label">{t('settings.theme')}</label>
                <div className="flex gap-3">
                  {[
                    { value: 'light', label: t('settings.light'), icon: Sun },
                    { value: 'dark', label: t('settings.dark'), icon: Moon },
                    { value: 'system', label: t('settings.system'), icon: Globe },
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTheme(value)}
                      className={cn(
                        'flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                        theme === value
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-input hover:border-muted-foreground text-muted-foreground',
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {canEdit && (
                <button
                  onClick={saveGeneral}
                  disabled={saving}
                  className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 transition-colors"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('settings.saving')}
                    </>
                  ) : (
                    t('settings.save')
                  )}
                </button>
              )}
            </div>
          )}

          {/* Notifications */}
          {activeSection === 'notifications' && (
            <div className="space-y-5">
              <h3 className="font-semibold text-foreground">{t('settings.notificationSettings')}</h3>
              <NotificationPreferences />
            </div>
          )}

          {/* Security */}
          {activeSection === 'security' && (
            <div className="space-y-5">
              <h3 className="font-semibold text-foreground">{t('settings.securityPrivacy')}</h3>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{t('settings.accountProtected')}</p>
                    {user?.email && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t('settings.yourEmail')}: <span dir="ltr">{user.email}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl border bg-muted/20">
                  <p className="text-sm font-medium text-foreground">{t('settings.changePassword')}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t('settings.changePasswordDesc')}</p>
                  <button
                    onClick={async () => {
                      if (!user?.email) {
                        return
                      }
                      const supabase = createClient()
                      await supabase.auth.resetPasswordForEmail(user.email)
                      alert(t('settings.resetLinkSent'))
                    }}
                    className="mt-3 text-sm text-primary hover:underline font-medium"
                  >
                    {t('settings.sendResetLink')}
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-red-100 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                <p className="text-sm font-medium text-red-700 dark:text-red-400">{t('settings.dangerZone')}</p>
                <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-0.5">{t('settings.dangerZoneDesc')}</p>
              </div>
            </div>
          )}

          {/* Backup */}
          {activeSection === 'backup' && (
            <div className="space-y-5">
              <h3 className="font-semibold text-foreground">{t('settings.backup')}</h3>
              <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{t('settings.backupActive')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('settings.backupActiveDesc')}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { label: t('settings.highSecurity'), desc: t('settings.highSecurityDesc') },
                  { label: t('settings.autoBackup'), desc: t('settings.autoBackupDesc') },
                  { label: t('settings.quickRecovery'), desc: t('settings.quickRecoveryDesc') },
                ].map((item, i) => (
                  <div key={i} className="p-4 rounded-xl border bg-muted/20">
                    <p className="font-semibold text-foreground text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl border bg-muted/20">
                <p className="text-sm font-medium text-foreground mb-1">{t('settings.accountInfo')}</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>
                    {t('settings.companyId')}:{' '}
                    <span className="font-mono text-foreground" dir="ltr">
                      {company.id}
                    </span>
                  </p>
                  <p>
                    {t('settings.createdDate')}: {formatDate(company.created_at)}
                  </p>
                  <p>{t('settings.version')}: v1.0.0</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
