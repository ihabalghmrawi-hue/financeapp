'use client'

import { useRealtimeQuery } from './useRealtimeQuery'
import { useRealtimeMutation } from './useRealtimeMutation'
import { accountsRepo, journalEntriesRepo, invoicesRepo } from '@/lib/supabase/repositories/financial-repository'
import { inventoryItemsRepo, stockMovementsRepo } from '@/lib/supabase/repositories/inventory-repository'
import { purchaseOrdersRepo, suppliersRepo } from '@/lib/supabase/repositories/procurement-repository'
import { salesOrdersRepo, customersRepo } from '@/lib/supabase/repositories/sales-repository'
import { payrollRunsRepo, payrollEmployeesRepo } from '@/lib/supabase/repositories/payroll-repository'
import { approvalRequestsRepo } from '@/lib/supabase/repositories/workflow-repository'
import { useOfflineQuery } from '@/lib/offline/react/use-offline-query'
import { useOfflineMutation } from '@/lib/offline/react/use-offline-mutation'
import type {
  AccountSummary,
  TransactionEntry,
  Invoice,
  InventoryItem,
  PurchaseOrder,
  SalesOrder,
  PayrollRun,
} from '@/lib/workbench/types'
import type { ApprovalRequest } from '@/lib/workflow/types'

export function useAccounts(filters?: Record<string, unknown>) {
  return useRealtimeQuery<AccountSummary>({
    repository: accountsRepo,
    filters,
    subscribe: true,
  })
}

export function useJournalEntries(filters?: Record<string, unknown>) {
  return useRealtimeQuery<TransactionEntry>({
    repository: journalEntriesRepo,
    filters,
    orderBy: { column: 'created_at' },
    subscribe: true,
  })
}

export function useJournalMutations() {
  return useRealtimeMutation<TransactionEntry>({ repository: journalEntriesRepo })
}

export function useInvoices(type?: 'payable' | 'receivable') {
  return useRealtimeQuery<Invoice>({
    repository: invoicesRepo,
    filters: type ? { type } : undefined,
    subscribe: true,
  })
}

export function useInvoiceMutations() {
  return useRealtimeMutation<Invoice>({ repository: invoicesRepo })
}

export function useInventoryItems(filters?: Record<string, unknown>) {
  return useRealtimeQuery<InventoryItem>({
    repository: inventoryItemsRepo,
    filters,
    subscribe: true,
  })
}

export function useInventoryMutations() {
  return useRealtimeMutation<InventoryItem>({ repository: inventoryItemsRepo })
}

export function useStockMovements(itemId?: string) {
  return useRealtimeQuery<any>({
    repository: stockMovementsRepo,
    filters: itemId ? { itemId } : undefined,
    subscribe: true,
  })
}

export function usePurchaseOrders(filters?: Record<string, unknown>) {
  return useRealtimeQuery<PurchaseOrder>({
    repository: purchaseOrdersRepo,
    filters,
    subscribe: true,
  })
}

export function usePOMutations() {
  return useRealtimeMutation<PurchaseOrder>({ repository: purchaseOrdersRepo })
}

export function useSalesOrders(filters?: Record<string, unknown>) {
  return useRealtimeQuery<SalesOrder>({
    repository: salesOrdersRepo,
    filters,
    subscribe: true,
  })
}

export function useSalesMutations() {
  return useRealtimeMutation<SalesOrder>({ repository: salesOrdersRepo })
}

export function usePayrollRuns(filters?: Record<string, unknown>) {
  return useRealtimeQuery<PayrollRun>({
    repository: payrollRunsRepo,
    filters,
    subscribe: true,
  })
}

export function usePayrollMutations() {
  return useRealtimeMutation<PayrollRun>({ repository: payrollRunsRepo })
}

export function useApprovalsPending(userId?: string) {
  return useRealtimeQuery<ApprovalRequest>({
    repository: approvalRequestsRepo,
    filters: { decision: 'pending' },
    subscribe: true,
    subscribeFilter: userId ? { column: 'assigned_to', value: userId } : undefined,
  })
}

export function useApprovalMutations() {
  return useRealtimeMutation<ApprovalRequest>({ repository: approvalRequestsRepo })
}

export function useOfflineAccounts(companyId: string, filters?: Record<string, unknown>) {
  return useOfflineQuery<AccountSummary>({ entityType: 'accounts', companyId, filters })
}

export function useOfflineJournalEntries(companyId: string, filters?: Record<string, unknown>) {
  return useOfflineQuery<TransactionEntry>({ entityType: 'journal_entries', companyId, filters })
}

export function useOfflineJournalMutations(companyId: string) {
  return useOfflineMutation<TransactionEntry>({ entityType: 'journal_entries', companyId, optimistic: true })
}

export function useOfflineInvoices(companyId: string, type?: 'payable' | 'receivable') {
  return useOfflineQuery<Invoice>({ entityType: 'invoices', companyId, filters: type ? { type } : undefined })
}

export function useOfflineInvoiceMutations(companyId: string) {
  return useOfflineMutation<Invoice>({ entityType: 'invoices', companyId, optimistic: true })
}

export function useOfflineInventoryItems(companyId: string, filters?: Record<string, unknown>) {
  return useOfflineQuery<InventoryItem>({ entityType: 'inventory_items', companyId, filters })
}

export function useOfflineInventoryMutations(companyId: string) {
  return useOfflineMutation<InventoryItem>({ entityType: 'inventory_items', companyId, optimistic: true })
}

export function useOfflineStockMovements(companyId: string, itemId?: string) {
  return useOfflineQuery<any>({ entityType: 'stock_movements', companyId, filters: itemId ? { itemId } : undefined })
}

export function useOfflinePurchaseOrders(companyId: string, filters?: Record<string, unknown>) {
  return useOfflineQuery<PurchaseOrder>({ entityType: 'purchase_orders', companyId, filters })
}

export function useOfflinePOMutations(companyId: string) {
  return useOfflineMutation<PurchaseOrder>({ entityType: 'purchase_orders', companyId, optimistic: true })
}

export function useOfflineSalesOrders(companyId: string, filters?: Record<string, unknown>) {
  return useOfflineQuery<SalesOrder>({ entityType: 'sales_orders', companyId, filters })
}

export function useOfflineSalesMutations(companyId: string) {
  return useOfflineMutation<SalesOrder>({ entityType: 'sales_orders', companyId, optimistic: true })
}

export function useOfflinePayrollRuns(companyId: string, filters?: Record<string, unknown>) {
  return useOfflineQuery<PayrollRun>({ entityType: 'payroll_runs', companyId, filters })
}

export function useOfflinePayrollMutations(companyId: string) {
  return useOfflineMutation<PayrollRun>({ entityType: 'payroll_runs', companyId, optimistic: true })
}

export function useOfflineApprovalsPending(companyId: string, userId?: string) {
  return useOfflineQuery<ApprovalRequest>({
    entityType: 'approval_requests',
    companyId,
    filters: { decision: 'pending' },
  })
}

export function useOfflineApprovalMutations(companyId: string) {
  return useOfflineMutation<ApprovalRequest>({ entityType: 'approval_requests', companyId, optimistic: true })
}
