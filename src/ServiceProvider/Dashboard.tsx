// Dashboard.tsx
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
  StatusBar,
  Modal,
  TextInput,
  Linking
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
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
import WithdrawalDialog from './WithdrawalDialog';
import { WithdrawalHistoryDialog } from './WithdrawalHistoryDialog';

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

// Function to handle calling customer
const handleCallCustomer = (phoneNumber: string, clientName: string) => {
  if (!phoneNumber || phoneNumber === "Contact info not available") {
    Alert.alert("No Contact Info", "Customer contact information is not available.");
    return;
  }
  
  const telLink = `tel:${phoneNumber}`;
  Linking.openURL(telLink).catch(() => {
    Alert.alert("Error", "Could not open phone dialer");
  });
};

// Function to handle tracking address
const handleTrackAddress = (address: string) => {
  if (!address || address === "Address not provided") {
    Alert.alert("No Address", "Address is not provided for this booking.");
    return;
  }
  
  const encodedAddress = encodeURIComponent(address);
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  
  Linking.openURL(googleMapsUrl).catch(() => {
    Alert.alert("Error", "Could not open maps application");
  });
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

  const clientName = booking.firstname && booking.lastname 
    ? `${booking.firstname} ${booking.lastname}`.trim()
    : booking.firstname 
      ? booking.firstname
      : booking.email || "Client";

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
    bookingData: {
      ...booking,
      mobileno: booking.mobileno || "",
      contact: booking.mobileno || "Contact info not available",
      today_service: booking.today_service || null
    },
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
  disabled = false,
  icon,
  loading = false
}: { 
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'primary' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  style?: any;
  onPress?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  icon?: React.ReactNode;
  loading?: boolean;
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: '#D1D5DB',
        };
      case 'destructive':
        return {
          backgroundColor: '#EF4444',
          borderWidth: 1,
          borderColor: '#EF4444',
        };
      case 'secondary':
        return {
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 1,
          borderColor: 'rgba(59, 130, 246, 0.2)',
        };
      case 'success':
        return {
          backgroundColor: '#10B981',
          borderWidth: 1,
          borderColor: '#10B981',
        };
      case 'primary':
        return {
          backgroundColor: '#3B82F6',
          borderWidth: 1,
          borderColor: '#3B82F6',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderWidth: 0,
        };
      default:
        return {
          backgroundColor: '#3B82F6',
          borderWidth: 1,
          borderColor: '#3B82F6',
        };
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm':
        return {
          paddingVertical: 6,
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
    if (disabled) return '#9CA3AF';
    
    switch (variant) {
      case 'outline':
        return '#374151';
      case 'destructive':
      case 'success':
      case 'primary':
      case 'default':
        return '#FFFFFF';
      case 'ghost':
        return '#374151';
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
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'outline' ? '#374151' : '#FFFFFF'} />
      ) : (
        <>
          {icon && <View style={{marginRight: 8}}>{icon}</View>}
          {typeof children === 'string' ? (
            <Text style={{ 
              color: getTextColor(), 
              fontWeight: '500',
              fontSize: size === 'sm' ? 12 : 14
            }}>
              {children}
            </Text>
          ) : (
            children
          )}
        </>
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
      case 'destructive':
        return '#DC2626';
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
  const [withdrawalHistoryDialogOpen, setWithdrawalHistoryDialogOpen] = useState(false);
  const [withdrawalDialogOpen, setWithdrawalDialogOpen] = useState(false);
  const verificationCompletedRef = useRef(false);

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
      change: "+12.5%",
      changeType: "positive" as const,
      icon: "rupee" as const,
      description: "This month"
    },
    {
      title: "Security Deposit",
      value: `₹${payout?.summary?.security_deposit_amount?.toLocaleString("en-IN") || 0}`,
      change: payout?.summary?.security_deposit_paid ? "Paid" : "Not Paid",
      changeType: payout?.summary?.security_deposit_paid ? ("positive" as const) : ("negative" as const),
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
      icon: "clock" as const,
      description: "Service charges"
    },
    {
      title: "Available Balance",
      value: `₹${payout?.summary?.available_to_withdraw?.toLocaleString("en-IN") || 0}`,
      change: "+10.2%",
      changeType: "positive" as const,
      icon: "trending-up" as const,
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
    // Refresh payout data after successful withdrawal
    if (serviceProviderId) {
      try {
        const currentMonthYear = getCurrentMonthYear();
        const payoutResponse: AxiosResponse<ProviderPayoutResponse> = await PaymentInstance.get(
          `/api/service-providers/${serviceProviderId}/payouts?month=${currentMonthYear}&detailed=true`
        );
        setPayout(payoutResponse.data);
        
        Alert.alert("Balance Updated", "Your wallet balance has been updated.");
      } catch (error) {
        console.error("Failed to refresh balance:", error);
        Alert.alert("Error", "Failed to refresh balance data");
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
    verificationCompletedRef.current = true;
    
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
    <View
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
          backgroundColor: '#F3F4F6',
        }
      ]}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#3B82F6" />
      ) : (
        <Text style={{ color: '#6B7280', fontSize: 12 }}>Loading...</Text>
      )}
    </View>
  );

  // Header with Profile
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          <MaterialIcon name="home" size={24} color="#3B82F6" />
          <Text style={styles.headerTitle}>ServEase Provider</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notificationButton}>
            <FeatherIcon name="bell" size={20} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileButton} onPress={onProfilePress}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileInitials}>
                {userName ? userName.split(' ').map(n => n[0]).join('').toUpperCase() : 'MP'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userName || "Maya Patel"}</Text>
              <Text style={styles.profileRole}>Cleaning Specialist</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {renderHeader()}
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        style={styles.scrollView}
      >
        {/* Welcome Section */}
        <LinearGradient
          colors={[
            'rgba(177, 213, 232, 1)', // Blue tone
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
                  <MaterialIcon name="calendar-today" size={16} color="#3b82f6" />
                  <View style={styles.statBadge}>
                    <Text style={styles.statBadgeText}>+3</Text>
                  </View>
                </View>
                <Text style={styles.statLabel}>Bookings</Text>
              </View>
              
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <MaterialIcon name="star" size={16} color="#f59e0b" />
                  <View style={styles.statBadge}>
                    <Text style={styles.statBadgeText}>+2%</Text>
                  </View>
                </View>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
              
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <MaterialIcon name="trending-up" size={16} color="#10b981" />
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
                      <Text style={styles.latestBadgeText}>Latest</Text>
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
                      const todayServiceStatus = booking.bookingData?.today_service?.status;
                      const taskStatusOriginal = booking.task_status?.toUpperCase();
                      
                      const isInProgress = todayServiceStatus === 'IN_PROGRESS' || 
                                           taskStatus[booking.id] === 'IN_PROGRESS' || 
                                           taskStatusOriginal === 'IN_PROGRESS' || 
                                           taskStatusOriginal === 'STARTED';
                      
                      const isCompleted = todayServiceStatus === 'COMPLETED' || 
                                          taskStatusOriginal === 'COMPLETED';
                      
                      const isNotStarted = todayServiceStatus === 'SCHEDULED' || 
                                           taskStatusOriginal === 'NOT_STARTED';

                      const canStart = booking.bookingData?.today_service?.can_start === true;

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

                          {/* Date & Amount with Phone */}
                          <View style={styles.bookingDetailsGrid}>
                            <View style={styles.dateTimeSection}>
                              <Text style={styles.detailLabel}>Date & Time</Text>
                              <Text style={styles.detailValue}>{booking.date} at {booking.time}</Text>
                            </View>
                            <View style={styles.amountSection}>
                              <View style={styles.amountInfo}>
                                <Text style={styles.detailLabel}>Amount</Text>
                                <Text style={styles.amountValue}>{booking.amount}</Text>
                              </View>
                              {booking.bookingData?.mobileno && (
                                <TouchableOpacity
                                  style={styles.phoneIconButton}
                                  onPress={() => handleCallCustomer(booking.bookingData.mobileno, booking.clientName)}
                                >
                                  <MaterialIcon name="phone" size={16} color="#374151" />
                                </TouchableOpacity>
                              )}
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
                                <Badge key={`addon-${index}`} variant="outline" style={[styles.responsibilityBadge, styles.addonBadge]}>
                                  <Text style={[styles.responsibilityText, styles.addonText]}>
                                    Add-on: {typeof addon === 'object' ? JSON.stringify(addon) : addon}
                                  </Text>
                                </Badge>
                              ))}
                              {(!booking.bookingData?.responsibilities?.tasks?.length && !booking.bookingData?.responsibilities?.add_ons?.length) && (
                                <Text style={[styles.responsibilityText, styles.noResponsibilitiesText]}>
                                  No responsibilities listed
                                </Text>
                              )}
                            </View>
                          </View>
                          
                          {/* Address with Track Button */}
                          <View style={styles.addressContainer}>
                            <View style={styles.addressHeader}>
                              <Text style={styles.detailLabel}>Address</Text>
                              <TouchableOpacity
                                style={styles.trackAddressButton}
                                onPress={() => handleTrackAddress(booking.location)}
                              >
                                <MaterialIcon name="location-on" size={14} color="#374151" />
                                <Text style={styles.trackAddressText}>Track Address</Text>
                              </TouchableOpacity>
                            </View>
                            <Text style={styles.addressText}>{booking.location || "Address not provided"}</Text>
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
                                    todayServiceStatus === 'SCHEDULED' && styles.scheduledBadge,
                                    todayServiceStatus === 'IN_PROGRESS' && styles.inProgressBadge,
                                    todayServiceStatus === 'COMPLETED' && styles.completedBadge
                                  ]}
                                >
                                  <Text style={[
                                    styles.todayServiceBadgeText,
                                    todayServiceStatus === 'SCHEDULED' && styles.scheduledText,
                                    todayServiceStatus === 'IN_PROGRESS' && styles.inProgressText,
                                    todayServiceStatus === 'COMPLETED' && styles.completedText
                                  ]}>
                                    {todayServiceStatus}
                                  </Text>
                                </Badge>
                              </View>
                            </View>
                          )}

                          {/* Task Action Buttons */}
                          <View style={styles.taskActionContainer}>
                            <Text style={styles.taskStatusLabel}>
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
                                <View style={{
                                  borderRadius: 6,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexDirection: 'row',
                                  paddingVertical: 6,
                                  paddingHorizontal: 12,
                                  borderWidth: 1,
                                  borderColor: '#D1D5DB',
                                  backgroundColor: '#F3F4F6',
                                }}>
                                  <ActivityIndicator size="small" color="#374151" />
                                </View>
                              ) : showCompleteButton ? (
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onPress={() => handleStopTask(booking.id, booking.bookingData)}
                                >
                                  <Text style={styles.stopButtonText}>Complete Task</Text>
                                </Button>
                              ) : showCompletedButton ? (
                                <View style={[styles.completedButtonContainer]}>
                                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                    <MaterialIcon name="check-circle" size={16} color="#166534" style={{marginRight: 4}} />
                                    <Text style={{color: '#166534', fontWeight: '500', fontSize: 12}}>Completed</Text>
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
                                <View style={[styles.disabledButtonContainer]}>
                                  <Text style={{color: '#6b7280', fontSize: 12}}>Cannot Start Yet</Text>
                                </View>
                              )}
                            </View>
                          </View>
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
                    <MaterialIcon name="people" size={16} style={styles.buttonIcon} />
                    <Text style={styles.actionButtonText}>View All Bookings</Text>
                  </Button>
                  <Button
                    style={styles.actionButton}
                    variant="outline"
                    onPress={() => setWithdrawalDialogOpen(true)}
                  >
                    <MaterialIcon name="account-balance-wallet" size={16} style={styles.buttonIcon} />
                    <Text style={styles.actionButtonText}>Request Withdrawal</Text>
                  </Button>
                  <Button
                    style={styles.actionButton}
                    variant="outline"
                    onPress={() => setWithdrawalHistoryDialogOpen(true)}
                  >
                    <MaterialIcon name="receipt" size={16} style={styles.buttonIcon} />
                    <Text style={styles.actionButtonText}>Withdrawal History</Text>
                  </Button>
                  <Button
                    style={styles.actionButton}
                    variant="outline"
                    onPress={() => {}}
                  >
                    <MaterialIcon name="calendar-today" size={16} style={styles.buttonIcon} />
                    <Text style={styles.actionButtonText}>Apply Leave</Text>
                  </Button>
                  <Button
                    style={styles.actionButton}
                    variant="outline"
                    onPress={() => {}}
                  >
                    <MaterialIcon name="access-time" size={16} style={styles.buttonIcon} />
                    <Text style={styles.actionButtonText}>Update Availability</Text>
                  </Button>
                  <Button
                    style={styles.actionButton}
                    variant="outline"
                    onPress={() => setReviewsDialogOpen(true)}
                  >
                    <MaterialIcon name="star" size={16} style={styles.buttonIcon} />
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
                    <Badge variant="success">
                      <Text style={styles.statusBadgeText}>Active</Text>
                    </Badge>
                  </View>
                  <View style={styles.statusItem}>
                    <Text style={styles.statusLabel}>Verification</Text>
                    <Badge variant="success">
                      <Text style={styles.statusBadgeText}>Verified</Text>
                    </Badge>
                  </View>
                  <View style={styles.statusItem}>
                    <Text style={styles.statusLabel}>Availability</Text>
                    <Badge variant="primary">
                      <Text style={styles.statusBadgeText}>Available</Text>
                    </Badge>
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
        open={withdrawalHistoryDialogOpen}
        onOpenChange={setWithdrawalHistoryDialogOpen}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    padding: 8,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  profileInfo: {
    alignItems: 'flex-start',
  },
  profileName: {
    fontWeight: '600',
    color: '#111827',
    fontSize: 14,
  },
  profileRole: {
    fontSize: 12,
    color: '#6B7280',
  },
  welcomeBanner: {
    backgroundColor: 'rgba(177, 213, 232, 1)',
    padding: 16,
    paddingTop: 24,
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
    marginLeft: 8,
    fontWeight: '400',
  },
  userNameText: {
    fontSize: 20,
    color: '#0e305c',
    marginLeft: 8,
    fontWeight: 'bold',
    marginTop: 2,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#004aad',
    opacity: 0.9,
    textAlign: 'center',
    paddingBottom: 20,
    paddingTop: 16,
    paddingHorizontal: 16,
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
    borderWidth: 1,
    borderColor: '#93C5FD',
  },
  latestBadgeText: {
    color: '#1E40AF',
    fontSize: 12,
    fontWeight: '500',
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
    fontSize: 14,
  },
  retryButton: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  retryButtonText: {
    color: '#111827',
    fontWeight: '500',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 14,
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
    flexWrap: 'wrap',
  },
  bookingDetailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dateTimeSection: {
    flex: 1,
  },
  amountSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  amountInfo: {
    alignItems: 'flex-end',
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  phoneIconButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
    marginTop: 4,
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
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  responsibilityText: {
    fontSize: 10,
    color: '#374151',
    fontWeight: '500',
  },
  addonBadge: {
    backgroundColor: '#eff6ff',
    borderColor: '#93c5fd',
  },
  addonText: {
    color: '#1d4ed8',
  },
  noResponsibilitiesText: {
    color: '#9ca3af',
    fontStyle: 'italic',
    fontSize: 12,
  },
  addressContainer: {
    marginBottom: 12,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  trackAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  trackAddressText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  addressText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
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
  scheduledBadge: {
    backgroundColor: '#eff6ff',
    borderColor: '#93c5fd',
    borderWidth: 1,
  },
  inProgressBadge: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
    borderWidth: 1,
  },
  completedBadge: {
    backgroundColor: '#faf5ff',
    borderColor: '#c4b5fd',
    borderWidth: 1,
  },
  todayServiceBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  scheduledText: {
    color: '#1e40af',
  },
  inProgressText: {
    color: '#166534',
  },
  completedText: {
    color: '#5b21b6',
  },
  taskActionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 16,
  },
  taskStatusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
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
    backgroundColor: '#dcfce7',
    borderColor: '#22c55e',
    borderWidth: 1,
  },
  disabledButtonContainer: {
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderColor: '#d1d5db',
    borderWidth: 1,
    opacity: 0.6,
  },
  startButtonText: {
    color: '#3b82f6',
    fontWeight: '500',
    fontSize: 12,
  },
  stopButtonText: {
    color: '#ffffff',
    fontWeight: '500',
    fontSize: 12,
  },
  actionButton: {
    width: '100%',
    justifyContent: 'flex-start',
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  actionButtonText: {
    marginLeft: 8,
    color: '#111827',
    fontWeight: '500',
    fontSize: 14,
  },
  buttonIcon: {
    color: '#6b7280',
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
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
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