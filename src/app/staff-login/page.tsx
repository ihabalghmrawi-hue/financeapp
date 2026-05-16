'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useT } from '@/lib/i18n/language-provider'

export default function StaffLoginPage() {
  const router = useRouter()
  const { t } = useT()

  useEffect(() => {
    router.replace('/auth/login')
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground text-sm">{t('staffLogin.redirecting')}</p>
    </div>
  )
}
