import { pluginOrchestrator } from './plugin-orchestrator'
import type { ScanResult, BarcodeScanOptions, BarcodeFormat } from './types'

class BarcodeScannerService {
  async scan(options?: BarcodeScanOptions): Promise<ScanResult | null> {
    try {
      if (typeof window !== 'undefined' && !this.isNative()) {
        return this.webBarcodeScan(options)
      }

      const { BarcodeScanner, BarcodeFormat: PluginBarcodeFormat } = await pluginOrchestrator.getBarcodeScanner()
      const defaultFormats = [
        PluginBarcodeFormat.QrCode,
        PluginBarcodeFormat.Code128,
        PluginBarcodeFormat.Ean13,
        PluginBarcodeFormat.Ean8,
      ]
      const result = await BarcodeScanner.scan({ formats: defaultFormats })

      if (result.barcodes && result.barcodes.length > 0) {
        const barcode = result.barcodes[0]
        return {
          value: barcode.rawValue || barcode.displayValue,
          format: this.mapFormat(barcode.format),
          corners: barcode.cornerPoints?.map(([x, y]) => ({ x, y })),
        }
      }
      return null
    } catch {
      return this.webBarcodeScan(options)
    }
  }

  async scanMultiple(options?: BarcodeScanOptions): Promise<ScanResult[]> {
    const result = await this.scan({ ...options, multiple: true })
    return result ? [result] : []
  }

  async scanFromImage(base64: string, formats?: any[]): Promise<ScanResult | null> {
    try {
      const { BarcodeScanner } = await pluginOrchestrator.getBarcodeScanner()
      const result = await BarcodeScanner.readBarcodesFromImage({ path: base64, formats: formats as any })

      if (result.barcodes && result.barcodes.length > 0) {
        const barcode = result.barcodes[0]
        return {
          value: barcode.rawValue || barcode.displayValue,
          format: this.mapFormat(barcode.format),
        }
      }
      return null
    } catch {
      return null
    }
  }

  async stopScan(): Promise<void> {
    try {
      const { BarcodeScanner } = await pluginOrchestrator.getBarcodeScanner()
      await BarcodeScanner.stopScan()
    } catch {
      /* ignore */
    }
  }

  async isSupported(): Promise<boolean> {
    try {
      const { BarcodeScanner } = await pluginOrchestrator.getBarcodeScanner()
      const result = await BarcodeScanner.isSupported()
      return result.supported
    } catch {
      return false
    }
  }

  private async webBarcodeScan(options?: BarcodeScanOptions): Promise<ScanResult | null> {
    if (!('BarcodeDetector' in window)) {
      throw new Error('Barcode scanning not supported on this device')
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })

      const video = document.createElement('video')
      video.srcObject = stream
      await video.play()

      const detector = new (window as any).BarcodeDetector({
        formats: options?.formats ?? ['qr_code', 'code_128', 'ean_13'],
      })

      await new Promise((resolve) => setTimeout(resolve, 1000))

      const barcodes = await detector.detect(video)

      stream.getTracks().forEach((t) => t.stop())
      video.remove()

      if (barcodes.length > 0) {
        return {
          value: barcodes[0].rawValue,
          format: barcodes[0].format,
        }
      }
      return null
    } catch {
      return null
    }
  }

  private mapFormat(format: string): BarcodeFormat {
    const formatMap: Record<string, BarcodeFormat> = {
      QR_CODE: 'qr_code',
      AZTEC: 'aztec',
      CODABAR: 'codabar',
      CODE_39: 'code_39',
      CODE_93: 'code_93',
      CODE_128: 'code_128',
      DATA_MATRIX: 'data_matrix',
      EAN_8: 'ean_8',
      EAN_13: 'ean_13',
      ITF: 'itf',
      PDF_417: 'pdf_417',
      UPC_A: 'upc_a',
      UPC_E: 'upc_e',
    }
    return formatMap[format] ?? 'qr_code'
  }

  private isNative(): boolean {
    return !!(window as any).Capacitor?.isNative
  }
}

export const barcodeScannerService = new BarcodeScannerService()
