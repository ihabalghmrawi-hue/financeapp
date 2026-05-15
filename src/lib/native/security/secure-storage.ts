import { pluginOrchestrator } from '../plugin-orchestrator'

const ENCRYPTION_KEY_PREFIX = 'native_enc_'

class SecureStorageService {
  async set(key: string, value: string): Promise<boolean> {
    try {
      const { Preferences } = await pluginOrchestrator.getPreferences()
      await Preferences.set({ key: `${ENCRYPTION_KEY_PREFIX}${key}`, value })
      return true
    } catch {
      try {
        localStorage.setItem(`${ENCRYPTION_KEY_PREFIX}${key}`, value)
        return true
      } catch {
        return false
      }
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      const { Preferences } = await pluginOrchestrator.getPreferences()
      const result = await Preferences.get({ key: `${ENCRYPTION_KEY_PREFIX}${key}` })
      return result.value ?? null
    } catch {
      return localStorage.getItem(`${ENCRYPTION_KEY_PREFIX}${key}`)
    }
  }

  async remove(key: string): Promise<boolean> {
    try {
      const { Preferences } = await pluginOrchestrator.getPreferences()
      await Preferences.remove({ key: `${ENCRYPTION_KEY_PREFIX}${key}` })
      return true
    } catch {
      localStorage.removeItem(`${ENCRYPTION_KEY_PREFIX}${key}`)
      return true
    }
  }

  async setJSON(key: string, value: any): Promise<boolean> {
    return this.set(key, JSON.stringify(value))
  }

  async getJSON<T = any>(key: string): Promise<T | null> {
    const value = await this.get(key)
    if (!value) {
      return null
    }
    try {
      return JSON.parse(value) as T
    } catch {
      return null
    }
  }

  async setSecureCredentials(server: string, credentials: { username: string; password: string }): Promise<boolean> {
    try {
      const { NativeBiometric } = await pluginOrchestrator.getBiometric()
      await NativeBiometric.setCredentials({
        server,
        username: credentials.username,
        password: credentials.password,
      })
      return true
    } catch {
      return this.setJSON(`credentials_${server}`, credentials)
    }
  }

  async getSecureCredentials(server: string): Promise<{ username: string; password: string } | null> {
    try {
      const { NativeBiometric } = await pluginOrchestrator.getBiometric()
      const result = await NativeBiometric.getCredentials({ server })
      return { username: result.username, password: result.password }
    } catch {
      return this.getJSON(`credentials_${server}`)
    }
  }

  async deleteSecureCredentials(server: string): Promise<boolean> {
    try {
      const { NativeBiometric } = await pluginOrchestrator.getBiometric()
      await NativeBiometric.deleteCredentials({ server })
      return true
    } catch {
      return this.remove(`credentials_${server}`)
    }
  }

  async clear(): Promise<boolean> {
    try {
      const { Preferences } = await pluginOrchestrator.getPreferences()
      const { keys } = await Preferences.keys()
      const pushKeys = keys.filter((k) => k.startsWith(ENCRYPTION_KEY_PREFIX))
      for (const k of pushKeys) {
        await Preferences.remove({ key: k })
      }
    } catch {
      /* ignore */
    }

    const keys = Object.keys(localStorage).filter((k) => k.startsWith(ENCRYPTION_KEY_PREFIX))
    keys.forEach((k) => localStorage.removeItem(k))
    return true
  }
}

export const secureStorageService = new SecureStorageService()
