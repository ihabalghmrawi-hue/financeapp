class ScreenshotProtectionService {
  private protected = false
  private listeners: Set<(captured: boolean) => void> = new Set()
  private visibilityHandler: (() => void) | null = null

  on(callback: (captured: boolean) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  async enable(): Promise<void> {
    if (this.protected) {
      return
    }
    this.protected = true

    if (typeof document === 'undefined') {
      return
    }

    if ('android' in window) {
      try {
        const { StatusBar } = await import('@capacitor/status-bar')
        await StatusBar.setOverlaysWebView({ overlay: true })
      } catch {
        /* ignore */
      }
    }

    this.visibilityHandler = () => {
      if (document.hidden) {
        this.listeners.forEach((l) => l(true))
      }
    }
    document.addEventListener('visibilitychange', this.visibilityHandler)

    document.addEventListener('copy', (e) => {
      if (this.protected) {
        e.preventDefault()
      }
    })

    document.addEventListener('contextmenu', (e) => {
      if (this.protected) {
        e.preventDefault()
      }
    })
  }

  async disable(): Promise<void> {
    this.protected = false
    if (this.visibilityHandler) {
      document.removeEventListener('visibilitychange', this.visibilityHandler)
      this.visibilityHandler = null
    }
  }

  isProtected(): boolean {
    return this.protected
  }

  async hideContent(element: HTMLElement): Promise<void> {
    element.style.filter = 'blur(8px)'
    element.style.userSelect = 'none'
    element.style.webkitUserSelect = 'none'
  }

  async showContent(element: HTMLElement): Promise<void> {
    element.style.filter = ''
    element.style.userSelect = ''
    element.style.webkitUserSelect = ''
  }

  async protectElement(element: HTMLElement): Promise<() => void> {
    const origVisibility = element.style.visibility
    const handler = () => {
      element.style.visibility = document.hidden ? 'hidden' : origVisibility
    }
    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }
}

export const screenshotProtectionService = new ScreenshotProtectionService()
