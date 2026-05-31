import type { SupabaseClient } from '@supabase/supabase-js'
import type { ServiceResult } from '@/types/service'
import type {
  CreateWalletInput,
  UpdateWalletInput,
  TransferInput,
  WalletResponse,
  WalletTransaction,
} from '@/validators/treasury'
import { CreateWalletSchema, UpdateWalletSchema, TransferSchema } from '@/validators/treasury'
import { WalletRepository } from '@/repositories/wallet.repository'
import { logAudit } from '@/lib/audit'

export class TreasuryService {
  private readonly repo: WalletRepository

  constructor(
    private readonly db: SupabaseClient,
    private readonly companyId: string,
  ) {
    this.repo = new WalletRepository(db, companyId)
  }

  async createWallet(input: CreateWalletInput): Promise<ServiceResult<WalletResponse>> {
    const parsed = CreateWalletSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.errors.map((e) => e.message).join('; '), code: 'VALIDATION_ERROR' }
    }
    try {
      const activeWallets = await this.repo.listActive()
      const isDefault = activeWallets.length === 0

      const wallet = await this.repo.create({
        ...parsed.data,
        current_balance: parsed.data.initial_balance,
        is_default: isDefault,
        is_active: true,
        bank_name: parsed.data.bank_name ?? null,
        account_number: parsed.data.account_number ?? null,
      })

      if (parsed.data.initial_balance > 0) {
        await this.repo.addTransaction({
          wallet_id: wallet.id,
          type: 'income',
          amount: parsed.data.initial_balance,
          description: 'رصيد افتتاحي',
          reference_type: 'opening',
        })
      }

      await logAudit({ action: 'wallet.created', entityType: 'wallet', entityId: wallet.id })
      return { ok: true, data: wallet }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'CREATE_FAILED' }
    }
  }

  async updateWallet(id: string, input: UpdateWalletInput): Promise<ServiceResult<WalletResponse>> {
    const parsed = UpdateWalletSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.errors.map((e) => e.message).join('; '), code: 'VALIDATION_ERROR' }
    }
    try {
      const existing = await this.repo.findById(id)
      if (!existing) {
        return { ok: false, error: 'المحفظة غير موجودة', code: 'NOT_FOUND' }
      }
      const wallet = await this.repo.update(id, parsed.data)
      return { ok: true, data: wallet }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'UPDATE_FAILED' }
    }
  }

  async listWallets(): Promise<ServiceResult<WalletResponse[]>> {
    try {
      const wallets = await this.repo.listActive()
      return { ok: true, data: wallets }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'FETCH_FAILED' }
    }
  }

  async getWallet(id: string): Promise<ServiceResult<WalletResponse>> {
    try {
      const wallet = await this.repo.findById(id)
      if (!wallet) {
        return { ok: false, error: 'المحفظة غير موجودة', code: 'NOT_FOUND' }
      }
      return { ok: true, data: wallet }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'FETCH_FAILED' }
    }
  }

  async getBalance(): Promise<ServiceResult<number>> {
    try {
      const balance = await this.repo.getBalance()
      return { ok: true, data: balance }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'FETCH_FAILED' }
    }
  }

  async transfer(input: TransferInput): Promise<ServiceResult<void>> {
    const parsed = TransferSchema.safeParse(input)
    if (!parsed.success) {
      return { ok: false, error: parsed.error.errors.map((e) => e.message).join('; '), code: 'VALIDATION_ERROR' }
    }
    try {
      const { from_wallet_id, to_wallet_id, amount, description } = parsed.data
      if (from_wallet_id === to_wallet_id) {
        return { ok: false, error: 'لا يمكن التحويل لنفس المحفظة', code: 'VALIDATION_ERROR' }
      }

      await this.repo.updateBalance(from_wallet_id, -amount)
      await this.repo.updateBalance(to_wallet_id, amount)

      await this.repo.addTransaction({
        wallet_id: from_wallet_id,
        type: 'transfer_out',
        amount: -amount,
        description: description ?? 'تحويل',
        reference_type: 'transfer',
      })
      await this.repo.addTransaction({
        wallet_id: to_wallet_id,
        type: 'transfer_in',
        amount,
        description: description ?? 'تحويل',
        reference_type: 'transfer',
      })

      await logAudit({ action: 'wallet.withdrawal', entityType: 'wallet', entityId: from_wallet_id })
      return { ok: true, data: undefined }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'TRANSFER_FAILED' }
    }
  }

  async getTransactions(limit = 50, offset = 0): Promise<ServiceResult<WalletTransaction[]>> {
    try {
      const txns = await this.repo.getTransactions(limit, offset)
      return { ok: true, data: txns }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'FETCH_FAILED' }
    }
  }

  async recordIncome(input: { wallet_id: string; amount: number; description: string }): Promise<ServiceResult<void>> {
    try {
      await this.repo.updateBalance(input.wallet_id, input.amount)
      await this.repo.addTransaction({
        wallet_id: input.wallet_id,
        type: 'income',
        amount: input.amount,
        description: input.description,
      })
      await logAudit({ action: 'wallet.deposit', entityType: 'wallet', entityId: input.wallet_id })
      return { ok: true, data: undefined }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'TRANSACTION_FAILED' }
    }
  }

  async recordExpense(input: { wallet_id: string; amount: number; description: string }): Promise<ServiceResult<void>> {
    try {
      await this.repo.updateBalance(input.wallet_id, -input.amount)
      await this.repo.addTransaction({
        wallet_id: input.wallet_id,
        type: 'expense',
        amount: -input.amount,
        description: input.description,
      })
      await logAudit({ action: 'wallet.withdrawal', entityType: 'wallet', entityId: input.wallet_id })
      return { ok: true, data: undefined }
    } catch (e: any) {
      return { ok: false, error: e.message, code: 'TRANSACTION_FAILED' }
    }
  }
}
