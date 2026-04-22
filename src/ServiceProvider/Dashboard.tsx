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
  StatusBar,
  Modal,
  TextInput,
  Linking,
  Dimensions,
  BackHandler
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import FeatherIcon from 'react-native-vector-icons/Feather';
import FontAwesome5Icon from 'react-native-vector-icons/FontAwesome5';
import { DashboardMetricCard } from './DashboardMetricCard';
// import { PaymentHistory } from './PaymentHistory';
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
import TrackAddress from './TrackAddress';
import { Calendar, MapPin, X, Phone, Clock, Loader2, CheckCircle } from "lucide-react-native";

const { width } = Dimensions.get('window');


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
    Alert.alert("No Contact Info", "Contact information is not available for this customer.");
    return;
  }
  
  const telLink = `tel:${phoneNumber}`;
  Linking.openURL(telLink).catch(() => {
    Alert.alert("Error", "Unable to make the call. Please try again.");
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
    location: booking.address || booking.location || "Address not available",
    status: booking.task_status === "COMPLETED" ? "completed" : 
            booking.task_status === "IN_PROGRESS" || booking.task_status === "STARTED" ? "in-progress" : 
            booking.task_status === "NOT_STARTED" ? "upcoming" : "upcoming",
    amount: amount,
    bookingData: {
      ...booking,
      mobileno: booking.mobileno || "",
      contact: booking.mobileno || "No contact info",
      today_service: booking.today_service || null
    },
    responsibilities: booking.responsibilities || {},
    contact: booking.mobileno || "No contact info",
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
    if (disabled) {
      return {
        backgroundColor: '#f3f4f6',
        borderWidth: 1,
        borderColor: '#e5e7eb',
      };
    }
    
    switch (variant) {
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: '#d1d5db',
        };
      case 'destructive':
        return {
          backgroundColor: '#ef4444',
          borderWidth: 1,
          borderColor: '#ef4444',
        };
      case 'secondary':
        return {
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 1,
          borderColor: 'rgba(59, 130, 246, 0.2)',
        };
      case 'success':
        return {
          backgroundColor: '#10b981',
          borderWidth: 1,
          borderColor: '#10b981',
        };
      case 'primary':
        return {
          backgroundColor: '#3b82f6',
          borderWidth: 1,
          borderColor: '#3b82f6',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderWidth: 0,
        };
      default:
        return {
          backgroundColor: '#3b82f6',
          borderWidth: 1,
          borderColor: '#3b82f6',
        };
    }
  };

  const getTextColor = () => {
    if (disabled) return '#9ca3af';
    
    switch (variant) {
      case 'outline':
        return '#374151';
      case 'ghost':
        return '#374151';
      case 'destructive':
      case 'success':
      case 'primary':
      case 'default':
        return '#ffffff';
      default:
        return '#ffffff';
    }
  };

  return (
    <TouchableOpacity
      style={[
        {
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          opacity: disabled ? 0.6 : 1,
        },
        getVariantStyle(),
        size === 'sm' ? styles.buttonSm : size === 'lg' ? styles.buttonLg : styles.buttonMd,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor()} />
      ) : (
        <>
          {icon && <View style={{marginRight: 8}}>{icon}</View>}
          <Text style={{ 
            color: getTextColor(), 
            fontWeight: '600',
            fontSize: size === 'sm' ? 12 : 14
          }}>
            {children}
          </Text>
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

interface DashboardProps {
  onProfilePress: () => void;
  onBackToHome?: () => void;
}

export default function Dashboard({ onProfilePress, onBackToHome }: DashboardProps) {
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
  
  // Add state for Track Address dialog
  const [trackAddressDialogOpen, setTrackAddressDialogOpen] = useState(false);
  
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
      change: payout?.summary?.total_earned ? "+0%" : "0%",
      changeType: "positive" as const,
      icon: "rupee" as const,
      description: "This month",
      bgColor: "#E8F0FE",
      iconBg: "#3B82F6"
    },
    {
      title: "Security Deposit",
      value: `₹${payout?.summary?.security_deposit_amount?.toLocaleString("en-IN") || 0}`,
      change: payout?.summary?.security_deposit_paid ? "Paid" : "Not Paid",
      changeType: payout?.summary?.security_deposit_paid ? ("positive" as const) : ("negative" as const),
      icon: "home" as const,
      description: "For Active Bookings",
      bgColor: "#FEF3C7",
      iconBg: "#F59E0B"
    },
    {
      title: "Withdrawal",
      value: `₹${(
        (payout?.summary?.total_earned || 0) - (payout?.summary?.available_to_withdraw || 0)
      ).toLocaleString("en-IN")}`,
      change: "Withdrawn",
      changeType: "negative" as const,
      icon: "clock" as const,
      description: "Service Charges",
      bgColor: "#FEE2E2",
      iconBg: "#EF4444"
    },
    {
      title: "Actual Payout Balance",
      value: `₹${payout?.summary?.available_to_withdraw?.toLocaleString("en-IN") || 0}`,
      change: "Ready to Withdraw",
      changeType: "positive" as const,
      icon: "trending-up" as const,
      description: "Request Withdrawal",
      bgColor: "#D1FAE5",
      iconBg: "#10B981"
    }
  ];

  // Handle track address button click
  const handleTrackAddress = () => {
    setTrackAddressDialogOpen(true);
  };

  // Fetch data function
  const fetchData = async () => {
    if (!serviceProviderId) return;

    try {
      setLoading(true);
      const currentMonthYear = getCurrentMonthYear();

      const payoutResponse: AxiosResponse<ProviderPayoutResponse> = await PaymentInstance.get(
        `/api/service-providers/${serviceProviderId}/payouts?month=${currentMonthYear}&detailed=true`
      );
      setPayout(payoutResponse.data);

      const response = await PaymentInstance.get(
        `/api/service-providers/${serviceProviderId}/engagements?month=${currentMonthYear}`
      );

      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: BookingHistoryResponse = response.data;
      setBookings(data);

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      Alert.alert("Error", "Failed to load bookings. Please try again.");
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
        `api/engagement-service/service-days/${serviceDayId}/start`,
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
        `api/engagement-service/service-days/${serviceDayId}/complete`,
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

  // Combine current and future bookings for display
  const upcomingBookings = bookings
    ? [...(bookings.current || []), ...(bookings.upcoming || [])].map(b => formatBookingForCard(b))
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

  // Render responsibilities function matching AllBookingsDialog
  const renderResponsibilities = (booking: any) => {
    if (!booking.responsibilities) return null;

    const responsibilities = booking.responsibilities;
    
    const hasTasks = responsibilities.tasks && responsibilities.tasks.length > 0;
    const hasAddOns = responsibilities.add_ons && responsibilities.add_ons.length > 0;
    
    if (!hasTasks && !hasAddOns) return null;

    return (
      <View style={styles.responsibilitiesSection}>
        <Text style={styles.responsibilitiesTitle}>Responsibilities</Text>
        <View style={styles.responsibilitiesList}>
          {hasTasks && responsibilities.tasks?.map((task: any, index: number) => {
            const taskLabel = task.persons ? `${task.persons} Persons` : "";
            const taskType = task.taskType || task.type || '';
            
            return (
              <View key={`task-${index}`} style={styles.responsibilityItem}>
                <View style={styles.responsibilityBadge}>
                  <Text style={styles.responsibilityBadgeText}>
                    {taskType} {taskLabel}
                  </Text>
                </View>
              </View>
            );
          })}
          
          {hasAddOns && responsibilities.add_ons?.map((addon: any, index: number) => {
            let addonText = '';
            if (typeof addon === 'string') {
              addonText = addon;
            } else if (addon && typeof addon === 'object') {
              addonText = addon.name || addon.type || JSON.stringify(addon);
            }
            
            return (
              <View key={`addon-${index}`} style={styles.responsibilityItem}>
                <View style={[styles.responsibilityBadge, styles.addonBadge]}>
                  <Text style={styles.responsibilityBadgeText}>
                    Add-on: {addonText}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Section with Back Button */}
        <LinearGradient
          colors={[
            'rgba(177, 213, 232, 1)',
            'rgba(213, 229, 233, 0.8)',
            'rgba(255,255,255,1)'
          ]}
          start={{x: 0, y: 0}}
          end={{x: 0, y: 1}}
          style={styles.welcomeBanner}
        >
          <View style={styles.welcomeContent}>
            <View style={styles.welcomeTextContainer}>
              <View style={styles.welcomeIconRow}>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={handleBackPress}
                >
                  <MaterialIcon name="arrow-back" size={24} color="#0e305c" />
                </TouchableOpacity>
                <MaterialIcon name="home" size={20} color="#0e305c" />
                <View>
                  <Text style={styles.welcomeBackText}>Welcome Back,</Text>
                  <Text style={styles.userNameText}>{userName || "Guest"}</Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.mainContent}>
          <Text style={styles.welcomeSubtitle}>
            Dashboard Overview
          </Text>
          
          {/* Enhanced Metrics Grid */}
          <View style={styles.metricsGrid}>
            {metrics.map((metric, index) => (
              <View key={index} style={styles.metricCardWrapper}>
                <LinearGradient
                  colors={[metric.bgColor, 'rgba(255,255,255,0.95)']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.metricCard}
                >
                  <View style={[styles.metricIconContainer, { backgroundColor: metric.iconBg }]}>
                    <MaterialIcon 
                      name={
                        metric.icon === 'rupee' ? 'currency-rupee' :
                        metric.icon === 'home' ? 'home' :
                        metric.icon === 'clock' ? 'access-time' :
                        'trending-up'
                      } 
                      size={20} 
                      color="#FFFFFF" 
                    />
                  </View>
                  
                  <View style={styles.metricContent}>
                    <Text style={styles.metricTitle}>{metric.title}</Text>
                    <Text style={styles.metricValue}>{metric.value}</Text>
                    
                    <View style={styles.metricFooter}>
                      <View style={[
                        styles.metricChange,
                        metric.changeType === 'positive' ? styles.positiveChange :
                        metric.changeType === 'negative' ? styles.negativeChange : null
                      ]}>
                        <MaterialIcon 
                          name={metric.changeType === 'positive' ? 'arrow-upward' : 'arrow-downward'} 
                          size={12} 
                          color={metric.changeType === 'positive' ? '#10B981' : '#EF4444'} 
                        />
                        <Text style={[
                          styles.metricChangeText,
                          metric.changeType === 'positive' ? styles.positiveChangeText :
                          metric.changeType === 'negative' ? styles.negativeChangeText : null
                        ]}>
                          {metric.change}
                        </Text>
                      </View>
                      <Text style={styles.metricDescription}>{metric.description}</Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            ))}
          </View>

          {/* Main Content Grid */}
          <View style={styles.mainGrid}>
            {/* Recent Booking - Now matches AllBookingsDialog card style */}
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
                        Retry
                      </Button>
                    </View>
                  ) : latestBooking.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No bookings found</Text>
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
                        <View key={booking.id} style={styles.bookingCard}>
                          {/* Card Header - Service Title and Status */}
                          <View style={styles.bookingCardHeader}>
                            <View style={styles.bookingCardHeaderTop}>
                              <Text style={styles.bookingId}>
                                Booking ID: {booking.bookingId || "N/A"}
                              </Text>
                              <View style={styles.headerBadges}>
                                {getBookingTypeBadge(booking.bookingData.booking_type || booking.bookingData.bookingType)}
                                {getStatusBadge(booking.bookingData.task_status)}
                              </View>
                            </View>
                            <View style={styles.bookingCardHeaderMain}>
                              <View style={styles.bookingCardHeaderLeft}>
                                <Text style={styles.bookingCardTitle}>
                                  {booking.clientName}
                                </Text>
                                <View style={styles.serviceStatusRow}>
                                  <Text style={styles.serviceText}>
                                    {booking.service}
                                  </Text>
                                </View>
                              </View>
                            </View>
                          </View>

                          <View style={styles.bookingCardContent}>
                            {/* Date, Time and Amount with Phone Icon */}
                            <View style={styles.infoGrid}>
                              <View style={styles.dateTimeSection}>
                                <Text style={styles.infoLabel}>Date & Time</Text>
                                <View style={styles.infoRow}>
                                  <Calendar size={14} color="#6b7280" />
                                  <Text style={styles.infoText}>
                                    {booking.date} at {booking.time}
                                  </Text>
                                </View>
                              </View>
                              <View style={styles.amountSection}>
                                <View style={styles.amountInfo}>
                                  <Text style={styles.amountLabel}>Amount</Text>
                                  <Text style={styles.amountText}>
                                    {booking.amount}
                                  </Text>
                                </View>
                                {booking.bookingData?.mobileno && (
                                  <TouchableOpacity
                                    style={styles.phoneButton}
                                    onPress={() => handleCallCustomer(booking.bookingData.mobileno, booking.clientName)}
                                    activeOpacity={0.7}
                                  >
                                    <Phone size={16} color="#374151" />
                                  </TouchableOpacity>
                                )}
                              </View>
                            </View>

                            {/* Responsibilities Section */}
                            {renderResponsibilities(booking)}

                            {/* Location with Track Address Button */}
                            <View style={styles.locationSection}>
                              <View style={styles.locationHeader}>
                                <Text style={styles.locationLabel}>Address</Text>
                                <TouchableOpacity
                                  style={styles.trackButton}
                                  onPress={handleTrackAddress}
                                  activeOpacity={0.7}
                                >
                                  <MapPin size={14} color="#374151" />
                                  <Text style={styles.trackButtonText}>Track Address</Text>
                                </TouchableOpacity>
                              </View>
                              <Text style={styles.locationText} numberOfLines={2}>
                                {booking.location || "Address not available"}
                              </Text>
                            </View>

                            {/* Today's Service Status Badge */}
                            {todayServiceStatus && (
                              <View style={styles.todayServiceSection}>
                                <Text style={styles.todayServiceLabel}>Today's Service:</Text>
                                <View style={[
                                  styles.todayServiceBadge,
                                  todayServiceStatus === 'SCHEDULED' && styles.scheduledBadge,
                                  todayServiceStatus === 'IN_PROGRESS' && styles.inProgressBadge,
                                  todayServiceStatus === 'COMPLETED' && styles.completedBadge
                                ]}>
                                  <Text style={[
                                    styles.todayServiceText,
                                    todayServiceStatus === 'SCHEDULED' && styles.scheduledText,
                                    todayServiceStatus === 'IN_PROGRESS' && styles.inProgressText,
                                    todayServiceStatus === 'COMPLETED' && styles.completedText
                                  ]}>
                                    {todayServiceStatus}
                                  </Text>
                                </View>
                              </View>
                            )}

                            {/* Task Action Buttons */}
                            <View style={styles.taskActionsSection}>
                              <Text style={styles.taskStatusLabel}>
                                {isInProgress 
                                  ? "Task In Progress"
                                  : isCompleted 
                                    ? "Task Completed"
                                    : isNotStarted
                                      ? "Not Started"
                                      : "Upcoming"
                                }
                              </Text>
                              <View style={styles.taskButtons}>
                                {taskStatusUpdating[booking.id] ? (
                                  <View style={[styles.button, styles.buttonSm]}>
                                    <ActivityIndicator size="small" color="#374151" />
                                  </View>
                                ) : showCompleteButton ? (
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onPress={() => handleStopTask(booking.id, booking.bookingData)}
                                  >
                                    Complete Task
                                  </Button>
                                ) : showCompletedButton ? (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    disabled
                                    icon={<CheckCircle size={14} color="#10b981" />}
                                  >
                                    Completed
                                  </Button>
                                ) : showStartButton ? (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onPress={() => handleStartTask(booking.id, booking.bookingData)}
                                  >
                                    Start Task
                                  </Button>
                                ) : (
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    disabled
                                  >
                                    Cannot Start Yet
                                  </Button>
                                )}
                              </View>
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
                    View All Bookings
                  </Button>
                  <Button
                    style={styles.actionButton}
                    variant="outline"
                    onPress={() => setWithdrawalDialogOpen(true)}
                  >
                    <MaterialIcon name="account-balance-wallet" size={16} style={styles.buttonIcon} />
                    Request Withdrawal
                  </Button>
                  <Button
                    style={styles.actionButton}
                    variant="outline"
                    onPress={() => setWithdrawalHistoryDialogOpen(true)}
                  >
                    <MaterialIcon name="receipt" size={16} style={styles.buttonIcon} />
                    Withdrawal History
                  </Button>
                  <Button
                    style={styles.actionButton}
                    variant="outline"
                    onPress={() => {}}
                  >
                    <MaterialIcon name="calendar-today" size={16} style={styles.buttonIcon} />
                    Apply Leave
                  </Button>
                  <Button
                    style={styles.actionButton}
                    variant="outline"
                    onPress={() => {}}
                  >
                    <MaterialIcon name="access-time" size={16} style={styles.buttonIcon} />
                    Update Availability
                  </Button>
                  <Button
                    style={styles.actionButton}
                    variant="outline"
                    onPress={() => setReviewsDialogOpen(true)}
                  >
                    <MaterialIcon name="star" size={16} style={styles.buttonIcon} />
                    View Reviews
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
          </View>

          {/* Calendar and Payment History */}
          {/* <View style={styles.bottomSection}>
            {serviceProviderId !== null && (
              <View style={styles.calendarContainer}>
                <ProviderCalendarBig providerId={serviceProviderId} />
              </View>
            )}
            <View style={styles.paymentHistoryContainer}>
              <PaymentHistory payments={paymentHistory} />
            </View>
          </View> */}

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
          onClose={() => setTrackAddressDialogOpen(false)}
          googleMapsApiKey={GOOGLE_MAPS_API_KEY}
        />
      </Modal>
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
  welcomeBanner: {
    backgroundColor: 'rgba(177, 213, 232, 1)',
    padding: 20,
    paddingTop: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
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
    fontSize: 14,
    color: '#0e305c',
    marginLeft: 8,
    fontWeight: '400',
  },
  userNameText: {
    fontSize: 22,
    color: '#0e305c',
    marginLeft: 8,
    fontWeight: 'bold',
    marginTop: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeSubtitle: {
    fontSize: 15,
    color: '#4B5563',
    textAlign: 'center',
    paddingBottom: 20,
    paddingTop: 16,
    paddingHorizontal: 16,
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
  metricCardWrapper: {
    width: '48%',
    marginBottom: 12,
  },
  metricCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  metricIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricContent: {
    flex: 1,
  },
  metricTitle: {
    fontSize: 12,
    color: '#4B5563',
    marginBottom: 4,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  metricFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricChange: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
  },
  positiveChange: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  negativeChange: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  metricChangeText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 2,
  },
  positiveChangeText: {
    color: '#10B981',
  },
  negativeChangeText: {
    color: '#EF4444',
  },
  metricDescription: {
    fontSize: 10,
    color: '#6B7280',
    flex: 1,
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
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 14,
  },
  // Booking Card Styles (matching AllBookingsDialog)
  bookingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    overflow: 'hidden',
    marginBottom: 16,
  },
  bookingCardHeader: {
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  bookingCardHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  bookingId: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    flex: 1,
  },
  headerBadges: {
    flexDirection: 'row',
    gap: 4,
    flexShrink: 1,
  },
  bookingCardHeaderMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  bookingCardHeaderLeft: {
    flex: 1,
  },
  bookingCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  serviceStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  serviceText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  bookingCardContent: {
    padding: 16,
    paddingTop: 12,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  dateTimeSection: {
    flex: 1,
    marginRight: 12,
    minWidth: 150,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  infoText: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
    flex: 1,
  },
  amountSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  amountInfo: {
    alignItems: 'flex-end',
  },
  amountLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
    fontWeight: '500',
  },
  amountText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  phoneButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  // Responsibilities Section
  responsibilitiesSection: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  responsibilitiesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  responsibilitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  responsibilityItem: {
    marginBottom: 4,
  },
  responsibilityBadge: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#93c5fd',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  responsibilityBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1d4ed8',
  },
  addonBadge: {
    backgroundColor: '#fdf2f8',
    borderColor: '#fbcfe8',
  },
  // Location Section
  locationSection: {
    marginBottom: 16,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
    gap: 8,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#f3f4f6',
  },
  trackButtonText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  locationText: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  // Today's Service Section
  todayServiceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    padding: 8,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    flexWrap: 'wrap',
  },
  todayServiceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  todayServiceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  scheduledBadge: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#93c5fd',
  },
  inProgressBadge: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  completedBadge: {
    backgroundColor: '#faf5ff',
    borderWidth: 1,
    borderColor: '#d8b4fe',
  },
  todayServiceText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  scheduledText: {
    color: '#1d4ed8',
  },
  inProgressText: {
    color: '#166534',
  },
  completedText: {
    color: '#7c3aed',
  },
  // Task Actions Section
  taskActionsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  taskStatusLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  taskButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  // Button Styles
  button: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  buttonSm: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  buttonMd: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonLg: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  buttonIcon: {
    color: '#6b7280',
  },
  actionButton: {
    width: '100%',
    justifyContent: 'flex-start',
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
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
    width: '100%',
  },
  paymentHistoryContainer: {
    width: '100%',
  },
  signOutButton: {
    backgroundColor: '#ef4444',
    padding: 15,
    borderRadius: 12,
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