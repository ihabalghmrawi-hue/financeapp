import { pluginOrchestrator } from './plugin-orchestrator'

class ClipboardService {
  async copy(text: string): Promise<boolean> {
    try {
      const { Clipboard } = await pluginOrchestrator.getClipboard()
      await Clipboard.write({ string: text })
      return true
    } catch {
      try {
        await navigator.clipboard.writeText(text)
        return true
      } catch {
        return false
      }
    }
  }

  async paste(): Promise<string | null> {
    try {
      const { Clipboard } = await pluginOrchestrator.getClipboard()
      const result = await Clipboard.read()
      return result.value ?? null
    } catch {
      try {
        return await navigator.clipboard.readText()
      } catch {
        return null
      }
    }
  }

  async copyImage(base64: string): Promise<boolean> {
    try {
      const { Clipboard } = await pluginOrchestrator.getClipboard()
      await Clipboard.write({ image: base64 })
      return true
    } catch {
      return false
    }
  }

  async hasContent(): Promise<boolean> {
    try {
      const { Clipboard } = await pluginOrchestrator.getClipboard()
      await Clipboard.read()
      return true
    } catch {
      return false
    }
  }
}

export const clipboardService = new ClipboardService()
