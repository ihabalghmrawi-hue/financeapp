import type { SupabaseClient } from '@supabase/supabase-js'
import type { ServiceResult } from '@/types/service'
import type { CreateExpenseInput, UpdateExpenseInput, ExpenseResponse, ExpenseCategory } from '@/validators/expense'
import { CreateExpenseSchema, UpdateExpenseSchema } from '@/validators/expense'
import { ExpenseRepository } from '@/repositories/expense.repository'
import { logAudit } from '@/lib/audit'
import { createNotification } from '@/lib/notifications'

export class ExpenseService {
  private readonly repo: ExpenseRepository

  constructor(
    private readonly db: SupabaseClient,
    private readonly companyId: string,
  ) {
    this.repo = new ExpenseRepository(db, companyId)
  }

  async create(input: CreateExpenseInput): Promise<ServiceResult<ExpenseResponse>> {
    const parsed = CreateExpenseSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.errors.map((e) => e.message).join('; '), code: 'VALIDATION_ERROR' }
    }
    try {
      const expense = await this.repo.create({
        ...parsed.data,
        category_id: parsed.data.category_id ?? null,
        wallet_id: parsed.data.wallet_id ?? null,
        reference: parsed.data.reference ?? null,
        notes: parsed.data.notes ?? null,
      })
      await logAudit({ action: 'expense.created', entityType: 'expense', entityId: expense.id })
      await createNotification(this.db, {
        companyId: this.companyId,
        type: 'expense_recorded',
        title: expense.description,
        body: `المبلغ: ${expense.amount}`,
        severity: 'info',
        link: `/dashboard/expenses`,
      })
      return { ok: true, data: expense }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'CREATE_FAILED' }
    }
  }

  async update(id: string, input: UpdateExpenseInput): Promise<ServiceResult<ExpenseResponse>> {
    const parsed = UpdateExpenseSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.errors.map((e) => e.message).join('; '), code: 'VALIDATION_ERROR' }
    }
    try {
      const existing = await this.repo.findById(id)
      if (!existing) {
        return { ok: false, error: 'المصروف غير موجود', code: 'NOT_FOUND' }
      }
      const expense = await this.repo.update(id, parsed.data)
      await logAudit({ action: 'expense.updated', entityType: 'expense', entityId: id })
      return { ok: true, data: expense }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'UPDATE_FAILED' }
    }
  }

  async getById(id: string): Promise<ServiceResult<ExpenseResponse>> {
    try {
      const expense = await this.repo.findByIdWithCategory(id)
      if (!expense) {
        return { ok: false, error: 'المصروف غير موجود', code: 'NOT_FOUND' }
      }
      return { ok: true, data: expense }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'FETCH_FAILED' }
    }
  }

  async list(
    opts: { limit?: number; offset?: number; from?: string; to?: string; category_id?: string } = {},
  ): Promise<ServiceResult<{ data: ExpenseResponse[]; count: number }>> {
    try {
      const result = await this.repo.listPaged({
        limit: opts.limit ?? 50,
        offset: opts.offset ?? 0,
        from: opts.from,
        to: opts.to,
        category_id: opts.category_id,
      })
      return { ok: true, data: result }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'FETCH_FAILED' }
    }
  }

  async delete(id: string): Promise<ServiceResult<void>> {
    try {
      const existing = await this.repo.findById(id)
      if (!existing) {
        return { ok: false, error: 'المصروف غير موجود', code: 'NOT_FOUND' }
      }
      await this.repo.hardDeleteById(id)
      await logAudit({ action: 'expense.deleted', entityType: 'expense', entityId: id, severity: 'warning' })
      return { ok: true, data: undefined }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'DELETE_FAILED' }
    }
  }

  async getCategories(): Promise<ServiceResult<ExpenseCategory[]>> {
    try {
      const categories = await this.repo.listCategories()
      return { ok: true, data: categories }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'FETCH_FAILED' }
    }
  }

  async getTotalForPeriod(from: string, to: string): Promise<ServiceResult<number>> {
    try {
      const total = await this.repo.getTotalForPeriod(from, to)
      return { ok: true, data: total }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'FETCH_FAILED' }
    }
  }
}
