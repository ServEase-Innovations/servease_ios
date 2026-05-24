// Dashboard.tsx (updated with back button logic and no translations)
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
} from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { DashboardMetricCard } from './DashboardMetricCard';
import TodayVisitsCard, { TodayBookingSlot } from './TodayVisitsCard';
import { useAuth0 } from 'react-native-auth0';
import { AllBookingsDialog } from './AllBookingsDialog';
import { getServiceTitle } from '../common/BookingUtils';
import { ReviewsDialog } from './ReviewDialog';
import axios, { AxiosResponse } from 'axios';
import PaymentInstance from '../services/paymentInstance';
import { useAppUser } from '../context/AppUserContext';
import ProviderCalendarBig from './ProviderCalendarBig';
import { OtpVerificationDialog } from './OtpVerificationDialog';
import WithdrawalDialog from './WithdrawalDialog';
import { WithdrawalHistoryDialog } from './WithdrawalHistoryDialog';
import TrackAddress from './TrackAddress';


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

// Card Component
const Card = ({ style, children }: { style?: any; children: React.ReactNode }) => {
  return (
    <View
      style={[
        {
          backgroundColor: '#FFFFFF',
          borderRadius: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
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

// Badge Component
const Badge = ({ 
  variant = 'default', 
  style, 
  children 
}: { 
  variant?: 'default' | 'secondary' | 'destructive' | 'success' | 'primary' | 'outline';
  style?: any;
  children: React.ReactNode;
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
        };
      case 'destructive':
        return {
          backgroundColor: '#fef2f2',
        };
      case 'success':
        return {
          backgroundColor: '#10b981',
        };
      case 'primary':
        return {
          backgroundColor: '#3b82f6',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: '#d1d5db',
        };
      default:
        return {
          backgroundColor: '#f3f4f6',
        };
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'success':
      case 'primary':
        return '#ffffff';
      case 'destructive':
        return '#dc2626';
      case 'outline':
        return '#374151';
      default:
        return '#111827';
    }
  };

  return (
    <View
      style={[
        {
          borderRadius: 12,
          paddingHorizontal: 8,
          paddingVertical: 4,
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
            textTransform: 'uppercase',
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

function QuickActionRow({
  icon,
  iconBg,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.quickActionRow} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.quickActionIcon, { backgroundColor: iconBg }]}>{icon}</View>
      <Text style={styles.quickActionLabel}>{label}</Text>
      <MaterialIcon name="chevron-right" size={20} color="#94a3b8" />
    </TouchableOpacity>
  );
}

interface DashboardProps {
  onProfilePress: () => void;
  onBackToHome?: () => void;
}

export default function Dashboard({ onProfilePress, onBackToHome }: DashboardProps) {
  const { user: auth0User } = useAuth0();
  const { appUser } = useAppUser();
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

  // ============= BACK BUTTON AND HARDWARE BACK HANDLING =============
  
  // Handle back button press
  const handleBackPress = () => {
    console.log('⬅️ Back button pressed in Dashboard component');
    
    // Close any open dialogs first
    if (showAllBookings) {
      console.log('📋 Closing all bookings dialog');
      setShowAllBookings(false);
      return true;
    }
    
    if (reviewsDialogOpen) {
      console.log('⭐ Closing reviews dialog');
      setReviewsDialogOpen(false);
      return true;
    }
    
    if (otpDialogOpen) {
      console.log('🔐 Closing OTP dialog');
      setOtpDialogOpen(false);
      setCurrentBooking(null);
      return true;
    }
    
    if (withdrawalHistoryDialogOpen) {
      console.log('💰 Closing withdrawal history dialog');
      setWithdrawalHistoryDialogOpen(false);
      return true;
    }
    
    if (withdrawalDialogOpen) {
      console.log('💰 Closing withdrawal dialog');
      setWithdrawalDialogOpen(false);
      return true;
    }
    
    if (trackAddressDialogOpen) {
      console.log('📍 Closing track address dialog');
      setTrackAddressDialogOpen(false);
      return true;
    }
    
    // If no dialogs are open, navigate back to home
    if (onBackToHome) {
      console.log('🏠 Navigating back to HomePage');
      onBackToHome();
      return true;
    }
    
    return false;
  };

  // Set up hardware back button listener
  useEffect(() => {
    console.log('🎯 Setting up back button handler for Dashboard component');
    
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );

    return () => {
      console.log('🧹 Cleaning up back button handler for Dashboard component');
      backHandler.remove();
    };
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
    if (auth0User) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
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

  const metrics = [
    {
      title: "Total Earnings",
      value: `₹${payout?.summary?.total_earned?.toLocaleString("en-IN") || 0}`,
      icon: "rupee" as const,
      description: "This month (credited to wallet)",
    },
    {
      title: "Security Deposit",
      value: `₹${payout?.summary?.security_deposit_amount?.toLocaleString("en-IN") || 0}`,
      change: payout?.summary?.security_deposit_paid ? "Paid" : "Not paid",
      changeType: payout?.summary?.security_deposit_paid
        ? ("neutral" as const)
        : ("negative" as const),
      icon: "shield" as const,
      description: "For active bookings",
    },
    {
      title: "Total Withdrawn",
      value: `₹${(payout?.summary?.total_withdrawn ?? 0).toLocaleString("en-IN")}`,
      icon: "credit-card" as const,
      description: "Already withdrawn or deducted",
    },
    {
      title: "Available to withdraw",
      value: `₹${payout?.summary?.available_to_withdraw?.toLocaleString("en-IN") || 0}`,
      icon: "wallet" as const,
      description: "After service charges and TDS",
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
      const timer = setTimeout(() => {
        handleCloseOtpDialog();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [verifyingOtp, otpDialogOpen, currentBooking]);

  // Reset ref when OTP dialog opens
  useEffect(() => {
    if (otpDialogOpen) {
      verificationCompletedRef.current = false;
    }
  }, [otpDialogOpen]);

  // Fetch data when serviceProviderId changes
  useEffect(() => {
    if (serviceProviderId) {
      fetchData();
    }
  }, [serviceProviderId]);

  // Handle successful verification completion for OTP
  useEffect(() => {
    if (!verifyingOtp && verificationCompletedRef.current) {
      const timer = setTimeout(() => {
        handleCloseOtpDialog();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [verifyingOtp]);

  // Add function to handle withdrawal success
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
        /* no row for today */
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
    verificationCompletedRef.current = true;
    
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

      Alert.alert("Success", "Task completed successfully!");

      setTaskStatus(prev => ({ ...prev, [currentBooking.bookingId]: "COMPLETED" }));
      await fetchData();
      return Promise.resolve();
    } catch (err) {
      let errorMessage = "Failed to complete service. Please try again.";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || err.message || errorMessage;
      }
      
      Alert.alert("Error", errorMessage);
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
  const userEmail = appUser?.email || auth0User?.email;
  const avatarUrl = (appUser?.picture as string) || (auth0User?.picture as string) || null;
  const userInitials = userDisplayName
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "SP";

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topHeader}>
          <View style={styles.topHeaderLeft}>
            <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
              <MaterialIcon name="arrow-back" size={22} color="#0f172a" />
            </TouchableOpacity>
            <View style={styles.brandIcon}>
              <MaterialIcon name="home" size={20} color="#fff" />
            </View>
            <View style={styles.brandText}>
              <Text style={styles.brandTitle}>Serveaso Provider</Text>
              <Text style={styles.brandSubtitle}>SERVICE DASHBOARD</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.profileChip} onPress={onProfilePress} activeOpacity={0.8}>
            <View style={styles.profileChipText}>
              <Text style={styles.profileName} numberOfLines={1}>
                {userDisplayName}
              </Text>
              {userEmail ? (
                <Text style={styles.profileEmail} numberOfLines={1}>
                  {userEmail}
                </Text>
              ) : null}
            </View>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text style={styles.avatarInitials}>{userInitials}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.heroSection}>
          <Text style={styles.heroEyebrow}>TODAY</Text>
          <Text style={styles.heroTitle}>Welcome back, {userDisplayName}</Text>
          <Text style={styles.heroSubtitle}>
            Here&apos;s what&apos;s happening with your services today. Bookings, payouts, and quick actions in one place.
          </Text>
        </View>

        <View style={styles.mainContent}>
          <View style={styles.metricsGrid}>
            {metrics.map((metric, index) => (
              <DashboardMetricCard key={index} {...metric} />
            ))}
          </View>

          <TodayVisitsCard
            loading={loading}
            todaySchedule={todaySchedule}
            taskStatusUpdating={taskStatusUpdating}
            onCallCustomer={handleCallCustomer}
            onTrackAddress={handleTrackAddress}
            onStartTodayVisit={handleStartTodayVisit}
            onStopTask={handleStopTask}
          />

          <View style={styles.quickActions}>
              <Card style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Quick Actions</Text>
                </View>
                <View style={styles.cardContent}>
                  <QuickActionRow
                    iconBg="#e0f2fe"
                    icon={<MaterialIcon name="people" size={16} color="#0369a1" />}
                    label="View all bookings"
                    onPress={() => setShowAllBookings(true)}
                  />
                  <QuickActionRow
                    iconBg="#ede9fe"
                    icon={<MaterialIcon name="currency-rupee" size={16} color="#6d28d9" />}
                    label="Request withdrawal"
                    onPress={() => setWithdrawalDialogOpen(true)}
                  />
                  <QuickActionRow
                    iconBg="#fef3c7"
                    icon={<MaterialIcon name="receipt" size={16} color="#b45309" />}
                    label="Withdrawal history"
                    onPress={() => setWithdrawalHistoryDialogOpen(true)}
                  />
                  <QuickActionRow
                    iconBg="#f1f5f9"
                    icon={<MaterialIcon name="calendar-today" size={16} color="#475569" />}
                    label="Apply leave"
                    onPress={() =>
                      Alert.alert("Apply leave", "Use the web dashboard to apply leave until this is added to the app.")
                    }
                  />
                  <QuickActionRow
                    iconBg="#f1f5f9"
                    icon={<MaterialIcon name="access-time" size={16} color="#475569" />}
                    label="Mark unavailable"
                    onPress={() =>
                      Alert.alert(
                        "Mark unavailable",
                        "Use the web dashboard to mark unavailability until this is added to the app."
                      )
                    }
                  />
                  <QuickActionRow
                    iconBg="#fef3c7"
                    icon={<MaterialIcon name="star" size={16} color="#b45309" />}
                    label="View reviews"
                    onPress={() => setReviewsDialogOpen(true)}
                  />
                </View>
              </Card>

              {/* Service Status */}
              <Card style={[styles.card, { marginTop: 16 }]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Service Status</Text>
                </View>
                <View style={styles.cardContent}>
                  <View style={styles.statusItem}>
                    <Text style={styles.statusLabel}>Profile Status</Text>
                    <Badge variant="success">
                      Active
                    </Badge>
                  </View>
                  <View style={styles.statusItem}>
                    <Text style={styles.statusLabel}>Verification</Text>
                    <Badge variant="success">
                      Verified
                    </Badge>
                  </View>
                  <View style={styles.statusItem}>
                    <Text style={styles.statusLabel}>Availability</Text>
                    <Badge variant="primary">
                      Available
                    </Badge>
                  </View>
                </View>
              </Card>
          </View>

          {serviceProviderId !== null && (
            <View style={styles.calendarContainer}>
              <ProviderCalendarBig
                providerId={serviceProviderId}
                refreshToken={calendarRefresh}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Reviews Dialog */}
      <ReviewsDialog
        visible={reviewsDialogOpen}
        onClose={() => setReviewsDialogOpen(false)}
        serviceProviderId={serviceProviderId}
      />

      {/* All Bookings Dialog */}
      <AllBookingsDialog
        visible={showAllBookings}
        onClose={() => setShowAllBookings(false)}
        bookings={bookings}
        serviceProviderId={serviceProviderId}
        onContactClient={() => {}}
        trigger={undefined}
      />

      {/* OTP Verification Dialog */}
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

      {/* Withdrawal History Dialog */}
      <WithdrawalHistoryDialog
        visible={withdrawalHistoryDialogOpen}
        onClose={() => setWithdrawalHistoryDialogOpen(false)}
        serviceProviderId={serviceProviderId}
      />

      {/* Withdrawal Dialog */}
      <WithdrawalDialog
        open={withdrawalDialogOpen}
        onOpenChange={setWithdrawalDialogOpen}
        serviceProviderId={serviceProviderId}
        availableBalance={payout?.summary?.available_to_withdraw || 0}
        onWithdrawalSuccess={handleWithdrawalSuccess}
      />

      {/* Track Address Dialog */}
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
    backgroundColor: "#f8fafc",
  },
  scrollView: {
    flex: 1,
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  topHeaderLeft: { flexDirection: "row", alignItems: "center", flex: 1, minWidth: 0 },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  brandIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#0284c7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  brandText: { flex: 1, minWidth: 0 },
  brandTitle: { fontSize: 14, fontWeight: "700", color: "#0f172a" },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.8,
    color: "#64748b",
    marginTop: 2,
  },
  profileChip: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "42%",
    marginLeft: 8,
  },
  profileChipText: { alignItems: "flex-end", marginRight: 8, flexShrink: 1 },
  profileName: { fontSize: 12, fontWeight: "600", color: "#0f172a" },
  profileEmail: { fontSize: 10, color: "#64748b", marginTop: 2 },
  avatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: "#e2e8f0" },
  avatarFallback: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e0f2fe",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#e2e8f0",
  },
  avatarInitials: { fontSize: 12, fontWeight: "700", color: "#0369a1" },
  heroSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: "#f0f9ff",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(226, 232, 240, 0.6)",
  },
  heroEyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "#0369a1",
    marginBottom: 6,
  },
  heroTitle: { fontSize: 24, fontWeight: "700", color: "#0f172a", marginBottom: 8 },
  heroSubtitle: { fontSize: 14, color: "#64748b", lineHeight: 20 },
  mainContent: {
    padding: 16,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  quickActionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
    marginBottom: 8,
  },
  quickActionIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  quickActionLabel: { flex: 1, fontSize: 14, fontWeight: "500", color: "#334155" },
  quickActions: {
    width: '100%',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  cardContent: {
    padding: 16,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    color: '#6b7280',
    fontSize: 14,
  },
  bottomSection: {
    flexDirection: 'column',
    gap: 16,
    marginBottom: 20,
  },
  calendarContainer: {
    width: "100%",
    marginTop: 8,
    marginBottom: 32,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    overflow: "hidden",
  },
});