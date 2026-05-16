'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n/language-provider'
import { Button } from './button'
import { Inbox, Search, FilePlus, Package, Users, Wallet, ShoppingCart } from 'lucide-react'

interface EmptyStateAction {
  label: string
  href?: string
  onClick?: () => void
}

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: EmptyStateAction
  secondaryAction?: EmptyStateAction
  variant?: 'default' | 'premium' | 'glass' | 'minimal'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const iconMap = {
  inbox: Inbox,
  search: Search,
  file: FilePlus,
  package: Package,
  users: Users,
  wallet: Wallet,
  cart: ShoppingCart,
}

const variantStyles = {
  default: '',
  premium:
    'bg-gradient-to-br from-card via-card to-card/50 border border-border/40 rounded-2xl shadow-lg shadow-black/5',
  glass: 'bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl dark:bg-black/20',
  minimal: '',
}

const sizeStyles = {
  sm: 'py-8 px-4',
  md: 'py-12 px-6',
  lg: 'py-16 px-8',
}

const iconSizes = {
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-20 h-20',
}

function ActionButton({
  action,
  size,
  primary,
}: {
  action: EmptyStateAction
  size: 'sm' | 'md' | 'lg'
  primary: boolean
}) {
  const btn = (
    <Button onClick={action.onClick} variant={primary ? 'default' : 'outline'} size={size === 'sm' ? 'sm' : 'md'}>
      {action.label}
    </Button>
  )

  if (action.href) {
    return <Link href={action.href}>{btn}</Link>
  }

  return btn
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  variant = 'default',
  size = 'md',
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        sizeStyles[size],
        variantStyles[variant],
        variant === 'default' && 'rounded-2xl',
        className,
      )}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          'mb-4 rounded-full flex items-center justify-center',
          variant === 'glass' ? 'bg-white/10' : 'bg-muted',
          size === 'sm' ? 'p-3' : 'p-4',
        )}
      >
        <div className={cn('text-muted-foreground', iconSizes[size])}>
          {icon || <Inbox className="w-full h-full" />}
        </div>
      </motion.div>

      <motion.h3
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
        className={cn(
          'font-semibold text-foreground',
          size === 'sm' && 'text-sm',
          size === 'md' && 'text-base',
          size === 'lg' && 'text-lg',
        )}
      >
        {title}
      </motion.h3>

      {description && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className={cn(
            'text-muted-foreground mt-1.5 max-w-sm',
            size === 'sm' && 'text-xs',
            size === 'md' && 'text-sm',
            size === 'lg' && 'text-base',
          )}
        >
          {description}
        </motion.p>
      )}

      {(action || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
          className="flex items-center gap-3 mt-5"
        >
          {action && <ActionButton action={action} size={size} primary />}
          {secondaryAction && <ActionButton action={secondaryAction} size={size} primary={false} />}
        </motion.div>
      )}
    </motion.div>
  )
}

export function SmartEmptyState({ module, onAction }: { module: string; onAction?: (action: string) => void }) {
  const { t } = useT()
  const configs: Record<string, { icon: React.ReactNode; title: string; description: string; suggestions: string[] }> =
    {
      sales: {
        icon: <ShoppingCart className="w-full h-full" />,
        title: t('ui.emptyState.sales.title'),
        description: t('ui.emptyState.sales.description'),
        suggestions: [
          t('ui.emptyState.sales.suggestion1'),
          t('ui.emptyState.sales.suggestion2'),
          t('ui.emptyState.sales.suggestion3'),
        ],
      },
      inventory: {
        icon: <Package className="w-full h-full" />,
        title: t('ui.emptyState.inventory.title'),
        description: t('ui.emptyState.inventory.description'),
        suggestions: [
          t('ui.emptyState.inventory.suggestion1'),
          t('ui.emptyState.inventory.suggestion2'),
          t('ui.emptyState.inventory.suggestion3'),
        ],
      },
      customers: {
        icon: <Users className="w-full h-full" />,
        title: t('ui.emptyState.customers.title'),
        description: t('ui.emptyState.customers.description'),
        suggestions: [
          t('ui.emptyState.customers.suggestion1'),
          t('ui.emptyState.customers.suggestion2'),
          t('ui.emptyState.customers.suggestion3'),
        ],
      },
      expenses: {
        icon: <Wallet className="w-full h-full" />,
        title: t('ui.emptyState.expenses.title'),
        description: t('ui.emptyState.expenses.description'),
        suggestions: [
          t('ui.emptyState.expenses.suggestion1'),
          t('ui.emptyState.expenses.suggestion2'),
          t('ui.emptyState.expenses.suggestion3'),
        ],
      },
    }

  const config = configs[module] || {
    icon: <Inbox className="w-full h-full" />,
    title: t('common.noData'),
    description: t('ui.emptyState.default.description'),
    suggestions: [
      t('ui.emptyState.default.suggestion1'),
      t('ui.emptyState.default.suggestion2'),
      t('ui.emptyState.default.suggestion3'),
    ],
  }

  return (
    <EmptyState
      icon={config.icon}
      title={config.title}
      description={config.description}
      action={{
        label: config.suggestions[0],
        onClick: () => onAction?.(config.suggestions[0]),
      }}
      secondaryAction={{
        label: t('ui.emptyState.learnMore'),
        onClick: () => onAction?.('help'),
      }}
      variant="premium"
    />
  )
}
