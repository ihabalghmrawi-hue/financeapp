export interface AppVersion {
  current: string
  build: number
  stage: 'stable' | 'alpha' | 'beta' | 'rc'
  full: string
}

export interface VersionCheckResult {
  updateAvailable: boolean
  required: boolean
  latestVersion: string
  latestBuild: number
  downloadUrl?: string
  releaseNotes?: string
  updateType?: 'patch' | 'minor' | 'major'
}

export interface ChangelogEntry {
  version: string
  date: string
  type: 'feature' | 'fix' | 'enhancement' | 'security' | 'breaking'
  description: string
  ticketUrl?: string
}

class VersionManager {
  private versionUrl = '/api/mobile/version'
  private changelogUrl = '/api/mobile/changelog'

  async getCurrentVersion(): Promise<AppVersion> {
    try {
      const res = await fetch('/version.json')
      if (!res.ok) {
        throw new Error('Version file not found')
      }
      const data = await res.json()
      return {
        current: data.version,
        build: data.build,
        stage: data.stage,
        full: data.full ?? data.version,
      }
    } catch {
      return {
        current: '1.0.0',
        build: 1,
        stage: 'stable',
        full: '1.0.0',
      }
    }
  }

  async checkForUpdate(): Promise<VersionCheckResult | null> {
    try {
      const current = await this.getCurrentVersion()
      const res = await fetch(this.versionUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentVersion: current.current,
          currentBuild: current.build,
        }),
      })
      if (!res.ok) {
        return null
      }
      return await res.json()
    } catch {
      return null
    }
  }

  async getChangelog(sinceVersion?: string): Promise<ChangelogEntry[]> {
    try {
      const params = sinceVersion ? `?since=${sinceVersion}` : ''
      const res = await fetch(`${this.changelogUrl}${params}`)
      if (!res.ok) {
        return []
      }
      return await res.json()
    } catch {
      return []
    }
  }

  async getReleaseNotes(version: string): Promise<ChangelogEntry[]> {
    try {
      const res = await fetch(`${this.changelogUrl}/${version}`)
      if (!res.ok) {
        return []
      }
      return await res.json()
    } catch {
      return []
    }
  }

  compareVersions(a: string, b: string): -1 | 0 | 1 {
    const pa = a.split('.').map(Number)
    const pb = b.split('.').map(Number)
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const na = pa[i] || 0
      const nb = pb[i] || 0
      if (na > nb) {
        return 1
      }
      if (na < nb) {
        return -1
      }
    }
    return 0
  }

  getUpdateType(current: string, latest: string): 'patch' | 'minor' | 'major' {
    const ca = current.split('.').map(Number)
    const la = latest.split('.').map(Number)
    if (la[0] > ca[0]) {
      return 'major'
    }
    if (la[1] > ca[1]) {
      return 'minor'
    }
    return 'patch'
  }
}

export const versionManager = new VersionManager()
