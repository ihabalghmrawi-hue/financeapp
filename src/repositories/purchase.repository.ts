import type { SupabaseClient } from '@supabase/supabase-js'
import { BaseRepository, RepositoryError } from './base.repository'
import type { PurchaseResponse } from '@/validators/purchase'

export interface PurchaseWithItems extends PurchaseResponse {
  purchase_items?: Array<{
    id: string
    product_id: string
    quantity: number
    unit_cost: number
    total: number
    products?: { id: string; name: string; name_ar: string | null }
  }>
  suppliers?: { id: string; name: string; name_ar: string | null; phone: string | null }
}

export class PurchaseRepository extends BaseRepository<PurchaseResponse> {
  protected readonly table = 'purchases'
  protected hasSoftDelete = false

  constructor(db: SupabaseClient, companyId: string) {
    super(db, companyId)
  }

  async findByIdWithRelations(id: string): Promise<PurchaseWithItems | null> {
    const { data, error } = await this.db
      .from(this.table)
      .select('*, suppliers(id, name, name_ar, phone), purchase_items(*, products(id, name, name_ar))')
      .eq('company_id', this.companyId)
      .eq('id', id)
      .single()
    if (error?.code === 'PGRST116') {
      return null
    }
    if (error) {
      throw new RepositoryError(error.message, error.code)
    }
    return data as unknown as PurchaseWithItems
  }

  async listPaged(opts: {
    limit: number
    offset: number
    status?: string
    from?: string
    to?: string
  }): Promise<{ data: PurchaseWithItems[]; count: number }> {
    let q = this.db
      .from(this.table)
      .select('*, suppliers(id, name, name_ar, phone), purchase_items(*)', { count: 'exact' })
      .eq('company_id', this.companyId)
      .order('purchase_date', { ascending: false })
      .range(opts.offset, opts.offset + opts.limit - 1)

    if (opts.status) {
      q = q.eq('status', opts.status) as typeof q
    }
    if (opts.from) {
      q = q.gte('purchase_date', opts.from) as typeof q
    }
    if (opts.to) {
      q = q.lte('purchase_date', opts.to) as typeof q
    }

    const { data, error, count } = await q
    if (error) {
      throw new RepositoryError(error.message, error.code)
    }
    return { data: (data ?? []) as PurchaseWithItems[], count: count ?? 0 }
  }

  async getTotalForPeriod(from: string, to: string): Promise<number> {
    const { data, error } = await this.db
      .from(this.table)
      .select('total')
      .eq('company_id', this.companyId)
      .gte('purchase_date', from)
      .lte('purchase_date', to)
    if (error) {
      throw new RepositoryError(error.message, error.code)
    }
    return (data ?? []).reduce((s, r) => s + (r as { total: number }).total, 0)
  }
}
