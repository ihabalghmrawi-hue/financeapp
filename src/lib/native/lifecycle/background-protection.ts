import { screenshotProtectionService } from '../security/screenshot-protection'
import { biometricLockService } from '../security/biometric-lock'
import { appLifecycleManager } from './app-lifecycle'

class BackgroundProtectionService {
  private protected = false
  private overlay: HTMLDivElement | null = null

  async enable(lockOnBackground = true, blurContent = true): Promise<void> {
    if (this.protected) {
      return
    }
    this.protected = true

    if (blurContent) {
      this.createOverlay()
    }

    appLifecycleManager.on((state) => {
      if (state.isBackground) {
        if (lockOnBackground) {
          biometricLockService.lock()
        }
        if (blurContent) {
          this.showOverlay()
        }
      } else if (state.isActive && state.previousState === 'background') {
        if (blurContent) {
          this.hideOverlay()
        }
      }
    })
  }

  disable(): void {
    this.protected = false
    this.removeOverlay()
  }

  isProtected(): boolean {
    return this.protected
  }

  private createOverlay(): void {
    if (this.overlay) {
      return
    }
    this.overlay = document.createElement('div')
    this.overlay.id = 'background-protection-overlay'
    Object.assign(this.overlay.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '99999',
      backgroundColor: 'white',
      display: 'none',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '16px',
      direction: 'rtl',
    } as CSSStyleDeclaration)

    const logo = document.createElement('div')
    logo.textContent = 'Ezy'
    Object.assign(logo.style, {
      fontSize: '32px',
      fontWeight: 'bold',
      color: '#2563eb',
    })

    const text = document.createElement('div')
    text.textContent = 'التطبيق مقفل'
    Object.assign(text.style, {
      fontSize: '16px',
      color: '#6b7280',
    })

    this.overlay.appendChild(logo)
    this.overlay.appendChild(text)
    document.body.appendChild(this.overlay)
  }

  private showOverlay(): void {
    if (this.overlay) {
      this.overlay.style.display = 'flex'
    }
  }

  private hideOverlay(): void {
    if (this.overlay) {
      this.overlay.style.display = 'none'
    }
  }

  private removeOverlay(): void {
    if (this.overlay) {
      this.overlay.remove()
      this.overlay = null
    }
  }
}

export const backgroundProtectionService = new BackgroundProtectionService()
