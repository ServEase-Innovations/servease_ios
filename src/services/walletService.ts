import PaymentInstance from './paymentInstance';

export interface WalletTransaction {
  transaction_id: number;
  transaction_type: string;
  amount: number;
  description?: string | null;
  reason?: string | null;
  engagement_id?: number | null;
  created_at: string;
  status?: string;
}

export interface CustomerWallet {
  balance: number;
  transactions: WalletTransaction[];
  rewards: number;
}

export function isCreditTransaction(type: string | null | undefined): boolean {
  return String(type ?? '').toUpperCase() === 'CREDIT';
}

export function formatWalletTransactionLabel(tx: WalletTransaction): string {
  if (tx.description?.trim()) return tx.description.trim();
  if (tx.reason?.trim()) return tx.reason.trim();
  if (tx.engagement_id != null) return `Booking #${tx.engagement_id}`;
  return isCreditTransaction(tx.transaction_type) ? 'Wallet credit' : 'Wallet debit';
}

function normalizeWalletPayload(data: unknown): CustomerWallet {
  const row =
    data && typeof data === 'object'
      ? (data as Record<string, unknown>)
      : {};
  const transactions = Array.isArray(row.transactions) ? row.transactions : [];

  return {
    balance: Number(row.balance ?? 0),
    rewards: Number(row.rewards ?? 0),
    transactions: transactions.map((item) => {
      const tx = item as Record<string, unknown>;
      return {
        transaction_id: Number(tx.transaction_id ?? 0),
        transaction_type: String(tx.transaction_type ?? ''),
        amount: Number(tx.amount ?? 0),
        description:
          typeof tx.description === 'string' ? tx.description : undefined,
        reason: typeof tx.reason === 'string' ? tx.reason : undefined,
        engagement_id:
          tx.engagement_id != null ? Number(tx.engagement_id) : null,
        created_at: String(tx.created_at ?? ''),
        status: typeof tx.status === 'string' ? tx.status : 'Completed',
      };
    }),
  };
}

export async function fetchCustomerWallet(
  customerId: string | number
): Promise<CustomerWallet> {
  const response = await PaymentInstance.get(`/api/wallets/${customerId}`);
  return normalizeWalletPayload(response.data);
}
