'use client'

import { entityStore } from '../storage/entity-store'
import { syncEngine } from '../sync/sync-engine'
import { syncTracker } from '../sync/sync-tracker'

export class SalesSyncService {
  async cacheSalesOrder(order: Record<string, unknown>, companyId: string): Promise<void> {
    await entityStore.put({
      id: String(order.id),
      entity_type: 'sales_orders',
      company_id: companyId,
      data: order,
      version: (order as any).version ?? 0,
      updated_at: (order as any).updated_at ?? new Date().toISOString(),
      created_at: (order as any).created_at ?? new Date().toISOString(),
      synced_at: new Date().toISOString(),
      dirty: false,
    })
  }

  async queueSalesOrder(orderData: Record<string, unknown>, companyId: string): Promise<string> {
    return syncEngine.queueOfflineOperation(
      'sales_orders',
      String(orderData.id ?? crypto.randomUUID()),
      companyId,
      'create',
      orderData,
      10,
    )
  }

  async queueSalesUpdate(orderId: string, changes: Record<string, unknown>, companyId: string): Promise<string> {
    return syncEngine.queueOfflineOperation('sales_orders', orderId, companyId, 'update', changes, 10)
  }

  async cacheInvoice(invoice: Record<string, unknown>, companyId: string): Promise<void> {
    await entityStore.put({
      id: String(invoice.id),
      entity_type: 'invoices',
      company_id: companyId,
      data: invoice,
      version: (invoice as any).version ?? 0,
      updated_at: (invoice as any).updated_at ?? new Date().toISOString(),
      created_at: (invoice as any).created_at ?? new Date().toISOString(),
      synced_at: new Date().toISOString(),
      dirty: false,
    })
  }

  async queueInvoice(invoiceData: Record<string, unknown>, companyId: string): Promise<string> {
    return syncEngine.queueOfflineOperation(
      'invoices',
      String(invoiceData.id ?? crypto.randomUUID()),
      companyId,
      'create',
      invoiceData,
      10,
    )
  }

  async getCachedSale(id: string): Promise<Record<string, unknown> | null> {
    const stored = await entityStore.get('sales_orders', id)
    return stored?.data ?? null
  }

  async getCachedSales(companyId: string): Promise<Record<string, unknown>[]> {
    const items = await entityStore.getAll('sales_orders', companyId)
    return items.map((i) => i.data)
  }

  async getCachedInvoices(companyId: string): Promise<Record<string, unknown>[]> {
    const items = await entityStore.getAll('invoices', companyId)
    return items.map((i) => i.data)
  }
}

export const salesSyncService = new SalesSyncService()
