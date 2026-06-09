// Dashboard.tsx (Modern Redesign with Gradient Effects)
import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  RefreshControl,
  SafeAreaView,
  Modal,
  Linking,
  Image,
  BackHandler,
  Platform,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { DashboardMetricCard, METRIC_CARD_WIDTH } from './DashboardMetricCard';
import TodayVisitsCard, { TodayBookingSlot } from './TodayVisitsCard';
import { useAuth0 } from 'react-native-auth0';
import { AllBookingsDialog } from './AllBookingsDialog';
import { getServiceTitle } from '../common/BookingUtils';
import { ReviewsDialog } from './ReviewDialog';
import axios, { AxiosResponse } from 'axios';
import PaymentInstance from '../services/paymentInstance';
import { useAppUser } from '../context/AppUserContext';
import { useTheme } from '../Settings/ThemeContext';
import { BRAND, GRADIENTS, PRIMARY_BUTTON_GRADIENT } from '../theme/brandColors';
import ProviderCalendarBig from './ProviderCalendarBig';
import { OtpVerificationDialog } from './OtpVerificationDialog';
import WithdrawalDialog from './WithdrawalDialog';
import { WithdrawalHistoryDialog } from './WithdrawalHistoryDialog';
import TrackAddress from './TrackAddress';

const { width, height } = Dimensions.get('window');

// Google Maps API Key
const GOOGLE_MAPS_API_KEY = 'AIzaSyBWoIIAX-gE7fvfAkiquz70WFgDaL7YXSk';

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

// Modern Card Component
const Card = ({ style, children, gradient = false }: { style?: any; children: React.ReactNode; gradient?: boolean }) => {
  if (gradient) {
    return (
      <LinearGradient
        colors={['#ffffff', '#f8fafc']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          {
            borderRadius: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 4,
            marginBottom: 16,
          },
          style,
        ]}
      >
        {children}
      </LinearGradient>
    );
  }
  
  return (
    <View
      style={[
        {
          backgroundColor: '#FFFFFF',
          borderRadius: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.06,
          shadowRadius: 10,
          elevation: 3,
          marginBottom: 16,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

// Modern Badge Component
const Badge = ({ 
  variant = 'default', 
  style, 
  children 
}: { 
  variant?: 'default' | 'secondary' | 'destructive' | 'success' | 'primary' | 'outline' | 'warning';
  style?: any;
  children: React.ReactNode;
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: 'rgba(59, 130, 246, 0.12)',
        };
      case 'destructive':
        return {
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
        };
      case 'success':
        return {
          backgroundColor: '#10b981',
        };
      case 'primary':
        return {
          backgroundColor: '#3b82f6',
        };
      case 'warning':
        return {
          backgroundColor: '#f59e0b',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: '#cbd5e1',
        };
      default:
        return {
          backgroundColor: '#f1f5f9',
        };
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'success':
      case 'primary':
      case 'warning':
        return '#ffffff';
      case 'destructive':
        return '#dc2626';
      case 'outline':
        return '#475569';
      default:
        return '#1e293b';
    }
  };

  return (
    <View
      style={[
        {
          borderRadius: 10,
          paddingHorizontal: 10,
          paddingVertical: 5,
          alignSelf: 'flex-start',
        },
        getVariantStyle(),
        style,
      ]}
    >
      {typeof children === 'string' ? (
        <Text
          style={{
            fontSize: 11,
            fontWeight: '600',
            color: getTextColor(),
          }}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
};

// Modern Quick Action Row
function QuickActionRow({
  icon,
  iconBg,
  label,
  subtitle,
  onPress,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity 
        style={styles.quickActionRow} 
        onPress={onPress} 
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: iconBg }]}>{icon}</View>
        <View style={styles.quickActionTextCol}>
          <Text style={styles.quickActionLabel}>{label}</Text>
          {subtitle ? <Text style={styles.quickActionSubtitle}>{subtitle}</Text> : null}
        </View>
        <MaterialIcon name="chevron-right" size={20} color="#94a3b8" />
      </TouchableOpacity>
    </Animated.View>
  );
}

interface DashboardProps {
  onProfilePress: () => void;
  onBackToHome?: () => void;
}

export default function Dashboard({ onProfilePress, onBackToHome }: DashboardProps) {
  const { user: auth0User } = useAuth0();
  const { appUser } = useAppUser();
  const { colors } = useTheme();
  const [bookings, setBookings] = useState<BookingHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
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
  const [calendarRefresh, setCalendarRefresh] = useState(0);

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
      const name = appUser?.name || auth0User.name || null;
      const id = appUser?.serviceProviderId 
        ? Number(appUser.serviceProviderId)
        : auth0User.serviceProviderId || auth0User["https://yourdomain.com/serviceProviderId"] || null;

      setUserName(name);
      setServiceProviderId(id ? Number(id) : null);
    }
  }, [isAuthenticated, auth0User, appUser]);

  const availableBalance = payout?.summary?.available_to_withdraw ?? 0;
  const depositPaid = Boolean(payout?.summary?.security_deposit_paid);

  const formatInr = (amount: number) => {
    const abs = Math.abs(amount);
    const hasFraction = Math.abs(amount - Math.trunc(amount)) > 0.001;
    const formatted = abs.toLocaleString("en-IN", {
      minimumFractionDigits: hasFraction ? 2 : 0,
      maximumFractionDigits: 2,
    });
    return amount < 0 ? `-₹${formatted}` : `₹${formatted}`;
  };

  const metrics = [
    {
      title: "Total Earnings",
      value: formatInr(payout?.summary?.total_earned ?? 0),
      icon: "rupee" as const,
      variant: "earnings" as const,
      hint: "This month",
      hintVariant: "default" as const,
    },
    {
      title: "Security Deposit",
      value: formatInr(payout?.summary?.security_deposit_amount ?? 0),
      icon: "shield" as const,
      variant: "deposit" as const,
      hint: depositPaid ? "Paid" : "Pending",
      hintVariant: depositPaid ? ("success" as const) : ("warning" as const),
    },
    {
      title: "Total Withdrawn",
      value: formatInr(payout?.summary?.total_withdrawn ?? 0),
      icon: "credit-card" as const,
      variant: "withdrawn" as const,
      hint: "All time",
      hintVariant: "default" as const,
    },
    {
      title: "Available Balance",
      value: formatInr(availableBalance),
      icon: "wallet" as const,
      variant: "balance" as const,
      hint: availableBalance < 0 ? "Negative" : "Net available",
      hintVariant: availableBalance < 0 ? ("danger" as const) : ("default" as const),
      valueTone: availableBalance < 0 ? ("negative" as const) : ("default" as const),
    },
  ];

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

  // Close dialog when verification completes successfully
  useEffect(() => {
    if (!verifyingOtp && otpDialogOpen && currentBooking) {
      const timer = setTimeout(() => handleCloseOtpDialog(), 500);
      return () => clearTimeout(timer);
    }
  }, [verifyingOtp, otpDialogOpen, currentBooking]);

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

  const userDisplayName = userName || auth0User?.name || "Guest";
  const welcomeName = (() => {
    const raw = userDisplayName.trim();
    if (!raw) return "there";
    if (raw.includes("@")) return raw.split("@")[0] || "there";
    return raw.split(/\s+/)[0] || "there";
  })();
  const avatarUrl = (appUser?.picture as string) || (auth0User?.picture as string) || null;
  const userInitials = userDisplayName
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "SP";

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Good Morning" : currentHour < 17 ? "Good Afternoon" : "Good Evening";

  const bookingPreviewCount =
    (bookings?.current?.length ?? 0) +
    (bookings?.upcoming?.length ?? 0) +
    (bookings?.past?.length ?? 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={BRAND.bookingNavy}
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
        <LinearGradient
          colors={[...GRADIENTS.bookingHeader]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradientHeader}
        >
          <View style={styles.headerTop}>
            <View style={styles.headerTitleBlock}>
              <Text style={styles.headerEyebrow}>Service Provider</Text>
              <Text style={styles.headerTitle}>Dashboard</Text>
            </View>
            <TouchableOpacity style={styles.profileButton} onPress={onProfilePress}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <LinearGradient
                  colors={[...PRIMARY_BUTTON_GRADIENT]}
                  style={styles.avatarFallback}
                >
                  <Text style={styles.avatarInitials}>{userInitials}</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
          </View>

          <Animated.View style={[styles.heroSection, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.heroGreeting}>{greeting}</Text>
            <Text style={styles.heroTitle}>Welcome back, {welcomeName}!</Text>
            <Text style={styles.heroSubtitle}>
              Track earnings, manage today's visits, and stay on top of your schedule.
            </Text>
          </Animated.View>
        </LinearGradient>

        <View style={styles.mainContent}>
          <View style={styles.metricsGrid}>
            {metrics.map((metric, index) => (
              <DashboardMetricCard key={metric.title} {...metric} />
            ))}
          </View>

          {/* Today's Schedule Card */}
          <TodayVisitsCard
            loading={loading}
            todaySchedule={todaySchedule}
            taskStatusUpdating={taskStatusUpdating}
            onCallCustomer={handleCallCustomer}
            onTrackAddress={handleTrackAddress}
            onStartTodayVisit={handleStartTodayVisit}
            onStopTask={handleStopTask}
          />

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Card gradient>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Quick Actions</Text>
                <MaterialIcon name="bolt" size={20} color="#3b82f6" />
              </View>
              <View style={styles.cardContent}>
                <QuickActionRow
                  iconBg={BRAND.accentSoft}
                  icon={<MaterialIcon name="calendar-month" size={18} color={BRAND.accent} />}
                  label="View all bookings"
                  subtitle={
                    bookingPreviewCount > 0
                      ? `${bookingPreviewCount} booking${bookingPreviewCount !== 1 ? "s" : ""} this month`
                      : "Browse current, upcoming & past"
                  }
                  onPress={() => setShowAllBookings(true)}
                />
                <QuickActionRow
                  iconBg="#ecfdf5"
                  icon={<MaterialIcon name="account-balance-wallet" size={18} color="#059669" />}
                  label="Request withdrawal"
                  subtitle={
                    availableBalance >= 500
                      ? `${formatInr(availableBalance)} available`
                      : availableBalance < 0
                        ? "Balance is negative"
                        : "Minimum ₹500 required"
                  }
                  onPress={() => setWithdrawalDialogOpen(true)}
                />
                <QuickActionRow
                  iconBg={BRAND.accentSoft}
                  icon={<MaterialIcon name="receipt-long" size={18} color={BRAND.accent} />}
                  label="Withdrawal history"
                  subtitle="Earnings, withdrawals & payouts"
                  onPress={() => setWithdrawalHistoryDialogOpen(true)}
                />
                <QuickActionRow
                  iconBg="#fee2e2"
                  icon={<MaterialIcon name="star" size={18} color="#dc2626" />}
                  label="View reviews"
                  onPress={() => setReviewsDialogOpen(true)}
                />
                <QuickActionRow
                  iconBg="#e0e7ff"
                  icon={<MaterialIcon name="calendar-today" size={18} color="#4f46e5" />}
                  label="Apply leave"
                  onPress={() => Alert.alert("Apply leave", "Use the web dashboard to apply for leave.")}
                />
              </View>
            </Card>

            {/* Service Status Card */}
            {/* <Card gradient>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Service Status</Text>
                <MaterialIcon name="check-circle" size={20} color="#10b981" />
              </View>
              <View style={styles.cardContent}>
                <View style={styles.statusItem}>
                  <Text style={styles.statusLabel}>Profile Status</Text>
                  <Badge variant="success">Active</Badge>
                </View>
                <View style={styles.statusItem}>
                  <Text style={styles.statusLabel}>Verification</Text>
                  <Badge variant="success">Verified</Badge>
                </View>
                <View style={styles.statusItem}>
                  <Text style={styles.statusLabel}>Availability</Text>
                  <Badge variant="primary">Available Today</Badge>
                </View>
                <View style={styles.statusItem}>
                  <Text style={styles.statusLabel}>Completed Tasks</Text>
                  <Badge variant="warning">12 This Week</Badge>
                </View>
              </View>
            </Card> */}
          </View>

          {/* Calendar Section */}
          {serviceProviderId !== null && (
            <View style={styles.calendarContainer}>
              <LinearGradient
                colors={['#ffffff', '#f8fafc']}
                style={styles.calendarHeader}
              >
                <MaterialIcon name="event" size={20} color="#3b82f6" />
                <Text style={styles.calendarTitle}>Schedule Calendar</Text>
              </LinearGradient>
              <ProviderCalendarBig
                providerId={serviceProviderId}
                refreshToken={calendarRefresh}
              />
            </View>
          )}
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
        transparent={true}
        animationType="slide"
        onRequestClose={() => setTrackAddressDialogOpen(false)}
      >
        <TrackAddress
          onClose={() => {
            setTrackAddressDialogOpen(false);
            setSelectedAddress("");
          }}
          googleMapsApiKey={GOOGLE_MAPS_API_KEY}
          destinationAddress={selectedAddress || undefined}
        />
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  gradientHeader: {
    paddingTop: Platform.OS === "android" ? 8 : 4,
    paddingBottom: 36,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitleBlock: {
    flex: 1,
    paddingRight: 12,
  },
  headerEyebrow: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.65)",
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.4,
  },
  profileButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: "hidden",
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  avatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  heroSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  heroGreeting: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.72)",
    lineHeight: 19,
    maxWidth: "92%",
  },
  mainContent: {
    paddingHorizontal: 12,
    paddingTop: 0,
    paddingBottom: 24,
    marginTop: -18,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 10,
    rowGap: 10,
    marginBottom: 20,
    width: METRIC_CARD_WIDTH * 2 + 10,
    alignSelf: "center",
  },
  quickActions: {
    width: '100%',
  },
  quickActionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  quickActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  quickActionTextCol: {
    flex: 1,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
    fontWeight: "500",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: -0.3,
  },
  cardContent: {
    padding: 16,
  },
  statusItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    paddingVertical: 4,
  },
  statusLabel: {
    color: "#64748b",
    fontSize: 14,
    fontWeight: "500",
  },
  calendarContainer: {
    width: "100%",
    marginTop: 8,
    marginBottom: 32,
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  calendarTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
  },
});