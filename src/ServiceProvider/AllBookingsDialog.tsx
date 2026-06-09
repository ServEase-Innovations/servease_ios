/* eslint-disable */
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Alert,
  Linking,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import { getBookingTypeBadge, getServiceTitle, getStatusBadge } from "../common/BookingUtils";
import PaymentInstance from "../services/paymentInstance";
import dayjs, { Dayjs } from "dayjs";
import { Booking, BookingHistoryResponse } from "./Dashboard";
import axios from "axios";
import { OtpVerificationDialog } from "./OtpVerificationDialog";
import TrackAddress from "./TrackAddress";
import { BRAND } from "../theme/brandColors";

const GOOGLE_MAPS_API_KEY = "AIzaSyBWoIIAX-gE7fvfAkiquz70WFgDaL7YXSk";

type TabKey = "ongoing" | "future" | "past";

interface AllBookingsDialogProps {
  bookings: BookingHistoryResponse | null;
  serviceProviderId: number | null;
  trigger?: React.ReactNode;
  visible: boolean;
  onClose: () => void;
  onContactClient: (booking: Booking) => void;
}

const TAB_CONFIG: { key: TabKey; label: string; icon: string }[] = [
  { key: "ongoing", label: "Current", icon: "play-circle-outline" },
  { key: "future", label: "Upcoming", icon: "event" },
  { key: "past", label: "Past", icon: "history" },
];

const formatTimeToAMPM = (timeString: string): string => {
  if (!timeString) return "";
  try {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const minute = parseInt(minutes, 10);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    const displayMinute = minute.toString().padStart(2, "0");
    return `${displayHour}:${displayMinute} ${period}`;
  } catch {
    return timeString;
  }
};

const formatDisplayDate = (value: string | number | null | undefined): string | null => {
  if (value == null || value === "") return null;
  const parsed = dayjs(value);
  if (!parsed.isValid()) return null;
  return parsed.format("DD MMM YYYY");
};

const serviceStartSortKey = (row: Record<string, unknown>): number => {
  const startEpoch = Number(row.start_epoch);
  if (Number.isFinite(startEpoch) && startEpoch > 0) return startEpoch;
  const raw = (row.start_date ?? row.startDate) as string | undefined;
  if (raw) return dayjs(raw).startOf("day").unix();
  return 0;
};

const serviceEndSortKey = (row: Record<string, unknown>): number => {
  const endEpoch = Number(row.end_epoch);
  if (Number.isFinite(endEpoch) && endEpoch > 0) return endEpoch;
  const raw = (row.end_date ?? row.endDate ?? row.start_date ?? row.startDate) as string | undefined;
  if (raw) return dayjs(raw).endOf("day").unix();
  return serviceStartSortKey(row);
};

const sortProviderEngagements = <T extends Record<string, unknown>>(rows: T[], tab: TabKey): T[] => {
  const ascending = tab === "ongoing" || tab === "future";
  const useEnd = tab === "past";
  return [...rows].sort((a, b) => {
    const aKey = useEnd ? serviceEndSortKey(a) : serviceStartSortKey(a);
    const bKey = useEnd ? serviceEndSortKey(b) : serviceStartSortKey(b);
    const diff = ascending ? aKey - bKey : bKey - aKey;
    if (diff !== 0) return diff;
    return String(a.engagement_id ?? a.id ?? "").localeCompare(
      String(b.engagement_id ?? b.id ?? ""),
      undefined,
      { numeric: true }
    );
  });
};

const formatBookingDateRange = (booking: Booking): string => {
  let startRaw = booking.start_date;
  let endRaw = booking.endDate;
  const api = booking.bookingData;

  if (!startRaw && api?.start_epoch) {
    startRaw = dayjs.unix(Number(api.start_epoch)).format("YYYY-MM-DD");
  }
  if (!endRaw && api?.end_epoch) {
    endRaw = dayjs.unix(Number(api.end_epoch)).format("YYYY-MM-DD");
  }

  const startLabel = formatDisplayDate(startRaw);
  const endLabel = formatDisplayDate(endRaw);

  if (startLabel && endLabel) {
    if (dayjs(startRaw).isSame(dayjs(endRaw), "day")) {
      return startLabel;
    }
    return `${startLabel} – ${endLabel}`;
  }

  if (startLabel) return startLabel;
  if (endLabel) return endLabel;
  return booking.date || "Date TBD";
};

const handleCallCustomer = (phoneNumber: string, clientName: string) => {
  if (!phoneNumber || phoneNumber === "Contact info not available") {
    Alert.alert("No Contact Info", "Contact information is not available for this customer.");
    return;
  }
  Linking.openURL(`tel:${phoneNumber}`).catch(() => {
    Alert.alert("Error", "Unable to make the call. Please try again.");
  });
};

export function AllBookingsDialog({
  serviceProviderId,
  visible,
  onClose,
}: AllBookingsDialogProps) {
  const [tab, setTab] = useState<TabKey>("ongoing");
  const [selectedMonth, setSelectedMonth] = useState<Dayjs>(dayjs().startOf("month"));
  const [monthResponse, setMonthResponse] = useState<BookingHistoryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [taskStatus, setTaskStatus] = useState<Record<string, "IN_PROGRESS" | "COMPLETED" | undefined>>({});
  const [taskStatusUpdating, setTaskStatusUpdating] = useState<Record<string, boolean>>({});
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<any>(null);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [trackAddressDialogOpen, setTrackAddressDialogOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  const mapApiBookingToBooking = useCallback((apiBooking: any): Booking => {
    let date: string;
    let timeRange: string;
    let startDateValue = apiBooking.start_date || apiBooking.startDate || "";
    let endDateValue = apiBooking.end_date || apiBooking.endDate || "";

    if (apiBooking.start_epoch && apiBooking.end_epoch) {
      const startDate = new Date(apiBooking.start_epoch * 1000);
      const endDate = new Date(apiBooking.end_epoch * 1000);
      startDateValue = startDate.toISOString();
      endDateValue = endDate.toISOString();
      date = startDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      timeRange = `${startDate.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })} – ${endDate.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })}`;
    } else {
      const startDateRaw = apiBooking.startDate || apiBooking.start_date;
      const startTimeStr = apiBooking.startTime || "00:00";
      const endTimeStr = apiBooking.endTime || "00:00";
      const startDate = new Date(startDateRaw);
      timeRange = `${formatTimeToAMPM(startTimeStr)} – ${formatTimeToAMPM(endTimeStr)}`;
      date = startDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }

    if (!endDateValue && apiBooking.end_epoch) {
      endDateValue = dayjs.unix(Number(apiBooking.end_epoch)).format("YYYY-MM-DD");
    }
    if (!startDateValue && apiBooking.start_epoch) {
      startDateValue = dayjs.unix(Number(apiBooking.start_epoch)).format("YYYY-MM-DD");
    }
    if (!endDateValue && startDateValue) {
      endDateValue = startDateValue;
    }

    const clientName =
      apiBooking.firstname && apiBooking.lastname
        ? `${apiBooking.firstname} ${apiBooking.lastname}`.trim()
        : apiBooking.firstname
          ? apiBooking.firstname
          : apiBooking.email || "Client";

    const amount = apiBooking.base_amount
      ? `₹${parseFloat(apiBooking.base_amount).toLocaleString("en-IN", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })}`
      : "₹0";

    const responsibilities = apiBooking.responsibilities || {};

    return {
      id: Number(apiBooking.engagement_id || apiBooking.id),
      serviceProviderId: Number(apiBooking.serviceproviderid || apiBooking.serviceProviderId),
      customerId: Number(apiBooking.customerid || apiBooking.customerId),
      start_date: startDateValue,
      endDate: endDateValue,
      engagements: "",
      timeslot:
        apiBooking.startTime && apiBooking.endTime
          ? `${formatTimeToAMPM(apiBooking.startTime)} – ${formatTimeToAMPM(apiBooking.endTime)}`
          : "",
      monthlyAmount: Number(apiBooking.base_amount || apiBooking.monthlyAmount || 0),
      paymentMode: "",
      booking_type: apiBooking.booking_type || apiBooking.bookingType || "",
      service_type: apiBooking.service_type || apiBooking.serviceType || "",
      bookingDate: apiBooking.created_at || apiBooking.bookingDate,
      responsibilities,
      housekeepingRole: null,
      mealType: null,
      noOfPersons: responsibilities.tasks?.[0]?.persons || null,
      experience: null,
      childAge: null,
      customerName: clientName,
      serviceProviderName: "",
      address: apiBooking.address || "",
      taskStatus: apiBooking.task_status || apiBooking.taskStatus || "",
      modifiedBy: "",
      modifiedDate: "",
      availableTimeSlots: null,
      customerHolidays: [],
      serviceProviderLeaves: [],
      active: true,
      clientName,
      service: apiBooking.service_type || apiBooking.serviceType || "",
      date,
      time: timeRange,
      location: apiBooking.address || "Address not available",
      status: apiBooking.task_status || apiBooking.taskStatus || "",
      amount,
      bookingData: {
        ...apiBooking,
        mobileno: apiBooking.mobileno || "",
        contact: apiBooking.mobileno || "No contact info",
        today_service: apiBooking.today_service || null,
      },
    };
  }, []);

  const tabCounts = useMemo(
    () => ({
      ongoing: monthResponse?.current?.length ?? 0,
      future: monthResponse?.upcoming?.length ?? 0,
      past: monthResponse?.past?.length ?? 0,
    }),
    [monthResponse]
  );

  const tabBookings = useMemo(() => {
    if (!monthResponse) return [];
    const raw =
      tab === "ongoing"
        ? monthResponse.current
        : tab === "future"
          ? monthResponse.upcoming
          : monthResponse.past;
    return sortProviderEngagements(raw || [], tab).map(mapApiBookingToBooking);
  }, [monthResponse, tab, mapApiBookingToBooking]);

  const filteredBookings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return tabBookings;
    return tabBookings.filter((booking) => {
      const serviceTitle = getServiceTitle(booking.service || "").toLowerCase();
      return (
        booking.clientName.toLowerCase().includes(query) ||
        serviceTitle.includes(query) ||
        String(booking.id).includes(query)
      );
    });
  }, [tabBookings, searchQuery]);

  const loadMonthBookings = useCallback(
    async (monthDate: Dayjs, isRefresh = false) => {
      if (!serviceProviderId) return;

      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        const formattedMonth = `${monthDate.year()}-${String(monthDate.month() + 1).padStart(2, "0")}`;
        const res = await PaymentInstance.get(
          `/api/service-providers/${serviceProviderId}/engagements?month=${formattedMonth}`
        );
        setMonthResponse(res.data);
      } catch (err) {
        console.error("Error fetching bookings:", err);
        Alert.alert("Error", "Failed to load bookings. Please try again.");
        setMonthResponse({ current: [], upcoming: [], past: [] });
      } finally {
        setLoading(false);
        setRefreshing(false);
        setInitialLoad(false);
      }
    },
    [serviceProviderId]
  );

  const handleStartTask = async (bookingId: string, bookingData: any) => {
    if (!bookingId || !bookingData) return;

    const serviceDayId = bookingData.today_service?.service_day_id;
    if (!serviceDayId) {
      Alert.alert("Error", "Service day ID not found. Please contact support.");
      return;
    }

    const previousStatus = taskStatus[bookingId];
    setTaskStatus((prev) => ({ ...prev, [bookingId]: "IN_PROGRESS" }));
    setTaskStatusUpdating((prev) => ({ ...prev, [bookingId]: true }));

    try {
      await PaymentInstance.post(
        `api/engagement-service/service-days/${serviceDayId}/start`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      Alert.alert("Success", "Task started successfully!");
      await loadMonthBookings(selectedMonth, true);
    } catch (err) {
      setTaskStatus((prev) => ({ ...prev, [bookingId]: previousStatus }));
      let errorMessage = "Failed to start service. Please try again.";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || err.message || errorMessage;
      }
      Alert.alert("Error", errorMessage);
    } finally {
      setTaskStatusUpdating((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  const handleStopTask = (bookingId: string, bookingData: any) => {
    setCurrentBooking({ bookingId, bookingData });
    setOtpDialogOpen(true);
  };

  const handleVerifyOtp = async (otp: string) => {
    if (!currentBooking) return;

    const serviceDayId = currentBooking.bookingData.today_service?.service_day_id;
    if (!serviceDayId) {
      Alert.alert("Error", "Service day ID not found. Please contact support.");
      return;
    }

    setVerifyingOtp(true);
    try {
      await PaymentInstance.post(
        `api/engagement-service/service-days/${serviceDayId}/complete`,
        { otp },
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );
      Alert.alert("Success", "Task completed successfully!");
      setTaskStatus((prev) => ({ ...prev, [currentBooking.bookingId]: "COMPLETED" }));
      await loadMonthBookings(selectedMonth, true);
    } catch (err) {
      let errorMessage = "Failed to complete service. Please try again.";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || err.message || errorMessage;
      }
      Alert.alert("Error", errorMessage);
      throw err;
    } finally {
      setVerifyingOtp(false);
      setOtpDialogOpen(false);
    }
  };

  const handleTabChange = (newTab: TabKey) => {
    setTab(newTab);
    setSearchQuery("");
  };

  useEffect(() => {
    if (!visible) return;
    setTab("ongoing");
    setSearchQuery("");
    setMonthResponse(null);
    setInitialLoad(true);
    setSelectedMonth(dayjs().startOf("month"));
  }, [visible]);

  useEffect(() => {
    if (!visible || !selectedMonth) return;
    loadMonthBookings(selectedMonth);
  }, [visible, selectedMonth, loadMonthBookings]);

  const currentMonth = dayjs().startOf("month");

  const canGoPrev = () => {
    if (tab === "future") return selectedMonth.startOf("month").isAfter(currentMonth, "month");
    return true;
  };

  const canGoNext = () => {
    if (tab === "past") return selectedMonth.startOf("month").isBefore(currentMonth, "month");
    return true;
  };

  const getEmptyStateMessage = () => {
    const monthName = selectedMonth.format("MMMM YYYY");
    if (searchQuery.trim()) return `No bookings match "${searchQuery.trim()}"`;
    if (tab === "ongoing") return `No current bookings for ${monthName}`;
    if (tab === "future") return `No upcoming bookings for ${monthName}`;
    return `No past bookings for ${monthName}`;
  };

  const renderBookingCard = (booking: Booking) => {
    const todayServiceStatus = booking.bookingData?.today_service?.status;
    const taskStatusOriginal = booking.taskStatus?.toUpperCase();
    const busy = !!taskStatusUpdating[booking.id.toString()];

    const isInProgress =
      todayServiceStatus === "IN_PROGRESS" ||
      taskStatus[booking.id.toString()] === "IN_PROGRESS" ||
      taskStatusOriginal === "IN_PROGRESS" ||
      taskStatusOriginal === "STARTED";

    const isCompleted =
      todayServiceStatus === "COMPLETED" || taskStatusOriginal === "COMPLETED";
    const isNotStarted =
      todayServiceStatus === "SCHEDULED" || taskStatusOriginal === "NOT_STARTED";
    const canStart = booking.bookingData?.today_service?.can_start === true;

    const showStartButton = isNotStarted && canStart;
    const showCompleteButton = isInProgress;
    const showCompletedButton = isCompleted;

    return (
      <View key={booking.id} style={styles.bookingCard}>
        <View style={styles.cardAccentBar} />

        <View style={styles.cardInner}>
          <View style={styles.cardTopRow}>
            <View style={styles.dateBadge}>
              <MaterialIcon name="date-range" size={14} color={BRAND.accent} />
              <Text style={styles.dateBadgeText} numberOfLines={2}>
                {formatBookingDateRange(booking)}
              </Text>
            </View>
            <View style={styles.amountPill}>
              <Text style={styles.amountPillText}>{booking.amount}</Text>
            </View>
          </View>

          <Text style={styles.clientName}>{booking.clientName}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaChip}>
              <MaterialIcon name="receipt" size={12} color={BRAND.textMuted} />
              <Text style={styles.metaChipText}>#{booking.id}</Text>
            </View>
            <View style={[styles.metaChip, styles.metaChipFlex]}>
              <MaterialIcon name="build" size={12} color={BRAND.textMuted} />
              <Text style={styles.metaChipText} numberOfLines={1}>
                {getServiceTitle(booking.service)}
              </Text>
            </View>
          </View>

          <View style={styles.timeRow}>
            <MaterialIcon name="schedule" size={14} color={BRAND.accent} />
            <Text style={styles.timeText}>{booking.time}</Text>
          </View>

          <View style={styles.badgeRow}>
            {getBookingTypeBadge(booking.booking_type || "")}
            {getStatusBadge(booking.taskStatus || "")}
          </View>

          {booking.location && booking.location !== "Address not available" ? (
            <View style={styles.addressRow}>
              <MaterialIcon name="location-on" size={14} color={BRAND.textMuted} />
              <Text style={styles.addressText} numberOfLines={2}>
                {booking.location}
              </Text>
            </View>
          ) : null}

          <View style={styles.actionRow}>
            {booking.bookingData?.mobileno ? (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() =>
                  handleCallCustomer(booking.bookingData.mobileno, booking.clientName)
                }
              >
                <MaterialIcon name="phone" size={16} color={BRAND.accent} />
                <Text style={styles.actionButtonText}>Call</Text>
              </TouchableOpacity>
            ) : null}

            {booking.location && booking.location !== "Address not available" ? (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  setSelectedAddress(booking.location);
                  setTrackAddressDialogOpen(true);
                }}
              >
                <MaterialIcon name="map" size={16} color={BRAND.accent} />
                <Text style={styles.actionButtonText}>Map</Text>
              </TouchableOpacity>
            ) : null}

            {busy ? (
              <ActivityIndicator size="small" color={BRAND.accent} style={styles.actionSpinner} />
            ) : showCompleteButton ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.completeButton]}
                onPress={() => handleStopTask(booking.id.toString(), booking.bookingData)}
              >
                <MaterialIcon name="check-circle" size={16} color="#ffffff" />
                <Text style={[styles.actionButtonText, styles.actionButtonTextLight]}>
                  Complete
                </Text>
              </TouchableOpacity>
            ) : showCompletedButton ? (
              <View style={styles.statusDonePill}>
                <MaterialIcon name="done-all" size={14} color="#059669" />
                <Text style={styles.statusDoneText}>Done</Text>
              </View>
            ) : showStartButton ? (
              <TouchableOpacity
                style={[styles.actionButton, styles.startButton]}
                onPress={() => handleStartTask(booking.id.toString(), booking.bookingData)}
              >
                <MaterialIcon name="play-arrow" size={16} color="#ffffff" />
                <Text style={[styles.actionButtonText, styles.actionButtonTextLight]}>Start</Text>
              </TouchableOpacity>
            ) : tab === "ongoing" ? (
              <View style={styles.statusIdlePill}>
                <MaterialIcon name="hourglass-empty" size={14} color={BRAND.textMuted} />
                <Text style={styles.statusIdleText}>Scheduled</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.sheet}>
            {/* Header */}
            <View style={styles.headerAccent} />
            <View style={styles.header}>
              <View style={styles.headerIcon}>
                <MaterialIcon name="calendar-month" size={22} color={BRAND.accent} />
              </View>
              <View style={styles.headerTextCol}>
                <Text style={styles.headerTitle}>All Bookings</Text>
                <Text style={styles.headerSubtitle}>
                  {tabCounts.ongoing + tabCounts.future + tabCounts.past} total this month
                </Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={8}>
                <MaterialIcon name="close" size={22} color={BRAND.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Segmented tabs */}
            <View style={styles.segmentWrap}>
              {TAB_CONFIG.map(({ key, label, icon }) => {
                const active = tab === key;
                const count = tabCounts[key];
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.segment, active && styles.segmentActive]}
                    onPress={() => handleTabChange(key)}
                    activeOpacity={0.85}
                  >
                    <MaterialIcon
                      name={icon}
                      size={15}
                      color={active ? "#ffffff" : BRAND.textMuted}
                    />
                    <Text style={[styles.segmentLabel, active && styles.segmentLabelActive]}>
                      {label}
                    </Text>
                    <View style={[styles.segmentCount, active && styles.segmentCountActive]}>
                      <Text
                        style={[styles.segmentCountText, active && styles.segmentCountTextActive]}
                      >
                        {count}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Month + search toolbar */}
            <View style={styles.toolbar}>
              <View style={styles.monthPicker}>
                <TouchableOpacity
                  style={[styles.monthNavBtn, !canGoPrev() && styles.monthNavBtnDisabled]}
                  onPress={() =>
                    canGoPrev() && setSelectedMonth(selectedMonth.subtract(1, "month"))
                  }
                  disabled={!canGoPrev()}
                >
                  <MaterialIcon
                    name="chevron-left"
                    size={22}
                    color={canGoPrev() ? BRAND.accent : "#cbd5e1"}
                  />
                </TouchableOpacity>
                <Text style={styles.monthLabel}>{selectedMonth.format("MMMM YYYY")}</Text>
                <TouchableOpacity
                  style={[styles.monthNavBtn, !canGoNext() && styles.monthNavBtnDisabled]}
                  onPress={() => canGoNext() && setSelectedMonth(selectedMonth.add(1, "month"))}
                  disabled={!canGoNext()}
                >
                  <MaterialIcon
                    name="chevron-right"
                    size={22}
                    color={canGoNext() ? BRAND.accent : "#cbd5e1"}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.searchBox}>
                <MaterialIcon name="search" size={18} color={BRAND.textMuted} />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search client, service, or ID"
                  placeholderTextColor="#94a3b8"
                  style={styles.searchInput}
                  returnKeyType="search"
                  clearButtonMode="while-editing"
                />
                {searchQuery.length > 0 ? (
                  <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={8}>
                    <MaterialIcon name="close" size={18} color={BRAND.textMuted} />
                  </TouchableOpacity>
                ) : null}
              </View>

              <Text style={styles.resultsHint}>
                {loading && initialLoad
                  ? "Loading bookings..."
                  : `${filteredBookings.length} shown`}
              </Text>
            </View>

            {/* List */}
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={() => loadMonthBookings(selectedMonth, true)}
                  tintColor={BRAND.bookingSky}
                  colors={[BRAND.bookingSky]}
                />
              }
            >
              {loading && initialLoad ? (
                <View style={styles.loadingWrap}>
                  {[1, 2, 3].map((i) => (
                    <View key={i} style={styles.skeletonCard}>
                      <View style={styles.skeletonBar} />
                      <View style={styles.skeletonBody}>
                        <View style={styles.skeletonLineWide} />
                        <View style={styles.skeletonLine} />
                        <View style={styles.skeletonLineShort} />
                      </View>
                    </View>
                  ))}
                </View>
              ) : filteredBookings.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconWrap}>
                    <MaterialIcon name="event-busy" size={36} color={BRAND.textMuted} />
                  </View>
                  <Text style={styles.emptyTitle}>No bookings found</Text>
                  <Text style={styles.emptyDescription}>{getEmptyStateMessage()}</Text>
                  {searchQuery.trim() ? (
                    <TouchableOpacity
                      style={styles.clearSearchBtn}
                      onPress={() => setSearchQuery("")}
                    >
                      <Text style={styles.clearSearchText}>Clear search</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : (
                filteredBookings.map(renderBookingCard)
              )}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      <OtpVerificationDialog
        open={otpDialogOpen}
        onOpenChange={() => setOtpDialogOpen(false)}
        onVerify={handleVerifyOtp}
        verifying={verifyingOtp}
        bookingInfo={
          currentBooking
            ? {
                clientName:
                  currentBooking.bookingData?.firstname ||
                  currentBooking.bookingData?.customerName,
                service: getServiceTitle(
                  currentBooking.bookingData?.service_type ||
                    currentBooking.bookingData?.serviceType
                ),
                bookingId:
                  currentBooking.bookingData?.engagement_id || currentBooking.bookingData?.id,
              }
            : undefined
        }
      />

      <Modal
        visible={trackAddressDialogOpen}
        animationType="slide"
        onRequestClose={() => setTrackAddressDialogOpen(false)}
      >
        <TrackAddress
          onClose={() => setTrackAddressDialogOpen(false)}
          googleMapsApiKey={GOOGLE_MAPS_API_KEY}
          destinationAddress={selectedAddress || undefined}
        />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BRAND.canvas,
  },
  sheet: {
    flex: 1,
    backgroundColor: BRAND.canvas,
  },
  headerAccent: {
    height: 3,
    backgroundColor: BRAND.accent,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: BRAND.accentSoft,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.line,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.line,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerTextCol: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: BRAND.text,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: BRAND.textMuted,
    marginTop: 2,
    fontWeight: "500",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.line,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentWrap: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: BRAND.surface,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.line,
  },
  segment: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: BRAND.canvas,
    borderWidth: 1,
    borderColor: BRAND.line,
  },
  segmentActive: {
    backgroundColor: BRAND.accent,
    borderColor: BRAND.accent,
  },
  segmentLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: BRAND.textMuted,
  },
  segmentLabelActive: {
    color: "#ffffff",
  },
  segmentCount: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: BRAND.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentCountActive: {
    backgroundColor: "rgba(255,255,255,0.22)",
  },
  segmentCountText: {
    fontSize: 11,
    fontWeight: "700",
    color: BRAND.accent,
  },
  segmentCountTextActive: {
    color: "#ffffff",
  },
  toolbar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
    backgroundColor: BRAND.surface,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.line,
  },
  monthPicker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: BRAND.accentSoft,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.line,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  monthNavBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: BRAND.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  monthNavBtnDisabled: {
    opacity: 0.45,
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: BRAND.text,
    letterSpacing: -0.2,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: BRAND.canvas,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.line,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: BRAND.text,
    padding: 0,
  },
  resultsHint: {
    fontSize: 12,
    color: BRAND.textMuted,
    fontWeight: "500",
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  loadingWrap: {
    gap: 12,
  },
  skeletonCard: {
    backgroundColor: BRAND.surface,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: BRAND.line,
  },
  skeletonBar: {
    height: 3,
    backgroundColor: BRAND.line,
  },
  skeletonBody: {
    padding: 16,
    gap: 10,
  },
  skeletonLineWide: {
    height: 14,
    width: "70%",
    borderRadius: 4,
    backgroundColor: BRAND.line,
  },
  skeletonLine: {
    height: 12,
    width: "100%",
    borderRadius: 4,
    backgroundColor: BRAND.line,
  },
  skeletonLineShort: {
    height: 12,
    width: "45%",
    borderRadius: 4,
    backgroundColor: BRAND.line,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: BRAND.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: BRAND.text,
    marginBottom: 6,
  },
  emptyDescription: {
    fontSize: 14,
    color: BRAND.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
  clearSearchBtn: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: BRAND.accentSoft,
    borderWidth: 1,
    borderColor: BRAND.line,
  },
  clearSearchText: {
    fontSize: 13,
    fontWeight: "600",
    color: BRAND.accent,
  },
  bookingCard: {
    backgroundColor: BRAND.surface,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: BRAND.line,
    shadowColor: BRAND.bookingNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardAccentBar: {
    height: 3,
    backgroundColor: BRAND.accent,
  },
  cardInner: {
    padding: 14,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 8,
  },
  dateBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: BRAND.accentSoft,
    flexShrink: 1,
    marginRight: 8,
  },
  dateBadgeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: BRAND.accent,
    lineHeight: 16,
  },
  amountPill: {
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  amountPillText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0f766e",
  },
  clientName: {
    fontSize: 17,
    fontWeight: "700",
    color: BRAND.text,
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: BRAND.canvas,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BRAND.line,
  },
  metaChipFlex: {
    flex: 1,
    minWidth: 0,
  },
  metaChipText: {
    fontSize: 12,
    color: BRAND.textMuted,
    fontWeight: "500",
    flexShrink: 1,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  timeText: {
    fontSize: 13,
    fontWeight: "600",
    color: BRAND.text,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginBottom: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: BRAND.canvas,
    borderWidth: 1,
    borderColor: BRAND.line,
  },
  addressText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    color: BRAND.textMuted,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BRAND.line,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BRAND.line,
    backgroundColor: BRAND.canvas,
    minWidth: 72,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: BRAND.textMuted,
  },
  actionButtonTextLight: {
    color: "#ffffff",
  },
  actionSpinner: {
    marginLeft: 4,
  },
  startButton: {
    backgroundColor: BRAND.accent,
    borderColor: BRAND.accent,
  },
  completeButton: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
  },
  statusDonePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  statusDoneText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#059669",
  },
  statusIdlePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: BRAND.canvas,
    borderWidth: 1,
    borderColor: BRAND.line,
  },
  statusIdleText: {
    fontSize: 13,
    fontWeight: "500",
    color: BRAND.textMuted,
  },
});
