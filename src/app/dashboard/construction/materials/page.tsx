import { createAdminClient } from '@/lib/supabase/admin'
import { getCompanyId, getCurrency } from '@/lib/tenant'
import { MaterialsClient } from './materials-client'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 25

export default async function MaterialsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const admin = createAdminClient()
  const COMPANY = await getCompanyId()
  const CURRENCY = await getCurrency()
  const sp = await searchParams
  const page = Math.max(1, Number(sp.page) || 1)

  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const [{ data: materials, count }, { data: projects }] = await Promise.all([
    admin
      .from('con_materials')
      .select('*, con_projects(name)', { count: 'exact' })
      .eq('company_id', COMPANY)
      .order('purchase_date', { ascending: false })
      .range(from, to),
    admin.from('con_projects').select('id, name').eq('company_id', COMPANY).neq('status', 'cancelled').order('name'),
  ])

  return (
    <MaterialsClient
      materials={materials || []}
      projects={projects || []}
      currency={CURRENCY}
      page={page}
      totalPages={Math.ceil((count || 0) / PAGE_SIZE)}
      totalCount={count || 0}
      pageSize={PAGE_SIZE}
    />
  )
}
