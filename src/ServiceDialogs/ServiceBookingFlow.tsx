/* eslint-disable */
import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
import { useDispatch, useSelector } from "react-redux";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/MaterialIcons";
import { BOOKINGS } from "../Constants/pagesConstants";
import { EnhancedProviderDetails } from "../types/ProviderDetailsType";
import { removeFromCart, selectCartItems } from "../features/addToSlice";
import { isMaidCartItem, isMealCartItem } from "../types/cartSlice";
import BookingService, {
  BookingPayload,
  resolveServiceProviderIdForPayload,
} from "../services/bookingService";
import BookingSuccessDialog from "../common/BookingSuccessDialog";
import { useAppUser } from "../context/AppUserContext";
import {
  getBookingTypeFromPreference,
  formatInr,
  formatDateOnly,
  normalizeBookingTypeFields,
} from "../utils/maidPricingUtils";
import MaidBookingDetailsSection from "./MaidBookingDetailsSection";
import {
  SERVICE_BOOKING_CONFIG,
  BOOKING_HEADER_GRADIENT,
  computeDurationHours,
  loadServiceQuote,
  type ServiceBookingKind,
} from "./serviceBookingConfig";

export type BookingSuccessDetails = {
  providerName?: string;
  serviceType?: string;
  totalAmount?: number;
  bookingDate?: string;
  persons?: number;
  message?: string;
};

export interface ServiceBookingFlowProps {
  serviceKind: ServiceBookingKind;
  active: boolean;
  onClose: () => void;
  /** When true, parent sheet renders the header (full-width + close). */
  hideHeader?: boolean;
  providerDetails?: EnhancedProviderDetails;
  sendDataToParent?: (data: string) => void;
  onSuccessDialogChange?: (open: boolean) => void;
  /** Parent sheet shows success UI and navigates (same as web dialog flow). */
  onCheckoutSuccess?: (details: BookingSuccessDetails) => void;
  onBookingSuccess?: () => void;
}

const ServiceBookingFlow: React.FC<ServiceBookingFlowProps> = ({
  serviceKind,
  active,
  onClose,
  hideHeader = false,
  providerDetails,
  sendDataToParent,
  onSuccessDialogChange,
  onCheckoutSuccess,
  onBookingSuccess,
}) => {
  const delegateSuccess = hideHeader && !!onCheckoutSuccess;
  const cfg = SERVICE_BOOKING_CONFIG[serviceKind];
  const dispatch = useDispatch();
  const { appUser } = useAppUser();

  const allCartItems = useSelector(selectCartItems);
  const legacyCartItems = allCartItems.filter(
    serviceKind === "maid" ? isMaidCartItem : isMealCartItem
  );

  const rawBooking = useSelector(
    (state: { bookingType?: { value?: Record<string, unknown> } }) =>
      state.bookingType?.value ?? null
  );
  const bookingType = normalizeBookingTypeFields(rawBooking);

  const [loading, setLoading] = useState(false);
  const [rateCard, setRateCard] = useState<{
    plan?: { base_rate_min?: number; base_rate_max?: number; unit?: string; name?: string };
  } | null>(null);
  const [quotePreview, setQuotePreview] = useState<{
    total: number;
    loading: boolean;
    error?: string;
  }>({ total: 0, loading: false });

  const providerFullName =
    `${providerDetails?.firstName || ""} ${providerDetails?.lastName || ""}`.trim();

  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [bookingSuccessDetails, setBookingSuccessDetails] = useState<any>(null);

  useEffect(() => {
    if (!delegateSuccess) {
      onSuccessDialogChange?.(successDialogOpen);
    }
  }, [successDialogOpen, onSuccessDialogChange, delegateSuccess]);

  const bookingTypeCode = getBookingTypeFromPreference(
    String(bookingType?.bookingPreference ?? "Date")
  );
  const providerId =
    resolveServiceProviderIdForPayload(providerDetails) ??
    resolveServiceProviderIdForPayload({
      serviceProviderId:
        bookingType?.serviceproviderId ?? bookingType?.serviceProviderId,
      serviceproviderid: bookingType?.serviceproviderId,
    });

  const quoteTotal = quotePreview.total || 0;
  const priceReady = !quotePreview.loading && quoteTotal > 0 && !quotePreview.error;
  const providerRequired = bookingTypeCode !== "ON_DEMAND";
  const canCheckout = priceReady && (!providerRequired || providerId != null);
  const checkoutBlockReason =
    providerRequired && !providerId
      ? providerDetails
        ? "Select a provider to continue"
        : "Choose a provider from the list, then tap Book now"
      : quotePreview.loading
        ? "Calculating price…"
        : quotePreview.error
          ? quotePreview.error
          : quoteTotal <= 0
            ? "Pick a valid date and time to see price"
            : !providerId && bookingTypeCode === "ON_DEMAND"
              ? "Pay now to confirm — provider matching after payment"
              : undefined;

  useEffect(() => {
    if (!active) setLoading(false);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    legacyCartItems.forEach((item) => {
      dispatch(removeFromCart({ id: item.id, type: cfg.cartType }));
    });
  }, [active, legacyCartItems, dispatch, cfg.cartType]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    cfg
      .fetchRateCard(bookingTypeCode)
      .then((data: any) => {
        if (!cancelled && data?.success !== false) setRateCard(data);
      })
      .catch(() => {
        if (!cancelled) setRateCard(null);
      });
    return () => {
      cancelled = true;
    };
  }, [active, bookingTypeCode, cfg]);

  useEffect(() => {
    if (!active) return;
    const customerId = appUser?.customerid;
    const start_date =
      formatDateOnly(String(bookingType?.startDate ?? "")) ||
      new Date().toISOString().split("T")[0];
    const end_date = formatDateOnly(String(bookingType?.endDate ?? "")) || start_date;
    const durationHours = computeDurationHours(
      bookingTypeCode,
      String(bookingType?.startTime ?? ""),
      String(bookingType?.endTime ?? ""),
      start_date,
      end_date,
      String(bookingType?.timeRange ?? "")
    );

    setQuotePreview((p) => ({ ...p, loading: true, error: undefined }));
    let cancelled = false;

    loadServiceQuote(serviceKind, {
      bookingType: bookingTypeCode,
      customerId,
      startDate: start_date,
      endDate: end_date,
      durationHours,
      hoursPerDay:
        bookingTypeCode === "SHORT_TERM" && durationHours != null
          ? durationHours
          : undefined,
      ratePreference: "mid",
    })
      .then((res) => {
        if (!cancelled) {
          const total = Number(res.total) || 0;
          setQuotePreview({
            total,
            loading: false,
            error: total > 0 ? undefined : res.quoteError,
          });
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const ax = err as { response?: { data?: { error?: string } }; message?: string };
          setQuotePreview({
            total: 0,
            loading: false,
            error: ax.response?.data?.error || ax.message || "Could not load price",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    active,
    serviceKind,
    bookingTypeCode,
    bookingType?.startDate,
    bookingType?.endDate,
    bookingType?.startTime,
    bookingType?.endTime,
    bookingType?.timeRange,
    bookingType?.bookingPreference,
    appUser?.customerid,
  ]);

  const handleSuccessDialogClose = () => {
    setSuccessDialogOpen(false);
    onClose();
  };

  const handleNavigateToBookings = () => {
    setSuccessDialogOpen(false);
    onClose();
    sendDataToParent?.(BOOKINGS);
  };

  const publishCheckoutSuccess = (details: BookingSuccessDetails) => {
    if (delegateSuccess) {
      onCheckoutSuccess?.(details);
      return;
    }
    setBookingSuccessDetails(details);
    setSuccessDialogOpen(true);
  };

  const handleCheckout = async () => {
    if (!canCheckout) {
      Alert.alert(
        "Cannot checkout",
        checkoutBlockReason || "Price is not available for this booking."
      );
      return;
    }

    const customerId = appUser?.customerid;
    if (!customerId) {
      Alert.alert("Sign in required", "Please sign in to complete your booking.");
      return;
    }

    try {
      setLoading(true);

      const booking_type = getBookingTypeFromPreference(
        String(bookingType?.bookingPreference ?? "Date")
      );
      const spId = providerId;
      if (booking_type !== "ON_DEMAND" && !spId) {
        Alert.alert("Provider required", "Please pick a provider again.");
        return;
      }

      const start_date =
        formatDateOnly(String(bookingType?.startDate ?? "")) ||
        new Date().toISOString().split("T")[0];
      const end_date = formatDateOnly(String(bookingType?.endDate ?? "")) || start_date;
      const durationHours = computeDurationHours(
        booking_type,
        String(bookingType?.startTime ?? ""),
        String(bookingType?.endTime ?? ""),
        start_date,
        end_date,
        String(bookingType?.timeRange ?? "")
      );

      const quoteRes = await loadServiceQuote(serviceKind, {
        bookingType: booking_type,
        customerId,
        startDate: start_date,
        endDate: end_date || start_date,
        durationHours,
        hoursPerDay:
          booking_type === "SHORT_TERM" && durationHours != null
            ? durationHours
            : undefined,
        ratePreference: "mid",
      });

      const checkoutTotal = quoteRes.total ?? 0;
      if (checkoutTotal <= 0) {
        Alert.alert("Price unavailable", "Price is not available for this booking.");
        return;
      }

      const payload: BookingPayload = {
        customerid: customerId,
        serviceproviderid: spId ?? null,
        start_date,
        end_date,
        start_time: String(bookingType?.startTime || ""),
        responsibilities: { tasks: [], add_ons: [] },
        booking_type,
        taskStatus: "NOT_STARTED",
        service_type: cfg.serviceType,
        base_amount: checkoutTotal,
        addon_total: 0,
        use_pricing_engine: true,
        pricing_snapshot: quoteRes.quote,
        payment_mode: "razorpay",
        end_time: String(bookingType?.endTime || ""),
      };

      const result = await BookingService.bookAndPay(payload);

      const successDetails: BookingSuccessDetails = {
        providerName: providerFullName,
        serviceType: cfg.successServiceLabel,
        totalAmount: checkoutTotal,
        bookingDate: String(bookingType?.startDate || new Date().toISOString().split("T")[0]),
        persons: 1,
        message:
          result?.verifyResult?.message ||
          "Your booking is confirmed. Payment was successful.",
      };

      dispatch(removeFromCart({ type: cfg.cartType }));
      publishCheckoutSuccess(successDetails);
    } catch (error: any) {
      let backendMessage = "Failed to initiate payment";
      if (error?.response?.data) {
        if (typeof error.response.data === "string") backendMessage = error.response.data;
        else if (error.response.data.error) backendMessage = error.response.data.error;
        else if (error.response.data.message) backendMessage = error.response.data.message;
      } else if (error?.message) {
        backendMessage = error.message;
      }
      Alert.alert("Payment failed", backendMessage);
    } finally {
      setLoading(false);
    }
  };

  const rateCardLabel = useMemo(() => {
    const plan = rateCard?.plan;
    if (!plan?.base_rate_min && !plan?.base_rate_max) return null;
    const c = (plan as { constraints_json?: Record<string, number> }).constraints_json;
    if (bookingTypeCode === "SHORT_TERM" && (c?.sevenDayPkgMin ?? c?.hourlyBaseMin)) {
      const pkg = `${formatInr(c.sevenDayPkgMin ?? c.hourlyBaseMin)} – ${formatInr(c.sevenDayPkgMax ?? c.hourlyBaseMax)}`;
      return `${pkg} for 7 days (1h/day) · 25% off extra days after 7`;
    }
    const min = plan.base_rate_min ?? plan.base_rate_max ?? 0;
    const max = plan.base_rate_max ?? min;
    const unit = plan.unit === "HOUR" ? "/hr" : plan.unit === "DAY" ? "/day" : "/mo";
    if (min === max) return `${formatInr(min)}${unit}`;
    return `${formatInr(min)} – ${formatInr(max)}${unit}`;
  }, [rateCard, bookingTypeCode]);

  if (!active && (!successDialogOpen || delegateSuccess)) return null;

  if (!delegateSuccess && successDialogOpen && !active) {
    return (
      <BookingSuccessDialog
        visible={successDialogOpen}
        onClose={handleSuccessDialogClose}
        bookingDetails={bookingSuccessDetails}
        message={bookingSuccessDetails?.message}
        onNavigateToBookings={handleNavigateToBookings}
      />
    );
  }

  return (
    <>
      <View style={styles.root}>
        {!hideHeader && (
          <LinearGradient
            colors={BOOKING_HEADER_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            <View style={styles.headerRow}>
              <View style={styles.headerTextCol}>
                <Text style={styles.headerTitle}>{cfg.title}</Text>
                <Text style={styles.headerSub} numberOfLines={1}>
                  {providerFullName || "On-demand booking"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                accessibilityLabel="Close"
              >
                <Icon name="close" size={22} color="#0f172a" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        )}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.card}>
            <MaidBookingDetailsSection active={active} />
          </View>

          <View style={styles.card}>
            <Text style={styles.priceLabel}>
              {quotePreview.loading ? "Updating price…" : "Total"}
            </Text>
            {quotePreview.loading ? (
              <ActivityIndicator size="small" color="#0b5bd3" style={{ marginVertical: 4 }} />
            ) : (
              <Text style={styles.priceHero}>{formatInr(quoteTotal)}</Text>
            )}
            <Text style={styles.priceMeta}>
              {checkoutBlockReason ?? cfg.priceMetaReady}
            </Text>
            {rateCardLabel ? (
              <View style={styles.rateRow}>
                <Text style={styles.rateLabel}>Rate band</Text>
                <Text style={styles.rateValue}>{rateCardLabel}</Text>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.footerActions}>
            <TouchableOpacity style={styles.btnGhost} onPress={onClose}>
              <Text style={styles.btnGhostText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnPrimary, (!canCheckout || loading) && styles.btnDisabled]}
              disabled={!canCheckout || loading}
              onPress={() => void handleCheckout()}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.btnPrimaryText}>
                  {quoteTotal > 0 && !quotePreview.loading
                    ? `Pay now · ${formatInr(quoteTotal)}`
                    : "Pay now"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {!delegateSuccess && (
        <BookingSuccessDialog
          visible={successDialogOpen}
          onClose={handleSuccessDialogClose}
          bookingDetails={bookingSuccessDetails}
          message={bookingSuccessDetails?.message}
          onNavigateToBookings={handleNavigateToBookings}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  root: { backgroundColor: "#f1f5f9" },
  header: { paddingTop: 14, paddingBottom: 16, paddingHorizontal: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTextCol: { flex: 1, paddingRight: 12 },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  headerTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
  headerSub: { color: "rgba(255,255,255,0.9)", fontSize: 14, marginTop: 4 },
  scroll: { flexGrow: 0, flexShrink: 1, maxHeight: SCREEN_HEIGHT * 0.52 },
  scrollContent: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8, flexGrow: 0 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  priceLabel: { fontSize: 13, color: "#64748b", fontWeight: "500" },
  priceHero: { fontSize: 26, fontWeight: "800", color: "#0b5bd3", marginVertical: 2 },
  priceMeta: { fontSize: 13, color: "#64748b" },
  rateRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  rateLabel: { fontSize: 12, color: "#64748b" },
  rateValue: { fontSize: 14, fontWeight: "600", color: "#1e293b", marginTop: 4 },
  footer: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexShrink: 0,
  },
  footerActions: { flexDirection: "row", gap: 10, alignItems: "center" },
  btnGhost: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    alignItems: "center",
  },
  btnGhostText: { fontSize: 15, fontWeight: "600", color: "#475569" },
  btnPrimary: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "#0b5bd3",
    alignItems: "center",
  },
  btnDisabled: { opacity: 0.5 },
  btnPrimaryText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});

export default ServiceBookingFlow;
