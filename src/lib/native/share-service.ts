import { pluginOrchestrator } from './plugin-orchestrator'
import type { NativeShareOptions } from './types'

class ShareService {
  async share(options: NativeShareOptions): Promise<boolean> {
    try {
      const { Share } = await pluginOrchestrator.getShare()
      await Share.share({
        title: options.title,
        text: options.text,
        url: options.url,
        files: options.files,
        dialogTitle: options.dialogTitle,
      })
      return true
    } catch {
      return this.webShare(options)
    }
  }

  async shareText(text: string, title?: string): Promise<boolean> {
    return this.share({ text, title })
  }

  async shareUrl(url: string, title?: string): Promise<boolean> {
    return this.share({ url, title })
  }

  async shareFile(path: string, title?: string): Promise<boolean> {
    return this.share({ files: [path], title })
  }

  async sharePDF(path: string, filename: string): Promise<boolean> {
    return this.share({ files: [path], title: filename })
  }

  async canShare(): Promise<boolean> {
    try {
      const { Share } = await pluginOrchestrator.getShare()
      return true
    } catch {
      return 'share' in navigator
    }
  }

  private async webShare(options: NativeShareOptions): Promise<boolean> {
    try {
      const shareData: Record<string, any> = {}
      if (options.text) {
        shareData.text = options.text
      }
      if (options.url) {
        shareData.url = options.url
      }
      if (options.title) {
        shareData.title = options.title
      }

      await navigator.share(shareData)
      return true
    } catch {
      return false
    }
  }
}

export const shareService = new ShareService()
