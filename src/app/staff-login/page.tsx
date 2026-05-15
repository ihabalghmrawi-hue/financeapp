'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function StaffLoginPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/auth/login')
  }, [router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <p className="text-muted-foreground text-sm">جاري تحويلك إلى صفحة تسجيل الدخول...</p>
    </div>
  )
}
