export type BusinessType =
  | 'pharmacy'
  | 'retail'
  | 'wholesale'
  | 'clothing'
  | 'stationery'
  | 'tools'
  | 'dress_rental'
  | 'construction'
  | 'atelier'
  | 'suits'
  | 'other'

export interface Features {
  businessType: BusinessType
  // Product fields
  hasExpiry: boolean
  hasBatch: boolean
  hasVariants: boolean
  // Pricing
  hasBulkPricing: boolean
  hasMinQty: boolean
  hasWholesalePrice: boolean
  // POS behavior
  fastPOS: boolean
  barcodeFirst: boolean
  // Modules
  showReturns: boolean
  showShifts: boolean
  showPurchases: boolean
  showPOS: boolean
  showInventory: boolean
  // Rental module
  hasRental: boolean
  // Construction module
  hasConstruction: boolean
  // Categories
  medicineCategories: boolean
  // Labels
  label: string
  icon: string
}

const FEATURE_MAP: Record<BusinessType, Omit<Features, 'businessType'>> = {
  pharmacy: {
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
    icon: '💊',
  },
  retail: {
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
    icon: '🛒',
  },
  wholesale: {
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
    icon: '📦',
  },
  clothing: {
    hasExpiry: false,
    hasBatch: false,
    hasVariants: true,
    hasBulkPricing: false,
    hasMinQty: false,
    hasWholesalePrice: false,
    fastPOS: false,
    barcodeFirst: false,
    showReturns: true,
    showShifts: true,
    showPurchases: true,
    showPOS: true,
    showInventory: true,
    hasRental: false,
    hasConstruction: false,
    medicineCategories: false,
    label: 'Clothing',
    icon: '👗',
  },
  stationery: {
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
    icon: '📝',
  },
  tools: {
    hasExpiry: false,
    hasBatch: false,
    hasVariants: false,
    hasBulkPricing: false,
    hasMinQty: false,
    hasWholesalePrice: false,
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
    label: 'Tools & Equipment',
    icon: '🔧',
  },
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
  atelier: {
    hasExpiry: false,
    hasBatch: false,
    hasVariants: true,
    hasBulkPricing: false,
    hasMinQty: false,
    hasWholesalePrice: false,
    fastPOS: false,
    barcodeFirst: false,
    showReturns: true,
    showShifts: true,
    showPurchases: true,
    showPOS: true,
    showInventory: true,
    hasRental: false,
    hasConstruction: false,
    medicineCategories: false,
    label: 'Dress Atelier & Boutique',
    icon: '👗',
  },
  suits: {
    hasExpiry: false,
    hasBatch: false,
    hasVariants: true,
    hasBulkPricing: false,
    hasMinQty: false,
    hasWholesalePrice: false,
    fastPOS: false,
    barcodeFirst: false,
    showReturns: true,
    showShifts: true,
    showPurchases: true,
    showPOS: true,
    showInventory: true,
    hasRental: false,
    hasConstruction: false,
    medicineCategories: false,
    label: "Men's Suits & Tailoring",
    icon: '🤵',
  },
  other: {
    hasExpiry: false,
    hasBatch: false,
    hasVariants: false,
    hasBulkPricing: false,
    hasMinQty: false,
    hasWholesalePrice: true,
    fastPOS: false,
    barcodeFirst: false,
    showReturns: true,
    showShifts: true,
    showPurchases: true,
    showPOS: true,
    showInventory: true,
    hasRental: false,
    hasConstruction: false,
    medicineCategories: false,
    label: 'Other',
    icon: '🏪',
  },
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
