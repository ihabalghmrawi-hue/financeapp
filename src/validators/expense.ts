import { z } from 'zod'
import { DateSchema, MoneySchema, OptionalString, UUIDSchema } from './common'

export const CreateExpenseSchema = z.object({
  category_id: UUIDSchema.optional().nullable(),
  amount: MoneySchema,
  description: z.string().min(1, 'البيان مطلوب'),
  expense_date: DateSchema,
  payment_method: z.enum(['cash', 'card', 'bank_transfer', 'wallet', 'cheque']).default('cash'),
  wallet_id: UUIDSchema.optional().nullable(),
  reference: OptionalString(200),
  notes: OptionalString(1000),
})
export type CreateExpenseInput = z.infer<typeof CreateExpenseSchema>

export const UpdateExpenseSchema = CreateExpenseSchema.partial()
export type UpdateExpenseInput = z.infer<typeof UpdateExpenseSchema>

export const ExpenseResponseSchema = z.object({
  id: z.string(),
  company_id: z.string(),
  category_id: z.string().nullable(),
  amount: z.number(),
  description: z.string(),
  expense_date: z.string(),
  payment_method: z.string(),
  wallet_id: z.string().nullable(),
  reference: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
})
export type ExpenseResponse = z.infer<typeof ExpenseResponseSchema>

export const ExpenseCategorySchema = z.object({
  id: z.string(),
  company_id: z.string(),
  name: z.string(),
  name_ar: z.string().nullable(),
  icon: z.string().nullable(),
  color: z.string(),
})
export type ExpenseCategory = z.infer<typeof ExpenseCategorySchema>
