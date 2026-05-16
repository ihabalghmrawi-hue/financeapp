'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, Mail, Lock, Building2, User, Sparkles, ArrowLeft, Check } from 'lucide-react'
import { cn, generateSlug } from '@/lib/utils'
import { BUSINESS_TYPE_COOKIE } from '@/lib/features'
import { motion, AnimatePresence } from 'framer-motion'
import { useT } from '@/lib/i18n/language-provider'

function getBusinessTypeOptions(t: ReturnType<typeof useT>['t']) {
  return [
    { value: 'retail', label: t('businessTypes.retail'), icon: '🛒', description: t('businessTypes.retailDesc') },
    {
      value: 'wholesale',
      label: t('businessTypes.wholesale'),
      icon: '📦',
      description: t('businessTypes.wholesaleDesc'),
    },
    { value: 'pharmacy', label: t('businessTypes.pharmacy'), icon: '💊', description: t('businessTypes.pharmacyDesc') },
    { value: 'clothing', label: t('businessTypes.clothing'), icon: '👗', description: t('businessTypes.clothingDesc') },
    {
      value: 'dress_rental',
      label: t('businessTypes.dressRental'),
      icon: '👘',
      description: t('businessTypes.dressRentalDesc'),
    },
    {
      value: 'stationery',
      label: t('businessTypes.stationery'),
      icon: '📚',
      description: t('businessTypes.stationeryDesc'),
    },
    { value: 'tools', label: t('businessTypes.tools'), icon: '🔧', description: t('businessTypes.toolsDesc') },
    {
      value: 'construction',
      label: t('businessTypes.construction'),
      icon: '🏗️',
      description: t('businessTypes.constructionDesc'),
    },
    { value: 'other', label: t('businessTypes.other'), icon: '🏪', description: t('businessTypes.otherDesc') },
  ]
}

const stepVariants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
}

export default function SignupPage() {
  const router = useRouter()
  const { t, lang } = useT()
  const BUSINESS_TYPE_OPTIONS = getBusinessTypeOptions(t)

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    currency: 'USD',
    language: 'ar',
    businessType: '',
  })

  const [showPassword, setShowPassword] = useState(false)

  const handleNext = () => {
    if (!formData.fullName || !formData.email || !formData.password) {
      setError(t('auth.fillRequiredFields'))
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError(t('auth.passwordsDoNotMatch'))
      return
    }
    if (formData.password.length < 6) {
      setError(t('auth.passwordMinLength'))
      return
    }
    setError('')
    setStep(2)
  }

  const handleNextStep2 = () => {
    if (!formData.companyName) {
      setError(t('auth.fillRequiredFields'))
      return
    }
    setError('')
    setStep(3)
  }

  const handleSignup = async () => {
    if (!formData.businessType) {
      setError(t('auth.selectBusinessType'))
      return
    }

    setLoading(true)
    setError('')

    const supabase = createClient()

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: { full_name: formData.fullName },
      },
    })

    if (authError || !authData.user) {
      setError(authError?.message || t('errors.somethingWentWrong'))
      setLoading(false)
      return
    }

    const slug = `${generateSlug(formData.companyName)}-${Date.now().toString(36)}`
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: formData.companyName,
        slug,
        currency: formData.currency,
        language: formData.language,
      })
      .select()
      .single()

    if (companyError || !company) {
      setError(t('errors.somethingWentWrong'))
      setLoading(false)
      return
    }

    await supabase.from('memberships').insert({
      user_id: authData.user.id,
      company_id: company.id,
      role: 'owner',
      is_active: true,
    })

    await supabase.from('company_settings').upsert({
      company_id: company.id,
      business_type: formData.businessType,
      updated_at: new Date().toISOString(),
    })

    await fetch('/api/auth/session', { method: 'POST' })

    document.cookie = `${BUSINESS_TYPE_COOKIE}=${formData.businessType}; path=/; max-age=${60 * 60 * 24 * 365}`
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <>
      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-2 mb-7">
        {[1, 2, 3].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <motion.div
              animate={
                step >= s
                  ? { scale: 1, backgroundColor: 'rgb(16 185 129 / 0.2)', borderColor: 'rgb(52 211 153 / 0.5)' }
                  : { scale: 0.9, backgroundColor: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)' }
              }
              className={cn(
                'w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold border transition-all duration-300',
                step >= s ? 'border-emerald-400/50 text-emerald-400' : 'border-white/10 text-white/30',
              )}
            >
              {step > s ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <span>{s}</span>}
            </motion.div>
            {i < 2 && (
              <div
                className={`h-px w-10 rounded-full transition-all duration-300 ${step > s ? 'bg-emerald-400/30' : 'bg-white/5'}`}
              />
            )}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25 }}
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 bg-red-500/10 text-red-400 text-sm p-3 rounded-xl border border-red-500/20"
            >
              {error}
            </motion.div>
          )}

          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="auth-label">{t('auth.fullName')}</label>
                <div className="relative group">
                  <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 auth-icon-muted group-focus-within:text-emerald-400 transition-colors" />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder={lang === 'en' ? 'Ahmed Mohamed' : 'محمد أحمد'}
                    className="auth-input pr-11"
                  />
                </div>
              </div>

              <div>
                <label className="auth-label">{t('auth.email')}</label>
                <div className="relative group">
                  <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 auth-icon-muted group-focus-within:text-emerald-400 transition-colors" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="example@email.com"
                    dir="ltr"
                    className="auth-input pr-11"
                  />
                </div>
              </div>

              <div>
                <label className="auth-label">{t('auth.password')}</label>
                <div className="relative group">
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 auth-icon-muted group-focus-within:text-emerald-400 transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    dir="ltr"
                    className="auth-input pr-11 pl-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 auth-icon-muted hover:opacity-70 transition-opacity"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="auth-label">{t('auth.confirmPassword')}</label>
                <div className="relative group">
                  <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 auth-icon-muted group-focus-within:text-emerald-400 transition-colors" />
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="••••••••"
                    dir="ltr"
                    className="auth-input pr-11"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleNext}
                className="auth-gradient-btn w-full text-white font-semibold rounded-xl py-3.5 text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-200"
              >
                {t('auth.next')} <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          ) : step === 2 ? (
            <div className="space-y-4">
              <div>
                <label className="auth-label">{t('auth.companyName')}</label>
                <div className="relative group">
                  <Building2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 auth-icon-muted group-focus-within:text-emerald-400 transition-colors" />
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder={lang === 'en' ? 'My Store' : 'متجري / شركتي'}
                    className="auth-input pr-11"
                  />
                </div>
              </div>

              <div>
                <label className="auth-label">{t('auth.defaultCurrency')}</label>
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="auth-input appearance-none"
                >
                  <option value="USD" className="bg-[#0d1117]">
                    {lang === 'en' ? 'US Dollar' : 'دولار أمريكي'} (USD)
                  </option>
                  <option value="SAR" className="bg-[#0d1117]">
                    {lang === 'en' ? 'Saudi Riyal' : 'ريال سعودي'} (SAR)
                  </option>
                  <option value="AED" className="bg-[#0d1117]">
                    {lang === 'en' ? 'UAE Dirham' : 'درهم إماراتي'} (AED)
                  </option>
                  <option value="EGP" className="bg-[#0d1117]">
                    {lang === 'en' ? 'Egyptian Pound' : 'جنيه مصري'} (EGP)
                  </option>
                  <option value="KWD" className="bg-[#0d1117]">
                    {lang === 'en' ? 'Kuwaiti Dinar' : 'دينار كويتي'} (KWD)
                  </option>
                  <option value="EUR" className="bg-[#0d1117]">
                    {lang === 'en' ? 'Euro' : 'يورو'} (EUR)
                  </option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(1)} className="flex-1 auth-btn-secondary">
                  {t('common.back')}
                </button>
                <button
                  type="button"
                  onClick={handleNextStep2}
                  className="auth-gradient-btn flex-1 text-white font-semibold rounded-xl py-3.5 text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-200"
                >
                  {t('auth.next')} <ArrowLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-2.5 max-h-[360px] overflow-y-auto thin-scrollbar">
                {BUSINESS_TYPE_OPTIONS.map((bt) => (
                  <button
                    key={bt.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, businessType: bt.value })}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border text-right transition-all duration-200 ${
                      formData.businessType === bt.value
                        ? 'border-emerald-400/30 bg-emerald-500/8'
                        : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/10'
                    }`}
                  >
                    <span className="text-xl">{bt.icon}</span>
                    <div className="flex-1">
                      <p
                        className={`font-semibold text-sm ${formData.businessType === bt.value ? 'text-emerald-400' : 'text-white'}`}
                      >
                        {bt.label}
                      </p>
                      <p className="auth-text-muted text-xs mt-0.5">{bt.description}</p>
                    </div>
                    {formData.businessType === bt.value && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                        <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      </motion.div>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(2)} className="auth-btn-secondary">
                  {t('common.back')}
                </button>
                <button
                  type="button"
                  onClick={handleSignup}
                  disabled={loading}
                  className="auth-gradient-btn flex-1 text-white font-semibold rounded-xl py-3.5 text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> {t('auth.creatingAccount')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> {t('auth.createAccount')}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <p className="mt-6 text-center auth-text-muted text-xs">
        {t('auth.alreadyHaveAccount')}{' '}
        <Link href="/auth/login" className="text-emerald-400 font-medium hover:text-emerald-300 transition-colors">
          {t('auth.signIn')}
        </Link>
      </p>
    </>
  )
}
