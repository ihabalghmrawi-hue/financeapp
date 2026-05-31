import type { SupabaseClient } from '@supabase/supabase-js'
import type { ServiceResult } from '@/types/service'
import type {
  CreateDressInput,
  UpdateDressInput,
  CreateRentalOrderInput,
  ReturnDressInput,
  CreatePricingRuleInput,
} from '@/validators/rental'
import {
  CreateDressSchema,
  UpdateDressSchema,
  CreateRentalOrderSchema,
  ReturnDressSchema,
  CreatePricingRuleSchema,
} from '@/validators/rental'
import { RentalDressRepository, RentalOrderRepository } from '@/repositories/rental.repository'
import { logAudit } from '@/lib/audit'

export class RentalService {
  private readonly dressRepo: RentalDressRepository
  private readonly orderRepo: RentalOrderRepository

  constructor(
    private readonly db: SupabaseClient,
    private readonly companyId: string,
  ) {
    this.dressRepo = new RentalDressRepository(db, companyId)
    this.orderRepo = new RentalOrderRepository(db, companyId)
  }

  // ── Dresses ──────────────────────────────────────────────────────────────────

  async createDress(input: CreateDressInput): Promise<ServiceResult<Record<string, unknown>>> {
    const parsed = CreateDressSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.errors.map((e) => e.message).join('; '), code: 'VALIDATION_ERROR' }
    }
    try {
      const { data, error } = await this.db
        .from('dresses')
        .insert({
          company_id: this.companyId,
          ...parsed.data,
          is_active: true,
          status: 'available',
        })
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

  async updateDress(id: string, input: UpdateDressInput): Promise<ServiceResult<Record<string, unknown>>> {
    const parsed = UpdateDressSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.errors.map((e) => e.message).join('; '), code: 'VALIDATION_ERROR' }
    }
    try {
      const { data, error } = await this.db
        .from('dresses')
        .update(parsed.data)
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

  async getDress(id: string): Promise<ServiceResult<Record<string, unknown>>> {
    try {
      const dress = await this.dressRepo.findByIdWithRelations(id)
      if (!dress) {
        return { ok: false, error: 'الفستان غير موجود', code: 'NOT_FOUND' }
      }
      return { ok: true, data: dress as unknown as Record<string, unknown> }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'FETCH_FAILED' }
    }
  }

  async listDresses(): Promise<ServiceResult<Array<Record<string, unknown>>>> {
    try {
      const data = await this.dressRepo.findMany()
      return { ok: true, data: data as unknown as Record<string, unknown>[] }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'FETCH_FAILED' }
    }
  }

  async deleteDress(id: string): Promise<ServiceResult<void>> {
    try {
      const existing = await this.dressRepo.findById(id)
      if (!existing) {
        return { ok: false, error: 'الفستان غير موجود', code: 'NOT_FOUND' }
      }
      await this.dressRepo.softDeleteById(id)
      return { ok: true, data: undefined }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'DELETE_FAILED' }
    }
  }

  async getAvailableDresses(from: string, to: string): Promise<ServiceResult<Array<Record<string, unknown>>>> {
    try {
      const dresses = await this.dressRepo.listAvailable(from, to)
      return { ok: true, data: dresses as unknown as Record<string, unknown>[] }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'FETCH_FAILED' }
    }
  }

  // ── Orders ───────────────────────────────────────────────────────────────────

  async createOrder(input: CreateRentalOrderInput): Promise<ServiceResult<Record<string, unknown>>> {
    const parsed = CreateRentalOrderSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.errors.map((e) => e.message).join('; '), code: 'VALIDATION_ERROR' }
    }
    try {
      const { data, error } = await this.db
        .from('rental_orders')
        .insert({
          company_id: this.companyId,
          ...parsed.data,
          status: 'confirmed',
        })
        .select()
        .single()
      if (error) {
        throw error
      }
      await logAudit({ action: 'rental.booked', entityType: 'rental_order', entityId: data.id })
      return { ok: true, data }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'CREATE_FAILED' }
    }
  }

  async getOrder(id: string): Promise<ServiceResult<Record<string, unknown>>> {
    try {
      const order = await this.orderRepo.findByIdWithRelations(id)
      if (!order) {
        return { ok: false, error: 'الحجز غير موجود', code: 'NOT_FOUND' }
      }
      return { ok: true, data: order as unknown as Record<string, unknown> }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'FETCH_FAILED' }
    }
  }

  async listOrders(
    opts: { limit?: number; offset?: number; status?: string } = {},
  ): Promise<ServiceResult<{ data: Array<Record<string, unknown>>; count: number }>> {
    try {
      const result = await this.orderRepo.listPaged({
        limit: opts.limit ?? 50,
        offset: opts.offset ?? 0,
        status: opts.status,
      })
      return { ok: true, data: result as unknown as { data: Array<Record<string, unknown>>; count: number } }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'FETCH_FAILED' }
    }
  }

  async returnDress(input: ReturnDressInput): Promise<ServiceResult<Record<string, unknown>>> {
    const parsed = ReturnDressSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.errors.map((e) => e.message).join('; '), code: 'VALIDATION_ERROR' }
    }
    try {
      const order = await this.orderRepo.findById(parsed.data.order_id)
      if (!order) {
        return { ok: false, error: 'الحجز غير موجود', code: 'NOT_FOUND' }
      }

      const { data, error } = await this.db
        .from('rental_orders')
        .update({ status: 'returned' })
        .eq('id', parsed.data.order_id)
        .eq('company_id', this.companyId)
        .select()
        .single()
      if (error) {
        throw error
      }

      await this.db.from('rental_returns').insert({
        company_id: this.companyId,
        order_id: parsed.data.order_id,
        condition: parsed.data.condition,
        notes: parsed.data.notes ?? null,
        returned_at: new Date().toISOString(),
      })

      await logAudit({ action: 'rental.returned', entityType: 'rental_order', entityId: parsed.data.order_id })
      return { ok: true, data }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'RETURN_FAILED' }
    }
  }

  async getActiveOrdersCount(): Promise<ServiceResult<number>> {
    try {
      const count = await this.orderRepo.getActiveCount()
      return { ok: true, data: count }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'FETCH_FAILED' }
    }
  }

  async getLateOrders(): Promise<ServiceResult<Array<Record<string, unknown>>>> {
    try {
      const orders = await this.orderRepo.getLateOrders()
      return { ok: true, data: orders as unknown as Record<string, unknown>[] }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'FETCH_FAILED' }
    }
  }

  async getTodayBookings(): Promise<ServiceResult<Array<Record<string, unknown>>>> {
    try {
      const bookings = await this.orderRepo.getTodayBookings()
      return { ok: true, data: bookings as unknown as Record<string, unknown>[] }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'FETCH_FAILED' }
    }
  }

  // ── Pricing ──────────────────────────────────────────────────────────────────

  async createPricingRule(input: CreatePricingRuleInput): Promise<ServiceResult<Record<string, unknown>>> {
    const parsed = CreatePricingRuleSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.errors.map((e) => e.message).join('; '), code: 'VALIDATION_ERROR' }
    }
    try {
      const { data, error } = await this.db
        .from('pricing_rules')
        .insert({
          company_id: this.companyId,
          ...parsed.data,
          is_active: true,
        })
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
}
