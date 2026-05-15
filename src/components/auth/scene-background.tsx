'use client'

import { type CSSProperties } from 'react'
import { cn } from '@/lib/utils'

type SceneVariant = 'dark-en' | 'dark-alt' | 'dark-ar' | 'morning-ar' | 'morning-en'

const IMAGE_MAP: Partial<Record<SceneVariant, { src: string; overlay?: string }>> = {
  'dark-en': { src: '/2.png', overlay: 'rgba(0,0,0,0.55)' },
  'dark-ar': { src: '/arabic night.png', overlay: 'rgba(0,0,0,0.55)' },
  'morning-ar': { src: '/arabic light.png' },
  'morning-en': { src: '/english light.png' },
}

interface ThemeColors {
  bg1: string
  bg2: string
  glow1: string
  glow2: string
}

const THEMES: Record<SceneVariant, ThemeColors> = {
  'dark-en': { bg1: '#070b14', bg2: '#0d1520', glow1: 'rgba(0,230,118,0.12)', glow2: 'rgba(0,188,212,0.08)' },
  'dark-alt': { bg1: '#05080f', bg2: '#0f0a1a', glow1: 'rgba(99,102,241,0.12)', glow2: 'rgba(139,92,246,0.08)' },
  'dark-ar': { bg1: '#070b14', bg2: '#0d1520', glow1: 'rgba(0,230,118,0.12)', glow2: 'rgba(0,188,212,0.08)' },
  'morning-ar': { bg1: '#f5f7fa', bg2: '#ebeef3', glow1: 'rgba(0,188,212,0.05)', glow2: 'rgba(0,230,118,0.03)' },
  'morning-en': { bg1: '#f5f7fa', bg2: '#ebeef3', glow1: 'rgba(0,230,118,0.05)', glow2: 'rgba(0,188,212,0.03)' },
}

interface SceneBackgroundProps {
  variant?: SceneVariant
  className?: string
}

export function SceneBackground({ variant = 'dark-en', className }: SceneBackgroundProps) {
  const theme = THEMES[variant]
  const imageConfig = IMAGE_MAP[variant]
  const isImageBg = !!imageConfig

  const bgStyle: CSSProperties = {
    background: isImageBg
      ? `url('${imageConfig!.src}') center/cover no-repeat`
      : `linear-gradient(160deg, ${theme.bg1} 0%, ${theme.bg2} 50%, ${theme.bg1} 100%)`,
  }

  return (
    <div className={cn('fixed inset-0 overflow-hidden select-none', className)}>
      <div className="absolute inset-0" style={bgStyle} />
      {isImageBg && imageConfig!.overlay && (
        <div className="absolute inset-0" style={{ background: imageConfig!.overlay }} />
      )}
      <div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{ background: theme.glow1, left: '8%', top: '15%', filter: 'blur(140px)' }}
      />
      <div
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{ background: theme.glow2, right: '25%', bottom: '10%', filter: 'blur(120px)' }}
      />
      <div
        className="absolute w-[200px] h-[200px] rounded-full"
        style={{ background: theme.glow1, left: '40%', top: '40%', filter: 'blur(100px)' }}
      />
    </div>
  )
}
