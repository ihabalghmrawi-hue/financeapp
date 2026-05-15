'use client'

import type { EncryptedBlob } from './database'
import { getFromStore, putInStore, deleteFromStore, getAllFromIndex, clearStore } from './database'

const ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const STORAGE_KEY = 'erp-encryption-key'

async function getOrCreateKey(): Promise<CryptoKey> {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    const raw = Uint8Array.from(atob(stored), (c) => c.charCodeAt(0))
    return crypto.subtle.importKey('raw', raw, ALGORITHM, false, ['encrypt', 'decrypt'])
  }

  const key = await crypto.subtle.generateKey({ name: ALGORITHM, length: KEY_LENGTH }, true, ['encrypt', 'decrypt'])
  const exported = await crypto.subtle.exportKey('raw', key)
  const b64 = btoa(String.fromCharCode(...new Uint8Array(exported)))
  localStorage.setItem(STORAGE_KEY, b64)
  return key
}

export class EncryptedStore {
  private keyPromise: Promise<CryptoKey> | null = null

  private getKey(): Promise<CryptoKey> {
    if (!this.keyPromise) {
      this.keyPromise = getOrCreateKey()
    }
    return this.keyPromise
  }

  async set(namespace: string, id: string, value: unknown): Promise<void> {
    const key = await this.getKey()
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encoded = new TextEncoder().encode(JSON.stringify(value))

    const encrypted = await crypto.subtle.encrypt({ name: ALGORITHM, iv }, key, encoded)

    const blob: EncryptedBlob = {
      id: `${namespace}:${id}`,
      namespace,
      iv: btoa(String.fromCharCode(...iv)),
      data: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
      created_at: Date.now(),
    }

    await putInStore('encrypted', blob)
  }

  async get<T>(namespace: string, id: string): Promise<T | null> {
    const blob = await getFromStore<EncryptedBlob>('encrypted', `${namespace}:${id}`)
    if (!blob) {
      return null
    }

    try {
      const key = await this.getKey()
      const iv = Uint8Array.from(atob(blob.iv), (c) => c.charCodeAt(0))
      const encrypted = Uint8Array.from(atob(blob.data), (c) => c.charCodeAt(0))

      const decrypted = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, encrypted)

      return JSON.parse(new TextDecoder().decode(decrypted)) as T
    } catch {
      return null
    }
  }

  async delete(namespace: string, id: string): Promise<void> {
    await deleteFromStore('encrypted', `${namespace}:${id}`)
  }

  async clearNamespace(namespace: string): Promise<void> {
    const entries = await getAllFromIndex<EncryptedBlob>('encrypted', 'namespace', namespace)
    for (const entry of entries) {
      await deleteFromStore('encrypted', entry.id)
    }
  }

  async clearAll(): Promise<void> {
    await clearStore('encrypted')
  }
}

export const encryptedStore = new EncryptedStore()
