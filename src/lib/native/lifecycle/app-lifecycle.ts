import { pluginOrchestrator } from '../plugin-orchestrator'
import type { AppLifecycleState } from '../types'

class AppLifecycleManager {
  private state: AppLifecycleState = {
    isActive: typeof document !== 'undefined' && !document.hidden,
    isForeground: true,
    isBackground: false,
    previousState: 'active',
    enteredAt: new Date().toISOString(),
  }

  private listeners: Set<(state: AppLifecycleState) => void> = new Set()

  get currentState(): AppLifecycleState {
    return { ...this.state }
  }
  get isActive(): boolean {
    return this.state.isActive
  }
  get isForeground(): boolean {
    return this.state.isForeground
  }
  get isBackground(): boolean {
    return this.state.isBackground
  }

  on(callback: (state: AppLifecycleState) => void): () => void {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  async initialize(): Promise<void> {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.transitionTo('background')
      } else {
        this.transitionTo('active')
      }
    })

    window.addEventListener('focus', () => this.transitionTo('active'))
    window.addEventListener('blur', () => this.transitionTo('inactive'))

    try {
      const { App } = await pluginOrchestrator.getApp()
      App.addListener('appStateChange', (change: any) => {
        if (change.isActive) {
          this.transitionTo('active')
        } else {
          this.transitionTo('background')
        }
      })
    } catch {
      /* not in capacitor */
    }
  }

  private transitionTo(newState: 'active' | 'inactive' | 'background'): void {
    const prev = this.state.isActive ? 'active' : this.state.isBackground ? 'background' : 'inactive'
    if (prev === newState) {
      return
    }

    this.state = {
      ...this.state,
      isActive: newState === 'active',
      isForeground: newState !== 'background',
      isBackground: newState === 'background',
      previousState: prev,
      enteredAt: new Date().toISOString(),
    }
    this.listeners.forEach((l) => l(this.state))
  }

  async onResume(callback: () => void): Promise<() => void> {
    const unsub = this.on((state) => {
      if (state.isActive && state.previousState === 'background') {
        callback()
      }
    })
    return unsub
  }

  async onBackground(callback: () => void): Promise<() => void> {
    const unsub = this.on((state) => {
      if (state.isBackground) {
        callback()
      }
    })
    return unsub
  }

  async onForeground(callback: () => void): Promise<() => void> {
    const unsub = this.on((state) => {
      if (state.isActive && !state.isBackground) {
        callback()
      }
    })
    return unsub
  }

  destroy(): void {
    this.listeners.clear()
  }
}

export const appLifecycleManager = new AppLifecycleManager()
