'use client'

import { entityStore } from '../storage/entity-store'
import { syncEngine } from '../sync/sync-engine'
import { syncTracker } from '../sync/sync-tracker'

export class InventorySyncService {
  async cacheInventoryItem(item: Record<string, unknown>, companyId: string): Promise<void> {
    await entityStore.put({
      id: String(item.id),
      entity_type: 'inventory_items',
      company_id: companyId,
      data: item,
      version: (item as any).version ?? 0,
      updated_at: (item as any).updated_at ?? new Date().toISOString(),
      created_at: (item as any).created_at ?? new Date().toISOString(),
      synced_at: new Date().toISOString(),
      dirty: false,
    })
  }

  async cacheStockMovement(movement: Record<string, unknown>, companyId: string): Promise<void> {
    await entityStore.put({
      id: String(movement.id),
      entity_type: 'stock_movements',
      company_id: companyId,
      data: movement,
      version: (movement as any).version ?? 0,
      updated_at: (movement as any).updated_at ?? new Date().toISOString(),
      created_at: (movement as any).created_at ?? new Date().toISOString(),
      synced_at: new Date().toISOString(),
      dirty: false,
    })
  }

  async queueAdjustment(
    itemId: string,
    companyId: string,
    adjustment: { quantity: number; reason: string; warehouse_id: string; notes?: string },
  ): Promise<string> {
    return syncEngine.queueOfflineOperation(
      'stock_movements',
      itemId,
      companyId,
      'create',
      adjustment as unknown as Record<string, unknown>,
      10,
    )
  }

  async queueTransfer(transferData: Record<string, unknown>, companyId: string): Promise<string> {
    return syncEngine.queueOfflineOperation(
      'stock_movements',
      String(transferData.id ?? crypto.randomUUID()),
      companyId,
      'create',
      transferData,
      10,
    )
  }

  async getCachedItem(itemId: string): Promise<Record<string, unknown> | null> {
    const stored = await entityStore.get('inventory_items', itemId)
    return stored?.data ?? null
  }

  async getCachedItems(companyId: string): Promise<Record<string, unknown>[]> {
    const items = await entityStore.getAll('inventory_items', companyId)
    return items.map((i) => i.data)
  }

  async isItemDirty(itemId: string): Promise<boolean> {
    return syncTracker.isEntityDirty('inventory_items', itemId)
  }
}

export const inventorySyncService = new InventorySyncService()
