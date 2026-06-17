import providerInstance from "./providerInstance";
import { formatDateOnly } from "../utils/maidPricingUtils";

const UNAVAILABLE_MESSAGE =
  "This service provider is not available for your selected dates and time. Please adjust your schedule or choose another provider.";

export type ProviderScheduleCheckParams = {
  providerId: number;
  latitude: number;
  longitude: number;
  role: string;
  startDate: string;
  endDate: string;
  preferredStartTime: string;
  serviceDurationMinutes: number;
  customerId?: number | null;
  excludeEngagementId?: number | string | null;
};

export async function checkSelectedProviderAvailability(
  params: ProviderScheduleCheckParams
): Promise<{ available: boolean; message?: string }> {
  const {
    providerId,
    latitude,
    longitude,
    role,
    startDate,
    endDate,
    preferredStartTime,
    serviceDurationMinutes,
    customerId,
    excludeEngagementId,
  } = params;

  if (!Number.isFinite(providerId) || providerId < 1) {
    return { available: true };
  }

  const payload: Record<string, unknown> = {
    lat: String(latitude),
    lng: String(longitude),
    radius: 50,
    role: role || "COOK",
    startDate: formatDateOnly(startDate),
    endDate: formatDateOnly(endDate),
    preferredStartTime,
    serviceDurationMinutes,
  };

  if (customerId != null && Number.isFinite(Number(customerId)) && Number(customerId) > 0) {
    payload.customerID = Number(customerId);
  }

  if (excludeEngagementId != null && String(excludeEngagementId).trim() !== "") {
    payload.excludeEngagementId = String(excludeEngagementId).trim();
  }

  const { data } = await providerInstance.post(
    `/api/service-providers/${providerId}/check-schedule`,
    payload
  );

  if (data?.success === false) {
    return {
      available: false,
      message: String(data?.message || UNAVAILABLE_MESSAGE),
    };
  }

  const available = data?.available === true || data?.fullyAvailable === true;
  if (available) {
    return { available: true };
  }

  return {
    available: false,
    message: String(data?.message || UNAVAILABLE_MESSAGE),
  };
}
