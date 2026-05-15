import { pluginOrchestrator } from './plugin-orchestrator'
import type { FilePickerResult, UploadProgress } from './types'

class FileService {
  async pickFile(mimeTypes?: string[]): Promise<FilePickerResult | null> {
    try {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = mimeTypes?.join(',') ?? '*/*'

      return new Promise((resolve) => {
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0]
          if (!file) {
            resolve(null)
            return
          }

          const path = URL.createObjectURL(file)
          resolve({
            path,
            name: file.name,
            size: file.size,
            type: file.type,
            mimeType: file.type,
            uri: path,
          })
          URL.revokeObjectURL(path)
        }
        input.click()
      })
    } catch {
      return null
    }
  }

  async pickImage(): Promise<FilePickerResult | null> {
    return this.pickFile(['image/jpeg', 'image/png', 'image/webp'])
  }

  async pickPDF(): Promise<FilePickerResult | null> {
    return this.pickFile(['application/pdf'])
  }

  async pickDocument(): Promise<FilePickerResult | null> {
    return this.pickFile([
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/csv',
    ])
  }

  async readFileAsBase64(file: FilePickerResult): Promise<string | null> {
    try {
      const { Filesystem } = await pluginOrchestrator.getFilesystem()
      const result = await Filesystem.readFile({ path: file.path })
      return result.data as string
    } catch {
      try {
        const response = await fetch(file.path)
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

  async readFileAsBlob(file: FilePickerResult): Promise<Blob | null> {
    try {
      const response = await fetch(file.path)
      return await response.blob()
    } catch {
      return null
    }
  }

  async writeFile(path: string, data: string, mimeType?: string): Promise<boolean> {
    try {
      const { Filesystem, Directory } = await pluginOrchestrator.getFilesystem()
      await Filesystem.writeFile({
        path,
        data,
        directory: Directory.Documents,
        recursive: true,
      })
      return true
    } catch {
      return false
    }
  }

  async deleteFile(path: string): Promise<boolean> {
    try {
      const { Filesystem, Directory } = await pluginOrchestrator.getFilesystem()
      await Filesystem.deleteFile({ path, directory: Directory.Documents })
      return true
    } catch {
      try {
        URL.revokeObjectURL(path)
        return true
      } catch {
        return false
      }
    }
  }

  async getFileUrl(path: string): Promise<string> {
    try {
      const { Filesystem, Directory } = await pluginOrchestrator.getFilesystem()
      const result = await Filesystem.getUri({ path, directory: Directory.Documents })
      return result.uri
    } catch {
      return path
    }
  }

  async uploadFile(
    file: FilePickerResult,
    uploadUrl: string,
    onProgress?: (progress: UploadProgress) => void,
  ): Promise<boolean> {
    try {
      const blob = await this.readFileAsBlob(file)
      if (!blob) {
        return false
      }

      onProgress?.({ fileId: file.name, fileName: file.name, progress: 0, speed: 0, status: 'queued' })

      const xhr = new XMLHttpRequest()
      xhr.open('POST', uploadUrl)
      xhr.setRequestHeader('Content-Type', blob.type)

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress?.({
            fileId: file.name,
            fileName: file.name,
            progress: Math.round((e.loaded / e.total) * 100),
            speed: e.loaded / ((Date.now() - (xhr as any)['_startTime']) / 1000),
            status: 'uploading',
          })
        }
      }

      return new Promise<boolean>((resolve) => {
        xhr.onload = () => {
          resolve(xhr.status >= 200 && xhr.status < 300)
        }
        xhr.onerror = () => {
          resolve(false)
        }
        ;(xhr as any)['_startTime'] = Date.now()
        xhr.send(blob)
      })
    } catch {
      return false
    }
  }
}

export const fileService = new FileService()
