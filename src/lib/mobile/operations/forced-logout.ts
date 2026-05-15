export interface LogoutReason {
  code:
    | 'session_expired'
    | 'logged_out_elsewhere'
    | 'password_changed'
    | 'account_disabled'
    | 'admin_action'
    | 'version_deprecated'
  message: string
  timestamp: string
}

type LogoutListener = (reason: LogoutReason) => void

class ForcedLogoutService {
  private listeners: LogoutListener[] = []
  private endpoint = '/api/mobile/logout-event'

  onForcedLogout(listener: LogoutListener): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  async pollForLogout(userId: string, sessionToken: string): Promise<void> {
    try {
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, sessionToken }),
      })

      if (res.status === 401) {
        const reason: LogoutReason = {
          code: 'session_expired',
          message: 'انتهت صلاحية الجلسة',
          timestamp: new Date().toISOString(),
        }
        this.handleLogout(reason)
        return
      }

      if (res.status === 403) {
        const data = await res.json().catch(() => ({}))
        const reason: LogoutReason = {
          code: data.code ?? 'logged_out_elsewhere',
          message: data.message ?? 'تم تسجيل الخروج من جلسة أخرى',
          timestamp: new Date().toISOString(),
        }
        this.handleLogout(reason)
      }
    } catch {
      /* ignore */
    }
  }

  async triggerLogout(reason: LogoutReason): Promise<void> {
    this.handleLogout(reason)
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.code }),
        keepalive: true,
      })
    } catch {
      /* ignore */
    }
  }

  private handleLogout(reason: LogoutReason): void {
    try {
      localStorage.removeItem('session_token')
      localStorage.removeItem('user_id')
      localStorage.removeItem('company_id')
    } catch {
      /* ignore */
    }

    this.listeners.forEach((l) => l(reason))
  }
}

export const forcedLogoutService = new ForcedLogoutService()
