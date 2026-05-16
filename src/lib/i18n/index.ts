import en from './locales/en'
import ar from './locales/ar'
import type { Translations } from './locales/en'

export type Lang = 'ar' | 'en'
export type Direction = 'rtl' | 'ltr'

export const SUPPORTED_LANGS: readonly Lang[] = ['en', 'ar'] as const
export const DEFAULT_LANG: Lang = 'ar'
export const LANG_COOKIE = 'lang'
export const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export const LANG_META: Record<
  Lang,
  { label: string; nativeLabel: string; dir: Direction; locale: string; flag: string }
> = {
  en: { label: 'English', nativeLabel: 'English', dir: 'ltr', locale: 'en-US', flag: 'EN' },
  ar: { label: 'Arabic', nativeLabel: 'العربية', dir: 'rtl', locale: 'ar-SA', flag: 'AR' },
}

export const resources: Record<Lang, Translations> = { en, ar }

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (SUPPORTED_LANGS as readonly string[]).includes(value)
}

export function normalizeLang(value: unknown): Lang {
  return isLang(value) ? value : DEFAULT_LANG
}

export function getDirection(lang: Lang): Direction {
  return LANG_META[lang].dir
}

function getNestedValue(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

export type TranslationParams = Record<string, string | number>

function interpolate(template: string, params?: TranslationParams): string {
  if (!params) {
    return template
  }
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) =>
    key in params ? String(params[key]) : `{{${key}}}`,
  )
}

export function resolveTranslation(lang: Lang, key: string, params?: TranslationParams): string {
  const primary = getNestedValue(resources[lang], key)
  if (typeof primary === 'string') {
    return interpolate(primary, params)
  }

  const fallback = getNestedValue(resources.en, key)
  if (typeof fallback === 'string') {
    return interpolate(fallback, params)
  }

  return key
}
