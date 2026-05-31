import type { SupabaseClient } from '@supabase/supabase-js'
import { BaseRepository, RepositoryError } from './base.repository'
import type { DressResponse, RentalOrderResponse } from '@/validators/rental'

export interface DressWithRelations extends DressResponse {
  pricing_rules?: Array<{
    id: string
    name: string
    price: number
    days: number
  }>
  rental_orders?: Array<{
    id: string
    status: string
    start_date: string
    end_date: string
    customer_name: string
  }>
}

export class RentalDressRepository extends BaseRepository<DressResponse> {
  protected readonly table = 'dresses'
  protected hasSoftDelete = true

  constructor(db: SupabaseClient, companyId: string) {
    super(db, companyId)
  }

  async findByIdWithRelations(id: string): Promise<DressWithRelations | null> {
    const { data, error } = await this.db
      .from(this.table)
      .select('*, pricing_rules(*)')
      .eq('company_id', this.companyId)
      .eq('id', id)
      .single()
    if (error?.code === 'PGRST116') {
      return null
    }
    if (error) {
      throw new RepositoryError(error.message, error.code)
    }
    return data as unknown as DressWithRelations
  }

  async listAvailable(from: string, to: string): Promise<DressResponse[]> {
    const { data, error } = await this.db
      .from(this.table)
      .select('*')
      .eq('company_id', this.companyId)
      .eq('is_active', true)
      .eq('is_deleted', false)
      .not(
        'id',
        'in',
        this.db
          .from('rental_orders')
          .select('dress_id')
          .eq('company_id', this.companyId)
          .in('status', ['active', 'confirmed'])
          .lte('start_date', to)
          .gte('end_date', from)
          .then((r) => r.data?.map((d) => d.dress_id) ?? []),
      )
      .order('name', { ascending: true })
    if (error) {
      throw new RepositoryError(error.message, error.code)
    }
    return (data ?? []) as DressResponse[]
  }
}

export class RentalOrderRepository extends BaseRepository<RentalOrderResponse> {
  protected readonly table = 'rental_orders'
  protected hasSoftDelete = false

  constructor(db: SupabaseClient, companyId: string) {
    super(db, companyId)
  }

  async findByIdWithRelations(id: string): Promise<(RentalOrderResponse & { dresses?: DressResponse }) | null> {
    const { data, error } = await this.db
      .from(this.table)
      .select('*, dresses(*)')
      .eq('company_id', this.companyId)
      .eq('id', id)
      .single()
    if (error?.code === 'PGRST116') {
      return null
    }
    if (error) {
      throw new RepositoryError(error.message, error.code)
    }
    return data as unknown as RentalOrderResponse & { dresses?: DressResponse }
  }

  async listPaged(opts: {
    limit: number
    offset: number
    status?: string
  }): Promise<{ data: RentalOrderResponse[]; count: number }> {
    let q = this.db
      .from(this.table)
      .select('*, dresses(id, name, name_ar, image_url)', { count: 'exact' })
      .eq('company_id', this.companyId)
      .order('created_at', { ascending: false })
      .range(opts.offset, opts.offset + opts.limit - 1)

    if (opts.status) {
      q = q.eq('status', opts.status) as typeof q
    }

    const { data, error, count } = await q
    if (error) {
      throw new RepositoryError(error.message, error.code)
    }
    return { data: (data ?? []) as RentalOrderResponse[], count: count ?? 0 }
  }

  async getActiveCount(): Promise<number> {
    const { count, error } = await this.db
      .from(this.table)
      .select('id', { count: 'exact', head: true })
      .eq('company_id', this.companyId)
      .in('status', ['active', 'confirmed'])
    if (error) {
      throw new RepositoryError(error.message, error.code)
    }
    return count ?? 0
  }

  async getLateOrders(): Promise<RentalOrderResponse[]> {
    const { data, error } = await this.db
      .from(this.table)
      .select('*, dresses(id, name, name_ar)')
      .eq('company_id', this.companyId)
      .in('status', ['active', 'confirmed'])
      .lt('end_date', new Date().toISOString().slice(0, 10))
      .order('end_date', { ascending: true })
    if (error) {
      throw new RepositoryError(error.message, error.code)
    }
    return (data ?? []) as RentalOrderResponse[]
  }

  async getTodayBookings(): Promise<RentalOrderResponse[]> {
    const today = new Date().toISOString().slice(0, 10)
    const { data, error } = await this.db
      .from(this.table)
      .select('*, dresses(id, name, name_ar, image_url)')
      .eq('company_id', this.companyId)
      .eq('start_date', today)
      .order('created_at', { ascending: false })
    if (error) {
      throw new RepositoryError(error.message, error.code)
    }
    return (data ?? []) as RentalOrderResponse[]
  }
}
