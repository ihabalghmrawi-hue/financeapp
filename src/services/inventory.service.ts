import type { SupabaseClient } from '@supabase/supabase-js'
import type { ServiceResult } from '@/types/service'
import { InventoryRepository, type StockLevel } from '@/repositories/inventory.repository'
import { logAudit } from '@/lib/audit'

export class InventoryService {
  private readonly repo: InventoryRepository

  constructor(
    private readonly db: SupabaseClient,
    private readonly companyId: string,
  ) {
    this.repo = new InventoryRepository(db, companyId)
  }

  async getStockLevels(businessType?: string): Promise<ServiceResult<StockLevel[]>> {
    try {
      const levels = await this.repo.getStockLevels(businessType)
      return { ok: true, data: levels }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'FETCH_FAILED' }
    }
  }

  async getLowStockItems(businessType?: string): Promise<ServiceResult<StockLevel[]>> {
    try {
      const items = await this.repo.getLowStockItems(businessType)
      return { ok: true, data: items }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'FETCH_FAILED' }
    }
  }

  async adjustStock(input: {
    productId: string
    warehouseId: string
    quantity: number
    type: string
    referenceId?: string
    notes?: string
  }): Promise<ServiceResult<void>> {
    try {
      await this.repo.adjustStock(
        input.productId,
        input.warehouseId,
        input.quantity,
        input.type,
        input.referenceId,
        input.notes,
      )
      await logAudit({ action: 'inventory.adjusted', entityType: 'inventory', entityId: input.productId })
      return { ok: true, data: undefined }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'ADJUST_FAILED' }
    }
  }

  async getMovements(
    productId?: string,
    limit = 50,
    offset = 0,
  ): Promise<ServiceResult<Array<Record<string, unknown>>>> {
    try {
      const movements = await this.repo.getMovements(productId, limit, offset)
      return { ok: true, data: movements }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'FETCH_FAILED' }
    }
  }
}
