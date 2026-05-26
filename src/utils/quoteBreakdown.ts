import type { PricingQuoteResponse } from "../services/pricingService";

export type QuoteBreakdownRowKind =
  | "charge"
  | "discount"
  | "savings"
  | "taxes_fees"
  | "total";

export interface QuoteBreakdownRow {
  label: string;
  amount: number;
  kind: QuoteBreakdownRowKind;
  detail?: string;
}

type QuoteSnapshot = PricingQuoteResponse["quote"] | null | undefined;

export function buildQuoteBreakdown(
  quote: QuoteSnapshot,
  totalOverride?: number
): QuoteBreakdownRow[] {
  if (!quote) return [];

  const rows: QuoteBreakdownRow[] = [];

  for (const item of quote.line_items ?? []) {
    const amount = Number(item.amount);
    if (!Number.isFinite(amount)) continue;
    const unitRate = Number(item.unit_rate);
    const qty = Number(item.quantity) || 1;
    let detail: string | undefined;
    if (qty > 1) detail = `${qty} × ₹${formatInrPlain(unitRate)}`;
    else if (Number.isFinite(unitRate) && unitRate !== amount) {
      detail = `₹${formatInrPlain(unitRate)}`;
    }
    rows.push({
      label: String(item.description || "Charge"),
      amount,
      kind: "charge",
      detail,
    });
  }

  const chargeSum = rows.reduce((s, r) => s + r.amount, 0);
  const quotedTotal =
    totalOverride != null && totalOverride > 0
      ? totalOverride
      : Number(quote.total) || chargeSum;

  const discountsAreSeparate = chargeSum > quotedTotal + 0.01;

  for (const d of quote.discounts ?? []) {
    const amount = Number(d.amount);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    if (discountsAreSeparate) {
      rows.push({
        label: String(d.label || "Discount"),
        amount: -amount,
        kind: "discount",
      });
    } else {
      rows.push({
        label: String(d.label || "You save"),
        amount,
        kind: "savings",
      });
    }
  }

  const total = quotedTotal;

  if (rows.length > 0 && total > 0) {
    rows.push({
      label: "Service total",
      amount: total,
      kind: "total",
    });
  }

  return rows;
}

function formatInrPlain(n: number): string {
  return Math.round(n).toLocaleString("en-IN");
}
