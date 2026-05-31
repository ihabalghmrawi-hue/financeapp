import type { SupabaseClient } from '@supabase/supabase-js'
import { BaseRepository, RepositoryError } from './base.repository'
import type { ExpenseResponse, ExpenseCategory } from '@/validators/expense'

export class ExpenseRepository extends BaseRepository<ExpenseResponse> {
  protected readonly table = 'expenses'
  protected hasSoftDelete = false

  constructor(db: SupabaseClient, companyId: string) {
    super(db, companyId)
  }

  async findByIdWithCategory(id: string): Promise<(ExpenseResponse & { categories?: ExpenseCategory }) | null> {
    const { data, error } = await this.db
      .from(this.table)
      .select('*, categories(*)')
      .eq('company_id', this.companyId)
      .eq('id', id)
      .single()
    if (error?.code === 'PGRST116') {
      return null
    }
    if (error) {
      throw new RepositoryError(error.message, error.code)
    }
    return data as unknown as ExpenseResponse & { categories?: ExpenseCategory }
  }

  async listPaged(opts: {
    limit: number
    offset: number
    from?: string
    to?: string
    category_id?: string
  }): Promise<{ data: ExpenseResponse[]; count: number }> {
    let q = this.db
      .from(this.table)
      .select('*, categories(id, name, name_ar, color, icon)', { count: 'exact' })
      .eq('company_id', this.companyId)
      .order('expense_date', { ascending: false })
      .range(opts.offset, opts.offset + opts.limit - 1)

    if (opts.from) {
      q = q.gte('expense_date', opts.from) as typeof q
    }
    if (opts.to) {
      q = q.lte('expense_date', opts.to) as typeof q
    }
    if (opts.category_id) {
      q = q.eq('category_id', opts.category_id) as typeof q
    }

    const { data, error, count } = await q
    if (error) {
      throw new RepositoryError(error.message, error.code)
    }
    return { data: (data ?? []) as ExpenseResponse[], count: count ?? 0 }
  }

  async getTotalForPeriod(from: string, to: string): Promise<number> {
    const { data, error } = await this.db
      .from(this.table)
      .select('amount')
      .eq('company_id', this.companyId)
      .gte('expense_date', from)
      .lte('expense_date', to)
    if (error) {
      throw new RepositoryError(error.message, error.code)
    }
    return (data ?? []).reduce((s, r) => s + (r as { amount: number }).amount, 0)
  }

  async listCategories(): Promise<ExpenseCategory[]> {
    const { data, error } = await this.db
      .from('expense_categories')
      .select('*')
      .eq('company_id', this.companyId)
      .order('name', { ascending: true })
    if (error) {
      throw new RepositoryError(error.message, error.code)
    }
    return (data ?? []) as ExpenseCategory[]
  }
}
