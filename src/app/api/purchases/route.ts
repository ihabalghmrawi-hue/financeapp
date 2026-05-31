import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireCompany, requireRole, isAuthError } from '@/lib/auth-guard'
import { ok, Errors } from '@/lib/api-response'
import { PurchaseService } from '@/services/purchase.service'
import { postPurchaseJournal, updateWallet } from '@/lib/accounting'
import { recordInventoryMovement } from '@/lib/inventory'

export async function POST(req: NextRequest) {
  const ctx = requireRole(req, 'purchases:create')
  if (isAuthError(ctx)) {
    return ctx
  }

  const supabase = createClient()
  const service = new PurchaseService(supabase, ctx.companyId)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return Errors.badRequest('Invalid JSON body')
  }

  const input = body as any
  if (!input.items?.length) {
    return Errors.badRequest('No products in invoice')
  }
  if (!input.total || input.total <= 0) {
    return Errors.badRequest('Invoice total must be greater than zero')
  }

  const { data: invoiceNumber } = await supabase.rpc('generate_invoice_number', {
    p_company_id: ctx.companyId,
    p_prefix: 'PUR',
  })
  const invoice_number = invoiceNumber || `PUR-${Date.now()}`
  const actualPaid = input.paid_amount || 0
  const actualDue = input.due_amount || Math.max(0, input.total - actualPaid)

  const purchaseInput = {
    ...input,
    company_id: ctx.companyId,
    supplier_id: input.supplier_id ?? null,
    warehouse_id: input.warehouse_id ?? null,
    purchase_date: input.purchase_date || new Date().toISOString().slice(0, 10),
    subtotal: input.subtotal || input.total,
    total: input.total,
    paid_amount: actualPaid,
    due_amount: actualDue,
    payment_status:
      input.payment_status || (actualPaid >= input.total ? 'paid' : actualPaid > 0 ? 'partial' : 'unpaid'),
    notes: input.notes || null,
  }

  const result = await service.create(purchaseInput as any)
  if (!result.ok) {
    return Errors.badRequest(result.error)
  }
  const purchase = result.data

  const admin = createAdminClient()

  const inventoryErrors: string[] = []
  if (input.warehouse_id) {
    for (const item of input.items) {
      if (!item.product_id) {
        continue
      }
      const invResult = await recordInventoryMovement(supabase, {
        company_id: ctx.companyId,
        product_id: item.product_id,
        warehouse_id: input.warehouse_id,
        type: 'purchase',
        quantity: item.quantity,
        reference_id: purchase.id,
        reference_type: 'purchase',
      })
      if (!invResult.ok) {
        inventoryErrors.push(item.product_id)
      }
      await supabase.from('products').update({ cost_price: item.unit_cost }).eq('id', item.product_id)
    }
  }

  const journalResult = await postPurchaseJournal(admin, {
    company_id: ctx.companyId,
    invoice_number,
    purchase_id: purchase.id,
    total: input.total,
    paid_amount: actualPaid,
    due_amount: actualDue,
    wallet_id: input.wallet_id || undefined,
  })
  if (!journalResult.ok) {
    console.error('Purchase journal entry failed:', journalResult.error)
  }

  if (actualPaid > 0) {
    const walletResult = await updateWallet(
      admin,
      ctx.companyId,
      -actualPaid,
      `Purchases - Invoice ${invoice_number}`,
      purchase.id,
      'purchase',
      'cash',
      input.wallet_id || undefined,
    )
    if (!walletResult.ok) {
      console.error('Wallet update failed:', walletResult.error)
    }
  }

  if (input.supplier_id && actualDue > 0) {
    const { data: sup } = await supabase.from('suppliers').select('balance').eq('id', input.supplier_id).single()
    if (sup) {
      await supabase
        .from('suppliers')
        .update({ balance: (sup.balance || 0) + actualDue })
        .eq('id', input.supplier_id)
    }
  }

  return ok(
    {
      success: true,
      purchase,
      invoice_number,
      inventory_warnings:
        inventoryErrors.length > 0 ? `Failed to update inventory for ${inventoryErrors.length} product(s)` : undefined,
    },
    undefined,
    201,
  )
}
