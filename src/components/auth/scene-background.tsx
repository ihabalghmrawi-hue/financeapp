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
  chart1: string
  chart2: string
  chart3: string
  chart4: string
  gridColor: string
  watermark: string
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
    panelText: 'rgba(255,255,255,0.85)',
    panelMuted: 'rgba(255,255,255,0.35)',
    panelVal: '#ffffff',
    panelPct: '#00e676',
    chart1: 'rgba(0,230,118,0.6)',
    chart2: 'rgba(0,188,212,0.5)',
    chart3: 'rgba(24,255,255,0.4)',
    chart4: 'rgba(0,230,118,0.3)',
    gridColor: 'rgba(255,255,255,0.02)',
    watermark: 'rgba(255,255,255,0.03)',
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
    panelText: 'rgba(255,255,255,0.85)',
    panelMuted: 'rgba(255,255,255,0.35)',
    panelVal: '#ffffff',
    panelPct: '#818cf8',
    chart1: 'rgba(129,140,248,0.6)',
    chart2: 'rgba(167,139,250,0.5)',
    chart3: 'rgba(196,181,253,0.4)',
    chart4: 'rgba(129,140,248,0.3)',
    gridColor: 'rgba(255,255,255,0.02)',
    watermark: 'rgba(255,255,255,0.03)',
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
    panelText: 'rgba(255,255,255,0.85)',
    panelMuted: 'rgba(255,255,255,0.35)',
    panelVal: '#ffffff',
    panelPct: '#00e676',
    chart1: 'rgba(0,230,118,0.6)',
    chart2: 'rgba(0,188,212,0.5)',
    chart3: 'rgba(24,255,255,0.4)',
    chart4: 'rgba(0,230,118,0.3)',
    gridColor: 'rgba(255,255,255,0.02)',
    watermark: 'rgba(255,255,255,0.03)',
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
    chart1: 'rgba(0,188,212,0.5)',
    chart2: 'rgba(0,230,118,0.4)',
    chart3: 'rgba(14,165,233,0.35)',
    chart4: 'rgba(0,188,212,0.25)',
    gridColor: 'rgba(0,0,0,0.02)',
    watermark: 'rgba(0,0,0,0.03)',
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
    chart1: 'rgba(0,230,118,0.5)',
    chart2: 'rgba(0,188,212,0.4)',
    chart3: 'rgba(24,255,255,0.35)',
    chart4: 'rgba(0,230,118,0.25)',
    gridColor: 'rgba(0,0,0,0.02)',
    watermark: 'rgba(0,0,0,0.03)',
  },
}

interface NodeDef {
  id: string
  x: number
  y: number
  label: string
}
interface EdgeDef {
  from: string
  to: string
  dashed?: boolean
}

const NODES: NodeDef[] = [
  { id: 'core', x: 380, y: 540, label: 'ERP CORE' },
  { id: 'sales', x: 120, y: 240, label: 'Sales' },
  { id: 'finance', x: 90, y: 780, label: 'Finance' },
  { id: 'hr', x: 260, y: 120, label: 'HR' },
  { id: 'analytics', x: 640, y: 220, label: 'Analytics' },
  { id: 'crm', x: 580, y: 770, label: 'CRM' },
  { id: 'inventory', x: 180, y: 940, label: 'Inventory' },
  { id: 'reports', x: 720, y: 860, label: 'Reports' },
  { id: 'ops', x: 460, y: 370, label: 'Operations' },
  { id: 'ai', x: 310, y: 400, label: 'AI Engine' },
]

const EDGES: EdgeDef[] = [
  { from: 'core', to: 'sales' },
  { from: 'core', to: 'finance' },
  { from: 'core', to: 'hr' },
  { from: 'core', to: 'analytics' },
  { from: 'core', to: 'crm' },
  { from: 'core', to: 'inventory' },
  { from: 'core', to: 'reports' },
  { from: 'core', to: 'ops' },
  { from: 'core', to: 'ai' },
  { from: 'sales', to: 'analytics', dashed: true },
  { from: 'finance', to: 'reports', dashed: true },
  { from: 'hr', to: 'ops', dashed: true },
  { from: 'crm', to: 'inventory', dashed: true },
  { from: 'analytics', to: 'reports', dashed: true },
  { from: 'sales', to: 'ops', dashed: true },
  { from: 'finance', to: 'crm', dashed: true },
]

function BarChart({ colors }: { colors: string[] }) {
  const bars = [35, 55, 45, 72, 52, 82, 62]
  return (
    <svg className="w-full h-10" viewBox="0 0 140 40">
      {bars.map((h, i) => (
        <rect
          key={i}
          x={4 + i * 19}
          y={40 - h * 0.38}
          width={12}
          height={h * 0.38}
          rx={2}
          fill={colors[i % colors.length]}
          opacity={0.4 + (i / bars.length) * 0.5}
        />
      ))}
    </svg>
  )
}

function MiniLineChart({ color }: { color: string }) {
  return (
    <svg className="w-full h-8" viewBox="0 0 120 30">
      <polyline
        points="0,26 8,20 16,22 24,14 32,16 40,8 48,10 56,4 64,6 72,2 80,4 88,8 96,6 104,10 112,8 120,12"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon
        points="0,26 0,26 8,20 16,22 24,14 32,16 40,8 48,10 56,4 64,6 72,2 80,4 88,8 96,6 104,10 112,8 120,12 120,30 0,30"
        fill={color}
        opacity="0.08"
      />
    </svg>
  )
}

interface SceneBackgroundProps {
  variant?: SceneVariant
  className?: string
}

export function SceneBackground({ variant = 'dark-en', className }: SceneBackgroundProps) {
  const isDark = variant.startsWith('dark-')
  const isRtl = variant.endsWith('-ar')
  const theme = THEMES[variant]
  const chartColors = [theme.chart1, theme.chart2, theme.chart3, theme.chart4]

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

  const s = (n: number) => `${(n / 1920) * 100}%`
  const panel = (left: number, top: number, delay: number, children: React.ReactNode, w = 44) => (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="absolute animate-float rounded-2xl backdrop-blur-xl p-4"
      style={{
        left: isRtl ? `calc(100% - ${s(1920 - left)})` : s(left),
        top: s(top),
        width: `${w}%`,
        animationDelay: `${delay + 0.5}s`,
        animationDuration: '4s',
        background: theme.panelBg,
        borderColor: theme.panelBorder,
        borderWidth: 1,
      }}
    >
      {children}
    </motion.div>
  )

  return (
    <div className={cn('fixed inset-0 overflow-hidden select-none', className)}>
      <div className="absolute inset-0" style={gradientStyle} />
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

      {/* Watermark */}
      <div className="absolute bottom-8" style={{ left: '3%', color: theme.watermark }}>
        <div className="text-3xl font-bold tracking-tight">ezyERP</div>
        <div className="text-xs tracking-[0.2em] uppercase -mt-1">Intelligent Enterprise Platform</div>
      </div>

      {/* SVG network */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id={`g-${variant}`} x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <circle cx="30" cy="30" r="0.5" fill={theme.gridColor} />
          </pattern>
          <pattern id={`gl-${variant}`} x="0" y="0" width="240" height="240" patternUnits="userSpaceOnUse">
            <rect width="240" height="240" fill={`url(#g-${variant})`} />
            <circle cx="120" cy="120" r="1" fill={theme.gridColor} />
          </pattern>
          <filter id={`gf-${variant}`}>
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width="1920" height="1080" fill={`url(#gl-${variant})`} />

        <g style={isRtl ? { transform: 'scaleX(-1)', transformOrigin: '960px 540px' } : {}}>
          {EDGES.map((e, i) => {
            const f = nodeMap[e.from]
            const t = nodeMap[e.to]
            if (!f || !t) {
              return null
            }
            return (
              <g key={`e-${i}`}>
                <line
                  x1={f.x}
                  y1={f.y}
                  x2={t.x}
                  y2={t.y}
                  stroke={e.dashed ? theme.edgeDash : theme.edgeColor}
                  strokeWidth={e.dashed ? 1 : 1.5}
                  strokeDasharray={e.dashed ? '4 4' : 'none'}
                />
                <line
                  x1={f.x}
                  y1={f.y}
                  x2={t.x}
                  y2={t.y}
                  stroke={theme.edgeGlow}
                  strokeWidth={3}
                  opacity={0.5}
                  filter={`url(#gf-${variant})`}
                />
              </g>
            )
          })}
          {NODES.map((n) => (
            <g key={n.id}>
              <circle
                cx={n.x}
                cy={n.y}
                r={n.id === 'core' ? 10 : 4.5}
                fill={n.id === 'core' ? theme.accent : theme.nodeBg}
                stroke={n.id === 'core' ? theme.accent : theme.nodeBorder}
                strokeWidth={1.5}
                filter={n.id === 'core' ? `url(#gf-${variant})` : undefined}
              />
              {n.id === 'core' && (
                <>
                  <circle cx={n.x} cy={n.y} r={18} fill="none" stroke={theme.accent} strokeWidth={0.5} opacity={0.3} />
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={28}
                    fill="none"
                    stroke={theme.accent2}
                    strokeWidth={0.5}
                    opacity={0.15}
                  />
                  <circle
                    cx={n.x}
                    cy={n.y}
                    r={40}
                    fill="none"
                    stroke={theme.accent3}
                    strokeWidth={0.3}
                    opacity={0.08}
                  />
                </>
              )}
              {n.id !== 'core' && (
                <text
                  x={n.x + 10}
                  y={n.y + 4}
                  fill={theme.nodeLabel}
                  fontSize="10"
                  fontFamily="system-ui"
                  fontWeight="500"
                >
                  {n.label}
                </text>
              )}
            </g>
          ))}
        </g>
      </svg>

      {/* Crystal centerpiece */}
      <div
        className="absolute"
        style={{
          left: isRtl ? '80%' : '19.8%',
          top: '50%',
          transform: isRtl ? 'translate(-50%, -50%) scaleX(-1)' : 'translate(-50%, -50%)',
        }}
      >
        <svg width="280" height="320" viewBox="0 0 280 320">
          <defs>
            <radialGradient id="cg" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor={theme.accent} stopOpacity="0.2" />
              <stop offset="100%" stopColor={theme.accent} stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx="140" cy="140" rx="130" ry="130" fill="url(#cg)" />
        </svg>
        <svg
          width="140"
          height="180"
          viewBox="0 0 140 180"
          className="absolute"
          style={{ left: '50%', top: '35%', transform: 'translate(-50%, -50%)' }}
        >
          <defs>
            <linearGradient id="ct" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={theme.accent} stopOpacity="0.6" />
              <stop offset="100%" stopColor={theme.accent2} stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="cs1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={theme.accent2} stopOpacity="0.35" />
              <stop offset="100%" stopColor={theme.accent} stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id="cs2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={theme.accent} stopOpacity="0.18" />
              <stop offset="100%" stopColor={theme.accent2} stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <polygon points="70,10 125,60 70,105 15,60" fill="url(#ct)" stroke={theme.accent} strokeWidth="1" />
          <polygon points="15,60 70,105 70,165" fill="url(#cs1)" stroke={theme.accent2} strokeWidth="0.75" />
          <polygon points="125,60 70,105 70,165" fill="url(#cs2)" stroke={theme.accent} strokeWidth="0.75" />
          <line x1="70" y1="10" x2="70" y2="165" stroke={theme.accent3} strokeWidth="0.75" opacity="0.5" />
          <polygon points="70,28 103,55 70,82 37,55" fill={theme.accent3} opacity="0.08" />
          <circle cx="70" cy="60" r="3.5" fill={theme.accent3} opacity="0.9" />
          <circle cx="70" cy="60" r="7" fill="none" stroke={theme.accent3} strokeWidth="0.5" opacity="0.3" />
          <circle cx="70" cy="60" r="12" fill="none" stroke={theme.accent} strokeWidth="0.3" opacity="0.15" />
        </svg>
      </div>

      {/* === DASHBOARD PANELS === */}

      {/* Panel 1: Revenue Analytics */}
      {panel(
        3.5,
        10,
        0.1,
        <>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full" style={{ background: theme.accent }} />
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: theme.panelMuted }}>
              {isRtl ? 'تحليلات الإيرادات' : 'Revenue Analytics'}
            </span>
          </div>
          <div className="text-lg font-bold" style={{ color: theme.panelVal }}>
            $128,420.00
          </div>
          <div className="text-[10px] mb-2" style={{ color: theme.panelMuted }}>
            {isRtl ? 'إجمالي الإيرادات' : 'Total Revenue'}
          </div>
          <BarChart colors={chartColors} />
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              <span className="text-xs" style={{ color: theme.panelPct }}>
                ↑ 12.5%
              </span>
              <span className="text-[9px]" style={{ color: theme.panelMuted }}>
                {isRtl ? 'الشهر الماضي' : 'vs last month'}
              </span>
            </div>
            <span className="text-[9px]" style={{ color: theme.panelMuted }}>
              Q2 2026
            </span>
          </div>
        </>,
        46,
      )}

      {/* Panel 2: Sales Pipeline */}
      {panel(
        2,
        57,
        0.25,
        <>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full" style={{ background: theme.accent2 }} />
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: theme.panelMuted }}>
              {isRtl ? 'مسار المبيعات' : 'Sales Pipeline'}
            </span>
          </div>
          <div className="space-y-1.5 mb-3">
            {[
              { label: isRtl ? 'تم الإغلاق' : 'Won', value: '$84.2k', color: theme.panelPct },
              { label: isRtl ? 'قيد الانتظار' : 'Pending', value: '$36.8k', color: theme.panelMuted },
              { label: isRtl ? 'ملغي' : 'Lost', value: '$12.4k', color: 'rgba(239,68,68,0.6)' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: item.color }} />
                  <span className="text-xs" style={{ color: theme.panelText }}>
                    {item.label}
                  </span>
                </div>
                <span className="text-xs font-semibold" style={{ color: theme.panelVal }}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full" style={{ background: `${theme.panelBorder}` }}>
              <div
                className="h-full rounded-full"
                style={{ width: '78%', background: `linear-gradient(90deg, ${theme.accent}, ${theme.accent2})` }}
              />
            </div>
            <span className="text-[10px] font-medium" style={{ color: theme.panelPct }}>
              78%
            </span>
          </div>
          <div className="text-[9px] mt-1" style={{ color: theme.panelMuted }}>
            {isRtl ? 'معدل التحويل' : 'Conversion rate'}
          </div>
        </>,
        40,
      )}

      {/* Panel 3: System Modules */}
      {panel(
        40,
        4,
        0.4,
        <>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full" style={{ background: theme.accent3 }} />
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: theme.panelMuted }}>
              {isRtl ? 'الوحدات النشطة' : 'Active Modules'}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {[
              { label: isRtl ? 'إدارة المبيعات' : 'Sales Management' },
              { label: isRtl ? 'العمليات المالية' : 'Financial Ops' },
              { label: isRtl ? 'الموارد البشرية' : 'HR & Payroll' },
              { label: isRtl ? 'التحليلات الذكية' : 'AI Analytics' },
              { label: isRtl ? 'إدارة المخزون' : 'Inventory Control' },
              { label: isRtl ? 'إدارة العملاء' : 'CRM Platform' },
            ].map((m) => (
              <div key={m.label} className="flex items-center gap-1.5">
                <svg className="w-2.5 h-2.5 flex-shrink-0" viewBox="0 0 10 10">
                  <circle cx="5" cy="5" r="4" fill={theme.accent} opacity="0.3" />
                  <circle cx="5" cy="5" r="2" fill={theme.accent2} />
                </svg>
                <span className="text-[10px]" style={{ color: theme.panelText }}>
                  {m.label}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-2" style={{ borderTop: `1px solid ${theme.panelBorder}` }}>
            <div className="flex items-center justify-between text-[10px]">
              <span style={{ color: theme.panelMuted }}>{isRtl ? 'جميع الأنظمة تعمل' : 'All systems operational'}</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: theme.panelPct }} />
                <span style={{ color: theme.panelPct }}>99.97%</span>
              </span>
            </div>
          </div>
        </>,
        42,
      )}

      {/* Panel 4: Live Activity */}
      {panel(
        38,
        72,
        0.55,
        <>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full" style={{ background: theme.panelPct }} />
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: theme.panelMuted }}>
              {isRtl ? 'النشاط المباشر' : 'Live Activity'}
            </span>
            <span className="ml-auto flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: theme.panelPct }} />
              <span className="text-[9px]" style={{ color: theme.panelMuted }}>
                Live
              </span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {[
              { label: isRtl ? 'المستخدمون' : 'Users', value: '1,247', change: '+18.6%' },
              { label: isRtl ? 'المعاملات' : 'Transactions', value: '4,892', change: '+7.2%' },
              { label: isRtl ? 'المشاريع' : 'Projects', value: '36', change: '+2' },
              { label: isRtl ? 'الفواتير' : 'Invoices', value: '892', change: '+12.3%' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl p-2.5" style={{ background: theme.panelBorder }}>
                <div className="text-[9px]" style={{ color: theme.panelMuted }}>
                  {s.label}
                </div>
                <div className="text-sm font-bold" style={{ color: theme.panelVal }}>
                  {s.value}
                </div>
                <div className="text-[9px]" style={{ color: theme.panelPct }}>
                  {s.change}
                </div>
              </div>
            ))}
          </div>
          <MiniLineChart color={theme.accent} />
        </>,
        48,
      )}

      {/* Panel 5: Quick Metrics */}
      {panel(
        44,
        44,
        0.7,
        <>
          <div className="flex items-center gap-2 mb-2.5">
            <span className="w-2 h-2 rounded-full" style={{ background: theme.accent }} />
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: theme.panelMuted }}>
              {isRtl ? 'المؤشرات الرئيسية' : 'Key Metrics'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            {[
              { label: isRtl ? 'الإيرادات' : 'Revenue', value: '$1.2M', up: true },
              { label: isRtl ? 'النمو' : 'Growth', value: '23.5%', up: true },
              { label: isRtl ? 'الزبائن' : 'Clients', value: '847', up: true },
              { label: isRtl ? 'المهام' : 'Tasks', value: '128', up: false },
            ].map((m) => (
              <div key={m.label} className="text-center">
                <div className="text-xs font-bold" style={{ color: theme.panelVal }}>
                  {m.value}
                </div>
                <div className="text-[8px] uppercase tracking-wider mt-0.5" style={{ color: theme.panelMuted }}>
                  {m.label}
                </div>
              </div>
            ))}
          </div>
        </>,
        40,
      )}

      {/* Corner vignette */}
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
