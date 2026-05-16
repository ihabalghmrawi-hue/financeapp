import { resolveTranslation, type Lang } from '.'

const cache = new Map<string, Lang>()

function getServerLang(): Lang {
  return (cache.get('lang') as Lang) || 'ar'
}

export function setServerLang(lang: Lang) {
  cache.set('lang', lang)
}

export function t(key: string, params?: Record<string, string | number>): string {
  return resolveTranslation(getServerLang(), key, params)
}

export async function getTranslations(lang: Lang) {
  return {
    t: (key: string, params?: Record<string, string | number>) => resolveTranslation(lang, key, params),
    lang,
  }
}
