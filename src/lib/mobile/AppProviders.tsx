'use client'

import { type ReactNode } from 'react'
import { AuthProvider } from '@/lib/auth'
import { MobileProvider } from './MobileProvider'
import { LanguageProvider } from '@/lib/i18n/language-provider'
import type { Lang } from '@/lib/i18n'

export function AppProviders({ children, initialLang = 'ar' }: { children: ReactNode; initialLang?: Lang }) {
  return (
    <LanguageProvider initialLang={initialLang}>
      <AuthProvider>
        <MobileProvider>{children}</MobileProvider>
      </AuthProvider>
    </LanguageProvider>
  )
}
