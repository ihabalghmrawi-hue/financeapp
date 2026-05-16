import type { ValidationMessage } from '@/lib/workbench/types'

export function validateJournalEntry(
  debits: { accountId: string; amount: number }[],
  credits: { accountId: string; amount: number }[],
): ValidationMessage[] {
  const messages: ValidationMessage[] = []

  if (!debits || debits.length === 0) {
    messages.push({
      id: 'je-no-debits',
      type: 'error',
      message: 'At least one debit entry is required in the journal entry',
      field: 'debits',
    })
  }

  if (!credits || credits.length === 0) {
    messages.push({
      id: 'je-no-credits',
      type: 'error',
      message: 'At least one credit entry is required in the journal entry',
      field: 'credits',
    })
  }

  const totalLines = (debits?.length || 0) + (credits?.length || 0)
  if (totalLines > 100) {
    messages.push({
      id: 'je-max-lines',
      type: 'error',
      message: 'Exceeded maximum number of journal entry lines (100 lines max)',
      field: 'lines',
    })
  }

  if (!debits || !credits) {
    return messages
  }

  for (let i = 0; i < debits.length; i++) {
    const d = debits[i]
    if (d.amount === 0) {
      messages.push({
        id: `je-zero-debit-${i}`,
        type: 'error',
        message: `Debit entry amount at index ${i} is zero, please enter a valid amount`,
        field: `debits[${i}].amount`,
      })
    }
    if (d.amount < 0) {
      messages.push({
        id: `je-negative-debit-${i}`,
        type: 'error',
        message: `Debit entry amount at index ${i} is negative (${d.amount}), amount must be positive`,
        field: `debits[${i}].amount`,
      })
    }
    if (!d.accountId) {
      messages.push({
        id: `je-no-account-debit-${i}`,
        type: 'error',
        message: `Debit entry at index ${i} does not have an account ID`,
        field: `debits[${i}].accountId`,
      })
    }
  }

  for (let i = 0; i < credits.length; i++) {
    const c = credits[i]
    if (c.amount === 0) {
      messages.push({
        id: `je-zero-credit-${i}`,
        type: 'error',
        message: `Credit entry amount at index ${i} is zero, please enter a valid amount`,
        field: `credits[${i}].amount`,
      })
    }
    if (c.amount < 0) {
      messages.push({
        id: `je-negative-credit-${i}`,
        type: 'error',
        message: `Credit entry amount at index ${i} is negative (${c.amount}), amount must be positive`,
        field: `credits[${i}].amount`,
      })
    }
    if (!c.accountId) {
      messages.push({
        id: `je-no-account-credit-${i}`,
        type: 'error',
        message: `Credit entry at index ${i} does not have an account ID`,
        field: `credits[${i}].accountId`,
      })
    }
  }

  const totalDebits = debits.reduce((sum, d) => sum + d.amount, 0)
  const totalCredits = credits.reduce((sum, c) => sum + c.amount, 0)

  if (totalLines > 0 && totalDebits !== totalCredits) {
    messages.push({
      id: 'je-unbalanced',
      type: 'error',
      message: `Journal entry is unbalanced: total debits (${totalDebits.toFixed(2)}) does not equal total credits (${totalCredits.toFixed(2)})`,
      field: 'amount',
    })
  }

  return messages
}

export function validateAccountBalance(
  accountId: string,
  debitChange: number,
  creditChange: number,
  currentBalance: number,
): ValidationMessage[] {
  const messages: ValidationMessage[] = []

  if (!accountId) {
    messages.push({
      id: 'bal-no-account',
      type: 'error',
      message: 'Account ID is required for balance validation',
      field: 'accountId',
    })
    return messages
  }

  if (debitChange < 0) {
    messages.push({
      id: 'bal-negative-debit',
      type: 'error',
      message: 'Debit change cannot be negative',
      field: 'debitChange',
    })
  }

  if (creditChange < 0) {
    messages.push({
      id: 'bal-negative-credit',
      type: 'error',
      message: 'Credit change cannot be negative',
      field: 'creditChange',
    })
  }

  const resultingBalance = currentBalance + debitChange - creditChange

  if (resultingBalance < 0) {
    messages.push({
      id: 'bal-negative-result',
      type: 'error',
      message: `Resulting balance is negative (${resultingBalance.toFixed(2)}), asset accounts cannot have negative balance`,
      field: 'balance',
    })
  }

  const creditLimit = Math.abs(currentBalance) * 2
  if (resultingBalance > creditLimit) {
    messages.push({
      id: 'bal-credit-limit',
      type: 'warning',
      message: `Resulting balance (${resultingBalance.toFixed(2)}) exceeds the allowed credit limit (${creditLimit.toFixed(2)})`,
      field: 'balance',
    })
  }

  return messages
}

export function validateInvoiceMatch(
  poAmount: number,
  receiptAmount: number,
  invoiceAmount: number,
  tolerancePct: number,
): ValidationMessage[] {
  const messages: ValidationMessage[] = []

  if (poAmount < 0) {
    messages.push({
      id: 'inv-po-negative',
      type: 'error',
      message: 'Purchase order amount cannot be negative',
      field: 'poAmount',
    })
  }

  if (receiptAmount < 0) {
    messages.push({
      id: 'inv-receipt-negative',
      type: 'error',
      message: 'Receipt amount cannot be negative',
      field: 'receiptAmount',
    })
  }

  if (invoiceAmount < 0) {
    messages.push({
      id: 'inv-amount-negative',
      type: 'error',
      message: 'Invoice amount cannot be negative',
      field: 'invoiceAmount',
    })
  }

  if (tolerancePct < 0 || tolerancePct > 100) {
    messages.push({
      id: 'inv-tolerance-invalid',
      type: 'error',
      message: 'Tolerance percentage must be between 0 and 100',
      field: 'tolerancePct',
    })
  }

  if (poAmount > 0) {
    const variancePct = Math.abs((invoiceAmount - poAmount) / poAmount) * 100
    if (variancePct > tolerancePct) {
      messages.push({
        id: 'inv-po-variance',
        type: 'warning',
        message: `Invoice (${invoiceAmount.toFixed(2)}) does not match purchase order (${poAmount.toFixed(2)}) within allowed tolerance (${tolerancePct}%), actual variance ${variancePct.toFixed(2)}%`,
        field: 'invoiceAmount',
      })
    }
  }

  if (poAmount > 0 && receiptAmount > 0) {
    const receiptVariance = Math.abs(invoiceAmount - receiptAmount)
    if (receiptVariance > poAmount * (tolerancePct / 100)) {
      messages.push({
        id: 'inv-receipt-variance',
        type: 'warning',
        message: `Invoice quantity does not match receipt quantity, difference ${receiptVariance.toFixed(2)}`,
        field: 'receiptAmount',
      })
    }
  }

  if (poAmount > 0 && receiptAmount > 0 && invoiceAmount > 0) {
    const unitPricePO = poAmount
    const unitPriceInvoice = invoiceAmount
    const unitPriceVariance = (Math.abs(unitPriceInvoice - unitPricePO) / unitPricePO) * 100
    if (unitPriceVariance > tolerancePct) {
      messages.push({
        id: 'inv-price-variance',
        type: 'warning',
        message: `Unit price in invoice differs from purchase order by ${unitPriceVariance.toFixed(2)}%, which exceeds the allowed tolerance`,
        field: 'unitPrice',
      })
    }
  }

  if (poAmount === 0 && invoiceAmount === 0) {
    messages.push({
      id: 'inv-zero-amounts',
      type: 'info',
      message: 'Both purchase order and invoice have zero amount, please verify the data',
      field: 'amount',
    })
  }

  return messages
}

export function validateReconciliation(
  statementBalance: number,
  bookBalance: number,
  difference: number,
  threshold: number,
): ValidationMessage[] {
  const messages: ValidationMessage[] = []

  if (threshold < 0) {
    messages.push({
      id: 'rec-threshold-negative',
      type: 'error',
      message: 'Threshold value cannot be negative',
      field: 'threshold',
    })
    return messages
  }

  const absDifference = Math.abs(difference)

  if (absDifference === 0) {
    messages.push({
      id: 'rec-matched',
      type: 'success',
      message: 'Reconciliation successful: statement balance matches book balance',
      field: 'difference',
    })
  } else if (absDifference <= threshold) {
    messages.push({
      id: 'rec-within-threshold',
      type: 'info',
      message: `Difference (${difference.toFixed(2)}) is within allowed threshold (${threshold.toFixed(2)}), recommended to check unmatched items`,
      field: 'difference',
    })
  } else {
    messages.push({
      id: 'rec-exceeds-threshold',
      type: 'error',
      message: `Difference (${difference.toFixed(2)}) exceeds allowed threshold (${threshold.toFixed(2)}), must investigate and identify unmatched items`,
      field: 'difference',
    })
  }

  const expectedFromUnreconciled = Math.abs(statementBalance - bookBalance)
  if (absDifference > 0 && expectedFromUnreconciled > threshold) {
    messages.push({
      id: 'rec-unreconciled-items',
      type: 'warning',
      message: `Difference (${difference.toFixed(2)}) may be due to unmatched items, please review statement and book balance for pending items`,
      field: 'difference',
    })
  }

  return messages
}

export function validateFinancialClose(
  accounts: { id: string; balance: number; reconciled: boolean }[],
): ValidationMessage[] {
  const messages: ValidationMessage[] = []

  if (!accounts || accounts.length === 0) {
    messages.push({
      id: 'close-no-accounts',
      type: 'error',
      message: 'No accounts to close the financial period',
      field: 'accounts',
    })
    return messages
  }

  const unreconciled = accounts.filter((a) => !a.reconciled)
  if (unreconciled.length > 0) {
    messages.push({
      id: 'close-unreconciled',
      type: 'error',
      message: `${unreconciled.length} account(s) are not reconciled and must be reconciled before closing the period: ${unreconciled.map((a) => a.id).join(', ')}`,
      field: 'reconciled',
    })
  }

  const openBalances = accounts.filter((a) => a.balance !== 0)
  if (openBalances.length > 0) {
    messages.push({
      id: 'close-open-balances',
      type: 'warning',
      message: `${openBalances.length} account(s) have unfiltered open balances: ${openBalances.map((a) => `${a.id} (${a.balance.toFixed(2)})`).join(', ')}`,
      field: 'balance',
    })
  }

  const reconciledCount = accounts.filter((a) => a.reconciled).length
  if (reconciledCount === accounts.length) {
    messages.push({
      id: 'close-all-reconciled',
      type: 'success',
      message: 'All accounts are reconciled and ready for period closing',
      field: 'reconciled',
    })
  }

  messages.push({
    id: 'close-subsidiaries',
    type: 'info',
    message: 'Please ensure all subsidiaries have confirmed before completing the closing process',
    field: 'subsidiaries',
  })

  messages.push({
    id: 'close-unposted-entries',
    type: 'info',
    message: 'Please ensure there are no unposted journal entries before closing the period',
    field: 'entries',
  })

  return messages
}
