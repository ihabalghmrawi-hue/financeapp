import type { SupabaseClient } from '@supabase/supabase-js'
import type { ServiceResult } from '@/types/service'
import type {
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerResponse,
  RecordPaymentInput,
} from '@/validators/customer'
import { CreateCustomerSchema, UpdateCustomerSchema, RecordPaymentSchema } from '@/validators/customer'
import { CustomerRepository } from '@/repositories/customer.repository'
import { logAudit } from '@/lib/audit'
import { createNotification } from '@/lib/notifications'

export class CustomerService {
  private readonly repo: CustomerRepository

  constructor(
    private readonly db: SupabaseClient,
    private readonly companyId: string,
  ) {
    this.repo = new CustomerRepository(db, companyId)
  }

  async create(input: CreateCustomerInput): Promise<ServiceResult<CustomerResponse>> {
    const parsed = CreateCustomerSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.errors.map((e) => e.message).join('; '), code: 'VALIDATION_ERROR' }
    }
    try {
      if (parsed.data.phone) {
        const existing = await this.repo.findByPhone(parsed.data.phone)
        if (existing) {
          return { ok: false, error: 'هذا الرقم موجود مسبقاً', code: 'CONFLICT' }
        }
      }
      const customer = await this.repo.create(parsed.data)
      await logAudit({ action: 'customer.created', entityType: 'customer', entityId: customer.id })
      await createNotification(this.db, {
        companyId: this.companyId,
        type: 'customer_registered',
        title: customer.name,
        body: 'تم تسجيل عميل جديد',
        severity: 'info',
        link: '/dashboard/customers',
      })
      return { ok: true, data: customer }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'CREATE_FAILED' }
    }
  }

  async update(id: string, input: UpdateCustomerInput): Promise<ServiceResult<CustomerResponse>> {
    const parsed = UpdateCustomerSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.errors.map((e) => e.message).join('; '), code: 'VALIDATION_ERROR' }
    }
    try {
      const existing = await this.repo.findById(id)
      if (!existing) {
        return { ok: false, error: 'العميل غير موجود', code: 'NOT_FOUND' }
      }
      const customer = await this.repo.update(id, parsed.data)
      await logAudit({ action: 'customer.updated', entityType: 'customer', entityId: id })
      return { ok: true, data: customer }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'UPDATE_FAILED' }
    }
  }

  async getById(id: string): Promise<ServiceResult<CustomerResponse>> {
    try {
      const customer = await this.repo.findById(id)
      if (!customer) {
        return { ok: false, error: 'العميل غير موجود', code: 'NOT_FOUND' }
      }
      return { ok: true, data: customer }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'FETCH_FAILED' }
    }
  }

  async list(
    opts: { limit?: number; offset?: number; type?: 'customer' | 'supplier' } = {},
  ): Promise<ServiceResult<{ data: CustomerResponse[]; count: number }>> {
    try {
      const result = await this.repo.listPaged({
        limit: opts.limit ?? 50,
        offset: opts.offset ?? 0,
        type: opts.type,
      })
      return { ok: true, data: result }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'FETCH_FAILED' }
    }
  }

  async search(query: string): Promise<ServiceResult<CustomerResponse[]>> {
    try {
      const customers = await this.repo.search(query)
      return { ok: true, data: customers }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'SEARCH_FAILED' }
    }
  }

  async delete(id: string): Promise<ServiceResult<void>> {
    try {
      const existing = await this.repo.findById(id)
      if (!existing) {
        return { ok: false, error: 'العميل غير موجود', code: 'NOT_FOUND' }
      }
      await this.repo.softDeleteById(id)
      await logAudit({ action: 'customer.deleted', entityType: 'customer', entityId: id, severity: 'warning' })
      return { ok: true, data: undefined }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'DELETE_FAILED' }
    }
  }

  async recordPayment(customerId: string, input: RecordPaymentInput): Promise<ServiceResult<CustomerResponse>> {
    const parsed = RecordPaymentSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.errors.map((e) => e.message).join('; '), code: 'VALIDATION_ERROR' }
    }
    try {
      const customer = await this.repo.findById(customerId)
      if (!customer) {
        return { ok: false, error: 'العميل غير موجود', code: 'NOT_FOUND' }
      }

      const newBalance = customer.balance - parsed.data.amount
      const updated = await this.repo.update(customerId, { balance: Math.max(0, newBalance) })

      await this.db.from('customer_transactions').insert({
        company_id: this.companyId,
        customer_id: customerId,
        type: 'payment',
        amount: parsed.data.amount,
        method: parsed.data.method,
        notes: parsed.data.notes,
        created_at: new Date().toISOString(),
      })

      await logAudit({ action: 'payment.added', entityType: 'customer', entityId: customerId })
      await createNotification(this.db, {
        companyId: this.companyId,
        type: 'payment_received',
        title: `دفعة من ${updated.name}`,
        body: `المبلغ: ${parsed.data.amount}`,
        severity: 'info',
        link: `/dashboard/customers`,
      })
      return { ok: true, data: updated }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'PAYMENT_FAILED' }
    }
  }

  async countActive(): Promise<ServiceResult<number>> {
    try {
      const count = await this.repo.countActive()
      return { ok: true, data: count }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'FETCH_FAILED' }
    }
  }
}
