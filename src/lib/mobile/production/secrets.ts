import { environment } from './environments'

export interface SecretEntry {
  key: string
  value: string
  source: 'env' | 'remote_config' | 'build_config'
  expiresAt?: number
}

class SecretsManager {
  private secrets: Map<string, SecretEntry> = new Map()
  private encryptionKey: string | null = null
  private initialized = false

  initialize(): void {
    if (this.initialized) {
      return
    }
    this.initialized = true

    this.encryptionKey = this.deriveEncryptionKey()
    this.loadBuildSecrets()
  }

  get(key: string): string | null {
    const entry = this.secrets.get(key)
    if (!entry) {
      return null
    }

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.secrets.delete(key)
      return null
    }

    return entry.value
  }

  set(key: string, value: string, source: SecretEntry['source'] = 'remote_config', ttlMs?: number): void {
    this.secrets.set(key, {
      key,
      value,
      source,
      expiresAt: ttlMs ? Date.now() + ttlMs : undefined,
    })
  }

  has(key: string): boolean {
    return this.secrets.has(key)
  }

  remove(key: string): void {
    this.secrets.delete(key)
  }

  clear(): void {
    this.secrets.clear()
  }

  getApiKey(name: string): string | null {
    return this.get(`api_key_${name}`)
  }

  getApiSecret(name: string): string | null {
    return this.get(`api_secret_${name}`)
  }

  getEncryptionKey(): string | null {
    return this.encryptionKey
  }

  redactSensitiveStrings(input: string): string {
    let result = input
    for (const [, entry] of this.secrets) {
      if (entry.value.length >= 4) {
        const regex = new RegExp(entry.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
        result = result.replace(regex, '***')
      }
    }
    return result
  }

  private deriveEncryptionKey(): string {
    try {
      const stored = localStorage.getItem('encryption_key_salt')
      if (!stored) {
        const salt = this.generateSalt()
        localStorage.setItem('encryption_key_salt', salt)
        return this.hashWithSalt(environment.supabaseAnonKey || 'default_key', salt)
      }
      return this.hashWithSalt(environment.supabaseAnonKey || 'default_key', stored)
    } catch {
      return 'default_encryption_key'
    }
  }

  private loadBuildSecrets(): void {
    const envSource: SecretEntry['source'] = 'env'

    if (environment.fcmServerKey) {
      this.secrets.set('fcm_server_key', {
        key: 'fcm_server_key',
        value: environment.fcmServerKey,
        source: envSource,
      })
    }

    if (environment.sentryDsn) {
      this.secrets.set('sentry_dsn', {
        key: 'sentry_dsn',
        value: environment.sentryDsn,
        source: envSource,
      })
    }

    try {
      const apiKeys = localStorage.getItem('api_keys')
      if (apiKeys) {
        const parsed = JSON.parse(apiKeys)
        for (const [key, value] of Object.entries(parsed)) {
          this.secrets.set(key, {
            key,
            value: String(value),
            source: 'remote_config',
          })
        }
      }
    } catch {}
  }

  private generateSalt(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let salt = ''
    for (let i = 0; i < 16; i++) {
      salt += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return salt
  }

  private hashWithSalt(input: string, salt: string): string {
    let hash = 0
    const combined = salt + input + salt
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash |= 0
    }
    return Math.abs(hash).toString(36)
  }
}

export const secretsManager = new SecretsManager()
