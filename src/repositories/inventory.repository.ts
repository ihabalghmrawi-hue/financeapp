import type { SupabaseClient } from '@supabase/supabase-js'
import { BaseRepository, RepositoryError } from './base.repository'
import type { Product } from '@/types/erp'

export interface StockLevel {
  product_id: string
  product_name: string
  product_name_ar: string | null
  sku: string | null
  quantity: number
  reserved: number
  available: number
  min_stock: number
  warehouse: string | null
}

export class InventoryRepository extends BaseRepository<Product> {
  protected readonly table = 'products'
  protected hasSoftDelete = true

  constructor(db: SupabaseClient, companyId: string) {
    super(db, companyId)
  }

  async getStockLevels(businessType?: string): Promise<StockLevel[]> {
    let q = this.db
      .from(this.table)
      .select('id, name, name_ar, sku, min_stock_level, inventory(quantity, reserved_quantity, warehouses(name))')
      .eq('company_id', this.companyId)
      .eq('is_deleted', false)
      .eq('track_inventory', true)

    if (businessType) {
      q = q.eq('business_type', businessType) as typeof q
    }

    const { data, error } = await q
    if (error) {
      throw new RepositoryError(error.message, error.code)
    }

    const rows = (data ?? []) as Array<{
      id: string
      name: string
      name_ar: string | null
      sku: string | null
      min_stock_level: number
      inventory: Array<{
        quantity: number
        reserved_quantity: number
        warehouses: Array<{ name: string }> | null
      }> | null
    }>

    return rows.map((r) => {
      const inv = r.inventory ?? []
      const quantity = inv.reduce((s, i) => s + i.quantity, 0)
      const reserved = inv.reduce((s, i) => s + i.reserved_quantity, 0)
      const warehouse = inv.find((i) => i.warehouses)?.warehouses?.[0]?.name ?? null
      return {
        product_id: r.id,
        product_name: r.name,
        product_name_ar: r.name_ar,
        sku: r.sku,
        quantity,
        reserved,
        available: quantity - reserved,
        min_stock: r.min_stock_level,
        warehouse,
      }
    })
  }

  async getLowStockItems(businessType?: string): Promise<StockLevel[]> {
    const all = await this.getStockLevels(businessType)
    return all.filter((s) => s.available <= s.min_stock)
  }

  async adjustStock(
    productId: string,
    warehouseId: string,
    quantity: number,
    type: string,
    referenceId?: string,
    notes?: string,
  ): Promise<void> {
    const { data: existing, error: fetchErr } = await this.db
      .from('inventory')
      .select('id, quantity')
      .eq('company_id', this.companyId)
      .eq('product_id', productId)
      .eq('warehouse_id', warehouseId)
      .maybeSingle()
    if (fetchErr) {
      throw new RepositoryError(fetchErr.message, fetchErr.code)
    }

    const oldQty = existing?.quantity ?? 0
    const newQty = Math.max(0, oldQty + quantity)

    if (existing) {
      const { error: updateErr } = await this.db.from('inventory').update({ quantity: newQty }).eq('id', existing.id)
      if (updateErr) {
        throw new RepositoryError(updateErr.message, updateErr.code)
      }
    } else {
      const { error: insertErr } = await this.db.from('inventory').insert({
        company_id: this.companyId,
        product_id: productId,
        warehouse_id: warehouseId,
        quantity: newQty,
      })
      if (insertErr) {
        throw new RepositoryError(insertErr.message, insertErr.code)
      }
    }

    const { error: movErr } = await this.db.from('inventory_movements').insert({
      company_id: this.companyId,
      product_id: productId,
      warehouse_id: warehouseId,
      type,
      quantity,
      quantity_before: oldQty,
      quantity_after: newQty,
      unit_cost: 0,
      reference_id: referenceId ?? null,
      reference_type: referenceId ? type : null,
      notes: notes ?? null,
    })
    if (movErr) {
      throw new RepositoryError(movErr.message, movErr.code)
    }
  }

  async getMovements(productId?: string, limit = 50, offset = 0): Promise<Array<Record<string, unknown>>> {
    let q = this.db
      .from('inventory_movements')
      .select('*, products(name, name_ar), warehouses(name, name_ar)')
      .eq('company_id', this.companyId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (productId) {
      q = q.eq('product_id', productId) as typeof q
    }

    const { data, error } = await q
    if (error) {
      throw new RepositoryError(error.message, error.code)
    }
    return data ?? []
  }
}
