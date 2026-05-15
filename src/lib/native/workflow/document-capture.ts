import { cameraService } from '../camera-service'
import { imageService } from '../image-service'
import { fileService } from '../file-service'
import { hapticsService } from '../haptics-service'
import type { CameraResult } from '../types'

export interface DocumentCaptureResult {
  success: boolean
  path: string
  thumbnail?: string
  size: number
  pages?: CameraResult[]
}

class DocumentCaptureWorkflow {
  async captureInvoice(options?: { quality?: number; maxWidth?: number }): Promise<DocumentCaptureResult | null> {
    try {
      const photo = await cameraService.captureDocument({
        quality: options?.quality ?? 80,
        maxWidth: options?.maxWidth ?? 2048,
      })

      if (!photo) {
        return null
      }

      await hapticsService.success()

      return {
        success: true,
        path: photo.path,
        size: photo.size,
        pages: [photo],
      }
    } catch {
      await hapticsService.error()
      return null
    }
  }

  async captureMultiPageDocument(pages = 2): Promise<DocumentCaptureResult | null> {
    const photos: CameraResult[] = []

    for (let i = 0; i < pages; i++) {
      const photo = await cameraService.captureDocument()
      if (photo) {
        photos.push(photo)
        await hapticsService.impact('light')
      }
    }

    if (photos.length === 0) {
      return null
    }

    await hapticsService.success()

    return {
      success: true,
      path: photos[0].path,
      size: photos.reduce((s, p) => s + p.size, 0),
      pages: photos,
    }
  }

  async captureReceipt(): Promise<DocumentCaptureResult | null> {
    return this.captureInvoice({ quality: 85, maxWidth: 2048 })
  }

  async attachExistingDocument(): Promise<DocumentCaptureResult | null> {
    try {
      const file = await fileService.pickImage()
      if (!file) {
        return null
      }

      await hapticsService.success()

      return {
        success: true,
        path: file.path,
        size: file.size,
      }
    } catch {
      return null
    }
  }

  async attachPDF(): Promise<{ path: string; name: string; size: number } | null> {
    try {
      const file = await fileService.pickPDF()
      if (!file) {
        return null
      }

      return {
        path: file.path,
        name: file.name,
        size: file.size,
      }
    } catch {
      return null
    }
  }
}

export const documentCaptureWorkflow = new DocumentCaptureWorkflow()
