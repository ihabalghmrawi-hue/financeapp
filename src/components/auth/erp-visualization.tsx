'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const modules = [
  { label: 'Sales', color: '#00E676', x: 15, y: 10, w: 28, h: 12, icon: '📊' },
  { label: 'CRM', color: '#00BCD4', x: 55, y: 8, w: 24, h: 10, icon: '👥' },
  { label: 'Inventory', color: '#18FFFF', x: 8, y: 32, w: 26, h: 11, icon: '📦' },
  { label: 'HR', color: '#00E676', x: 52, y: 28, w: 22, h: 10, icon: '👤' },
  { label: 'Accounting', color: '#00BCD4', x: 14, y: 54, w: 30, h: 11, icon: '💰' },
  { label: 'Analytics', color: '#18FFFF', x: 56, y: 50, w: 26, h: 10, icon: '📈' },
  { label: 'Operations', color: '#00E676', x: 10, y: 74, w: 28, h: 10, icon: '⚙️' },
  { label: 'Projects', color: '#00BCD4', x: 52, y: 72, w: 24, h: 11, icon: '📋' },
]

const connections = [
  { from: { x: 29, y: 16 }, to: { x: 55, y: 13 } },
  { from: { x: 21, y: 37 }, to: { x: 52, y: 33 } },
  { from: { x: 29, y: 59 }, to: { x: 56, y: 55 } },
  { from: { x: 24, y: 79 }, to: { x: 52, y: 77 } },
  { from: { x: 55, y: 18 }, to: { x: 21, y: 37 } },
  { from: { x: 52, y: 38 }, to: { x: 29, y: 59 } },
]

export function ErpVisualization({ className }: { className?: string }) {
  return (
    <div className={cn('relative w-full h-full overflow-hidden', className)}>
      {/* Ambient background glow */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-cyan-500/6 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[150px]" />
      </div>

      {/* Grid pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="erp-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#erp-grid)" />
      </svg>

      {/* Central core hub */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
      >
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400/20 via-cyan-400/15 to-blue-400/20 backdrop-blur-2xl border border-white/10 flex items-center justify-center brand-glow">
            <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10">
              <path d="M12 12h16M12 20h12M12 28h16" stroke="url(#hub-grad)" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M12 10v20" stroke="url(#hub-grad)" strokeWidth="2.5" strokeLinecap="round" opacity="0.5" />
              <defs>
                <linearGradient id="hub-grad" x1="10" y1="10" x2="30" y2="30">
                  <stop stopColor="#00E676" />
                  <stop offset="0.5" stopColor="#00BCD4" />
                  <stop offset="1" stopColor="#18FFFF" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <motion.div
            className="absolute -inset-4 rounded-3xl border border-white/5"
            animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      </motion.div>

      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full z-0 pointer-events-none" style={{ opacity: 0.3 }}>
        {connections.map((conn, i) => (
          <motion.line
            key={i}
            x1={`${conn.from.x}%`}
            y1={`${conn.from.y}%`}
            x2={`${conn.to.x}%`}
            y2={`${conn.to.y}%`}
            stroke="url(#line-grad)"
            strokeWidth="1"
            strokeDasharray="4 4"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
          />
        ))}
        <defs>
          <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00E676" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#00BCD4" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#18FFFF" stopOpacity="0.5" />
          </linearGradient>
        </defs>
      </svg>

      {/* Floating module cards */}
      {modules.map((mod, i) => (
        <motion.div
          key={mod.label}
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'absolute',
            left: `${mod.x}%`,
            top: `${mod.y}%`,
            width: `${mod.w}%`,
            height: `${mod.h}%`,
          }}
          className="erp-module-card group"
        >
          <motion.div
            className="flex items-center gap-2 px-3 py-2 h-full"
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 4 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
          >
            <span className="text-sm flex-shrink-0">{mod.icon}</span>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-white/90 truncate">{mod.label}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: mod.color }} />
                <span className="text-[8px] text-white/30">Active</span>
              </div>
            </div>
            <div className="mr-auto flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-white/5" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/5" />
            </div>
          </motion.div>
        </motion.div>
      ))}

      {/* Data flow particles */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            left: `${10 + i * 30}%`,
            top: `${30 + i * 15}%`,
            background: i === 0 ? '#00E676' : i === 1 ? '#00BCD4' : '#18FFFF',
            boxShadow:
              i === 0
                ? '0 0 6px rgba(0,230,118,0.5)'
                : i === 1
                  ? '0 0 6px rgba(0,188,212,0.5)'
                  : '0 0 6px rgba(24,255,255,0.5)',
            filter: 'blur(0.5px)',
          }}
          animate={{
            x: ['0%', '100%', '0%'],
            y: ['20%', '60%', '20%'],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 10 + i * 3,
            repeat: Infinity,
            ease: 'linear',
            delay: i * 2,
          }}
        />
      ))}

      {/* Bottom decorative glow bar */}
      <div className="absolute bottom-0 left-10 right-10 h-px erp-glow-line opacity-30" />
    </div>
  )
}
