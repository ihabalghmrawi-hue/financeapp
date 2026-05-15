import { buildNotification } from '../payload-builder'
import { deliveryEngine } from '../delivery-engine'
import { notificationPreferences } from '../notification-preferences'

class InventoryAlertService {
  async notifyLowStock(
    companyId: string,
    userId: string,
    data: {
      itemId: string
      itemName: string
      currentStock: number
      minimumStock: number
      unit?: string
      warehouse?: string
    },
  ): Promise<boolean> {
    const enabled = await notificationPreferences.isCategoryEnabled(companyId, userId, 'inventory')
    if (!enabled) {
      return false
    }

    const deficit = data.minimumStock - data.currentStock
    const notification = buildNotification({
      companyId,
      userId,
      category: 'inventory',
      title: 'تنبيه: نفاد المخزون',
      body: `${data.itemName} - المخزون المتبقي: ${data.currentStock} ${data.unit ?? ''} (النقص: ${deficit})${data.warehouse ? `\nالمستودع: ${data.warehouse}` : ''}`,
      priority: deficit > data.minimumStock * 0.5 ? 'critical' : 'high',
      groupKey: 'low_stock',
      deepLink: { type: 'inventory_item', itemId: data.itemId },
      actions: [{ id: 'open', label: 'عرض المخزون', action: 'open_inventory', foreground: true }],
      data: { itemId: data.itemId, currentStock: data.currentStock, minimumStock: data.minimumStock, deficit },
    })

    return deliveryEngine.deliver(notification, companyId, userId)
  }

  async notifyStockOut(
    companyId: string,
    userId: string,
    data: {
      itemId: string
      itemName: string
      warehouse?: string
    },
  ): Promise<boolean> {
    const notification = buildNotification({
      companyId,
      userId,
      category: 'inventory',
      title: 'نفاد كامل للمخزون',
      body: `${data.itemName} - المخزون صفر بالكامل${data.warehouse ? ` في ${data.warehouse}` : ''}`,
      priority: 'critical',
      groupKey: 'stock_out',
      deepLink: { type: 'inventory_item', itemId: data.itemId },
      data: { itemId: data.itemId, stockOut: true },
    })

    return deliveryEngine.deliver(notification, companyId, userId)
  }

  async notifyExpiryWarning(
    companyId: string,
    userId: string,
    data: {
      itemId: string
      itemName: string
      batchNumber: string
      expiryDate: string
      daysUntilExpiry: number
      quantity: number
    },
  ): Promise<boolean> {
    const notification = buildNotification({
      companyId,
      userId,
      category: 'inventory',
      title: 'تنبيه: انتهاء صلاحية وشيك',
      body: `${data.itemName} - الكمية: ${data.quantity} | تنتهي في ${data.daysUntilExpiry} يوم (${data.expiryDate})`,
      priority: data.daysUntilExpiry <= 7 ? 'critical' : 'high',
      groupKey: 'expiry_warnings',
      deepLink: { type: 'inventory_item', itemId: data.itemId },
      data: { itemId: data.itemId, batchNumber: data.batchNumber, daysUntilExpiry: data.daysUntilExpiry },
    })

    return deliveryEngine.deliver(notification, companyId, userId)
  }

  async notifyStockTransfer(
    companyId: string,
    userId: string,
    data: {
      transferId: string
      itemName: string
      quantity: number
      fromWarehouse: string
      toWarehouse: string
    },
  ): Promise<boolean> {
    const notification = buildNotification({
      companyId,
      userId,
      category: 'inventory',
      title: 'تحويل مخزون',
      body: `${data.itemName} - الكمية: ${data.quantity} من ${data.fromWarehouse} إلى ${data.toWarehouse}`,
      priority: 'low',
      deepLink: { type: 'entity', entityType: 'inventory/transfers', entityId: data.transferId },
      data: { transferId: data.transferId, quantity: data.quantity },
    })

    return deliveryEngine.deliver(notification, companyId, userId)
  }
}

export const inventoryAlertService = new InventoryAlertService()
