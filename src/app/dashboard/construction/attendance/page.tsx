import { createAdminClient } from '@/lib/supabase/admin'
import { getCompanyId } from '@/lib/tenant'
import { AttendanceClient } from './attendance-client'

export const dynamic = 'force-dynamic'

export default async function AttendancePage() {
  const admin = createAdminClient()
  const COMPANY = await getCompanyId()

  const [{ data: logs }, { data: workers }, { data: projects }] = await Promise.all([
    admin
      .from('con_worker_logs')
      .select('*, con_workers(name, daily_rate, job_type), con_projects(name)')
      .eq('company_id', COMPANY)
      .order('log_date', { ascending: false })
      .limit(500),
    admin.from('con_workers').select('*').eq('company_id', COMPANY).neq('status', 'inactive').order('name'),
    admin.from('con_projects').select('id, name').eq('company_id', COMPANY).neq('status', 'cancelled').order('name'),
  ])

  return <AttendanceClient logs={logs || []} workers={workers || []} projects={projects || []} />
}
