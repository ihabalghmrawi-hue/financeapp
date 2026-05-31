import type { ModuleConfig } from './types'

export const pharmacy: ModuleConfig = {
  hasExpiry: true,
  hasBatch: true,
  hasVariants: false,
  hasBulkPricing: false,
  hasMinQty: false,
  hasWholesalePrice: false,
  fastPOS: false,
  barcodeFirst: true,
  showReturns: true,
  showShifts: true,
  showPurchases: true,
  showPOS: true,
  showInventory: true,
  hasRental: false,
  hasConstruction: false,
  medicineCategories: true,
  label: 'Pharmacy',
  labelAr: 'صيدلية',
  descriptionAr: 'تتبع انتهاء الصلاحية، الدُفعات، تصنيفات الأدوية',
  icon: '💊',
}
