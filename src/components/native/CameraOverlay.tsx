'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n/language-provider'
import { Camera, X, RotateCcw, Check, Zap, ZapOff } from 'lucide-react'

interface CameraOverlayProps {
  open: boolean
  onClose: () => void
  onCapture: (path: string) => void
  mode?: 'photo' | 'document'
  className?: string
}

export function CameraOverlay({ open, onClose, onCapture, mode = 'photo', className }: CameraOverlayProps) {
  const { t } = useT()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [flash, setFlash] = useState(false)
  const [facing, setFacing] = useState<'environment' | 'user'>('environment')
  const [capturing, setCapturing] = useState(false)

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch {
      /* ignore */
    }
  }, [facing])

  useEffect(() => {
    if (open) {
      startCamera()
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }
  }, [open, startCamera])

  const capture = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) {
      return
    }

    setCapturing(true)
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }

    if (facing === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }
    ctx.drawImage(video, 0, 0)

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const path = URL.createObjectURL(blob)
          onCapture(path)
        }
        setCapturing(false)
      },
      'image/jpeg',
      0.9,
    )
  }, [facing, onCapture])

  const toggleCamera = useCallback(() => {
    setFacing((f) => (f === 'environment' ? 'user' : 'environment'))
  }, [])

  if (!open) {
    return null
  }

  return (
    <div className={cn('fixed inset-0 z-[95] bg-black', className)}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={cn('w-full h-full object-cover', facing === 'user' && 'scale-x-[-1]')}
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Frame overlay */}
      <div className="absolute inset-0 pointer-events-none">
        {mode === 'document' && (
          <div className="absolute inset-x-8 top-1/4 bottom-1/4 border-2 border-white/50 rounded-xl">
            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-white" />
            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-white" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-white" />
            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-white" />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 inset-x-0 p-6 pb-10 bg-gradient-to-t from-black/60 to-transparent">
        <div className="flex items-center justify-center gap-8">
          <button
            onClick={toggleCamera}
            className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white"
            aria-label={t('camera.flip')}
          >
            <RotateCcw className="h-6 w-6" />
          </button>

          <button
            onClick={capture}
            disabled={capturing}
            className={cn(
              'w-16 h-16 rounded-full border-4 border-white flex items-center justify-center transition-transform active:scale-95',
              capturing && 'opacity-50',
            )}
          >
            <div className="w-12 h-12 rounded-full bg-white" />
          </button>

          <button
            onClick={() => setFlash(!flash)}
            className="p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white"
            aria-label={t('camera.flash')}
          >
            {flash ? <Zap className="h-6 w-6" /> : <ZapOff className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <button
        onClick={onClose}
        className="absolute top-4 left-4 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors text-white z-10"
        aria-label={t('common.close')}
      >
        <X className="h-6 w-6" />
      </button>
    </div>
  )
}
