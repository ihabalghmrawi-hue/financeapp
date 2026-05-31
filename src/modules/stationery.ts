import type { ModuleConfig } from './types'

export const stationery: ModuleConfig = {
  hasExpiry: false,
  hasBatch: false,
  hasVariants: false,
  hasBulkPricing: false,
  hasMinQty: false,
  hasWholesalePrice: false,
  fastPOS: true,
  barcodeFirst: true,
  showReturns: false,
  showShifts: true,
  showPurchases: true,
  showPOS: true,
  showInventory: true,
  hasRental: false,
  hasConstruction: false,
  medicineCategories: false,
  label: 'Stationery',
  labelAr: 'قرطاسية',
  descriptionAr: 'فئات بسيطة، بيع سريع، مدرسة ومكتب',
  icon: '📝',
}
