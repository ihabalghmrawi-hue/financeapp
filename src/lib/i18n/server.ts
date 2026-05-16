import { cookies, headers } from 'next/headers'
import {
  DEFAULT_LANG,
  LANG_COOKIE,
  SUPPORTED_LANGS,
  isLang,
  normalizeLang,
  resolveTranslation,
  type Lang,
  type TranslationParams,
} from '.'

function pickFromAcceptLanguage(header: string | null): Lang | null {
  if (!header) {
    return null
  }
  const langs = header.split(',').map((part) => part.trim().split(';')[0].toLowerCase().split('-')[0])
  for (const code of langs) {
    if (isLang(code)) {
      return code
    }
    if (SUPPORTED_LANGS.includes(code as Lang)) {
      return code as Lang
    }
  }
  return null
}

// Async, cookie-aware lookup. Use this in new server code.
export async function getServerLang(): Promise<Lang> {
  try {
    const cookieStore = await cookies()
    const fromCookie = cookieStore.get(LANG_COOKIE)?.value
    if (isLang(fromCookie)) {
      return fromCookie
    }
  } catch {
    // cookies() not available outside request scope
  }
  try {
    const h = await headers()
    const fromHeader = pickFromAcceptLanguage(h.get('accept-language'))
    if (fromHeader) {
      return fromHeader
    }
  } catch {
    // headers() not available outside request scope
  }
  return DEFAULT_LANG
}

export async function getTranslations(lang?: Lang) {
  const resolved = lang ? normalizeLang(lang) : await getServerLang()
  return {
    lang: resolved,
    t: (key: string, params?: TranslationParams) => resolveTranslation(resolved, key, params),
    tAsync: async (key: string, params?: TranslationParams) => resolveTranslation(resolved, key, params),
  }
}

/**
 * Synchronous translator for legacy server-component call sites.
 * Resolves against DEFAULT_LANG. New code should `await getTranslations()`
 * and use the returned `t` (which is request-cookie aware).
 */
export function t(key: string, params?: TranslationParams): string {
  return resolveTranslation(DEFAULT_LANG, key, params)
}
