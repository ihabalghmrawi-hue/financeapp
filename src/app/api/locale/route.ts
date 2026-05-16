import { NextResponse, type NextRequest } from 'next/server'
import { LANG_COOKIE, LANG_COOKIE_MAX_AGE, isLang } from '@/lib/i18n'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  const lang = (body as { lang?: unknown })?.lang
  if (!isLang(lang)) {
    return NextResponse.json({ error: 'invalid_lang' }, { status: 400 })
  }

  const res = NextResponse.json({ ok: true, lang })
  res.cookies.set({
    name: LANG_COOKIE,
    value: lang,
    path: '/',
    maxAge: LANG_COOKIE_MAX_AGE,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false,
  })
  return res
}

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(LANG_COOKIE)?.value
  return NextResponse.json({ lang: isLang(cookie) ? cookie : null })
}
