import { createAdminClient } from '@/lib/supabase/admin'
import { getCompanyId } from '@/lib/tenant'
import { GanttChart } from '@/components/construction/gantt-chart'
import type { ConstructionTask } from '@/types/construction'

export const revalidate = 120

export default async function GanttPage() {
  const admin = createAdminClient()
  const COMPANY = await getCompanyId()

  const { data: tasks } = await admin
    .from('con_tasks')
    .select('*, con_projects(name)')
    .eq('company_id', COMPANY)
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold">المخطط الزمني للمشاريع</h1>
        <p className="text-sm text-muted-foreground mt-0.5">عرض المهام على خط زمني (Gantt Chart)</p>
      </div>
      <GanttChart tasks={(tasks || []) as ConstructionTask[]} />
    </div>
  )
}
