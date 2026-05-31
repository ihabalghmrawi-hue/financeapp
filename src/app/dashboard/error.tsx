'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 p-8">
      <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 max-w-2xl w-full text-center">
        <div className="w-12 h-12 rounded-2xl bg-destructive/20 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-destructive" />
        </div>
        <h2 className="text-lg font-bold text-destructive mb-2">حدث خطأ غير متوقع</h2>
        <p className="text-sm text-muted-foreground font-mono bg-destructive/10 p-3 rounded-lg break-all">
          {error.message || 'يرجى المحاولة مرة أخرى'}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm hover:bg-destructive/90 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          إعادة المحاولة
        </button>
      </div>
    </div>
  )
}
