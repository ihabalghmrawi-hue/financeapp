import { pluginOrchestrator } from './plugin-orchestrator'

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection'

class HapticsService {
  async impact(type: HapticType = 'medium'): Promise<void> {
    try {
      const { Haptics, ImpactStyle } = await pluginOrchestrator.getHaptics()
      const styleMap: Record<string, any> = {
        light: ImpactStyle.Light,
        medium: ImpactStyle.Medium,
        heavy: ImpactStyle.Heavy,
      }
      if (styleMap[type]) {
        await Haptics.impact({ style: styleMap[type] })
      } else if (type === 'selection') {
        await Haptics.selectionStart()
        await Haptics.selectionEnd()
      } else {
        await Haptics.impact({ style: ImpactStyle.Medium })
      }
    } catch {
      this.fallbackVibrate(type)
    }
  }

  async success(): Promise<void> {
    await this.impact('light')
    await new Promise((r) => setTimeout(r, 50))
    await this.impact('light')
  }

  async warning(): Promise<void> {
    await this.impact('heavy')
    await new Promise((r) => setTimeout(r, 100))
    await this.impact('heavy')
  }

  async error(): Promise<void> {
    await this.impact('heavy')
    await new Promise((r) => setTimeout(r, 150))
    await this.impact('heavy')
    await new Promise((r) => setTimeout(r, 150))
    await this.impact('heavy')
  }

  async selection(): Promise<void> {
    await this.impact('selection')
  }

  async vibrate(durationMs = 50): Promise<void> {
    try {
      const { Haptics } = await pluginOrchestrator.getHaptics()
      await Haptics.vibrate({ duration: durationMs })
    } catch {
      this.fallbackVibrate('medium')
    }
  }

  private fallbackVibrate(type: HapticType): void {
    try {
      if (navigator.vibrate) {
        const patterns: Record<string, number | number[]> = {
          light: 10,
          medium: 25,
          heavy: 50,
          success: [10, 30, 10],
          warning: [25, 50, 25],
          error: [50, 80, 50, 80, 50],
          selection: 5,
        }
        navigator.vibrate(patterns[type] ?? 25)
      }
    } catch {
      /* ignore */
    }
  }
}

export const hapticsService = new HapticsService()
