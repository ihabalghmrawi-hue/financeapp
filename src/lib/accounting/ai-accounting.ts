import type { SupabaseClient } from '@supabase/supabase-js'
import type { JournalSuggestion, AnomalyResult, AutoCategorizationResult } from './enterprise-types'

interface AIContext {
  companyId: string
  description?: string
  amount?: number
  source?: string
}

export class AIAccountingEngine {
  private supabase: SupabaseClient
  private companyId: string

  constructor(supabase: SupabaseClient, companyId: string) {
    this.supabase = supabase
    this.companyId = companyId
  }

  async suggestJournalEntry(description: string, amount?: number): Promise<JournalSuggestion[]> {
    const suggestions: JournalSuggestion[] = []
    const lower = description.toLowerCase()

    if (this.matchAny(lower, ['sale', 'invoice', 'customer'])) {
      suggestions.push({
        confidence: 0.85,
        description: `Revenue Entry: ${description}`,
        lines: [
          { account_code: '1101', debit: amount || 0, credit: 0, description: 'Cash' },
          { account_code: '4001', debit: 0, credit: amount || 0, description: 'Sales Revenue' },
        ],
        reason: 'Sales invoice pattern',
      })
    }

    if (this.matchAny(lower, ['expense', 'payment', 'purchase'])) {
      suggestions.push({
        confidence: 0.8,
        description: `Expense Entry: ${description}`,
        lines: [
          { account_code: '6501', debit: amount || 0, credit: 0, description },
          { account_code: '1101', debit: 0, credit: amount || 0, description: 'Cash' },
        ],
        reason: 'General expense pattern',
      })
    }

    if (this.matchAny(lower, ['purchase', 'inventory'])) {
      suggestions.push({
        confidence: 0.85,
        description: `Purchase Entry: ${description}`,
        lines: [
          { account_code: '1120', debit: amount || 0, credit: 0, description: 'Inventory' },
          { account_code: '2101', debit: 0, credit: amount || 0, description: 'Accounts Payable' },
        ],
        reason: 'Purchase invoice pattern',
      })
    }

    if (this.matchAny(lower, ['salary', 'payroll', 'wages'])) {
      suggestions.push({
        confidence: 0.9,
        description: `Payroll Entry: ${description}`,
        lines: [
          { account_code: '6101', debit: amount || 0, credit: 0, description: 'Salaries and Wages' },
          { account_code: '2106', debit: 0, credit: amount || 0, description: 'Accrued Salaries' },
        ],
        reason: 'Payroll pattern',
      })
    }

    if (this.matchAny(lower, ['rent'])) {
      suggestions.push({
        confidence: 0.92,
        description: `Rent Entry: ${description}`,
        lines: [
          { account_code: '6201', debit: amount || 0, credit: 0, description: 'Rent Expense' },
          { account_code: '1101', debit: 0, credit: amount || 0, description: 'Cash' },
        ],
        reason: 'Rent payment pattern',
      })
    }

    if (this.matchAny(lower, ['collection', 'receipt'])) {
      suggestions.push({
        confidence: 0.88,
        description: `Collection Entry: ${description}`,
        lines: [
          { account_code: '1101', debit: amount || 0, credit: 0, description: 'Cash' },
          { account_code: '1110', debit: 0, credit: amount || 0, description: 'Accounts Receivable' },
        ],
        reason: 'Customer collection pattern',
      })
    }

    if (this.matchAny(lower, ['payment', 'pay', 'supplier'])) {
      suggestions.push({
        confidence: 0.88,
        description: `Supplier Payment Entry: ${description}`,
        lines: [
          { account_code: '2101', debit: amount || 0, credit: 0, description: 'Accounts Payable' },
          { account_code: '1101', debit: 0, credit: amount || 0, description: 'Cash' },
        ],
        reason: 'Supplier payment pattern',
      })
    }

    if (suggestions.length === 0) {
      suggestions.push({
        confidence: 0.5,
        description: `Manual Entry: ${description}`,
        lines: [
          { account_code: '6501', debit: amount || 0, credit: 0, description },
          { account_code: '1101', debit: 0, credit: amount || 0, description: 'Offset' },
        ],
        reason: 'General recommendation - please review',
      })
    }

    return suggestions
  }

  async detectAnomalies(): Promise<AnomalyResult[]> {
    const anomalies: AnomalyResult[] = []
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)

    const { data: entries } = await this.supabase
      .from('journal_entries')
      .select('id, entry_number, description, total_debit, date, company_id')
      .eq('company_id', this.companyId)
      .gte('date', thirtyDaysAgo)
      .order('total_debit', { ascending: false })
      .limit(5)

    const avgResult = await this.supabase
      .from('journal_entries')
      .select('total_debit')
      .eq('company_id', this.companyId)
      .gte('date', thirtyDaysAgo)

    const allAmounts = (avgResult.data || []).map((r: any) => Number(r.total_debit))
    const avgAmount = allAmounts.length > 0 ? allAmounts.reduce((s, v) => s + v, 0) / allAmounts.length : 0
    const threshold = avgAmount * 3

    for (const entry of (entries || []) as any[]) {
      if (Number(entry.total_debit) > threshold && threshold > 1000) {
        anomalies.push({
          type: 'unusual_amount',
          severity: 'medium',
          message: `Unusual journal entry: ${entry.entry_number} value ${entry.total_debit}`,
          details: { entry_id: entry.id, amount: entry.total_debit, avg: avgAmount },
          suggestion: 'Please review this entry to verify its accuracy',
        })
      }
    }

    const { data: unbalanced } = await this.supabase
      .from('journal_entries')
      .select('id, entry_number, total_debit, total_credit')
      .eq('company_id', this.companyId)
      .eq('status', 'posted')

    for (const entry of (unbalanced || []) as any[]) {
      const diff = Math.abs(Number(entry.total_debit) - Number(entry.total_credit))
      if (diff > 0.01) {
        anomalies.push({
          type: 'broken_balance',
          severity: 'high',
          message: `Unbalanced journal entry: ${entry.entry_number} (difference: ${diff})`,
          details: { entry_id: entry.id, debit: entry.total_debit, credit: entry.total_credit, diff },
          suggestion: 'Must correct this entry immediately to ensure data integrity',
        })
      }
    }

    const { data: recentLines } = await this.supabase
      .from('journal_entry_lines')
      .select(
        `
        account_id, debit, credit,
        accounts!inner(code, name_ar, type),
        journal_entries!inner(date, company_id)
      `,
      )
      .eq('journal_entries.company_id', this.companyId)
      .gte('journal_entries.date', thirtyDaysAgo)

    const accountUsage: Record<string, number> = {}
    for (const line of (recentLines || []) as any[]) {
      if (line.accounts?.code) {
        accountUsage[line.accounts.code] = (accountUsage[line.accounts.code] || 0) + 1
      }
    }

    return anomalies
  }

  async detectRecurringTransactions(): Promise<JournalSuggestion[]> {
    const suggestions: JournalSuggestion[] = []
    const threeMonthsAgo = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10)

    const { data: entries } = await this.supabase
      .from('journal_entries')
      .select('id, description, total_debit, total_credit, date')
      .eq('company_id', this.companyId)
      .gte('date', threeMonthsAgo)
      .order('date', { ascending: true })

    if (!entries || entries.length < 3) {
      return suggestions
    }

    const byDescription: Record<string, Array<{ date: string; amount: number }>> = {}
    for (const entry of entries as any[]) {
      const desc = (entry.description || '').trim()
      if (!desc) {
        continue
      }
      if (!byDescription[desc]) {
        byDescription[desc] = []
      }
      byDescription[desc].push({
        date: entry.date,
        amount: Number(entry.total_debit),
      })
    }

    for (const [desc, occurrences] of Object.entries(byDescription)) {
      if (occurrences.length >= 3) {
        const intervals: number[] = []
        for (let i = 1; i < occurrences.length; i++) {
          const diff = Math.abs(new Date(occurrences[i].date).getTime() - new Date(occurrences[i - 1].date).getTime())
          intervals.push(diff / (1000 * 60 * 60 * 24))
        }

        const avgInterval = intervals.length > 0 ? intervals.reduce((s, v) => s + v, 0) / intervals.length : 0

        if (avgInterval > 0 && intervals.every((i) => Math.abs(i - avgInterval) / avgInterval <= 0.2)) {
          const amounts = occurrences.map((o) => o.amount)
          const avgAmount = amounts.reduce((s, v) => s + v, 0) / amounts.length

          suggestions.push({
            confidence: 0.8,
            description: `Recurring entry detected: ${desc}`,
            lines: [],
            reason: `Appeared ${occurrences.length} times with avg interval ${Math.round(avgInterval)} days and avg value ${avgAmount.toFixed(2)}`,
          })
        }
      }
    }

    return suggestions
  }

  async autoCategorize(description: string): Promise<AutoCategorizationResult> {
    const lower = description.toLowerCase()

    if (this.matchAny(lower, ['dress', 'clothing', 'robe'])) {
      return {
        confidence: 0.9,
        suggested_code: '4001',
        suggested_name: 'Sales Revenue',
        reason: 'Product description matches sales revenue',
      }
    }
    if (this.matchAny(lower, ['electricity', 'water', 'utility'])) {
      return {
        confidence: 0.95,
        suggested_code: '6202',
        suggested_name: 'Electricity and Water',
        reason: 'Utility expense',
      }
    }
    if (this.matchAny(lower, ['rent'])) {
      return {
        confidence: 0.95,
        suggested_code: '6201',
        suggested_name: 'Rent',
        reason: 'Rent expense',
      }
    }
    if (this.matchAny(lower, ['transport', 'fuel'])) {
      return {
        confidence: 0.9,
        suggested_code: '6501',
        suggested_name: 'Transportation Expenses',
        reason: 'Transport expense',
      }
    }
    if (this.matchAny(lower, ['travel', 'flight', 'hotel'])) {
      return {
        confidence: 0.85,
        suggested_code: '6501',
        suggested_name: 'Travel Expenses',
        reason: 'Travel expense',
      }
    }
    if (this.matchAny(lower, ['advert', 'marketing'])) {
      return {
        confidence: 0.92,
        suggested_code: '6301',
        suggested_name: 'Advertising and Marketing',
        reason: 'Marketing expense',
      }
    }
    if (this.matchAny(lower, ['maintenance', 'repair'])) {
      return {
        confidence: 0.9,
        suggested_code: '6203',
        suggested_name: 'Maintenance and Repairs',
        reason: 'Maintenance expense',
      }
    }
    if (this.matchAny(lower, ['commission', 'bank'])) {
      return {
        confidence: 0.88,
        suggested_code: '6402',
        suggested_name: 'Bank Charges',
        reason: 'Bank expense',
      }
    }

    return {
      confidence: 0.5,
      suggested_code: '6501',
      suggested_name: 'Miscellaneous Expenses',
      reason: 'Pattern not recognized - using default account',
    }
  }

  async generateInsights(): Promise<Array<{ type: string; message: string; severity: string; action_url?: string }>> {
    const insights: Array<{ type: string; message: string; severity: string; action_url?: string }> = []
    const today = new Date().toISOString().slice(0, 10)
    const monthStart = `${new Date().toISOString().slice(0, 7)}-01`

    const { data: revenueLines } = await this.supabase
      .from('journal_entry_lines')
      .select('credit, debit')
      .gte('journal_entries(date)', monthStart)
      .lte('journal_entries(date)', today)
      .eq('journal_entries.company_id', this.companyId)
      .eq('journal_entries.status', 'posted')
      .eq('accounts.type', 'revenue')

    const { data: expenseLines } = await this.supabase
      .from('journal_entry_lines')
      .select('debit, credit')
      .gte('journal_entries(date)', monthStart)
      .lte('journal_entries(date)', today)
      .eq('journal_entries.company_id', this.companyId)
      .eq('journal_entries.status', 'posted')
      .in('accounts.type', ['expense', 'cogs'])

    const revenue = (revenueLines || []).reduce((s, r: any) => s + Number(r.credit || 0) - Number(r.debit || 0), 0)
    const expenses = (expenseLines || []).reduce((s, r: any) => s + Number(r.debit || 0) - Number(r.credit || 0), 0)

    if (revenue > 0 && expenses > 0) {
      const ratio = revenue / expenses
      if (ratio < 1.1) {
        insights.push({
          type: 'profit_warning',
          message: `Revenue to expense ratio this month is low (${ratio.toFixed(2)})`,
          severity: 'warning',
          action_url: '/dashboard/accounting/statements?type=income',
        })
      } else if (ratio > 3) {
        insights.push({
          type: 'high_margin',
          message: `Excellent profit margin this month (${((1 - 1 / ratio) * 100).toFixed(0)}%)`,
          severity: 'positive',
        })
      }
    }

    const { count: unmatchedCount } = await this.supabase
      .from('reconciliations')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', this.companyId)
      .neq('status', 'matched')

    if (unmatchedCount && unmatchedCount > 5) {
      insights.push({
        type: 'unreconciled',
        message: `There are ${unmatchedCount} unmatched transactions needing reconciliation`,
        severity: 'warning',
        action_url: '/dashboard/accounting/reconciliation',
      })
    }

    const { count: draftCount } = await this.supabase
      .from('journal_entries')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', this.companyId)
      .eq('status', 'draft')

    if (draftCount && draftCount > 0) {
      insights.push({
        type: 'draft_entries',
        message: `There are ${draftCount} draft entries needing review`,
        severity: 'info',
        action_url: '/dashboard/accounting/journal?status=draft',
      })
    }

    return insights
  }

  async suggestReconciliation(): Promise<
    Array<{
      invoice_id: string
      invoice_ref: string
      invoice_amount: number
      payment_ids: string[]
      total_paid: number
      confidence: number
    }>
  > {
    const suggestions: Array<{
      invoice_id: string
      invoice_ref: string
      invoice_amount: number
      payment_ids: string[]
      total_paid: number
      confidence: number
    }> = []

    const { data: invoices } = await this.supabase
      .from('journal_entries')
      .select('id, reference, total_debit, date')
      .eq('company_id', this.companyId)
      .eq('status', 'posted')
      .eq('source', 'pos')
      .order('date', { ascending: false })
      .limit(50)

    const { data: payments } = await this.supabase
      .from('journal_entries')
      .select('id, reference, total_credit, date')
      .eq('company_id', this.companyId)
      .eq('status', 'posted')
      .eq('source', 'customer_payment')
      .order('date', { ascending: false })
      .limit(50)

    if (!invoices || !payments) {
      return suggestions
    }

    for (const inv of invoices as any[]) {
      const invAmount = Number(inv.total_debit)
      let remaining = invAmount
      const matchedPayments: string[] = []

      for (const pmt of (payments || []) as any[]) {
        const pmtAmount = Number(pmt.total_credit)
        if (matchedPayments.includes(pmt.id)) {
          continue
        }

        if (new Date(pmt.date) >= new Date(inv.date) && remaining > 0) {
          matchedPayments.push(pmt.id)
          remaining -= pmtAmount
          if (remaining <= 0) {
            break
          }
        }
      }

      if (matchedPayments.length > 0) {
        const totalPaid = invAmount - Math.max(0, remaining)
        suggestions.push({
          invoice_id: inv.id,
          invoice_ref: inv.reference || inv.id.slice(0, 8),
          invoice_amount: invAmount,
          payment_ids: matchedPayments,
          total_paid: totalPaid,
          confidence: Math.abs(totalPaid - invAmount) < 0.01 ? 0.95 : 0.7,
        })
      }
    }

    return suggestions
  }

  private matchAny(text: string, patterns: string[]): boolean {
    return patterns.some((p) => text.includes(p))
  }
}
