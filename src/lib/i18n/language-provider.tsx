'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { resolveTranslation, type Lang } from '.'
import { format, parseISO } from 'date-fns'
import { ar } from 'date-fns/locale'

interface I18nContextType {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: string, params?: Record<string, string | number>) => string
  formatCurrency: (amount: number, currency?: string) => string
  formatNumber: (num: number) => string
  formatDate: (date: string | Date, formatStr?: string) => string
}

const I18nContext = createContext<I18nContextType>({
  lang: 'ar',
  setLang: () => {},
  t: (key: string) => key,
  formatCurrency: (amount: number) => String(amount),
  formatNumber: (num: number) => String(num),
  formatDate: (date: string | Date) => String(date),
})

export function LanguageProvider({ children, initialLang = 'ar' }: { children: ReactNode; initialLang?: Lang }) {
  const [lang, setLangState] = useState<Lang>(initialLang)

  const setLang = useCallback((newLang: Lang) => {
    setLangState(newLang)
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLang
      document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr'
    }
    document.cookie = `lang=${newLang}; path=/; max-age=${60 * 60 * 24 * 365}`
  }, [])

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => resolveTranslation(lang, key, params),
    [lang],
  )

  const formatCurrency = useCallback(
    (amount: number, currency = 'USD') => {
      return new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount)
    },
    [lang],
  )

  const formatNumber = useCallback(
    (num: number) => {
      return new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US').format(num)
    },
    [lang],
  )

  const formatDate = useCallback(
    (date: string | Date, formatStr = 'dd/MM/yyyy') => {
      const d = typeof date === 'string' ? parseISO(date) : date
      return format(d, formatStr, { locale: lang === 'ar' ? ar : undefined })
    },
    [lang],
  )

  return (
    <I18nContext.Provider value={{ lang, setLang, t, formatCurrency, formatNumber, formatDate }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useT() {
  return useContext(I18nContext)
}
