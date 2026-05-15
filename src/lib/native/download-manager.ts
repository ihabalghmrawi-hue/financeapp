import { pluginOrchestrator } from './plugin-orchestrator'

class DownloadManager {
  private downloads = new Map<string, { progress: number; status: string; controller: AbortController }>()

  async download(url: string, filename: string): Promise<string | null> {
    try {
      const response = await fetch(url)
      const blob = await response.blob()

      const { Filesystem, Directory } = await pluginOrchestrator.getFilesystem()
      const base64 = await this.blobToBase64(blob)
      const path = `downloads/${filename}`

      await Filesystem.writeFile({
        path,
        data: base64,
        directory: Directory.Documents,
        recursive: true,
      })

      const result = await Filesystem.getUri({ path, directory: Directory.Documents })
      return result.uri
    } catch {
      return this.webDownload(url, filename)
    }
  }

  async downloadWithProgress(
    url: string,
    filename: string,
    onProgress?: (progress: number) => void,
  ): Promise<string | null> {
    const id = `${Date.now()}_${filename}`
    const controller = new AbortController()
    this.downloads.set(id, { progress: 0, status: 'downloading', controller })

    try {
      const response = await fetch(url, { signal: controller.signal })
      const contentLength = response.headers.get('content-length')
      const total = contentLength ? parseInt(contentLength, 10) : 0
      const reader = response.body?.getReader()
      if (!reader) {
        return this.download(url, filename)
      }

      const chunks: Uint8Array[] = []
      let received = 0

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          break
        }
        chunks.push(value)
        received += value.length

        const progress = total ? Math.round((received / total) * 100) : 0
        const entry = this.downloads.get(id)
        if (entry) {
          entry.progress = progress
        }
        onProgress?.(progress)
      }

      const blob = new Blob(chunks as BlobPart[])
      const base64 = await this.blobToBase64(blob)

      const { Filesystem, Directory } = await pluginOrchestrator.getFilesystem()
      await Filesystem.writeFile({
        path: `downloads/${filename}`,
        data: base64,
        directory: Directory.Documents,
        recursive: true,
      })

      const result = await Filesystem.getUri({ path: `downloads/${filename}`, directory: Directory.Documents })
      const entry = this.downloads.get(id)
      if (entry) {
        entry.status = 'completed'
      }

      return result.uri
    } catch {
      this.downloads.delete(id)
      return null
    }
  }

  cancelDownload(id: string): void {
    const entry = this.downloads.get(id)
    if (entry) {
      entry.controller.abort()
      entry.status = 'cancelled'
    }
  }

  getDownloadStatus(id: string): { progress: number; status: string } | null {
    const entry = this.downloads.get(id)
    return entry ? { progress: entry.progress, status: entry.status } : null
  }

  private async webDownload(url: string, filename: string): Promise<string | null> {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = objectUrl
      a.download = filename
      a.click()
      URL.revokeObjectURL(objectUrl)

      return objectUrl
    } catch {
      return null
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve((reader.result as string).split(',')[1])
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }
}

export const downloadManager = new DownloadManager()
