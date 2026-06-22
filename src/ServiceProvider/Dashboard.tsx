// Dashboard.tsx (Modern Redesign with Gradient Effects)
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  RefreshControl,
  Modal,
  Linking,
  BackHandler,
  Platform,
  Animated,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import TodayVisitsCard, { TodayBookingSlot } from './TodayVisitsCard';
import { useAuth0 } from 'react-native-auth0';
import { AllBookingsDialog } from './AllBookingsDialog';
import { getServiceTitle } from '../common/BookingUtils';
import { ReviewsDialog } from './ReviewDialog';
import axios, { AxiosResponse } from 'axios';
import PaymentInstance from '../services/paymentInstance';
import providerInstance from '../services/providerInstance';
import { useAppUser } from '../context/AppUserContext';
import { BRAND, HOME_HERO_GRADIENT, HOME_M3 } from '../theme/brandColors';
import HomeHeroChrome from '../HomePage/HomeHeroChrome';
import { OtpVerificationDialog } from './OtpVerificationDialog';
import WithdrawalDialog from './WithdrawalDialog';
import { WithdrawalHistoryDialog } from './WithdrawalHistoryDialog';
import TrackAddress from './TrackAddress';

// Types for API response
interface CustomerHoliday {
  id: number;
  customerId: number;
  applyHolidayDate: string;
  start_date: string;
  endDate: string;
  service_type: string;
  active: boolean;
}

interface ServiceProviderLeave {
  id: number;
  serviceProviderId: number;
  applyLeaveDate: string;
  start_date: string;
  endDate: string;
  service_type: string;
  active: boolean;
}

interface ResponsibilityTask {
  taskType: string;
  persons?: number;
  [key: string]: any;
}

interface ResponsibilityAddOn {
  [key: string]: any;
}

interface Responsibilities {
  tasks?: ResponsibilityTask[];
  add_ons?: ResponsibilityAddOn[];
}

export interface Booking {
  id: number;
  serviceProviderId: number;
  customerId: number;
  start_date: string;
  endDate: string;
  engagements: string;
  timeslot: string;
  monthlyAmount: number;
  paymentMode: string;
  booking_type: string;
  service_type: string;
  bookingDate: string;
  responsibilities: Responsibilities;
  housekeepingRole: string | null;
  mealType: string | null;
  noOfPersons: number | null;
  experience: string | null;
  childAge: number | null;
  customerName: string;
  serviceProviderName: string;
  address: string | null;
  taskStatus: string;
  modifiedBy: string;
  modifiedDate: string;
  availableTimeSlots: string | null;
  customerHolidays: CustomerHoliday[];
  serviceProviderLeaves: ServiceProviderLeave[];
  active: boolean;
  clientName: string;
  service: string;
  date: string;
  time: string;
  location: string;
  status: string;
  amount: string;
  bookingData: any;
}

export interface BookingHistoryResponse {
  current: Booking[];
  upcoming?: any[];
  past: Booking[];
}

export interface ProviderPayoutResponse {
  success: boolean;
  serviceproviderid: string;
  month: string | null;
  summary: PayoutSummary;
  payouts: Payout[];
}

export interface PayoutSummary {
  total_earned: number;
  total_withdrawn: number;
  available_to_withdraw: number;
  security_deposit_paid: boolean;
  security_deposit_amount: number;
}

export interface Payout {
  payout_id: string;
  engagement_id: string;
  gross_amount: number;
  provider_fee: number;
  tds_amount: number;
  net_amount: number;
  payout_mode: string | null;
  status: string;
  created_at: string;
}

// Function to handle calling customer
const handleCallCustomer = (phoneNumber: string, clientName: string) => {
  if (!phoneNumber || phoneNumber === "Contact info not available") {
    Alert.alert("No Contact Info", "Contact information is not available for this customer.");
    return;
  }
  
  const telLink = `tel:${phoneNumber}`;
  Linking.openURL(telLink).catch(() => {
    Alert.alert("Error", "Unable to make the call. Please try again.");
  });
};

// Get current month and year in "YYYY-MM" format
const getCurrentMonthYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
};

function QuickActionRow({
  icon,
  iconBg,
  label,
  subtitle,
  onPress,
  isLast = false,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.quickActionRow, isLast && styles.quickActionRowLast]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={styles.quickActionTextCol}>
        <Text style={styles.quickActionLabel}>{label}</Text>
        {subtitle ? <Text style={styles.quickActionSubtitle}>{subtitle}</Text> : null}
      </View>
      <MaterialIcon name="chevron-right" size={22} color="#94a3b8" />
    </TouchableOpacity>
  );
}

interface DashboardProps {
  onBackToHome?: () => void;
  onLogoPress?: () => void;
  closeDropdowns?: boolean;
}

export default function Dashboard({ onBackToHome, onLogoPress, closeDropdowns = false }: DashboardProps) {
  const { user: auth0User } = useAuth0();
  const { appUser } = useAppUser();
  const [bookings, setBookings] = useState<BookingHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [serviceProviderId, setServiceProviderId] = useState<number | null>(null);
  const [showAllBookings, setShowAllBookings] = useState(false);
  const [reviewsDialogOpen, setReviewsDialogOpen] = useState(false);
  const [payout, setPayout] = useState<ProviderPayoutResponse | null>(null);
  const [taskStatus, setTaskStatus] = useState<Record<string, "IN_PROGRESS" | "COMPLETED" | undefined>>({});
  const [taskStatusUpdating, setTaskStatusUpdating] = useState<Record<string, boolean>>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<any>(null);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [withdrawalHistoryDialogOpen, setWithdrawalHistoryDialogOpen] = useState(false);
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);
  
  const [trackAddressDialogOpen, setTrackAddressDialogOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [todaySchedule, setTodaySchedule] = useState<TodayBookingSlot[]>([]);
  const [providerDisplayName, setProviderDisplayName] = useState("");

  const verificationCompletedRef = useRef(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Handle back button press
  const handleBackPress = () => {
    if (showAllBookings) {
      setShowAllBookings(false);
      return true;
    }
    if (reviewsDialogOpen) {
      setReviewsDialogOpen(false);
      return true;
    }
    if (otpDialogOpen) {
      setOtpDialogOpen(false);
      setCurrentBooking(null);
      return true;
    }
    if (withdrawalHistoryDialogOpen) {
      setWithdrawalHistoryDialogOpen(false);
      return true;
    }
    if (withdrawalDialogOpen) {
      setWithdrawalDialogOpen(false);
      return true;
    }
    if (trackAddressDialogOpen) {
      setTrackAddressDialogOpen(false);
      return true;
    }
    if (onBackToHome) {
      onBackToHome();
      return true;
    }
    return false;
  };

  // Set up hardware back button listener
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [
    onBackToHome,
    showAllBookings,
    reviewsDialogOpen,
    otpDialogOpen,
    withdrawalHistoryDialogOpen,
    withdrawalDialogOpen,
    trackAddressDialogOpen
  ]);

  // Check if user is authenticated
  useEffect(() => {
    setIsAuthenticated(!!auth0User);
  }, [auth0User]);

  // Extract name and serviceProviderId from Auth0 user and AppUser context
  useEffect(() => {
    if (isAuthenticated && auth0User) {
      const id = appUser?.serviceProviderId 
        ? Number(appUser.serviceProviderId)
        : auth0User.serviceProviderId || auth0User["https://yourdomain.com/serviceProviderId"] || null;

      setServiceProviderId(id ? Number(id) : null);

      const fallbackName =
        [appUser?.firstName, appUser?.lastName].filter(Boolean).join(" ").trim() ||
        appUser?.name ||
        auth0User.given_name ||
        auth0User.name ||
        "";
      if (fallbackName) setProviderDisplayName(String(fallbackName).trim());
    }
  }, [isAuthenticated, auth0User, appUser]);

  useEffect(() => {
    if (!serviceProviderId) return;
    let cancelled = false;
    providerInstance
      .get(`/api/service-providers/serviceprovider/${serviceProviderId}`)
      .then((response) => {
        if (cancelled) return;
        const data = (response?.data?.data ?? response?.data) as Record<string, unknown> | null;
        const name = [data?.firstName ?? data?.firstname, data?.lastName ?? data?.lastname]
          .filter(Boolean)
          .join(" ")
          .trim();
        if (name) setProviderDisplayName(name);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [serviceProviderId]);

  const availableBalance = payout?.summary?.available_to_withdraw ?? 0;

  const formatInr = (amount: number) => {
    const abs = Math.abs(amount);
    const hasFraction = Math.abs(amount - Math.trunc(amount)) > 0.001;
    const formatted = abs.toLocaleString("en-IN", {
      minimumFractionDigits: hasFraction ? 2 : 0,
      maximumFractionDigits: 2,
    });
    return amount < 0 ? `-₹${formatted}` : `₹${formatted}`;
  };

  const bookingPreviewCount =
    (bookings?.current?.length ?? 0) +
    (bookings?.upcoming?.length ?? 0) +
    (bookings?.past?.length ?? 0);

  const handleTrackAddress = (address: string) => {
    if (!address || address === "Address not available") {
      Alert.alert("No Address", "Address is not provided for this booking.");
      return;
    }
    setSelectedAddress(address);
    setTrackAddressDialogOpen(true);
  };

  // Fetch data function
  const fetchData = async () => {
    if (!serviceProviderId) return;

    try {
      setLoading(true);
      const currentMonthYear = getCurrentMonthYear();

      const [payoutResponse, response, todayRes] = await Promise.all([
        PaymentInstance.get(
          `/api/service-providers/${serviceProviderId}/payouts?month=${currentMonthYear}&detailed=true`
        ),
        PaymentInstance.get(
          `/api/service-providers/${serviceProviderId}/engagements?month=${currentMonthYear}`
        ),
        PaymentInstance.get(
          `/api/service-providers/${serviceProviderId}/today-bookings`
        ).catch(() => ({ data: { bookings: [] as TodayBookingSlot[] } })),
      ]);

      setPayout(payoutResponse.data);

      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: BookingHistoryResponse = response.data;
      setBookings(data);
      const slots = (todayRes as AxiosResponse<{ bookings?: TodayBookingSlot[] }>)?.data?.bookings;
      setTodaySchedule(Array.isArray(slots) ? slots : []);

    } catch (err) {
      setTodaySchedule([]);
      Alert.alert("Error", "Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (otpDialogOpen) verificationCompletedRef.current = false;
  }, [otpDialogOpen]);

  useEffect(() => {
    if (serviceProviderId) fetchData();
  }, [serviceProviderId]);

  useEffect(() => {
    if (!verifyingOtp && verificationCompletedRef.current) {
      const timer = setTimeout(() => handleCloseOtpDialog(), 500);
      return () => clearTimeout(timer);
    }
  }, [verifyingOtp]);

  const handleWithdrawalSuccess = async () => {
    if (serviceProviderId) {
      try {
        const currentMonthYear = getCurrentMonthYear();
        const payoutResponse: AxiosResponse<ProviderPayoutResponse> = await PaymentInstance.get(
          `/api/service-providers/${serviceProviderId}/payouts?month=${currentMonthYear}&detailed=true`
        );
        setPayout(payoutResponse.data);
        Alert.alert("Success", "Withdrawal request submitted successfully!");
      } catch (error) {
        console.error("Failed to refresh balance:", error);
        Alert.alert("Error", "Failed to refresh balance. Please try again.");
      }
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleStartTask = async (bookingId: string, bookingData: any) => {
    if (!bookingId || !bookingData) return;

    const serviceDayId = bookingData.today_service?.service_day_id;
    if (!serviceDayId) {
      Alert.alert("Error", "Service day ID not found. Please contact support.");
      return;
    }

    const previousStatus = taskStatus[bookingId];

    setTaskStatus(prev => ({ ...prev, [bookingId]: "IN_PROGRESS" }));
    setTaskStatusUpdating(prev => ({ ...prev, [bookingId]: true }));

    try {
      await PaymentInstance.post(
        `/api/engagement-service/service-days/${serviceDayId}/start`,
        {},
        { 
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          } 
        }
      );

      Alert.alert("Success", "Task started successfully!");
      await fetchData();
    } catch (err) {
      setTaskStatus(prev => ({ ...prev, [bookingId]: previousStatus }));
      let errorMessage = "Failed to start service. Please try again.";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || err.message || errorMessage;
      }
      Alert.alert("Error", errorMessage);
    } finally {
      setTaskStatusUpdating(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const handleStartTodayVisit = async (b: TodayBookingSlot) => {
    const bookingId = String(b.engagement_id);
    let serviceDayId = b.service_day_id != null ? Number(b.service_day_id) : null;
    if (serviceDayId == null || !Number.isFinite(serviceDayId)) {
      try {
        const { data } = await PaymentInstance.get(
          `/api/engagement-service/engagements/${b.engagement_id}/service-days/today`
        );
        const row = data?.service_day as { service_day_id?: number | string } | undefined;
        if (row?.service_day_id != null) {
          const n = Number(row.service_day_id);
          if (Number.isFinite(n) && n > 0) serviceDayId = n;
        }
      } catch {
        // no row for today
      }
    }
    if (serviceDayId == null) {
      Alert.alert(
        "Can't start this visit",
        "No service day was found for today. Wait a moment and pull to refresh."
      );
      return;
    }
    await handleStartTask(bookingId, {
      today_service: { service_day_id: serviceDayId },
    });
  };

  const handleStopTask = async (bookingId: string, bookingData: any) => {
    setCurrentBooking({ bookingId, bookingData });
    setOtpDialogOpen(true);
  };

  const handleVerifyOtp = async (otp: string) => {
    if (!currentBooking) return;

    const serviceDayId = currentBooking.bookingData.today_service?.service_day_id;
    if (!serviceDayId) {
      Alert.alert("Error", "Service day ID not found. Please contact support.");
      return Promise.reject(new Error("Service day ID not found"));
    }

    setVerifyingOtp(true);

    try {
      await PaymentInstance.post(
        `/api/engagement-service/service-days/${serviceDayId}/complete`,
        { otp },
        { 
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          } 
        }
      );

      setTaskStatus(prev => ({ ...prev, [currentBooking.bookingId]: "COMPLETED" }));
      await fetchData();
      verificationCompletedRef.current = true;
      return Promise.resolve();
    } catch (err) {
      verificationCompletedRef.current = false;
      return Promise.reject(err);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleCloseOtpDialog = () => {
    setOtpDialogOpen(false);
    setCurrentBooking(null);
  };


  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={BRAND.bookingSky}
            colors={[BRAND.bookingSky]}
          />
        }
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={[...HOME_HERO_GRADIENT]} style={styles.heroGradient}>
          <HomeHeroChrome closeDropdowns={closeDropdowns} onLogoPress={onLogoPress} />

          <Animated.View
            style={[
              styles.heroBody,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text style={styles.heroEyebrow}>Namaste,</Text>
            <Text style={styles.heroPageTitle}>{providerDisplayName || "Guest"}</Text>
          </Animated.View>
        </LinearGradient>

        <View style={styles.contentSheet}>
          <TodayVisitsCard
            loading={loading}
            todaySchedule={todaySchedule}
            taskStatusUpdating={taskStatusUpdating}
            onCallCustomer={handleCallCustomer}
            onTrackAddress={handleTrackAddress}
            onStartTodayVisit={handleStartTodayVisit}
            onStopTask={handleStopTask}
          />

          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsCard}>
            {[
              {
                key: "bookings",
                iconBg: BRAND.accentSoft,
                icon: <MaterialIcon name="smartphone" size={20} color={BRAND.accent} />,
                label: "View all bookings",
                subtitle:
                  bookingPreviewCount > 0
                    ? `${bookingPreviewCount} booking${bookingPreviewCount !== 1 ? "s" : ""} this month`
                    : "Browse current, upcoming & past",
                onPress: () => setShowAllBookings(true),
              },
              {
                key: "withdraw",
                iconBg: "#ecfdf5",
                icon: <MaterialIcon name="account-balance-wallet" size={20} color="#059669" />,
                label: "Request withdrawal",
                subtitle:
                  availableBalance >= 500
                    ? `${formatInr(availableBalance)} available`
                    : availableBalance < 0
                      ? "Balance is negative"
                      : "Minimum ₹500 required",
                onPress: () => setWithdrawalDialogOpen(true),
              },
              {
                key: "history",
                iconBg: BRAND.accentSoft,
                icon: <MaterialIcon name="history" size={20} color={BRAND.accent} />,
                label: "Withdrawal history",
                subtitle: "Earnings, withdrawals & payouts",
                onPress: () => setWithdrawalHistoryDialogOpen(true),
              },
              {
                key: "reviews",
                iconBg: "#fee2e2",
                icon: <MaterialIcon name="star" size={20} color="#dc2626" />,
                label: "View reviews",
                onPress: () => setReviewsDialogOpen(true),
              },
              {
                key: "leave",
                iconBg: "#e0e7ff",
                icon: <MaterialIcon name="event-busy" size={20} color="#4f46e5" />,
                label: "Apply leave",
                onPress: () => Alert.alert("Apply leave", "Use the web dashboard to apply for leave."),
              },
            ].map((action, index, list) => (
              <QuickActionRow
                key={action.key}
                iconBg={action.iconBg}
                icon={action.icon}
                label={action.label}
                subtitle={action.subtitle}
                onPress={action.onPress}
                isLast={index === list.length - 1}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Dialogs */}
      <ReviewsDialog
        visible={reviewsDialogOpen}
        onClose={() => setReviewsDialogOpen(false)}
        serviceProviderId={serviceProviderId}
      />

      <AllBookingsDialog
        visible={showAllBookings}
        onClose={() => setShowAllBookings(false)}
        bookings={bookings}
        serviceProviderId={serviceProviderId}
        onContactClient={() => {}}
        trigger={undefined}
      />

      <OtpVerificationDialog
        open={otpDialogOpen}
        onOpenChange={setOtpDialogOpen}
        onVerify={handleVerifyOtp}
        verifying={verifyingOtp}
        bookingInfo={currentBooking ? {
          clientName: currentBooking.bookingData?.firstname || currentBooking.bookingData?.customerName,
          service: getServiceTitle(currentBooking.bookingData?.service_type || currentBooking.bookingData?.serviceType),
          bookingId: currentBooking.bookingData?.engagement_id || currentBooking.bookingData?.id,
        } : undefined}
      />

      <WithdrawalHistoryDialog
        visible={withdrawalHistoryDialogOpen}
        onClose={() => setWithdrawalHistoryDialogOpen(false)}
        serviceProviderId={serviceProviderId}
      />

      <WithdrawalDialog
        open={withdrawalDialogOpen}
        onOpenChange={setWithdrawalDialogOpen}
        serviceProviderId={serviceProviderId}
        availableBalance={payout?.summary?.available_to_withdraw || 0}
        onWithdrawalSuccess={handleWithdrawalSuccess}
      />

      <Modal
        visible={trackAddressDialogOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setTrackAddressDialogOpen(false)}
      >
        <TrackAddress
          onClose={() => {
            setTrackAddressDialogOpen(false);
            setSelectedAddress("");
          }}
          destinationAddress={selectedAddress || undefined}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: HOME_M3.surface,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  heroGradient: {
    paddingBottom: 36,
    overflow: "visible",
  },
  heroBody: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  heroEyebrow: {
    color: HOME_M3.onPrimaryContainer,
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  heroPageTitle: {
    color: HOME_M3.onPrimary,
    fontSize: 32,
    fontWeight: "800",
    lineHeight: 38,
    letterSpacing: -0.6,
  },
  contentSheet: {
    backgroundColor: HOME_M3.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -18,
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 24,
    minHeight: 400,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: HOME_M3.onSurface,
    letterSpacing: -0.3,
    marginBottom: 12,
    lineHeight: 26,
  },
  quickActionsCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e8edf4",
    overflow: "hidden",
    marginBottom: 24,
  },
  quickActionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  quickActionRowLast: {
    borderBottomWidth: 0,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  quickActionTextCol: {
    flex: 1,
  },
  quickActionLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: HOME_M3.onSurface,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: HOME_M3.onSurfaceVariant,
    marginTop: 2,
    fontWeight: "500",
  },
});