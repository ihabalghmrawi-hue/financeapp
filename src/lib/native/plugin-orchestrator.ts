class PluginOrchestrator {
  private loaded = new Map<string, any>()
  private _ready = false

  async ready(): Promise<void> {
    if (this._ready) {
      return
    }
    this._ready = true
  }

  async load<T>(loader: () => Promise<T>, name: string): Promise<T> {
    if (this.loaded.has(name)) {
      return this.loaded.get(name) as T
    }
    const plugin = await loader()
    this.loaded.set(name, plugin)
    return plugin
  }

  isAvailable(name: string): boolean {
    return this.loaded.has(name)
  }

  async getCamera() {
    return this.load(() => import('@capacitor/camera'), 'camera')
  }

  async getFilesystem() {
    return this.load(() => import('@capacitor/filesystem'), 'filesystem')
  }

  async getShare() {
    return this.load(() => import('@capacitor/share'), 'share')
  }

  async getDevice() {
    return this.load(() => import('@capacitor/device'), 'device')
  }

  async getClipboard() {
    return this.load(() => import('@capacitor/clipboard'), 'clipboard')
  }

  async getHaptics() {
    return this.load(() => import('@capacitor/haptics'), 'haptics')
  }

  async getDialog() {
    return this.load(() => import('@capacitor/dialog'), 'dialog')
  }

  async getToast() {
    return this.load(() => import('@capacitor/toast'), 'toast')
  }

  async getPreferences() {
    return this.load(() => import('@capacitor/preferences'), 'preferences')
  }

  async getBiometric() {
    return this.load(() => import('capacitor-native-biometric'), 'biometric')
  }

  async getBarcodeScanner() {
    return this.load(() => import('@capacitor-mlkit/barcode-scanning'), 'barcode')
  }

  async getApp() {
    return this.load(() => import('@capacitor/app'), 'app')
  }

  async getNetwork() {
    return this.load(() => import('@capacitor/network'), 'network')
  }

  async getStatusBar() {
    return this.load(() => import('@capacitor/status-bar'), 'statusBar')
  }

  async getKeyboard() {
    return this.load(() => import('@capacitor/keyboard'), 'keyboard')
  }
}

export const pluginOrchestrator = new PluginOrchestrator()
