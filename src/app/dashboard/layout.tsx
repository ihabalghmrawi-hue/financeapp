import { headers } from 'next/headers'
import { cookies } from 'next/headers'
import { getFeatures } from '@/lib/features'
import { getBranding } from '@/lib/branding'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { TopBar } from '@/components/layout/topbar'
import { QuickActionBar } from '@/components/layout/quick-action-bar'
import { DashboardMobileLayout } from '@/components/layout/dashboard-mobile-layout'
import { MobileTopBar } from '@/components/layout/mobile-topbar'
import { PageTransitionWrapper } from '@/components/layout/page-transition-wrapper'
import { CommandBar } from '@/components/command-center'
import { PageErrorBoundary } from '@/components/layout/page-error-boundary'
import type { Lang } from '@/lib/i18n'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const h = await headers()
  const cookieStore = await cookies()

  const dec = (v: string | null, fallback = '') => {
    try {
      return decodeURIComponent(v || fallback)
    } catch {
      return v || fallback
    }
  }

  const staffId = dec(h.get('x-staff-id'), '')
  const staffName = dec(h.get('x-staff-name'), 'المدير')
  const staffRole = dec(h.get('x-staff-role'), 'admin')
  const staffPermissions = dec(h.get('x-staff-permissions'), '').split(',').filter(Boolean)
  const businessType = dec(h.get('x-business-type'), 'retail')
  const tenantId = dec(h.get('x-tenant-id'), process.env.NEXT_PUBLIC_COMPANY_ID || 'default')
  const companyNameHdr = dec(h.get('x-company-name'), '')
  const companyCurrHdr = dec(h.get('x-company-currency'), 'SAR')

  const staff = { name: staffName, role: staffRole, permissions: staffPermissions }
  const features = getFeatures(businessType)

  let companyRow: any = null
  let branding: any = null

  try {
    const supabase = createClient()
    const { data } = await supabase
      .from('companies')
      .select('id, name, currency, language')
      .eq('id', tenantId)
      .maybeSingle()
    companyRow = data
  } catch {
    /* fallback */
  }

  try {
    branding = await getBranding()
  } catch {
    /* fallback */
  }

  const companyLang = (companyRow?.language as Lang) || 'ar'
  let lang = companyLang
  const cookieLang = cookieStore.get('lang')?.value as Lang | undefined
  if (cookieLang && (cookieLang === 'ar' || cookieLang === 'en')) {
    lang = cookieLang
  }

  const company = {
    id: companyRow?.id || tenantId,
    name: companyRow?.name || companyNameHdr || process.env.NEXT_PUBLIC_COMPANY_NAME || 'شركتي',
    name_ar: companyRow?.name || companyNameHdr || process.env.NEXT_PUBLIC_COMPANY_NAME || 'شركتي',
    slug: 'default',
    currency: companyRow?.currency || companyCurrHdr || process.env.NEXT_PUBLIC_CURRENCY || 'SAR',
    language: lang,
    timezone: 'Asia/Riyadh',
    fiscal_year_start: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    logo_url: null,
    address: null,
    phone: null,
    email: null,
    tax_number: null,
    settings: null,
  }

  const companyDisplayName =
    lang === 'ar' ? branding?.name_ar || company.name : company.name || branding?.name_ar || 'شركتي'

  return (
    <DashboardMobileLayout
      companyId={company.id}
      userId={staffId}
      features={features}
      staff={staff}
      companyName={companyDisplayName}
      branding={branding}
    >
      <div className="flex h-screen overflow-hidden bg-background">
        <div className="hidden lg:block">
          <Sidebar company={company as any} user={null} staff={staff} features={features} branding={branding} />
        </div>
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Desktop topbar (md+) */}
          <div className="hidden md:block">
            <TopBar company={company} user={null} staff={staff} features={features} />
            <QuickActionBar features={features} />
          </div>
          {/* Mobile topbar (< md) */}
          <div className="md:hidden">
            <MobileTopBar />
          </div>
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6">
            <PageTransitionWrapper>
              <PageErrorBoundary>{children}</PageErrorBoundary>
            </PageTransitionWrapper>
          </main>
        </div>
      </div>
      <CommandBar />
    </DashboardMobileLayout>
  )
}
