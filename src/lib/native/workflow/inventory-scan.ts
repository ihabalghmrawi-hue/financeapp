import { barcodeScannerService } from '../barcode-scanner'
import { hapticsService } from '../haptics-service'
import type { ScanResult } from '../types'

export interface InventoryScanResult {
  success: boolean
  barcode: string
  format: string
  quantity?: number
  location?: string
}

class InventoryScanWorkflow {
  async scanItem(options?: { quantity?: number; location?: string }): Promise<InventoryScanResult | null> {
    try {
      const result = await barcodeScannerService.scan({
        formats: ['code_128', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code'],
      })

      if (!result) {
        return null
      }

      await hapticsService.success()

      return {
        success: true,
        barcode: result.value,
        format: result.format,
        quantity: options?.quantity,
        location: options?.location,
      }
    } catch {
      await hapticsService.error()
      return null
    }
  }

  async scanMultipleItems(count: number): Promise<InventoryScanResult[]> {
    const results: InventoryScanResult[] = []

    for (let i = 0; i < count; i++) {
      const result = await this.scanItem()
      if (result) {
        results.push(result)
      }
    }

    return results
  }

  async verifyStock(barcode: string, expectedQuantity: number): Promise<boolean> {
    try {
      const response = await fetch(`/api/inventory/lookup?barcode=${encodeURIComponent(barcode)}`)
      if (!response.ok) {
        return false
      }

      const data = await response.json()
      return data.quantity >= expectedQuantity
    } catch {
      return false
    }
  }

  async receiveStock(barcode: string, quantity: number, location?: string): Promise<boolean> {
    try {
      const response = await fetch('/api/inventory/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode, quantity, location }),
      })
      return response.ok
    } catch {
      return false
    }
  }

  async transferStock(barcode: string, quantity: number, fromLocation: string, toLocation: string): Promise<boolean> {
    try {
      const response = await fetch('/api/inventory/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barcode, quantity, fromLocation, toLocation }),
      })
      return response.ok
    } catch {
      return false
    }
  }
}

export const inventoryScanWorkflow = new InventoryScanWorkflow()
