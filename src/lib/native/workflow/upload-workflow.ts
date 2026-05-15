import { fileService } from '../file-service'
import { imageService } from '../image-service'
import { hapticsService } from '../haptics-service'
import type { FilePickerResult, UploadProgress } from '../types'

class UploadWorkflowService {
  async uploadPhoto(
    path: string,
    uploadUrl: string,
    onProgress?: (progress: UploadProgress) => void,
  ): Promise<boolean> {
    try {
      const compressed = await imageService.compress(path, 0.8, 1920)
      if (!compressed) {
        return false
      }

      const blob = await fetch(compressed.path).then((r) => r.blob())

      imageService.revokeUrl(path)
      if (compressed.path !== path) {
        imageService.revokeUrl(compressed.path)
      }

      return this.uploadBlob(blob, 'image/jpeg', uploadUrl, 'photo.jpg', onProgress)
    } catch {
      await hapticsService.error()
      return false
    }
  }

  async uploadDocument(
    file: FilePickerResult,
    uploadUrl: string,
    onProgress?: (progress: UploadProgress) => void,
  ): Promise<boolean> {
    try {
      const blob = await fileService.readFileAsBlob(file)
      if (!blob) {
        return false
      }

      return this.uploadBlob(blob, file.mimeType, uploadUrl, file.name, onProgress)
    } catch {
      await hapticsService.error()
      return false
    }
  }

  async uploadInvoiceAttachment(imagePath: string, invoiceId: string): Promise<boolean> {
    const uploadUrl = `/api/sales/invoices/${invoiceId}/attachments`
    return this.uploadPhoto(imagePath, uploadUrl, (progress) => {
      if (progress.status === 'completed') {
        hapticsService.success()
      }
    })
  }

  async uploadReceiptAttachment(imagePath: string, expenseId: string): Promise<boolean> {
    const uploadUrl = `/api/expenses/${expenseId}/receipts`
    return this.uploadPhoto(imagePath, uploadUrl, (progress) => {
      if (progress.status === 'completed') {
        hapticsService.success()
      }
    })
  }

  private async uploadBlob(
    blob: Blob,
    contentType: string,
    uploadUrl: string,
    filename: string,
    onProgress?: (progress: UploadProgress) => void,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', uploadUrl)
      xhr.setRequestHeader('Content-Type', contentType)
      xhr.setRequestHeader('X-Filename', encodeURIComponent(filename))

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress({
            fileId: filename,
            fileName: filename,
            progress: Math.round((e.loaded / e.total) * 100),
            speed: e.loaded / ((Date.now() - (xhr as any)['_startTime']) / 1000),
            status: 'uploading',
          })
        }
      }

      xhr.onload = () => {
        const success = xhr.status >= 200 && xhr.status < 300
        if (onProgress) {
          onProgress({
            fileId: filename,
            fileName: filename,
            progress: success ? 100 : 0,
            speed: 0,
            status: success ? 'completed' : 'failed',
            error: success ? undefined : `HTTP ${xhr.status}`,
          })
        }
        if (success) {
          hapticsService.success()
        }
        resolve(success)
      }

      xhr.onerror = () => {
        if (onProgress) {
          onProgress({
            fileId: filename,
            fileName: filename,
            progress: 0,
            speed: 0,
            status: 'failed',
            error: 'Network error',
          })
        }
        resolve(false)
      }
      ;(xhr as any)['_startTime'] = Date.now()
      xhr.send(blob)
    })
  }
}

export const uploadWorkflowService = new UploadWorkflowService()
