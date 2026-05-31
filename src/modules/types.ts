import type { BusinessType } from '@/types/erp'

export interface ModuleConfig {
  hasExpiry: boolean
  hasBatch: boolean
  hasVariants: boolean
  hasBulkPricing: boolean
  hasMinQty: boolean
  hasWholesalePrice: boolean
  fastPOS: boolean
  barcodeFirst: boolean
  showReturns: boolean
  showShifts: boolean
  showPurchases: boolean
  showPOS: boolean
  showInventory: boolean
  hasRental: boolean
  hasConstruction: boolean
  medicineCategories: boolean
  label: string
  labelAr?: string
  descriptionAr?: string
  icon: string
}

export type BusinessModuleConfig = ModuleConfig & { businessType: BusinessType }
