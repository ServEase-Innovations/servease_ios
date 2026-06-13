import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  getBookingTypeFromPreference,
  formatDateOnly,
  normalizeBookingTypeFields,
} from "../utils/maidPricingUtils";
import {
  computeDurationHours,
  isBookingScheduleComplete,
} from "../ServiceDialogs/serviceBookingConfig";
import {
  checkSelectedProviderAvailability,
} from "../services/providerScheduleAvailability";

export type SelectedProviderAvailabilityState = {
  loading: boolean;
  available: boolean;
  message?: string;
};

export type UseBookingScheduleFlowOptions = {
  active?: boolean;
  providerId?: number | string | null;
  role?: string;
  latitude?: number | null;
  longitude?: number | null;
  customerId?: number | null;
};

function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useBookingScheduleFlow(options: UseBookingScheduleFlowOptions = {}) {
  const {
    active = true,
    providerId,
    role = "COOK",
    latitude,
    longitude,
    customerId,
  } = options;

  const rawSchedule = useSelector(
    (state: {
      bookingType?: {
        value?: Record<string, unknown> | null;
        scheduleRevision?: number;
      };
    }) => state.bookingType?.value ?? null
  );

  const scheduleRevision = useSelector(
    (state: { bookingType?: { scheduleRevision?: number } }) =>
      state.bookingType?.scheduleRevision ?? 0
  );
  const scheduleDirty = useSelector(
    (state: { bookingType?: { scheduleDirty?: boolean } }) =>
      Boolean(state.bookingType?.scheduleDirty)
  );

  const committedSchedule = useMemo(
    () => normalizeBookingTypeFields(rawSchedule),
    [rawSchedule]
  );

  const bookingTypeCode = getBookingTypeFromPreference(
    String(committedSchedule?.bookingPreference ?? "Date")
  );

  const scheduleReady = useMemo(
    () =>
      isBookingScheduleComplete(
        (committedSchedule ?? {}) as Record<string, unknown>,
        bookingTypeCode
      ),
    [committedSchedule, bookingTypeCode]
  );

  const [selectedProviderAvailability, setSelectedProviderAvailability] =
    useState<SelectedProviderAvailabilityState>({
      loading: false,
      available: true,
    });

  const resolvedProviderId = useMemo(() => {
    const n = Number(providerId);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [providerId]);

  const coordsReady =
    latitude != null &&
    longitude != null &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  useEffect(() => {
    if (
      !active ||
      !resolvedProviderId ||
      bookingTypeCode === "ON_DEMAND" ||
      !scheduleReady ||
      !coordsReady ||
      scheduleDirty
    ) {
      setSelectedProviderAvailability({ loading: false, available: true });
      return;
    }

    const startDate =
      formatDateOnly(String(committedSchedule?.startDate ?? "")) || todayYmd();
    const endDate =
      formatDateOnly(String(committedSchedule?.endDate ?? "")) || startDate;
    const startTime = String(committedSchedule?.startTime ?? "").trim();
    const endTime = String(committedSchedule?.endTime ?? "").trim();
    const durationHours = computeDurationHours(
      bookingTypeCode,
      startTime,
      endTime,
      startDate,
      endDate,
      String(committedSchedule?.timeRange ?? ""),
      String(committedSchedule?.timeSlot ?? "")
    );
    const durationMinutes =
      durationHours != null && durationHours > 0
        ? Math.round(durationHours * 60)
        : 60;

    let cancelled = false;
    setSelectedProviderAvailability((prev) => ({ ...prev, loading: true }));

    checkSelectedProviderAvailability({
      providerId: resolvedProviderId,
      latitude: latitude!,
      longitude: longitude!,
      role: String(committedSchedule?.housekeepingRole || role),
      startDate,
      endDate,
      preferredStartTime: startTime,
      serviceDurationMinutes: durationMinutes,
      customerId,
    })
      .then((result) => {
        if (cancelled) return;
        setSelectedProviderAvailability({
          loading: false,
          available: result.available,
          message: result.message,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setSelectedProviderAvailability({
          loading: false,
          available: false,
          message:
            "Could not verify provider availability for this schedule. Please try again or choose another provider.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [
    active,
    resolvedProviderId,
    bookingTypeCode,
    scheduleReady,
    coordsReady,
    latitude,
    longitude,
    customerId,
    role,
    scheduleRevision,
    scheduleDirty,
    committedSchedule?.startDate,
    committedSchedule?.endDate,
    committedSchedule?.startTime,
    committedSchedule?.endTime,
    committedSchedule?.timeRange,
    committedSchedule?.timeSlot,
    committedSchedule?.housekeepingRole,
  ]);

  const selectedProviderReady =
    !resolvedProviderId ||
    bookingTypeCode === "ON_DEMAND" ||
    (selectedProviderAvailability.available && !selectedProviderAvailability.loading);

  return {
    committedSchedule,
    scheduleRevision,
    bookingTypeCode,
    scheduleReady,
    selectedProviderAvailability,
    selectedProviderReady,
  };
}
