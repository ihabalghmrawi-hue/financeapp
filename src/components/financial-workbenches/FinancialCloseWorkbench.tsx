'use client'

import { useState, useMemo } from 'react'
import { useT } from '@/lib/i18n/language-provider'
import { cn } from '@/lib/utils'
import {
  Search,
  Filter,
  ArrowUpDown,
  Plus,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Clock,
  User,
  FileText,
  DollarSign,
  Building2,
  Landmark,
  ArrowLeftRight,
  Receipt,
  Sparkles,
  Shield,
  Activity,
  TrendingUp,
  TrendingDown,
  Calendar,
  Hash,
  Layers,
  Flag,
  FlagTriangleRight,
  ListChecks,
  BarChart3,
  PlayCircle,
  PauseCircle,
  RotateCcw,
  ChevronLeft,
  CheckCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { EnterpriseBreadcrumbs } from '@/components/enterprise/Navigation/Breadcrumbs'
import { WorkbenchShell } from '@/components/workbench/WorkbenchShell'
import { InspectorPanel } from '@/components/workbench/InspectorPanel'
import { RealtimeValidationBar } from '@/components/workbench/RealtimeValidationBar'
import { AIAssistancePanel } from '@/components/workbench/AIAssistancePanel'
import { TransactionGraph } from '@/components/workbench/TransactionGraph'
import { AuditOverlay } from '@/components/workbench/AuditOverlay'
import { OperationalCommenting } from '@/components/workbench/OperationalCommenting'
import { CrossEntityInspector } from '@/components/workbench/CrossEntityInspector'
import {
  generateMockAccounts,
  generateMockJournalEntries,
  generateMockAIInsights,
  generateMockAuditTrail,
  generateMockOperationalComments,
  generateMockReconciliationItems,
} from '@/lib/workbench/mock-data'
import type { ValidationMessage, AIInsight, WorkbenchMetric, InspectorTab } from '@/lib/workbench/types'

interface CloseStage {
  id: string
  name: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped'
  progress: number
  dueDate: number
  assignee: string
  subTasks: CloseSubTask[]
  issues: CloseIssue[]
}

interface CloseSubTask {
  id: string
  name: string
  status: 'pending' | 'completed' | 'failed'
  completedBy?: string
  completedAt?: number
}

interface CloseIssue {
  id: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'open' | 'resolved' | 'wont_fix'
  raisedBy: string
  raisedAt: number
}

export function FinancialCloseWorkbench() {
  const { t } = useT()

  const stageNames = [
    t('financialWorkbench.close.stageName0'),
    t('financialWorkbench.close.stageName1'),
    t('financialWorkbench.close.stageName2'),
    t('financialWorkbench.close.stageName3'),
    t('financialWorkbench.close.stageName4'),
    t('financialWorkbench.close.stageName5'),
    t('financialWorkbench.close.stageName6'),
    t('financialWorkbench.close.stageName7'),
    t('financialWorkbench.close.stageName8'),
    t('financialWorkbench.close.stageName9'),
    t('financialWorkbench.close.stageName10'),
    t('financialWorkbench.close.stageName11'),
  ]

  const stageDescriptions = [
    t('financialWorkbench.close.stageDesc0'),
    t('financialWorkbench.close.stageDesc1'),
    t('financialWorkbench.close.stageDesc2'),
    t('financialWorkbench.close.stageDesc3'),
    t('financialWorkbench.close.stageDesc4'),
    t('financialWorkbench.close.stageDesc5'),
    t('financialWorkbench.close.stageDesc6'),
    t('financialWorkbench.close.stageDesc7'),
    t('financialWorkbench.close.stageDesc8'),
    t('financialWorkbench.close.stageDesc9'),
    t('financialWorkbench.close.stageDesc10'),
    t('financialWorkbench.close.stageDesc11'),
  ]

  const employees = [
    t('financialWorkbench.close.employee0'),
    t('financialWorkbench.close.employee1'),
    t('financialWorkbench.close.employee2'),
    t('financialWorkbench.close.employee3'),
    t('financialWorkbench.close.employee4'),
    t('financialWorkbench.close.employee5'),
    t('financialWorkbench.close.employee6'),
    t('financialWorkbench.close.employee7'),
  ]

  function generateCloseStages(): CloseStage[] {
    return stageNames.map((name, idx) => {
      const now = Date.now()
      let status: CloseStage['status']
      if (idx < 5) {
        status = 'completed'
      } else if (idx === 5) {
        status = 'in_progress'
      } else if (idx < 8) {
        status = 'pending'
      } else {
        status = 'pending'
      }

      const subTasks: CloseSubTask[] = [
        {
          id: `st-${idx}-1`,
          name: t('financialWorkbench.close.subtaskFirst', { stage: idx + 1 }),
          status: idx < 5 ? 'completed' : idx === 5 ? 'completed' : 'pending',
        },
        {
          id: `st-${idx}-2`,
          name: t('financialWorkbench.close.subtaskSecond', { stage: idx + 1 }),
          status: idx < 5 ? 'completed' : idx === 5 ? ('in_progress' as any) : 'pending',
        },
        {
          id: `st-${idx}-3`,
          name: t('financialWorkbench.close.subtaskThird', { stage: idx + 1 }),
          status: idx < 4 ? 'completed' : 'pending',
        },
        {
          id: `st-${idx}-4`,
          name: t('financialWorkbench.close.subtaskReview', { stage: idx + 1 }),
          status: idx < 4 ? 'completed' : 'pending',
        },
        {
          id: `st-${idx}-5`,
          name: t('financialWorkbench.close.subtaskApprove', { stage: idx + 1 }),
          status: idx < 3 ? 'completed' : 'pending',
        },
      ]

      const issues: CloseIssue[] =
        idx === 5
          ? [
              {
                id: `iss-${idx}-1`,
                description: t('financialWorkbench.close.issueBankDiff'),
                severity: 'high',
                status: 'open',
                raisedBy: employees[2],
                raisedAt: now - 86400000 * 2,
              },
              {
                id: `iss-${idx}-2`,
                description: t('financialWorkbench.close.issueMissingDocs'),
                severity: 'medium',
                status: 'open',
                raisedBy: employees[1],
                raisedAt: now - 86400000,
              },
            ]
          : idx === 7
            ? [
                {
                  id: `iss-${idx}-1`,
                  description: t('financialWorkbench.close.issueExpenseNotClosed'),
                  severity: 'critical',
                  status: 'open',
                  raisedBy: employees[0],
                  raisedAt: now - 86400000 * 3,
                },
              ]
            : []

      return {
        id: `stage-${idx}`,
        name,
        description: stageDescriptions[idx],
        status,
        progress: idx < 3 ? 100 : idx === 3 ? 80 : idx === 4 ? 60 : idx === 5 ? 35 : 0,
        dueDate: now + (12 - idx) * 86400000,
        assignee: employees[idx % employees.length],
        subTasks,
        issues,
      }
    })
  }

  const statusConfig: Record<
    string,
    { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'; icon: any }
  > = {
    pending: { label: t('financialWorkbench.close.statusPending'), variant: 'secondary', icon: Clock },
    in_progress: { label: t('financialWorkbench.close.statusInProgress'), variant: 'warning', icon: PlayCircle },
    completed: { label: t('financialWorkbench.close.statusCompleted'), variant: 'success', icon: CheckCircle2 },
    failed: { label: t('financialWorkbench.close.statusFailed'), variant: 'destructive', icon: XCircle },
    skipped: { label: t('financialWorkbench.close.statusSkipped'), variant: 'outline', icon: XCircle },
  }

  const filterTabs = [
    { id: 'all', label: t('financialWorkbench.close.filterAll') },
    { id: 'pending', label: t('financialWorkbench.close.filterPending') },
    { id: 'in_progress', label: t('financialWorkbench.close.filterInProgress') },
    { id: 'completed', label: t('financialWorkbench.close.filterCompleted') },
    { id: 'failed', label: t('financialWorkbench.close.filterFailed') },
  ]

  const [stages] = useState(() => generateCloseStages())
  const [closedPeriod] = useState(t('financialWorkbench.close.periodDefault'))
  const [nextCloseDate] = useState(() => {
    const d = new Date()
    d.setMonth(d.getMonth() + 1, 5)
    return d.getTime()
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTab, setFilterTab] = useState('all')
  const [inspectorOpen, setInspectorOpen] = useState(true)
  const [inspectorTab, setInspectorTab] = useState('history')
  const [inspectorPinned, setInspectorPinned] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [auditOpen, setAuditOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('tasks')

  const aiInsights = useMemo(() => generateMockAIInsights('close'), [])
  const auditTrail = useMemo(() => generateMockAuditTrail(), [])

  const selected = useMemo(() => stages.find((s) => s.id === selectedId) ?? null, [stages, selectedId])

  const filtered = useMemo(() => {
    let list = stages
    if (filterTab !== 'all') {
      list = list.filter((s) => s.status === filterTab)
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter((s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q))
    }
    return list
  }, [stages, filterTab, searchQuery])

  const allValidationMessages = useMemo(() => {
    const msgs: ValidationMessage[] = []
    const inProgress = stages.filter((s) => s.status === 'in_progress')
    const failed = stages.filter((s) => s.status === 'failed')
    const openIssues = stages.reduce((count, s) => count + s.issues.filter((i) => i.status === 'open').length, 0)

    if (failed.length > 0) {
      msgs.push({
        id: 'failed-stages',
        type: 'error' as const,
        message: t('financialWorkbench.close.validationFailedStages', { count: failed.length }),
        field: t('financialWorkbench.close.fieldCloseStages'),
        action: { label: t('financialWorkbench.close.actionViewDetails'), handler: () => {} },
      })
    }
    if (openIssues > 0) {
      msgs.push({
        id: 'open-issues',
        type: 'warning' as const,
        message: t('financialWorkbench.close.validationOpenIssues', { count: openIssues }),
        field: t('financialWorkbench.close.fieldIssues'),
      })
    }
    if (inProgress.length === 0 && stages.some((s) => s.status === 'pending')) {
      msgs.push({
        id: 'no-progress',
        type: 'info' as const,
        message: t('financialWorkbench.close.validationNoProgress'),
        field: t('financialWorkbench.close.fieldProgress'),
      })
    }
    return msgs.slice(0, 6)
  }, [stages])

  const completeCount = useMemo(() => stages.filter((s) => s.status === 'completed').length, [stages])
  const inProgressCount = useMemo(() => stages.filter((s) => s.status === 'in_progress').length, [stages])
  const pendingCount = useMemo(() => stages.filter((s) => s.status === 'pending').length, [stages])
  const failedCount = useMemo(() => stages.filter((s) => s.status === 'failed').length, [stages])
  const daysUntilClose = useMemo(() => {
    return Math.ceil((nextCloseDate - Date.now()) / 86400000)
  }, [nextCloseDate])

  const overallProgress = useMemo(() => {
    if (stages.length === 0) {
      return 0
    }
    const total = stages.reduce((s, stage) => s + stage.progress, 0)
    return Math.round(total / stages.length)
  }, [stages])

  const metrics: WorkbenchMetric[] = useMemo(
    () => [
      {
        id: 'total-stages',
        label: t('financialWorkbench.close.metricStages'),
        value: stages.length,
        icon: 'DollarSign',
        severity: 'info' as const,
      },
      {
        id: 'completed',
        label: t('financialWorkbench.close.metricCompleted'),
        value: completeCount,
        icon: 'DollarSign',
        severity: 'success' as const,
        change: 20,
        trend: 'up' as const,
      },
      {
        id: 'remaining',
        label: t('financialWorkbench.close.metricRemaining'),
        value: pendingCount + inProgressCount,
        icon: 'AlertTriangle',
        severity: pendingCount > 0 ? ('warning' as const) : ('success' as const),
        change: -15,
        trend: 'down' as const,
      },
      {
        id: 'days-left',
        label: t('financialWorkbench.close.metricDaysLeft'),
        value: daysUntilClose,
        icon: 'AlertTriangle',
        severity:
          daysUntilClose < 5 ? ('critical' as const) : daysUntilClose < 10 ? ('warning' as const) : ('info' as const),
      },
    ],
    [stages.length, completeCount, pendingCount, inProgressCount, daysUntilClose, t],
  )

  const inspectorTabs: InspectorTab[] = useMemo(
    () => [
      { id: 'history', label: t('financialWorkbench.close.inspectorHistory'), icon: 'info' },
      { id: 'comparison', label: t('financialWorkbench.close.inspectorComparison'), icon: 'activity' },
    ],
    [t],
  )

  const formatCurrency = (n: number) =>
    n.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const statusBadge = (status: CloseStage['status']) => {
    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    )
  }

  const renderCloseProgress = () => (
    <div className="p-6 border-b bg-muted/10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold">
            {t('financialWorkbench.close.periodClose', { period: closedPeriod })}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('financialWorkbench.close.deadline', {
              date: new Date(nextCloseDate).toLocaleDateString('ar-SA'),
              days: daysUntilClose,
            })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select
            value={closedPeriod}
            onChange={() => {}}
            options={[
              { value: t('financialWorkbench.close.periodApril'), label: t('financialWorkbench.close.periodApril') },
              { value: t('financialWorkbench.close.periodMarch'), label: t('financialWorkbench.close.periodMarch') },
              { value: t('financialWorkbench.close.periodFeb'), label: t('financialWorkbench.close.periodFeb') },
            ]}
            className="w-36"
          />
          <Button size="sm" variant="outline" className="gap-1.5 text-xs h-8">
            <RotateCcw className="h-3.5 w-3.5" />
            {t('financialWorkbench.close.startCloseCycle')}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-3">
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">{t('financialWorkbench.close.overallProgress')}</span>
            <span className="font-semibold">{overallProgress}%</span>
          </div>
          <div className="h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                overallProgress === 100 ? 'bg-green-500' : overallProgress > 50 ? 'bg-blue-500' : 'bg-amber-500',
              )}
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
            {t('financialWorkbench.close.completedCount', { count: completeCount })}
          </span>
          <span className="flex items-center gap-1">
            <PlayCircle className="h-3.5 w-3.5 text-blue-600" />
            {t('financialWorkbench.close.inProgressCount', { count: inProgressCount })}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            {t('financialWorkbench.close.pendingCount', { count: pendingCount })}
          </span>
          {failedCount > 0 && (
            <span className="flex items-center gap-1">
              <XCircle className="h-3.5 w-3.5 text-red-600" />
              {t('financialWorkbench.close.failedCount', { count: failedCount })}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {stages.map((stage, idx) => {
          const config = statusConfig[stage.status] || statusConfig.pending
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => {
                setSelectedId(stage.id)
                setFilterTab('all')
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium whitespace-nowrap transition-colors',
                selectedId === stage.id ? 'border-primary bg-primary/5' : 'bg-card hover:bg-accent',
                stage.status === 'completed' ? 'border-green-200' : '',
                stage.status === 'failed' ? 'border-red-200' : '',
              )}
            >
              <div
                className={cn(
                  'h-2 w-2 rounded-full',
                  stage.status === 'completed'
                    ? 'bg-green-500'
                    : stage.status === 'in_progress'
                      ? 'bg-blue-500'
                      : stage.status === 'failed'
                        ? 'bg-red-500'
                        : 'bg-gray-300',
                )}
              />
              <span className="truncate max-w-[100px]">{stage.name}</span>
              <span className="text-muted-foreground">({stage.progress}%)</span>
            </button>
          )
        })}
      </div>
    </div>
  )

  const renderStageList = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b space-y-3">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('financialWorkbench.close.searchPlaceholder')}
            className="flex h-9 w-full rounded-lg border border-input bg-background pr-10 pl-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors',
                filterTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Flag className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">{t('financialWorkbench.close.noMatchingStages')}</p>
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((stage) => {
              const isSelected = stage.id === selectedId
              const config = statusConfig[stage.status] || statusConfig.pending
              const StatusIcon = config.icon
              const openIssues = stage.issues.filter((i) => i.status === 'open').length
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setSelectedId(stage.id)}
                  className={cn(
                    'w-full text-right p-4 transition-colors hover:bg-accent/50',
                    isSelected && 'bg-accent border-r-2 border-r-primary',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'h-9 w-9 rounded-lg flex items-center justify-center shrink-0',
                        stage.status === 'completed'
                          ? 'bg-green-50 text-green-600'
                          : stage.status === 'failed'
                            ? 'bg-red-50 text-red-600'
                            : stage.status === 'in_progress'
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-gray-50 text-gray-400',
                      )}
                    >
                      {stage.status === 'completed' ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : stage.status === 'failed' ? (
                        <XCircle className="h-4 w-4" />
                      ) : stage.status === 'in_progress' ? (
                        <PlayCircle className="h-4 w-4" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-semibold truncate">{stage.name}</span>
                        <Badge variant={config.variant} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                        {openIssues > 0 && (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {t('financialWorkbench.close.issuesLabel', { count: openIssues })}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{stage.description}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {stage.assignee}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(stage.dueDate).toLocaleDateString('ar-SA')}
                        </span>
                        <span className="text-muted-foreground">
                          {t('financialWorkbench.close.tasksLabel', {
                            completed: stage.subTasks.filter((s) => s.status === 'completed').length,
                            total: stage.subTasks.length,
                          })}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            stage.status === 'completed'
                              ? 'bg-green-500'
                              : stage.status === 'failed'
                                ? 'bg-red-500'
                                : 'bg-blue-500',
                          )}
                          style={{ width: `${stage.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )

  const renderStageDetail = () => {
    if (!selected) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center p-12">
          <Flag className="h-16 w-16 text-muted-foreground/20 mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('financialWorkbench.close.selectStage')}</h3>
          <p className="text-sm text-muted-foreground max-w-md">{t('financialWorkbench.close.selectStageDesc')}</p>
        </div>
      )
    }

    const config = statusConfig[selected.status] || statusConfig.pending
    const StatusIcon = config.icon
    const openIssues = selected.issues.filter((i) => i.status === 'open')
    const completedTasks = selected.subTasks.filter((t) => t.status === 'completed').length

    return (
      <div className="flex flex-col h-full">
        <div className="p-6 border-b space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  'h-14 w-14 rounded-xl flex items-center justify-center',
                  selected.status === 'completed'
                    ? 'bg-green-50'
                    : selected.status === 'failed'
                      ? 'bg-red-50'
                      : selected.status === 'in_progress'
                        ? 'bg-blue-50'
                        : 'bg-gray-50',
                )}
              >
                {selected.status === 'completed' ? (
                  <CheckCircle2 className={cn('h-7 w-7', 'text-green-600')} />
                ) : selected.status === 'failed' ? (
                  <XCircle className={cn('h-7 w-7', 'text-red-600')} />
                ) : selected.status === 'in_progress' ? (
                  <PlayCircle className={cn('h-7 w-7', 'text-blue-600')} />
                ) : (
                  <Clock className={cn('h-7 w-7', 'text-gray-400')} />
                )}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h2 className="text-lg font-bold">{selected.name}</h2>
                  <Badge variant={config.variant} className="gap-1">
                    <StatusIcon className="h-3 w-3" />
                    {config.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="h-3.5 w-3.5" />
                    {t('financialWorkbench.close.assignedBy')} {selected.assignee}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {t('financialWorkbench.close.dueDateText')} {new Date(selected.dueDate).toLocaleDateString('ar-SA')}
                  </span>
                  <span className="flex items-center gap-1">
                    <ListChecks className="h-3.5 w-3.5" />
                    {t('financialWorkbench.close.tasksLabel', {
                      completed: completedTasks,
                      total: selected.subTasks.length,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {selected.status === 'pending' && (
              <Button size="sm" className="gap-1.5">
                <PlayCircle className="h-4 w-4" />
                {t('financialWorkbench.close.startStage')}
              </Button>
            )}
            {selected.status === 'in_progress' && (
              <>
                <Button size="sm" className="gap-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  {t('financialWorkbench.close.completeStage')}
                </Button>
                <Button size="sm" variant="secondary" className="gap-1.5">
                  <PauseCircle className="h-4 w-4" />
                  {t('financialWorkbench.close.pauseStage')}
                </Button>
              </>
            )}
            {selected.status === 'failed' && (
              <Button size="sm" variant="secondary" className="gap-1.5">
                <RotateCcw className="h-4 w-4" />
                {t('financialWorkbench.close.retryStage')}
              </Button>
            )}
            <div className="w-px h-6 bg-border mx-1" />
            <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => setAuditOpen(true)}>
              <Shield className="h-4 w-4" />
              {t('financialWorkbench.close.auditLog')}
            </Button>
            <Button size="sm" variant="ghost" className="gap-1.5" onClick={() => setAiOpen(!aiOpen)}>
              <Sparkles className="h-4 w-4" />
              {t('financialWorkbench.close.ai')}
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} dir="rtl">
            <TabsList className="mb-4">
              <TabsTrigger value="tasks">{t('financialWorkbench.close.tabSubtasks')}</TabsTrigger>
              <TabsTrigger value="issues">{t('financialWorkbench.close.tabIssues')}</TabsTrigger>
              <TabsTrigger value="reconciliation">{t('financialWorkbench.close.tabReconciliation')}</TabsTrigger>
              <TabsTrigger value="comments">{t('financialWorkbench.close.tabComments')}</TabsTrigger>
            </TabsList>

            <TabsContent value="tasks" className="mt-0 space-y-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-semibold">{t('financialWorkbench.close.subtaskList')}</h4>
                    <span className="text-xs text-muted-foreground">
                      {t('financialWorkbench.close.completedFraction', {
                        completed: completedTasks,
                        total: selected.subTasks.length,
                      })}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {selected.subTasks.map((task) => (
                      <div
                        key={task.id}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                          task.status === 'completed'
                            ? 'bg-green-50 border-green-200'
                            : task.status === 'failed'
                              ? 'bg-red-50 border-red-200'
                              : 'bg-card',
                        )}
                      >
                        <div
                          className={cn(
                            'h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0',
                            task.status === 'completed'
                              ? 'border-green-500 bg-green-500 text-white'
                              : task.status === 'failed'
                                ? 'border-red-500 bg-red-500 text-white'
                                : 'border-gray-300',
                          )}
                        >
                          {task.status === 'completed' ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : task.status === 'failed' ? (
                            <XCircle className="h-3.5 w-3.5" />
                          ) : (
                            <div className="h-2 w-2 rounded-full bg-gray-300" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p
                            className={cn(
                              'text-sm',
                              task.status === 'completed' ? 'line-through text-muted-foreground' : 'font-medium',
                            )}
                          >
                            {task.name}
                          </p>
                          {task.completedBy && (
                            <p className="text-xs text-muted-foreground">
                              {t('financialWorkbench.close.byLabel')} {task.completedBy} -{' '}
                              {task.completedAt ? new Date(task.completedAt).toLocaleDateString('ar-SA') : ''}
                            </p>
                          )}
                        </div>
                        {task.status === 'pending' && (
                          <Button variant="ghost" size="sm" className="h-7 text-xs">
                            <CheckCircle2 className="h-3.5 w-3.5 ml-1" />
                            {t('financialWorkbench.close.complete')}
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <h4 className="text-sm font-semibold mb-3">{t('financialWorkbench.close.stageIndicators')}</h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{t('financialWorkbench.close.taskProgress')}</span>
                        <span>{Math.round((completedTasks / selected.subTasks.length) * 100)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            completedTasks === selected.subTasks.length ? 'bg-green-500' : 'bg-blue-500',
                          )}
                          style={{ width: `${(completedTasks / selected.subTasks.length) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{selected.subTasks.length}</div>
                        <div className="text-xs text-muted-foreground">{t('financialWorkbench.close.totalTasks')}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
                        <div className="text-xs text-muted-foreground">
                          {t('financialWorkbench.close.completedLabel')}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="issues" className="mt-0 space-y-3">
              {openIssues.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500/50 mb-3" />
                  <p className="text-sm text-muted-foreground">{t('financialWorkbench.close.noOpenIssues')}</p>
                </div>
              ) : (
                selected.issues.map((issue) => {
                  const severityColors: Record<string, string> = {
                    low: 'border-gray-200 bg-gray-50',
                    medium: 'border-amber-200 bg-amber-50',
                    high: 'border-orange-200 bg-orange-50',
                    critical: 'border-red-200 bg-red-50',
                  }
                  return (
                    <Card key={issue.id} className={cn('border', severityColors[issue.severity])}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle
                            className={cn(
                              'h-5 w-5 mt-0.5 shrink-0',
                              issue.severity === 'critical'
                                ? 'text-red-600'
                                : issue.severity === 'high'
                                  ? 'text-orange-600'
                                  : 'text-amber-600',
                            )}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold">{issue.description}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span>
                                {t('financialWorkbench.close.byLabel')} {issue.raisedBy}
                              </span>
                              <span>
                                {t('financialWorkbench.close.dateLabel')}{' '}
                                {new Date(issue.raisedAt).toLocaleDateString('ar-SA')}
                              </span>
                              <Badge
                                variant={
                                  issue.severity === 'critical'
                                    ? 'destructive'
                                    : issue.severity === 'high'
                                      ? 'warning'
                                      : 'secondary'
                                }
                              >
                                {issue.severity === 'critical'
                                  ? t('financialWorkbench.close.severityCritical')
                                  : issue.severity === 'high'
                                    ? t('financialWorkbench.close.severityHigh')
                                    : issue.severity === 'medium'
                                      ? t('financialWorkbench.close.severityMedium')
                                      : t('financialWorkbench.close.severityLow')}
                              </Badge>
                              <Badge variant={issue.status === 'open' ? 'outline' : 'success'}>
                                {issue.status === 'open'
                                  ? t('financialWorkbench.close.issueOpen')
                                  : t('financialWorkbench.close.issueResolved')}
                              </Badge>
                            </div>
                          </div>
                          {issue.status === 'open' && (
                            <Button variant="ghost" size="sm" className="h-8 text-xs gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              {t('financialWorkbench.close.resolve')}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Plus className="h-3.5 w-3.5" />
                {t('financialWorkbench.close.newIssue')}
              </Button>
            </TabsContent>

            <TabsContent value="reconciliation" className="mt-0 space-y-4">
              <Card>
                <CardContent className="p-4">
                  <h4 className="text-sm font-semibold mb-4">{t('financialWorkbench.close.accountsForStage')}</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('financialWorkbench.close.colAccount')}</TableHead>
                        <TableHead>{t('financialWorkbench.close.colBalance')}</TableHead>
                        <TableHead>{t('financialWorkbench.close.colLastRecon')}</TableHead>
                        <TableHead>{t('financialWorkbench.close.colStatus')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {[
                        {
                          name: t('financialWorkbench.close.reconNationalBank'),
                          balance: 450000,
                          lastRecon: '2026-03-25',
                          status: t('financialWorkbench.close.statusRegular'),
                        },
                        {
                          name: t('financialWorkbench.close.reconRajhi'),
                          balance: 285000,
                          lastRecon: '2026-03-20',
                          status: t('financialWorkbench.close.statusRegular'),
                        },
                        {
                          name: t('financialWorkbench.close.reconCash'),
                          balance: 15000,
                          lastRecon: '2026-03-28',
                          status: t('financialWorkbench.close.statusPendingRecon'),
                        },
                      ].map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{row.name}</TableCell>
                          <TableCell dir="ltr">
                            {formatCurrency(row.balance)} {t('financialWorkbench.close.sar')}
                          </TableCell>
                          <TableCell>{row.lastRecon}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                row.status === t('financialWorkbench.close.statusRegular') ? 'success' : 'warning'
                              }
                            >
                              {row.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comments" className="mt-0">
              <div className="flex flex-col h-[450px] border rounded-xl">
                <OperationalCommenting comments={generateMockOperationalComments()} />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {allValidationMessages.length > 0 && (
          <div className="shrink-0">
            <RealtimeValidationBar messages={allValidationMessages} />
          </div>
        )}
      </div>
    )
  }

  const renderInspectorContent = () => {
    if (!selected) {
      return null
    }
    switch (inspectorTab) {
      case 'history':
        return (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="text-sm font-semibold mb-3">{t('financialWorkbench.close.taskHistory')}</h4>
                <div className="space-y-3">
                  {auditTrail.slice(0, 6).map((entry) => (
                    <div key={entry.id} className="flex items-start gap-2">
                      <div
                        className={cn(
                          'h-2 w-2 rounded-full mt-1.5 shrink-0',
                          entry.type === 'approve'
                            ? 'bg-green-500'
                            : entry.type === 'reject'
                              ? 'bg-red-500'
                              : 'bg-blue-500',
                        )}
                      />
                      <div>
                        <p className="text-xs font-medium">{entry.action}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {entry.actor} - {new Date(entry.timestamp).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )
      case 'comparison':
        return (
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <h4 className="text-sm font-semibold mb-3">{t('financialWorkbench.close.comparisonTitle')}</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">{t('financialWorkbench.close.prevDuration')}</span>
                    <span>{t('financialWorkbench.close.prevDurationValue')}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">{t('financialWorkbench.close.currDuration')}</span>
                    <span className="text-blue-600 font-medium">{t('financialWorkbench.close.currDurationValue')}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">{t('financialWorkbench.close.prevIssues')}</span>
                    <span>{t('financialWorkbench.close.prevIssuesValue')}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">{t('financialWorkbench.close.currIssues')}</span>
                    <span className="text-green-600 font-medium">{t('financialWorkbench.close.currIssuesValue')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            <CrossEntityInspector entityType="workflow" entityId={selected.id} />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <>
      <WorkbenchShell
        title={t('financialWorkbench.close.title')}
        breadcrumbs={[
          { label: t('financialWorkbench.close.breadcrumbFinance') },
          { label: t('financialWorkbench.close.breadcrumbClose') },
        ]}
        metrics={metrics}
        actions={[
          {
            id: 'start-close',
            label: t('financialWorkbench.close.startCloseCycle'),
            type: 'primary',
            icon: 'PlayCircle',
          },
          { id: 'close-report', label: t('financialWorkbench.close.closeReport'), type: 'secondary', icon: 'Download' },
          {
            id: 'validate-all',
            label: t('financialWorkbench.close.validateAll'),
            type: 'secondary',
            icon: 'CheckCheck',
          },
        ]}
        inspectorTabs={inspectorTabs}
        inspectorContent={renderInspectorContent()}
        inspectorOpen={inspectorOpen}
        onInspectorToggle={setInspectorOpen}
        inspectorTab={inspectorTab}
        onInspectorTabChange={setInspectorTab}
        sidebar={renderStageList()}
        sidebarWidth={420}
        validationBar={<RealtimeValidationBar messages={allValidationMessages} />}
        aiPanel={
          <AIAssistancePanel
            open={aiOpen}
            onClose={() => setAiOpen(false)}
            domain="close"
            entityId={selectedId ?? undefined}
            insights={aiInsights}
          />
        }
      >
        <div className="flex flex-col h-full">
          {renderCloseProgress()}
          {renderStageDetail()}
        </div>
      </WorkbenchShell>

      <AuditOverlay
        entries={auditTrail}
        open={auditOpen}
        onClose={() => setAuditOpen(false)}
        entityId={selectedId ?? undefined}
        entityType="Financial Close"
      />
    </>
  )
}
