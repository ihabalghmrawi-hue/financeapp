export interface ScreenshotProtectionConfig {
  enabled: boolean
  blurOnBackground: boolean
  clearClipboardOnBackground: boolean
  maskSensitiveFields: boolean
  notifyOnScreenshot: boolean
}

type ProtectionListener = (event: ScreenshotProtectionEvent) => void

export interface ScreenshotProtectionEvent {
  type: 'screenshot' | 'screen_record' | 'background' | 'clipboard_read'
  timestamp: string
  details?: string
}

class ScreenshotProtectionService {
  private listeners: ProtectionListener[] = []
  private config: ScreenshotProtectionConfig = {
    enabled: true,
    blurOnBackground: true,
    clearClipboardOnBackground: true,
    maskSensitiveFields: true,
    notifyOnScreenshot: true,
  }
  private initialized = false
  private visibilityHandler: (() => void) | null = null

  initialize(config?: Partial<ScreenshotProtectionConfig>): void {
    if (this.initialized) {
      return
    }
    this.initialized = true

    if (config) {
      this.config = { ...this.config, ...config }
    }

    if (!this.config.enabled) {
      return
    }

    this.handleVisibilityChange()
    this.suppressScreenshotGestures()
  }

  destroy(): void {
    if (this.visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityHandler)
      this.visibilityHandler = null
    }
    this.initialized = false
  }

  setConfig(config: Partial<ScreenshotProtectionConfig>): void {
    this.config = { ...this.config, ...config }
  }

  onProtectionEvent(listener: ProtectionListener): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private handleVisibilityChange(): void {
    if (typeof document === 'undefined') {
      return
    }
    this.visibilityHandler = () => {
      if (document.hidden && this.config.blurOnBackground) {
        this.emitEvent('background', 'التطبيق في الخلفية')
        if (this.config.clearClipboardOnBackground) {
          this.clearClipboard()
        }
      }
    }
    document.addEventListener('visibilitychange', this.visibilityHandler)
  }

  private suppressScreenshotGestures(): void {
    if (typeof document === 'undefined') {
      return
    }
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (
        e.key === 'PrintScreen' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'S' || e.key === 's')) ||
        (e.metaKey && e.shiftKey && (e.key === 'S' || e.key === 's')) ||
        (e.ctrlKey && e.key === 'p')
      ) {
        if (this.config.notifyOnScreenshot) {
          this.emitEvent('screenshot', 'تم اكتشاف محاولة تصوير')
        }
      }
    })

    document.addEventListener('contextmenu', (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target && target.closest('[data-sensitive="true"]')) {
        e.preventDefault()
      }
    })
  }

  async clearClipboard(): Promise<void> {
    try {
      await navigator.clipboard.writeText('')
    } catch {}
  }

  isSensitiveField(element: HTMLElement): boolean {
    return (
      element.hasAttribute('data-sensitive') ||
      element.getAttribute('autocomplete') === 'off' ||
      (element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'password')
    )
  }

  maskValue(value: string): string {
    if (!this.config.maskSensitiveFields) {
      return value
    }
    return '\u2022'.repeat(Math.min(value.length, 12))
  }

  private emitEvent(type: ScreenshotProtectionEvent['type'], details?: string): void {
    const event: ScreenshotProtectionEvent = {
      type,
      timestamp: new Date().toISOString(),
      details,
    }
    this.listeners.forEach((l) => l(event))
  }
}

export const screenshotProtectionService = new ScreenshotProtectionService()
