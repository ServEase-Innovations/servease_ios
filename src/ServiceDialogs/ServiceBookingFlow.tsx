/* eslint-disable */
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  TextInput,
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
import { useDispatch, useSelector } from "react-redux";
import { useAuth0 } from "react-native-auth0";
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
import MaidBookingDetailsSection, {
  type MaidBookingDetailsSectionHandle,
} from "./MaidBookingDetailsSection";
import {
  SERVICE_BOOKING_CONFIG,
  BOOKING_HEADER_GRADIENT,
  computeDurationHours,
  isBookingScheduleComplete,
  loadServiceQuote,
  type ServiceBookingKind,
} from "./serviceBookingConfig";
import { buildQuoteBreakdown, type QuoteBreakdownRow } from "../utils/quoteBreakdown";
import {
  appendPaymentFeeRows,
  computeCheckoutWithWallet,
  computePaymentTotals,
} from "../utils/paymentTotals";
import PriceBreakdown from "./PriceBreakdown";
import type { PricingQuoteResponse } from "../services/pricingService";
import { BrandButton } from "../design-system/BrandButton";
import {
  displayCouponSavings,
  fetchCustomerCoupons,
  resolveCustomerId,
  type CustomerCoupon,
} from "../services/couponService";
import { fetchCustomerWallet } from "../services/walletService";
import {
  checkOnDemandProviderAvailability,
  ON_DEMAND_NO_PROVIDERS_MESSAGE,
} from "../services/onDemandAvailability";
import {
  hasValidBookingLocation,
  resolveLocationCoords,
} from "../utils/bookingLocation";
import { useBookingScheduleFlow } from "../hooks/useBookingScheduleFlow";
import { isCustomerCheckoutReady } from "../utils/authSession";
import BookingLocationSection from "./BookingLocationSection";
import { useTranslation } from "react-i18next";

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
  sendDataToParent?: (data: string, options?: { bookingDate?: string; initialTab?: 'today' | 'upcoming' | 'past' | 'cancelled' | 'pending' }) => void;
  onSuccessDialogChange?: (open: boolean) => void;
  /** Parent sheet shows success UI and navigates (same as web dialog flow). */
  onCheckoutSuccess?: (details: BookingSuccessDetails) => void;
  onBookingSuccess?: () => void;
  onLoginRequired?: () => void;
}

type CouponOption = CustomerCoupon;

function couponMeetsMinOrder(coupon: CouponOption, orderTotal: number): boolean {
  const min = coupon.minimumOrderValue;
  if (min == null || min <= 0) return true;
  return orderTotal >= min;
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
  onLoginRequired,
}) => {
  const delegateSuccess = hideHeader && !!onCheckoutSuccess;
  const cfg = SERVICE_BOOKING_CONFIG[serviceKind];
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { appUser } = useAppUser();
  const { user: auth0User, isAuthenticated: auth0IsAuthenticated } = useAuth0();

  const isCheckoutAuthenticated = useMemo(
    () => isCustomerCheckoutReady(appUser, auth0IsAuthenticated),
    [appUser, auth0IsAuthenticated]
  );

  const allCartItems = useSelector(selectCartItems);
  const legacyCartItems = allCartItems.filter(
    serviceKind === "maid" ? isMaidCartItem : isMealCartItem
  );

  const rawBooking = useSelector(
    (state: { bookingType?: { value?: Record<string, unknown> } }) =>
      state.bookingType?.value ?? null
  );
  const scheduleRevision = useSelector(
    (state: { bookingType?: { scheduleRevision?: number } }) =>
      state.bookingType?.scheduleRevision ?? 0
  );
  const schedulePendingCommit = useSelector(
    (state: { bookingType?: { scheduleDirty?: boolean } }) =>
      Boolean(state.bookingType?.scheduleDirty)
  );
  const scheduleDraft = useSelector(
    (state: { bookingType?: { scheduleDraft?: Record<string, unknown> | null } }) =>
      state.bookingType?.scheduleDraft ?? null
  );
  const bookingType = normalizeBookingTypeFields(rawBooking);
  const effectiveBookingType = useMemo(() => {
    if (!schedulePendingCommit || !scheduleDraft) return bookingType;
    return normalizeBookingTypeFields({ ...(bookingType ?? {}), ...scheduleDraft });
  }, [bookingType, scheduleDraft, schedulePendingCommit]);
  const providerId =
    resolveServiceProviderIdForPayload(providerDetails) ??
    resolveServiceProviderIdForPayload({
      serviceProviderId:
        bookingType?.serviceproviderId ?? bookingType?.serviceProviderId,
      serviceproviderid: bookingType?.serviceproviderId,
    });
  const geoLocation = useSelector(
    (state: { geoLocation?: { value?: unknown } }) => state?.geoLocation?.value
  );
  const bookingCoords = resolveLocationCoords(geoLocation);
  const bookingLocationReady = hasValidBookingLocation(geoLocation);

  const {
    scheduleReady,
    selectedProviderAvailability,
    selectedProviderReady,
    bookingTypeCode: scheduleFlowBookingTypeCode,
  } = useBookingScheduleFlow({
    active,
    providerId,
    role: cfg.serviceType,
    latitude: bookingCoords?.lat ?? null,
    longitude: bookingCoords?.lng ?? null,
    customerId: resolveCustomerId(appUser),
  });

  const [loading, setLoading] = useState(false);
  const scheduleSectionRef = useRef<MaidBookingDetailsSectionHandle>(null);
  const scrollRef = useRef<ScrollView>(null);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [onDemandAvailability, setOnDemandAvailability] = useState<{
    loading: boolean;
    available: boolean;
    message?: string;
  }>({ loading: false, available: true });
  const [quotePreview, setQuotePreview] = useState<{
    total: number;
    loading: boolean;
    error?: string;
    breakdown: QuoteBreakdownRow[];
    quote?: PricingQuoteResponse["quote"];
  }>({ total: 0, loading: false, breakdown: [] });

  const providerFullName =
    `${providerDetails?.firstName || ""} ${providerDetails?.lastName || ""}`.trim();

  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [bookingSuccessDetails, setBookingSuccessDetails] = useState<any>(null);
  const [availableCoupons, setAvailableCoupons] = useState<CouponOption[]>([]);
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponInfo, setCouponInfo] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(false);
  const [useWalletBalance, setUseWalletBalance] = useState(false);

  useEffect(() => {
    if (!delegateSuccess) {
      onSuccessDialogChange?.(successDialogOpen);
    }
  }, [successDialogOpen, onSuccessDialogChange, delegateSuccess]);

  const bookingTypeCode =
    scheduleFlowBookingTypeCode ||
    getBookingTypeFromPreference(String(bookingType?.bookingPreference ?? "Date"));
  const scheduleIncomplete = !isBookingScheduleComplete(
    effectiveBookingType,
    bookingTypeCode
  );
  const needsScheduleAvailabilityCheck = schedulePendingCommit || scheduleIncomplete;

  const serviceTotal = quotePreview.total || 0;
  const paymentTotals = useMemo(
    () => computePaymentTotals(serviceTotal),
    [serviceTotal]
  );
  const payableTotal = paymentTotals.total_amount || 0;
  const walletSplit = useMemo(
    () =>
      computeCheckoutWithWallet(
        paymentTotals,
        walletBalance,
        useWalletBalance && walletBalance > 0
      ),
    [paymentTotals, walletBalance, useWalletBalance]
  );
  const payableViaGateway = walletSplit.razorpay_amount;
  const displayPayableAmount =
    walletSplit.wallet_applied > 0 ? payableViaGateway : payableTotal;
  const displayBreakdown = useMemo(
    () => appendPaymentFeeRows(quotePreview.breakdown, serviceTotal),
    [quotePreview.breakdown, serviceTotal]
  );
  const priceReady =
    scheduleReady &&
    !quotePreview.loading &&
    payableTotal > 0 &&
    !quotePreview.error;
  const providerRequired = bookingTypeCode !== "ON_DEMAND";
  const bookingTypeDisplay =
    bookingTypeCode === "MONTHLY"
      ? "Monthly"
      : bookingTypeCode === "SHORT_TERM"
        ? "Short-term"
        : "One Time";
  const onDemandProviderReady =
    bookingTypeCode !== "ON_DEMAND" ||
    (onDemandAvailability.available && !onDemandAvailability.loading);
  const canCheckout =
    scheduleReady &&
    !schedulePendingCommit &&
    priceReady &&
    bookingLocationReady &&
    onDemandProviderReady &&
    selectedProviderReady &&
    (!providerRequired || providerId != null);
  const couponCountLabel = availableCoupons.length;
  const normalizedCouponInput = couponInput.trim().toUpperCase();
  const estimateCouponSavings = React.useCallback(
    (coupon: CouponOption) => displayCouponSavings(coupon, serviceTotal),
    [serviceTotal]
  );
  const eligibleCoupons = useMemo(() => {
    const list = availableCoupons.filter((c) => couponMeetsMinOrder(c, serviceTotal));
    return list.sort((a, b) => {
      if (cfg.serviceType === "COOK") {
        const aCook = a.serviceType === "COOK" ? 1 : 0;
        const bCook = b.serviceType === "COOK" ? 1 : 0;
        if (aCook !== bCook) return bCook - aCook;
        if (a.code === "COOK10ALL") return -1;
        if (b.code === "COOK10ALL") return 1;
      }
      return estimateCouponSavings(b) - estimateCouponSavings(a);
    });
  }, [availableCoupons, serviceTotal, estimateCouponSavings, cfg.serviceType]);
  const ineligibleCoupons = useMemo(
    () =>
      availableCoupons.filter(
        (c) =>
          c.minimumOrderValue != null &&
          c.minimumOrderValue > 0 &&
          serviceTotal < Number(c.minimumOrderValue)
      ),
    [availableCoupons, serviceTotal]
  );
  const bestCoupon = eligibleCoupons[0] || null;
  const bestCouponSavings = bestCoupon ? estimateCouponSavings(bestCoupon) : 0;
  const checkoutBlockReason =
    !scheduleReady
      ? "Select date and time for your booking"
      : !bookingLocationReady
        ? "Select a service location before checkout"
      : providerRequired && !providerId
      ? providerDetails
        ? "Select a provider to continue"
        : "Choose a provider from the list, then tap Book now"
      : quotePreview.loading
        ? "Calculating price…"
        : quotePreview.error
          ? quotePreview.error
          : payableTotal <= 0
            ? "Pick a valid date and time to see price"
            : bookingTypeCode === "ON_DEMAND" && !bookingCoords
              ? "Select a service location before checkout"
              : onDemandAvailability.loading
                ? "Checking provider availability in your area…"
                : bookingTypeCode === "ON_DEMAND" && !onDemandAvailability.available
                  ? onDemandAvailability.message || ON_DEMAND_NO_PROVIDERS_MESSAGE
                  : !selectedProviderReady && selectedProviderAvailability.message
                    ? selectedProviderAvailability.message
                  : !providerId && bookingTypeCode === "ON_DEMAND"
                    ? "Pay now to confirm — provider matching after payment"
                    : undefined;

  useEffect(() => {
    if (!active) setLoading(false);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    });
  }, [active]);

  useEffect(() => {
    if (!active || !isCheckoutAuthenticated) {
      setWalletBalance(0);
      setUseWalletBalance(false);
      return;
    }

    const customerId = resolveCustomerId(appUser);
    if (!customerId) {
      setWalletBalance(0);
      setUseWalletBalance(false);
      return;
    }

    let cancelled = false;
    setWalletLoading(true);
    void fetchCustomerWallet(customerId)
      .then((wallet) => {
        if (cancelled) return;
        const balance = Math.max(0, Number(wallet.balance ?? 0));
        setWalletBalance(balance);
        setUseWalletBalance(balance > 0);
      })
      .catch(() => {
        if (!cancelled) {
          setWalletBalance(0);
          setUseWalletBalance(false);
        }
      })
      .finally(() => {
        if (!cancelled) setWalletLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [active, appUser, isCheckoutAuthenticated]);

  useEffect(() => {
    if (!appliedCouponCode) return;
    const applied = availableCoupons.find((c) => c.code === appliedCouponCode);
    if (applied && !couponMeetsMinOrder(applied, serviceTotal)) {
      setAppliedCouponCode(null);
      setCouponInfo(
        `${applied.code} removed: minimum order is ${formatInr(applied.minimumOrderValue)}`
      );
    }
  }, [appliedCouponCode, availableCoupons, serviceTotal]);

  const loadAvailableCoupons = React.useCallback(() => {
    const customerId = resolveCustomerId(appUser);
    if (!customerId) {
      setAvailableCoupons([]);
      setCouponInfo("Sign in to see available coupons.");
      return Promise.resolve();
    }

    setCouponLoading(true);
    return fetchCustomerCoupons(customerId, cfg.serviceType)
      .then((mapped) => {
        setAvailableCoupons(mapped);
        if (mapped.length === 0) {
          setCouponInfo(
            cfg.serviceType === "COOK"
              ? "No Cook coupons right now. You can still enter a code (e.g. COOK10ALL)."
              : "No Maid coupons for this order. Cook-only codes apply on Home Cook bookings."
          );
        } else {
          setCouponInfo(null);
        }
      })
      .catch((err: { message?: string; response?: { status?: number } }) => {
        setAvailableCoupons([]);
        const status = err?.response?.status;
        setCouponInfo(
          status === 503
            ? "Coupons are temporarily unavailable. Try entering your code manually."
            : "Could not load coupons. Try entering your code manually."
        );
        if (__DEV__) {
          console.warn("[coupons] fetch failed:", err?.message || err);
        }
      })
      .finally(() => {
        setCouponLoading(false);
      });
  }, [appUser, cfg.serviceType]);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    loadAvailableCoupons().finally(() => {
      if (cancelled) setCouponLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [active, loadAvailableCoupons]);

  useEffect(() => {
    if (!couponModalOpen || !active) return;
    loadAvailableCoupons();
  }, [couponModalOpen, active, loadAvailableCoupons]);

  useEffect(() => {
    if (!active) return;
    legacyCartItems.forEach((item) => {
      dispatch(removeFromCart({ id: item.id, type: cfg.cartType }));
    });
  }, [active, legacyCartItems, dispatch, cfg.cartType]);

  useEffect(() => {
    if (!active || bookingTypeCode !== "ON_DEMAND") {
      setOnDemandAvailability({ loading: false, available: true });
      return;
    }
    if (!scheduleReady || !bookingCoords) {
      setOnDemandAvailability({
        loading: false,
        available: false,
        message: bookingCoords
          ? undefined
          : "Select a service location before checkout.",
      });
      return;
    }

    const startDate =
      formatDateOnly(String(bookingType?.startDate ?? "")) ||
      new Date().toISOString().split("T")[0];
    const startTime = String(bookingType?.startTime ?? "").trim();
    const endTime = String(bookingType?.endTime ?? "").trim();
    const durationHours = computeDurationHours(
      bookingTypeCode,
      startTime,
      endTime,
      startDate,
      startDate,
      String(bookingType?.timeRange ?? ""),
      String(bookingType?.timeSlot ?? "")
    );
    const durationMinutes =
      durationHours != null && durationHours > 0
        ? Math.round(durationHours * 60)
        : 60;

    let cancelled = false;
    setOnDemandAvailability((prev) => ({ ...prev, loading: true }));
    checkOnDemandProviderAvailability({
      latitude: bookingCoords.lat,
      longitude: bookingCoords.lng,
      serviceType: cfg.serviceType,
      startDate,
      startTime,
      durationMinutes,
    })
      .then((result) => {
        if (cancelled) return;
        setOnDemandAvailability({
          loading: false,
          available: result.available,
          message: result.message,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setOnDemandAvailability({
          loading: false,
          available: false,
          message: "Could not verify provider availability. Please try again.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [
    active,
    bookingTypeCode,
    scheduleReady,
    bookingCoords?.lat,
    bookingCoords?.lng,
    bookingType?.startDate,
    bookingType?.startTime,
    bookingType?.endTime,
    bookingType?.timeRange,
    bookingType?.timeSlot,
    cfg.serviceType,
  ]);

  useEffect(() => {
    if (!active) return;
    const customerId = resolveCustomerId(appUser);
    const start_date =
      formatDateOnly(String(effectiveBookingType?.startDate ?? "")) ||
      new Date().toISOString().split("T")[0];
    const end_date =
      formatDateOnly(String(effectiveBookingType?.endDate ?? "")) || start_date;
    const durationHours = computeDurationHours(
      bookingTypeCode,
      String(effectiveBookingType?.startTime ?? ""),
      String(effectiveBookingType?.endTime ?? ""),
      start_date,
      end_date,
      String(effectiveBookingType?.timeRange ?? ""),
      String(effectiveBookingType?.timeSlot ?? "")
    );

    setQuotePreview((p) => ({ ...p, loading: true, error: undefined, breakdown: [] }));
    let cancelled = false;

    loadServiceQuote(serviceKind, {
      bookingType: bookingTypeCode,
      customerId,
      couponCode: appliedCouponCode || undefined,
      startDate: start_date,
      endDate: end_date,
      durationHours,
      hoursPerDay:
        (bookingTypeCode === "SHORT_TERM" || bookingTypeCode === "MONTHLY") &&
        durationHours != null
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
            quote: res.quote,
            breakdown: buildQuoteBreakdown(res.quote, total),
          });
          if (appliedCouponCode && total > 0) {
            setCouponInfo(`Coupon ${appliedCouponCode} applied`);
          }
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const ax = err as { response?: { data?: { error?: string } }; message?: string };
          setQuotePreview({
            total: 0,
            loading: false,
            error: ax.response?.data?.error || ax.message || "Could not load price",
            breakdown: [],
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
    effectiveBookingType?.startDate,
    effectiveBookingType?.endDate,
    effectiveBookingType?.startTime,
    effectiveBookingType?.endTime,
    effectiveBookingType?.timeRange,
    effectiveBookingType?.timeSlot,
    effectiveBookingType?.bookingPreference,
    schedulePendingCommit,
    appliedCouponCode,
    appUser,
  ]);

  const handleSuccessDialogClose = () => {
    setSuccessDialogOpen(false);
    onClose();
  };

  const handleNavigateToBookings = () => {
    // Calculate which tab to show based on booking date
    const bookingDate = bookingSuccessDetails?.bookingDate;
    const tab = calculateBookingTab(bookingDate);
    
    console.log('📅 Navigating to bookings with date:', bookingDate, 'tab:', tab);
    
    setSuccessDialogOpen(false);
    onClose();
    sendDataToParent?.(BOOKINGS, { bookingDate, initialTab: tab });
  };

  const publishCheckoutSuccess = (details: BookingSuccessDetails) => {
    if (delegateSuccess) {
      onCheckoutSuccess?.(details);
      return;
    }
    setBookingSuccessDetails(details);
    setSuccessDialogOpen(true);
  };

  // Helper to determine which tab to show based on booking date
  const calculateBookingTab = (bookingDate?: string): 'today' | 'upcoming' => {
    if (!bookingDate) return 'upcoming';
    
    const today = new Date().toISOString().split('T')[0];
    return bookingDate === today ? 'today' : 'upcoming';
  };

  const applyCouponCode = (code: string) => {
    const normalized = String(code || "").trim().toUpperCase();
    if (!normalized) return;
    const match = availableCoupons.find((c) => c.code === normalized);
    if (match && !couponMeetsMinOrder(match, serviceTotal)) {
      setCouponInfo(
        `${normalized} needs minimum order ${formatInr(match.minimumOrderValue)}`
      );
      return;
    }
    setAppliedCouponCode(normalized);
    setCouponInput(normalized);
    setCouponModalOpen(false);
    setCouponInfo(`Applying ${normalized}...`);
  };

  const removeCoupon = () => {
    setAppliedCouponCode(null);
    setCouponInput("");
    setCouponInfo(null);
  };

  const couponPreview = (coupon: CouponOption): string => {
    if (coupon.discountType === "PERCENTAGE") return `${coupon.discountValue}% off`;
    return `${formatInr(coupon.discountValue)} off`;
  };

  const handleCheckout = async () => {
    if (!isCheckoutAuthenticated) {
      onLoginRequired?.();
      return;
    }

    if (!canCheckout) {
      Alert.alert(
        "Cannot checkout",
        checkoutBlockReason || "Price is not available for this booking."
      );
      return;
    }

    const customerId = resolveCustomerId(appUser);
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
        String(bookingType?.timeRange ?? ""),
        String(bookingType?.timeSlot ?? "")
      );

      const quoteRes = await loadServiceQuote(serviceKind, {
        bookingType: booking_type,
        customerId,
        couponCode: appliedCouponCode || undefined,
        startDate: start_date,
        endDate: end_date || start_date,
        durationHours,
        hoursPerDay:
          (booking_type === "SHORT_TERM" || booking_type === "MONTHLY") &&
          durationHours != null
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
        coupon_code: appliedCouponCode || undefined,
        payment_mode: "razorpay",
        use_wallet: useWalletBalance && walletBalance > 0,
        end_time: String(bookingType?.endTime || ""),
      };

      const result = await BookingService.bookAndPay(payload);

      const paidViaWallet = Boolean(result?.engagementData?.wallet_only);
      const successDetails: BookingSuccessDetails = {
        providerName: providerFullName,
        serviceType: cfg.successServiceLabel,
        totalAmount: paidViaWallet
          ? computePaymentTotals(checkoutTotal).total_amount
          : walletSplit.wallet_applied > 0
            ? payableViaGateway
            : computePaymentTotals(checkoutTotal).total_amount,
        bookingDate: String(bookingType?.startDate || new Date().toISOString().split("T")[0]),
        persons: 1,
        message:
          result?.verifyResult?.message ||
          (paidViaWallet
            ? t("wallet.checkout.paidFromWallet")
            : "Your booking is confirmed. Payment was successful."),
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
            colors={[...BOOKING_HEADER_GRADIENT]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
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
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <MaidBookingDetailsSection
              ref={scheduleSectionRef}
              active={active}
              providerId={providerId}
              onApplyingScheduleChange={setIsCheckingAvailability}
            />
          </View>

          {providerRequired &&
          providerId &&
          bookingTypeCode !== "ON_DEMAND" &&
          scheduleReady &&
          bookingCoords &&
          !selectedProviderAvailability.loading &&
          !selectedProviderAvailability.available ? (
            <View style={styles.providerUnavailableBanner}>
              <Text style={styles.providerUnavailableText}>
                {selectedProviderAvailability.message ||
                  "This provider is not available for your selected dates and time. Please adjust your schedule or choose another provider."}
              </Text>
            </View>
          ) : null}

          {bookingTypeCode === "ON_DEMAND" &&
          scheduleReady &&
          bookingCoords &&
          !onDemandAvailability.loading &&
          !onDemandAvailability.available ? (
            <View style={styles.availabilityAlert}>
              <Text style={styles.availabilityAlertText}>
                {onDemandAvailability.message || ON_DEMAND_NO_PROVIDERS_MESSAGE}
              </Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <BookingLocationSection />
          </View>

          {!isCheckoutAuthenticated ? (
            <View style={styles.loginRequiredBanner}>
              <Icon name="info-outline" size={18} color="#1d4ed8" />
              <Text style={styles.loginRequiredText}>
                Sign in to complete your booking and payment.
              </Text>
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.priceLabel}>
              {quotePreview.loading
                ? "Updating price…"
                : walletSplit.wallet_applied > 0
                  ? walletSplit.razorpay_amount <= 0
                    ? t("wallet.checkout.walletAppliedLabel")
                    : t("wallet.checkout.payViaRazorpay")
                  : "Amount payable"}
            </Text>
            {quotePreview.loading ? (
              <ActivityIndicator size="small" color="#0b5bd3" style={{ marginVertical: 4 }} />
            ) : (
              <Text style={styles.priceHero}>{formatInr(displayPayableAmount)}</Text>
            )}
            {walletSplit.wallet_applied > 0 ? (
              <Text style={styles.walletSplitHint}>
                {walletSplit.razorpay_amount <= 0
                  ? t("wallet.checkout.coversFullAmount")
                  : `${t("wallet.checkout.walletAppliedLabel")}: ${formatInr(walletSplit.wallet_applied)} · ${t("wallet.checkout.payViaRazorpay")}: ${formatInr(walletSplit.razorpay_amount)}`}
              </Text>
            ) : null}
            <Text style={styles.priceMeta}>
              {checkoutBlockReason ?? bookingTypeDisplay}
            </Text>
            <View style={styles.couponRow}>
              <View style={styles.couponHeaderRow}>
                <View style={styles.couponTitleWrap}>
                  <Icon name="local-offer" size={16} color="#1d4ed8" />
                  <Text style={styles.couponLabel}>Coupons</Text>
                </View>
                <View style={styles.couponCountPill}>
                  <Text style={styles.couponCountText}>{couponCountLabel}</Text>
                </View>
              </View>
              <Text style={styles.couponHint}>
                {couponLoading
                  ? "Checking available coupons..."
                  : appliedCouponCode
                    ? `Applied: ${appliedCouponCode}`
                    : bestCoupon
                      ? `${couponCountLabel} available · Best: ${bestCoupon.code} (${couponPreview(bestCoupon)})`
                      : couponCountLabel > 0
                        ? `${couponCountLabel} available`
                        : "No coupons available"}
              </Text>
              {!appliedCouponCode && bestCouponSavings > 0 ? (
                <Text style={styles.couponValueText}>
                  Save up to {formatInr(bestCouponSavings)} with best coupon
                </Text>
              ) : null}
              <View style={styles.couponActionsRow}>
                {!appliedCouponCode && bestCoupon ? (
                  <TouchableOpacity
                    onPress={() => applyCouponCode(bestCoupon.code)}
                    style={styles.couponBestAction}
                    disabled={couponLoading}
                  >
                    <Text style={styles.couponBestActionText}>Apply best</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  onPress={() => setCouponModalOpen(true)}
                  style={styles.couponAction}
                  disabled={couponLoading}
                >
                  <Text style={styles.couponActionText}>
                    {appliedCouponCode ? "Change coupon" : "View coupons"}
                  </Text>
                </TouchableOpacity>
                {!appliedCouponCode && bestCoupon ? (
                  <TouchableOpacity
                    onPress={() => {
                      setCouponInput(bestCoupon.code);
                      setCouponModalOpen(true);
                    }}
                    style={styles.couponSecondaryAction}
                    disabled={couponLoading}
                  >
                    <Text style={styles.couponSecondaryActionText}>Details</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
            {appliedCouponCode ? (
              <TouchableOpacity onPress={removeCoupon} style={styles.couponRemoveBtn}>
                <Text style={styles.couponRemoveText}>Remove coupon</Text>
              </TouchableOpacity>
            ) : null}
            {couponInfo ? <Text style={styles.couponInfoText}>{couponInfo}</Text> : null}

            {isCheckoutAuthenticated && walletBalance > 0 ? (
              <TouchableOpacity
                style={styles.walletCard}
                onPress={() => setUseWalletBalance((v) => !v)}
                activeOpacity={0.85}
                disabled={walletLoading || loading}
              >
                <Icon
                  name={useWalletBalance ? "check-box" : "check-box-outline-blank"}
                  size={22}
                  color={useWalletBalance ? "#0b5bd3" : "#94a3b8"}
                />
                <View style={styles.walletCardText}>
                  <Text style={styles.walletCardTitle}>{t("wallet.checkout.useWalletBalance")}</Text>
                  <Text style={styles.walletCardHint}>
                    {t("wallet.checkout.balanceAvailable", {
                      amount: formatInr(walletBalance),
                    })}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : null}

            <PriceBreakdown
              rows={displayBreakdown}
              loading={quotePreview.loading}
              paymentTotals={paymentTotals}
              walletApplied={walletSplit.wallet_applied}
              amountPayable={walletSplit.razorpay_amount}
              walletAppliedLabel={t("wallet.checkout.walletAppliedLabel")}
              walletPayableLabel={t("wallet.checkout.payViaRazorpay")}
            />
          </View>

          <View style={styles.footerInline}>
            <View style={styles.footerActions}>
              <BrandButton variant="ghost" onPress={onClose} flex={0}>
                {t("common.close")}
              </BrandButton>
              {!isCheckoutAuthenticated ? (
                <BrandButton variant="primary" flex={2} onPress={() => onLoginRequired?.()}>
                  Sign in to continue
                </BrandButton>
              ) : needsScheduleAvailabilityCheck ? (
                <BrandButton
                  variant="primary"
                  flex={2}
                  disabled={isCheckingAvailability || loading}
                  loading={isCheckingAvailability}
                  onPress={() => void scheduleSectionRef.current?.checkAvailability()}
                >
                  Check availability
                </BrandButton>
              ) : (
                <BrandButton
                  variant="primary"
                  flex={2}
                  disabled={!canCheckout}
                  loading={loading}
                  onPress={() => void handleCheckout()}
                >
                  {t("common.checkout")}
                </BrandButton>
              )}
            </View>
          </View>
        </ScrollView>
      </View>

      <Modal
        visible={couponModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCouponModalOpen(false)}
      >
        <View style={styles.couponModalOverlay}>
          <View style={styles.couponModalCard}>
            <Text style={styles.couponModalTitle}>Apply Coupon</Text>
            <Text style={styles.couponModalSubTitle}>
              {cfg.serviceType === "COOK"
                ? "Cook offers (e.g. COOK10ALL) appear below. Enter a code if you do not see yours."
                : "Maid offers for this booking. Cook-only codes (e.g. COOK10ALL) apply on Home Cook."}
            </Text>
            {bestCoupon ? (
              <View style={styles.couponRecommendedCard}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.couponRecommendedLabel}>Recommended</Text>
                  <Text style={styles.couponRecommendedCode}>{bestCoupon.code}</Text>
                  <Text style={styles.couponRecommendedMeta}>
                    {couponPreview(bestCoupon)} · Save {formatInr(bestCouponSavings)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.couponRecommendedBtn}
                  onPress={() => applyCouponCode(bestCoupon.code)}
                >
                  <Text style={styles.couponRecommendedBtnText}>
                    {appliedCouponCode === bestCoupon.code ? "Applied" : "Use"}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}
            <TextInput
              value={couponInput}
              onChangeText={setCouponInput}
              autoCapitalize="characters"
              placeholder="Enter coupon code"
              placeholderTextColor="#94a3b8"
              style={styles.couponInput}
            />
            <View style={styles.couponModalActions}>
              <BrandButton
                variant="outline"
                size="small"
                onPress={() => setCouponModalOpen(false)}
              >
                Cancel
              </BrandButton>
              <BrandButton
                size="small"
                onPress={() => applyCouponCode(normalizedCouponInput)}
                disabled={!normalizedCouponInput}
              >
                Apply
              </BrandButton>
            </View>
            {eligibleCoupons.length > 0 ? (
              <>
                <Text style={styles.couponListTitle}>Eligible coupons</Text>
                <ScrollView style={styles.couponList}>
                  {eligibleCoupons.map((coupon) => (
                    <TouchableOpacity
                      key={coupon.code}
                      style={[
                        styles.couponListItem,
                        appliedCouponCode === coupon.code ? styles.couponListItemApplied : null,
                      ]}
                      onPress={() => applyCouponCode(coupon.code)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.couponCode}>{coupon.code}</Text>
                        <Text style={styles.couponMeta}>
                          {couponPreview(coupon)}
                          {coupon.minimumOrderValue
                            ? ` · Min order ${formatInr(coupon.minimumOrderValue)}`
                            : ""}
                        </Text>
                        <Text style={styles.couponSavingsHint}>
                          You save {formatInr(estimateCouponSavings(coupon))}
                        </Text>
                      </View>
                      <Text style={styles.couponUseText}>
                        {appliedCouponCode === coupon.code ? "Applied" : "Use"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            ) : availableCoupons.length > 0 ? (
              <>
                <Text style={styles.couponListTitle}>Available coupons</Text>
                <ScrollView style={styles.couponList}>
                  {availableCoupons.map((coupon) => (
                    <TouchableOpacity
                      key={coupon.code}
                      style={[
                        styles.couponListItem,
                        appliedCouponCode === coupon.code ? styles.couponListItemApplied : null,
                      ]}
                      onPress={() => applyCouponCode(coupon.code)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.couponCode}>{coupon.code}</Text>
                        <Text style={styles.couponMeta}>
                          {couponPreview(coupon)}
                          {coupon.minimumOrderValue
                            ? ` · Min order ${formatInr(coupon.minimumOrderValue)}`
                            : ""}
                        </Text>
                      </View>
                      <Text style={styles.couponUseText}>
                        {appliedCouponCode === coupon.code ? "Applied" : "Use"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            ) : (
              <Text style={styles.couponEmptyText}>
                {couponLoading
                  ? "Loading coupons..."
                  : cfg.serviceType === "COOK"
                    ? "No Cook coupons available. Enter COOK10ALL manually if you have it."
                    : "No Maid coupons for this order."}
              </Text>
            )}
            {ineligibleCoupons.length > 0 ? (
              <>
                <Text style={styles.couponListTitle}>Unavailable for current total</Text>
                <ScrollView style={styles.couponList}>
                  {ineligibleCoupons.map((coupon) => (
                    <View key={coupon.code} style={[styles.couponListItem, styles.couponListItemDisabled]}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.couponCode}>{coupon.code}</Text>
                        <Text style={styles.couponMeta}>
                          Min order {formatInr(Number(coupon.minimumOrderValue || 0))}
                        </Text>
                      </View>
                      <Text style={styles.couponUseTextDisabled}>Locked</Text>
                    </View>
                  ))}
                </ScrollView>
              </>
            ) : null}
          </View>
        </View>
      </Modal>

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
  root: { flex: 1, minHeight: 0, backgroundColor: "#f1f5f9" },
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
  scroll: { flex: 1, minHeight: 0 },
  scrollContent: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 20 },
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
  availabilityAlert: {
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
  },
  availabilityAlertText: {
    fontSize: 13,
    color: "#991b1b",
    lineHeight: 18,
  },
  couponRow: {
    marginTop: 10,
    marginBottom: 6,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dbeafe",
    backgroundColor: "#f8fbff",
    gap: 8,
  },
  couponHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  couponTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  couponLabel: { fontSize: 12, fontWeight: "700", color: "#334155" },
  couponHint: { fontSize: 12, color: "#64748b", lineHeight: 17 },
  couponValueText: { fontSize: 12, color: "#047857", fontWeight: "600" },
  couponCountPill: {
    minWidth: 24,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "#dbeafe",
    alignItems: "center",
  },
  couponCountText: { fontSize: 11, fontWeight: "700", color: "#1d4ed8" },
  couponActionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
  },
  couponAction: {
    borderWidth: 1,
    borderColor: "#93c5fd",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#eff6ff",
  },
  couponActionText: { fontSize: 12, fontWeight: "700", color: "#1d4ed8" },
  couponSecondaryAction: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#f8fafc",
  },
  couponSecondaryActionText: { fontSize: 12, fontWeight: "700", color: "#475569" },
  couponBestAction: {
    borderWidth: 1,
    borderColor: "#10b981",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#ecfdf5",
  },
  couponBestActionText: { fontSize: 12, fontWeight: "700", color: "#047857" },
  couponRemoveBtn: { alignSelf: "flex-start", marginBottom: 6 },
  couponRemoveText: { fontSize: 12, color: "#b91c1c", fontWeight: "600" },
  couponInfoText: { fontSize: 12, color: "#0369a1", marginBottom: 4 },
  walletCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dbeafe",
    backgroundColor: "#f8fbff",
  },
  walletCardText: { flex: 1 },
  walletCardTitle: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  walletCardHint: { fontSize: 12, color: "#64748b", marginTop: 2, lineHeight: 17 },
  walletSplitHint: {
    fontSize: 12,
    color: "#0369a1",
    marginTop: 6,
    lineHeight: 17,
  },
  couponModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.45)",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  couponModalCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    maxHeight: SCREEN_HEIGHT * 0.72,
  },
  couponModalTitle: { fontSize: 17, fontWeight: "700", color: "#0f172a", marginBottom: 10 },
  couponModalSubTitle: { fontSize: 12, color: "#64748b", marginBottom: 8 },
  couponRecommendedCard: {
    borderWidth: 1,
    borderColor: "#86efac",
    backgroundColor: "#f0fdf4",
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  couponRecommendedLabel: { fontSize: 11, color: "#047857", fontWeight: "700" },
  couponRecommendedCode: { fontSize: 14, color: "#064e3b", fontWeight: "800", marginTop: 2 },
  couponRecommendedMeta: { fontSize: 12, color: "#065f46", marginTop: 2 },
  couponRecommendedBtn: {
    borderWidth: 1,
    borderColor: "#10b981",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "#ecfdf5",
  },
  couponRecommendedBtnText: { fontSize: 12, color: "#047857", fontWeight: "700" },
  couponInput: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0f172a",
    marginBottom: 10,
  },
  couponModalActions: { flexDirection: "row", gap: 8, marginBottom: 10 },
  couponListTitle: { fontSize: 13, fontWeight: "700", color: "#334155", marginBottom: 8 },
  couponList: { maxHeight: 220 },
  couponListItem: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
    gap: 8,
  },
  couponListItemApplied: {
    borderColor: "#60a5fa",
    backgroundColor: "#eff6ff",
  },
  couponListItemDisabled: {
    opacity: 0.7,
    backgroundColor: "#f8fafc",
  },
  couponCode: { fontSize: 13, fontWeight: "700", color: "#0f172a" },
  couponMeta: { fontSize: 12, color: "#64748b", marginTop: 2 },
  couponSavingsHint: { fontSize: 11, color: "#047857", marginTop: 3, fontWeight: "600" },
  couponUseText: { fontSize: 12, color: "#1d4ed8", fontWeight: "700" },
  couponUseTextDisabled: { fontSize: 12, color: "#94a3b8", fontWeight: "700" },
  couponEmptyText: { fontSize: 12, color: "#64748b", marginTop: 2 },
  footer: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexShrink: 0,
  },
  footerInline: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  footerActions: { flexDirection: "row", gap: 8, alignItems: "center" },
  loginRequiredBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    backgroundColor: "#eff6ff",
  },
  loginRequiredText: {
    flex: 1,
    fontSize: 13,
    color: "#1e40af",
    lineHeight: 18,
  },
  providerUnavailableBanner: {
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
  },
  providerUnavailableText: { fontSize: 13, color: "#991b1b", lineHeight: 18 },
});

export default ServiceBookingFlow;
