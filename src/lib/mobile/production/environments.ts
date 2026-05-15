export type BuildEnvironment = 'development' | 'staging' | 'production'

export interface EnvironmentConfig {
  apiUrl: string
  supabaseUrl: string
  supabaseAnonKey: string
  fcmServerKey: string
  appVersion: string
  buildNumber: number
  enableCrashReporting: boolean
  enableTelemetry: boolean
  enableLogging: boolean
  enableStrictMode: boolean
  sentryDsn?: string
  appCenterSecret?: string
  certPinningHashes: string[]
  appLinksHost?: string
  updateCheckIntervalMs: number
  syncCheckIntervalMs: number
  telemetrySampleRate: number
  minimumAppVersion: string
  minimumAppBuild: number
  upgradeGracePeriodDays: number
  rolloutDefaultPercentage: number
  maintenanceCheckIntervalMs: number
  logoutPollIntervalMs: number
}

const PRODUCTION: EnvironmentConfig = {
  apiUrl: 'https://api.ezyerp.com',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
  fcmServerKey: process.env.FCM_SERVER_KEY ?? '',
  appVersion: '1.0.0',
  buildNumber: 1,
  enableCrashReporting: true,
  enableTelemetry: true,
  enableLogging: false,
  enableStrictMode: false,
  sentryDsn: process.env.SENTRY_DSN,
  appCenterSecret: process.env.APPCENTER_SECRET,
  // TODO: Replace with actual SHA-256 hashes of production TLS certificates before going live
  // Generate via: openssl s_client -connect api.ezyerp.com:443 | openssl x509 -pubkey | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | openssl base64
  certPinningHashes: [],
  appLinksHost: 'app.ezyerp.com',
  updateCheckIntervalMs: 3600000,
  syncCheckIntervalMs: 30000,
  telemetrySampleRate: 0.1,
  minimumAppVersion: '1.0.0',
  minimumAppBuild: 1,
  upgradeGracePeriodDays: 7,
  rolloutDefaultPercentage: 25,
  maintenanceCheckIntervalMs: 60000,
  logoutPollIntervalMs: 30000,
}

const STAGING: EnvironmentConfig = {
  ...PRODUCTION,
  apiUrl: 'https://staging-api.ezyerp.com',
  appLinksHost: 'staging.app.ezyerp.com',
  enableCrashReporting: false,
  enableTelemetry: true,
  enableLogging: true,
  enableStrictMode: false,
  appCenterSecret: process.env.APPCENTER_STAGING_SECRET,
  telemetrySampleRate: 1.0,
  rolloutDefaultPercentage: 50,
}

const DEVELOPMENT: EnvironmentConfig = {
  ...PRODUCTION,
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000',
  appLinksHost: 'localhost',
  enableCrashReporting: false,
  enableTelemetry: false,
  enableLogging: true,
  enableStrictMode: true,
  certPinningHashes: [],
  telemetrySampleRate: 1.0,
  upgradeGracePeriodDays: 30,
  rolloutDefaultPercentage: 100,
}

const env = (process.env.NEXT_PUBLIC_BUILD_ENVIRONMENT ?? 'development') as BuildEnvironment

const configs: Record<BuildEnvironment, EnvironmentConfig> = {
  development: DEVELOPMENT,
  staging: STAGING,
  production: PRODUCTION,
}

export const environment = configs[env]

export function getEnvironment(): BuildEnvironment {
  return env
}

export function isProduction(): boolean {
  return env === 'production'
}

export function isStaging(): boolean {
  return env === 'staging'
}

export function isDevelopment(): boolean {
  return env === 'development'
}
