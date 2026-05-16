import { NextResponse, type NextRequest } from 'next/server'
import { DEFAULT_LANG, LANG_COOKIE, LANG_COOKIE_MAX_AGE, SUPPORTED_LANGS, isLang, type Lang } from '@/lib/i18n'

function detectFromAcceptLanguage(header: string | null): Lang | null {
  if (!header) {
    return null
  }
  for (const part of header.split(',')) {
    const code = part.trim().split(';')[0].toLowerCase().split('-')[0]
    if (isLang(code)) {
      return code
    }
    if (SUPPORTED_LANGS.includes(code as Lang)) {
      return code as Lang
    }
  }
  return null
}

export function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const existing = req.cookies.get(LANG_COOKIE)?.value
  if (isLang(existing)) {
    return res
  }

  const detected = detectFromAcceptLanguage(req.headers.get('accept-language')) ?? DEFAULT_LANG
  res.cookies.set({
    name: LANG_COOKIE,
    value: detected,
    path: '/',
    maxAge: LANG_COOKIE_MAX_AGE,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  })
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map|woff2?)$).*)'],
}
