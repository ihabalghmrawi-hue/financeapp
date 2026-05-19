import { createAdminClient } from '@/lib/supabase/admin'
import { getCompanyId } from '@/lib/tenant'
import { DailyLogsClient } from './daily-logs-client'

export const dynamic = 'force-dynamic'

export default async function DailyLogsPage() {
  const admin = createAdminClient()
  const COMPANY = await getCompanyId()

  const [{ data: logs }, { data: projects }] = await Promise.all([
    admin
      .from('con_daily_logs')
      .select('*, con_projects(name)')
      .eq('company_id', COMPANY)
      .order('log_date', { ascending: false }),
    admin.from('con_projects').select('id, name').eq('company_id', COMPANY).neq('status', 'cancelled').order('name'),
  ])

  return <DailyLogsClient logs={logs || []} projects={projects || []} />
}
