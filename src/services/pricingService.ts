import PaymentInstance from "./paymentInstance";

export type RatePreference = "min" | "max" | "mid";

export interface ServiceQuoteRequest {
  serviceType?: string;
  bookingType: string;
  customerId?: number;
  startDate: string;
  endDate?: string;
  durationHours?: number;
  hoursPerDay?: number;
  ratePreference?: RatePreference;
}

export function parseQuoteTotal(res: Partial<PricingQuoteResponse> | null | undefined): number {
  if (!res) return 0;
  const top = Number(res.total);
  if (Number.isFinite(top) && top > 0) return top;
  const nested = Number(res.quote?.total);
  if (Number.isFinite(nested) && nested > 0) return nested;
  const sub = Number((res.quote as { subtotal?: number } | undefined)?.subtotal);
  if (Number.isFinite(sub) && sub > 0) return sub;
  return 0;
}

export interface PricingQuoteResponse {
  success: boolean;
  total: number;
  plan_code: string;
  quote_id?: number;
  quote: {
    total: number;
    line_items: Array<{
      description: string;
      quantity: number;
      unit: string;
      unit_rate: number;
      amount: number;
    }>;
    discounts: Array<{ label: string; amount: number }>;
    applied_rules: Array<{ label: string; rule_type: string }>;
    display?: { base_range?: { min: number; max: number; unit: string } };
  };
  error?: string;
}

export async function fetchServiceQuote(
  body: ServiceQuoteRequest
): Promise<PricingQuoteResponse> {
  const serviceType = (body.serviceType || "MAID").toUpperCase();
  const startDate = String(body.startDate || "").slice(0, 10);
  const endDate = String(body.endDate ?? body.startDate ?? "").slice(0, 10);

  const { data } = await PaymentInstance.post<PricingQuoteResponse>(
    "/api/pricing/quote",
    {
      serviceType,
      bookingType: String(body.bookingType || "").toUpperCase(),
      customerId: body.customerId,
      startDate,
      endDate: endDate || startDate,
      durationHours: body.durationHours,
      hoursPerDay: body.hoursPerDay,
      ratePreference: body.ratePreference || "mid",
    }
  );
  return { ...data, total: parseQuoteTotal(data) };
}

export async function fetchServiceRateCard(serviceType: string, bookingType: string) {
  const st = encodeURIComponent(serviceType.toUpperCase());
  const bt = encodeURIComponent(bookingType.toUpperCase());
  const { data } = await PaymentInstance.get(`/api/pricing/plans/${st}/${bt}`);
  return data;
}

export async function fetchMaidQuote(
  body: Omit<ServiceQuoteRequest, "serviceType"> & { serviceType?: string }
): Promise<PricingQuoteResponse> {
  return fetchServiceQuote({ ...body, serviceType: body.serviceType || "MAID" });
}

export async function fetchCookQuote(
  body: Omit<ServiceQuoteRequest, "serviceType"> & { serviceType?: string }
): Promise<PricingQuoteResponse> {
  const res = await fetchServiceQuote({ ...body, serviceType: "COOK" });
  if (res.success !== false && (res.total ?? 0) > 0) return res;
  return fetchServiceQuote({ ...body, serviceType: "MAID" });
}

export async function fetchMaidRateCard(bookingType: string) {
  return fetchServiceRateCard("MAID", bookingType);
}

export async function fetchCookRateCard(bookingType: string) {
  try {
    const cook = await fetchServiceRateCard("COOK", bookingType);
    if (cook?.plan) return cook;
  } catch {
    /* use maid rate band */
  }
  return fetchServiceRateCard("MAID", bookingType);
}
