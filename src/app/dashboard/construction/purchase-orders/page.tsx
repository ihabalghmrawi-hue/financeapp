import { createAdminClient } from '@/lib/supabase/admin'
import { getCompanyId } from '@/lib/tenant'
import { PurchaseOrdersClient } from './purchase-orders-client'

export const dynamic = 'force-dynamic'

export default async function PurchaseOrdersPage() {
  const admin = createAdminClient()
  const COMPANY = await getCompanyId()

  const [{ data: orders }, { data: projects }] = await Promise.all([
    admin
      .from('con_purchase_orders')
      .select('*, con_projects(name), con_purchase_order_items(*)')
      .eq('company_id', COMPANY)
      .order('order_date', { ascending: false }),
    admin.from('con_projects').select('id, name').eq('company_id', COMPANY).neq('status', 'cancelled').order('name'),
  ])

  return <PurchaseOrdersClient orders={orders || []} projects={projects || []} />
}
