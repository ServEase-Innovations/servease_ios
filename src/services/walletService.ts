import PaymentInstance from './paymentInstance';
import {
  BookingService,
  isPaymentCancelledError,
  PaymentCancelledError,
} from './bookingService';

export const WALLET_TOPUP_MIN_INR = 100;
export const WALLET_TOPUP_MAX_INR = 50000;

export interface WalletTopUpOrder {
  topup_id: number;
  razorpay_order_id: string;
  razorpay_key_id?: string;
  amount: number;
  amount_inr: number;
  currency: string;
}

export interface WalletTopUpVerifyResult {
  success: boolean;
  balance: number;
  topup_id: number;
  amount_inr?: number;
  alreadyProcessed?: boolean;
  message?: string;
}

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

export function formatWalletTransactionDisplayLabel(tx: WalletTransaction): string {
  const raw = formatWalletTransactionLabel(tx);
  const bookingMatch = raw.match(/booking\s*#?\s*(\d+)/i);
  if (bookingMatch) return `Booking #${bookingMatch[1]}`;
  if (/wallet\s*top[- ]?up/i.test(raw)) return 'Wallet top-up';
  return raw;
}

export function formatWalletMoney(
  value: number,
  options?: { compact?: boolean }
): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '₹0';
  if (options?.compact) {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}k`;
  }
  return `₹${n.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export type WalletTxCategory = 'topup' | 'refund' | 'booking' | 'other';

export function getWalletTransactionCategory(tx: WalletTransaction): WalletTxCategory {
  const blob = `${tx.description ?? ''} ${tx.reason ?? ''}`.toLowerCase();
  if (blob.includes('top-up') || blob.includes('topup') || blob.includes('top up')) {
    return 'topup';
  }
  if (blob.includes('refund') || blob.includes('vacation')) {
    return 'refund';
  }
  if (
    tx.engagement_id != null ||
    blob.includes('booking') ||
    blob.includes('payment for')
  ) {
    return 'booking';
  }
  return 'other';
}

export interface WalletTransactionGroup {
  key: string;
  labelKey: 'today' | 'yesterday' | 'earlier';
  dateLabel?: string;
  items: WalletTransaction[];
}

export function groupWalletTransactions(
  transactions: WalletTransaction[],
  now = new Date()
): WalletTransactionGroup[] {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const buckets = new Map<string, WalletTransactionGroup>();

  for (const tx of transactions) {
    const created = tx.created_at ? new Date(tx.created_at) : null;
    const day = created ? new Date(created) : new Date(0);
    day.setHours(0, 0, 0, 0);

    let key: string;
    let labelKey: WalletTransactionGroup['labelKey'];
    let dateLabel: string | undefined;

    if (created && day.getTime() === today.getTime()) {
      key = 'today';
      labelKey = 'today';
    } else if (created && day.getTime() === yesterday.getTime()) {
      key = 'yesterday';
      labelKey = 'yesterday';
    } else {
      key = `date:${day.toISOString().slice(0, 10)}`;
      labelKey = 'earlier';
      dateLabel = created
        ? created.toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : '';
    }

    if (!buckets.has(key)) {
      buckets.set(key, { key, labelKey, dateLabel, items: [] });
    }
    buckets.get(key)!.items.push(tx);
  }

  return Array.from(buckets.values());
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

export async function createWalletTopUpOrder(
  customerId: string | number,
  amountInr: number
): Promise<WalletTopUpOrder> {
  const response = await PaymentInstance.post(
    `/api/wallets/${customerId}/topup`,
    { amount: amountInr }
  );
  const data = response.data as Record<string, unknown>;
  return {
    topup_id: Number(data.topup_id),
    razorpay_order_id: String(data.razorpay_order_id),
    razorpay_key_id:
      typeof data.razorpay_key_id === 'string' ? data.razorpay_key_id : undefined,
    amount: Number(data.amount),
    amount_inr: Number(data.amount_inr),
    currency: String(data.currency ?? 'INR'),
  };
}

export async function verifyWalletTopUp(
  customerId: string | number,
  payload: {
    topup_id: number;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }
): Promise<WalletTopUpVerifyResult> {
  const response = await PaymentInstance.post(
    `/api/wallets/${customerId}/topup/verify`,
    payload
  );
  const data = response.data as Record<string, unknown>;
  return {
    success: Boolean(data.success),
    balance: Number(data.balance ?? 0),
    topup_id: Number(data.topup_id ?? payload.topup_id),
    amount_inr: data.amount_inr != null ? Number(data.amount_inr) : undefined,
    alreadyProcessed: data.alreadyProcessed === true,
    message: typeof data.message === 'string' ? data.message : undefined,
  };
}

export async function topUpCustomerWallet(
  customerId: string | number,
  amountInr: number,
  prefill?: { name?: string; email?: string; contact?: string }
): Promise<WalletTopUpVerifyResult> {
  const order = await createWalletTopUpOrder(customerId, amountInr);

  let paymentResponse;
  try {
    paymentResponse = await BookingService.openRazorpay(
      order.razorpay_order_id,
      order.amount,
      order.currency,
      prefill,
      order.razorpay_key_id,
      'Wallet top-up'
    );
  } catch (err) {
    if (isPaymentCancelledError(err)) {
      throw new PaymentCancelledError();
    }
    throw err;
  }

  return verifyWalletTopUp(customerId, {
    topup_id: order.topup_id,
    razorpay_order_id: paymentResponse.razorpay_order_id,
    razorpay_payment_id: paymentResponse.razorpay_payment_id,
    razorpay_signature: paymentResponse.razorpay_signature,
  });
}

export { isPaymentCancelledError, PaymentCancelledError };
