'use client'

import { useMemo, type CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

type SceneVariant = 'dark-en' | 'dark-alt' | 'dark-ar' | 'morning-ar' | 'morning-en'

interface ThemeColors {
  bg1: string
  bg2: string
  glow1: string
  glow2: string
  accent: string
  accent2: string
  accent3: string
  nodeBorder: string
  nodeBg: string
  nodeLabel: string
  edgeColor: string
  edgeDash: string
  edgeGlow: string
  crystalTop: string
  crystalSide: string
  crystalSide2: string
  panelBg: string
  panelBorder: string
  panelText: string
  panelMuted: string
  panelVal: string
  panelPct: string
  gridColor: string
}

const THEMES: Record<SceneVariant, ThemeColors> = {
  'dark-en': {
    bg1: '#070b14',
    bg2: '#0d1520',
    glow1: 'rgba(0,230,118,0.12)',
    glow2: 'rgba(0,188,212,0.08)',
    accent: '#00e676',
    accent2: '#00bcd4',
    accent3: '#18ffff',
    nodeBorder: 'rgba(0,230,118,0.5)',
    nodeBg: 'rgba(0,230,118,0.08)',
    nodeLabel: 'rgba(255,255,255,0.7)',
    edgeColor: 'rgba(0,230,118,0.2)',
    edgeDash: 'rgba(0,188,212,0.15)',
    edgeGlow: 'rgba(0,230,118,0.08)',
    crystalTop: 'rgba(0,230,118,0.2)',
    crystalSide: 'rgba(0,188,212,0.12)',
    crystalSide2: 'rgba(0,230,118,0.06)',
    panelBg: 'rgba(255,255,255,0.04)',
    panelBorder: 'rgba(255,255,255,0.06)',
    panelText: 'rgba(255,255,255,0.8)',
    panelMuted: 'rgba(255,255,255,0.35)',
    panelVal: '#ffffff',
    panelPct: '#00e676',
    gridColor: 'rgba(255,255,255,0.02)',
  },
  'dark-alt': {
    bg1: '#05080f',
    bg2: '#0f0a1a',
    glow1: 'rgba(99,102,241,0.12)',
    glow2: 'rgba(139,92,246,0.08)',
    accent: '#818cf8',
    accent2: '#a78bfa',
    accent3: '#c4b5fd',
    nodeBorder: 'rgba(129,140,248,0.5)',
    nodeBg: 'rgba(129,140,248,0.08)',
    nodeLabel: 'rgba(255,255,255,0.7)',
    edgeColor: 'rgba(129,140,248,0.2)',
    edgeDash: 'rgba(139,92,246,0.15)',
    edgeGlow: 'rgba(129,140,248,0.08)',
    crystalTop: 'rgba(129,140,248,0.2)',
    crystalSide: 'rgba(139,92,246,0.12)',
    crystalSide2: 'rgba(129,140,248,0.06)',
    panelBg: 'rgba(255,255,255,0.04)',
    panelBorder: 'rgba(255,255,255,0.06)',
    panelText: 'rgba(255,255,255,0.8)',
    panelMuted: 'rgba(255,255,255,0.35)',
    panelVal: '#ffffff',
    panelPct: '#818cf8',
    gridColor: 'rgba(255,255,255,0.02)',
  },
  'dark-ar': {
    bg1: '#070b14',
    bg2: '#0d1520',
    glow1: 'rgba(0,230,118,0.12)',
    glow2: 'rgba(0,188,212,0.08)',
    accent: '#00e676',
    accent2: '#00bcd4',
    accent3: '#18ffff',
    nodeBorder: 'rgba(0,230,118,0.5)',
    nodeBg: 'rgba(0,230,118,0.08)',
    nodeLabel: 'rgba(255,255,255,0.7)',
    edgeColor: 'rgba(0,230,118,0.2)',
    edgeDash: 'rgba(0,188,212,0.15)',
    edgeGlow: 'rgba(0,230,118,0.08)',
    crystalTop: 'rgba(0,230,118,0.2)',
    crystalSide: 'rgba(0,188,212,0.12)',
    crystalSide2: 'rgba(0,230,118,0.06)',
    panelBg: 'rgba(255,255,255,0.04)',
    panelBorder: 'rgba(255,255,255,0.06)',
    panelText: 'rgba(255,255,255,0.8)',
    panelMuted: 'rgba(255,255,255,0.35)',
    panelVal: '#ffffff',
    panelPct: '#00e676',
    gridColor: 'rgba(255,255,255,0.02)',
  },
  'morning-ar': {
    bg1: '#f0f2f5',
    bg2: '#e8ecf0',
    glow1: 'rgba(0,188,212,0.06)',
    glow2: 'rgba(0,230,118,0.04)',
    accent: '#00bcd4',
    accent2: '#00e676',
    accent3: '#0ea5e9',
    nodeBorder: 'rgba(0,188,212,0.3)',
    nodeBg: 'rgba(0,188,212,0.04)',
    nodeLabel: 'rgba(0,0,0,0.55)',
    edgeColor: 'rgba(0,0,0,0.06)',
    edgeDash: 'rgba(0,188,212,0.1)',
    edgeGlow: 'rgba(0,188,212,0.03)',
    crystalTop: 'rgba(0,188,212,0.12)',
    crystalSide: 'rgba(0,230,118,0.08)',
    crystalSide2: 'rgba(0,188,212,0.04)',
    panelBg: 'rgba(255,255,255,0.7)',
    panelBorder: 'rgba(255,255,255,0.9)',
    panelText: 'rgba(0,0,0,0.7)',
    panelMuted: 'rgba(0,0,0,0.3)',
    panelVal: '#0a0a0a',
    panelPct: '#00bcd4',
    gridColor: 'rgba(0,0,0,0.02)',
  },
  'morning-en': {
    bg1: '#f0f2f5',
    bg2: '#e8ecf0',
    glow1: 'rgba(0,230,118,0.06)',
    glow2: 'rgba(0,188,212,0.04)',
    accent: '#00e676',
    accent2: '#00bcd4',
    accent3: '#18ffff',
    nodeBorder: 'rgba(0,230,118,0.3)',
    nodeBg: 'rgba(0,230,118,0.04)',
    nodeLabel: 'rgba(0,0,0,0.55)',
    edgeColor: 'rgba(0,0,0,0.06)',
    edgeDash: 'rgba(0,230,118,0.1)',
    edgeGlow: 'rgba(0,230,118,0.03)',
    crystalTop: 'rgba(0,230,118,0.12)',
    crystalSide: 'rgba(0,188,212,0.08)',
    crystalSide2: 'rgba(0,230,118,0.04)',
    panelBg: 'rgba(255,255,255,0.7)',
    panelBorder: 'rgba(255,255,255,0.9)',
    panelText: 'rgba(0,0,0,0.7)',
    panelMuted: 'rgba(0,0,0,0.3)',
    panelVal: '#0a0a0a',
    panelPct: '#00e676',
    gridColor: 'rgba(0,0,0,0.02)',
  },
}

interface NodeDef {
  id: string
  x: number
  y: number
}
interface EdgeDef {
  from: string
  to: string
  dashed?: boolean
}

const NODES: NodeDef[] = [
  { id: 'core', x: 380, y: 540 },
  { id: 'sales', x: 130, y: 280 },
  { id: 'finance', x: 100, y: 780 },
  { id: 'hr', x: 260, y: 140 },
  { id: 'analytics', x: 620, y: 230 },
  { id: 'crm', x: 570, y: 750 },
  { id: 'inventory', x: 190, y: 930 },
  { id: 'reports', x: 700, y: 860 },
  { id: 'operations', x: 460, y: 380 },
  { id: 'ai', x: 320, y: 420 },
]

const EDGES: EdgeDef[] = [
  { from: 'core', to: 'sales' },
  { from: 'core', to: 'finance' },
  { from: 'core', to: 'hr' },
  { from: 'core', to: 'analytics' },
  { from: 'core', to: 'crm' },
  { from: 'core', to: 'inventory' },
  { from: 'core', to: 'reports' },
  { from: 'core', to: 'operations' },
  { from: 'core', to: 'ai' },
  { from: 'sales', to: 'analytics', dashed: true },
  { from: 'finance', to: 'reports', dashed: true },
  { from: 'hr', to: 'operations', dashed: true },
  { from: 'crm', to: 'inventory', dashed: true },
  { from: 'analytics', to: 'reports', dashed: true },
  { from: 'sales', to: 'operations', dashed: true },
  { from: 'finance', to: 'crm', dashed: true },
]

interface PanelDef {
  id: string
  left: string
  top: string
  delay: number
  label: string
  value: string
  change: string
}

const PANELS: PanelDef[] = [
  { id: 'p1', left: '3%', top: '14%', delay: 0, label: 'Sales', value: '$128.4k', change: '+12.5%' },
  { id: 'p2', left: '2%', top: '58%', delay: 0.3, label: 'Revenue', value: '$345.2k', change: '+8.3%' },
  { id: 'p3', left: '42%', top: '8%', delay: 0.6, label: 'Analytics', value: '98.7%', change: '+2.1%' },
  { id: 'p4', left: '38%', top: '76%', delay: 0.9, label: 'Active Users', value: '1,247', change: '+18.6%' },
]

const PANELS_AR: PanelDef[] = [
  { id: 'p1', left: '3%', top: '14%', delay: 0, label: 'المبيعات', value: '$128.4k', change: '+١٢٫٥٪' },
  { id: 'p2', left: '2%', top: '58%', delay: 0.3, label: 'الإيرادات', value: '$345.2k', change: '+٨٫٣٪' },
  { id: 'p3', left: '42%', top: '8%', delay: 0.6, label: 'التحليلات', value: '٩٨٫٧٪', change: '+٢٫١٪' },
  { id: 'p4', left: '38%', top: '76%', delay: 0.9, label: 'المستخدمين', value: '١٬٢٤٧', change: '+١٨٫٦٪' },
]

interface SceneBackgroundProps {
  variant?: SceneVariant
  className?: string
}

export function SceneBackground({ variant = 'dark-en', className }: SceneBackgroundProps) {
  const isDark = variant.startsWith('dark-')
  const isRtl = variant.endsWith('-ar')
  const theme = THEMES[variant]
  const panels = isRtl ? PANELS_AR : PANELS

  const gradientStyle: CSSProperties = {
    background: `linear-gradient(160deg, ${theme.bg1} 0%, ${theme.bg2} 50%, ${theme.bg1} 100%)`,
  }

  const nodeMap = useMemo(() => {
    const map: Record<string, NodeDef> = {}
    NODES.forEach((n) => {
      map[n.id] = n
    })
    return map
  }, [])

  return (
    <div className={cn('fixed inset-0 overflow-hidden', className)}>
      {/* Base gradient */}
      <div className="absolute inset-0" style={gradientStyle} />

      {/* Ambient glows */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full"
        style={{ background: theme.glow1, left: '10%', top: '20%', filter: 'blur(120px)' }}
      />
      <div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{ background: theme.glow2, right: '30%', bottom: '10%', filter: 'blur(100px)' }}
      />
      <div
        className="absolute w-[300px] h-[300px] rounded-full"
        style={{ background: theme.glow1, left: '45%', top: '45%', filter: 'blur(80px)' }}
      />

      {/* Grid overlay */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id={`grid-${variant}`} x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <circle cx="30" cy="30" r="0.5" fill={theme.gridColor} />
          </pattern>
          <pattern id={`grid-lg-${variant}`} x="0" y="0" width="240" height="240" patternUnits="userSpaceOnUse">
            <rect width="240" height="240" fill={`url(#grid-${variant})`} />
            <circle cx="120" cy="120" r="1" fill={theme.gridColor} />
          </pattern>
          <filter id={`glow-${variant}`}>
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width="1920" height="1080" fill={`url(#grid-lg-${variant})`} />

        {/* Edges */}
        <g style={isRtl ? { transform: 'scaleX(-1)', transformOrigin: '960px 540px' } : {}}>
          {EDGES.map((edge, i) => {
            const from = nodeMap[edge.from]
            const to = nodeMap[edge.to]
            if (!from || !to) {
              return null
            }
            return (
              <g key={`edge-${i}`}>
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={edge.dashed ? theme.edgeDash : theme.edgeColor}
                  strokeWidth={edge.dashed ? 1 : 1.5}
                  strokeDasharray={edge.dashed ? '4 4' : 'none'}
                />
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={theme.edgeGlow}
                  strokeWidth={3}
                  opacity={0.5}
                  filter={`url(#glow-${variant})`}
                />
              </g>
            )
          })}
        </g>

        {/* Nodes */}
        <g style={isRtl ? { transform: 'scaleX(-1)', transformOrigin: '960px 540px' } : {}}>
          {NODES.map((node) => (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r={node.id === 'core' ? 8 : 4}
                fill={node.id === 'core' ? theme.accent : theme.nodeBg}
                stroke={node.id === 'core' ? theme.accent : theme.nodeBorder}
                strokeWidth={1.5}
                filter={node.id === 'core' ? `url(#glow-${variant})` : undefined}
              />
              {node.id === 'core' && (
                <>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={14}
                    fill="none"
                    stroke={theme.accent}
                    strokeWidth={0.5}
                    opacity={0.3}
                  />
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={22}
                    fill="none"
                    stroke={theme.accent2}
                    strokeWidth={0.5}
                    opacity={0.15}
                  />
                </>
              )}
            </g>
          ))}
        </g>
      </svg>

      {/* Crystal centerpiece */}
      <div
        className="absolute"
        style={{
          left: '19.8%',
          top: '50%',
          transform: isRtl ? 'translate(-50%, -50%) scaleX(-1)' : 'translate(-50%, -50%)',
        }}
      >
        {/* Crystal glow behind */}
        <svg width="260" height="300" viewBox="0 0 260 300">
          <defs>
            <radialGradient id="crystal-glow" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor={theme.accent} stopOpacity="0.15" />
              <stop offset="100%" stopColor={theme.accent} stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="130" cy="130" rx="120" ry="120" fill="url(#crystal-glow)" />
        </svg>

        {/* Crystal shape */}
        <svg
          width="120"
          height="160"
          viewBox="0 0 120 160"
          className="absolute"
          style={{ left: '50%', top: '35%', transform: 'translate(-50%, -50%)' }}
        >
          <defs>
            <linearGradient id="cTop" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={theme.accent} stopOpacity="0.5" />
              <stop offset="100%" stopColor={theme.accent2} stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="cSide1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={theme.accent2} stopOpacity="0.3" />
              <stop offset="100%" stopColor={theme.accent} stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id="cSide2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={theme.accent} stopOpacity="0.15" />
              <stop offset="100%" stopColor={theme.accent2} stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Top face */}
          <polygon points="60,10 110,55 60,95 10,55" fill="url(#cTop)" stroke={theme.accent} strokeWidth="1" />

          {/* Left face */}
          <polygon points="10,55 60,95 60,145" fill="url(#cSide1)" stroke={theme.accent2} strokeWidth="0.75" />

          {/* Right face */}
          <polygon points="110,55 60,95 60,145" fill="url(#cSide2)" stroke={theme.accent} strokeWidth="0.75" />

          {/* Center line */}
          <line x1="60" y1="10" x2="60" y2="145" stroke={theme.accent3} strokeWidth="0.75" opacity="0.5" />

          {/* Top highlight */}
          <polygon points="60,25 90,50 60,75 30,50" fill={theme.accent3} opacity="0.08" />

          {/* Inner glow dot */}
          <circle cx="60" cy="55" r="3" fill={theme.accent3} opacity="0.8" />
          <circle cx="60" cy="55" r="6" fill="none" stroke={theme.accent3} strokeWidth="0.5" opacity="0.3" />
        </svg>
      </div>

      {/* Floating panels */}
      <div className={cn('absolute inset-0 pointer-events-none', isRtl && '-scale-x-100')}>
        {panels.map((panel) => (
          <motion.div
            key={panel.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: panel.delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="absolute animate-float rounded-xl backdrop-blur-xl p-3.5 min-w-[120px]"
            style={{
              left: isRtl ? `calc(100% - ${panel.left})` : panel.left,
              top: panel.top,
              animationDelay: `${panel.delay + 0.5}s`,
              animationDuration: '4s',
              background: theme.panelBg,
              borderColor: theme.panelBorder,
              borderWidth: 1,
            }}
          >
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: theme.accent }} />
              <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: theme.panelMuted }}>
                {panel.label}
              </span>
            </div>
            <div className="text-sm font-bold" style={{ color: theme.panelVal }}>
              {panel.value}
            </div>
            <div className="text-[10px] font-medium mt-0.5" style={{ color: theme.panelPct }}>
              {panel.change}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Corner vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 30% 50%, transparent 40%, ${theme.bg1} 100%)`,
          opacity: 0.6,
        }}
      />
    </div>
  )
}
