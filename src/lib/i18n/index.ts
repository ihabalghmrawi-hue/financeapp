import en from './locales/en'
import ar from './locales/ar'
import type { Translations } from './locales/en'

export type Lang = 'ar' | 'en'

export const resources: Record<Lang, Translations> = { en, ar }

function getNestedValue(obj: any, path: string): string {
  return path.split('.').reduce((acc, key) => {
    if (acc && typeof acc === 'object' && key in acc) {
      return acc[key]
    }
    return undefined
  }, obj)
}

export function resolveTranslation(lang: Lang, key: string, params?: Record<string, string | number>): string {
  const translations = resources[lang] as any
  let value = getNestedValue(translations, key)

  if (value === undefined || value === null) {
    const fallback = getNestedValue(resources.en, key)
    value = fallback ?? key
  }

  if (params && typeof value === 'string') {
    Object.entries(params).forEach(([k, v]) => {
      value = (value as string).replace(`{{${k}}}`, String(v))
    })
  }

  return value as string
}
