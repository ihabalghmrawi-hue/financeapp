import Link from 'next/link'
import { Check, X, Zap } from 'lucide-react'
import { PLAN_PRICING, PLAN_LIMITS, PLAN_FEATURES } from '@/lib/plans'
import type { Plan } from '@/lib/plans'

const PLANS: Plan[] = ['free', 'basic', 'pro']

const FEATURE_ROWS = [
  { key: 'products', label: 'المنتجات', isLimit: true },
  { key: 'customers', label: 'العملاء', isLimit: true },
  { key: 'salesPerMonth', label: 'مبيعات شهرية', isLimit: true },
  { key: 'users', label: 'المستخدمون', isLimit: true },
  { key: 'reports', label: 'التقارير', isLimit: false },
  { key: 'exportCSV', label: 'تصدير CSV', isLimit: false },
  { key: 'backups', label: 'النسخ الاحتياطية', isLimit: false },
  { key: 'aiInsights', label: 'تحليلات الذكاء الاصطناعي', isLimit: false },
  { key: 'customBranding', label: 'هوية بصرية مخصصة', isLimit: false },
  { key: 'prioritySupport', label: 'دعم فني أولوية', isLimit: false },
] as const

function formatLimit(val: number): string {
  return val === -1 ? 'غير محدود' : val.toLocaleString('ar')
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]" dir="rtl">
      {/* Nav */}
      <nav className="border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="font-bold text-lg text-primary">Ezy ERP</span>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="text-sm text-white/50 hover:text-white/80 transition-colors">
              تسجيل الدخول
            </Link>
            <Link
              href="/auth/signup"
              className="text-sm bg-primary text-primary-foreground px-4 py-1.5 rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              ابدأ مجاناً
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-16 space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium border border-primary/20">
            <Zap className="w-4 h-4" /> خطط مرنة لكل حجم عمل
          </div>
          <h1 className="text-4xl font-bold text-white">الأسعار والخطط</h1>
          <p className="text-xl text-white/50 max-w-2xl mx-auto">
            ابدأ مجاناً وطوّر خطتك مع نمو عملك. جميع الخطط تشمل 7 أيام تجريبية مجانية.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const pricing = PLAN_PRICING[plan]
            const limits = PLAN_LIMITS[plan]
            const features = PLAN_FEATURES[plan]
            return (
              <div
                key={plan}
                className={`relative rounded-3xl border p-8 flex flex-col gap-6 ${
                  pricing.highlight
                    ? 'border-primary/50 bg-primary/[0.03] shadow-2xl shadow-primary/10'
                    : 'border-white/10 bg-white/[0.02]'
                }`}
              >
                {pricing.badge && (
                  <div className="absolute -top-3 right-1/2 translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap shadow-lg">
                    {pricing.badge}
                  </div>
                )}

                <div>
                  <p className="text-sm font-semibold text-white/40 uppercase tracking-wide">{pricing.nameAr}</p>
                  <div className="mt-2 flex items-baseline gap-1">
                    {pricing.monthly === 0 ? (
                      <span className="text-4xl font-bold text-white">مجاني</span>
                    ) : (
                      <>
                        <span className="text-4xl font-bold text-white">${pricing.monthly}</span>
                        <span className="text-white/40">/شهر</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    { label: 'منتجات', val: limits.products },
                    { label: 'عملاء', val: limits.customers },
                    { label: 'مستخدمون', val: limits.users },
                  ].map((r) => (
                    <div key={r.label} className="flex justify-between text-sm">
                      <span className="text-white/40">{r.label}</span>
                      <span className="font-semibold text-white">{formatLimit(r.val)}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 flex-1">
                  {[
                    { label: 'التقارير', val: features.reports },
                    { label: 'تصدير CSV', val: features.exportCSV },
                    { label: 'النسخ الاحتياطية', val: features.backups },
                    { label: 'تحليلات AI', val: features.aiInsights },
                    { label: 'هوية بصرية مخصصة', val: features.customBranding },
                    { label: 'دعم أولوية', val: features.prioritySupport },
                  ].map((f) => (
                    <div key={f.label} className="flex items-center gap-2 text-sm">
                      {f.val ? (
                        <Check className="w-4 h-4 text-success shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-white/20 shrink-0" />
                      )}
                      <span className={f.val ? 'text-white/80' : 'text-white/30'}>{f.label}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/auth/signup"
                  className={`w-full py-3 rounded-2xl text-center text-sm font-semibold transition-all duration-200 ${
                    pricing.highlight
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20'
                      : 'border border-white/10 text-white hover:bg-white/5'
                  }`}
                >
                  {plan === 'free' ? 'ابدأ مجاناً' : 'ابدأ التجربة المجانية'}
                </Link>
              </div>
            )
          })}
        </div>

        {/* Feature comparison table */}
        <div className="border border-white/10 rounded-3xl overflow-hidden bg-white/[0.02]">
          <div className="px-6 py-4 border-b border-white/10 bg-white/[0.02]">
            <h2 className="font-bold text-lg text-white">مقارنة تفصيلية</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-right px-6 py-3 font-medium text-white/40 w-1/4">الميزة</th>
                {PLANS.map((p) => (
                  <th key={p} className="px-6 py-3 font-semibold text-center text-white">
                    {PLAN_PRICING[p].nameAr}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {FEATURE_ROWS.map((row) => (
                <tr key={row.key} className="hover:bg-white/[0.02]">
                  <td className="px-6 py-3 text-white/50">{row.label}</td>
                  {PLANS.map((plan) => {
                    const val = row.isLimit
                      ? formatLimit((PLAN_LIMITS[plan] as any)[row.key])
                      : (PLAN_FEATURES[plan] as any)[row.key]
                    return (
                      <td key={plan} className="px-6 py-3 text-center font-medium text-white">
                        {typeof val === 'boolean' ? (
                          val ? (
                            <Check className="w-4 h-4 text-success mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-white/20 mx-auto" />
                          )
                        ) : (
                          <span className={val === 'غير محدود' ? 'text-primary font-bold' : ''}>{val}</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* CTA */}
        <div className="text-center py-8 space-y-4">
          <p className="text-white/40">هل لديك أسئلة؟ تواصل معنا</p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-2xl font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            <Zap className="w-4 h-4" />
            ابدأ تجربتك المجانية الآن
          </Link>
        </div>
      </div>
    </div>
  )
}
