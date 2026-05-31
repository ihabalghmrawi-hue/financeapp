import type { BusinessType } from '@/types/erp'
import { MODULE_CONFIGS } from '@/modules'
import type { ModuleConfig } from '@/modules'

export interface Features extends ModuleConfig {
  businessType: BusinessType
}

const FEATURE_MAP: Record<BusinessType, Omit<Features, 'businessType'>> = {
  pharmacy: { ...MODULE_CONFIGS.pharmacy },
  retail: { ...MODULE_CONFIGS.retail },
  wholesale: { ...MODULE_CONFIGS.wholesale },
  clothing: { ...MODULE_CONFIGS.clothing },
  stationery: { ...MODULE_CONFIGS.stationery },
  tools: { ...MODULE_CONFIGS.tools },
  dress_rental: {
    hasExpiry: false,
    hasBatch: false,
    hasVariants: false,
    hasBulkPricing: false,
    hasMinQty: false,
    hasWholesalePrice: false,
    fastPOS: false,
    barcodeFirst: false,
    showReturns: false,
    showShifts: false,
    showPurchases: false,
    showPOS: false,
    showInventory: false,
    hasRental: true,
    hasConstruction: false,
    medicineCategories: false,
    label: 'Dress Rental',
    icon: '👰',
  },
  construction: {
    hasExpiry: false,
    hasBatch: false,
    hasVariants: false,
    hasBulkPricing: false,
    hasMinQty: false,
    hasWholesalePrice: false,
    fastPOS: false,
    barcodeFirst: false,
    showReturns: false,
    showShifts: false,
    showPurchases: false,
    showPOS: false,
    showInventory: false,
    hasRental: false,
    hasConstruction: true,
    medicineCategories: false,
    label: 'Construction & Finishing',
    icon: '🏗️',
  },
  atelier: { ...MODULE_CONFIGS.atelier },
  suits: { ...MODULE_CONFIGS.suits },
  other: { ...MODULE_CONFIGS.other },
}

export const BUSINESS_TYPES: BusinessType[] = [
  'pharmacy',
  'retail',
  'wholesale',
  'clothing',
  'stationery',
  'tools',
  'dress_rental',
  'construction',
  'atelier',
  'suits',
  'other',
]

export function getFeatures(businessType?: string | null): Features {
  const type = (businessType as BusinessType) || 'retail'
  return { businessType: type, ...(FEATURE_MAP[type] ?? FEATURE_MAP.retail) }
}

export const BUSINESS_TYPE_COOKIE = 'erp_business_type'
