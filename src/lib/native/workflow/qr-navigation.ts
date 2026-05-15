import { barcodeScannerService } from '../barcode-scanner'
import { hapticsService } from '../haptics-service'

export interface QRNavigationResult {
  success: boolean
  type: QRNavigationType
  value: string
  data?: Record<string, unknown>
}

export type QRNavigationType =
  | 'entity'
  | 'invoice'
  | 'order'
  | 'item'
  | 'approval'
  | 'workflow'
  | 'customer'
  | 'supplier'
  | 'location'
  | 'url'
  | 'unknown'

class QRNavigationWorkflow {
  async scanAndNavigate(): Promise<QRNavigationResult | null> {
    try {
      const result = await barcodeScannerService.scan({
        formats: ['qr_code'],
      })

      if (!result) {
        return null
      }

      await hapticsService.success()

      const parsed = this.parseQRValue(result.value)

      if (parsed.data?.url) {
        window.location.href = parsed.data.url as string
      } else {
        const path = this.buildNavigationPath(parsed)
        if (path) {
          window.location.href = path
        }
      }

      return parsed
    } catch {
      await hapticsService.error()
      return null
    }
  }

  private parseQRValue(value: string): QRNavigationResult {
    try {
      const parsed = JSON.parse(value)
      if (parsed.type && parsed.id) {
        return {
          success: true,
          type: parsed.type as QRNavigationType,
          value: parsed.id,
          data: parsed,
        }
      }
    } catch {
      /* not JSON */
    }

    const urlMatch = value.match(/^https?:\/\//)
    if (urlMatch) {
      return { success: true, type: 'url', value }
    }

    const entityPatterns: Array<{ prefix: string; type: QRNavigationType }> = [
      { prefix: 'INV-', type: 'invoice' },
      { prefix: 'ORD-', type: 'order' },
      { prefix: 'ITEM-', type: 'item' },
      { prefix: 'CUST-', type: 'customer' },
      { prefix: 'SUPP-', type: 'supplier' },
      { prefix: 'APPR-', type: 'approval' },
      { prefix: 'WF-', type: 'workflow' },
      { prefix: 'LOC-', type: 'location' },
    ]

    for (const { prefix, type } of entityPatterns) {
      if (value.startsWith(prefix)) {
        return { success: true, type, value: value.slice(prefix.length) }
      }
    }

    const uuidMatch = value.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    if (uuidMatch) {
      return { success: true, type: 'entity', value }
    }

    return { success: true, type: 'unknown', value }
  }

  private buildNavigationPath(parsed: QRNavigationResult): string | null {
    const routes: Record<QRNavigationType, string | null> = {
      entity: `/dashboard/${parsed.data?.entityType ?? 'entities'}/${parsed.value}`,
      invoice: `/dashboard/sales/invoices/${parsed.value}`,
      order: `/dashboard/sales/orders/${parsed.value}`,
      item: `/dashboard/inventory/items/${parsed.value}`,
      approval: `/dashboard/approvals/${parsed.value}`,
      workflow: `/dashboard/workflow/${parsed.value}`,
      customer: `/dashboard/customers/${parsed.value}`,
      supplier: `/dashboard/suppliers/${parsed.value}`,
      location: `/dashboard/inventory/locations/${parsed.value}`,
      url: parsed.value,
      unknown: null,
    }
    return routes[parsed.type] ?? null
  }
}

export const qrNavigationWorkflow = new QRNavigationWorkflow()
