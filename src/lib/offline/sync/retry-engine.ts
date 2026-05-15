'use client'

export type RetryStrategy = 'linear' | 'exponential' | 'fibonacci' | 'immediate'

export interface RetryConfig {
  strategy: RetryStrategy
  maxAttempts: number
  baseDelayMs: number
  maxDelayMs: number
  jitter: boolean
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  strategy: 'exponential',
  maxAttempts: 5,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  jitter: true,
}

export function calculateDelay(attempt: number, config: RetryConfig): number {
  let delay: number

  switch (config.strategy) {
    case 'linear':
      delay = config.baseDelayMs * attempt
      break
    case 'exponential':
      delay = config.baseDelayMs * Math.pow(2, attempt - 1)
      break
    case 'fibonacci': {
      const fib = (n: number): number => (n <= 1 ? n : fib(n - 1) + fib(n - 2))
      delay = config.baseDelayMs * fib(Math.min(attempt + 2, 20))
      break
    }
    case 'immediate':
      delay = 0
      break
    default:
      delay = config.baseDelayMs * attempt
  }

  delay = Math.min(delay, config.maxDelayMs)

  if (config.jitter) {
    const jitterRange = delay * 0.2
    delay = delay + (Math.random() * jitterRange * 2 - jitterRange)
    delay = Math.max(0, delay)
  }

  return Math.round(delay)
}

export class RetryEngine {
  private attempts = new Map<string, number>()

  async execute<T>(id: string, operation: () => Promise<T>, config: Partial<RetryConfig> = {}): Promise<T> {
    const fullConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
    const currentAttempt = this.attempts.get(id) ?? 0

    try {
      const result = await operation()
      this.attempts.delete(id)
      return result
    } catch (error: any) {
      const nextAttempt = currentAttempt + 1
      this.attempts.set(id, nextAttempt)

      if (nextAttempt >= fullConfig.maxAttempts) {
        this.attempts.delete(id)
        throw error
      }

      const delay = calculateDelay(nextAttempt, fullConfig)
      await new Promise((resolve) => setTimeout(resolve, delay))

      return this.execute(id, operation, fullConfig)
    }
  }

  async executeWithBackoff<T>(
    operation: () => Promise<T>,
    onRetry?: (attempt: number, error: Error) => void,
    config: Partial<RetryConfig> = {},
  ): Promise<T> {
    const fullConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
    const id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)

    for (let attempt = 1; attempt <= fullConfig.maxAttempts; attempt++) {
      try {
        return await operation()
      } catch (error: any) {
        if (attempt >= fullConfig.maxAttempts) {
          throw error
        }
        onRetry?.(attempt, error)
        const delay = calculateDelay(attempt, fullConfig)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }

    throw new Error('RetryEngine: max attempts exceeded')
  }

  isNetworkError(error: any): boolean {
    const msg = (error?.message ?? error ?? '').toLowerCase()
    return (
      msg.includes('network') ||
      msg.includes('fetch') ||
      msg.includes('timeout') ||
      msg.includes('abort') ||
      msg.includes('offline') ||
      msg.includes(' econnrefused') ||
      msg.includes(' enotfound') ||
      msg.includes('socket') ||
      error?.name === 'TypeError' ||
      error?.code === 'NETWORK_ERROR'
    )
  }

  isRetryableError(error: any): boolean {
    if (this.isNetworkError(error)) {
      return true
    }
    const status = error?.status ?? error?.code
    if (typeof status === 'number') {
      return status >= 500 || status === 429
    }
    return false
  }

  resetAttempts(id: string): void {
    this.attempts.delete(id)
  }

  getAttemptCount(id: string): number {
    return this.attempts.get(id) ?? 0
  }

  clearAll(): void {
    this.attempts.clear()
  }
}

export const retryEngine = new RetryEngine()
