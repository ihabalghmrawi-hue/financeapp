import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { forcedLogoutService } from '../operations/forced-logout'
import { maintenanceModeService } from '../operations/maintenance-mode'
import { initializeMobileServices, destroyMobileServices, isMobileServicesInitialized } from '../bootstrap'

beforeEach(() => {
  vi.useFakeTimers()
  const store: Record<string, string> = {}
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((k: string) => store[k] ?? null),
    setItem: vi.fn((k: string, v: string) => {
      store[k] = v
    }),
    removeItem: vi.fn((k: string) => {
      delete store[k]
    }),
    clear: vi.fn(() => {
      for (const k in store) {
        delete store[k]
      }
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
  })
  vi.stubGlobal('performance', { now: vi.fn(() => Date.now()) })
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('forcedLogoutService', () => {
  const userId = 'user-1'
  const sessionToken = 'token-123'

  it('notifies listeners on 401 response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ status: 401 } as Response)

    const listener = vi.fn()
    forcedLogoutService.onForcedLogout(listener)
    await forcedLogoutService.pollForLogout(userId, sessionToken)

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ code: 'session_expired' }))
  })

  it('notifies listeners on 403 response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      status: 403,
      json: () => Promise.resolve({ code: 'logged_out_elsewhere', message: 'تم تسجيل الخروج من جلسة أخرى' }),
    } as Response)

    const listener = vi.fn()
    forcedLogoutService.onForcedLogout(listener)
    await forcedLogoutService.pollForLogout(userId, sessionToken)

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ code: 'logged_out_elsewhere' }))
  })

  it('does not notify listeners on 200 response', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, status: 200 } as Response)

    const listener = vi.fn()
    forcedLogoutService.onForcedLogout(listener)
    await forcedLogoutService.pollForLogout(userId, sessionToken)

    expect(listener).not.toHaveBeenCalled()
  })

  it('does not throw on network error during poll', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

    const listener = vi.fn()
    forcedLogoutService.onForcedLogout(listener)
    await expect(forcedLogoutService.pollForLogout(userId, sessionToken)).resolves.toBeUndefined()
    expect(listener).not.toHaveBeenCalled()
  })

  it('clears local storage on forced logout', async () => {
    localStorage.setItem('session_token', sessionToken)
    localStorage.setItem('user_id', userId)
    localStorage.setItem('company_id', 'company-1')

    vi.mocked(fetch).mockResolvedValueOnce({ status: 401 } as Response)
    forcedLogoutService.onForcedLogout(vi.fn())
    await forcedLogoutService.pollForLogout(userId, sessionToken)

    expect(localStorage.getItem('session_token')).toBeNull()
    expect(localStorage.getItem('user_id')).toBeNull()
    expect(localStorage.getItem('company_id')).toBeNull()
  })

  it('supports unsubscribe', async () => {
    vi.mocked(fetch).mockResolvedValue({ status: 401 } as Response)

    const listener = vi.fn()
    const unsubscribe = forcedLogoutService.onForcedLogout(listener)
    unsubscribe()
    await forcedLogoutService.pollForLogout(userId, sessionToken)

    expect(listener).not.toHaveBeenCalled()
  })

  it('triggerLogout calls listener and hits logout endpoint', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response)

    const listener = vi.fn()
    forcedLogoutService.onForcedLogout(listener)
    await forcedLogoutService.triggerLogout({
      code: 'password_changed',
      message: 'تم تغيير كلمة المرور',
      timestamp: new Date().toISOString(),
    })

    expect(listener).toHaveBeenCalledTimes(1)
    expect(fetch).toHaveBeenCalledWith(
      '/api/auth/logout',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('password_changed'),
        keepalive: true,
      }),
    )
  })
})

describe('maintenanceModeService', () => {
  it('reports not under maintenance by default', () => {
    expect(maintenanceModeService.isUnderMaintenance()).toBe(false)
  })

  it('detects active maintenance on 503', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      status: 503,
      json: () => Promise.resolve({ message: 'تحت الصيانة', estimatedEnd: '2026-05-16T00:00:00Z', type: 'scheduled' }),
    } as Response)

    await maintenanceModeService.checkStatus()
    expect(maintenanceModeService.isUnderMaintenance()).toBe(true)
  })

  it('detects maintenance ended on 200', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, status: 200 } as Response)
    await maintenanceModeService.checkStatus()
    expect(maintenanceModeService.isUnderMaintenance()).toBe(false)
  })

  it('allows access when no maintenance', () => {
    expect(maintenanceModeService.canAccess()).toBe(true)
    expect(maintenanceModeService.canAccess('operator')).toBe(true)
  })

  it('restricts access during maintenance by role', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      status: 503,
      json: () => Promise.resolve({ allowedRoles: ['admin', 'super_admin'] }),
    } as Response)

    await maintenanceModeService.checkStatus()
    expect(maintenanceModeService.canAccess('operator')).toBe(false)
    expect(maintenanceModeService.canAccess('admin')).toBe(true)
    expect(maintenanceModeService.canAccess()).toBe(false)
  })

  it('notifies listeners on state change', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      status: 503,
      json: () => Promise.resolve({ message: 'تحت الصيانة' }),
    } as Response)

    const listener = vi.fn()
    maintenanceModeService.onMaintenanceChange(listener)
    await maintenanceModeService.checkStatus()

    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ active: true }))
  })

  it('startPeriodicCheck polls at interval', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, status: 200 } as Response)

    const listener = vi.fn()
    maintenanceModeService.onMaintenanceChange(listener)
    maintenanceModeService.startPeriodicCheck(1000)

    await vi.advanceTimersByTimeAsync(3000)
    expect(fetch).toHaveBeenCalledTimes(4)

    maintenanceModeService.stopPeriodicCheck()
  })

  it('stopPeriodicCheck clears interval', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, status: 200 } as Response)

    maintenanceModeService.startPeriodicCheck(1000)
    maintenanceModeService.stopPeriodicCheck()
    await vi.advanceTimersByTimeAsync(2000)

    expect(fetch).toHaveBeenCalledTimes(1)
  })
})

describe('bootstrap', () => {
  it('initializes all mobile services', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: () => Promise.resolve({}) } as Response)

    const statuses = await initializeMobileServices()
    expect(isMobileServicesInitialized()).toBe(true)

    const names = statuses.map((s) => s.name)
    expect(names).toContain('CrashReporter')
    expect(names).toContain('FeatureFlags')
    expect(names).toContain('CertificatePinning')
    expect(names).toContain('Telemetry')
    expect(names).toContain('PerformanceMonitor')
    expect(names).toContain('ForcedLogout')
    expect(names).toContain('RemoteConfig')
    expect(names).toContain('AppUpdate')
    expect(names).toContain('MaintenanceMode')
    expect(names).toContain('DeviceTrust')
    expect(statuses.every((s) => s.initialized)).toBe(true)
  })

  it('is idempotent on repeated calls', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: () => Promise.resolve({}) } as Response)

    const first = await initializeMobileServices()
    const second = await initializeMobileServices()
    expect(first).toEqual(second)
  })

  it('completes even when network is unavailable', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

    destroyMobileServices()
    const statuses = await initializeMobileServices()

    expect(statuses.every((s) => s.initialized)).toBe(true)
    expect(isMobileServicesInitialized()).toBe(true)
  })

  it('destroyMobileServices resets state', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: () => Promise.resolve({}) } as Response)

    await initializeMobileServices()
    expect(isMobileServicesInitialized()).toBe(true)

    destroyMobileServices()
    expect(isMobileServicesInitialized()).toBe(false)
  })
})
