import type { SupabaseClient } from '@supabase/supabase-js'
import type { ServiceResult } from '@/types/service'

export interface SalesSummary {
  totalSales: number
  totalInvoices: number
  averageOrder: number
  cashSales: number
  creditSales: number
}

export interface ExpenseSummary {
  totalExpenses: number
  byCategory: Array<{ name: string; name_ar: string | null; total: number }>
}

export interface ProfitLossSummary {
  revenue: number
  costOfGoods: number
  expenses: number
  grossProfit: number
  netProfit: number
}

export class ReportService {
  constructor(
    private readonly db: SupabaseClient,
    private readonly companyId: string,
  ) {}

  async getSalesSummary(from: string, to: string): Promise<ServiceResult<SalesSummary>> {
    try {
      const { data: sales, error } = await this.db
        .from('sales')
        .select('total, payment_status, payment_method')
        .eq('company_id', this.companyId)
        .gte('sale_date', from)
        .lte('sale_date', to)
        .eq('status', 'completed')
      if (error) {
        throw error
      }

      const list = (sales ?? []) as Array<{ total: number; payment_status: string; payment_method: string }>
      return {
        ok: true,
        data: {
          totalSales: list.reduce((s, r) => s + r.total, 0),
          totalInvoices: list.length,
          averageOrder: list.length > 0 ? list.reduce((s, r) => s + r.total, 0) / list.length : 0,
          cashSales: list.filter((r) => r.payment_method === 'cash').reduce((s, r) => s + r.total, 0),
          creditSales: list
            .filter((r) => r.payment_status === 'unpaid' || r.payment_status === 'partial')
            .reduce((s, r) => s + r.total, 0),
        },
      }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'FETCH_FAILED' }
    }
  }

  async getExpenseSummary(from: string, to: string): Promise<ServiceResult<ExpenseSummary>> {
    try {
      const { data, error } = await this.db
        .from('expenses')
        .select('amount, expense_categories(name, name_ar)')
        .eq('company_id', this.companyId)
        .gte('expense_date', from)
        .lte('expense_date', to)
      if (error) {
        throw error
      }

      const rows = (data ?? []) as Array<{
        amount: number
        expense_categories: Array<{ name: string; name_ar: string | null }> | null
      }>
      return {
        ok: true,
        data: {
          totalExpenses: rows.reduce((s, r) => s + r.amount, 0),
          byCategory: Object.values(
            rows.reduce<Record<string, { name: string; name_ar: string | null; total: number }>>((acc, r) => {
              const cat = r.expense_categories?.[0]
              const catName = cat?.name ?? 'غير مصنف'
              if (!acc[catName]) {
                acc[catName] = { name: catName, name_ar: cat?.name_ar ?? null, total: 0 }
              }
              acc[catName].total += r.amount
              return acc
            }, {}),
          ),
        },
      }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'FETCH_FAILED' }
    }
  }

  async getProfitLoss(from: string, to: string): Promise<ServiceResult<ProfitLossSummary>> {
    try {
      const [{ data: sales }, { data: purchases }, { data: expenses }] = await Promise.all([
        this.db
          .from('sales')
          .select('total')
          .eq('company_id', this.companyId)
          .gte('sale_date', from)
          .lte('sale_date', to)
          .eq('status', 'completed'),
        this.db
          .from('purchases')
          .select('total')
          .eq('company_id', this.companyId)
          .gte('purchase_date', from)
          .lte('purchase_date', to),
        this.db
          .from('expenses')
          .select('amount')
          .eq('company_id', this.companyId)
          .gte('expense_date', from)
          .lte('expense_date', to),
      ])

      const revenue = (sales ?? []).reduce((s, r) => s + r.total, 0)
      const costOfGoods = (purchases ?? []).reduce((s, r) => s + r.total, 0)
      const expTotal = (expenses ?? []).reduce((s, r) => s + r.amount, 0)

      return {
        ok: true,
        data: {
          revenue,
          costOfGoods,
          expenses: expTotal,
          grossProfit: revenue - costOfGoods,
          netProfit: revenue - costOfGoods - expTotal,
        },
      }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'FETCH_FAILED' }
    }
  }

  async getDashboardStats(): Promise<ServiceResult<Record<string, unknown>>> {
    try {
      const today = new Date().toISOString().slice(0, 10)
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)

      const [
        { data: todaySales },
        { data: monthSales },
        { data: monthExpenses },
        { data: monthPurchases },
        { count: customerCount },
        { count: productCount },
      ] = await Promise.all([
        this.db
          .from('sales')
          .select('total')
          .eq('company_id', this.companyId)
          .gte('sale_date', today)
          .eq('status', 'completed'),
        this.db
          .from('sales')
          .select('total')
          .eq('company_id', this.companyId)
          .gte('sale_date', monthStart)
          .eq('status', 'completed'),
        this.db.from('expenses').select('amount').eq('company_id', this.companyId).gte('expense_date', monthStart),
        this.db.from('purchases').select('total').eq('company_id', this.companyId).gte('purchase_date', monthStart),
        this.db
          .from('parties')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', this.companyId)
          .eq('is_deleted', false)
          .eq('type', 'customer'),
        this.db
          .from('products')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', this.companyId)
          .eq('is_deleted', false)
          .eq('is_active', true),
      ])

      const monthTotal = (monthSales ?? []).reduce((s, r) => s + r.total, 0)
      const monthExpTotal = (monthExpenses ?? []).reduce((s, r) => s + r.amount, 0)
      const monthPurchTotal = (monthPurchases ?? []).reduce((s, r) => s + r.total, 0)

      return {
        ok: true,
        data: {
          todaySales: (todaySales ?? []).reduce((s, r) => s + r.total, 0),
          monthSales: monthTotal,
          monthExpenses: monthExpTotal,
          monthPurchases: monthPurchTotal,
          monthProfit: monthTotal - monthExpTotal - monthPurchTotal,
          totalCustomers: customerCount ?? 0,
          totalProducts: productCount ?? 0,
        },
      }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'FETCH_FAILED' }
    }
  }

  async getTopProducts(from: string, to: string, limit = 10): Promise<ServiceResult<Array<Record<string, unknown>>>> {
    try {
      const { data, error } = await this.db
        .from('sale_items')
        .select('product_id, quantity, total, products(id, name, name_ar, sku)')
        .eq('company_id', this.companyId)
        .gte('created_at', from)
        .lte('created_at', to)
        .order('quantity', { ascending: false })
        .limit(limit)
      if (error) {
        throw error
      }
      return { ok: true, data: data ?? [] }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'FETCH_FAILED' }
    }
  }

  async getAgedReceivables(asOf?: string): Promise<ServiceResult<Array<Record<string, unknown>>>> {
    try {
      const date = asOf ?? new Date().toISOString().slice(0, 10)
      const { data, error } = await this.db
        .from('sales')
        .select('id, invoice_number, total, paid_amount, due_amount, sale_date, customers(name, phone)')
        .eq('company_id', this.companyId)
        .in('payment_status', ['unpaid', 'partial'])
        .lte('sale_date', date)
        .order('sale_date', { ascending: true })
      if (error) {
        throw error
      }
      return { ok: true, data: data ?? [] }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'FETCH_FAILED' }
    }
  }
}
