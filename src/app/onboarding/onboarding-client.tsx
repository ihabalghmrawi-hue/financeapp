'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2, Sparkles } from 'lucide-react'
import type { BusinessType } from '@/types/erp'
import { BUSINESS_TYPES, getFeatures } from '@/lib/features'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n/language-provider'

type Step = 'select' | 'loading' | 'done'

export default function OnboardingClient() {
  const router = useRouter()
  const { t } = useT()
  const [selected, setSelected] = useState<BusinessType | null>(null)
  const [step, setStep] = useState<Step>('select')
  const [loadingStep, setLoadingStep] = useState(0)

  const LOADING_STEPS = [
    t('onboarding.settingUp'),
    t('onboarding.creatingCategories'),
    t('onboarding.addingProducts'),
    t('onboarding.initializingPOS'),
    t('onboarding.setupComplete'),
  ]

  const handleConfirm = async () => {
    if (!selected) {
      return
    }
    setStep('loading')

    await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ business_type: selected }),
    })

    const animate = async () => {
      for (let i = 0; i < LOADING_STEPS.length - 1; i++) {
        setLoadingStep(i)
        await new Promise((r) => setTimeout(r, 600))
      }
    }

    await Promise.all([
      fetch('/api/onboarding/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_type: selected }),
      }),
      animate(),
    ])

    setLoadingStep(LOADING_STEPS.length - 1)
    setStep('done')
    await new Promise((r) => setTimeout(r, 900))
    router.replace('/dashboard')
  }

  if (step === 'loading' || step === 'done') {
    return (
      <div
        className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-background flex items-center justify-center p-6"
        dir="rtl"
      >
        <div className="w-full max-w-sm text-center space-y-8">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto">
            <span className="text-4xl">{selected ? getFeatures(selected).icon : '🏪'}</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              {step === 'done' ? t('onboarding.setupComplete') : t('onboarding.setupInProgress')}
            </h2>
            <p className="text-muted-foreground text-sm">{selected ? getFeatures(selected).label : ''}</p>
          </div>
          <div className="space-y-3">
            {LOADING_STEPS.map((label, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all',
                  i < loadingStep
                    ? 'text-muted-foreground'
                    : i === loadingStep
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground/40',
                )}
              >
                {i < loadingStep ? (
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                ) : i === loadingStep ? (
                  step === 'done' && i === LOADING_STEPS.length - 1 ? (
                    <Check className="w-4 h-4 text-green-500 shrink-0" />
                  ) : (
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  )
                ) : (
                  <div className="w-4 h-4 shrink-0" />
                )}
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-background flex items-center justify-center p-6"
      dir="rtl"
    >
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🏪</div>
          <h1 className="text-3xl font-bold text-foreground">{t('onboarding.welcome')}</h1>
          <p className="text-muted-foreground mt-2 text-sm">{t('onboarding.subtitle')}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          {BUSINESS_TYPES.map((type) => {
            const f = getFeatures(type)
            const isSelected = selected === type
            return (
              <button
                key={type}
                onClick={() => setSelected(type)}
                className={cn(
                  'relative flex flex-col items-center gap-2 p-5 rounded-2xl border-2 text-center transition-all',
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-md scale-[1.02]'
                    : 'border-border bg-card hover:border-primary/40 hover:bg-accent/50',
                )}
              >
                {isSelected && (
                  <div className="absolute top-2 left-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
                <span className="text-3xl">{f.icon}</span>
                <span className="font-semibold text-sm text-foreground">{f.label}</span>
                <span className="text-[11px] text-muted-foreground leading-snug">{t(`onboarding.desc_${type}`)}</span>
              </button>
            )
          })}
        </div>

        {selected && (
          <div className="bg-card border rounded-2xl p-4 mb-5 text-sm">
            <p className="font-medium text-foreground mb-2 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" />
              {t('onboarding.willBeSetup')} <strong>{getFeatures(selected).label}</strong>:
            </p>
            <div className="flex flex-wrap gap-2">
              {getFeatures(selected).hasExpiry && <Tag>{t('onboarding.expiryTracking')}</Tag>}
              {getFeatures(selected).hasBatch && <Tag>{t('onboarding.batchManagement')}</Tag>}
              {getFeatures(selected).hasVariants && <Tag>{t('onboarding.variants')}</Tag>}
              {getFeatures(selected).hasBulkPricing && <Tag>{t('onboarding.bulkPricing')}</Tag>}
              {getFeatures(selected).hasMinQty && <Tag>{t('onboarding.minOrderQty')}</Tag>}
              {getFeatures(selected).fastPOS && <Tag>{t('onboarding.fastPOS')}</Tag>}
              {getFeatures(selected).showReturns && <Tag>{t('onboarding.returns')}</Tag>}
              {getFeatures(selected).showShifts && <Tag>{t('onboarding.shifts')}</Tag>}
              {getFeatures(selected).hasRental && <Tag>{t('onboarding.dressManagement')}</Tag>}
              {getFeatures(selected).hasRental && <Tag>{t('onboarding.bookingSystem')}</Tag>}
              {getFeatures(selected).hasRental && <Tag>{t('onboarding.returnTracking')}</Tag>}
              <Tag variant="green">{t('onboarding.readyCategories')}</Tag>
              {!getFeatures(selected).hasRental && <Tag variant="green">{t('onboarding.sampleProducts')}</Tag>}
            </div>
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={!selected}
          className="w-full bg-primary text-primary-foreground py-3.5 rounded-2xl font-bold text-base hover:bg-primary/90 disabled:opacity-40 flex items-center justify-center gap-2 transition-all"
        >
          {t('onboarding.startNow')}
        </button>
      </div>
    </div>
  )
}

function Tag({ children, variant = 'blue' }: { children: React.ReactNode; variant?: 'blue' | 'green' }) {
  return (
    <span
      className={cn(
        'text-xs px-2.5 py-1 rounded-full font-medium',
        variant === 'green' ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-primary/10 text-primary',
      )}
    >
      {children}
    </span>
  )
}
