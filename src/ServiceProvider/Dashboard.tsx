// Dashboard.tsx
import React, { useState, useEffect } from 'react';
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
  StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { DashboardMetricCard } from './DashboardMetricCard';
import { PaymentHistory } from './PaymentHistory';
import { useAuth0 } from 'react-native-auth0';
import { AllBookingsDialog } from './AllBookingsDialog';
import { getBookingTypeBadge, getServiceTitle, getStatusBadge } from '../common/BookingUtils';
import axiosInstance from '../services/axiosInstance';
import LinearGradient from 'react-native-linear-gradient';
import { ReviewsDialog } from './ReviewDialog';
import axios, { AxiosResponse } from 'axios';
import PaymentInstance from '../services/paymentInstance';
import { useAppUser } from '../context/AppUserContext';
import ProviderCalendarBig from './ProviderCalendarBig';
import { OtpVerificationDialog } from './OtpVerificationDialog';

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

interface CalendarEntry {
  id: number;
  provider_id: number;
  engagement_id?: number;
  date: string;
  start_time: string;
  end_time: string;
  status: "AVAILABLE" | "BOOKED" | "UNAVAILABLE";
  created_at: string;
  updated_at: string;
}

const paymentHistory = [
  {
    id: "1",
    date: "Dec 25, 2024",
    description: "Cleaning Service - Priya S.",
    amount: "₹800",
    status: "completed" as const,
    type: "earning" as const
  },
  {
    id: "2",
    date: "Dec 24, 2024",
    description: "Cooking Service - Rajesh K.",
    amount: "₹1,200",
    status: "completed" as const,
    type: "earning" as const
  },
  {
    id: "3",
    date: "Dec 23, 2024",
    description: "Withdrawal to Bank",
    amount: "₹5,000",
    status: "completed" as const,
    type: "withdrawal" as const
  },
  {
    id: "4",
    date: "Dec 22, 2024",
    description: "Care Service - Anita P.",
    amount: "₹1,500",
    status: "pending" as const,
    type: "earning" as const
  }
];

// Function to format time string to AM/PM format
const formatTimeToAMPM = (timeString: string): string => {
  if (!timeString) return '';
  
  try {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const minute = parseInt(minutes, 10);
    
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    const displayMinute = minute.toString().padStart(2, '0');
    
    return `${displayHour}:${displayMinute} ${period}`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeString;
  }
};

// Function to format time range from start and end time strings
const formatTimeRange = (startTime: string, endTime: string): string => {
  return `${formatTimeToAMPM(startTime)} - ${formatTimeToAMPM(endTime)}`;
};

// Function to format API booking data for the BookingCard component
const formatBookingForCard = (booking: any) => {
  let date, timeRange;
  
  if (booking.start_epoch && booking.end_epoch) {
    const startDate = new Date(booking.start_epoch * 1000);
    const endDate = new Date(booking.end_epoch * 1000);
    
    const formattedDate = startDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
    
    timeRange = `${startDate.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    })} - ${endDate.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    })}`;
    
    date = formattedDate;
  } else {
    const startDateRaw = booking.startDate || booking.start_date;
    const startTimeStr = booking.startTime || "00:00";
    const endTimeStr = booking.endTime || "00:00";

    const startDate = new Date(startDateRaw);
    const endDate = new Date(startDateRaw);

    const [startHours, startMinutes] = startTimeStr.split(":").map(Number);
    const [endHours, endMinutes] = endTimeStr.split(":").map(Number);

    startDate.setHours(startHours, startMinutes);
    endDate.setHours(endHours, endMinutes);

    timeRange = formatTimeRange(booking.startTime, booking.endTime);
    
    date = startDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  }

  const clientName = booking.firstname || 
                    booking.customerName || 
                    booking.email || 
                    "Client";

  const bookingId = booking.engagement_id || booking.id;

  const amount = booking.base_amount ? 
    `₹${parseFloat(booking.base_amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 
    "₹0";

  return {
    id: booking.engagement_id?.toString() || booking.id?.toString() || "",
    bookingId: booking.engagement_id || booking.id,
    engagement_id: booking.engagement_id?.toString() || booking.id?.toString(),
    clientName,
    service: getServiceTitle(booking.service_type || booking.serviceType),
    date: date,
    time: timeRange,
    location: booking.address || booking.location || "Address not provided",
    status: booking.task_status === "COMPLETED" ? "completed" : 
            booking.task_status === "IN_PROGRESS" || booking.task_status === "STARTED" ? "in-progress" : 
            booking.task_status === "NOT_STARTED" ? "upcoming" : "upcoming",
    amount: amount,
    bookingData: booking,
    responsibilities: booking.responsibilities || {},
    contact: booking.mobileno || "Contact info not available",
    task_status: booking.task_status
  };
};

// Get current month and year in "YYYY-MM" format
const getCurrentMonthYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
};

// Button Component
const Button = ({ 
  variant = 'default', 
  size = 'md', 
  style, 
  onPress, 
  children,
  disabled = false
}: { 
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'primary' | 'success';
  size?: 'sm' | 'md' | 'lg';
  style?: any;
  onPress: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: '#3B82F6',
        };
      case 'destructive':
        return {
          backgroundColor: '#EF4444',
        };
      case 'secondary':
        return {
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
        };
      case 'success':
        return {
          backgroundColor: '#10B981',
        };
      case 'primary':
        return {
          backgroundColor: '#3B82F6',
        };
      default:
        return {
          backgroundColor: '#3B82F6',
        };
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: 8,
          paddingHorizontal: 12,
        };
      case 'lg':
        return {
          paddingVertical: 12,
          paddingHorizontal: 24,
        };
      default:
        return {
          paddingVertical: 10,
          paddingHorizontal: 16,
        };
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'outline':
        return '#3B82F6';
      case 'destructive':
      case 'success':
      case 'primary':
        return '#FFFFFF';
      default:
        return '#FFFFFF';
    }
  };

  return (
    <TouchableOpacity
      style={[
        {
          borderRadius: 6,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          opacity: disabled ? 0.6 : 1,
        },
        getVariantStyle(),
        getSizeStyle(),
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      {typeof children === 'string' ? (
        <Text style={{ color: getTextColor(), fontWeight: '500' }}>
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
};

// Card Component
const Card = ({ style, children }: { style?: any; children: React.ReactNode }) => {
  return (
    <View
      style={[
        {
          backgroundColor: '#FFFFFF',
          borderRadius: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 2,
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
          backgroundColor: '#FEF2F2',
        };
      case 'success':
        return {
          backgroundColor: '#10B981',
        };
      case 'primary':
        return {
          backgroundColor: '#3B82F6',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: '#D1D5DB',
        };
      default:
        return {
          backgroundColor: '#F3F4F6',
        };
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'success':
      case 'primary':
        return '#FFFFFF';
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
            fontSize: 12,
            fontWeight: '500',
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

interface DashboardProps {
  onProfilePress: () => void;
}

export default function Dashboard({ onProfilePress }: DashboardProps) {
  const { clearSession, user: auth0User } = useAuth0();
  const { appUser } = useAppUser();
  const [bookings, setBookings] = useState<BookingHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [serviceProviderId, setServiceProviderId] = useState<number | null>(null);
  const [showAllBookings, setShowAllBookings] = useState(false);
  const [reviewsDialogOpen, setReviewsDialogOpen] = useState(false);
  const [payout, setPayout] = useState<ProviderPayoutResponse | null>(null);
  const [calendar, setCalendar] = useState<CalendarEntry[]>([]);
  const [taskStatus, setTaskStatus] = useState<Record<string, "IN_PROGRESS" | "COMPLETED" | undefined>>({});
  const [taskStatusUpdating, setTaskStatusUpdating] = useState<Record<string, boolean>>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [otpDialogOpen, setOtpDialogOpen] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<any>(null);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    if (auth0User) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
    }
  }, [auth0User]);

  // ✅ Extract name and serviceProviderId from Auth0 user and AppUser context
  useEffect(() => {
    if (isAuthenticated && auth0User) {
      const name = appUser?.name || auth0User.name || null;
      const id = appUser?.serviceProviderId 
        ? Number(appUser.serviceProviderId)
        : auth0User.serviceProviderId || auth0User["https://yourdomain.com/serviceProviderId"] || null;

      console.log("appUser:", appUser);
      setUserName(name);
      setServiceProviderId(id ? Number(id) : null);
    }
  }, [isAuthenticated, auth0User, appUser]);

  const metrics = [
    {
      title: "Total Earnings",
      value: `₹${payout?.summary?.total_earned?.toLocaleString("en-IN") || 0}`,
      change: "+12.5%",
      changeType: "positive" as const,
      icon: "rupee" as const,
      description: "This month"
    },
    {
      title: "Security Deposit",
      value: `₹${payout?.summary?.security_deposit_amount?.toLocaleString("en-IN") || 0}`,
      change: payout?.summary?.security_deposit_paid ? "Paid" : "Not Paid",
      changeType: payout?.summary?.security_deposit_paid ? ("neutral" as const) : ("negative" as const),
      icon: "home" as const,
      description: "For active bookings"
    },
    {
      title: "Service Fee",
      value: `₹${(
        (payout?.summary?.total_earned || 0) - (payout?.summary?.available_to_withdraw || 0)
      ).toLocaleString("en-IN")}`,
      change: "-10%",
      changeType: "negative" as const,
      icon: "rupee" as const,
      description: "Service charges"
    },
    {
      title: "Actual Payout",
      value: `₹${payout?.summary?.available_to_withdraw?.toLocaleString("en-IN") || 0}`,
      change: "+10.2%",
      changeType: "positive" as const,
      icon: "rupee" as const,
      description: "After deductions"
    }
  ];

  // Fetch data function
  const fetchData = async () => {
    if (!serviceProviderId) return;

    try {
      setLoading(true);
      const currentMonthYear = getCurrentMonthYear();

      // Fetch payout data
      const payoutResponse: AxiosResponse<ProviderPayoutResponse> = await PaymentInstance.get(
        `/api/service-providers/${serviceProviderId}/payouts?month=${currentMonthYear}&detailed=true`
      );
      setPayout(payoutResponse.data);

      // Fetch booking engagements
      const response = await PaymentInstance.get(
        `/api/service-providers/${serviceProviderId}/engagements?month=${currentMonthYear}`
      );

      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: BookingHistoryResponse = response.data;
      setBookings(data);

      setError(null); // clear any previous errors
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
      Alert.alert("Error", "Failed to load data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Close dialog when verification completes successfully
  useEffect(() => {
    if (!verifyingOtp && otpDialogOpen && currentBooking) {
      // Small delay to allow user to see success state if needed
      const timer = setTimeout(() => {
        handleCloseOtpDialog();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [verifyingOtp, otpDialogOpen, currentBooking]);

  // Fetch data when serviceProviderId changes
  useEffect(() => {
    if (serviceProviderId) {
      fetchData();
    }
  }, [serviceProviderId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleContactClient = (booking: any) => {
    const contactInfo = booking.contact || booking.bookingData?.mobileno || "Contact info not available";
    
    Alert.alert(
      "Contact Information",
      `Call ${booking.clientName} at ${contactInfo}`
    );
  };

  const handleStartTask = async (bookingId: string, bookingData: any) => {
    if (!bookingId || !bookingData) return;

    const serviceDayId = bookingData.today_service?.service_day_id;
    if (!serviceDayId) {
      Alert.alert("Error", "Service day ID not found. Cannot start service.");
      return;
    }

    const previousStatus = taskStatus[bookingId];

    setTaskStatus(prev => ({ ...prev, [bookingId]: "IN_PROGRESS" }));
    setTaskStatusUpdating(prev => ({ ...prev, [bookingId]: true }));

    try {
      await PaymentInstance.post(
        `api/engagement-service/service-days/${serviceDayId}/start`,
        {},
        { 
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          } 
        }
      );

      Alert.alert("Service Started", "You have successfully started the service. Task is now IN_PROGRESS");

      await fetchData();
    } catch (err) {
      setTaskStatus(prev => ({ ...prev, [bookingId]: previousStatus }));
      
      let errorMessage = "Failed to start service";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || err.message || errorMessage;
      }
      
      Alert.alert("Error", errorMessage);
    } finally {
      setTaskStatusUpdating(prev => ({ ...prev, [bookingId]: false }));
    }
  };

  const handleStopTask = async (bookingId: string, bookingData: any) => {
    setCurrentBooking({ bookingId, bookingData });
    setOtpDialogOpen(true);
  };

  const handleVerifyOtp = async (otp: string) => {
    if (!currentBooking) return;

    const serviceDayId = currentBooking.bookingData.today_service?.service_day_id;
    if (!serviceDayId) {
      Alert.alert("Error", "Service day ID not found");
      return Promise.reject(new Error("Service day ID not found"));
    }

    setVerifyingOtp(true);
    try {
      await PaymentInstance.post(
        `api/engagement-service/service-days/${serviceDayId}/complete`,
        { otp },
        { 
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          } 
        }
      );

      Alert.alert("Success", "Service completed successfully! Earnings credited to your account.");

      setTaskStatus(prev => ({ ...prev, [currentBooking.bookingId]: "COMPLETED" }));
      await fetchData();
      return Promise.resolve();
    } catch (err) {
      let errorMessage = "Failed to complete service";
      if (axios.isAxiosError(err)) {
        errorMessage = err.response?.data?.message || err.message || errorMessage;
      }
      
      Alert.alert("Error", errorMessage);
      return Promise.reject(err);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleCloseOtpDialog = () => {
    setOtpDialogOpen(false);
    setCurrentBooking(null);
  };

  // Combine current and future bookings for display
  const upcomingBookings = bookings
    ? [...(bookings.current || []), ...(bookings.upcoming || [])].map(formatBookingForCard)
    : [];

  // Get the most recent booking for display
  const latestBooking = upcomingBookings.length > 0 ? [upcomingBookings[0]] : [];

  const onLogout = async () => {
    try {
      await clearSession();
    } catch (e) {
      console.log('Log out cancelled');
    }
  };

  // Helper component for disabled button with loading
  const DisabledButtonWithLoader = ({ isLoading }: { isLoading: boolean }) => (
    <TouchableOpacity
      style={[
        {
          borderRadius: 6,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          opacity: 0.6,
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderWidth: 1,
          borderColor: '#D1D5DB',
        }
      ]}
      disabled={true}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#3B82F6" />
      ) : (
        <Text style={{ color: '#3B82F6' }}>Loading...</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome Section */}
        <LinearGradient
          colors={[
            'rgba(139, 187, 221, 0.8)', // Blue tone
            'rgba(213, 229, 233, 0.8)', // Lighter blue
            'rgba(255,255,255,1)'       // White at the bottom
          ]}
          start={{x: 0, y: 0}}
          end={{x: 0, y: 1}} // Vertical fade
          style={styles.welcomeBanner}
        >
          <View style={styles.welcomeContent}>
            <View style={styles.welcomeTextContainer}>
              <View style={styles.welcomeIconRow}>
                <MaterialIcon name="home" size={16} color="#0e305c" />
                <View>
                  <Text style={styles.welcomeBackText}>Welcome back,</Text>
                  <Text style={styles.userNameText}>{userName || "Guest"}</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Icon name="calendar" size={16} color="#3b82f6" />
                  <View style={styles.statBadge}>
                    <Text style={styles.statBadgeText}>+3</Text>
                  </View>
                </View>
                <Text style={styles.statLabel}>Bookings</Text>
              </View>
              
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Icon name="star" size={16} color="#f59e0b" />
                  <View style={styles.statBadge}>
                    <Text style={styles.statBadgeText}>+2%</Text>
                  </View>
                </View>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
              
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Icon name="trending-up" size={16} color="#10b981" />
                  <View style={styles.statBadge}>
                    <Text style={styles.statBadgeText}>+2%</Text>
                  </View>
                </View>
                <Text style={styles.statLabel}>Completion</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.mainContent}>
          <Text style={styles.welcomeSubtitle}>
            Here's what's happening with your services today.
          </Text>
          
          {/* Metrics Grid */}
          <View style={styles.metricsGrid}>
            {metrics.map((metric, index) => (
              <DashboardMetricCard key={index} {...metric} />
            ))}
          </View>

          {/* Main Content Grid */}
          <View style={styles.mainGrid}>
            {/* Recent Booking */}
            <View style={styles.recentBookings}>
              <Card style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Recent Booking</Text>
                  {!loading && latestBooking.length > 0 && (
                    <Badge variant="secondary" style={styles.latestBadge}>
                      Latest
                    </Badge>
                  )}
                </View>
                <View style={styles.cardContent}>
                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="#3b82f6" />
                    </View>
                  ) : error ? (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorText}>Failed to load bookings. Please try again.</Text>
                      <Button
                        variant="outline"
                        style={styles.retryButton}
                        onPress={() => onRefresh()}
                      >
                        <Text style={styles.retryButtonText}>Retry</Text>
                      </Button>
                    </View>
                  ) : latestBooking.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No upcoming bookings found.</Text>
                    </View>
                  ) : (
                    latestBooking.map((booking) => {
                      // FIX: Check today_service status instead of just task_status
                      const todayServiceStatus = booking.bookingData?.today_service?.status;
                      const taskStatusOriginal = booking.task_status?.toUpperCase();
                      
                      // Check if service is in progress
                      const isInProgress = todayServiceStatus === 'IN_PROGRESS' || 
                                           taskStatus[booking.id] === 'IN_PROGRESS' || 
                                           taskStatusOriginal === 'IN_PROGRESS' || 
                                           taskStatusOriginal === 'STARTED';
                      
                      const isCompleted = todayServiceStatus === 'COMPLETED' || 
                                          taskStatusOriginal === 'COMPLETED';
                      
                      const isNotStarted = todayServiceStatus === 'SCHEDULED' || 
                                           taskStatusOriginal === 'NOT_STARTED';

                      // Check if service can be started based on today_service
                      const canStart = booking.bookingData?.today_service?.can_start === true;
                      
                      // Determine which button to show
                      const showStartButton = isNotStarted && canStart;
                      const showCompleteButton = isInProgress;
                      const showCompletedButton = isCompleted;

                      return (
                        <View key={booking.id} style={styles.bookingItem}>
                          {/* Header */}
                          <View style={styles.bookingHeader}>
                            <View>
                              <Text style={styles.bookingIdText}>Booking ID: {booking.bookingId || "N/A"}</Text>
                              <Text style={styles.clientName}>{booking.clientName}</Text>
                              <Text style={styles.serviceType}>{booking.service}</Text>
                            </View>
                            <View style={styles.badgeContainer}>
                              {getBookingTypeBadge(booking.bookingData.booking_type || booking.bookingData.bookingType)}
                              {getStatusBadge(booking.bookingData.task_status)}
                            </View>
                          </View>
                          
                          {/* Date & Amount */}
                          <View style={styles.bookingDetails}>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Date & Time</Text>
                              <Text style={styles.detailValue}>{booking.date} at {booking.time}</Text>
                            </View>
                            <View style={styles.detailRow}>
                              <Text style={styles.detailLabel}>Amount</Text>
                              <Text style={styles.detailValue}>{booking.amount}</Text>
                            </View>
                          </View>
                          
                          {/* Responsibilities */}
                          <View style={styles.responsibilitiesContainer}>
                            <Text style={styles.detailLabel}>Responsibilities</Text>
                            <View style={styles.responsibilitiesList}>
                              {booking.bookingData?.responsibilities?.tasks?.map((task: any, index: number) => {
                                const taskLabel = task.persons ? `${task.persons} persons` : "";
                                return (
                                  <Badge key={index} variant="outline" style={styles.responsibilityBadge}>
                                    <Text style={styles.responsibilityText}>
                                      {task.taskType} {taskLabel}
                                    </Text>
                                  </Badge>
                                );
                              })}
                              {booking.bookingData?.responsibilities?.add_ons?.map((addon: any, index: number) => (
                                <Badge key={`addon-${index}`} variant="outline" style={[styles.responsibilityBadge, {backgroundColor: '#eff6ff'}]}>
                                  <Text style={[styles.responsibilityText, {color: '#1d4ed8'}]}>
                                    Add-on: {typeof addon === 'object' ? JSON.stringify(addon) : addon}
                                  </Text>
                                </Badge>
                              ))}
                              {(!booking.bookingData?.responsibilities?.tasks?.length && !booking.bookingData?.responsibilities?.add_ons?.length) && (
                                <Text style={[styles.responsibilityText, {color: '#6b7280'}]}>
                                  No responsibilities listed
                                </Text>
                              )}
                            </View>
                          </View>
                          
                          {/* Address */}
                          <View style={styles.addressContainer}>
                            <Text style={styles.detailLabel}>Address</Text>
                            <Text style={styles.detailValue}>{booking.location || "Address not provided"}</Text>
                            {booking.bookingData?.mobileno && (
                              <Text style={[styles.detailLabel, {marginTop: 4, fontSize: 12}]}>
                                Contact: {booking.bookingData.mobileno}
                              </Text>
                            )}
                          </View>

                          {/* Today's Service Status Badge */}
                          {todayServiceStatus && (
                            <View style={styles.todayServiceContainer}>
                              <View style={styles.todayServiceRow}>
                                <Text style={styles.detailLabel}>Today's Service:</Text>
                                <Badge 
                                  variant="outline"
                                  style={[
                                    styles.todayServiceBadge,
                                    todayServiceStatus === 'SCHEDULED' && {backgroundColor: '#eff6ff', borderColor: '#93c5fd', borderWidth: 1},
                                    todayServiceStatus === 'IN_PROGRESS' && {backgroundColor: '#dcfce7', borderColor: '#86efac', borderWidth: 1},
                                    todayServiceStatus === 'COMPLETED' && {backgroundColor: '#f3e8ff', borderColor: '#c4b5fd', borderWidth: 1}
                                  ]}
                                >
                                  <Text style={[
                                    styles.todayServiceBadgeText,
                                    todayServiceStatus === 'SCHEDULED' && {color: '#1e40af'},
                                    todayServiceStatus === 'IN_PROGRESS' && {color: '#166534'},
                                    todayServiceStatus === 'COMPLETED' && {color: '#5b21b6'}
                                  ]}>
                                    {todayServiceStatus}
                                  </Text>
                                </Badge>
                              </View>
                            </View>
                          )}

                          {/* Start / Complete Buttons */}
                          <View style={styles.taskActionContainer}>
                            <Text style={styles.detailLabel}>
                              {isInProgress 
                                ? "Task In Progress" 
                                : isCompleted 
                                  ? 'Task Completed' 
                                  : isNotStarted
                                    ? 'Not Started' 
                                    : 'Upcoming'
                              }
                            </Text>
                            <View style={styles.actionButtons}>
                              {taskStatusUpdating[booking.id] ? (
                                <DisabledButtonWithLoader isLoading={true} />
                              ) : showCompleteButton ? (
                                <Button 
                                  variant="destructive" 
                                  size="sm" 
                                  onPress={() => handleStopTask(booking.id, booking.bookingData)}
                                >
                                  <Text style={styles.stopButtonText}>Complete Task</Text>
                                </Button>
                              ) : showCompletedButton ? (
                                <View style={[styles.completedButtonContainer, {backgroundColor: '#dcfce7', borderColor: '#22c55e', borderWidth: 1, borderRadius: 6, paddingVertical: 8, paddingHorizontal: 12}]}>
                                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                    <MaterialIcon name="check-circle" size={16} color="#166534" style={{marginRight: 4}} />
                                    <Text style={{color: '#166534', fontWeight: '500', fontSize: 14}}>Completed</Text>
                                  </View>
                                </View>
                              ) : showStartButton ? (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onPress={() => handleStartTask(booking.id, booking.bookingData)}
                                >
                                  <Text style={styles.startButtonText}>Start Task</Text>
                                </Button>
                              ) : (
                                <View style={[styles.disabledButtonContainer, {backgroundColor: '#f9fafb', borderColor: '#d1d5db', borderWidth: 1, borderRadius: 6, paddingVertical: 8, paddingHorizontal: 12}]}>
                                  <Text style={{color: '#6b7280', fontSize: 14}}>Cannot Start Yet</Text>
                                </View>
                              )}
                            </View>
                          </View>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            style={styles.contactButton}
                            onPress={() => handleContactClient(booking)}
                          >
                            <Text style={styles.contactButtonText}>Contact Client</Text>
                          </Button>
                        </View>
                      );
                    })
                  )}
                </View>
              </Card>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActions}>
              <Card style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle}>Quick Actions</Text>
                </View>
                <View style={styles.cardContent}>
                  <Button
                    style={styles.actionButton}
                    variant="outline"
                    onPress={() => setShowAllBookings(true)}
                  >
                    <Icon name="users" size={16} style={styles.buttonIcon} />
                    <Text style={styles.actionButtonText}>View All Bookings</Text>
                  </Button>
                  <Button
                    style={styles.actionButton}
                    variant="outline"
                    onPress={() => {}}
                  >
                    <Icon name="rupee" size={16} style={styles.buttonIcon} />
                    <Text style={styles.actionButtonText}>Request Withdrawal</Text>
                  </Button>
                  <Button
                    style={styles.actionButton}
                    variant="outline"
                    onPress={() => {}}
                  >
                    <Icon name="calendar" size={16} style={styles.buttonIcon} />
                    <Text style={styles.actionButtonText}>Apply Leave</Text>
                  </Button>
                  <Button
                    style={styles.actionButton}
                    variant="outline"
                    onPress={() => {}}
                  >
                    <Icon name="clock-o" size={16} style={styles.buttonIcon} />
                    <Text style={styles.actionButtonText}>Update Availability</Text>
                  </Button>
                  <Button
                    style={styles.actionButton}
                    variant="outline"
                    onPress={() => setReviewsDialogOpen(true)}
                  >
                    <Icon name="star" size={16} style={styles.buttonIcon} />
                    <Text style={styles.actionButtonText}>View Reviews</Text>
                  </Button>
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
                    <Badge variant="success">Active</Badge>
                  </View>
                  <View style={styles.statusItem}>
                    <Text style={styles.statusLabel}>Verification</Text>
                    <Badge variant="success">Verified</Badge>
                  </View>
                  <View style={styles.statusItem}>
                    <Text style={styles.statusLabel}>Availability</Text>
                    <Badge variant="primary">Available</Badge>
                  </View>
                </View>
              </Card>
            </View>
          </View>

          {/* Calendar and Payment History */}
          <View style={styles.bottomSection}>
            {serviceProviderId !== null && (
              <View style={styles.calendarContainer}>
                <ProviderCalendarBig providerId={serviceProviderId} />
              </View>
            )}
            <View style={styles.paymentHistoryContainer}>
              <PaymentHistory payments={paymentHistory} />
            </View>
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity style={styles.signOutButton} onPress={onLogout}>
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Reviews Dialog */}
      <ReviewsDialog
        open={reviewsDialogOpen}
        onOpenChange={setReviewsDialogOpen}
        serviceProviderId={serviceProviderId}
      />

      {/* All Bookings Dialog */}
      <AllBookingsDialog
        visible={showAllBookings}
        onClose={() => setShowAllBookings(false)}
        bookings={bookings}
        serviceProviderId={serviceProviderId}
        onContactClient={handleContactClient}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  welcomeBanner: {
    backgroundColor: 'rgba(177, 213, 232, 1)',
    padding: 10,
    paddingTop: 30,
  },
  welcomeContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  welcomeTextContainer: {
    flex: 1,
    minWidth: 180,
  },
  welcomeIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  welcomeBackText: {
    fontSize: 13,
    color: '#0e305c',
    marginLeft: 4,
    fontWeight: '400',
  },
  userNameText: {
    fontSize: 20,
    color: '#0e305c',
    marginLeft: 4,
    fontWeight: 'bold',
    marginTop: 2,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#004aad',
    opacity: 0.9,
    textAlign: 'center',
    paddingBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statIconContainer: {
    position: 'relative',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 8,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'rgba(135, 206, 235, 1)',
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statBadgeText: {
    fontSize: 9,
    color: '#0e305c',
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 10,
    color: '#0e305c',
  },
  mainContent: {
    padding: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  mainGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  recentBookings: {
    width: '100%',
    marginBottom: 16,
  },
  quickActions: {
    width: '100%',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  latestBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  cardContent: {
    padding: 16,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    color: '#6b7280',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
  },
  retryButtonText: {
    color: '#111827',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#6b7280',
  },
  bookingItem: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#ffffff',
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookingIdText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  clientName: {
    fontWeight: '600',
    fontSize: 16,
    color: '#111827',
    marginBottom: 2,
  },
  serviceType: {
    color: '#6b7280',
    fontSize: 14,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  bookingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailRow: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
  },
  responsibilitiesContainer: {
    marginBottom: 12,
  },
  responsibilitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 4,
  },
  responsibilityBadge: {
    marginRight: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  responsibilityText: {
    fontSize: 10,
    color: '#374151',
  },
  addressContainer: {
    marginBottom: 12,
  },
  todayServiceContainer: {
    marginBottom: 12,
  },
  todayServiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todayServiceBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  todayServiceBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  taskActionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  completedButtonContainer: {
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  disabledButtonContainer: {
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    opacity: 0.6,
  },
  startButtonText: {
    color: '#3b82f6',
  },
  stopButtonText: {
    color: '#ffffff',
  },
  contactButton: {
    width: '100%',
  },
  contactButtonText: {
    color: '#111827',
  },
  actionButton: {
    width: '100%',
    justifyContent: 'flex-start',
    marginBottom: 8,
  },
  actionButtonText: {
    marginLeft: 8,
    color: '#111827',
  },
  buttonIcon: {
    color: '#6b7280',
    marginRight: 8,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    color: '#6b7280',
  },
  bottomSection: {
    flexDirection: 'column',
    gap: 16,
    marginBottom: 20,
  },
  calendarContainer: {
    width: '100%',
  },
  paymentHistoryContainer: {
    width: '100%',
  },
  signOutButton: {
    backgroundColor: '#ef4444',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  signOutButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 16,
  },
});