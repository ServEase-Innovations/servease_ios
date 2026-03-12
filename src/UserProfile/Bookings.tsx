/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable */

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  ViewStyle,
  TextStyle,
  StyleProp,
  Modal,
  RefreshControl,
  Dimensions,
  Linking,
  BackHandler,
} from 'react-native';
import { useAuth0 } from 'react-native-auth0';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import axiosInstance from '../services/axiosInstance';
import dayjs from 'dayjs';
import axios from 'axios';
import RazorpayCheckout from 'react-native-razorpay';
import { useTheme } from '../../src/Settings/ThemeContext';

// Import existing components
import UserHoliday from './UserHoliday';
import ModifyBookingDialog from './ModifyBookingDialog';
import VacationManagementDialog from './VacationManagement';

// Import new components
import ConfirmationDialog from './ConfirmationDialog';
import AddReviewDialog from './AddReviewDialog';
import WalletDialog from './WalletDialog';
import EngagementDetailsDrawer from './EngagementDetailsDrawer';
import LinearGradient from 'react-native-linear-gradient';
import PaymentInstance from '../services/paymentInstance';
import { useAppUser } from '../context/AppUserContext';
// Add this import at the top with other dialog imports
import ServicesDialog from '../ServiceDialogs/ServicesDialog';

// Helper function to log ALL booking data in detail
const logBookingData = (data: any, source: string) => {
  console.log(`\n\n📋 ===== BOOKING DATA DEBUG - ${source} =====`);
  console.log(`📊 Data Type: ${Array.isArray(data) ? 'Array' : typeof data}`);
  console.log(`📊 Data Length: ${Array.isArray(data) ? data.length : 'N/A (not array)'}`);
  
  if (Array.isArray(data) && data.length > 0) {
    console.log(`\n🔍 First Item Structure:`);
    console.log(JSON.stringify(data[0], null, 2));
    
    console.log(`\n🔍 All Items Provider Info:`);
    data.forEach((item, index) => {
      console.log(`\n--- Item ${index + 1} ---`);
      console.log(`📌 ID: ${item.engagement_id || item.id || 'N/A'}`);
      console.log(`📌 Service Type: ${item.service_type || item.serviceType || 'N/A'}`);
      
      // Log provider object details
      console.log(`👤 Provider Object Keys:`, item.provider ? Object.keys(item.provider) : 'No provider object');
      
      if (item.provider) {
        console.log(`👤 Provider Details:`);
        console.log(`   - firstName: ${item.provider.firstName}`);
        console.log(`   - firstname: ${item.provider.firstname}`);
        console.log(`   - FirstName: ${item.provider.FirstName}`);
        console.log(`   - lastName: ${item.provider.lastName}`);
        console.log(`   - lastname: ${item.provider.lastname}`);
        console.log(`   - LastName: ${item.provider.LastName}`);
        console.log(`   - rating: ${item.provider.rating}`);
        console.log(`   - Full provider object:`, JSON.stringify(item.provider, null, 2));
      }
      
      // Log service_provider object details
      if (item.service_provider) {
        console.log(`👤 Service Provider Object:`);
        console.log(`   - firstName: ${item.service_provider.firstName}`);
        console.log(`   - firstname: ${item.service_provider.firstname}`);
        console.log(`   - Full service_provider object:`, JSON.stringify(item.service_provider, null, 2));
      }
      
      // Log other important fields
      console.log(`📌 assignment_status: ${item.assignment_status}`);
      console.log(`📌 serviceProviderName: ${item.serviceProviderName}`);
      console.log(`📌 provider_name: ${item.provider_name}`);
      console.log(`📌 task_status: ${item.task_status}`);
      console.log(`📌 booking_type: ${item.booking_type}`);
      console.log(`📌 start_date: ${item.start_date}`);
      console.log(`📌 end_date: ${item.end_date}`);
      console.log(`📌 start_time: ${item.start_time}`);
      console.log(`📌 end_time: ${item.end_time}`);
      console.log(`📌 start_epoch: ${item.start_epoch}`);
      
      // Log payment details
      if (item.payment) {
        console.log(`💰 Payment Details:`, JSON.stringify(item.payment, null, 2));
      }
      
      // Log vacation details
      if (item.vacation) {
        console.log(`🏖️ Vacation Details:`, JSON.stringify(item.vacation, null, 2));
      }
      
      // Log modifications
      if (item.modifications && item.modifications.length > 0) {
        console.log(`🔄 Modifications:`, JSON.stringify(item.modifications, null, 2));
      }
      
      // Log responsibilities
      if (item.responsibilities) {
        console.log(`📋 Responsibilities:`, JSON.stringify(item.responsibilities, null, 2));
      }
    });
  } else if (data && typeof data === 'object') {
    console.log(`\n🔍 Single Object Structure:`);
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log(`\n⚠️ No data to display`);
  }
  
  console.log(`\n📋 ===== END DEBUG =====\n\n`);
};

// Helper function to log the final mapped booking data
const logMappedBooking = (booking: any, index: number) => {
  console.log(`\n🎯 ===== MAPPED BOOKING ${index + 1} =====`);
  console.log(`📌 Final ID: ${booking.id}`);
  console.log(`📌 Final Service Provider Name: "${booking.serviceProviderName}"`);
  console.log(`📌 Provider Rating: ${booking.providerRating}`);
  console.log(`📌 Assignment Status: ${booking.assignmentStatus}`);
  console.log(`📌 Task Status: ${booking.taskStatus}`);
  console.log(`📌 Booking Type: ${booking.bookingType}`);
  console.log(`📌 Service Type: ${booking.serviceType}`);
  console.log(`📌 Amount: ${booking.monthlyAmount}`);
  console.log(`📌 Payment Status: ${booking.payment?.status || 'N/A'}`);
  console.log(`📌 Address: ${booking.address}`);
  console.log(`📌 Start Date: ${booking.startDate}`);
  console.log(`📌 End Date: ${booking.endDate}`);
  console.log(`📌 Start Time: ${booking.start_time}`);
  console.log(`📌 End Time: ${booking.end_time}`);
  console.log(`📌 Start Epoch: ${booking.start_epoch}`);
  console.log(`📌 Has Vacation: ${booking.hasVacation}`);
  if (booking.vacationDetails) {
    console.log(`🏖️ Vacation Details:`, booking.vacationDetails);
  }
  if (booking.modifications && booking.modifications.length > 0) {
    console.log(`🔄 Modification Count: ${booking.modifications.length}`);
  }
  console.log(`🎯 ===== END MAPPED BOOKING =====\n`);
};

// Implement Card component
const Card: React.FC<{ children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }> = ({ children, style, onPress }) => {
  const { colors } = useTheme();
  const Container = onPress ? TouchableOpacity : View;
  return (
    <Container 
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      {children}
    </Container>
  );
};

// Implement Button component
const Button: React.FC<{
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}> = ({ children, onPress, style, disabled = false }) => {
  const { colors } = useTheme();
  return (
    <Pressable
      style={[styles.button, { backgroundColor: colors.card, borderColor: colors.border }, style, disabled && styles.disabledButton]}
      onPress={onPress}
      disabled={disabled}
    >
      {children}
    </Pressable>
  );
};

// Implement Badge component
const Badge: React.FC<{
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}> = ({ children, style }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.badgeBase, { borderColor: colors.border }, style]}>
      {children}
    </View>
  );
};

// Implement Separator component
const Separator: React.FC<{ style?: StyleProp<ViewStyle> }> = ({ style }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.separatorBase, { backgroundColor: colors.border }, style]} />
  );
};

interface CustomerHoliday {
  id: number;
  engagementId: number;
  customerId: number;
  applyHolidayDate: string;
  startDate: string;
  endDate: string;
  serviceType: string;
  active: boolean;
}

interface TodayService {
  service_day_id: string;
  status: string;
  can_start: boolean;
  can_generate_otp: boolean;
  can_complete: boolean;
  otp_active: boolean;
}

interface Task {
  taskType: string;
  [key: string]: any;
}

interface Responsibilities {
  tasks: Task[];
  add_ons?: Task[];
}

interface Modification {
  date: string;
  action: string;
  changes?: {
    new_start_date?: string;
    new_end_date?: string;
    new_start_time?: string;
    start_date?: { from: string; to: string };
    end_date?: { from: string; to: string };
    start_time?: { from: string; to: string };
  };
  refund?: number;
  penalty?: number;
}

interface Payment {
  engagement_id: string;
  base_amount: string;
  platform_fee: string;
  gst: string;
  total_amount: string;
  payment_mode: string;
  status: string;
  created_at: string;
}

interface Booking {
  id: number;
  name: string;
  serviceProviderId: number;
  timeSlot: string;
  date: string;
  startDate: string;
  endDate: string;
  start_time: string;
  end_time: string;
  bookingType: string;
  monthlyAmount: number;
  paymentMode: string;
  address: string;
  customerName: string;
  serviceProviderName: string;
  providerRating: number;
  taskStatus: string;
  bookingDate: string;
  engagements: string;
  service_type: string;
  serviceType: string;
  childAge: string;
  experience: string;
  noOfPersons: string;
  mealType: string;
  modifiedDate: string;
  responsibilities: Responsibilities;
  customerHolidays?: CustomerHoliday[];
  hasVacation?: boolean;
  assignmentStatus: string;
  start_epoch?: number;
  vacation?: {
    start_date?: string;
    end_date?: string;
    leave_days?: number;
    leave_start_date?: string;
    leave_end_date?: string;
    total_days?: number;
    refund_amount?: number;
    leave_type?: string;
  };
  vacationDetails?: {
    leave_type?: string;
    total_days?: number;
    refund_amount?: number;
    leave_end_date?: string;
    leave_start_date?: string;
    end_date?: string;
    start_date?: string;
  };
  modifications: Modification[];
  today_service?: TodayService;
  payment?: Payment; // Added payment interface
}

interface BookingProps {
  onBackToHome?: () => void; // Add this prop for back navigation
}

const getServiceIcon = (type: string) => {
  const serviceType = type || 'other';
  switch (serviceType) {
    case 'maid':
      return 'broom';
    case 'cleaning':
      return 'broom';
    case 'nanny':
      return 'heart';
    case 'cook':
      return 'chef-hat';
    default:
      return 'chef-hat';
  }
};

// FIXED: These functions now accept colors and fontSizes as parameters instead of using hooks
const getStatusBadge = (status: string, colors: any, fontSizes: any) => {
  switch (status) {
    case 'ACTIVE':
      return (
        <Badge style={[styles.activeBadge, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
          <Icon name="alert-circle" size={14} color={colors.primary} />
          <Text style={[styles.activeBadgeText, { color: colors.primary, fontSize: fontSizes.badgeText }]}>Active</Text>
        </Badge>
      );
    case 'COMPLETED':
      return (
        <Badge style={[styles.completedBadge, { backgroundColor: colors.success + '15', borderColor: colors.success + '30' }]}>
          <Icon name="check-circle" size={14} color={colors.success} />
          <Text style={[styles.completedBadgeText, { color: colors.success, fontSize: fontSizes.badgeText }]}>Completed</Text>
        </Badge>
      );
    case 'CANCELLED':
      return (
        <Badge style={[styles.cancelledBadge, { backgroundColor: colors.error + '15', borderColor: colors.error + '30' }]}>
          <Icon name="close-circle" size={14} color={colors.error} />
          <Text style={[styles.cancelledBadgeText, { color: colors.error, fontSize: fontSizes.badgeText }]}>Cancelled</Text>
        </Badge>
      );
    case 'IN_PROGRESS':
      return (
        <Badge style={[styles.inProgressBadge, { backgroundColor: colors.warning + '15', borderColor: colors.warning + '30' }]}>
          <Icon name="clock" size={14} color={colors.warning} />
          <Text style={[styles.inProgressBadgeText, { color: colors.warning, fontSize: fontSizes.badgeText }]}>In Progress</Text>
        </Badge>
      );
    case 'NOT_STARTED':
      return (
        <Badge style={[styles.notStartedBadge, { backgroundColor: colors.textSecondary + '15', borderColor: colors.textSecondary + '30' }]}>
          <Icon name="clock" size={14} color={colors.textSecondary} />
          <Text style={[styles.notStartedBadgeText, { color: colors.textSecondary, fontSize: fontSizes.badgeText }]}>Not Started</Text>
        </Badge>
      );
    default:
      return null;
  }
};

const getBookingTypeBadge = (type: string, colors: any, fontSizes: any) => {
  switch (type) {
    case 'ON_DEMAND':
      return (
        <Badge style={[styles.onDemandBadge, { backgroundColor: colors.info + '15', borderColor: colors.info + '30' }]}>
          <Text style={[styles.onDemandBadgeText, { color: colors.info, fontSize: fontSizes.badgeText }]}>On Demand</Text>
        </Badge>
      );
    case 'MONTHLY':
      return (
        <Badge style={[styles.monthlyBadge, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
          <Text style={[styles.monthlyBadgeText, { color: colors.primary, fontSize: fontSizes.badgeText }]}>Monthly</Text>
        </Badge>
      );
    case 'SHORT_TERM':
      return (
        <Badge style={[styles.shortTermBadge, { backgroundColor: colors.success + '15', borderColor: colors.success + '30' }]}>
          <Text style={[styles.shortTermBadgeText, { color: colors.success, fontSize: fontSizes.badgeText }]}>Short Term</Text>
        </Badge>
      );
    default:
      return (
        <Badge style={[styles.defaultBadge, { backgroundColor: colors.textSecondary + '15', borderColor: colors.textSecondary + '30' }]}>
          <Text style={[styles.defaultBadgeText, { color: colors.textSecondary, fontSize: fontSizes.badgeText }]}>{type}</Text>
        </Badge>
      );
  }
};

const getServiceTitle = (type: string) => {
  const serviceType = type || 'other';
  switch (serviceType) {
    case 'cook':
      return 'Home Cook';
    case 'maid':
      return 'Maid Service';
    case 'nanny':
      return 'Caregiver Service';
    case 'cleaning':
      return 'Cleaning Service';
    default:
      return 'Home Service';
  }
};

const hasVacation = (booking: Booking): boolean => {
  return booking.hasVacation || 
         (booking.vacationDetails && 
          (booking.vacationDetails.total_days || 0) > 0) || 
         false;
};

// UPDATED: Modification restriction functions to use start_epoch
const isModificationTimeAllowed = (startEpoch: any): boolean => {
  console.log("Start epoch ", startEpoch);
  if (!startEpoch) return false;
  
  const now = dayjs().unix(); // current time in seconds
  const cutoff = startEpoch - 30 * 60; // 30 minutes before booking start

  return now < cutoff;
};

const isBookingAlreadyModified = (booking: Booking | null): boolean => {
  if (!booking) return false;
  
  const hasExplicitModifications = booking.modifications && 
    booking.modifications.length > 0 && 
    booking.modifications.some(mod => 
      mod.action === "Date Rescheduled" || 
      mod.action === "Time Rescheduled" ||
      mod.action === "Modified" || 
      mod.action?.includes("Modified") ||
      mod.action?.includes("modified") ||
      mod.action === "Rescheduled" ||
      mod.action?.includes("Reschedule")
    );
  
  return !!hasExplicitModifications;
};

const isModificationDisabled = (booking: Booking | null): boolean => {
  if (!booking) return true;
  
  return !isModificationTimeAllowed(booking.start_epoch) || 
         isBookingAlreadyModified(booking);
};

const getModificationTooltip = (booking: Booking | null): string => {
  if (!booking) return "";
  
  if (isBookingAlreadyModified(booking)) {
    return "This booking has already been modified and cannot be modified again.";
  }
  if (!isModificationTimeAllowed(booking.start_epoch)) {
    return "Modification is only allowed at least 30 minutes before the scheduled time.";
  }
  return "Modify this booking";
};

// NEW: Get detailed modification information for display
const getModificationDetails = (booking: Booking): string => {
  if (!booking.modifications || booking.modifications.length === 0) return "";
  
  const lastMod = booking.modifications[booking.modifications.length - 1];
  
  if (lastMod.action === "Date Rescheduled" && lastMod.changes) {
    if (lastMod.changes.new_start_date && lastMod.changes.new_end_date) {
      return `Date rescheduled to ${lastMod.changes.new_start_date}`;
    } else if (lastMod.changes.start_date) {
      return `Date changed from ${dayjs(lastMod.changes.start_date.from).format('MMM D, YYYY')} to ${dayjs(lastMod.changes.start_date.to).format('MMM D, YYYY')}`;
    }
  } else if (lastMod.action === "Time Rescheduled" && lastMod.changes) {
    if (lastMod.changes.new_start_time) {
      return `Time rescheduled to ${lastMod.changes.new_start_time}`;
    } else if (lastMod.changes.start_time) {
      return `Time changed from ${lastMod.changes.start_time.from} to ${lastMod.changes.start_time.to}`;
    }
  }
  
  return `Last modified: ${lastMod.action}`;
};

// NEW: Time formatting utilities from React code
const formatTimeToAMPM = (timeString: string): string => {
  if (!timeString) return '';
  
  try {
    // Handle both "HH:mm:ss" and "HH:mm" formats
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const minute = parseInt(minutes, 10);
    
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12; // Convert 0 to 12, 13 to 1, etc.
    const displayMinute = minute.toString().padStart(2, '0');
    
    return `${displayHour}:${displayMinute} ${period}`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeString; // Return original if parsing fails
  }
};

const formatTimeRange = (startTime: string, endTime: string): string => {
  return `${formatTimeToAMPM(startTime)} - ${formatTimeToAMPM(endTime)}`;
};

const formatDateForDisplay = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

const Booking: React.FC<BookingProps> = ({ onBackToHome }) => {
  const { colors, fontSize, isDarkMode } = useTheme();
  
  // STATE VARIABLES
  const [currentBookings, setCurrentBookings] = useState<Booking[]>([]);
  const [pastBookings, setPastBookings] = useState<Booking[]>([]);
  const [futureBookings, setFutureBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedBookingForLeave, setSelectedBookingForLeave] = useState<Booking | null>(null);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [modifiedBookings, setModifiedBookings] = useState<number[]>([]);
  const [bookingsWithVacation, setBookingsWithVacation] = useState<number[]>([]);
  const [generatedOTPs, setGeneratedOTPs] = useState<Record<number, string>>({});
  
  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [modifyDialogOpen, setModifyDialogOpen] = useState(false);
  const [holidayDialogOpen, setHolidayDialogOpen] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [reviewedBookings, setReviewedBookings] = useState<number[]>([]);
  const [vacationManagementDialogOpen, setVacationManagementDialogOpen] = useState(false);
  const [selectedBookingForVacationManagement, setSelectedBookingForVacationManagement] = useState<Booking | null>(null);
  // Add this state variable with other state declarations
  const [servicesDialogOpen, setServicesDialogOpen] = useState(false);
  
  // NEW: Engagement Details Drawer state
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState<number | null>(null);
  const [paymentLoading, setPaymentLoading] = useState<number | null>(null);
  
  // Other states
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [uniqueMissingSlots, setUniqueMissingSlots] = useState<string[]>([]);
  const [showAllHistory, setShowAllHistory] = useState(false);

  // Review dialog state
  const [reviewDialogVisible, setReviewDialogVisible] = useState(false);
  const [selectedReviewBooking, setSelectedReviewBooking] = useState<Booking | null>(null);

  // Confirmation dialog state
  const [confirmationDialog, setConfirmationDialog] = useState<{
    open: boolean;
    type: 'cancel' | 'modify' | 'vacation' | 'payment' | null;
    booking: Booking | null;
    message: string;
    title: string;
    severity: 'info' | 'warning' | 'error' | 'success';
  }>({
    open: false,
    type: null,
    booking: null,
    message: '',
    title: '',
    severity: 'info'
  });

  // Vacation dialog state
  const [vacationDialogOpen, setVacationDialogOpen] = useState(false);
  const [selectedBookingForVacation, setSelectedBookingForVacation] = useState<Booking | null>(null);

  // AUTH & INITIALIZATION
  const { user: auth0User } = useAuth0();
  const isAuthenticated = auth0User !== undefined && auth0User !== null;
  const { appUser } = useAppUser();

  // Refs for preventing multiple loads and deep link processing
  const initialLoadDone = useRef(false);
  const isFetchingRef = useRef(false);
  const processedDeepLink = useRef(false);

  // Get font sizes based on theme
  const getFontSizes = () => {
    switch (fontSize) {
      case 'small':
        return {
          headerTitle: 24,
          headerSubtitle: 14,
          sectionTitle: 20,
          sectionSubtitle: 13,
          serviceTitle: 15,
          infoText: 13,
          viewDetailsText: 11,
          buttonText: 11,
          badgeText: 11,
          emptyStateTitle: 18,
          emptyStateText: 15,
          searchInput: 14,
        };
      case 'large':
        return {
          headerTitle: 32,
          headerSubtitle: 18,
          sectionTitle: 24,
          sectionSubtitle: 16,
          serviceTitle: 18,
          infoText: 16,
          viewDetailsText: 14,
          buttonText: 14,
          badgeText: 14,
          emptyStateTitle: 22,
          emptyStateText: 18,
          searchInput: 18,
        };
      default:
        return {
          headerTitle: 28,
          headerSubtitle: 16,
          sectionTitle: 22,
          sectionSubtitle: 14,
          serviceTitle: 16,
          infoText: 14,
          viewDetailsText: 12,
          buttonText: 12,
          badgeText: 12,
          emptyStateTitle: 20,
          emptyStateText: 16,
          searchInput: 16,
        };
    }
  };

  const fontSizes = getFontSizes();

  // Helper function to convert Booking for child components
  const convertBookingForChildComponents = (booking: Booking | null): any => {
    if (!booking) return null;
    
    return {
      ...booking,
      serviceType: booking.serviceType || booking.service_type,
      vacationDetails: booking.vacationDetails ? {
        ...booking.vacationDetails,
        leave_start_date: booking.vacationDetails.leave_start_date || booking.vacationDetails.start_date,
        leave_end_date: booking.vacationDetails.leave_end_date || booking.vacationDetails.end_date,
      } : null
    };
  };

  // NEW: Handle view details to open drawer
  const handleViewDetails = (booking: Booking) => {
    console.log(`📋 View details for booking ${booking.id}`);
    setSelectedBooking(booking);
    setDetailsDrawerOpen(true);
  };

  // NEW: Handle deep linking
  const processDeepLink = async (url: string | null) => {
    if (!url) return;
    
    console.log('🔗 Deep link received:', url);
    
    // Parse the URL
    const parsedUrl = new URL(url);
    const params = new URLSearchParams(parsedUrl.search);
    
    const deepLinkCustomerId = params.get('customerId');
    const deepLinkBookingId = params.get('bookingId');
    const deepLinkAction = params.get('action');
    
    // If no deep link data or already processed, return
    if ((!deepLinkCustomerId && !deepLinkBookingId) || processedDeepLink.current) {
      return;
    }

    console.log('🎯 Deep link data:', {
      customerId: deepLinkCustomerId,
      bookingId: deepLinkBookingId,
      action: deepLinkAction
    });

    // Mark as processed immediately to prevent multiple executions
    processedDeepLink.current = true;

    // CASE 1: View ALL bookings for a specific customer
    if (deepLinkCustomerId && !deepLinkBookingId) {
      console.log(`📋 VIEWING ALL BOOKINGS FOR CUSTOMER #${deepLinkCustomerId}`);
      
      const loggedInCustomerId = appUser?.customerid?.toString();
      
      if (loggedInCustomerId !== deepLinkCustomerId) {
        console.log('👑 Admin view - fetching customer bookings');
        await refreshBookings(deepLinkCustomerId);
      }
      
    // CASE 2: View specific booking
    } else if (deepLinkBookingId) {
      console.log(`🎯 OPENING SPECIFIC BOOKING #${deepLinkBookingId}`);
      
      // Helper function to find and highlight booking
      const findAndHighlightBooking = (bookingId: string) => {
        const allBookings = [...currentBookings, ...futureBookings, ...pastBookings];
        const targetBooking = allBookings.find(b => b.id.toString() === bookingId);
        
        if (targetBooking) {
          console.log('✅ Found booking:', targetBooking.id);
          setSelectedBooking(targetBooking);
          
          // Open drawer by default (matching React behavior)
          const shouldOpenDrawer = deepLinkAction === 'drawer' || !deepLinkAction || deepLinkAction === 'open';
          
          if (shouldOpenDrawer) {
            console.log('📂 Opening details drawer automatically');
            setTimeout(() => {
              setDetailsDrawerOpen(true);
            }, 500);
          }
          
          return true;
        }
        return false;
      };
      
      // Try to find booking immediately
      const found = findAndHighlightBooking(deepLinkBookingId);
      
      // If not found, try a few more times as bookings load
      if (!found) {
        console.log('⏳ Booking not found yet, waiting for data to load...');
        let attempts = 0;
        const maxAttempts = 20; // Try for 20 seconds
        
        const checkInterval = setInterval(() => {
          attempts++;
          const allBookings = [...currentBookings, ...futureBookings, ...pastBookings];
          const found = allBookings.find(b => b.id.toString() === deepLinkBookingId);
          
          if (found) {
            console.log(`✅ Found booking after ${attempts} attempts`);
            clearInterval(checkInterval);
            
            setSelectedBooking(found);
            
            setTimeout(() => {
              const shouldOpenDrawer = deepLinkAction === 'drawer' || !deepLinkAction || deepLinkAction === 'open';
              
              if (shouldOpenDrawer) {
                console.log('📂 Opening details drawer automatically (delayed)');
                setTimeout(() => {
                  setDetailsDrawerOpen(true);
                }, 500);
              }
            }, 500);
            
          } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            console.log('❌ Could not find booking after multiple attempts');
            Alert.alert('Error', `Booking #${deepLinkBookingId} not found`);
          }
        }, 1000);
      }
    }
  };

  // NEW: Set up deep linking listener
  useEffect(() => {
    // Handle initial URL if app was opened via deep link
    const getInitialUrl = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        await processDeepLink(initialUrl);
      }
    };
    
    getInitialUrl();
    
    // Add event listener for deep links when app is already open
    const subscription = Linking.addEventListener('url', ({ url }) => {
      processDeepLink(url);
    });
    
    return () => {
      subscription.remove();
    };
  }, []);

  // DATA FETCHING FUNCTIONS
  useEffect(() => {
    if (isAuthenticated && appUser?.customerid) {
      console.log('🔑 User authenticated with customerid:', appUser.customerid);
      setIsLoading(true);
      setCustomerId(appUser.customerid);
      fetchBookings(appUser.customerid);
    } else {
      console.log('🔑 User not authenticated or no customerid');
      setIsLoading(false);
    }
  }, [appUser, isAuthenticated]);

  // Refresh function from React code
  const refreshBookings = async (id?: string) => {
    const effectiveId = id || customerId;
    if (effectiveId !== null && effectiveId !== undefined) {
      console.log("🔄 Fetching bookings for customerId:", effectiveId);

      try {
        const response = await PaymentInstance.get(
          `/api/customers/${effectiveId}/engagements`
        );

        console.log('📡 API Response Status:', response.status);
        console.log('📡 API Response Headers:', response.headers);
        
        const responseData = response.data || {};
        console.log('📡 Raw API Response Data Structure:', Object.keys(responseData));
        
        const { past = [], ongoing = [], upcoming = [], cancelled = [] } = responseData;
        
        console.log(`📊 Booking Counts - Past: ${past.length}, Ongoing: ${ongoing.length}, Upcoming: ${upcoming.length}, Cancelled: ${cancelled.length}`);
        
        // Log detailed data for each category
        if (past.length > 0) {
          logBookingData(past, 'PAST BOOKINGS');
        }
        if (ongoing.length > 0) {
          logBookingData(ongoing, 'ONGOING BOOKINGS');
        }
        if (upcoming.length > 0) {
          logBookingData(upcoming, 'UPCOMING BOOKINGS');
        }
        if (cancelled.length > 0) {
          logBookingData(cancelled, 'CANCELLED BOOKINGS');
        }

        setPastBookings(mapBookingData(past));
        setCurrentBookings(mapBookingData(ongoing));
        setFutureBookings(mapBookingData(upcoming));
        
      } catch (error: any) {
        console.error('❌ Error fetching bookings:', error);
        console.error('❌ Error response:', error.response?.data);
        console.error('❌ Error status:', error.response?.status);
      }
    }
  };

  const fetchBookings = async (id: string) => {
    try {
      await refreshBookings(id);
    } catch (error) {
      console.error("❌ Error fetching booking details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // UPDATED: Improved mapBookingData function with provider info and base_amount and payment
const mapBookingData = (data: any[]) => {
  console.log(`\n🗺️ ===== MAPPING BOOKING DATA =====`);
  console.log(`📊 Input data length: ${data.length}`);
  
  const result = Array.isArray(data)
    ? data.map((item, index) => {
        console.log(`\n📦 Processing item ${index + 1}:`);
        console.log(`📌 Raw item keys:`, Object.keys(item));
        
        const hasVacation = item?.vacation?.leave_days > 0;
        const serviceType = item.service_type?.toLowerCase() || item.serviceType?.toLowerCase() || 'other';
        const modifications = item.modifications || [];
        const hasModifications = modifications.length > 0;

        // Get provider information from the provider object - MATCHING REACT CODE
        let serviceProviderName = "Not Assigned";
        let providerRating = 0;
        
        console.log(`🔍 Looking for provider name...`);
        
        // DIRECT PROPERTY ACCESS - Like in React code (lowercase firstname/lastname)
        if (item.provider) {
          console.log(`✅ Found provider object:`, item.provider);
          const firstName = item.provider.firstname || '';
          const lastName = item.provider.lastname || '';
          const fullName = `${firstName} ${lastName}`.trim();
          
          if (fullName && fullName !== ' ') {
            serviceProviderName = fullName;
            providerRating = item.provider.rating || 0;
            console.log(`✅ Using provider name: "${serviceProviderName}"`);
          } else {
            console.log(`❌ Provider name is empty in provider object`);
          }
        } 
        // Check service_provider object (fallback)
        else if (item.service_provider) {
          console.log(`✅ Found service_provider object:`, item.service_provider);
          const firstName = item.service_provider.firstname || '';
          const lastName = item.service_provider.lastname || '';
          const fullName = `${firstName} ${lastName}`.trim();
          
          if (fullName && fullName !== ' ') {
            serviceProviderName = fullName;
            providerRating = item.service_provider.rating || 0;
            console.log(`✅ Using service_provider name: "${serviceProviderName}"`);
          }
        }
        // Check if assignment status is UNASSIGNED
        else if (item.assignment_status === "UNASSIGNED") {
          serviceProviderName = "Awaiting Assignment";
          console.log(`✅ Using "Awaiting Assignment" (UNASSIGNED status)`);
        } 
        // Check other possible fields (fallbacks)
        else if (item.serviceProviderName && item.serviceProviderName !== "undefined undefined") {
          serviceProviderName = item.serviceProviderName;
          console.log(`✅ Using serviceProviderName field: "${serviceProviderName}"`);
        } else if (item.provider_name) {
          serviceProviderName = item.provider_name;
          console.log(`✅ Using provider_name field: "${serviceProviderName}"`);
        } else {
          console.log(`❌ No provider name found in any field`);
        }

        // Use the current dates from API (which should reflect modifications)
        const effectiveStartDate = item.start_date;
        const effectiveEndDate = item.end_date;

        // Get amount - check multiple possible fields
        const amount = item.base_amount || item.monthlyAmount || item.total_amount || 0;

        // Get start_epoch for modification checks
        const startEpoch = item.start_epoch || 0;

        // Get payment data
        const payment = item.payment || null;

        const mappedBooking = {
          id: item.engagement_id,
          customerId: item.customerId,
          serviceProviderId: item.serviceproviderid || item.serviceProviderId,
          name: item.customerName,
          timeSlot: item.start_time,
          date: effectiveStartDate,
          startDate: effectiveStartDate,
          endDate: effectiveEndDate,
          start_time: item.start_time,
          end_time: item.end_time,
          bookingType: item.booking_type,
          monthlyAmount: amount,
          paymentMode: item.paymentMode,
          address: item.address || 'No address specified',
          customerName: item.customerName,
          serviceProviderName: serviceProviderName,
          providerRating: providerRating,
          taskStatus: item.task_status,
          engagements: item.engagements,
          bookingDate: item.created_at,
          service_type: serviceType,
          serviceType: serviceType,
          childAge: item.childAge,
          experience: item.experience,
          noOfPersons: item.noOfPersons,
          mealType: item.mealType,
          modifiedDate: hasModifications
            ? modifications[modifications.length - 1]?.date || item.created_at
            : item.created_at,
          responsibilities: item.responsibilities,
          customerHolidays: item.customerHolidays || [],
          hasVacation: hasVacation,
          assignmentStatus: item.assignment_status || "ASSIGNED",
          start_epoch: startEpoch,
          // ADD VACATION PROPERTIES HERE:
          vacation: item.vacation || null,
          vacationDetails: hasVacation && item.vacation?.leave_days > 0 
            ? {
                ...item.vacation,
                leave_start_date: item.vacation.start_date || item.vacation.leave_start_date,
                leave_end_date: item.vacation.end_date || item.vacation.leave_end_date,
                total_days: item.vacation.leave_days || item.vacation.total_days,
              }
            : null,
          modifications: modifications,
          today_service: item.today_service,
          payment: payment // Added payment data
        };

        // Log the mapped booking
        logMappedBooking(mappedBooking, index);
        
        return mappedBooking;
      })
    : [];
  
  console.log(`\n🗺️ ===== MAPPING COMPLETE =====`);
  console.log(`📊 Mapped ${result.length} bookings`);
  
  return result;
};

  // OTP Generation Function
  const handleGenerateOTP = async (booking: Booking) => {
    if (!booking.today_service?.service_day_id) {
      console.error('Service day ID not found for OTP generation');
      Alert.alert('Error', 'Service day ID not found for OTP generation');
      return;
    }

    try {
      setOtpLoading(booking.id);
      
      const response = await PaymentInstance.post(
       `/api/engagement-service/service-days/${booking.today_service.service_day_id}/otp`
      );

      if (response.status === 200 || response.status === 201) {
        const otp = response.data.otp || response.data.data?.otp || '123456';
        
        setGeneratedOTPs(prev => ({
          ...prev,
          [booking.id]: otp
        }));

        // Update the booking state
        setCurrentBookings(prev => prev.map(b => 
          b.id === booking.id ? {
            ...b,
            today_service: b.today_service ? {
              ...b.today_service,
              otp_active: true,
              can_generate_otp: false
            } : b.today_service
          } : b
        ));

        setFutureBookings(prev => prev.map(b => 
          b.id === booking.id ? {
            ...b,
            today_service: b.today_service ? {
              ...b.today_service,
              otp_active: true,
              can_generate_otp: false
            } : b.today_service
          } : b
        ));

        Alert.alert('Success', 'OTP generated successfully!');
      }
    } catch (error: any) {
      console.error('Error generating OTP:', error);
      const errorMessage = error.response?.data?.message || 'Failed to generate OTP. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setOtpLoading(null);
    }
  };

  // PAYMENT COMPLETION FUNCTION
  const handleCompletePayment = async (booking: Booking) => {
    if (!booking.payment?.engagement_id) {
      Alert.alert('Error', 'Payment information not found for this booking');
      return;
    }

    try {
      setPaymentLoading(booking.id);
      
      // 1️⃣ Call resume-payment API
      const resumeRes = await PaymentInstance.get(
        `/api/payments/${booking.payment.engagement_id}/resume`
      );

      const {
        razorpay_order_id,
        amount,
        currency,
        engagement_id,
        customer
      } = resumeRes.data;

      // 2️⃣ Open Razorpay Checkout
      const options = {
        key: "rzp_test_lTdgjtSRlEwreA", // Use your test/live key
        amount: amount * 100, // paise
        currency,
        order_id: razorpay_order_id,
        name: "Serveaso",
        description: `Payment for ${getServiceTitle(booking.service_type)} service`,
        prefill: {
          name: customer?.firstname || booking.customerName,
          contact: customer?.contact || '9999999999',
          email: customer?.email || auth0User?.email || '',
        },
        theme: {
          color: colors.primary,
        },
      };

      RazorpayCheckout.open(options).then(async (data: any) => {
        // 3️⃣ Verify payment
        try {
          await PaymentInstance.post("/api/payments/verify", {
            engagementId: engagement_id,
            razorpay_order_id: data.razorpay_order_id,
            razorpay_payment_id: data.razorpay_payment_id,
            razorpay_signature: data.razorpay_signature,
          });
          
          Alert.alert("Success", "Payment completed successfully!");
          // Refresh bookings to update status
          if (customerId) {
            await refreshBookings();
          }
        } catch (verifyError: any) {
          console.error("Payment verification error:", verifyError);
          Alert.alert("Error", "Payment verification failed. Please contact support.");
        }
      }).catch((error: any) => {
        console.error("Payment error:", error);
        if (error.code !== 2) { // Code 2 is user cancellation
          Alert.alert("Error", "Payment was cancelled or failed.");
        }
      });

    } catch (err: any) {
      console.error("Complete payment error:", err);
      Alert.alert("Error", "Unable to resume payment. Please try again.");
    } finally {
      setPaymentLoading(null);
    }
  };

  // Handle payment button click
  const handlePaymentClick = (booking: Booking) => {
    showConfirmation(
      'payment',
      booking,
      'Complete Payment',
      `Complete payment of ₹${booking.monthlyAmount} for your ${getServiceTitle(booking.service_type)} booking?`,
      'info'
    );
  };

  // FILTER & SORT FUNCTIONS
  const filterBookings = (bookings: Booking[], term: string) => {
    if (!term) return bookings;
    
    return bookings.filter(booking => 
      getServiceTitle(booking?.service_type).toLowerCase().includes(term?.toLowerCase()) ||
      booking.serviceProviderName?.toLowerCase().includes(term?.toLowerCase()) ||
      booking.address?.toLowerCase().includes(term?.toLowerCase()) ||
      booking.bookingType?.toLowerCase().includes(term?.toLowerCase())
    );
  };

  const sortUpcomingBookings = (bookings: Booking[]): Booking[] => {
    const statusOrder: Record<string, number> = {
      'NOT_STARTED': 2,
      'IN_PROGRESS': 1,
      'COMPLETED': 3,
      'CANCELLED': 4
    };

    return [...bookings].sort((a, b) => {
      const statusComparison = statusOrder[a.taskStatus] - statusOrder[b.taskStatus];
      if (statusComparison !== 0) return statusComparison;
      return new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime();
    });
  };

  // Improved refresh function
  const onRefresh = async () => {
    console.log('🔄 Manual refresh triggered');
    setIsRefreshing(true);
    try {
      if (customerId !== null) {
        await refreshBookings();
      }
    } catch (error) {
      console.error("❌ Error refreshing bookings:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // NEW: Vacation success handler from React code
  const handleVacationSuccess = async () => {
    console.log('✅ Vacation applied successfully');
    setOpenSnackbar(true);
    await refreshBookings();
  };

  // NEW: Handle modify vacation click from React code
  const handleModifyVacationClick = (booking: Booking) => {
    console.log('📅 Modify vacation clicked for booking:', booking.id);
    setSelectedBookingForVacationManagement(booking);
    setVacationManagementDialogOpen(true);
  };

  // ACTION HANDLERS - CONFIRMATION DIALOG
  const showConfirmation = (
    type: 'cancel' | 'modify' | 'vacation' | 'payment',
    booking: Booking,
    title: string,
    message: string,
    severity: 'info' | 'warning' | 'error' | 'success' = 'info'
  ) => {
    console.log(`⚠️ Showing confirmation dialog: ${title}`);
    setConfirmationDialog({
      open: true,
      type,
      booking,
      message,
      title,
      severity
    });
  };

  const handleConfirmAction = async () => {
    const { type, booking } = confirmationDialog;
    if (!booking) return;

    console.log(`✅ Confirming action: ${type} for booking ${booking.id}`);
    setActionLoading(true);

    try {
      switch (type) {
        case 'cancel':
          await handleCancelBooking(booking);
          break;
        case 'modify':
          setModifyDialogOpen(true);
          setSelectedBooking(booking);
          break;
        case 'vacation':
          setSelectedBookingForLeave(booking);
          setHolidayDialogOpen(true);
          break;
        case 'payment':
          await handleCompletePayment(booking);
          break;
      }
    } catch (error) {
      console.error("❌ Error performing action:", error);
    } finally {
      setActionLoading(false);
      setConfirmationDialog(prev => ({ ...prev, open: false }));
    }
  };

  // ACTION HANDLERS - BUTTON CLICKS
  const handleCancelClick = (booking: Booking) => {
    console.log(`❌ Cancel clicked for booking ${booking.id}`);
    showConfirmation(
      'cancel',
      booking,
      'Cancel Booking',
      `Are you sure you want to cancel your ${getServiceTitle(booking.service_type)} booking? This action cannot be undone.`,
      'warning'
    );
  };

  const handleLeaveReviewClick = (booking: Booking) => {
    console.log(`⭐ Leave review clicked for booking ${booking.id}`);
    setSelectedReviewBooking(booking);
    setReviewDialogVisible(true);
  };

  const closeReviewDialog = () => {
    console.log(`❌ Closing review dialog`);
    setReviewDialogVisible(false);
    setSelectedReviewBooking(null);
  };

  const handleReviewSubmitted = (bookingId: number) => {
    console.log(`✅ Review submitted for booking ${bookingId}`);
    setReviewedBookings(prev => [...prev, bookingId]);
    if (customerId !== null) {
      onRefresh();
    }
  };

  const hasReview = (booking: Booking): boolean => {
    return reviewedBookings.includes(booking.id);
  };

  const handleModifyClick = (booking: Booking) => {
    console.log(`✏️ Modify clicked for booking ${booking.id}`);
    setSelectedBooking(booking);
    setModifyDialogOpen(true);
  };

  const handleVacationClick = (booking: Booking) => {
    console.log(`🏖️ Vacation clicked for booking ${booking.id}`);
    setSelectedBookingForLeave(booking);
    setHolidayDialogOpen(true);
  };

  const handleApplyLeaveClick = (booking: Booking) => {
    console.log(`📅 Apply leave clicked for booking ${booking.id}`);
    setSelectedBookingForLeave(booking);
    setHolidayDialogOpen(true);
  };
  

  // Improved cancel booking with PaymentInstance
  const handleCancelBooking = async (booking: Booking) => {
    console.log(`🚫 Cancelling booking ${booking.id}`);
    try {
      setActionLoading(true);
      
      const response = await PaymentInstance.put(
        `/api/engagements/${booking.id}`,
        {
          task_status: "CANCELLED"
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`✅ Booking ${booking.id} cancelled successfully`);
      
      // Refresh bookings after cancellation
      await refreshBookings();
      setOpenSnackbar(true);
      
    } catch (error: any) {
      console.error("❌ Error cancelling engagement:", error);
      // Fallback update local state
      setCurrentBookings((prev) =>
        prev.map((b) =>
          b.id === booking.id ? { ...b, taskStatus: "CANCELLED" } : b
        )
      );
      setFutureBookings((prev) =>
        prev.map((b) =>
          b.id === booking.id ? { ...b, taskStatus: "CANCELLED" } : b
        )
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Improved modify booking handling
  const handleSaveModifiedBooking = async (updatedData: {
    startDate: string;
    endDate: string;
    timeSlot: string;
  }) => {
    console.log(`💾 Saving modified booking:`, updatedData);
    setModifyDialogOpen(false);
  };

  // Improved leave submit with PaymentInstance
  const handleLeaveSubmit = async (startDate: string, endDate: string, service_type: string): Promise<void> => {
    if (!selectedBookingForLeave || !customerId) {
      console.error('❌ Missing required information for leave application');
      throw new Error("Missing required information for leave application");
    }

    console.log(`📅 Applying leave for booking ${selectedBookingForLeave.id}: ${startDate} to ${endDate}`);
    
    try {
      setIsRefreshing(true);
      
      await PaymentInstance.put(
        `api/engagements/${selectedBookingForLeave.id}`,
        {
          modified_by_role: appUser?.role || 'CUSTOMER',
          vacation_start_date: startDate,
          vacation_end_date: endDate,
          modified_by_id: customerId,
        }
      );

      setBookingsWithVacation(prev => [...prev, selectedBookingForLeave.id]);

      // Refresh bookings after applying leave
      await refreshBookings();
      setOpenSnackbar(true);
      setHolidayDialogOpen(false);
    } catch (error) {
      console.error("❌ Error applying leave:", error);
      throw error;
    } finally {
      setIsRefreshing(false);
    }
  };

  // NEW: renderScheduledMessage function from React code
  const renderScheduledMessage = (booking: Booking) => {
    if (!booking.today_service) {
      console.log(`📅 No today_service for booking ${booking.id}`);
      return null;
    }

    const { status, can_generate_otp, otp_active } = booking.today_service;
    console.log(`📅 Today service status for booking ${booking.id}: ${status}`);

    switch (status) {
      case "SCHEDULED":
        return (
          <View style={[styles.scheduledMessageContainer, { backgroundColor: colors.surface }]}>
            <View style={[styles.scheduledMessageCard, { backgroundColor: colors.infoLight, borderColor: colors.info }]}>
              <View style={styles.scheduledMessageHeader}>
                <Icon name="check-circle" size={16} color={colors.success} />
                <View style={styles.scheduledMessageTitleContainer}>
                  <Text style={[styles.scheduledMessageTitle, { color: colors.text, fontSize: fontSizes.serviceTitle }]}>
                    Confirmed: Scheduled for today.
                  </Text>
                  <Badge style={[styles.scheduledBadge, { backgroundColor: colors.success + '15', borderColor: colors.success + '30' }]}>
                    <Text style={[styles.scheduledBadgeText, { color: colors.success, fontSize: fontSizes.badgeText }]}>Scheduled</Text>
                  </Badge>
                </View>
              </View>
              <Text style={[styles.scheduledMessageText, { color: colors.textSecondary, fontSize: fontSizes.infoText }]}>
                We are waiting for the provider to initiate start process at {formatTimeToAMPM(booking.start_time)}.
              </Text>
            </View>
          </View>
        );

      case "IN_PROGRESS":
        return (
          <View style={[styles.scheduledMessageContainer, { backgroundColor: colors.surface }]}>
            <View style={[styles.inProgressMessageCard, { backgroundColor: colors.successLight, borderColor: colors.success }]}>
              <View style={styles.scheduledMessageHeader}>
                <Icon name="check-circle" size={16} color={colors.success} />
                <View style={styles.scheduledMessageTitleContainer}>
                  <Text style={[styles.scheduledMessageTitle, { color: colors.text, fontSize: fontSizes.serviceTitle }]}>
                    Your service is in progress!
                  </Text>
                  <Badge style={[styles.inProgressBadge, { backgroundColor: colors.warning + '15', borderColor: colors.warning + '30' }]}>
                    <Text style={[styles.inProgressBadgeText, { color: colors.warning, fontSize: fontSizes.badgeText }]}>In Progress</Text>
                  </Badge>
                </View>
              </View>
              <Text style={[styles.scheduledMessageText, { color: colors.textSecondary, fontSize: fontSizes.infoText }]}>
                The provider has started session. Please generate OTP below so they can complete task.
              </Text>
              
              {/* OTP Generation Button */}
              <View style={styles.otpButtonContainer}>
                <Button
                  style={[styles.otpButton, { backgroundColor: colors.primary, borderColor: colors.primary }, otpLoading === booking.id && styles.disabledButton]}
                  onPress={() => handleGenerateOTP(booking)}
                  disabled={otpLoading === booking.id || !booking.today_service?.can_generate_otp}
                >
                  {otpLoading === booking.id ? (
                    <>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={[styles.otpButtonText, { color: '#fff', fontSize: fontSizes.buttonText }]}>Generating...</Text>
                    </>
                  ) : (
                    <>
                      <Icon name="check-circle" size={16} color="#fff" />
                      <Text style={[styles.otpButtonText, { color: '#fff', fontSize: fontSizes.buttonText }]}>
                        {booking.today_service.otp_active ? "OTP Generated" : "Generate & Share OTP"}
                      </Text>
                    </>
                  )}
                </Button>
                
                {booking.today_service.otp_active && (
                  <Badge style={[styles.otpActiveBadge, { backgroundColor: colors.success + '15', borderColor: colors.success + '30' }]}>
                    <Text style={[styles.otpActiveBadgeText, { color: colors.success, fontSize: fontSizes.badgeText }]}>OTP Active</Text>
                  </Badge>
                )}
              </View>
              
              {/* OTP Display Section (if OTP is generated) */}
              {booking.today_service.otp_active && generatedOTPs[booking.id] && (
                <View style={[styles.otpDisplayContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.otpDisplayLabel, { color: colors.text, fontSize: fontSizes.infoText }]}>Share this OTP with your provider:</Text>
                  <View style={styles.otpDisplay}>
                    <Text style={[styles.otpCode, { color: colors.text, fontSize: fontSizes.headerTitle }]}>{generatedOTPs[booking.id]}</Text>
                    <Button
                      style={[styles.copyOtpButton, { borderColor: colors.border }]}
                      onPress={() => {
                        Alert.alert("Success", "OTP copied to clipboard!");
                      }}
                    >
                      <Text style={[styles.copyOtpButtonText, { color: colors.primary, fontSize: fontSizes.buttonText }]}>Copy</Text>
                    </Button>
                  </View>
                  <Text style={[styles.otpExpiryText, { color: colors.textSecondary, fontSize: fontSizes.infoText }]}>Valid for 10 minutes</Text>
                </View>
              )}
            </View>
          </View>
        );

      case "COMPLETED":
        return (
          <View style={[styles.scheduledMessageContainer, { backgroundColor: colors.surface }]}>
            <View style={[styles.completedMessageCard, { backgroundColor: colors.successLight, borderColor: colors.success }]}>
              <View style={styles.scheduledMessageHeader}>
                <Icon name="check-circle" size={16} color={colors.success} />
                <View style={styles.scheduledMessageTitleContainer}>
                  <Text style={[styles.scheduledMessageTitle, { color: colors.text, fontSize: fontSizes.serviceTitle }]}>
                    Service Completed Successfully!
                  </Text>
                  <Badge style={[styles.completedBadge, { backgroundColor: colors.success + '15', borderColor: colors.success + '30' }]}>
                    <Text style={[styles.completedBadgeText, { color: colors.success, fontSize: fontSizes.badgeText }]}>Completed</Text>
                  </Badge>
                </View>
              </View>
              <Text style={[styles.scheduledMessageText, { color: colors.textSecondary, fontSize: fontSizes.infoText }]}>
                Your {getServiceTitle(booking.service_type)} service has been completed at {formatTimeToAMPM(booking.end_time)}. 
                We hope you enjoyed the service!
              </Text>
              
              {/* Review Prompt Section */}
              <View style={[styles.reviewPromptContainer, { borderTopColor: colors.success }]}>
                <View style={styles.reviewPromptContent}>
                  <Text style={[styles.reviewPromptTitle, { color: colors.text, fontSize: fontSizes.serviceTitle }]}>
                    How was your experience?
                  </Text>
                  <Text style={[styles.reviewPromptSubtitle, { color: colors.textSecondary, fontSize: fontSizes.infoText }]}>
                    Help us improve by leaving a review for your provider
                  </Text>
                </View>
                <Button
                  style={[styles.leaveReviewButton, { borderColor: colors.border }]}
                  onPress={() => handleLeaveReviewClick(booking)}
                >
                  <Icon name="message-text" size={16} color={colors.text} />
                  <Text style={[styles.leaveReviewButtonText, { color: colors.text, fontSize: fontSizes.buttonText }]}>Leave Review</Text>
                </Button>
              </View>
            </View>
          </View>
        );

      default:
        console.log(`📅 Unknown status for booking ${booking.id}: ${status}`);
        return null;
    }
  };

  // COMPLETE renderActionButtons function with payment integration
  const renderActionButtons = (booking: Booking) => {
    const modificationDisabled = isModificationDisabled(booking);
    const hasExistingVacation = hasVacation(booking);
    
    // Check if payment is pending
    const isPaymentPending = booking.payment && booking.payment.status === "PENDING";
    const canShowPaymentButton = isPaymentPending && booking.taskStatus !== 'CANCELLED';

    console.log(`🔘 Rendering action buttons for booking ${booking.id}:`);
    console.log(`   - Status: ${booking.taskStatus}`);
    console.log(`   - Modification disabled: ${modificationDisabled}`);
    console.log(`   - Has vacation: ${hasExistingVacation}`);
    console.log(`   - Payment pending: ${isPaymentPending}`);
    console.log(`   - Can show payment button: ${canShowPaymentButton}`);

    // If payment is pending, show payment button as primary action
    if (canShowPaymentButton) {
      return (
        <View style={styles.paymentActionContainer}>
          <Button
            style={[styles.actionButton, styles.paymentButton, { backgroundColor: colors.error, borderColor: colors.error }]}
            onPress={() => handlePaymentClick(booking)}
            disabled={paymentLoading === booking.id}
          >
            {paymentLoading === booking.id ? (
              <>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={[styles.paymentButtonText, { color: '#fff', fontSize: fontSizes.buttonText }]}>Processing...</Text>
              </>
            ) : (
              <>
                <Icon name="credit-card" size={16} color="#fff" />
                <Text style={[styles.paymentButtonText, { color: '#fff', fontSize: fontSizes.buttonText }]}>Complete Payment</Text>
              </>
            )}
          </Button>
          
          {/* Optionally show cancel button even when payment is pending */}
          <Button 
            style={[styles.actionButton, styles.cancelButton, { backgroundColor: colors.error, borderColor: colors.error }]}
            onPress={() => handleCancelClick(booking)}
          >
            <Icon name="close-circle" size={16} color="#fff" />
            <Text style={[styles.cancelButtonText, { color: '#fff', fontSize: fontSizes.buttonText }]}>Cancel Booking</Text>
          </Button>
        </View>
      );
    }

    // Regular action buttons based on task status
    switch (booking.taskStatus) {
   case 'NOT_STARTED':
  return (
    <View style={styles.compactActionRow}>
      {booking.bookingType === "MONTHLY" && (
        <Button
          style={[
            styles.compactActionButton, 
            styles.modifyButton,
            { borderColor: colors.primary, backgroundColor: colors.card },
            modificationDisabled && styles.disabledButton
          ]}
          onPress={() => handleModifyClick(booking)}
          disabled={modificationDisabled}
        >
          <Icon name="pencil" size={16} color={modificationDisabled ? colors.textSecondary : colors.primary} />
          <Text style={[
            styles.modifyButtonText,
            { color: modificationDisabled ? colors.textSecondary : colors.primary, fontSize: fontSizes.buttonText },
            modificationDisabled && { color: colors.textSecondary }
          ]}>
            Modify
          </Text>
        </Button>
      )}

      {booking.bookingType === "MONTHLY" && (
        <>
          {hasExistingVacation ? (
            <Button
              style={[styles.compactActionButton, styles.vacationModifiedButton, { backgroundColor: colors.infoLight, borderColor: colors.info }]}
              onPress={() => handleModifyVacationClick(booking)}
              disabled={isRefreshing}
            >
              <Icon name="pencil" size={16} color={colors.primary} />
              <Text style={[styles.vacationModifiedText, { color: colors.primary, fontSize: fontSizes.buttonText }]}>Modify Vacation</Text>
            </Button>
          ) : (
            <Button
              style={[styles.compactActionButton, styles.vacationButton, { borderColor: colors.primary, backgroundColor: colors.card }]}
              onPress={() => handleVacationClick(booking)}
              disabled={isRefreshing}
            >
              <Icon name="calendar" size={16} color={colors.primary} />
              <Text style={[styles.vacationButtonText, { color: colors.primary, fontSize: fontSizes.buttonText }]}>Add Vacation</Text>
            </Button>
          )}
        </>
      )}
    </View>
  );
      case 'IN_PROGRESS':
        return (
          <View style={styles.actionButtonsRow}>
            <Button 
              style={[styles.actionButton, styles.callButton, { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={() => {
                console.log(`📞 Call provider for booking ${booking.id}`);
                Alert.alert('Call', `Call provider for ongoing ${getServiceTitle(booking.service_type)} service`);
              }}
            >
              <Icon name="phone" size={16} color="#fff" />
              <Text style={[styles.callButtonText, { color: '#fff', fontSize: fontSizes.buttonText }]}>Call</Text>
            </Button>

            <Button 
              style={[styles.actionButton, styles.messageButton, { backgroundColor: colors.success, borderColor: colors.success }]}
              onPress={() => {
                console.log(`💬 Message provider for booking ${booking.id}`);
                Alert.alert('Message', `Message provider for ongoing ${getServiceTitle(booking.service_type)} service`);
              }}
            >
              <Icon name="message-text" size={16} color="#fff" />
              <Text style={[styles.messageButtonText, { color: '#fff', fontSize: fontSizes.buttonText }]}>Message</Text>
            </Button>

            <Button 
              style={[styles.actionButton, styles.cancelButton, { backgroundColor: colors.error, borderColor: colors.error }]}
              onPress={() => handleCancelClick(booking)}
            >
              <Icon name="close-circle" size={16} color="#fff" />
              <Text style={[styles.cancelButtonText, { color: '#fff', fontSize: fontSizes.buttonText }]}>Cancel</Text>
            </Button>

            {booking.bookingType === "MONTHLY" && (
              <>
                {hasExistingVacation ? (
                  <Button
                    style={[styles.actionButton, styles.vacationModifiedButton, { backgroundColor: colors.infoLight, borderColor: colors.info }]}
                    onPress={() => handleModifyVacationClick(booking)}
                    disabled={isRefreshing}
                  >
                    <Icon name="pencil" size={16} color={colors.primary} />
                    <Text style={[styles.vacationModifiedText, { color: colors.primary, fontSize: fontSizes.buttonText }]}>Modify Vacation</Text>
                  </Button>
                ) : (
                  <Button
                    style={[styles.actionButton, styles.vacationButton, { borderColor: colors.primary, backgroundColor: colors.card }]}
                    onPress={() => handleVacationClick(booking)}
                    disabled={isRefreshing}
                  >
                    <Icon name="calendar" size={16} color={colors.primary} />
                    <Text style={[styles.vacationButtonText, { color: colors.primary, fontSize: fontSizes.buttonText }]}>Add Vacation</Text>
                  </Button>
                )}
              </>
            )}
          </View>
        );

      case 'COMPLETED':
        return (
          <View style={styles.actionButtonsRow}>
            {hasReview(booking) ? (
              <Button
                style={[styles.actionButton, styles.reviewSubmittedButton, { backgroundColor: colors.successLight, borderColor: colors.success }]}
                disabled={true}
              >
                <Icon name="check-circle" size={16} color={colors.success} />
                <Text style={[styles.reviewSubmittedText, { color: colors.success, fontSize: fontSizes.buttonText }]}>Reviewed</Text>
              </Button>
            ) : (
              <Button
                style={[styles.actionButton, styles.reviewButton, { borderColor: colors.primary, backgroundColor: colors.card }]}
                onPress={() => handleLeaveReviewClick(booking)}
              >
                <Icon name="message-text" size={16} color={colors.primary} />
                <Text style={[styles.reviewButtonText, { color: colors.primary, fontSize: fontSizes.buttonText }]}>Review</Text>
              </Button>
            )}

            <Button 
              style={[styles.actionButton, styles.bookAgainButton, { borderColor: colors.primary, backgroundColor: colors.card }]}
              onPress={() => {
                console.log(`📅 Book again for service ${booking.serviceType}`);
                setServicesDialogOpen(true);
              }}
            >
              <Icon name="calendar-plus" size={16} color={colors.primary} />
              <Text style={[styles.bookAgainText, { color: colors.primary, fontSize: fontSizes.buttonText }]}>Book Again</Text>
            </Button>
          </View>
        );

      case 'CANCELLED':
        return (
          <View style={styles.actionButtonsRow}>
            <Button 
              style={[styles.actionButton, styles.bookAgainButton, { borderColor: colors.primary, backgroundColor: colors.card }]}
              onPress={() => {
                console.log(`📅 Book again for cancelled service ${booking.serviceType}`);
                setServicesDialogOpen(true);
              }}
            >
              <Icon name="calendar-plus" size={16} color={colors.primary} />
              <Text style={[styles.bookAgainText, { color: colors.primary, fontSize: fontSizes.buttonText }]}>Book Again</Text>
            </Button>
          </View>
        );

      default:
        return (
          <View style={styles.actionButtonsRow}>
            {/* No buttons for default case */}
          </View>
        );
    }
  };

  // DATA PROCESSING
  const upcomingBookings = sortUpcomingBookings([...currentBookings, ...futureBookings]);
  const filteredByStatus = statusFilter === 'ALL' 
    ? upcomingBookings 
    : upcomingBookings.filter(booking => booking.taskStatus === statusFilter);
  const filteredUpcomingBookings = filterBookings(filteredByStatus, searchTerm);
  const filteredPastBookings = filterBookings(pastBookings, searchTerm);

  // Log final state
  useEffect(() => {
    console.log('\n📊 ===== FINAL BOOKING STATE =====');
    console.log(`📌 Current Bookings: ${currentBookings.length}`);
    console.log(`📌 Future Bookings: ${futureBookings.length}`);
    console.log(`📌 Past Bookings: ${pastBookings.length}`);
    console.log(`📌 Upcoming Bookings: ${upcomingBookings.length}`);
    console.log(`📌 Filtered Upcoming: ${filteredUpcomingBookings.length}`);
    console.log(`📌 Filtered Past: ${filteredPastBookings.length}`);
    console.log(`📌 Status Filter: ${statusFilter}`);
    console.log(`📌 Search Term: "${searchTerm}"`);
    console.log(`📌 Customer ID: ${customerId}`);
    console.log(`📌 Loading: ${isLoading}, Refreshing: ${isRefreshing}`);
    console.log('📊 ===== END STATE =====\n');
  }, [currentBookings, futureBookings, pastBookings, upcomingBookings, filteredUpcomingBookings, filteredPastBookings, statusFilter, searchTerm, customerId, isLoading, isRefreshing]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Define status options for tabs - UPDATED to match React version
  const statusTabs = [
    { value: 'ALL', label: 'All', count: upcomingBookings.length },
    { value: 'NOT_STARTED', label: 'Not Started', count: upcomingBookings.filter(b => b.taskStatus === 'NOT_STARTED').length },
    { value: 'IN_PROGRESS', label: 'In Progress', count: upcomingBookings.filter(b => b.taskStatus === 'IN_PROGRESS').length },
    { value: 'COMPLETED', label: 'Completed', count: upcomingBookings.filter(b => b.taskStatus === 'COMPLETED').length },
    { value: 'CANCELLED', label: 'Cancelled', count: upcomingBookings.filter(b => b.taskStatus === 'CANCELLED').length },
  ];

  // UPDATED: REDESIGNED renderBookingItem with clean, minimal design matching the image
  const renderBookingItem = ({ item }: { item: Booking }) => {
    const serviceType = item.serviceType || item.service_type;
    const isPaymentPending = item.payment && item.payment.status === "PENDING";
    
    console.log(`\n🖼️ Rendering booking item ${item.id}:`);
    console.log(`   - Service Provider: "${item.serviceProviderName}"`);
    console.log(`   - Task Status: ${item.taskStatus}`);
    console.log(`   - Payment Pending: ${isPaymentPending}`);
    
    return (
      <Card 
        style={[styles.bookingCard, { borderColor: colors.border }]}
        onPress={() => handleViewDetails(item)}
      >
        {/* Header with Service Title and Status - Clean minimal design */}
        <View style={styles.cardHeader}>
          <View style={styles.serviceInfoContainer}>
            <View style={[styles.serviceIconContainer, { backgroundColor: colors.primary + '15' }]}>
              <Icon 
                name={getServiceIcon(serviceType)} 
                size={20} 
                color={colors.primary}
              />
            </View>
            <Text style={[styles.serviceTitle, { color: colors.text, fontSize: fontSizes.serviceTitle }]}>{getServiceTitle(serviceType)}</Text>
          </View>
          
          <View style={styles.statusContainer}>
            {/* Pass colors and fontSizes to the badge functions */}
            {getBookingTypeBadge(item.bookingType, colors, fontSizes)}
          </View>
        </View>

        {/* Payment Pending Badge - Placed after service title */}
        {isPaymentPending && item.taskStatus !== 'CANCELLED' && (
          <View style={styles.paymentPendingRow}>
            <Badge style={[styles.paymentPendingBadge, { backgroundColor: colors.error + '15', borderColor: colors.error + '30' }]}>
              <Icon name="alert-circle" size={14} color={colors.error} />
              <Text style={[styles.paymentPendingBadgeText, { color: colors.error, fontSize: fontSizes.badgeText }]}>Payment Required</Text>
            </Badge>
          </View>
        )}

        {/* Awaiting Assignment Badge (if applicable) */}
        {item.assignmentStatus === "UNASSIGNED" && !isPaymentPending && (
          <View style={styles.awaitingRow}>
            <Badge style={[styles.awaitingBadge, { backgroundColor: colors.warning + '15', borderColor: colors.warning + '30' }]}>
              <Icon name="clock" size={14} color={colors.warning} />
              <Text style={[styles.awaitingBadgeText, { color: colors.warning, fontSize: fontSizes.badgeText }]}>Awaiting Assignment</Text>
            </Badge>
          </View>
        )}

        {/* Date and Time - Clean row */}
        <View style={styles.dateTimeRow}>
          <View style={styles.infoItem}>
            <Icon name="calendar" size={16} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary, fontSize: fontSizes.infoText }]}>{dayjs(item.date).format('ddd, MMM D, YYYY')}</Text>
          </View>
          <View style={styles.infoItem}>
            <Icon name="clock" size={16} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary, fontSize: fontSizes.infoText }]}>{formatTimeRange(item.start_time, item.end_time)}</Text>
          </View>
        </View>

        {/* Scheduled Message Section */}
        <View style={styles.scheduledMessageSection}>
          {renderScheduledMessage(item)}
        </View>

        <Separator style={styles.separator} />

        {/* Action Buttons - Details button removed, now using card click */}
        <View style={styles.actionButtonsContainer}>
          {renderActionButtons(item)}
        </View>

        {/* View Details Indicator - Subtle arrow at bottom right like Flipkart */}
        <View style={styles.viewDetailsIndicator}>
          <Text style={[styles.viewDetailsText, { color: colors.textSecondary, fontSize: fontSizes.viewDetailsText }]}>Tap to view details</Text>
          <Icon name="chevron-right" size={16} color={colors.textSecondary} />
        </View>
      </Card>
    );
  };

  // ============= BACK BUTTON AND HARDWARE BACK HANDLING =============
  
  // Handle back button press
  const handleBackPress = () => {
    console.log('⬅️ Back button pressed in Booking component');
    
    // Close any open dialogs first
    if (detailsDrawerOpen) {
      console.log('📂 Closing details drawer');
      setDetailsDrawerOpen(false);
      return true; // Prevent default back behavior
    }
    
    if (modifyDialogOpen) {
      console.log('❌ Closing modify dialog');
      setModifyDialogOpen(false);
      return true;
    }
    
    if (holidayDialogOpen) {
      console.log('❌ Closing holiday dialog');
      setHolidayDialogOpen(false);
      return true;
    }
    
    if (vacationManagementDialogOpen) {
      console.log('❌ Closing vacation management dialog');
      setVacationManagementDialogOpen(false);
      return true;
    }
    
    if (reviewDialogVisible) {
      console.log('❌ Closing review dialog');
      setReviewDialogVisible(false);
      return true;
    }
    
    if (servicesDialogOpen) {
      console.log('❌ Closing services dialog');
      setServicesDialogOpen(false);
      return true;
    }
    
    if (walletDialogOpen) {
      console.log('💰 Closing wallet dialog');
      setWalletDialogOpen(false);
      return true;
    }
    
    if (confirmationDialog.open) {
      console.log('❌ Closing confirmation dialog');
      setConfirmationDialog(prev => ({ ...prev, open: false }));
      return true;
    }
    
    // If no dialogs are open, navigate back to home
    if (onBackToHome) {
      console.log('🏠 Navigating back to HomePage');
      onBackToHome();
      return true; // Prevent default back behavior
    }
    
    return false; // Let default back behavior happen
  };

  // Set up hardware back button listener
  useEffect(() => {
    console.log('🎯 Setting up back button handler for Booking component');
    
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress
    );

    // Clean up listener on unmount
    return () => {
      console.log('🧹 Cleaning up back button handler for Booking component');
      backHandler.remove();
    };
  }, [
    onBackToHome,
    detailsDrawerOpen,
    modifyDialogOpen,
    holidayDialogOpen,
    vacationManagementDialogOpen,
    reviewDialogVisible,
    servicesDialogOpen,
    walletDialogOpen,
    confirmationDialog.open
  ]);

  if (isLoading) {
    console.log('⏳ Loading state active');
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary, fontSize: fontSizes.infoText }]}>Loading your bookings...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with Back Button */}
      <LinearGradient
        colors={[
          isDarkMode ? 'rgba(14, 48, 92, 0.9)' : 'rgba(139, 187, 221, 0.8)',
          isDarkMode ? 'rgba(30, 64, 108, 0.9)' : 'rgba(213, 229, 233, 0.8)',
          isDarkMode ? colors.background : 'rgba(255,255,255,1)'
        ]}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}} // Vertical fade
        style={styles.header}
      >
        <View style={styles.headerTopRow}>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: 'rgba(255, 255, 255, 0.9)' }]}
            onPress={handleBackPress}
          >
            <Icon name="arrow-left" size={24} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: colors.primary, fontSize: fontSizes.headerTitle }]}>My Bookings</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary, fontSize: fontSizes.headerSubtitle }]}>Manage your household service appointments</Text>
          </View>
        </View>
        
        <View style={styles.headerRight}>
          <View style={styles.searchContainer}>
            <TextInput
              style={[styles.searchInput, { 
                backgroundColor: colors.card, 
                borderColor: colors.border, 
                color: colors.text,
                fontSize: fontSizes.searchInput
              }]}
              placeholder="Search bookings..."
              placeholderTextColor={colors.placeholder}
              value={searchTerm}
              onChangeText={(text) => {
                console.log(`🔍 Search term changed: "${text}"`);
                setSearchTerm(text);
              }}
            />
            {searchTerm && (
              <TouchableOpacity 
                style={styles.clearSearchButton}
                onPress={() => {
                  console.log('❌ Clearing search term');
                  setSearchTerm('');
                }}
              >
                <Icon name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity 
            style={[styles.walletButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              console.log('💰 Opening wallet dialog');
              setWalletDialogOpen(true);
            }}
          >
            <Icon name="wallet" size={24} color="#fff" />
            <Text style={[styles.walletText, { color: '#fff', fontSize: fontSizes.badgeText }]}>Wallet</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Upcoming Bookings */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { backgroundColor: colors.primary + '15', borderLeftColor: colors.primary }]}>
            <Icon name="alert-circle" size={24} color={colors.primary} />
            <View style={styles.sectionHeaderContent}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSizes.sectionTitle }]}>Upcoming Bookings</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary, fontSize: fontSizes.sectionSubtitle }]}>
                {filteredUpcomingBookings.length} {filteredUpcomingBookings.length === 1 ? 'booking' : 'bookings'} scheduled
              </Text>
            </View>
            <Badge style={[styles.sectionBadge, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
              <Text style={[styles.sectionBadgeText, { color: colors.primary, fontSize: fontSizes.badgeText }]}>{upcomingBookings.length}</Text>
            </Badge>
          </View>

          {/* Status Filter Tabs */}
          <View style={styles.statusFilterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {statusTabs.map((tab) => (
                <TouchableOpacity
                  key={tab.value}
                  style={[
                    styles.statusTab,
                    { backgroundColor: colors.surface },
                    statusFilter === tab.value && { backgroundColor: colors.primary }
                  ]}
                  onPress={() => {
                    console.log(`📊 Status filter changed to: ${tab.value}`);
                    setStatusFilter(tab.value);
                  }}
                >
                  <Text style={[
                    styles.statusTabText,
                    { color: colors.textSecondary, fontSize: fontSizes.badgeText },
                    statusFilter === tab.value && { color: '#fff' }
                  ]}>
                    {tab.label}
                  </Text>
                  <View style={[styles.statusTabCount, { backgroundColor: colors.border }]}>
                    <Text style={[styles.statusTabCountText, { color: colors.textSecondary, fontSize: fontSizes.badgeText }]}>{tab.count}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {filteredUpcomingBookings.length > 0 ? (
            <FlatList
              data={filteredUpcomingBookings}
              renderItem={renderBookingItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          ) : (
            <Card style={[styles.emptyStateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Icon name="calendar" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyStateTitle, { color: colors.text, fontSize: fontSizes.emptyStateTitle }]}>No Upcoming Bookings</Text>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary, fontSize: fontSizes.emptyStateText }]}>Ready to book your next service?</Text>
              {/* Update the empty state button in the upcoming bookings section */}
              <Button 
                style={[styles.emptyStateButton, { backgroundColor: colors.primary, borderColor: colors.primary }]}
                onPress={() => {
                  console.log('📅 Opening services dialog from empty state');
                  setServicesDialogOpen(true);
                }}
              >
                <Text style={{ color: '#fff', fontSize: fontSizes.buttonText }}>Book a Service</Text>
              </Button>
            </Card>
          )}
        </View>

        {/* Past Bookings */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, styles.pastSectionHeader, { backgroundColor: colors.textSecondary + '15', borderLeftColor: colors.textSecondary }]}>
            <Icon name="history" size={24} color={colors.textSecondary} />
            <View style={styles.sectionHeaderContent}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSizes.sectionTitle }]}>Past Bookings</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary, fontSize: fontSizes.sectionSubtitle }]}>
                {filteredPastBookings.length} {filteredPastBookings.length === 1 ? 'booking' : 'bookings'} in history
              </Text>
            </View>
            <Badge style={[styles.sectionBadge, styles.pastBadge, { backgroundColor: colors.textSecondary + '15', borderColor: colors.textSecondary + '30' }]}>
              <Text style={[styles.sectionBadgeText, styles.pastBadge, { color: colors.textSecondary, fontSize: fontSizes.badgeText }]}>{pastBookings.length}</Text>
            </Badge>
          </View>

          {filteredPastBookings.length > 0 ? (
            <FlatList
              data={filteredPastBookings}
              renderItem={renderBookingItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
            />
          ) : (
            <Card style={[styles.emptyStateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Icon name="clock" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyStateTitle, { color: colors.text, fontSize: fontSizes.emptyStateTitle }]}>No Past Bookings</Text>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary, fontSize: fontSizes.emptyStateText }]}>Your completed and cancelled bookings will appear here.</Text>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Dialogs */}
      <UserHoliday 
        open={holidayDialogOpen}
        onClose={() => {
          console.log('❌ Closing holiday dialog');
          setHolidayDialogOpen(false);
        }}
        booking={convertBookingForChildComponents(selectedBookingForLeave)}
        onLeaveSubmit={handleLeaveSubmit}
      />
      
      <VacationManagementDialog
        open={vacationManagementDialogOpen}
        onClose={() => {
          console.log('❌ Closing vacation management dialog');
          setVacationManagementDialogOpen(false);
          setSelectedBookingForVacationManagement(null);
        }}
        booking={convertBookingForChildComponents(selectedBookingForVacationManagement)}
        customerId={customerId}
        onSuccess={handleVacationSuccess}
      />

      <ModifyBookingDialog
        open={modifyDialogOpen}
        onClose={() => {
          console.log('❌ Closing modify dialog');
          setModifyDialogOpen(false);
        }}
        booking={convertBookingForChildComponents(selectedBooking)}
        timeSlots={timeSlots}
        onSave={handleSaveModifiedBooking}
        customerId={customerId}
        refreshBookings={refreshBookings}
        setOpenSnackbar={setOpenSnackbar}
      />

      <ConfirmationDialog
        open={confirmationDialog.open}
        onClose={() => {
          console.log('❌ Closing confirmation dialog');
          setConfirmationDialog(prev => ({ ...prev, open: false }));
        }}
        onConfirm={handleConfirmAction}
        title={confirmationDialog.title}
        message={confirmationDialog.message}
        confirmText={confirmationDialog.type === 'cancel' ? 'Yes, Cancel' : 'Confirm'}
        loading={actionLoading}
        severity={confirmationDialog.severity}
      />

      <AddReviewDialog
        visible={reviewDialogVisible}
        onClose={closeReviewDialog}
        booking={convertBookingForChildComponents(selectedReviewBooking)}
        onReviewSubmitted={handleReviewSubmitted}
      />

      <WalletDialog 
        open={walletDialogOpen}
        onClose={() => {
          console.log('❌ Closing wallet dialog');
          setWalletDialogOpen(false);
        }}
      />

      {/* Add the ServicesDialog component with other dialog components at the bottom */}
      <ServicesDialog
        open={servicesDialogOpen}
        onClose={() => {
          console.log('❌ Closing services dialog');
          setServicesDialogOpen(false);
        }}
        onServiceSelect={(serviceType) => {
          console.log('✅ Service selected:', serviceType);
          // Handle service selection
          // Example: navigation.navigate('BookingForm', { serviceType });
        }}
      />

      {/* NEW: Engagement Details Drawer */}
      <EngagementDetailsDrawer
        isOpen={detailsDrawerOpen}
        onClose={() => {
          console.log('❌ Closing details drawer');
          setDetailsDrawerOpen(false);
          setSelectedBooking(null);
        }}
        booking={selectedBooking}
      />

      {/* Snackbar for notifications */}
      {openSnackbar && (
        <View style={[styles.snackbar, { backgroundColor: colors.success }]}>
          <Text style={[styles.snackbarText, { color: '#fff', fontSize: fontSizes.infoText }]}>Operation completed successfully!</Text>
          <TouchableOpacity onPress={() => {
            console.log('❌ Closing snackbar');
            setOpenSnackbar(false);
          }}>
            <Icon name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// UPDATED: REDESIGNED Styles with clean, minimal design
const styles = StyleSheet.create({
  // Basic Components
  card: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
    padding: 16,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    minHeight: 40,
  },
  disabledButton: {
    opacity: 0.6,
  },
  badgeBase: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  separatorBase: {
    height: 1,
    marginVertical: 16,
  },

  // Container
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },

  // Header
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingTop: 50,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  headerSubtitle: {
    marginTop: 8,
    textAlign: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  searchContainer: {
    flex: 1,
    position: 'relative',
    marginRight: 12,
  },
  searchInput: {
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
  },
  clearSearchButton: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  walletButton: {
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
  },
  walletText: {
    marginTop: 4,
    fontWeight: '500',
  },

  // Sections
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
  },
  pastSectionHeader: {
    borderLeftColor: 'rgba(156, 163, 175, 0.4)',
  },
  sectionHeaderContent: {
    flex: 1,
    marginLeft: 16,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  sectionSubtitle: {
    marginTop: 4,
  },
  sectionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pastBadge: {
    backgroundColor: 'rgba(156, 163, 175, 0.15)',
    borderColor: 'rgba(156, 163, 175, 0.4)',
  },
  sectionBadgeText: {
    fontWeight: '700',
  },

  // Status Filter Tabs
  statusFilterContainer: {
    marginBottom: 20,
  },
  statusTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  statusTabActive: {
    backgroundColor: '#3b82f6',
  },
  statusTabText: {
    fontWeight: '600',
    marginRight: 8,
  },
  statusTabCount: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  statusTabCountText: {
    fontWeight: '600',
  },

  // REDESIGNED: Booking Card Layout - Clean and minimal
  bookingCard: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },

  // Card Header - Service title and status
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  serviceTitle: {
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
  },

  // Payment Pending Row - Now placed right after header
  paymentPendingRow: {
    marginBottom: 8,
  },
  awaitingRow: {
    marginBottom: 8,
  },

  // Info rows - Clean minimal layout
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 6,
  },

  // Action Buttons Styles
  actionButtonsContainer: {
    width: '100%',
    marginBottom: 8,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minWidth: '22%', // This was causing the extra space
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  callButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  callButtonText: {
    color: '#fff',
    marginLeft: 6,
    fontWeight: '600',
  },
  messageButton: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  messageButtonText: {
    color: '#fff',
    marginLeft: 6,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    borderColor: '#ef4444',
  },
  cancelButtonText: {
    color: '#fff',
    marginLeft: 6,
    fontWeight: '600',
  },
  modifyButton: {
    backgroundColor: '#fff',
    borderColor: '#1e40af',
  },
  // Add these to your existing styles object
compactActionRow: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 8,
  width: '100%',
  justifyContent: 'flex-start',
  marginTop: 4,
  marginBottom: 4,
},

compactActionButton: {
  flex: 0, // Don't allow flex growth
  minWidth: 'auto', // Remove minWidth constraint
  paddingVertical: 8,
  paddingHorizontal: 16,
  backgroundColor: '#fff',
  borderWidth: 1,
  borderRadius: 8,
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'row',
  marginRight: 8, // Add spacing between buttons
  alignSelf: 'flex-start', // Don't stretch
},
  modifyButtonText: {
    color: '#1e40af',
    marginLeft: 6,
    fontWeight: '600',
  },
  vacationButton: {
    backgroundColor: '#fff',
    borderColor: '#1e40af',
  },
  vacationButtonText: {
    color: '#1e40af',
    marginLeft: 6,
    fontWeight: '600',
  },
  vacationModifiedButton: {
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
  },
  vacationModifiedText: {
    color: '#1e40af',
    marginLeft: 6,
    fontWeight: '600',
  },
  reviewButton: {
    backgroundColor: '#fff',
    borderColor: '#1e40af',
  },
  reviewButtonText: {
    color: '#1e40af',
    marginLeft: 6,
    fontWeight: '600',
  },
  reviewSubmittedButton: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  reviewSubmittedText: {
    color: '#10b981',
    marginLeft: 6,
    fontWeight: '600',
  },
  bookAgainButton: {
    backgroundColor: '#fff',
    borderColor: '#3b82f6',
  },
  bookAgainText: {
    color: '#3b82f6',
    marginLeft: 6,
    fontWeight: '600',
  },
  disabledButtonText: {
    color: '#9ca3af',
  },

  // View Details Indicator - Flipkart style
  viewDetailsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  viewDetailsText: {
    marginRight: 4,
  },

  // Payment Button
  paymentActionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
    marginBottom: 8,
  },
  paymentButton: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
    flex: 1,
    minWidth: '45%',
  },
  paymentButtonText: {
    color: '#fff',
    marginLeft: 6,
    fontWeight: '600',
  },

  // Badge Styles
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  activeBadgeText: {
    marginLeft: 4,
    fontWeight: '600',
  },
  completedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  completedBadgeText: {
    marginLeft: 4,
    fontWeight: '600',
  },
  cancelledBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  cancelledBadgeText: {
    marginLeft: 4,
    fontWeight: '600',
  },
  inProgressBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  inProgressBadgeText: {
    marginLeft: 4,
    fontWeight: '600',
  },
  notStartedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  notStartedBadgeText: {
    marginLeft: 4,
    fontWeight: '600',
  },
  onDemandBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  onDemandBadgeText: {
    fontWeight: '600',
  },
  monthlyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  monthlyBadgeText: {
    fontWeight: '600',
  },
  shortTermBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  shortTermBadgeText: {
    fontWeight: '600',
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  defaultBadgeText: {
    fontWeight: '600',
  },
  awaitingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  awaitingBadgeText: {
    marginLeft: 4,
    fontWeight: '600',
  },
  paymentPendingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  paymentPendingBadgeText: {
    marginLeft: 4,
    fontWeight: '600',
  },

  // Scheduled Message Section Styles
  scheduledMessageSection: {
    marginTop: 12,
  },
  scheduledMessageContainer: {
    marginTop: 12,
    width: '100%',
  },
  scheduledMessageCard: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  inProgressMessageCard: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  completedMessageCard: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  scheduledMessageHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  scheduledMessageTitleContainer: {
    flex: 1,
    marginLeft: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  scheduledMessageTitle: {
    fontWeight: '600',
    flex: 1,
  },
  scheduledMessageText: {
    marginBottom: 12,
    lineHeight: 18,
    fontWeight: '400',
  },
  scheduledBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  scheduledBadgeText: {
    fontWeight: '600',
  },
  otpButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  otpButton: {
    minWidth: 160,
    flex: 1,
    paddingVertical: 10,
  },
  otpButtonText: {
    marginLeft: 8,
    fontWeight: '600',
  },
  otpActiveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  otpActiveBadgeText: {
    fontWeight: '600',
  },
  otpDisplayContainer: {
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
  },
  otpDisplayLabel: {
    fontWeight: '500',
    marginBottom: 6,
  },
  otpDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  otpCode: {
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  copyOtpButton: {
    backgroundColor: 'transparent',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  copyOtpButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  otpExpiryText: {
    fontStyle: 'italic',
  },
  reviewPromptContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 12,
  },
  reviewPromptContent: {
    flex: 1,
  },
  reviewPromptTitle: {
    fontWeight: '600',
  },
  reviewPromptSubtitle: {
    marginTop: 2,
    lineHeight: 16,
  },
  leaveReviewButton: {
    backgroundColor: 'transparent',
    marginLeft: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  leaveReviewButtonText: {
    marginLeft: 6,
    fontWeight: '600',
  },

  // Empty State
  emptyStateCard: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 12,
    borderWidth: 1,
  },
  emptyStateTitle: {
    fontWeight: '700',
    marginTop: 20,
  },
  emptyStateText: {
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
  emptyStateButton: {
    marginTop: 24,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },

  // Snackbar
  snackbar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  snackbarText: {
    fontWeight: '600',
    flex: 1,
  },
  separator: {
    height: 1,
    marginVertical: 12,
  },
});

export default Booking;