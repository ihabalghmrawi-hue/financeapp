import type { CompressedImage } from './types'
import { cameraService } from './camera-service'

class ImageService {
  async compress(path: string, quality = 0.7, maxWidth = 1920): Promise<CompressedImage | null> {
    try {
      const blob = await cameraService.getPhotoAsBlob(path)
      if (!blob) {
        return null
      }

      const bitmap = await createImageBitmap(blob)

      let width = bitmap.width
      let height = bitmap.height

      if (width > maxWidth) {
        const ratio = maxWidth / width
        width = maxWidth
        height = Math.round(height * ratio)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        return null
      }

      ctx.drawImage(bitmap, 0, 0, width, height)
      bitmap.close()

      const compressedBlob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/jpeg', quality),
      )

      if (!compressedBlob) {
        return null
      }

      const compressedPath = URL.createObjectURL(compressedBlob)

      return {
        path: compressedPath,
        size: compressedBlob.size,
        width,
        height,
        quality: Math.round(quality * 100),
      }
    } catch {
      return null
    }
  }

  async compressWithTargetSize(path: string, maxSizeBytes: number): Promise<CompressedImage | null> {
    let quality = 0.85
    let result = await this.compress(path, quality)

    while (result && result.size > maxSizeBytes && quality > 0.1) {
      quality -= 0.1
      URL.revokeObjectURL(result.path)
      result = await this.compress(path, quality)
    }

    return result
  }

  async getImageDimensions(path: string): Promise<{ width: number; height: number } | null> {
    try {
      const blob = await cameraService.getPhotoAsBlob(path)
      if (!blob) {
        return null
      }

      const bitmap = await createImageBitmap(blob)
      const dims = { width: bitmap.width, height: bitmap.height }
      bitmap.close()
      return dims
    } catch {
      return null
    }
  }

  async toDataUrl(path: string, format: 'jpeg' | 'png' = 'jpeg', quality = 0.8): Promise<string | null> {
    try {
      const blob = await cameraService.getPhotoAsBlob(path)
      if (!blob) {
        return null
      }

      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(blob)
      })
    } catch {
      return null
    }
  }

  revokeUrl(path: string): void {
    try {
      URL.revokeObjectURL(path)
    } catch {
      /* ignore */
    }
  }
}

export const imageService = new ImageService()
