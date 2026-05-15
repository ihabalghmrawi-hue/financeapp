'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { biometricLockService } from '@/lib/native/security/biometric-lock'
import { Fingerprint, Lock, ShieldAlert } from 'lucide-react'

interface BiometricLockScreenProps {
  onUnlock?: () => void
  className?: string
}

export function BiometricLockScreen({ onUnlock, className }: BiometricLockScreenProps) {
  const [unlocking, setUnlocking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleUnlock = async () => {
    setUnlocking(true)
    setError(null)
    const result = await biometricLockService.unlock('فتح التطبيق')
    if (result) {
      onUnlock?.()
    } else {
      setError('فشل التحقق. حاول مرة أخرى')
    }
    setUnlocking(false)
  }

  return (
    <div
      className={cn('fixed inset-0 z-[99] bg-background flex flex-col items-center justify-center p-8', className)}
      dir="rtl"
    >
      <div className="flex flex-col items-center gap-6 max-w-sm text-center">
        <div className="p-4 rounded-full bg-primary/10">
          <Lock className="h-10 w-10 text-primary" />
        </div>

        <div>
          <h2 className="text-xl font-bold">التطبيق مقفل</h2>
          <p className="text-sm text-muted-foreground mt-2">استخدم المصادقة البيومترية لفتح التطبيق</p>
        </div>

        <button
          onClick={handleUnlock}
          disabled={unlocking}
          className={cn(
            'p-6 rounded-full bg-primary/10 hover:bg-primary/20 transition-all',
            'active:scale-95',
            unlocking && 'opacity-50',
          )}
          aria-label="فتح بالتطبيق البيومتري"
        >
          <Fingerprint className={cn('h-12 w-12 text-primary', unlocking && 'animate-pulse')} />
        </button>

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-lg">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!error && <p className="text-xs text-muted-foreground">المس مستشعر البصمة أو استخدم التعرف على الوجه</p>}
      </div>
    </div>
  )
}
