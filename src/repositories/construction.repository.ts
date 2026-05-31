import type { SupabaseClient } from '@supabase/supabase-js'
import { BaseRepository, RepositoryError } from './base.repository'

export interface ConstructionProject {
  id: string
  company_id: string
  name: string
  status: string
  progress_pct: number
  client_name: string | null
  engineer_name: string | null
  contract_value: number
  actual_cost: number
  start_date: string
  end_date: string | null
  notes: string | null
  created_at: string
  [key: string]: unknown
}

export interface ConstructionWorker {
  id: string
  company_id: string
  name: string
  phone: string | null
  job_type: string
  wage: number
  status: string
  created_at: string
  [key: string]: unknown
}

export interface ConstructionTask {
  id: string
  company_id: string
  name: string | null
  title: string
  description: string | null
  status: string
  priority: string
  assigned_to: string | null
  start_date: string | null
  end_date: string | null
  created_at: string
  [key: string]: unknown
}

export class ConstructionProjectRepository extends BaseRepository<ConstructionProject> {
  protected readonly table = 'con_projects'
  protected hasSoftDelete = false

  constructor(db: SupabaseClient, companyId: string) {
    super(db, companyId)
  }

  async listWithStats(): Promise<
    Array<ConstructionProject & { tasks?: ConstructionTask[]; workers?: ConstructionWorker[] }>
  > {
    const { data, error } = await this.db
      .from(this.table)
      .select('*, con_tasks(*), con_workers(*)')
      .eq('company_id', this.companyId)
      .order('created_at', { ascending: false })
    if (error) {
      throw new RepositoryError(error.message, error.code)
    }
    return (data ?? []) as Array<ConstructionProject & { tasks?: ConstructionTask[]; workers?: ConstructionWorker[] }>
  }

  async getDashboardStats(): Promise<{
    totalProjects: number
    activeProjects: number
    completedProjects: number
    totalWorkers: number
    activeTasks: number
    totalRevenue: number
    totalCost: number
  }> {
    const [projects, workers, tasks] = await Promise.all([
      this.db.from(this.table).select('id, status, contract_value, actual_cost').eq('company_id', this.companyId),
      this.db.from('con_workers').select('id', { count: 'exact', head: true }).eq('company_id', this.companyId),
      this.db
        .from('con_tasks')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', this.companyId)
        .eq('status', 'in_progress'),
    ])

    if (projects.error) {
      throw new RepositoryError(projects.error.message, projects.error.code)
    }

    const projectList = (projects.data ?? []) as Array<{
      id: string
      status: string
      contract_value: number
      actual_cost: number
    }>
    return {
      totalProjects: projectList.length,
      activeProjects: projectList.filter((p) => p.status === 'in_progress').length,
      completedProjects: projectList.filter((p) => p.status === 'completed').length,
      totalWorkers: workers.count ?? 0,
      activeTasks: tasks.count ?? 0,
      totalRevenue: projectList.reduce((s, p) => s + p.contract_value, 0),
      totalCost: projectList.reduce((s, p) => s + p.actual_cost, 0),
    }
  }
}

export class ConstructionWorkerRepository extends BaseRepository<ConstructionWorker> {
  protected readonly table = 'con_workers'
  protected hasSoftDelete = false

  constructor(db: SupabaseClient, companyId: string) {
    super(db, companyId)
  }
}

export class ConstructionTaskRepository extends BaseRepository<ConstructionTask> {
  protected readonly table = 'con_tasks'
  protected hasSoftDelete = false

  constructor(db: SupabaseClient, companyId: string) {
    super(db, companyId)
  }

  async findByProject(projectId: string): Promise<ConstructionTask[]> {
    const { data, error } = await this.db
      .from(this.table)
      .select('*')
      .eq('company_id', this.companyId)
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })
    if (error) {
      throw new RepositoryError(error.message, error.code)
    }
    return (data ?? []) as ConstructionTask[]
  }
}
