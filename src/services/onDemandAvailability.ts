import PaymentInstance from "./paymentInstance";

export const ON_DEMAND_NO_PROVIDERS_MESSAGE =
  "No service providers are currently available in your area. Please try again later or choose a different location.";

export type OnDemandAvailabilityResult = {
  available: boolean;
  count: number;
  message?: string;
  code?: string;
  radiusKm?: number;
};

export async function checkOnDemandProviderAvailability(params: {
  latitude: number;
  longitude: number;
  serviceType: string;
  startDate: string;
  startTime: string;
  durationMinutes?: number;
  /** When set, checks only this provider (e.g. Book Again with same SP). */
  providerId?: number | string | null;
}): Promise<OnDemandAvailabilityResult> {
  const { data } = await PaymentInstance.get("/api/v2/createEngagements/on-demand-availability", {
    params: {
      lat: params.latitude,
      lng: params.longitude,
      service_type: params.serviceType,
      start_date: params.startDate,
      start_time: params.startTime,
      ...(params.durationMinutes != null
        ? { duration_minutes: params.durationMinutes }
        : {}),
      ...(params.providerId != null && String(params.providerId).trim() !== ""
        ? { provider_id: params.providerId }
        : {}),
    },
  });

  return {
    available: Boolean(data?.available),
    count: Number(data?.count) || 0,
    message: data?.message || (!data?.available ? ON_DEMAND_NO_PROVIDERS_MESSAGE : undefined),
    code: data?.code,
    radiusKm: data?.radiusKm != null ? Number(data.radiusKm) : undefined,
  };
}
