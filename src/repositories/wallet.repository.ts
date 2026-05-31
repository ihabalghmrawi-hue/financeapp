import type { SupabaseClient } from '@supabase/supabase-js'
import { BaseRepository, RepositoryError } from './base.repository'
import type { WalletResponse, WalletTransaction } from '@/validators/treasury'

export class WalletRepository extends BaseRepository<WalletResponse> {
  protected readonly table = 'wallets'
  protected hasSoftDelete = false

  constructor(db: SupabaseClient, companyId: string) {
    super(db, companyId)
  }

  async listActive(): Promise<WalletResponse[]> {
    const { data, error } = await this.db
      .from(this.table)
      .select('*')
      .eq('company_id', this.companyId)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true })
    if (error) {
      throw new RepositoryError(error.message, error.code)
    }
    return (data ?? []) as WalletResponse[]
  }

  async getDefault(): Promise<WalletResponse | null> {
    const { data, error } = await this.db
      .from(this.table)
      .select('*')
      .eq('company_id', this.companyId)
      .eq('is_default', true)
      .eq('is_active', true)
      .maybeSingle()
    if (error?.code === 'PGRST116') {
      return null
    }
    if (error) {
      throw new RepositoryError(error.message, error.code)
    }
    return data as unknown as WalletResponse | null
  }

  async getBalance(): Promise<number> {
    const wallets = await this.listActive()
    return wallets.reduce((s, w) => s + w.current_balance, 0)
  }

  async updateBalance(walletId: string, delta: number): Promise<void> {
    const wallet = await this.findById(walletId)
    if (!wallet) {
      throw new RepositoryError('المحفظة غير موجودة', 'NOT_FOUND')
    }

    const newBalance = wallet.current_balance + delta
    if (newBalance < 0) {
      throw new RepositoryError('الرصيد غير كافٍ', 'INSUFFICIENT_BALANCE')
    }

    const { error } = await this.db
      .from(this.table)
      .update({ current_balance: newBalance })
      .eq('id', walletId)
      .eq('company_id', this.companyId)
    if (error) {
      throw new RepositoryError(error.message, error.code)
    }
  }

  async getTransactions(limit = 50, offset = 0): Promise<WalletTransaction[]> {
    const { data, error } = await this.db
      .from('transactions')
      .select('id, wallet_id, type, amount, description, reference_type, created_at')
      .eq('company_id', this.companyId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
    if (error) {
      throw new RepositoryError(error.message, error.code)
    }
    return (data ?? []) as WalletTransaction[]
  }

  async addTransaction(input: {
    wallet_id: string
    type: 'income' | 'expense' | 'transfer_in' | 'transfer_out'
    amount: number
    description: string
    reference_type?: string
    reference_id?: string
  }): Promise<void> {
    const { error } = await this.db.from('transactions').insert({
      company_id: this.companyId,
      wallet_id: input.wallet_id,
      type: input.type,
      amount: input.amount,
      description: input.description,
      reference_type: input.reference_type ?? null,
      reference_id: input.reference_id ?? null,
      transaction_date: new Date().toISOString().slice(0, 10),
      status: 'completed',
    })
    if (error) {
      throw new RepositoryError(error.message, error.code)
    }
  }
}
