'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { signatureCaptureWorkflow } from '@/lib/native/workflow/signature-capture'
import { Pen, Trash2, Check, X } from 'lucide-react'

interface SignaturePadProps {
  open: boolean
  onConfirm: (dataUrl: string) => void
  onCancel: () => void
  title?: string
  className?: string
}

export function SignaturePad({ open, onConfirm, onCancel, title, className }: SignaturePadProps) {
  const [canvasEl, setCanvasEl] = useState<HTMLCanvasElement | null>(null)
  const [drawing, setDrawing] = useState(false)
  const [hasContent, setHasContent] = useState(false)
  const [capturing, setCapturing] = useState(false)

  const getCtx = useCallback(() => {
    return canvasEl?.getContext('2d')
  }, [canvasEl])

  const startDraw = useCallback(
    (x: number, y: number) => {
      const ctx = getCtx()
      if (!ctx) {
        return
      }
      setDrawing(true)
      ctx.beginPath()
      ctx.moveTo(x, y)
    },
    [getCtx],
  )

  const draw = useCallback(
    (x: number, y: number) => {
      const ctx = getCtx()
      if (!ctx || !drawing) {
        return
      }
      ctx.lineTo(x, y)
      ctx.stroke()
    },
    [getCtx, drawing],
  )

  const endDraw = useCallback(() => {
    setDrawing(false)
    setHasContent(true)
  }, [])

  const getPosition = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasEl
    if (!canvas) {
      return { x: 0, y: 0 }
    }
    const rect = canvas.getBoundingClientRect()
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const clear = useCallback(() => {
    const ctx = getCtx()
    const canvas = canvasEl
    if (!ctx || !canvas) {
      return
    }
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHasContent(false)
  }, [getCtx, canvasEl])

  const confirm = useCallback(async () => {
    const canvas = canvasEl
    if (!canvas) {
      return
    }
    setCapturing(true)
    const dataUrl = canvas.toDataURL('image/png')
    onConfirm(dataUrl)
    setCapturing(false)
  }, [onConfirm, canvasEl])

  const initCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    if (!canvas) {
      return
    }
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  if (!open) {
    return null
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-[98] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4',
        className,
      )}
      dir="rtl"
    >
      <div className="bg-card rounded-2xl shadow-2xl border w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Pen className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">{title ?? 'التوقيع'}</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4">
          <canvas
            ref={(el) => {
              setCanvasEl(el)
              if (el) {
                initCanvas(el)
              }
            }}
            width={500}
            height={200}
            className="w-full border rounded-xl bg-white touch-none cursor-crosshair"
            style={{ height: '160px' }}
            onMouseDown={(e) => {
              const pos = getPosition(e)
              startDraw(pos.x, pos.y)
            }}
            onMouseMove={(e) => {
              const pos = getPosition(e)
              draw(pos.x, pos.y)
            }}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={(e) => {
              e.preventDefault()
              const pos = getPosition(e)
              startDraw(pos.x, pos.y)
            }}
            onTouchMove={(e) => {
              e.preventDefault()
              const pos = getPosition(e)
              draw(pos.x, pos.y)
            }}
            onTouchEnd={endDraw}
          />
          <p className="text-[10px] text-muted-foreground mt-1 text-center">وقع أعلاه</p>
        </div>

        <div className="flex items-center gap-2 px-4 py-3 border-t bg-muted/30">
          <button
            onClick={clear}
            disabled={!hasContent}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
              'text-muted-foreground hover:bg-accent',
              !hasContent && 'opacity-50',
            )}
          >
            <Trash2 className="h-3.5 w-3.5" />
            مسح
          </button>

          <div className="flex-1" />

          <button
            onClick={confirm}
            disabled={!hasContent || capturing}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors',
              'bg-primary text-primary-foreground hover:bg-primary/90',
              (!hasContent || capturing) && 'opacity-50',
            )}
          >
            <Check className="h-3.5 w-3.5" />
            {capturing ? 'جاري...' : 'تأكيد'}
          </button>
        </div>
      </div>
    </div>
  )
}
