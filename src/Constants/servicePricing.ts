/** Matches payments pricing_plan MAID_MONTHLY / COOK (via MAID plans) seed rates */
export const MAID_COOK_MONTHLY_HOURLY = {
  min: 3999,
  max: 5999,
  daysLabel: "30 days",
} as const;

export const MONTHLY_EXTRA_HOUR_DISCOUNT_PCT = 5;

export function formatMonthlyHourlyRateBand(): string {
  const fmt = (n: number) => n.toLocaleString("en-IN");
  const { min, max, daysLabel } = MAID_COOK_MONTHLY_HOURLY;
  return `₹${fmt(min)} – ₹${fmt(max)} per hour · ${daysLabel}`;
}

export function formatMonthlyExtraHourPromo(
  pct: number = MONTHLY_EXTRA_HOUR_DISCOUNT_PCT
): string {
  return `${pct}% off each additional hour (added to 1st-hour rate)`;
}

export function formatMonthlyTotalHint(hoursPerDay: number, midBase = 4999): string | null {
  if (hoursPerDay <= 1) return null;
  const pct = MONTHLY_EXTRA_HOUR_DISCOUNT_PCT;
  const extraRate = Math.round(midBase * (1 - pct / 100));
  const total = midBase + extraRate * (hoursPerDay - 1);
  const fmt = (n: number) => n.toLocaleString("en-IN");
  return `e.g. ${hoursPerDay}h ≈ ₹${fmt(total)} (₹${fmt(midBase)} + ${hoursPerDay - 1} × ₹${fmt(extraRate)})`;
}
