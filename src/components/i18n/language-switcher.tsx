'use client'

import { Check, Globe, Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { LANG_META, SUPPORTED_LANGS, type Lang } from '@/lib/i18n'
import { useT } from '@/lib/i18n/language-provider'

type Variant = 'icon' | 'compact' | 'menu' | 'inline'

interface LanguageSwitcherProps {
  variant?: Variant
  className?: string
  align?: 'start' | 'end'
}

export function LanguageSwitcher({ variant = 'compact', className, align = 'end' }: LanguageSwitcherProps) {
  const { lang, setLang, toggleLang, isChanging, t } = useT()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onEscape)
    }
  }, [open])

  if (variant === 'inline') {
    return (
      <div className={cn('inline-flex rounded-xl border border-border/60 bg-secondary/40 p-0.5', className)} dir="ltr">
        {SUPPORTED_LANGS.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => setLang(code)}
            disabled={isChanging}
            aria-pressed={lang === code}
            className={cn(
              'min-w-[44px] min-h-[36px] px-3 text-xs font-medium rounded-lg transition-all duration-200',
              lang === code
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
            )}
          >
            {LANG_META[code].flag}
          </button>
        ))}
      </div>
    )
  }

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={toggleLang}
        disabled={isChanging}
        aria-label={t('common.language')}
        title={LANG_META[lang === 'ar' ? 'en' : 'ar'].nativeLabel}
        className={cn(
          'p-2 min-w-[40px] min-h-[40px] rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200 inline-flex items-center justify-center',
          className,
        )}
      >
        {isChanging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
      </button>
    )
  }

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={toggleLang}
        disabled={isChanging}
        aria-label={t('common.language')}
        dir="ltr"
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[36px] rounded-xl text-xs font-medium transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-secondary',
          className,
        )}
      >
        {isChanging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
        <span>{LANG_META[lang === 'ar' ? 'en' : 'ar'].flag}</span>
      </button>
    )
  }

  // menu variant
  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={isChanging}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('common.language')}
        dir="ltr"
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 min-h-[36px] rounded-xl text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
      >
        {isChanging ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
        <span>{LANG_META[lang].flag}</span>
      </button>
      {open && (
        <div
          role="menu"
          className={cn(
            'absolute top-full mt-1 z-50 min-w-[160px] rounded-xl border border-border/60 bg-popover shadow-lg overflow-hidden',
            align === 'end' ? 'right-0' : 'left-0',
          )}
          dir="ltr"
        >
          {SUPPORTED_LANGS.map((code) => (
            <button
              key={code}
              type="button"
              role="menuitemradio"
              aria-checked={lang === code}
              onClick={() => {
                setLang(code as Lang)
                setOpen(false)
              }}
              className={cn(
                'w-full flex items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-secondary transition-colors',
                lang === code && 'bg-secondary/60',
              )}
            >
              <span className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">{LANG_META[code].flag}</span>
                <span>{LANG_META[code].nativeLabel}</span>
              </span>
              {lang === code && <Check className="w-3.5 h-3.5 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
