import { EnhancedProviderDetails } from "../types/ProviderDetailsType";

export type RebookProviderBookingSource = {
  serviceProviderId: number;
  serviceProviderName: string;
  service_type: string;
  start_time?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  experience?: string;
  providerRating?: number;
};

function serviceTypeForOnDemandApi(serviceType: string): string {
  const normalized = String(serviceType || "").toLowerCase();
  if (normalized === "cook") return "COOK";
  if (normalized === "nanny") return "NANNY";
  return "MAID";
}

export function buildRebookProviderDetails(
  booking: RebookProviderBookingSource
): EnhancedProviderDetails {
  const name = String(booking.serviceProviderName || "").trim();
  const parts = name.split(/\s+/).filter(Boolean);
  const firstName = parts[0] || "Provider";
  const lastName = parts.slice(1).join(" ");
  const role = serviceTypeForOnDemandApi(booking.service_type);
  const lat = Number(booking.latitude);
  const lng = Number(booking.longitude);

  return {
    serviceproviderid: booking.serviceProviderId,
    serviceProviderId: booking.serviceProviderId,
    firstName,
    lastName,
    gender: "OTHER",
    experience: Number(booking.experience) || 0,
    rating: booking.providerRating || 0,
    dob: "",
    age: 0,
    otherServices: null,
    housekeepingRole: role,
    housekeepingRoles: [role],
    diet: "BOTH",
    cookingspeciality: "BOTH",
    languageknown: null,
    locality: "",
    location: booking.address || "",
    pincode: 0,
    latitude: Number.isFinite(lat) ? lat : 0,
    longitude: Number.isFinite(lng) ? lng : 0,
    distance_km: 0,
    bestMatch: false,
    monthlyAvailability: {
      preferredTime: booking.start_time || "09:00",
      fullyAvailable: true,
      summary: {
        totalDays: 0,
        daysAtPreferredTime: 0,
        daysWithDifferentTime: 0,
        unavailableDays: 0,
      },
      exceptions: [],
    },
    previouslyBooked: true,
    previousBookingDetails: null,
  };
}
