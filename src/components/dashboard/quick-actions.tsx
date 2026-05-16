'use client'

import Link from 'next/link'
import { useT } from '@/lib/i18n/language-provider'
import { Plus, FileText, BarChart3, BookOpen } from 'lucide-react'

interface QuickActionsProps {
  companyId: string
}

export function QuickActions({ companyId }: QuickActionsProps) {
  const { t } = useT()
  const actions = [
    {
      label: t('dashboard.quickActions.newEntry'),
      description: t('dashboard.quickActions.addTransaction'),
      href: '/dashboard/transactions/new',
      icon: Plus,
      color: 'bg-primary text-white hover:bg-primary/90',
    },
    {
      label: t('dashboard.quickActions.journalEntry'),
      description: t('dashboard.quickActions.dailyEntry'),
      href: '/dashboard/journal/new',
      icon: BookOpen,
      color: 'bg-purple-600 text-white hover:bg-purple-700',
    },
    {
      label: t('nav.reports'),
      description: t('dashboard.quickActions.viewReports'),
      href: '/dashboard/reports',
      icon: BarChart3,
      color: 'bg-emerald-600 text-white hover:bg-emerald-700',
    },
    {
      label: t('dashboard.quickActions.statement'),
      description: t('dashboard.quickActions.printReport'),
      href: '/dashboard/reports?type=statement',
      icon: FileText,
      color: 'bg-orange-500 text-white hover:bg-orange-600',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <Link
            key={action.href}
            href={action.href}
            className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-150 shadow-sm hover:shadow-md ${action.color}`}
          >
            <div className="bg-white/20 p-2 rounded-lg">
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">{action.label}</p>
              <p className="text-xs opacity-80">{action.description}</p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
