'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import { ar as arDateLocale } from 'date-fns/locale'
import {
  DEFAULT_LANG,
  LANG_COOKIE,
  LANG_COOKIE_MAX_AGE,
  LANG_META,
  getDirection,
  isLang,
  resolveTranslation,
  type Direction,
  type Lang,
  type TranslationParams,
} from '.'

interface I18nContextType {
  lang: Lang
  dir: Direction
  isRTL: boolean
  isChanging: boolean
  setLang: (lang: Lang) => void
  toggleLang: () => void
  t: (key: string, params?: TranslationParams) => string
  formatCurrency: (amount: number, currency?: string) => string
  formatNumber: (num: number, opts?: Intl.NumberFormatOptions) => string
  formatDate: (date: string | Date, formatStr?: string) => string
  formatRelative: (date: string | Date) => string
}

const noop = () => {}

const I18nContext = createContext<I18nContextType>({
  lang: DEFAULT_LANG,
  dir: getDirection(DEFAULT_LANG),
  isRTL: getDirection(DEFAULT_LANG) === 'rtl',
  isChanging: false,
  setLang: noop,
  toggleLang: noop,
  t: (key) => key,
  formatCurrency: (amount) => String(amount),
  formatNumber: (num) => String(num),
  formatDate: (date) => String(date),
  formatRelative: (date) => String(date),
})

function readCookieLang(): Lang | null {
  if (typeof document === 'undefined') {
    return null
  }
  const match = document.cookie.match(new RegExp(`(?:^|; )${LANG_COOKIE}=([^;]+)`))
  if (!match) {
    return null
  }
  const value = decodeURIComponent(match[1])
  return isLang(value) ? value : null
}

function writeCookieLang(lang: Lang) {
  if (typeof document === 'undefined') {
    return
  }
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${LANG_COOKIE}=${lang}; Path=/; Max-Age=${LANG_COOKIE_MAX_AGE}; SameSite=Lax${secure}`
}

function applyDocumentLang(lang: Lang) {
  if (typeof document === 'undefined') {
    return
  }
  const dir = getDirection(lang)
  document.documentElement.lang = lang
  document.documentElement.dir = dir
  document.documentElement.setAttribute('data-lang', lang)
  document.documentElement.setAttribute('data-dir', dir)
}

export function LanguageProvider({
  children,
  initialLang = DEFAULT_LANG,
}: {
  children: ReactNode
  initialLang?: Lang
}) {
  const router = useRouter()
  const [lang, setLangState] = useState<Lang>(initialLang)
  const [isPending, startTransition] = useTransition()

  // Reconcile with cookie on mount (in case server saw a different value than client).
  useEffect(() => {
    const cookieLang = readCookieLang()
    if (cookieLang && cookieLang !== lang) {
      setLangState(cookieLang)
      applyDocumentLang(cookieLang)
    } else {
      applyDocumentLang(lang)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setLang = useCallback(
    (next: Lang) => {
      if (next === lang) {
        return
      }
      setLangState(next)
      applyDocumentLang(next)
      writeCookieLang(next)

      // Best-effort server sync (works in WKWebView and ensures cookie is set with server attributes).
      if (typeof fetch !== 'undefined') {
        void fetch('/api/locale', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lang: next }),
          credentials: 'same-origin',
        }).catch(() => {})
      }

      // Trigger Next.js to re-render server components with the new lang.
      startTransition(() => {
        router.refresh()
      })
    },
    [lang, router],
  )

  const toggleLang = useCallback(() => {
    setLang(lang === 'ar' ? 'en' : 'ar')
  }, [lang, setLang])

  const t = useCallback((key: string, params?: TranslationParams) => resolveTranslation(lang, key, params), [lang])

  const formatCurrency = useCallback(
    (amount: number, currency = 'USD') =>
      new Intl.NumberFormat(LANG_META[lang].locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount),
    [lang],
  )

  const formatNumber = useCallback(
    (num: number, opts?: Intl.NumberFormatOptions) => new Intl.NumberFormat(LANG_META[lang].locale, opts).format(num),
    [lang],
  )

  const formatDate = useCallback(
    (date: string | Date, formatStr = 'dd/MM/yyyy') => {
      const d = typeof date === 'string' ? parseISO(date) : date
      return format(d, formatStr, { locale: lang === 'ar' ? arDateLocale : undefined })
    },
    [lang],
  )

  const formatRelative = useCallback(
    (date: string | Date) => {
      const d = typeof date === 'string' ? parseISO(date) : date
      const diffMs = d.getTime() - Date.now()
      const abs = Math.abs(diffMs)
      const rtf = new Intl.RelativeTimeFormat(LANG_META[lang].locale, { numeric: 'auto' })
      const minute = 60_000
      const hour = 60 * minute
      const day = 24 * hour
      const week = 7 * day
      if (abs < hour) {
        return rtf.format(Math.round(diffMs / minute), 'minute')
      }
      if (abs < day) {
        return rtf.format(Math.round(diffMs / hour), 'hour')
      }
      if (abs < week) {
        return rtf.format(Math.round(diffMs / day), 'day')
      }
      return rtf.format(Math.round(diffMs / week), 'week')
    },
    [lang],
  )

  const dir = getDirection(lang)
  const value = useMemo<I18nContextType>(
    () => ({
      lang,
      dir,
      isRTL: dir === 'rtl',
      isChanging: isPending,
      setLang,
      toggleLang,
      t,
      formatCurrency,
      formatNumber,
      formatDate,
      formatRelative,
    }),
    [lang, dir, isPending, setLang, toggleLang, t, formatCurrency, formatNumber, formatDate, formatRelative],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useT() {
  return useContext(I18nContext)
}

// Convenience hook for components that only need `t`.
export function useTranslation() {
  const { t, lang, dir, isRTL } = useContext(I18nContext)
  return { t, lang, dir, isRTL }
}
