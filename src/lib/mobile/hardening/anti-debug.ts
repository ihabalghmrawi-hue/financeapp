export interface AntiDebugState {
  debuggerDetected: boolean
  devToolsOpen: boolean
  consoleHooked: boolean
  sourceMapped: boolean
  lastCheck: string
}

type AntiDebugListener = (state: AntiDebugState) => void

class AntiDebugService {
  private listeners: AntiDebugListener[] = []
  private state: AntiDebugState = {
    debuggerDetected: false,
    devToolsOpen: false,
    consoleHooked: false,
    sourceMapped: false,
    lastCheck: new Date().toISOString(),
  }
  private checkInterval: ReturnType<typeof setInterval> | null = null
  private initialized = false

  initialize(): void {
    if (this.initialized) {
      return
    }
    this.initialized = true

    this.hookConsole()
    this.checkDevTools()
    this.checkSourceMaps()

    this.checkInterval = setInterval(() => {
      this.checkDevTools()
    }, 2000)

    if (typeof window !== 'undefined' && window.WeakRef) {
      const checker = () => {
        const diff = performance.now() - 100
        const start = performance.now()
        debugger
        const end = performance.now()
        if (end - start > diff + 100) {
          this.state.debuggerDetected = true
          this.notify()
        }
      }

      setInterval(checker, 4000)
    }
  }

  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    this.initialized = false
  }

  isDebuggerDetected(): boolean {
    return this.state.debuggerDetected
  }

  getState(): AntiDebugState {
    return { ...this.state }
  }

  onDetection(listener: AntiDebugListener): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private checkDevTools(): void {
    if (typeof window === 'undefined') {
      return
    }
    const threshold = 160
    const width = window.outerWidth - window.innerWidth
    const height = window.outerHeight - window.innerHeight
    const detected = width > threshold || height > threshold || width < 0 || height < 0

    if (detected !== this.state.devToolsOpen) {
      this.state.devToolsOpen = detected
      this.state.lastCheck = new Date().toISOString()
      this.notify()
    }
  }

  private hookConsole(): void {
    const methods: Array<'log' | 'warn' | 'error' | 'info' | 'debug'> = ['log', 'warn', 'error', 'info', 'debug']
    for (const method of methods) {
      const original = console[method]
      console[method] = (...args: any[]) => {
        if (this.state.consoleHooked) {
          return
        }
        original.apply(console, args)
      }
    }
  }

  private checkSourceMaps(): void {
    if (typeof window === 'undefined') {
      return
    }
    try {
      const err = new Error()
      if (err.stack) {
        const hasSourceMap =
          err.stack.includes('webpack://') || err.stack.includes('webpack-internal://') || err.stack.includes('src/')
        this.state.sourceMapped = hasSourceMap
      }
    } catch {
      this.state.sourceMapped = false
    }
  }

  private notify(): void {
    this.listeners.forEach((l) => l(this.state))
  }
}

export const antiDebugService = new AntiDebugService()
