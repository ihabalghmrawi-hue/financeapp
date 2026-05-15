'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'

interface NetworkStatusProps {
  className?: string
}

export function NetworkStatus({ className }: NetworkStatusProps) {
  const [online, setOnline] = useState(true)
  const [show, setShow] = useState(false)

  useEffect(() => {
    setOnline(navigator.onLine)
    const goOnline = () => {
      setOnline(true)
      setTimeout(() => setShow(false), 2000)
    }
    const goOffline = () => {
      setOnline(false)
      setShow(true)
    }
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return (
    <AnimatePresence>
      {(show || !online) && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className={cn(
            'fixed top-0 left-0 right-0 z-[1000] flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium',
            online ? 'bg-success text-success-foreground' : 'bg-destructive text-destructive-foreground',
            className,
          )}
        >
          {online ? (
            <>
              <Wifi className="w-3.5 h-3.5" />
              تمت استعادة الاتصال
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              لا يوجد اتصال بالإنترنت
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 transition-colors"
              >
                <RefreshCw className="w-3 h-3" /> إعادة المحاولة
              </button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
