'use client'
import { useState, useMemo, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n/language-provider'
import {
  ShoppingCart,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Search,
  Filter,
  ArrowUpDown,
  RefreshCw,
  Download,
  Printer,
  Plus,
  Eye,
  Edit3,
  X,
  Ban,
  Send,
  Sparkles,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ArrowRight,
  PanelRightOpen,
  PanelRightClose,
  Loader2,
  MoreHorizontal,
  CheckSquare,
  Shield,
  MessageSquare,
  Paperclip,
  History,
  Truck,
  Building2,
  Package,
  Box,
  MapPin,
  CreditCard,
  Receipt,
  Percent,
  Phone,
  Mail,
  Globe,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EnterpriseBreadcrumbs } from '@/components/enterprise/Navigation/Breadcrumbs'
import { WorkbenchShell } from '@/components/workbench/WorkbenchShell'
import { InspectorPanel } from '@/components/workbench/InspectorPanel'
import { RealtimeValidationBar } from '@/components/workbench/RealtimeValidationBar'
import { AIAssistancePanel } from '@/components/workbench/AIAssistancePanel'
import { CrossEntityInspector } from '@/components/workbench/CrossEntityInspector'
import { AuditOverlay } from '@/components/workbench/AuditOverlay'
import { OperationalCommenting } from '@/components/workbench/OperationalCommenting'
import { WorkbenchMetricCard } from '@/components/workbench/WorkbenchMetricCard'
import {
  generateMockSalesOrders,
  generateMockCustomers,
  generateMockInvoices,
  generateMockInventoryItems,
  generateMockValidationMessages,
  generateMockAIInsights,
  generateMockAuditTrail,
  generateMockDocuments,
  generateMockOperationalComments,
} from '@/lib/workbench/mock-data'
import type {
  Invoice,
  InvoiceLine,
  ValidationMessage,
  AIInsight,
  AuditTrailEntry,
  OperationalComment,
  InspectorTab,
  WorkbenchMetric,
  WorkbenchAction,
} from '@/lib/workbench/types'

function useStatusLabels(t: (k: string) => string) {
  return {
    draft: { label: t('invoicingWorkbench.statusDraft'), color: 'text-gray-600 bg-gray-100 border-gray-300' },
    pending: { label: t('invoicingWorkbench.statusPending'), color: 'text-amber-600 bg-amber-50 border-amber-200' },
    approved: { label: t('invoicingWorkbench.statusApproved'), color: 'text-blue-600 bg-blue-50 border-blue-200' },
    paid: { label: t('invoicingWorkbench.statusPaid'), color: 'text-green-600 bg-green-50 border-green-200' },
    overdue: { label: t('invoicingWorkbench.statusOverdue'), color: 'text-red-600 bg-red-50 border-red-200' },
    cancelled: { label: t('invoicingWorkbench.statusCancelled'), color: 'text-rose-600 bg-rose-50 border-rose-200' },
  } as Record<string, { label: string; color: string }>
}

function usePipelineStages(t: (k: string) => string) {
  return [
    { key: 'draft', label: t('invoicingWorkbench.statusDraft') },
    { key: 'pending', label: t('invoicingWorkbench.statusPending') },
    { key: 'approved', label: t('invoicingWorkbench.statusApproved') },
    { key: 'paid', label: t('invoicingWorkbench.statusPaid') },
  ]
}

const statusOrder: Record<string, number> = { draft: 0, pending: 1, approved: 2, paid: 3, overdue: 1.5, cancelled: -1 }

function formatCurrency(amount: number): string {
  return amount.toLocaleString('ar-SA', { minimumFractionDigits: 2 })
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('ar-SA')
}

function getPipelineProgress(status: string): number {
  if (status === 'cancelled') {
    return 0
  }
  const idx = statusOrder[status]
  if (idx === undefined) {
    return 0
  }
  return Math.round((idx / 3) * 100)
}

export function InvoicingWorkbench() {
  const { t } = useT()
  const [invoices] = useState<Invoice[]>(() => generateMockInvoices(25, 'receivable'))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [inspectorOpen, setInspectorOpen] = useState(true)
  const [inspectorPinned, setInspectorPinned] = useState(false)
  const [activeInspectorTab, setActiveInspectorTab] = useState('info')
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [auditOpen, setAuditOpen] = useState(false)
  const [batchMode, setBatchMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [validations] = useState<ValidationMessage[]>(() => generateMockValidationMessages('sales'))
  const [aiInsights] = useState<AIInsight[]>(() => generateMockAIInsights('sales'))
  const [auditEntries] = useState<AuditTrailEntry[]>(() => generateMockAuditTrail())
  const [comments] = useState<OperationalComment[]>(() => generateMockOperationalComments())

  const statusLabels = useStatusLabels(t)
  const pipelineStages = usePipelineStages(t)

  const metrics: WorkbenchMetric[] = useMemo(() => {
    const drafts = invoices.filter((i) => i.status === 'draft').length
    const pendingSend = invoices.filter((i) => i.status === 'pending').length
    const overdue = invoices.filter((i) => i.status === 'overdue').length
    const paidThisMonth = invoices.filter(
      (i) => i.status === 'paid' && new Date(i.date).getMonth() === new Date().getMonth(),
    ).length
    return [
      {
        id: 'drafts',
        label: t('invoicingWorkbench.metricDrafts'),
        value: drafts,
        change: -3,
        trend: 'down',
        icon: 'FileText',
        severity: 'info',
      },
      {
        id: 'pending',
        label: t('invoicingWorkbench.metricPendingSend'),
        value: pendingSend,
        change: 8,
        trend: 'up',
        icon: 'Send',
        severity: 'warning',
      },
      {
        id: 'overdue',
        label: t('invoicingWorkbench.metricOverdue'),
        value: overdue,
        change: 12,
        trend: 'up',
        icon: 'AlertTriangle',
        severity: 'critical',
      },
      {
        id: 'collected',
        label: t('invoicingWorkbench.metricCollected'),
        value: paidThisMonth,
        change: 22,
        trend: 'up',
        icon: 'DollarSign',
        severity: 'success',
      },
    ]
  }, [invoices, t])

  const filteredInvoices = useMemo(() => {
    let result = [...invoices]
    if (statusFilter !== 'all') {
      result = result.filter((i) => i.status === statusFilter)
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter((i) => i.number.toLowerCase().includes(q) || i.vendorOrCustomer.toLowerCase().includes(q))
    }
    return result.sort((a, b) => b.date - a.date)
  }, [invoices, statusFilter, searchQuery])

  const selectedInvoice = useMemo(() => invoices.find((i) => i.id === selectedId) ?? null, [invoices, selectedId])

  const inspectorTabs: InspectorTab[] = useMemo(
    () => [
      {
        id: 'info',
        label: t('invoicingWorkbench.inspectorInvoiceDetails'),
        icon: 'info',
        badge: selectedInvoice?.lines.length,
      },
      { id: 'activity', label: t('invoicingWorkbench.inspectorActivity'), icon: 'activity' },
      { id: 'message', label: t('invoicingWorkbench.inspectorComments'), icon: 'message', badge: comments.length },
    ],
    [selectedInvoice, comments, t],
  )

  const actions: WorkbenchAction[] = useMemo(
    () => [
      {
        id: 'new-invoice',
        label: t('invoicingWorkbench.actionNewInvoice'),
        type: 'primary',
        icon: 'Plus',
        handler: () => {},
      },
      {
        id: 'batch',
        label: batchMode ? t('invoicingWorkbench.actionBatchEnd') : t('invoicingWorkbench.actionBatchStart'),
        type: 'secondary',
        icon: 'CheckSquare',
        handler: () => {
          setBatchMode(!batchMode)
          setSelectedIds(new Set())
        },
      },
      {
        id: 'refresh',
        label: t('invoicingWorkbench.actionRefresh'),
        type: 'secondary',
        icon: 'RefreshCw',
        handler: () => {},
      },
      { id: 'export', label: t('invoicingWorkbench.actionExport'), type: 'ghost', icon: 'Download', handler: () => {} },
    ],
    [batchMode, t],
  )

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const statusFilters = [
    { key: 'all', label: t('invoicingWorkbench.filterAll') },
    { key: 'draft', label: t('invoicingWorkbench.statusDraft') },
    { key: 'pending', label: t('invoicingWorkbench.statusPending') },
    { key: 'approved', label: t('invoicingWorkbench.statusApproved') },
    { key: 'overdue', label: t('invoicingWorkbench.statusOverdue') },
    { key: 'paid', label: t('invoicingWorkbench.statusPaid') },
    { key: 'cancelled', label: t('invoicingWorkbench.statusCancelled') },
  ]

  return (
    <WorkbenchShell
      title={t('invoicingWorkbench.title')}
      description={t('invoicingWorkbench.description')}
      breadcrumbs={[
        { label: t('invoicingWorkbench.breadcrumbSales'), icon: ShoppingCart },
        { label: t('invoicingWorkbench.breadcrumbInvoicing') },
      ]}
      metrics={metrics}
      actions={actions}
      inspectorTabs={inspectorTabs}
      inspectorOpen={inspectorOpen}
      onInspectorToggle={setInspectorOpen}
      inspectorTab={activeInspectorTab}
      onInspectorTabChange={setActiveInspectorTab}
      inspectorContent={
        selectedInvoice ? (
          <>
            {activeInspectorTab === 'info' && (
              <div className="space-y-4">
                <div className="rounded-xl border p-4">
                  <h4 className="text-sm font-semibold mb-3">{t('invoicingWorkbench.invoiceLabel')}</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">{t('invoicingWorkbench.fieldNumber')}:</span>{' '}
                      <span className="font-medium">{selectedInvoice.number}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('invoicingWorkbench.fieldCustomer')}:</span>{' '}
                      <span className="font-medium">{selectedInvoice.vendorOrCustomer}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('invoicingWorkbench.fieldDate')}:</span>{' '}
                      <span className="font-medium">{formatDate(selectedInvoice.date)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('invoicingWorkbench.fieldDueDate')}:</span>{' '}
                      <span className="font-medium">{formatDate(selectedInvoice.dueDate)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('invoicingWorkbench.fieldAmount')}:</span>{' '}
                      <span className="font-medium">
                        {formatCurrency(selectedInvoice.amount)} {t('invoicingWorkbench.sar')}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('invoicingWorkbench.fieldPaid')}:</span>{' '}
                      <span className="font-medium">
                        {formatCurrency(selectedInvoice.paidAmount)} {t('invoicingWorkbench.sar')}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('invoicingWorkbench.fieldBalance')}:</span>{' '}
                      <span
                        className={cn('font-medium', selectedInvoice.balance > 0 ? 'text-amber-600' : 'text-green-600')}
                      >
                        {formatCurrency(selectedInvoice.balance)} {t('invoicingWorkbench.sar')}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
                          statusLabels[selectedInvoice.status]?.color,
                        )}
                      >
                        {statusLabels[selectedInvoice.status]?.label}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t('invoicingWorkbench.paymentRatio')}</span>
                      <span className="font-semibold">
                        {selectedInvoice.amount > 0
                          ? Math.round((selectedInvoice.paidAmount / selectedInvoice.amount) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{
                          width: `${selectedInvoice.amount > 0 ? Math.round((selectedInvoice.paidAmount / selectedInvoice.amount) * 100) : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">{t('invoicingWorkbench.daysToDue')}</span>
                      <span className="font-medium">
                        {Math.round((selectedInvoice.dueDate - Date.now()) / 86400000)} {t('invoicingWorkbench.days')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('invoicingWorkbench.fieldCurrency')}</span>
                      <span className="font-medium">{selectedInvoice.currency}</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border p-4">
                  <h4 className="text-sm font-semibold mb-3">
                    {t('invoicingWorkbench.invoiceLines')} ({selectedInvoice.lines.length})
                  </h4>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground text-xs">
                        <th className="text-right py-2 font-medium">{t('invoicingWorkbench.lineDescription')}</th>
                        <th className="text-right py-2 font-medium">{t('invoicingWorkbench.lineQty')}</th>
                        <th className="text-right py-2 font-medium">{t('invoicingWorkbench.lineUnitPrice')}</th>
                        <th className="text-right py-2 font-medium">{t('invoicingWorkbench.lineTax')}</th>
                        <th className="text-left py-2 font-medium">{t('invoicingWorkbench.lineTotal')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.lines.map((line) => (
                        <tr key={line.id} className="border-b last:border-b-0">
                          <td className="py-2">{line.description}</td>
                          <td className="py-2">{line.quantity}</td>
                          <td className="py-2">{formatCurrency(line.unitPrice)}</td>
                          <td className="py-2">{formatCurrency(line.tax)}</td>
                          <td className="py-2 text-left font-medium">{formatCurrency(line.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t">
                        <td colSpan={4} className="py-2 text-left">
                          {t('invoicingWorkbench.subtotalBeforeTax')}
                        </td>
                        <td className="py-2 text-left">
                          {formatCurrency(selectedInvoice.lines.reduce((s, l) => s + l.amount, 0))}
                        </td>
                      </tr>
                      <tr className="text-muted-foreground">
                        <td colSpan={4} className="py-1 text-left">
                          {t('invoicingWorkbench.vat15')}
                        </td>
                        <td className="py-1 text-left">
                          {formatCurrency(selectedInvoice.lines.reduce((s, l) => s + l.tax, 0))}
                        </td>
                      </tr>
                      <tr className="border-t font-bold">
                        <td colSpan={4} className="py-2 text-left">
                          {t('invoicingWorkbench.grandTotal')}
                        </td>
                        <td className="py-2 text-left">
                          {formatCurrency(selectedInvoice.amount)} {t('invoicingWorkbench.sar')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <div className="rounded-xl border p-4">
                  <h4 className="text-sm font-semibold mb-3">{t('invoicingWorkbench.invoicePipeline')}</h4>
                  <div className="relative">
                    <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${getPipelineProgress(selectedInvoice.status)}%` }}
                      />
                    </div>
                    <div className="flex justify-between">
                      {pipelineStages.map((stage, idx) => {
                        const currentIdx = statusOrder[selectedInvoice.status] ?? -1
                        const completed = idx <= currentIdx
                        const isCurrent = idx === currentIdx
                        return (
                          <div key={stage.key} className="flex flex-col items-center gap-1">
                            <div
                              className={cn(
                                'w-3 h-3 rounded-full border-2',
                                completed ? 'bg-primary border-primary' : 'bg-background border-muted-foreground/30',
                                isCurrent && 'ring-2 ring-primary/30',
                              )}
                            />
                            <span
                              className={cn(
                                'text-[10px] whitespace-nowrap',
                                completed ? 'text-primary font-medium' : 'text-muted-foreground',
                              )}
                            >
                              {stage.label}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border p-4">
                  <h4 className="text-sm font-semibold mb-3">{t('invoicingWorkbench.paymentHistory')}</h4>
                  {selectedInvoice.status === 'paid' ? (
                    <div className="flex items-center gap-3 text-sm text-green-600">
                      <CheckCircle2 className="h-5 w-5" />
                      <span>
                        {t('invoicingWorkbench.fullyCollected', { amount: formatCurrency(selectedInvoice.amount) })}
                      </span>
                    </div>
                  ) : selectedInvoice.paidAmount > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t('invoicingWorkbench.partiallyPaid')}</span>
                        <span className="font-medium">
                          {formatCurrency(selectedInvoice.paidAmount)} {t('invoicingWorkbench.sar')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t('invoicingWorkbench.fieldBalance')}</span>
                        <span className="font-medium text-amber-600">
                          {formatCurrency(selectedInvoice.balance)} {t('invoicingWorkbench.sar')}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Clock className="h-5 w-5" />
                      <span>{t('invoicingWorkbench.noPayments')}</span>
                    </div>
                  )}
                </div>
                <div className="rounded-xl border p-4">
                  <h4 className="text-sm font-semibold mb-3">{t('invoicingWorkbench.actions')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedInvoice.status === 'draft' && (
                      <Button size="sm" className="gap-1">
                        <Send className="h-3.5 w-3.5" />
                        {t('invoicingWorkbench.sendInvoice')}
                      </Button>
                    )}
                    {selectedInvoice.status === 'approved' && (
                      <Button size="sm" className="gap-1">
                        <DollarSign className="h-3.5 w-3.5" />
                        {t('invoicingWorkbench.recordPayment')}
                      </Button>
                    )}
                    {selectedInvoice.status === 'overdue' && (
                      <Button size="sm" className="gap-1">
                        <Send className="h-3.5 w-3.5" />
                        {t('invoicingWorkbench.sendReminder')}
                      </Button>
                    )}
                    {selectedInvoice.status !== 'paid' && selectedInvoice.status !== 'cancelled' && (
                      <Button size="sm" variant="secondary" className="gap-1">
                        <CreditCard className="h-3.5 w-3.5" />
                        {t('invoicingWorkbench.creditNote')}
                      </Button>
                    )}
                    <Button size="sm" variant="secondary" className="gap-1">
                      <Printer className="h-3.5 w-3.5" />
                      {t('invoicingWorkbench.printAction')}
                    </Button>
                    <Button size="sm" variant="ghost" className="gap-1">
                      <Download className="h-3.5 w-3.5" />
                      {t('invoicingWorkbench.pdf')}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {activeInspectorTab === 'activity' && (
              <div className="space-y-3">
                <div className="rounded-xl border p-4">
                  <h4 className="text-sm font-semibold mb-3">{t('invoicingWorkbench.recentActivity')}</h4>
                  <div className="space-y-3">
                    {[
                      {
                        action: t('invoicingWorkbench.activityCreateInvoice'),
                        date: selectedInvoice.date,
                        actor: t('invoicingWorkbench.actorSystem'),
                      },
                      {
                        action: t('invoicingWorkbench.activitySendInvoice'),
                        date: selectedInvoice.date + 86400000,
                        actor: 'أحمد محمد',
                      },
                      ...(selectedInvoice.status === 'paid'
                        ? [
                            {
                              action: t('invoicingWorkbench.activityRecordPayment'),
                              date: selectedInvoice.dueDate - 86400000,
                              actor: 'سارة خالد',
                            },
                          ]
                        : []),
                      ...(selectedInvoice.status === 'overdue'
                        ? [
                            {
                              action: t('invoicingWorkbench.activitySendReminder'),
                              date: selectedInvoice.dueDate + 86400000 * 3,
                              actor: t('invoicingWorkbench.actorSystem'),
                            },
                          ]
                        : []),
                    ].map((act, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary/50" />
                        <div className="flex-1">
                          <p className="text-sm">{act.action}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{act.actor}</span>
                            <span>{formatDate(act.date)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border p-4">
                  <h4 className="text-sm font-semibold mb-3">{t('invoicingWorkbench.remindersLog')}</h4>
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <Send className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground">{t('invoicingWorkbench.noReminders')}</p>
                  </div>
                </div>
              </div>
            )}
            {activeInspectorTab === 'message' && <OperationalCommenting comments={comments} />}
          </>
        ) : null
      }
      validationBar={<RealtimeValidationBar messages={validations} />}
      aiPanel={
        <AIAssistancePanel
          open={aiPanelOpen}
          onClose={() => setAiPanelOpen(false)}
          domain="sales"
          entityId={selectedId ?? undefined}
          insights={aiInsights}
        />
      }
      className="rtl"
    >
      <div className="flex flex-col h-full overflow-hidden">
        <div className="border-b bg-muted/30 px-6 py-2 shrink-0">
          <div className="flex items-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">{t('invoicingWorkbench.totalInvoicesLabel')}:</span>
                <span className="font-semibold">
                  {formatCurrency(invoices.reduce((s, i) => s + i.amount, 0))} {t('invoicingWorkbench.sar')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">{t('invoicingWorkbench.paidLabel')}:</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(invoices.reduce((s, i) => s + i.paidAmount, 0))} {t('invoicingWorkbench.sar')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground">{t('invoicingWorkbench.fieldBalance')}:</span>
                <span className="font-semibold text-amber-600">
                  {formatCurrency(invoices.reduce((s, i) => s + i.balance, 0))} {t('invoicingWorkbench.sar')}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{t('invoicingWorkbench.avgPayment')}:</span>
              <span className="font-semibold">
                {Math.round(
                  invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0) /
                    Math.max(invoices.filter((i) => i.status === 'paid').length, 1),
                )}{' '}
                {t('invoicingWorkbench.sar')}
              </span>
            </div>
          </div>
        </div>
        <div className="border-b bg-card px-6 py-3 shrink-0">
          <div className="flex gap-3 items-center flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('invoicingWorkbench.searchPlaceholder')}
                className="flex h-9 w-full rounded-lg border border-input bg-background pr-10 pl-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="flex gap-1 overflow-x-auto">
              {statusFilters.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setStatusFilter(f.key)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors',
                    statusFilter === f.key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {batchMode && selectedIds.size > 0 && (
              <div className="flex items-center gap-2 mr-auto">
                <span className="text-xs text-muted-foreground">
                  {t('invoicingWorkbench.batchSelected')} {selectedIds.size}
                </span>
                <Button size="sm" variant="secondary" className="h-8 text-xs gap-1">
                  <Send className="h-3 w-3" />
                  {t('invoicingWorkbench.batchSend')}
                </Button>
                <Button size="sm" variant="secondary" className="h-8 text-xs gap-1">
                  <Printer className="h-3 w-3" />
                  {t('invoicingWorkbench.batchPrint')}
                </Button>
                <Button size="sm" variant="ghost" className="h-8 text-xs gap-1">
                  <X className="h-3 w-3" />
                  {t('invoicingWorkbench.batchCancel')}
                </Button>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => setAiPanelOpen(!aiPanelOpen)}
            >
              <Sparkles className={cn('h-4 w-4', aiPanelOpen && 'text-primary')} />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredInvoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <FileText className="h-16 w-16 text-muted-foreground/20 mb-4" />
              <h3 className="text-lg font-semibold mb-1">{t('invoicingWorkbench.noInvoicesTitle')}</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || statusFilter !== 'all'
                  ? t('invoicingWorkbench.noSearchResults')
                  : t('invoicingWorkbench.noInvoicesYet')}
              </p>
              {(searchQuery || statusFilter !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('all')
                  }}
                >
                  {t('invoicingWorkbench.clearFilter')}
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filteredInvoices.map((invoice) => {
                const sl = statusLabels[invoice.status]
                const isSelected = invoice.id === selectedId
                const isChecked = selectedIds.has(invoice.id)
                return (
                  <div
                    key={invoice.id}
                    className={cn(
                      'flex items-center gap-4 px-6 py-4 cursor-pointer transition-colors hover:bg-muted/30',
                      isSelected && 'bg-primary/5 border-r-2 border-primary',
                      invoice.status === 'overdue' && 'bg-red-50/30',
                    )}
                    onClick={() => !batchMode && setSelectedId(invoice.id)}
                  >
                    {batchMode && (
                      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelect(invoice.id)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                      </div>
                    )}
                    <div className="flex items-center gap-3 shrink-0">
                      <div
                        className={cn(
                          'p-2 rounded-lg',
                          invoice.status === 'paid'
                            ? 'bg-green-50'
                            : invoice.status === 'overdue'
                              ? 'bg-red-50'
                              : 'bg-primary/10',
                        )}
                      >
                        <FileText
                          className={cn(
                            'h-5 w-5',
                            invoice.status === 'paid'
                              ? 'text-green-600'
                              : invoice.status === 'overdue'
                                ? 'text-red-600'
                                : 'text-primary',
                          )}
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-sm font-bold">{invoice.number}</span>
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border',
                            sl?.color,
                          )}
                        >
                          {sl?.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {invoice.vendorOrCustomer}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(invoice.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {t('invoicingWorkbench.dueLabel')}: {formatDate(invoice.dueDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3 w-3" />
                          {t('invoicingWorkbench.fieldBalance')}: {formatCurrency(invoice.balance)}
                        </span>
                      </div>
                      {invoice.balance > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden flex-1 max-w-[150px]">
                            <div
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${Math.round((invoice.paidAmount / invoice.amount) * 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground">
                            {t('invoicingWorkbench.paidPrefix')} {formatCurrency(invoice.paidAmount)} /{' '}
                            {formatCurrency(invoice.amount)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-left shrink-0">
                      <p className="text-sm font-bold">{formatCurrency(invoice.amount)}</p>
                      <p className="text-[10px] text-muted-foreground">{t('invoicingWorkbench.sar')}</p>
                      {invoice.balance > 0 && (
                        <p className="text-[10px] text-amber-600 font-medium">
                          {t('invoicingWorkbench.fieldBalance')}: {formatCurrency(invoice.balance)}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="border-t bg-card px-6 py-2 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              {invoices.length} {t('invoicingWorkbench.entityType')}
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {formatCurrency(invoices.reduce((s, i) => s + i.amount, 0))} {t('invoicingWorkbench.sar')}
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {invoices.filter((i) => i.status === 'paid').length} {t('invoicingWorkbench.paidPrefix')}
            </span>
            <span
              className={cn(
                'flex items-center gap-1',
                invoices.filter((i) => i.status === 'overdue').length > 0 && 'text-red-600',
              )}
            >
              <AlertTriangle className="h-3 w-3" />
              {invoices.filter((i) => i.status === 'overdue').length} {t('invoicingWorkbench.overduePrefix')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setAuditOpen(true)}>
              <Shield className="h-3 w-3" />
              {t('invoicingWorkbench.auditLog')}
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1">
              <Printer className="h-3 w-3" />
              {t('invoicingWorkbench.printAll')}
            </Button>
          </div>
        </div>
      </div>

      <AuditOverlay
        entries={auditEntries}
        open={auditOpen}
        onClose={() => setAuditOpen(false)}
        entityId={selectedId ?? undefined}
        entityType={t('invoicingWorkbench.entityType')}
      />
    </WorkbenchShell>
  )
}

function useTaxBrackets(t: (k: string) => string) {
  return [
    {
      rate: 15,
      label: t('invoicingWorkbench.taxBracketVat15'),
      code: 'VAT-15',
      category: t('invoicingWorkbench.taxCategoryStandard'),
    },
    {
      rate: 0,
      label: t('invoicingWorkbench.taxBracketExempt'),
      code: 'VAT-EX',
      category: t('invoicingWorkbench.taxCategoryExempt'),
    },
    {
      rate: 5,
      label: t('invoicingWorkbench.taxBracketVat5'),
      code: 'VAT-5',
      category: t('invoicingWorkbench.taxCategoryReduced'),
    },
  ]
}

function usePaymentMethods(t: (k: string) => string) {
  return [
    {
      code: 'CASH',
      label: t('invoicingWorkbench.paymentMethodCash'),
      processingTime: t('invoicingWorkbench.processingTimeImmediate'),
      fee: '0%',
    },
    {
      code: 'BANK_TRANSFER',
      label: t('invoicingWorkbench.paymentMethodBankTransfer'),
      processingTime: t('invoicingWorkbench.processingTime1to2'),
      fee: '0%',
    },
    {
      code: 'CREDIT_CARD',
      label: t('invoicingWorkbench.paymentMethodCreditCard'),
      processingTime: t('invoicingWorkbench.processingTimeImmediate'),
      fee: '2.5%',
    },
    {
      code: 'CHECK',
      label: t('invoicingWorkbench.paymentMethodCheck'),
      processingTime: t('invoicingWorkbench.processingTime1to3'),
      fee: '0%',
    },
    {
      code: 'MADA',
      label: t('invoicingWorkbench.paymentMethodMada'),
      processingTime: t('invoicingWorkbench.processingTimeImmediate'),
      fee: '0.8%',
    },
  ]
}

function useInvoiceTemplates(t: (k: string) => string) {
  return [
    {
      id: 'standard',
      label: t('invoicingWorkbench.templateStandard'),
      description: t('invoicingWorkbench.templateStandardDesc'),
    },
    {
      id: 'detailed',
      label: t('invoicingWorkbench.templateDetailed'),
      description: t('invoicingWorkbench.templateDetailedDesc'),
    },
    {
      id: 'summary',
      label: t('invoicingWorkbench.templateSummary'),
      description: t('invoicingWorkbench.templateSummaryDesc'),
    },
    { id: 'tax', label: t('invoicingWorkbench.templateTax'), description: t('invoicingWorkbench.templateTaxDesc') },
  ]
}
