import { environment } from '../production/environments'

export interface PinnedCertificate {
  hash: string
  algorithm: 'SHA-256'
  expiresAt?: string
}

class CertificatePinningService {
  private pinnedCerts: PinnedCertificate[] = []
  private initialized = false

  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }
    this.initialized = true

    this.pinnedCerts = environment.certPinningHashes.map((hash) => ({
      hash,
      algorithm: 'SHA-256',
    }))
  }

  getPinnedHashes(): string[] {
    return this.pinnedCerts.map((c) => c.hash)
  }

  async verifyConnection(url: string): Promise<boolean> {
    if (this.pinnedCerts.length === 0) {
      return true
    }

    try {
      const res = await fetch(url, { method: 'HEAD' })
      const certInfo = await this.extractCertInfo(res)
      return this.validateCertificate(certInfo)
    } catch {
      return false
    }
  }

  private async extractCertInfo(response: Response): Promise<{ hash: string } | null> {
    const ctHash = response.headers.get('X-Certificate-Hash')
    if (ctHash) {
      return { hash: ctHash }
    }
    return null
  }

  private validateCertificate(cert: { hash: string } | null): boolean {
    if (!cert) {
      return false
    }
    return this.pinnedCerts.some((pinned) => pinned.hash === cert.hash)
  }

  isPinningEnabled(): boolean {
    return this.pinnedCerts.length > 0
  }
}

export const certificatePinningService = new CertificatePinningService()
