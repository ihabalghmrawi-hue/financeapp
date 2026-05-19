import { createAdminClient } from '@/lib/supabase/admin'
import { getCompanyId } from '@/lib/tenant'
import { ChangeOrdersClient } from './change-orders-client'

export const dynamic = 'force-dynamic'

export default async function ChangeOrdersPage() {
  const admin = createAdminClient()
  const COMPANY = await getCompanyId()

  const [{ data: orders }, { data: projects }] = await Promise.all([
    admin
      .from('con_change_orders')
      .select('*, con_projects(name)')
      .eq('company_id', COMPANY)
      .order('created_at', { ascending: false }),
    admin.from('con_projects').select('id, name').eq('company_id', COMPANY).neq('status', 'cancelled').order('name'),
  ])

  return <ChangeOrdersClient orders={orders || []} projects={projects || []} />
}
