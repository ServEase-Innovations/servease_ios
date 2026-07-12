import type { QuoteBreakdownRow } from "./quoteBreakdown";

export const PLATFORM_FEE_RATE = 0.06;
export const GST_ON_PLATFORM_FEE_RATE = 0.18;

export interface PaymentTotals {
  base_amount: number;
  platform_fee: number;
  gst: number;
  taxes_and_fees: number;
  total_amount: number;
}

export interface CheckoutWalletSplit {
  wallet_applied: number;
  razorpay_amount: number;
  remaining_wallet: number;
}

export function computePaymentTotals(baseAmount: number): PaymentTotals {
  const base = Math.round(Number(baseAmount) * 100) / 100;
  if (!Number.isFinite(base) || base <= 0) {
    return {
      base_amount: 0,
      platform_fee: 0,
      gst: 0,
      taxes_and_fees: 0,
      total_amount: 0,
    };
  }
  const platform_fee = Math.round(base * PLATFORM_FEE_RATE * 100) / 100;
  const gst = Math.round(platform_fee * GST_ON_PLATFORM_FEE_RATE * 100) / 100;
  const taxes_and_fees = Math.round((platform_fee + gst) * 100) / 100;
  const total_amount = Math.round((base + taxes_and_fees) * 100) / 100;
  return {
    base_amount: base,
    platform_fee,
    gst,
    taxes_and_fees,
    total_amount,
  };
}

export function computeCheckoutWithWallet(
  totals: PaymentTotals,
  walletBalance: number,
  useWallet: boolean
): CheckoutWalletSplit {
  const total = totals.total_amount;
  const balance = Math.max(0, Math.round(Number(walletBalance) * 100) / 100);

  if (!useWallet || total <= 0 || balance <= 0) {
    return {
      wallet_applied: 0,
      razorpay_amount: total,
      remaining_wallet: balance,
    };
  }

  const wallet_applied = Math.round(Math.min(balance, total) * 100) / 100;
  const razorpay_amount = Math.round((total - wallet_applied) * 100) / 100;

  return {
    wallet_applied,
    razorpay_amount,
    remaining_wallet: Math.round((balance - wallet_applied) * 100) / 100,
  };
}

export function formatTaxesFeesInfo(totals: PaymentTotals): string {
  return [
    `Platform fee: ₹${totals.platform_fee.toLocaleString("en-IN")}`,
    `GST (18% on platform fee): ₹${totals.gst.toLocaleString("en-IN")}`,
  ].join("\n");
}

export function appendPaymentFeeRows(
  serviceRows: QuoteBreakdownRow[],
  baseAmount: number
): QuoteBreakdownRow[] {
  const fees = computePaymentTotals(baseAmount);
  if (fees.base_amount <= 0) return serviceRows;

  const lines = serviceRows.filter((r) => r.kind !== "total");
  return [
    ...lines,
    {
      label: "Taxes & fees",
      amount: fees.taxes_and_fees,
      kind: "taxes_fees",
    },
    {
      label: "Amount payable",
      amount: fees.total_amount,
      kind: "total",
    },
  ];
}
