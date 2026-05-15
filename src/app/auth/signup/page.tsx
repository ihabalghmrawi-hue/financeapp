'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Loader2, Mail, Lock, Building2, User, Sparkles, ArrowLeft, Check } from 'lucide-react'
import { generateSlug } from '@/lib/utils'
import { BUSINESS_TYPE_COOKIE } from '@/lib/features'
import { motion, AnimatePresence } from 'framer-motion'

const BUSINESS_TYPE_OPTIONS = [
  { value: 'retail', label: 'بقالة / سوبرماركت', icon: '🛒', description: 'مبيعات بالتجزئة وإدارة المخزون' },
  { value: 'wholesale', label: 'تجارة الجملة', icon: '📦', description: 'بيع بالجملة وأسعار كميات' },
  { value: 'pharmacy', label: 'صيدلية', icon: '💊', description: 'إدارة الأدوية وتواريخ الانتهاء' },
  { value: 'clothing', label: 'ملابس وأزياء', icon: '👗', description: 'ملابس مع متغيرات المقاسات والألوان' },
  { value: 'dress_rental', label: 'تأجير الفساتين', icon: '👘', description: 'إدارة الحجوزات والتأجير' },
  { value: 'stationery', label: 'قرطاسية ومكتبة', icon: '📚', description: 'مواد مكتبية وتعليمية' },
  { value: 'tools', label: 'أدوات وعدد', icon: '🔧', description: 'معدات وأدوات صناعية' },
  { value: 'construction', label: 'بناء وتشطيبات', icon: '🏗️', description: 'مشاريع البناء، العمال، المصروفات' },
  { value: 'other', label: 'أخرى', icon: '🏪', description: 'نشاط تجاري عام' },
]

const stepVariants = {
  enter: { opacity: 0, x: 20 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
}

export default function SignupPage() {
  const router = useRouter()

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
      setError('الرجاء ملء جميع الحقول المطلوبة')
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError('كلمتا المرور غير متطابقتين')
      return
    }
    if (formData.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }
    setError('')
    setStep(2)
  }

  const handleNextStep2 = () => {
    if (!formData.companyName) {
      setError('الرجاء إدخال اسم الشركة')
      return
    }
    setError('')
    setStep(3)
  }

  const handleSignup = async () => {
    if (!formData.businessType) {
      setError('الرجاء اختيار نوع النشاط التجاري')
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
      setError(authError?.message || 'حدث خطأ أثناء إنشاء الحساب')
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
      setError('حدث خطأ أثناء إنشاء الشركة')
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative"
    >
      <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-premium-lg">
        <div className="absolute -inset-0.5 bg-gradient-to-b from-primary/10 to-transparent rounded-3xl opacity-50 pointer-events-none" />

        <div className="relative">
          {/* Steps indicator */}
          <div className="flex items-center justify-center gap-3 mb-8">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-3">
                <motion.div
                  animate={
                    step >= s
                      ? { scale: 1, backgroundColor: 'hsl(var(--primary))' }
                      : { scale: 0.9, backgroundColor: 'rgba(255,255,255,0.1)' }
                  }
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-300"
                >
                  {step > s ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <span className={step >= s ? 'text-white' : 'text-white/40'}>{s}</span>
                  )}
                </motion.div>
                {s < 3 && (
                  <div
                    className={`h-0.5 w-14 rounded-full transition-all duration-300 ${step > s ? 'bg-primary' : 'bg-white/10'}`}
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
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white">
                  {step === 1 ? 'إنشاء حساب جديد' : step === 2 ? 'معلومات الشركة' : 'نوع النشاط التجاري'}
                </h2>
                <p className="text-white/50 text-sm mt-1">
                  {step === 1 ? 'أدخل بياناتك الشخصية' : step === 2 ? 'أدخل بيانات شركتك' : 'اختر ما يناسب نشاطك'}
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-4 bg-destructive/10 text-destructive text-sm p-3 rounded-xl border border-destructive/20"
                >
                  {error}
                </motion.div>
              )}

              {step === 1 ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-white/80 mb-1.5 block">الاسم الكامل</label>
                    <div className="relative group">
                      <User className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary transition-colors" />
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="محمد أحمد"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-white/80 mb-1.5 block">البريد الإلكتروني</label>
                    <div className="relative group">
                      <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary transition-colors" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="example@email.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all duration-200"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-white/80 mb-1.5 block">كلمة المرور</label>
                    <div className="relative group">
                      <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary transition-colors" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-11 pl-11 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all duration-200"
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-white/80 mb-1.5 block">تأكيد كلمة المرور</label>
                    <div className="relative group">
                      <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary transition-colors" />
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all duration-200"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="w-full bg-primary text-primary-foreground rounded-xl py-3 text-sm font-medium hover:bg-primary/90 transition-all duration-200 shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
                  >
                    التالي <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              ) : step === 2 ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-white/80 mb-1.5 block">اسم الشركة أو المتجر</label>
                    <div className="relative group">
                      <Building2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-primary transition-colors" />
                      <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder="متجري / شركتي"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-11 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-white/80 mb-1.5 block">العملة الافتراضية</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all duration-200 appearance-none"
                    >
                      <option value="USD" className="bg-[#0a0a0a]">
                        دولار أمريكي (USD)
                      </option>
                      <option value="SAR" className="bg-[#0a0a0a]">
                        ريال سعودي (SAR)
                      </option>
                      <option value="AED" className="bg-[#0a0a0a]">
                        درهم إماراتي (AED)
                      </option>
                      <option value="EGP" className="bg-[#0a0a0a]">
                        جنيه مصري (EGP)
                      </option>
                      <option value="KWD" className="bg-[#0a0a0a]">
                        دينار كويتي (KWD)
                      </option>
                      <option value="EUR" className="bg-[#0a0a0a]">
                        يورو (EUR)
                      </option>
                    </select>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 border border-white/10 bg-white/5 rounded-xl py-3 text-sm font-medium text-white/70 hover:bg-white/10 transition-all duration-200"
                    >
                      رجوع
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep2}
                      className="flex-1 bg-primary text-primary-foreground rounded-xl py-3 text-sm font-medium hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      التالي <ArrowLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    {BUSINESS_TYPE_OPTIONS.map((bt) => (
                      <button
                        key={bt.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, businessType: bt.value })}
                        className={`flex items-center gap-3 p-4 rounded-2xl border text-right transition-all duration-200 ${
                          formData.businessType === bt.value
                            ? 'border-primary bg-primary/10'
                            : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                        }`}
                      >
                        <span className="text-2xl">{bt.icon}</span>
                        <div>
                          <p
                            className={`font-semibold text-sm ${formData.businessType === bt.value ? 'text-primary' : 'text-white'}`}
                          >
                            {bt.label}
                          </p>
                          <p className="text-xs text-white/40 mt-0.5">{bt.description}</p>
                        </div>
                        {formData.businessType === bt.value && (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="mr-auto">
                            <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                              <Check className="w-3.5 h-3.5 text-white" />
                            </div>
                          </motion.div>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="flex-1 border border-white/10 bg-white/5 rounded-xl py-3 text-sm font-medium text-white/70 hover:bg-white/10 transition-all duration-200"
                    >
                      رجوع
                    </button>
                    <button
                      type="button"
                      onClick={handleSignup}
                      disabled={loading}
                      className="flex-1 bg-primary text-primary-foreground rounded-xl py-3 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 shadow-lg shadow-primary/20 transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> جاري الإنشاء...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" /> إنشاء الحساب
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 text-center">
            <p className="text-sm text-white/40">
              لديك حساب بالفعل؟{' '}
              <Link href="/auth/login" className="text-primary font-medium hover:text-primary/80 transition-colors">
                تسجيل الدخول
              </Link>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
