'use client'

import { type ReactNode } from 'react'
import { AuthProvider } from '@/lib/auth'
import { MobileProvider } from './MobileProvider'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <MobileProvider>{children}</MobileProvider>
    </AuthProvider>
  )
}
