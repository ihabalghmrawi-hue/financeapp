import { z } from 'zod'
import { MoneySchema, OptionalString, UUIDSchema } from './common'

export const CreateWalletSchema = z.object({
  name: z.string().min(1, 'اسم المحفظة مطلوب').max(200),
  name_ar: OptionalString(200),
  type: z.enum(['cash', 'bank', 'wallet']).default('cash'),
  initial_balance: MoneySchema.default(0),
  bank_name: OptionalString(200),
  account_number: OptionalString(100),
})
export type CreateWalletInput = z.infer<typeof CreateWalletSchema>

export const UpdateWalletSchema = CreateWalletSchema.partial()
export type UpdateWalletInput = z.infer<typeof UpdateWalletSchema>

export const TransferSchema = z.object({
  from_wallet_id: UUIDSchema,
  to_wallet_id: UUIDSchema,
  amount: MoneySchema.refine((v) => v > 0, 'المبلغ يجب أن يكون أكبر من صفر'),
  description: OptionalString(500),
})
export type TransferInput = z.infer<typeof TransferSchema>

export const WalletResponseSchema = z.object({
  id: z.string(),
  company_id: z.string(),
  name: z.string(),
  name_ar: z.string().nullable(),
  type: z.string(),
  current_balance: z.number(),
  initial_balance: z.number(),
  is_default: z.boolean(),
  is_active: z.boolean(),
  bank_name: z.string().nullable(),
  account_number: z.string().nullable(),
  created_at: z.string(),
})
export type WalletResponse = z.infer<typeof WalletResponseSchema>

export const WalletTransactionSchema = z.object({
  id: z.string(),
  wallet_id: z.string(),
  type: z.enum(['income', 'expense', 'transfer_in', 'transfer_out']),
  amount: z.number(),
  description: z.string().nullable(),
  reference_type: z.string().nullable(),
  created_at: z.string(),
})
export type WalletTransaction = z.infer<typeof WalletTransactionSchema>
