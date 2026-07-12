import reviewsInstance from "./reviewsInstance";

export interface ProviderRatingSummary {
  id: number;
  rating: number;
  review_count: number;
  grade: string;
  distribution: Record<"1" | "2" | "3" | "4" | "5", number>;
}

export interface ProviderReview {
  review_id: number;
  rating: number;
  review: string | null;
  service_type: string;
  created_at: number;
  engagement_id?: number | null;
  customerid?: number;
  customer_name?: string | null;
}

export interface ProviderReviewsResponse {
  success: boolean;
  provider: ProviderRatingSummary;
  reviews: ProviderReview[];
  count: number;
  pagination?: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

export interface ReviewEligibilityResponse {
  eligible: boolean;
  reason?: string;
  message?: string;
}

export interface CreateReviewPayload {
  engagementId: number;
  rating: number;
  review?: string;
  customerId?: number;
}

const REASON_MESSAGES: Record<string, string> = {
  MISSING_ENGAGEMENT_ID: "Booking information is missing.",
  ENGAGEMENT_NOT_FOUND: "This booking could not be found.",
  CUSTOMER_MISMATCH: "You can only review your own bookings.",
  PROVIDER_NOT_ASSIGNED: "No service provider is assigned yet.",
  ENGAGEMENT_NOT_COMPLETED: "You can review after the service is completed.",
  SERVICE_NOT_COMPLETED: "You can review after the visit is marked complete.",
  REVIEW_ALREADY_EXISTS: "You have already submitted a review for this booking.",
  MISSING_REQUIRED_FIELDS: "Please provide a rating.",
  INVALID_RATING: "Please select a rating between 1 and 5.",
  REVIEW_TOO_LONG: "Review text is too long.",
  SERVER_ERROR: "Something went wrong. Please try again.",
};

export function reviewReasonMessage(reason?: string, fallback?: string): string {
  if (!reason) return fallback || "Something went wrong. Please try again.";
  return REASON_MESSAGES[reason] || fallback || reason;
}

function normalizeProvider(provider: ProviderReviewsResponse["provider"]): ProviderRatingSummary {
  return {
    ...provider,
    rating:
      typeof provider.rating === "number"
        ? provider.rating
        : parseFloat(String(provider.rating)) || 0,
  };
}

export async function fetchProviderReviews(
  serviceProviderId: number,
  options?: { limit?: number; serviceType?: string }
): Promise<ProviderReviewsResponse> {
  const response = await reviewsInstance.get<ProviderReviewsResponse>(
    `/reviews/providers/${serviceProviderId}/reviews`,
    {
      params: {
        limit: options?.limit ?? 100,
        ...(options?.serviceType && options.serviceType !== "ALL"
          ? { serviceType: options.serviceType }
          : {}),
      },
    }
  );

  if (response.status !== 200 || !response.data?.success) {
    throw new Error(`Failed to load reviews: ${response.status}`);
  }

  return {
    ...response.data,
    provider: normalizeProvider(response.data.provider),
    reviews: response.data.reviews ?? [],
  };
}

export async function checkReviewEligibility(
  engagementId: number,
  customerId?: number
): Promise<ReviewEligibilityResponse> {
  const response = await reviewsInstance.get<ReviewEligibilityResponse>(
    "/reviews/eligibility",
    {
      params: {
        engagementId,
        ...(customerId != null ? { customerId } : {}),
      },
    }
  );

  const data = response.data;
  return {
    ...data,
    message: data.eligible ? undefined : reviewReasonMessage(data.reason),
  };
}

export async function createReview(payload: CreateReviewPayload) {
  const response = await reviewsInstance.post("/reviews", {
    engagementId: payload.engagementId,
    rating: payload.rating,
    customerId: payload.customerId,
    review: payload.review?.trim() || null,
  });

  return response.data;
}

export function getEngagementIdFromBooking(booking: {
  engagementId?: number;
  engagement_id?: number;
  id?: number;
}): number | null {
  const raw = booking.engagementId ?? booking.engagement_id ?? booking.id;
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}
