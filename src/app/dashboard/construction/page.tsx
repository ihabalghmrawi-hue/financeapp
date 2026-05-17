import { createAdminClient } from '@/lib/supabase/admin'
import { getCompanyId, getCurrency } from '@/lib/tenant'
import { ConstructionDashboardClient } from './dashboard-client'

export const dynamic = 'force-dynamic'

export default async function ConstructionPage() {
  const admin = createAdminClient()
  const COMPANY = await getCompanyId()
  const CURRENCY = await getCurrency()

  const [projects, workers, tasks, payments, expenses, materials] = await Promise.all([
    admin.from('con_projects').select('*').eq('company_id', COMPANY).order('created_at', { ascending: false }),
    admin.from('con_workers').select('*').eq('company_id', COMPANY),
    admin.from('con_tasks').select('*').eq('company_id', COMPANY).order('due_date', { ascending: true }).limit(20),
    admin
      .from('con_payments')
      .select('*')
      .eq('company_id', COMPANY)
      .order('payment_date', { ascending: false })
      .limit(50),
    admin
      .from('con_expenses')
      .select('*')
      .eq('company_id', COMPANY)
      .order('expense_date', { ascending: false })
      .limit(50),
    admin
      .from('con_materials')
      .select('*')
      .eq('company_id', COMPANY)
      .order('purchase_date', { ascending: false })
      .limit(50),
  ])

  const materialsAsExpenses = (materials.data || []).map((m) => ({
    amount: Number(m.quantity || 0) * Number(m.unit_price || 0),
    category: 'materials',
    expense_date: m.purchase_date,
    project_id: m.project_id,
  }))

  return (
    <ConstructionDashboardClient
      projects={projects.data || []}
      workers={workers.data || []}
      tasks={tasks.data || []}
      payments={payments.data || []}
      expenses={[...(expenses.data || []), ...materialsAsExpenses]}
      currency={CURRENCY}
    />
  )
}
