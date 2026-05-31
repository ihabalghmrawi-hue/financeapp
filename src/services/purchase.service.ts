import type { SupabaseClient } from '@supabase/supabase-js'
import type { ServiceResult } from '@/types/service'
import type { CreatePurchaseInput, PurchaseResponse } from '@/validators/purchase'
import { CreatePurchaseSchema } from '@/validators/purchase'
import { PurchaseRepository, type PurchaseWithItems } from '@/repositories/purchase.repository'
import { logAudit } from '@/lib/audit'
import { createNotification } from '@/lib/notifications'

export class PurchaseService {
  private readonly repo: PurchaseRepository

  constructor(
    private readonly db: SupabaseClient,
    private readonly companyId: string,
  ) {
    this.repo = new PurchaseRepository(db, companyId)
  }

  async create(input: CreatePurchaseInput): Promise<ServiceResult<PurchaseResponse>> {
    const parsed = CreatePurchaseSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.errors.map((e) => e.message).join('; '), code: 'VALIDATION_ERROR' }
    }
    try {
      const { items, ...purchaseData } = parsed.data
      const purchase = await this.repo.create({
        ...purchaseData,
        supplier_id: purchaseData.supplier_id ?? null,
        warehouse_id: purchaseData.warehouse_id ?? null,
        invoice_number: `PO-${Date.now()}`,
        status: 'ordered',
      })

      for (const item of items) {
        await this.db.from('purchase_items').insert({
          purchase_id: purchase.id,
          company_id: this.companyId,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
          total: item.total,
        })
      }

      await logAudit({ action: 'purchase.created', entityType: 'purchase', entityId: purchase.id })
      await createNotification(this.db, {
        companyId: this.companyId,
        type: 'purchase_created',
        title: `أمر شراء جديد`,
        body: `المجموع: ${purchase.total}`,
        severity: 'info',
        link: '/dashboard/purchases',
      })
      return { ok: true, data: purchase }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'CREATE_FAILED' }
    }
  }

  async getById(id: string): Promise<ServiceResult<PurchaseWithItems>> {
    try {
      const purchase = await this.repo.findByIdWithRelations(id)
      if (!purchase) {
        return { ok: false, error: 'المشتريات غير موجودة', code: 'NOT_FOUND' }
      }
      return { ok: true, data: purchase }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'FETCH_FAILED' }
    }
  }

  async list(
    opts: { limit?: number; offset?: number; status?: string; from?: string; to?: string } = {},
  ): Promise<ServiceResult<{ data: PurchaseWithItems[]; count: number }>> {
    try {
      const result = await this.repo.listPaged({
        limit: opts.limit ?? 50,
        offset: opts.offset ?? 0,
        status: opts.status,
        from: opts.from,
        to: opts.to,
      })
      return { ok: true, data: result }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'FETCH_FAILED' }
    }
  }

  async delete(id: string): Promise<ServiceResult<void>> {
    try {
      const existing = await this.repo.findByIdWithRelations(id)
      if (!existing) {
        return { ok: false, error: 'المشتريات غير موجودة', code: 'NOT_FOUND' }
      }

      await this.db.from('purchase_items').delete().eq('purchase_id', id)
      await this.repo.hardDeleteById(id)
      await logAudit({ action: 'purchase.deleted', entityType: 'purchase', entityId: id, severity: 'warning' })
      return { ok: true, data: undefined }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'DELETE_FAILED' }
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
