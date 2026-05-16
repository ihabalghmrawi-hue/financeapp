import type { ValidationMessage } from '@/lib/workbench/types'

export function validatePurchaseOrder(
  items: { quantity: number; unitPrice: number }[],
  supplierStatus: string,
  budgetRemaining: number,
  totalAmount: number,
): ValidationMessage[] {
  const messages: ValidationMessage[] = []

  if (!items || items.length === 0) {
    messages.push({
      id: 'po-no-items',
      type: 'error',
      message: 'At least one line item must be added to the purchase order',
      field: 'items',
    })
    return messages
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.quantity === 0) {
      messages.push({
        id: `po-zero-qty-${i}`,
        type: 'error',
        message: `Quantity in item ${i + 1} is zero, please enter a valid quantity`,
        field: `items[${i}].quantity`,
      })
    }
    if (item.quantity < 0) {
      messages.push({
        id: `po-negative-qty-${i}`,
        type: 'error',
        message: `Quantity in item ${i + 1} is negative (${item.quantity}), quantity must be positive`,
        field: `items[${i}].quantity`,
      })
    }
    if (item.unitPrice < 0) {
      messages.push({
        id: `po-negative-price-${i}`,
        type: 'error',
        message: `Unit price in item ${i + 1} is negative (${item.unitPrice}), price must be positive`,
        field: `items[${i}].unitPrice`,
      })
    }
  }

  if (totalAmount < 0) {
    messages.push({
      id: 'po-negative-total',
      type: 'error',
      message: 'Purchase order total amount cannot be negative',
      field: 'totalAmount',
    })
  }

  if (!supplierStatus || supplierStatus !== 'active') {
    messages.push({
      id: 'po-supplier-inactive',
      type: 'error',
      message: `Supplier is not active (status: ${supplierStatus || 'unknown'}), supplier must be active to create purchase order`,
      field: 'supplierStatus',
    })
  }

  if (budgetRemaining < 0) {
    messages.push({
      id: 'po-negative-budget',
      type: 'error',
      message: 'Remaining budget is negative, cannot create purchase order',
      field: 'budgetRemaining',
    })
  }

  if (totalAmount > budgetRemaining) {
    messages.push({
      id: 'po-insufficient-budget',
      type: 'error',
      message: `Total amount (${totalAmount.toFixed(2)}) exceeds remaining budget (${budgetRemaining.toFixed(2)}), insufficient to cover purchase order`,
      field: 'totalAmount',
    })
  }

  const approvalThreshold = 50000
  if (totalAmount > approvalThreshold) {
    messages.push({
      id: 'po-exceeds-threshold',
      type: 'warning',
      message: `Total amount (${totalAmount.toFixed(2)}) exceeds direct approval threshold (${approvalThreshold.toFixed(2)}), requires higher management approval`,
      field: 'totalAmount',
    })
  }

  return messages
}

export function validateSalesOrder(
  customerCreditLimit: number,
  currentBalance: number,
  orderAmount: number,
  itemsStock: { available: number; requested: number }[],
): ValidationMessage[] {
  const messages: ValidationMessage[] = []

  if (customerCreditLimit < 0) {
    messages.push({
      id: 'so-negative-credit-limit',
      type: 'error',
      message: 'Customer credit limit cannot be negative',
      field: 'customerCreditLimit',
    })
  }

  if (currentBalance < 0) {
    messages.push({
      id: 'so-negative-balance',
      type: 'error',
      message: 'Customer current balance cannot be negative',
      field: 'currentBalance',
    })
  }

  if (orderAmount <= 0) {
    messages.push({
      id: 'so-invalid-amount',
      type: 'error',
      message: 'Sales order amount must be greater than zero',
      field: 'orderAmount',
    })
  }

  if (customerCreditLimit > 0) {
    const newBalance = currentBalance + orderAmount
    if (newBalance > customerCreditLimit) {
      messages.push({
        id: 'so-credit-limit-exceeded',
        type: 'error',
        message: `New balance (${newBalance.toFixed(2)}) exceeds the allowed credit limit (${customerCreditLimit.toFixed(2)}) for the customer`,
        field: 'orderAmount',
      })
    }
  }

  const minOrderAmount = 100
  if (orderAmount < minOrderAmount) {
    messages.push({
      id: 'so-below-minimum',
      type: 'warning',
      message: `Sales order amount (${orderAmount.toFixed(2)}) is below the minimum allowed (${minOrderAmount.toFixed(2)})`,
      field: 'orderAmount',
    })
  }

  if (!itemsStock || itemsStock.length === 0) {
    messages.push({
      id: 'so-no-stock-items',
      type: 'error',
      message: 'No items in sales order to check availability',
      field: 'itemsStock',
    })
  } else {
    for (let i = 0; i < itemsStock.length; i++) {
      const si = itemsStock[i]
      if (si.requested <= 0) {
        messages.push({
          id: `so-invalid-requested-${i}`,
          type: 'error',
          message: `Requested quantity for item ${i + 1} is invalid (${si.requested})`,
          field: `itemsStock[${i}].requested`,
        })
      }
      if (si.available < 0) {
        messages.push({
          id: `so-negative-available-${i}`,
          type: 'error',
          message: `Available quantity for item ${i + 1} is negative (${si.available})`,
          field: `itemsStock[${i}].available`,
        })
      }
      if (si.requested > si.available) {
        messages.push({
          id: `so-insufficient-stock-${i}`,
          type: 'error',
          message: `Requested quantity for item ${i + 1} (${si.requested}) exceeds available quantity (${si.available})`,
          field: `itemsStock[${i}].requested`,
        })
      }
    }
  }

  return messages
}

export function validateInventoryAdjustment(
  currentStock: number,
  adjustmentQty: number,
  reason: string,
  requiresApproval: boolean,
): ValidationMessage[] {
  const messages: ValidationMessage[] = []

  if (currentStock < 0) {
    messages.push({
      id: 'inv-negative-stock',
      type: 'error',
      message: 'Current stock cannot be negative',
      field: 'currentStock',
    })
  }

  if (adjustmentQty === 0) {
    messages.push({
      id: 'inv-zero-adjustment',
      type: 'warning',
      message: 'Adjustment quantity is zero, this action has no effect on inventory',
      field: 'adjustmentQty',
    })
  }

  if (!reason || reason.trim().length === 0) {
    messages.push({
      id: 'inv-no-reason',
      type: 'error',
      message: 'Adjustment reason is required, please enter a clear reason for the inventory adjustment',
      field: 'reason',
    })
  }

  const newStock = currentStock + adjustmentQty
  const isWriteOff = reason && reason.toLowerCase().includes('write-off')

  if (newStock < 0 && !isWriteOff) {
    messages.push({
      id: 'inv-negative-new-stock',
      type: 'error',
      message: `New stock (${newStock}) is negative, adjustment will result in negative inventory balance`,
      field: 'adjustmentQty',
    })
  }

  if (newStock < 0 && isWriteOff) {
    messages.push({
      id: 'inv-writeoff-negative',
      type: 'warning',
      message: `Inventory balance after write-off is negative (${newStock}), please verify the write-off quantity`,
      field: 'adjustmentQty',
    })
  }

  if (currentStock > 0) {
    const adjustmentPct = (Math.abs(adjustmentQty) / currentStock) * 100
    if (adjustmentPct > 10 && requiresApproval) {
      messages.push({
        id: 'inv-large-adjustment',
        type: 'warning',
        message: `Adjustment percentage (${adjustmentPct.toFixed(2)}%) exceeds 10% of current stock, this adjustment requires management approval`,
        field: 'adjustmentQty',
      })
    }
  }

  return messages
}

export function validatePayrollRun(
  employees: { baseSalary: number; allowances: number; deductions: number }[],
  totalBudget: number,
  periodEndDate: number,
): ValidationMessage[] {
  const messages: ValidationMessage[] = []

  if (!employees || employees.length === 0) {
    messages.push({
      id: 'pr-no-employees',
      type: 'error',
      message: 'No employees in current payroll cycle',
      field: 'employees',
    })
    return messages
  }

  if (totalBudget < 0) {
    messages.push({
      id: 'pr-negative-budget',
      type: 'error',
      message: 'Total payroll budget cannot be negative',
      field: 'totalBudget',
    })
  }

  if (periodEndDate <= 0) {
    messages.push({
      id: 'pr-invalid-period',
      type: 'error',
      message: 'Invalid period end date',
      field: 'periodEndDate',
    })
  }

  let totalNetPay = 0

  for (let i = 0; i < employees.length; i++) {
    const emp = employees[i]

    if (emp.baseSalary < 0) {
      messages.push({
        id: `pr-negative-salary-${i}`,
        type: 'error',
        message: `Base salary for employee ${i + 1} is negative (${emp.baseSalary})`,
        field: `employees[${i}].baseSalary`,
      })
    }

    if (emp.allowances < 0) {
      messages.push({
        id: `pr-negative-allowances-${i}`,
        type: 'error',
        message: `Allowances for employee ${i + 1} are negative (${emp.allowances})`,
        field: `employees[${i}].allowances`,
      })
    }

    if (emp.deductions < 0) {
      messages.push({
        id: `pr-negative-deductions-${i}`,
        type: 'error',
        message: `Deductions for employee ${i + 1} are negative (${emp.deductions})`,
        field: `employees[${i}].deductions`,
      })
    }

    const netPay = emp.baseSalary + emp.allowances - emp.deductions
    if (netPay < 0) {
      messages.push({
        id: `pr-negative-netpay-${i}`,
        type: 'error',
        message: `Net pay for employee ${i + 1} is negative (${netPay.toFixed(2)}), deductions exceed base salary plus allowances`,
        field: `employees[${i}].deductions`,
      })
    }

    totalNetPay += netPay
  }

  if (totalNetPay > totalBudget) {
    messages.push({
      id: 'pr-exceeds-budget',
      type: 'error',
      message: `Total payroll (${totalNetPay.toFixed(2)}) exceeds allocated budget (${totalBudget.toFixed(2)})`,
      field: 'totalBudget',
    })
  }

  const seenIds = new Set<string>()
  for (let i = 0; i < employees.length; i++) {
    const empKey = `${employees[i].baseSalary}-${employees[i].allowances}-${employees[i].deductions}`
    if (seenIds.has(empKey)) {
      messages.push({
        id: `pr-duplicate-${i}`,
        type: 'error',
        message: `Duplicate employee found in payroll cycle at index ${i}`,
        field: `employees[${i}]`,
      })
    }
    seenIds.add(empKey)
  }

  const now = Date.now()
  if (periodEndDate > now) {
    messages.push({
      id: 'pr-future-period',
      type: 'warning',
      message: 'Period end date is in the future, please verify the period date is correct',
      field: 'periodEndDate',
    })
  }

  return messages
}

export function validateTransfer(
  sourceAvailable: number,
  transferQty: number,
  destinationCapacity: number,
): ValidationMessage[] {
  const messages: ValidationMessage[] = []

  if (sourceAvailable < 0) {
    messages.push({
      id: 'tr-source-negative',
      type: 'error',
      message: 'Source available inventory is negative, cannot perform transfer',
      field: 'sourceAvailable',
    })
  }

  if (destinationCapacity < 0) {
    messages.push({
      id: 'tr-capacity-negative',
      type: 'error',
      message: 'Destination warehouse capacity is negative, invalid data',
      field: 'destinationCapacity',
    })
  }

  if (transferQty <= 0) {
    messages.push({
      id: 'tr-invalid-qty',
      type: 'error',
      message: `Transfer quantity (${transferQty}) must be greater than zero`,
      field: 'transferQty',
    })
    return messages
  }

  if (transferQty > sourceAvailable) {
    messages.push({
      id: 'tr-insufficient-source',
      type: 'error',
      message: `Transfer quantity (${transferQty}) exceeds available inventory at source (${sourceAvailable})`,
      field: 'transferQty',
    })
  }

  if (transferQty > destinationCapacity) {
    messages.push({
      id: 'tr-insufficient-capacity',
      type: 'error',
      message: `Transfer quantity (${transferQty}) exceeds available capacity at destination (${destinationCapacity})`,
      field: 'transferQty',
    })
  }

  if (transferQty > 0 && transferQty <= sourceAvailable && transferQty <= destinationCapacity) {
    messages.push({
      id: 'tr-valid',
      type: 'success',
      message: 'Transfer is valid, quantity is available and capacity is sufficient',
      field: 'transferQty',
    })
  }

  return messages
}

export function validateApprovalAction(
  approverRole: string,
  requiredRole: string,
  amount: number,
  limit: number,
  requiresSecondApproval: boolean,
): ValidationMessage[] {
  const messages: ValidationMessage[] = []

  if (!approverRole || approverRole.trim().length === 0) {
    messages.push({
      id: 'app-no-approver-role',
      type: 'error',
      message: 'Approver role is not specified',
      field: 'approverRole',
    })
  }

  if (!requiredRole || requiredRole.trim().length === 0) {
    messages.push({
      id: 'app-no-required-role',
      type: 'error',
      message: 'Required approval role is not specified',
      field: 'requiredRole',
    })
  }

  if (amount < 0) {
    messages.push({
      id: 'app-negative-amount',
      type: 'error',
      message: 'Amount cannot be negative',
      field: 'amount',
    })
  }

  if (limit < 0) {
    messages.push({
      id: 'app-negative-limit',
      type: 'error',
      message: 'Approval limit cannot be negative',
      field: 'limit',
    })
  }

  if (approverRole && requiredRole) {
    const roleHierarchy: Record<string, number> = {
      accountant: 1,
      procurement_manager: 2,
      sales_manager: 2,
      inventory_manager: 2,
      hr_manager: 3,
      finance_manager: 4,
      super_admin: 5,
    }

    const approverLevel = roleHierarchy[approverRole] || 0
    const requiredLevel = roleHierarchy[requiredRole] || 0

    if (approverLevel < requiredLevel) {
      messages.push({
        id: 'app-insufficient-authority',
        type: 'error',
        message: `Approver with role "${approverRole}" does not have sufficient authority, required role "${requiredRole}"`,
        field: 'approverRole',
      })
    }
  }

  if (amount > limit) {
    messages.push({
      id: 'app-exceeds-limit',
      type: 'error',
      message: `Amount (${amount.toFixed(2)}) exceeds the allowed approval limit (${limit.toFixed(2)}) for current approver`,
      field: 'amount',
    })
  }

  const secondApprovalThreshold = 50000
  if (amount > secondApprovalThreshold && requiresSecondApproval) {
    messages.push({
      id: 'app-requires-second',
      type: 'warning',
      message: `Amount (${amount.toFixed(2)}) exceeds single approval threshold (${secondApprovalThreshold.toFixed(2)}), requires second approval`,
      field: 'requiresSecondApproval',
    })
  }

  messages.push({
    id: 'app-self-approval-check',
    type: 'info',
    message: 'Please ensure the approver is not the same as the requester to avoid self-approval',
    field: 'approverRole',
  })

  return messages
}
