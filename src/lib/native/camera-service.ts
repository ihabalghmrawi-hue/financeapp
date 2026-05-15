import { pluginOrchestrator } from './plugin-orchestrator'
import type { CameraResult, DocumentCaptureOptions } from './types'

class CameraService {
  async capturePhoto(options?: { quality?: number; maxWidth?: number }): Promise<CameraResult | null> {
    try {
      const { Camera, CameraResultType, CameraSource } = await pluginOrchestrator.getCamera()
      const image = await Camera.getPhoto({
        quality: options?.quality ?? 85,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        width: options?.maxWidth ?? 1920,
        correctOrientation: true,
      })

      if (!image.path) {
        return null
      }

      const response = await fetch(image.path)
      const blob = await response.blob()

      return {
        path: image.path,
        format: image.format as 'jpeg' | 'png' | 'webp',
        width: 0,
        height: 0,
        size: blob.size,
      }
    } catch {
      return null
    }
  }

  async pickFromGallery(options?: { quality?: number; maxWidth?: number }): Promise<CameraResult | null> {
    try {
      const { Camera, CameraResultType, CameraSource } = await pluginOrchestrator.getCamera()
      const image = await Camera.getPhoto({
        quality: options?.quality ?? 85,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos,
        width: options?.maxWidth ?? 1920,
      })

      if (!image.path) {
        return null
      }

      const response = await fetch(image.path)
      const blob = await response.blob()

      return {
        path: image.path,
        format: image.format as 'jpeg' | 'png' | 'webp',
        width: 0,
        height: 0,
        size: blob.size,
      }
    } catch {
      return null
    }
  }

  async captureDocument(options?: DocumentCaptureOptions): Promise<CameraResult | null> {
    return this.capturePhoto({
      quality: options?.quality ?? 70,
      maxWidth: options?.maxWidth ?? 2048,
    })
  }

  async getPhotoAsBlob(path: string): Promise<Blob | null> {
    try {
      const response = await fetch(path)
      return await response.blob()
    } catch {
      return null
    }
  }

  async getPhotoAsBase64(path: string): Promise<string | null> {
    try {
      const { Filesystem } = await pluginOrchestrator.getFilesystem()
      const result = await Filesystem.readFile({ path })
      return result.data as string
    } catch {
      try {
        const response = await fetch(path)
        const blob = await response.blob()
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onloadend = () => resolve(reader.result as string)
          reader.readAsDataURL(blob)
        })
      } catch {
        return null
      }
    }
  }

  async saveToGallery(path: string): Promise<boolean> {
    try {
      const { Filesystem } = await pluginOrchestrator.getFilesystem()
      const data = await Filesystem.readFile({ path })
      const base64Data = (data.data as string).replace(/^data:image\/\w+;base64,/, '')
      const blob = this.base64ToBlob(base64Data, 'image/jpeg')

      if ('share' in navigator) {
        const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' })
        await (navigator as any).share({ files: [file] })
      }
      return true
    } catch {
      return false
    }
  }

  private base64ToBlob(base64: string, type: string): Blob {
    const byteCharacters = atob(base64)
    const byteArrays: Uint8Array[] = []
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512)
      const byteNumbers = new Array(slice.length)
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i)
      }
      byteArrays.push(new Uint8Array(byteNumbers))
    }
    return new Blob(byteArrays as BlobPart[], { type })
  }
}

export const cameraService = new CameraService()
