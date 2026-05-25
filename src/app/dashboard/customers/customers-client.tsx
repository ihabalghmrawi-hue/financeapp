'use client'

import { useState, useMemo } from 'react'
import { Plus, Search, User, Edit, Trash2, Phone, Mail, Check, Loader2, Eye } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useT } from '@/lib/i18n/language-provider'
import { localizedName } from '@/lib/i18n'
import Link from 'next/link'
import type { Customer } from '@/types/erp'
import { BottomSheet } from '@/components/mobile/BottomSheet'
import { MobilePageHeader } from '@/components/mobile/MobilePageHeader'

interface CustomersClientProps {
  customers: Customer[]
  companyId: string
  currency: string
}

const emptyForm = {
  name: '',
  name_ar: '',
  phone: '',
  email: '',
  address: '',
  tax_number: '',
  credit_limit: '0',
  notes: '',
  is_active: true,
}

export function CustomersClient({ customers: initial, companyId, currency }: CustomersClientProps) {
  const { t, lang } = useT()
  const [customers, setCustomers] = useState(initial)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<any>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const filtered = useMemo(
    () =>
      customers.filter(
        (c) =>
          !search ||
          (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
          (c.phone && c.phone.includes(search)) ||
          (c.email && c.email.toLowerCase().includes(search.toLowerCase())),
      ),
    [customers, search],
  )

  const totalDebt = customers.reduce((s, c) => s + Math.max(0, c.balance), 0)

  const openNew = () => {
    setForm(emptyForm)
    setEditingId(null)
    setShowForm(true)
    setError('')
  }

  const openEdit = (c: Customer) => {
    setForm({
      name: c.name,
      name_ar: c.name_ar || '',
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
      tax_number: c.tax_number || '',
      credit_limit: c.credit_limit,
      notes: c.notes || '',
      is_active: c.is_active,
    })
    setEditingId(c.id)
    setShowForm(true)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const payload = { ...form, company_id: companyId, credit_limit: parseFloat(form.credit_limit) || 0 }
      const url = editingId ? `/api/customers/${editingId}` : '/api/customers'
      const method = editingId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'حدث خطأ')
      }
      if (editingId) {
        setCustomers((prev) => prev.map((c) => (c.id === editingId ? data.customer : c)))
      } else {
        setCustomers((prev) => [data.customer, ...prev])
      }
      setShowForm(false)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('حذف هذا العميل؟')) {
      return
    }
    const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setCustomers((prev) => prev.filter((c) => c.id !== id))
    }
  }

  const fmtTotalDebt = formatCurrency(totalDebt, currency)

  return (
    <div className="space-y-4">
      <MobilePageHeader
        title="العملاء"
        description={`${customers.length} عميل · ديون: ${fmtTotalDebt}`}
        actions={
          <button
            onClick={openNew}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-3 sm:px-4 h-10 rounded-lg text-sm font-medium hover:bg-primary/90 min-w-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">عميل جديد</span>
          </button>
        }
      />

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
          <p className="text-[10px] sm:text-xs text-blue-600">إجمالي العملاء</p>
          <p className="text-lg sm:text-2xl font-bold text-blue-700">{customers.length}</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 min-w-0">
          <p className="text-[10px] sm:text-xs text-red-600">إجمالي الديون</p>
          <p className="text-sm sm:text-lg font-bold text-red-700 truncate">{fmtTotalDebt}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
          <p className="text-[10px] sm:text-xs text-green-600">عملاء نشطون</p>
          <p className="text-lg sm:text-2xl font-bold text-green-700">{customers.filter((c) => c.is_active).length}</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث بالاسم أو الهاتف..."
          className="w-full border border-input rounded-lg pr-9 pl-3 h-11 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map((customer) => (
          <div
            key={customer.id}
            className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{localizedName(customer, lang)}</p>
                  {customer.code && <p className="text-xs text-muted-foreground">{customer.code}</p>}
                </div>
              </div>
              <div className="flex gap-0.5 shrink-0">
                <Link
                  href={`/dashboard/customers/${customer.id}`}
                  className="p-2 hover:bg-accent rounded-lg text-muted-foreground hover:text-primary min-h-[40px] min-w-[40px] flex items-center justify-center"
                  aria-label="عرض"
                >
                  <Eye className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => openEdit(customer)}
                  className="p-2 hover:bg-accent rounded-lg text-muted-foreground min-h-[40px] min-w-[40px] flex items-center justify-center"
                  aria-label="تعديل"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(customer.id)}
                  className="p-2 hover:bg-red-100 rounded-lg text-muted-foreground hover:text-red-600 min-h-[40px] min-w-[40px] flex items-center justify-center"
                  aria-label="حذف"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              {customer.phone && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Phone className="w-3 h-3 shrink-0" />
                  <span className="truncate" dir="ltr">
                    {customer.phone}
                  </span>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Mail className="w-3 h-3 shrink-0" />
                  <span className="truncate" dir="ltr">
                    {customer.email}
                  </span>
                </div>
              )}
            </div>
            {customer.balance > 0 && (
              <div className="mt-3 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-1.5 flex justify-between items-center">
                <span className="text-xs text-red-600">رصيد مستحق</span>
                <span className="text-sm font-bold text-red-700">{formatCurrency(customer.balance, currency)}</span>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full p-8 text-center text-sm text-muted-foreground">
            {search ? 'لا توجد نتائج' : 'لا يوجد عملاء بعد'}
          </div>
        )}
      </div>

      <BottomSheet
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editingId ? 'تعديل العميل' : 'عميل جديد'}
        footer={
          <div className="flex gap-3 p-4">
            <button
              type="submit"
              form="customer-form"
              disabled={loading}
              className="flex-1 bg-primary text-primary-foreground h-12 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              {editingId ? 'حفظ' : 'إضافة'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 h-12 border border-input rounded-lg text-sm hover:bg-accent"
            >
              إلغاء
            </button>
          </div>
        }
      >
        <form id="customer-form" onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1 block">الاسم بالعربي *</label>
              <input
                type="text"
                value={form.name_ar}
                onChange={(e) => setForm((f: any) => ({ ...f, name_ar: e.target.value, name: e.target.value }))}
                required
                className="w-full border border-input rounded-lg px-3 h-11 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">رقم الهاتف</label>
              <input
                type="tel"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => setForm((f: any) => ({ ...f, phone: e.target.value }))}
                dir="ltr"
                className="w-full border border-input rounded-lg px-3 h-11 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">البريد الإلكتروني</label>
              <input
                type="email"
                inputMode="email"
                value={form.email}
                onChange={(e) => setForm((f: any) => ({ ...f, email: e.target.value }))}
                dir="ltr"
                className="w-full border border-input rounded-lg px-3 h-11 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">حد الائتمان</label>
              <input
                type="number"
                inputMode="decimal"
                value={form.credit_limit}
                onChange={(e) => setForm((f: any) => ({ ...f, credit_limit: e.target.value }))}
                className="w-full border border-input rounded-lg px-3 h-11 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">العنوان</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm((f: any) => ({ ...f, address: e.target.value }))}
              className="w-full border border-input rounded-lg px-3 h-11 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">ملاحظات</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f: any) => ({ ...f, notes: e.target.value }))}
              rows={2}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg p-3">{error}</p>}
        </form>
      </BottomSheet>
    </div>
  )
}
