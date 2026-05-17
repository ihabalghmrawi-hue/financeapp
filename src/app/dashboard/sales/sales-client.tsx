'use client'

import { useState, useMemo } from 'react'
import { Search, ShoppingBag } from 'lucide-react'
import { formatCurrency, formatDate, cn } from '@/lib/utils'
import type { Sale } from '@/types/erp'
import Link from 'next/link'
import { ResponsiveTable, type ResponsiveColumn } from '@/components/mobile'
import { MobilePageHeader } from '@/components/mobile/MobilePageHeader'

interface SalesClientProps {
  sales: Sale[]
  currency: string
  companyId: string
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  completed: { label: 'مكتملة', color: 'bg-green-100 text-green-700 dark:bg-green-900/30' },
  draft: { label: 'مسودة', color: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30' },
  cancelled: { label: 'ملغاة', color: 'bg-red-100 text-red-700 dark:bg-red-900/30' },
  returned: { label: 'مرتجعة', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30' },
}

const PAYMENT_STATUS: Record<string, { label: string; color: string }> = {
  paid: { label: 'مدفوعة', color: 'bg-green-100 text-green-700 dark:bg-green-900/30' },
  partial: { label: 'جزئي', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30' },
  unpaid: { label: 'غير مدفوعة', color: 'bg-red-100 text-red-700 dark:bg-red-900/30' },
  refunded: { label: 'مسترجعة', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30' },
}

export function SalesClient({ sales, currency }: SalesClientProps) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPayment, setFilterPayment] = useState('')

  const filtered = useMemo(
    () =>
      sales.filter((s) => {
        const matchSearch =
          !search ||
          s.invoice_number.includes(search) ||
          (s.customers as any)?.name?.toLowerCase().includes(search.toLowerCase())
        const matchStatus = !filterStatus || s.status === filterStatus
        const matchPayment = !filterPayment || s.payment_status === filterPayment
        return matchSearch && matchStatus && matchPayment
      }),
    [sales, search, filterStatus, filterPayment],
  )

  const today = new Date().toDateString()
  const todaySales = sales.filter((s) => new Date(s.sale_date).toDateString() === today && s.status === 'completed')
  const totalToday = todaySales.reduce((s, sale) => s + sale.total, 0)
  const totalMonth = sales
    .filter((s) => {
      const d = new Date(s.sale_date)
      const now = new Date()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && s.status === 'completed'
    })
    .reduce((s, sale) => s + sale.total, 0)
  const unpaidTotal = sales
    .filter((s) => s.payment_status === 'unpaid' || s.payment_status === 'partial')
    .reduce((s, sale) => s + sale.due_amount, 0)

  const columns: ResponsiveColumn<Sale>[] = [
    {
      key: 'invoice_number',
      header: 'رقم الفاتورة',
      mobile: 'primary',
      render: (s) => <span className="font-mono font-medium text-primary">{s.invoice_number}</span>,
    },
    {
      key: 'customer',
      header: 'العميل',
      mobile: 'meta',
      render: (s) => (s.customers as any)?.name || <span className="text-muted-foreground">نقدي</span>,
    },
    {
      key: 'date',
      header: 'التاريخ',
      mobile: 'meta',
      render: (s) => <span className="text-muted-foreground text-xs">{formatDate(s.sale_date)}</span>,
    },
    {
      key: 'total',
      header: 'الإجمالي',
      mobile: 'secondary',
      render: (s) => <span className="font-bold">{formatCurrency(s.total, currency)}</span>,
    },
    {
      key: 'status',
      header: 'الحالة',
      mobileLabel: 'الحالة',
      render: (s) => (
        <span className={cn('text-xs px-2 py-0.5 rounded-full', STATUS_LABELS[s.status]?.color)}>
          {STATUS_LABELS[s.status]?.label}
        </span>
      ),
    },
    {
      key: 'payment',
      header: 'الدفع',
      mobileLabel: 'الدفع',
      render: (s) => (
        <div className="space-y-0.5">
          <span className={cn('text-xs px-2 py-0.5 rounded-full', PAYMENT_STATUS[s.payment_status]?.color)}>
            {PAYMENT_STATUS[s.payment_status]?.label}
          </span>
          {s.due_amount > 0 && <p className="text-xs text-red-500">{formatCurrency(s.due_amount, currency)}</p>}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <MobilePageHeader
        title="فواتير المبيعات"
        description={`${sales.length} فاتورة`}
        actions={
          <Link
            href="/dashboard/pos"
            className="flex items-center gap-2 bg-primary text-primary-foreground px-3 sm:px-4 h-10 rounded-lg text-sm font-medium hover:bg-primary/90"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">فاتورة جديدة (POS)</span>
            <span className="sm:hidden">POS</span>
          </Link>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
          <p className="text-[10px] sm:text-xs text-green-600 opacity-70">مبيعات اليوم</p>
          <p className="text-sm sm:text-lg font-bold text-green-700 mt-0.5 truncate">
            {formatCurrency(totalToday, currency)}
          </p>
          <p className="text-[10px] sm:text-xs text-green-600">{todaySales.length} فاتورة</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
          <p className="text-[10px] sm:text-xs text-blue-600 opacity-70">مبيعات الشهر</p>
          <p className="text-sm sm:text-lg font-bold text-blue-700 mt-0.5 truncate">
            {formatCurrency(totalMonth, currency)}
          </p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3">
          <p className="text-[10px] sm:text-xs text-red-600 opacity-70">مبالغ مستحقة</p>
          <p className="text-sm sm:text-lg font-bold text-red-700 mt-0.5 truncate">
            {formatCurrency(unpaidTotal, currency)}
          </p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3">
          <p className="text-[10px] sm:text-xs text-purple-600 opacity-70">إجمالي الفواتير</p>
          <p className="text-sm sm:text-lg font-bold text-purple-700 mt-0.5">{sales.length}</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث برقم الفاتورة أو العميل..."
            className="w-full border border-input rounded-lg pr-9 pl-3 h-11 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-input rounded-lg px-3 h-11 text-sm bg-background focus:outline-none flex-1 sm:flex-initial min-w-[120px]"
        >
          <option value="">كل الحالات</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
        <select
          value={filterPayment}
          onChange={(e) => setFilterPayment(e.target.value)}
          className="border border-input rounded-lg px-3 h-11 text-sm bg-background focus:outline-none flex-1 sm:flex-initial min-w-[120px]"
        >
          <option value="">كل المدفوعات</option>
          {Object.entries(PAYMENT_STATUS).map(([k, v]) => (
            <option key={k} value={k}>
              {v.label}
            </option>
          ))}
        </select>
      </div>

      <ResponsiveTable data={filtered} columns={columns} rowKey={(s) => s.id} empty="لا توجد فواتير" />
    </div>
  )
}
