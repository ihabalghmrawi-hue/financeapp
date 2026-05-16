'use client'

import { cn } from '@/lib/utils'
import type { UploadProgress as UploadProgressType } from '@/lib/native/types'
import { useT } from '@/lib/i18n/language-provider'
import { Upload, CheckCircle2, XCircle, Loader2 } from 'lucide-react'

interface UploadProgressProps {
  uploads: UploadProgressType[]
  onDismiss?: (fileId: string) => void
  className?: string
}

export function UploadProgressComponent({ uploads, onDismiss, className }: UploadProgressProps) {
  const { t } = useT()
  if (uploads.length === 0) {
    return null
  }

  return (
    <div className={cn('fixed bottom-24 right-4 left-4 z-50 space-y-2', className)} dir="rtl">
      {uploads.map((upload) => (
        <div
          key={upload.fileId}
          className={cn(
            'bg-card border rounded-xl shadow-xl p-3 transition-all',
            upload.status === 'completed' && 'border-success/30',
            upload.status === 'failed' && 'border-destructive/30',
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'p-1.5 rounded-full shrink-0',
                upload.status === 'completed' && 'bg-success/10',
                upload.status === 'failed' && 'bg-destructive/10',
                upload.status === 'uploading' && 'bg-primary/10',
              )}
            >
              {upload.status === 'completed' ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : upload.status === 'failed' ? (
                <XCircle className="h-4 w-4 text-destructive" />
              ) : upload.status === 'uploading' ? (
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
              ) : (
                <Upload className="h-4 w-4 text-muted-foreground" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{upload.fileName}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {upload.status === 'uploading' && `${upload.progress}% (${Math.round(upload.speed / 1024)} KB/s)`}
                {upload.status === 'completed' && t('uploadProgress.completed')}
                {upload.status === 'failed' && (upload.error ?? t('uploadProgress.failed'))}
                {upload.status === 'queued' && t('uploadProgress.queued')}
              </p>
            </div>

            {upload.status === 'completed' && onDismiss && (
              <button
                onClick={() => onDismiss(upload.fileId)}
                className="text-[10px] text-primary hover:underline shrink-0"
              >
                {t('uploadProgress.hide')}
              </button>
            )}
          </div>

          {upload.status === 'uploading' && (
            <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${upload.progress}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
