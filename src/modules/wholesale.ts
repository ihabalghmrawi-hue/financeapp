import type { ModuleConfig } from './types'

export const wholesale: ModuleConfig = {
  hasExpiry: false,
  hasBatch: false,
  hasVariants: false,
  hasBulkPricing: true,
  hasMinQty: true,
  hasWholesalePrice: true,
  fastPOS: false,
  barcodeFirst: true,
  showReturns: true,
  showShifts: false,
  showPurchases: true,
  showPOS: true,
  showInventory: true,
  hasRental: false,
  hasConstruction: false,
  medicineCategories: false,
  label: 'Wholesale',
  labelAr: 'جملة',
  descriptionAr: 'أسعار الجملة، الحد الأدنى للكميات، فواتير كبيرة',
  icon: '📦',
}
