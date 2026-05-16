'use client'

import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n/language-provider'
import type { LucideIcon } from 'lucide-react'

interface ActionSheetAction {
  id: string
  label: string
  icon?: LucideIcon
  destructive?: boolean
  disabled?: boolean
  divider?: boolean
}

interface MobileActionSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  actions: ActionSheetAction[]
  onSelect: (actionId: string) => void
  className?: string
}

export function MobileActionSheet({
  open,
  onClose,
  title,
  description,
  actions,
  onSelect,
  className,
}: MobileActionSheetProps) {
  const { t } = useT()
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end" dir="rtl">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div
        className={cn('relative w-full bg-background rounded-t-2xl shadow-2xl animate-slide-up p-4 pb-8', className)}
      >
        {title && <h3 className="text-base font-semibold text-center mb-1">{title}</h3>}
        {description && <p className="text-sm text-muted-foreground text-center mb-4">{description}</p>}

        <div className="space-y-1">
          {actions.map((action) => (
            <div key={action.id}>
              <button
                onClick={() => {
                  if (!action.disabled) {
                    onSelect(action.id)
                    onClose()
                  }
                }}
                disabled={action.disabled}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-colors',
                  action.destructive ? 'text-destructive hover:bg-destructive/10' : 'text-foreground hover:bg-accent',
                  action.disabled && 'opacity-50 cursor-not-allowed',
                )}
              >
                {action.icon && <action.icon className="h-5 w-5 shrink-0" />}
                <span>{action.label}</span>
              </button>
              {action.divider && <div className="h-px bg-border mx-4 my-1" />}
            </div>
          ))}
        </div>

        <div className="mt-3">
          <button
            onClick={onClose}
            className="w-full py-3.5 rounded-xl bg-muted text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            {t('common.cancel')}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
