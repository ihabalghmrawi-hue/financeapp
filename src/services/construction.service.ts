import type { SupabaseClient } from '@supabase/supabase-js'
import type { ServiceResult } from '@/types/service'
import {
  ConstructionProjectRepository,
  ConstructionWorkerRepository,
  ConstructionTaskRepository,
} from '@/repositories/construction.repository'
import { logAudit } from '@/lib/audit'

export class ConstructionService {
  private readonly projectRepo: ConstructionProjectRepository
  private readonly workerRepo: ConstructionWorkerRepository
  private readonly taskRepo: ConstructionTaskRepository

  constructor(
    private readonly db: SupabaseClient,
    private readonly companyId: string,
  ) {
    this.projectRepo = new ConstructionProjectRepository(db, companyId)
    this.workerRepo = new ConstructionWorkerRepository(db, companyId)
    this.taskRepo = new ConstructionTaskRepository(db, companyId)
  }

  // ── Projects ─────────────────────────────────────────────────────────────────

  async createProject(input: Record<string, unknown>): Promise<ServiceResult<Record<string, unknown>>> {
    try {
      const { data, error } = await this.db
        .from('con_projects')
        .insert({ ...input, company_id: this.companyId })
        .select()
        .single()
      if (error) {
        throw error
      }
      return { ok: true, data }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'CREATE_FAILED' }
    }
  }

  async updateProject(id: string, input: Record<string, unknown>): Promise<ServiceResult<Record<string, unknown>>> {
    try {
      const { data, error } = await this.db
        .from('con_projects')
        .update(input)
        .eq('id', id)
        .eq('company_id', this.companyId)
        .select()
        .single()
      if (error) {
        throw error
      }
      return { ok: true, data }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'UPDATE_FAILED' }
    }
  }

  async getProject(id: string): Promise<ServiceResult<Record<string, unknown>>> {
    try {
      const { data, error } = await this.db
        .from('con_projects')
        .select('*, con_tasks(*), con_workers(*), con_materials(*), con_expenses(*)')
        .eq('id', id)
        .eq('company_id', this.companyId)
        .single()
      if (error?.code === 'PGRST116') {
        return { ok: false, error: 'المشروع غير موجود', code: 'NOT_FOUND' }
      }
      if (error) {
        throw error
      }
      return { ok: true, data }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'FETCH_FAILED' }
    }
  }

  async listProjects(): Promise<ServiceResult<Array<Record<string, unknown>>>> {
    try {
      const { data, error } = await this.db
        .from('con_projects')
        .select('*, con_tasks(id, status), con_workers(id, status)')
        .eq('company_id', this.companyId)
        .order('created_at', { ascending: false })
      if (error) {
        throw error
      }
      return { ok: true, data: data ?? [] }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'FETCH_FAILED' }
    }
  }

  async deleteProject(id: string): Promise<ServiceResult<void>> {
    try {
      const { error } = await this.db.from('con_projects').delete().eq('id', id).eq('company_id', this.companyId)
      if (error) {
        throw error
      }
      return { ok: true, data: undefined }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'DELETE_FAILED' }
    }
  }

  async getDashboardStats(): Promise<ServiceResult<Record<string, unknown>>> {
    try {
      const stats = await this.projectRepo.getDashboardStats()
      return { ok: true, data: stats as unknown as Record<string, unknown> }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'FETCH_FAILED' }
    }
  }

  // ── Workers ──────────────────────────────────────────────────────────────────

  async createWorker(input: Record<string, unknown>): Promise<ServiceResult<Record<string, unknown>>> {
    try {
      const { data, error } = await this.db
        .from('con_workers')
        .insert({ ...input, company_id: this.companyId })
        .select()
        .single()
      if (error) {
        throw error
      }
      return { ok: true, data }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'CREATE_FAILED' }
    }
  }

  async listWorkers(): Promise<ServiceResult<Array<Record<string, unknown>>>> {
    try {
      const data = await this.workerRepo.findMany()
      return { ok: true, data: data as unknown as Record<string, unknown>[] }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'FETCH_FAILED' }
    }
  }

  async updateWorker(id: string, input: Record<string, unknown>): Promise<ServiceResult<Record<string, unknown>>> {
    try {
      const data = await this.workerRepo.update(id, input)
      return { ok: true, data: data as unknown as Record<string, unknown> }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'UPDATE_FAILED' }
    }
  }

  // ── Tasks ────────────────────────────────────────────────────────────────────

  async createTask(input: Record<string, unknown>): Promise<ServiceResult<Record<string, unknown>>> {
    try {
      const { data, error } = await this.db
        .from('con_tasks')
        .insert({ ...input, company_id: this.companyId })
        .select()
        .single()
      if (error) {
        throw error
      }
      return { ok: true, data }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'CREATE_FAILED' }
    }
  }

  async listTasks(projectId?: string): Promise<ServiceResult<Array<Record<string, unknown>>>> {
    try {
      const data = projectId ? await this.taskRepo.findByProject(projectId) : await this.taskRepo.findMany()
      return { ok: true, data: data as unknown as Record<string, unknown>[] }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'FETCH_FAILED' }
    }
  }

  async updateTask(id: string, input: Record<string, unknown>): Promise<ServiceResult<Record<string, unknown>>> {
    try {
      const data = await this.taskRepo.update(id, input)
      return { ok: true, data: data as unknown as Record<string, unknown> }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'UPDATE_FAILED' }
    }
  }

  // ── Expenses ─────────────────────────────────────────────────────────────────

  async createExpense(input: Record<string, unknown>): Promise<ServiceResult<Record<string, unknown>>> {
    try {
      const { data, error } = await this.db
        .from('con_expenses')
        .insert({ ...input, company_id: this.companyId })
        .select()
        .single()
      if (error) {
        throw error
      }
      return { ok: true, data }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'CREATE_FAILED' }
    }
  }

  async listExpenses(projectId?: string): Promise<ServiceResult<Array<Record<string, unknown>>>> {
    try {
      let q = this.db
        .from('con_expenses')
        .select('*')
        .eq('company_id', this.companyId)
        .order('created_at', { ascending: false })
      if (projectId) {
        q = q.eq('project_id', projectId)
      }
      const { data, error } = await q
      if (error) {
        throw error
      }
      return { ok: true, data: data ?? [] }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'FETCH_FAILED' }
    }
  }

  // ── Materials ────────────────────────────────────────────────────────────────

  async createMaterial(input: Record<string, unknown>): Promise<ServiceResult<Record<string, unknown>>> {
    try {
      const { data, error } = await this.db
        .from('con_materials')
        .insert({ ...input, company_id: this.companyId })
        .select()
        .single()
      if (error) {
        throw error
      }
      return { ok: true, data }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'CREATE_FAILED' }
    }
  }

  async listMaterials(projectId?: string): Promise<ServiceResult<Array<Record<string, unknown>>>> {
    try {
      let q = this.db
        .from('con_materials')
        .select('*, con_projects(name)')
        .eq('company_id', this.companyId)
        .order('created_at', { ascending: false })
      if (projectId) {
        q = q.eq('project_id', projectId)
      }
      const { data, error } = await q
      if (error) {
        throw error
      }
      return { ok: true, data: data ?? [] }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'FETCH_FAILED' }
    }
  }

  // ── Payments ─────────────────────────────────────────────────────────────────

  async createPayment(input: Record<string, unknown>): Promise<ServiceResult<Record<string, unknown>>> {
    try {
      const { data, error } = await this.db
        .from('con_payments')
        .insert({ ...input, company_id: this.companyId })
        .select()
        .single()
      if (error) {
        throw error
      }
      return { ok: true, data }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'CREATE_FAILED' }
    }
  }

  async listPayments(projectId?: string): Promise<ServiceResult<Array<Record<string, unknown>>>> {
    try {
      let q = this.db
        .from('con_payments')
        .select('*, con_projects(name)')
        .eq('company_id', this.companyId)
        .order('created_at', { ascending: false })
      if (projectId) {
        q = q.eq('project_id', projectId)
      }
      const { data, error } = await q
      if (error) {
        throw error
      }
      return { ok: true, data: data ?? [] }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'FETCH_FAILED' }
    }
  }
}
