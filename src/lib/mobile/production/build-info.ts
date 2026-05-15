export interface BuildInfo {
  environment: string
  version: string
  buildNumber: number
  buildTime: string
  gitHash: string
  crashReporting: boolean
  telemetry: boolean
  logging: boolean
  strictMode: boolean
}

class BuildInfoService {
  async getBuildInfo(): Promise<BuildInfo> {
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isNative) {
      try {
        const { Device } = await import('@capacitor/device')
        const info = await Device.getInfo()
        return {
          environment: process.env.NEXT_PUBLIC_BUILD_ENVIRONMENT ?? 'development',
          version: process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0',
          buildNumber: parseInt(process.env.NEXT_PUBLIC_BUILD_NUMBER ?? '1', 10),
          buildTime: process.env.NEXT_PUBLIC_BUILD_TIME ?? '',
          gitHash: process.env.NEXT_PUBLIC_GIT_HASH ?? '',
          crashReporting: process.env.NEXT_PUBLIC_ENABLE_CRASH_REPORTING === 'true',
          telemetry: process.env.NEXT_PUBLIC_ENABLE_TELEMETRY === 'true',
          logging: process.env.NEXT_PUBLIC_ENABLE_LOGGING !== 'false',
          strictMode: process.env.NEXT_PUBLIC_ENABLE_STRICT_MODE === 'true',
        }
      } catch {
        return this.webFallback()
      }
    }
    return this.webFallback()
  }

  private webFallback(): BuildInfo {
    const ua = navigator.userAgent
    return {
      environment: 'web',
      version: '1.0.0',
      buildNumber: 1,
      buildTime: new Date().toISOString(),
      gitHash: '',
      crashReporting: false,
      telemetry: false,
      logging: true,
      strictMode: false,
    }
  }
}

export const buildInfoService = new BuildInfoService()
