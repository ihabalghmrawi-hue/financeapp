import { createAdminClient } from '@/lib/supabase/admin'
import { getCompanyId } from '@/lib/tenant'
import { getDefaultClient, connectClient } from '@/lib/redis'
import { DistributedCache } from '@/lib/redis/cache'
import type {
  ConstructionProject,
  ConstructionWorker,
  ConstructionTask,
  ConstructionPayment,
  ConstructionExpense,
} from '@/types/construction'

export interface MaterialAsExpense {
  amount: number
  category: string
  project_id: string | null
}

export interface DashboardData {
  projects: ConstructionProject[]
  workers: ConstructionWorker[]
  tasks: ConstructionTask[]
  payments: ConstructionPayment[]
  expenses: (ConstructionExpense | MaterialAsExpense)[]
}

let cacheInstance: DistributedCache | null = null

async function getCache(): Promise<DistributedCache | null> {
  if (!process.env.REDIS_HOST) {
    return null
  }
  if (cacheInstance) {
    return cacheInstance
  }
  try {
    const client = getDefaultClient()
    await connectClient(client)
    cacheInstance = new DistributedCache(client, 'con:dash:')
    return cacheInstance
  } catch {
    return null
  }
}

export async function getDashboardData(companyId?: string): Promise<DashboardData> {
  const cid = companyId || (await getCompanyId())
  const cache = await getCache()
  if (cache) {
    return cache.getOrSet(cid, async () => fetchDashboardData(cid), { ttl: 60_000, tags: [`dashboard:${cid}`] })
  }
  return fetchDashboardData(cid)
}

async function fetchDashboardData(companyId: string): Promise<DashboardData> {
  const admin = createAdminClient()

  const [projects, workers, tasks, payments, expenses, materials] = await Promise.all([
    admin.from('con_projects').select('*').eq('company_id', companyId).order('created_at', { ascending: false }),
    admin.from('con_workers').select('*').eq('company_id', companyId),
    admin.from('con_tasks').select('*').eq('company_id', companyId).order('due_date', { ascending: true }).limit(20),
    admin
      .from('con_payments')
      .select('*')
      .eq('company_id', companyId)
      .order('payment_date', { ascending: false })
      .limit(50),
    admin
      .from('con_expenses')
      .select('*')
      .eq('company_id', companyId)
      .order('expense_date', { ascending: false })
      .limit(50),
    admin
      .from('con_materials')
      .select('*')
      .eq('company_id', companyId)
      .order('purchase_date', { ascending: false })
      .limit(50),
  ])

  const materialsAsExpenses: MaterialAsExpense[] = (materials.data || []).map((m) => ({
    amount: Number(m.quantity || 0) * Number(m.unit_price || 0),
    category: 'materials',
    expense_date: m.purchase_date,
    project_id: m.project_id,
  }))

  return {
    projects: (projects.data || []) as ConstructionProject[],
    workers: (workers.data || []) as ConstructionWorker[],
    tasks: (tasks.data || []) as ConstructionTask[],
    payments: (payments.data || []) as ConstructionPayment[],
    expenses: [...(expenses.data || []), ...materialsAsExpenses] as ConstructionExpense[],
  }
}

export async function invalidateDashboardCache(companyId: string): Promise<void> {
  const cache = await getCache()
  if (cache) {
    await cache.invalidateTag(`dashboard:${companyId}`)
  }
}
