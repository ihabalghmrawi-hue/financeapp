'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ShoppingCart, Delete, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

const COMPANY_NAME = process.env.NEXT_PUBLIC_COMPANY_NAME || 'المتجر'

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['del', '0', '✓'],
]

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [welcome, setWelcome] = useState('')

  const handleLogin = async (code: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: code }),
      })
      const data = await res.json()
      if (!res.ok) {
        const msg = data.error
        setError(typeof msg === 'string' ? msg : msg?.message || 'رقم سري خاطئ')
        setPin('')
        setLoading(false)
        return
      }
      const name = data.name || 'بك'
      setWelcome(`مرحباً ${name}! 👋`)
      setTimeout(() => {
        const from = params.get('from') || '/dashboard'
        router.replace(from)
      }, 900)
    } catch {
      setError('حدث خطأ في الاتصال')
      setPin('')
      setLoading(false)
    }
  }

  const handleKey = (key: string) => {
    if (key === 'del') {
      setPin((p) => p.slice(0, -1))
      return
    }
    if (pin.length >= 6) {
      return
    }
    const newPin = pin + key
    setPin(newPin)
    if (newPin.length >= 4) {
      handleLogin(newPin)
    }
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-6 shadow-premium-lg space-y-6">
        <div className="absolute -inset-0.5 bg-gradient-to-b from-primary/10 to-transparent rounded-3xl opacity-50 pointer-events-none" />

        <div className="relative">
          {/* PIN dots */}
          <div className="flex justify-center gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                animate={
                  i < pin.length
                    ? { scale: 1, backgroundColor: 'hsl(var(--primary))', borderColor: 'hsl(var(--primary))' }
                    : { scale: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }
                }
                className="w-11 h-11 rounded-2xl border-2 flex items-center justify-center transition-all duration-200"
              >
                {i < pin.length && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-3 h-3 bg-white rounded-full" />
                )}
              </motion.div>
            ))}
          </div>

          <AnimatePresence>
            {welcome && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-2 bg-success/10 text-success text-sm font-semibold p-3 rounded-xl"
              >
                {welcome}
              </motion.div>
            )}

            {error && !welcome && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 bg-destructive/10 text-destructive text-sm p-3 rounded-xl"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-2">
            {KEYS.flat().map((key) => (
              <button
                key={key}
                onClick={() => !loading && handleKey(key)}
                disabled={loading}
                className={cn(
                  'h-14 rounded-2xl text-lg font-bold transition-all duration-150 active:scale-95 select-none',
                  key === 'del'
                    ? 'bg-white/5 text-white/50 hover:bg-white/10'
                    : key === '✓'
                      ? 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20'
                      : 'bg-white/5 text-white hover:bg-white/10',
                )}
              >
                {loading && key === '✓' ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : key === 'del' ? (
                  <Delete className="w-5 h-5 mx-auto" />
                ) : (
                  key
                )}
              </button>
            ))}
          </div>

          <p className="text-center text-xs text-white/30">المدير: 1234 (قابل للتغيير من .env)</p>
        </div>
      </div>
    </motion.div>
  )
}

export default function StaffLoginPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden" dir="rtl">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] animate-pulse-soft"
          style={{ animationDuration: '4s' }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] animate-pulse-soft"
          style={{ animationDuration: '5s' }}
        />
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="staff-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#staff-grid)" />
        </svg>
      </div>

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-primary/10 backdrop-blur-xl border border-primary/20 shadow-glow-green">
            <ShoppingCart className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-white">{COMPANY_NAME}</h1>
          <p className="text-white/50 text-sm mt-1">أدخل رقمك السري للدخول</p>
        </div>
        <Suspense
          fallback={
            <div className="h-64 backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl animate-pulse" />
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
