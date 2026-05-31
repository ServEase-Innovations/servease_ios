import axios from "axios";
import PaymentInstance from "./paymentInstance";

export interface LedgerEntry {
  ledger_id: string;
  engagement_id: string | null;
  amount: number;
  direction: "CREDIT" | "DEBIT";
  reason: "DAILY_EARNED" | "WITHDRAWAL" | "SERVICE_FEE" | "SECURITY_DEPOSIT" | "REFUND" | "OTHER";
  reference_type: string;
  reference_id: string | null;
  created_at: string;
}

export interface WithdrawalRequest {
  payout_id: string;
  engagement_id: string | null;
  requested_amount: number;
  gross_amount: number;
  provider_fee: number;
  tds_amount: number;
  net_amount: number;
  payout_mode: string | null;
  status: string;
  transaction_id: string | null;
  created_at: string;
  updated_at?: string | null;
}

export interface WithdrawalHistoryResponse {
  success: boolean;
  serviceproviderid: string;
  month: string | null;
  summary: {
    total_earned: number;
    total_withdrawn: number;
    available_to_withdraw: number;
    wallet_balance: number;
    security_deposit_paid: boolean;
    security_deposit_amount: number;
    withdrawal_request_count?: number;
  };
  ledger: LedgerEntry[];
  withdrawals: WithdrawalRequest[];
  payouts: WithdrawalRequest[];
}

function asRow(row: unknown): Record<string, unknown> {
  return row !== null && typeof row === "object" ? (row as Record<string, unknown>) : {};
}

function normalizeLedger(raw: unknown[]): LedgerEntry[] {
  return (raw ?? []).map((row): LedgerEntry => {
    const r = asRow(row);
    return {
    ledger_id: String(r.ledger_id ?? ""),
    engagement_id:
      r.engagement_id != null && r.engagement_id !== ""
        ? String(r.engagement_id)
        : null,
    amount: Number(r.amount ?? 0),
    direction: r.direction as LedgerEntry["direction"],
    reason: (r.reason as LedgerEntry["reason"]) || "OTHER",
    reference_type: String(r.reference_type ?? ""),
    reference_id:
      r.reference_id != null && r.reference_id !== ""
        ? String(r.reference_id)
        : null,
    created_at: String(r.created_at ?? ""),
  };
  });
}

function normalizeWithdrawals(raw: unknown[]): WithdrawalRequest[] {
  return (raw ?? []).map((row): WithdrawalRequest => {
    const r = asRow(row);
    return {
    payout_id: String(r.payout_id ?? ""),
    engagement_id:
      r.engagement_id != null && r.engagement_id !== ""
        ? String(r.engagement_id)
        : null,
    requested_amount: Number(r.requested_amount ?? r.gross_amount ?? 0),
    gross_amount: Number(r.gross_amount ?? 0),
    provider_fee: Number(r.provider_fee ?? 0),
    tds_amount: Number(r.tds_amount ?? 0),
    net_amount: Number(r.net_amount ?? 0),
    payout_mode: r.payout_mode != null ? String(r.payout_mode) : null,
    status: String(r.status ?? "PENDING"),
    transaction_id:
      r.transaction_id != null ? String(r.transaction_id) : null,
    created_at: String(r.created_at ?? ""),
    updated_at: r.updated_at != null ? String(r.updated_at) : null,
  };
  });
}

function withdrawalsFromLedger(ledger: LedgerEntry[]): WithdrawalRequest[] {
  return ledger
    .filter(
      (e) =>
        e.direction === "DEBIT" &&
        e.reason === "WITHDRAWAL" &&
        e.reference_type === "PAYOUT" &&
        e.reference_id
    )
    .map((e) => ({
      payout_id: e.reference_id!,
      engagement_id: e.engagement_id,
      requested_amount: e.amount,
      gross_amount: e.amount,
      provider_fee: 0,
      tds_amount: 0,
      net_amount: e.amount,
      payout_mode: null,
      status: "PENDING",
      transaction_id: null,
      created_at: e.created_at,
    }));
}

function normalizeHistoryPayload(
  data: Record<string, unknown>,
  month?: string
): WithdrawalHistoryResponse {
  const ledger = normalizeLedger((data.ledger as unknown[]) ?? []).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const withdrawalsRaw =
    (data.withdrawals as unknown[]) ??
    (data.payouts as unknown[]) ??
    [];
  let withdrawals = normalizeWithdrawals(withdrawalsRaw);
  if (withdrawals.length === 0) {
    withdrawals = withdrawalsFromLedger(ledger);
  }

  const summary = (data.summary as WithdrawalHistoryResponse["summary"]) ?? {
    total_earned: 0,
    total_withdrawn: 0,
    available_to_withdraw: 0,
    wallet_balance: 0,
    security_deposit_paid: false,
    security_deposit_amount: 0,
  };

  return {
    success: Boolean(data.success),
    serviceproviderid: String(data.serviceproviderid ?? ""),
    month: month ?? (data.month != null ? String(data.month) : null),
    summary: {
      ...summary,
      withdrawal_request_count: withdrawals.length,
    },
    ledger,
    withdrawals,
    payouts: withdrawals,
  };
}

async function fetchViaPayoutsFallback(
  serviceProviderId: number,
  month?: string
): Promise<WithdrawalHistoryResponse> {
  const response = await PaymentInstance.get(
    `/api/service-providers/${serviceProviderId}/payouts`,
    {
      params: {
        detailed: true,
        ...(month ? { month } : {}),
      },
    }
  );

  if (response.status !== 200 || !response.data?.success) {
    throw new Error(`Failed to fetch history: ${response.status}`);
  }

  return normalizeHistoryPayload(response.data, month);
}

export async function fetchWithdrawalHistory(
  serviceProviderId: number,
  month?: string
): Promise<WithdrawalHistoryResponse> {
  try {
    const response = await PaymentInstance.get(
      `/api/service-providers/${serviceProviderId}/withdrawal-history`,
      { params: month ? { month } : undefined }
    );

    if (response.status !== 200 || !response.data?.success) {
      throw new Error(`Failed to fetch history: ${response.status}`);
    }

    return normalizeHistoryPayload(response.data, month);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return fetchViaPayoutsFallback(serviceProviderId, month);
    }
    throw error;
  }
}
