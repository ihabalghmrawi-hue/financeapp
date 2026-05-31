import type { ModuleConfig } from './types'

export const retail: ModuleConfig = {
  hasExpiry: false,
  hasBatch: false,
  hasVariants: false,
  hasBulkPricing: false,
  hasMinQty: false,
  hasWholesalePrice: false,
  fastPOS: true,
  barcodeFirst: true,
  showReturns: true,
  showShifts: true,
  showPurchases: true,
  showPOS: true,
  showInventory: true,
  hasRental: false,
  hasConstruction: false,
  medicineCategories: false,
  label: 'Grocery / Supermarket',
  labelAr: 'بقالة / سوبر ماركت',
  descriptionAr: 'نقطة بيع سريعة، باركود، منتجات يومية',
  icon: '🛒',
}
