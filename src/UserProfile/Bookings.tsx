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
import { useTranslation } from 'react-i18next';

// Import SkeletonLoader
import { SkeletonLoader } from '../common/SkeletonLoader';

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
import ServicesDialog from '../ServiceDialogs/ServicesDialog';

// Helper function to log ONLY critical data (minimal)
const logError = (message: string, error?: any) => {
  if (__DEV__) {
    console.error(`❌ ${message}`, error || '');
  }
};

// Card component
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

// Button component
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

// Badge component
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

// Separator component
const Separator: React.FC<{ style?: StyleProp<ViewStyle> }> = ({ style }) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.separatorBase, { backgroundColor: colors.border }, style]} />
  );
};

// Skeleton Loader Component for Booking Cards
const BookingCardSkeleton: React.FC<{ colors: any; fontSizes: any }> = ({ colors, fontSizes }) => {
  return (
    <Card style={[styles.bookingCard, { borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.serviceInfoContainer}>
          <SkeletonLoader width={32} height={32} variant="circular" />
          <SkeletonLoader width={120} height={20} style={{ marginLeft: 8 }} />
        </View>
        <SkeletonLoader width={80} height={28} variant="rectangular" />
      </View>
      <View style={styles.dateTimeRow}>
        <View style={styles.infoItem}>
          <SkeletonLoader width={16} height={16} variant="circular" />
          <SkeletonLoader width={140} height={16} style={{ marginLeft: 6 }} />
        </View>
        <View style={styles.infoItem}>
          <SkeletonLoader width={16} height={16} variant="circular" />
          <SkeletonLoader width={100} height={16} style={{ marginLeft: 6 }} />
        </View>
      </View>
      <Separator style={styles.separator} />
      <View style={styles.actionButtonsRow}>
        <SkeletonLoader width={100} height={40} variant="rectangular" />
        <SkeletonLoader width={100} height={40} variant="rectangular" />
        <SkeletonLoader width={100} height={40} variant="rectangular" />
      </View>
      <View style={styles.viewDetailsIndicator}>
        <SkeletonLoader width={120} height={14} variant="rectangular" />
      </View>
    </Card>
  );
};

const SectionHeaderSkeleton: React.FC<{ colors: any }> = ({ colors }) => {
  return (
    <View style={[styles.sectionHeader, { backgroundColor: colors.primary + '15', borderLeftColor: colors.primary }]}>
      <SkeletonLoader width={24} height={24} variant="circular" />
      <View style={styles.sectionHeaderContent}>
        <SkeletonLoader width={150} height={24} />
        <SkeletonLoader width={100} height={16} style={{ marginTop: 4 }} />
      </View>
      <SkeletonLoader width={40} height={32} variant="rectangular" />
    </View>
  );
};

const StatusTabsSkeleton: React.FC = () => {
  return (
    <View style={styles.statusFilterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {[1, 2, 3, 4, 5].map((item) => (
          <SkeletonLoader
            key={item}
            width={80}
            height={36}
            variant="rectangular"
            style={{ marginRight: 10 }}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const BookingPageSkeleton: React.FC<{ colors: any; fontSizes: any }> = ({ colors, fontSizes }) => {
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[colors.primary + '40', colors.primary + '20', colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTopRow}>
          <SkeletonLoader width={40} height={40} variant="circular" />
          <View style={styles.headerContent}>
            <SkeletonLoader width={200} height={32} />
            <SkeletonLoader width={250} height={16} style={{ marginTop: 8 }} />
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.searchContainer}>
            <SkeletonLoader width="100%" height={48} variant="rectangular" />
          </View>
          <SkeletonLoader width={70} height={70} variant="rectangular" style={{ marginLeft: 12 }} />
        </View>
      </LinearGradient>
      <ScrollView>
        <View style={styles.section}>
          <SectionHeaderSkeleton colors={colors} />
          <StatusTabsSkeleton />
          {[1, 2, 3].map((item) => (
            <BookingCardSkeleton key={item} colors={colors} fontSizes={fontSizes} />
          ))}
        </View>
        <View style={styles.section}>
          <View style={[styles.sectionHeader, styles.pastSectionHeader, { backgroundColor: colors.textSecondary + '15', borderLeftColor: colors.textSecondary }]}>
            <SkeletonLoader width={24} height={24} variant="circular" />
            <View style={styles.sectionHeaderContent}>
              <SkeletonLoader width={150} height={24} />
              <SkeletonLoader width={100} height={16} style={{ marginTop: 4 }} />
            </View>
            <SkeletonLoader width={40} height={32} variant="rectangular" />
          </View>
          {[1, 2].map((item) => (
            <BookingCardSkeleton key={item} colors={colors} fontSizes={fontSizes} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

// Interfaces
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
  payment?: Payment;
}

interface BookingProps {
  onBackToHome?: () => void;
}

// Utility functions
const getServiceIcon = (type: string) => {
  const serviceType = type || 'other';
  switch (serviceType) {
    case 'maid': return 'broom';
    case 'cleaning': return 'broom';
    case 'nanny': return 'heart';
    case 'cook': return 'chef-hat';
    default: return 'chef-hat';
  }
};

const getStatusBadge = (status: string, colors: any, fontSizes: any, t: any) => {
  switch (status) {
    case 'ACTIVE':
      return (
        <Badge style={[styles.activeBadge, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
          <Icon name="alert-circle" size={14} color={colors.primary} />
          <Text style={[styles.activeBadgeText, { color: colors.primary, fontSize: fontSizes.badgeText }]}>{t('booking.status.active')}</Text>
        </Badge>
      );
    case 'COMPLETED':
      return (
        <Badge style={[styles.completedBadge, { backgroundColor: colors.success + '15', borderColor: colors.success + '30' }]}>
          <Icon name="check-circle" size={14} color={colors.success} />
          <Text style={[styles.completedBadgeText, { color: colors.success, fontSize: fontSizes.badgeText }]}>{t('booking.status.completed')}</Text>
        </Badge>
      );
    case 'CANCELLED':
      return (
        <Badge style={[styles.cancelledBadge, { backgroundColor: colors.error + '15', borderColor: colors.error + '30' }]}>
          <Icon name="close-circle" size={14} color={colors.error} />
          <Text style={[styles.cancelledBadgeText, { color: colors.error, fontSize: fontSizes.badgeText }]}>{t('booking.status.cancelled')}</Text>
        </Badge>
      );
    case 'IN_PROGRESS':
      return (
        <Badge style={[styles.inProgressBadge, { backgroundColor: colors.warning + '15', borderColor: colors.warning + '30' }]}>
          <Icon name="clock" size={14} color={colors.warning} />
          <Text style={[styles.inProgressBadgeText, { color: colors.warning, fontSize: fontSizes.badgeText }]}>{t('booking.status.inProgress')}</Text>
        </Badge>
      );
    case 'NOT_STARTED':
      return (
        <Badge style={[styles.notStartedBadge, { backgroundColor: colors.textSecondary + '15', borderColor: colors.textSecondary + '30' }]}>
          <Icon name="clock" size={14} color={colors.textSecondary} />
          <Text style={[styles.notStartedBadgeText, { color: colors.textSecondary, fontSize: fontSizes.badgeText }]}>{t('booking.status.notStarted')}</Text>
        </Badge>
      );
    default: return null;
  }
};

const getBookingTypeBadge = (type: string, colors: any, fontSizes: any, t: any) => {
  switch (type) {
    case 'ON_DEMAND':
      return (
        <Badge style={[styles.onDemandBadge, { backgroundColor: colors.info + '15', borderColor: colors.info + '30' }]}>
          <Text style={[styles.onDemandBadgeText, { color: colors.info, fontSize: fontSizes.badgeText }]}>{t('booking.options.onDemand')}</Text>
        </Badge>
      );
    case 'MONTHLY':
      return (
        <Badge style={[styles.monthlyBadge, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
          <Text style={[styles.monthlyBadgeText, { color: colors.primary, fontSize: fontSizes.badgeText }]}>{t('booking.options.monthly')}</Text>
        </Badge>
      );
    case 'SHORT_TERM':
      return (
        <Badge style={[styles.shortTermBadge, { backgroundColor: colors.success + '15', borderColor: colors.success + '30' }]}>
          <Text style={[styles.shortTermBadgeText, { color: colors.success, fontSize: fontSizes.badgeText }]}>{t('booking.options.shortTerm')}</Text>
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

const getServiceTitle = (type: string, t: any) => {
  const serviceType = type || 'other';
  switch (serviceType) {
    case 'cook': return t('booking.cards.homeCook');
    case 'maid': return t('booking.cards.maidService');
    case 'nanny': return t('booking.cards.caregiver');
    case 'cleaning': return t('booking.cards.cleaningService');
    default: return t('booking.cards.homeService');
  }
};

const hasVacation = (booking: Booking): boolean => {
  return booking.hasVacation || (booking.vacationDetails && (booking.vacationDetails.total_days || 0) > 0) || false;
};

const isModificationTimeAllowed = (startEpoch: any): boolean => {
  if (!startEpoch) return false;
  const now = dayjs().unix();
  const cutoff = startEpoch - 30 * 60;
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
      mod.action === "Rescheduled" ||
      mod.action?.includes("Reschedule")
    );
  return !!hasExplicitModifications;
};

const isModificationDisabled = (booking: Booking | null): boolean => {
  if (!booking) return true;
  return !isModificationTimeAllowed(booking.start_epoch) || isBookingAlreadyModified(booking);
};

const getModificationDetails = (booking: Booking, t: any): string => {
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
  return t('booking.modification.lastModified', { action: lastMod.action });
};

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
    return timeString;
  }
};

const formatTimeRange = (startTime: string, endTime: string): string => {
  return `${formatTimeToAMPM(startTime)} - ${formatTimeToAMPM(endTime)}`;
};

const Booking: React.FC<BookingProps> = ({ onBackToHome }) => {
  const { colors, fontSize, isDarkMode } = useTheme();
  const { t } = useTranslation();
  
  // State variables
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
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [reviewedBookings, setReviewedBookings] = useState<number[]>([]);
  const [vacationManagementDialogOpen, setVacationManagementDialogOpen] = useState(false);
  const [selectedBookingForVacationManagement, setSelectedBookingForVacationManagement] = useState<Booking | null>(null);
  const [servicesDialogOpen, setServicesDialogOpen] = useState(false);
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

  // Auth
  const { user: auth0User } = useAuth0();
  const isAuthenticated = auth0User !== undefined && auth0User !== null;
  const { appUser } = useAppUser();

  // Refs
  const initialLoadDone = useRef(false);
  const isFetchingRef = useRef(false);
  const processedDeepLink = useRef(false);

  // Font sizes
  const getFontSizes = () => {
    switch (fontSize) {
      case 'small':
        return {
          headerTitle: 24, headerSubtitle: 14, sectionTitle: 20, sectionSubtitle: 13,
          serviceTitle: 15, infoText: 13, viewDetailsText: 11, buttonText: 11,
          badgeText: 11, emptyStateTitle: 18, emptyStateText: 15, searchInput: 14,
        };
      case 'large':
        return {
          headerTitle: 32, headerSubtitle: 18, sectionTitle: 24, sectionSubtitle: 16,
          serviceTitle: 18, infoText: 16, viewDetailsText: 14, buttonText: 14,
          badgeText: 14, emptyStateTitle: 22, emptyStateText: 18, searchInput: 18,
        };
      default:
        return {
          headerTitle: 28, headerSubtitle: 16, sectionTitle: 22, sectionSubtitle: 14,
          serviceTitle: 16, infoText: 14, viewDetailsText: 12, buttonText: 12,
          badgeText: 12, emptyStateTitle: 20, emptyStateText: 16, searchInput: 16,
        };
    }
  };
  const fontSizes = getFontSizes();

  // Helper to convert booking for child components
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

  // Data fetching
  const refreshBookings = async (id?: string) => {
    const effectiveId = id || customerId;
    if (!effectiveId) return;
    try {
      const response = await PaymentInstance.get(`/api/customers/${effectiveId}/engagements`);
      const { past = [], ongoing = [], upcoming = [], cancelled = [] } = response.data || {};
      setPastBookings(mapBookingData(past));
      setCurrentBookings(mapBookingData(ongoing));
      setFutureBookings(mapBookingData(upcoming));
    } catch (error: any) {
      logError('Error fetching bookings:', error);
    }
  };

  const mapBookingData = (data: any[]) => {
    return Array.isArray(data) ? data.map((item) => {
      const hasVacationFlag = item?.vacation?.leave_days > 0;
      const serviceType = item.service_type?.toLowerCase() || item.serviceType?.toLowerCase() || 'other';
      const modifications = item.modifications || [];
      const hasModifications = modifications.length > 0;

      let serviceProviderName = t('booking.cards.notAssigned');
      let providerRating = 0;
      if (item.provider) {
        const firstName = item.provider.firstname || '';
        const lastName = item.provider.lastname || '';
        const fullName = `${firstName} ${lastName}`.trim();
        if (fullName && fullName !== ' ') {
          serviceProviderName = fullName;
          providerRating = item.provider.rating || 0;
        }
      } else if (item.service_provider) {
        const firstName = item.service_provider.firstname || '';
        const lastName = item.service_provider.lastname || '';
        const fullName = `${firstName} ${lastName}`.trim();
        if (fullName && fullName !== ' ') {
          serviceProviderName = fullName;
          providerRating = item.service_provider.rating || 0;
        }
      } else if (item.assignment_status === "UNASSIGNED") {
        serviceProviderName = t('booking.cards.awaitingAssignment');
      } else if (item.serviceProviderName && item.serviceProviderName !== "undefined undefined") {
        serviceProviderName = item.serviceProviderName;
      } else if (item.provider_name) {
        serviceProviderName = item.provider_name;
      }

      const amount = item.base_amount || item.monthlyAmount || item.total_amount || 0;
      const startEpoch = item.start_epoch || 0;

      return {
        id: item.engagement_id,
        customerId: item.customerId,
        serviceProviderId: item.serviceproviderid || item.serviceProviderId,
        name: item.customerName,
        timeSlot: item.start_time,
        date: item.start_date,
        startDate: item.start_date,
        endDate: item.end_date,
        start_time: item.start_time,
        end_time: item.end_time,
        bookingType: item.booking_type,
        monthlyAmount: amount,
        paymentMode: item.paymentMode,
        address: item.address || t('common.address'),
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
        modifiedDate: hasModifications ? modifications[modifications.length - 1]?.date || item.created_at : item.created_at,
        responsibilities: item.responsibilities,
        hasVacation: hasVacationFlag,
        assignmentStatus: item.assignment_status || "ASSIGNED",
        start_epoch: startEpoch,
        vacation: item.vacation || null,
        vacationDetails: hasVacationFlag && item.vacation?.leave_days > 0 ? {
          ...item.vacation,
          leave_start_date: item.vacation.start_date || item.vacation.leave_start_date,
          leave_end_date: item.vacation.end_date || item.vacation.leave_end_date,
          total_days: item.vacation.leave_days || item.vacation.total_days,
        } : null,
        modifications: modifications,
        today_service: item.today_service,
        payment: item.payment
      };
    }) : [];
  };

  const fetchBookings = async (id: string) => {
    try {
      await refreshBookings(id);
    } catch (error) {
      logError('Error fetching booking details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (customerId) await refreshBookings();
    } catch (error) {
      logError('Error refreshing bookings:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Effect to load bookings
  useEffect(() => {
    if (isAuthenticated && appUser?.customerid) {
      setIsLoading(true);
      setCustomerId(appUser.customerid);
      fetchBookings(appUser.customerid);
    } else {
      setIsLoading(false);
    }
  }, [appUser, isAuthenticated]);

  // OTP Generation
  const handleGenerateOTP = async (booking: Booking) => {
    if (!booking.today_service?.service_day_id) {
      Alert.alert(t('common.error'), t('booking.otp.failed'));
      return;
    }
    try {
      setOtpLoading(booking.id);
      const response = await PaymentInstance.post(`/api/engagement-service/service-days/${booking.today_service.service_day_id}/otp`);
      if (response.status === 200 || response.status === 201) {
        const otp = response.data.otp || response.data.data?.otp || '123456';
        setGeneratedOTPs(prev => ({ ...prev, [booking.id]: otp }));
        setCurrentBookings(prev => prev.map(b => b.id === booking.id ? { ...b, today_service: b.today_service ? { ...b.today_service, otp_active: true, can_generate_otp: false } : b.today_service } : b));
        setFutureBookings(prev => prev.map(b => b.id === booking.id ? { ...b, today_service: b.today_service ? { ...b.today_service, otp_active: true, can_generate_otp: false } : b.today_service } : b));
        Alert.alert(t('common.success'), t('booking.otp.generated'));
      }
    } catch (error: any) {
      logError('Error generating OTP:', error);
      Alert.alert(t('common.error'), error.response?.data?.message || t('booking.otp.failed'));
    } finally {
      setOtpLoading(null);
    }
  };

  // Payment
  const handleCompletePayment = async (booking: Booking) => {
    if (!booking.payment?.engagement_id) {
      Alert.alert(t('common.error'), t('booking.payment.resumeFailed'));
      return;
    }
    try {
      setPaymentLoading(booking.id);
      const resumeRes = await PaymentInstance.get(`/api/payments/${booking.payment.engagement_id}/resume`);
      const { razorpay_order_id, amount, currency, engagement_id, customer } = resumeRes.data;
      const options = {
        key: "rzp_test_lTdgjtSRlEwreA",
        amount: amount * 100,
        currency,
        order_id: razorpay_order_id,
        name: "Serveaso",
        description: `${t('booking.payment.description')} ${getServiceTitle(booking.service_type, t)}`,
        prefill: {
          name: customer?.firstname || booking.customerName,
          contact: customer?.contact || '9999999999',
          email: customer?.email || auth0User?.email || '',
        },
        theme: { color: colors.primary },
      };
      RazorpayCheckout.open(options).then(async (data: any) => {
        try {
          await PaymentInstance.post("/api/payments/verify", {
            engagementId: engagement_id,
            razorpay_order_id: data.razorpay_order_id,
            razorpay_payment_id: data.razorpay_payment_id,
            razorpay_signature: data.razorpay_signature,
          });
          Alert.alert(t('common.success'), t('booking.payment.completed'));
          if (customerId) await refreshBookings();
        } catch (verifyError: any) {
          logError('Payment verification error:', verifyError);
          Alert.alert(t('common.error'), t('booking.payment.verificationFailed'));
        }
      }).catch((error: any) => {
        if (error.code !== 2) Alert.alert(t('common.error'), t('booking.payment.failed'));
      });
    } catch (err: any) {
      logError('Complete payment error:', err);
      Alert.alert(t('common.error'), t('booking.payment.resumeFailed'));
    } finally {
      setPaymentLoading(null);
    }
  };

  // Cancel booking
  const handleCancelBooking = async (booking: Booking) => {
    try {
      setActionLoading(true);
      await PaymentInstance.put(`/api/engagements/${booking.id}`, { task_status: "CANCELLED" });
      await refreshBookings();
      setSnackbarMessage(t('booking.messages.cancelSuccess'));
      setOpenSnackbar(true);
    } catch (error: any) {
      logError('Error cancelling engagement:', error);
      setCurrentBookings(prev => prev.map(b => b.id === booking.id ? { ...b, taskStatus: "CANCELLED" } : b));
      setFutureBookings(prev => prev.map(b => b.id === booking.id ? { ...b, taskStatus: "CANCELLED" } : b));
    } finally {
      setActionLoading(false);
    }
  };

  // Vacation submit (corrected endpoint)
  const handleLeaveSubmit = async (startDate: string, endDate: string, service_type: string): Promise<void> => {
    if (!selectedBookingForLeave || !customerId) {
      throw new Error(t('errors.generic'));
    }
    try {
      setIsRefreshing(true);
      await PaymentInstance.post(`/api/v2/engagements/${selectedBookingForLeave.id}/vacation`, {
        customerid: customerId,
        vacation_start_date: startDate,
        vacation_end_date: endDate,
        leave_type: "VACATION",
        modified_by_id: selectedBookingForLeave.id,
        modified_by_role: "CUSTOMER"
      });
      setBookingsWithVacation(prev => [...prev, selectedBookingForLeave.id]);
      await refreshBookings();  // This will reload all bookings and update the UI
      setSnackbarMessage(t('userHoliday.success'));
      setOpenSnackbar(true);
      setHolidayDialogOpen(false);
    } catch (error) {
      logError('Error applying leave:', error);
      throw error;
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleVacationSuccess = async () => {
    setSnackbarMessage(t('booking.messages.vacationUpdated'));
    setOpenSnackbar(true);
    await refreshBookings();
  };

  // Action handlers
  const showConfirmation = (type: 'cancel' | 'modify' | 'vacation' | 'payment', booking: Booking, title: string, message: string, severity: 'info' | 'warning' | 'error' | 'success' = 'info') => {
    setConfirmationDialog({ open: true, type, booking, message, title, severity });
  };

  const handleConfirmAction = async () => {
    const { type, booking } = confirmationDialog;
    if (!booking) return;
    setActionLoading(true);
    try {
      switch (type) {
        case 'cancel': await handleCancelBooking(booking); break;
        case 'modify': setModifyDialogOpen(true); setSelectedBooking(booking); break;
        case 'vacation': setSelectedBookingForLeave(booking); setHolidayDialogOpen(true); break;
        case 'payment': await handleCompletePayment(booking); break;
      }
    } catch (error) {
      logError('Error performing action:', error);
    } finally {
      setActionLoading(false);
      setConfirmationDialog(prev => ({ ...prev, open: false }));
    }
  };

  const handleCancelClick = (booking: Booking) => {
    showConfirmation('cancel', booking, t('booking.confirmation.cancelTitle'), t('booking.confirmation.cancelMessage', { service: getServiceTitle(booking.service_type, t) }), 'warning');
  };

  const handlePaymentClick = (booking: Booking) => {
    showConfirmation('payment', booking, t('booking.confirmation.paymentTitle'), t('booking.confirmation.paymentMessage', { amount: booking.monthlyAmount, service: getServiceTitle(booking.service_type, t) }), 'info');
  };

  const handleModifyClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setModifyDialogOpen(true);
  };

  const handleVacationClick = (booking: Booking) => {
    setSelectedBookingForLeave(booking);
    setHolidayDialogOpen(true);
  };

  const handleModifyVacationClick = (booking: Booking) => {
    setSelectedBookingForVacationManagement(booking);
    setVacationManagementDialogOpen(true);
  };

  const handleLeaveReviewClick = (booking: Booking) => {
    setSelectedReviewBooking(booking);
    setReviewDialogVisible(true);
  };

  const closeReviewDialog = () => {
    setReviewDialogVisible(false);
    setSelectedReviewBooking(null);
  };

  const handleReviewSubmitted = (bookingId: number) => {
    setReviewedBookings(prev => [...prev, bookingId]);
    onRefresh();
  };

  const hasReview = (booking: Booking): boolean => reviewedBookings.includes(booking.id);

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setDetailsDrawerOpen(true);
  };

  const handleSaveModifiedBooking = async (updatedData: any) => {
    setModifyDialogOpen(false);
  };

  // Filtering
  const filterBookings = (bookings: Booking[], term: string) => {
    if (!term) return bookings;
    return bookings.filter(booking => 
      getServiceTitle(booking.service_type, t).toLowerCase().includes(term.toLowerCase()) ||
      booking.serviceProviderName.toLowerCase().includes(term.toLowerCase()) ||
      booking.address.toLowerCase().includes(term.toLowerCase()) ||
      booking.bookingType.toLowerCase().includes(term.toLowerCase())
    );
  };

  const sortUpcomingBookings = (bookings: Booking[]): Booking[] => {
    const statusOrder: Record<string, number> = { 'NOT_STARTED': 2, 'IN_PROGRESS': 1, 'COMPLETED': 3, 'CANCELLED': 4 };
    return [...bookings].sort((a, b) => {
      const statusComparison = statusOrder[a.taskStatus] - statusOrder[b.taskStatus];
      if (statusComparison !== 0) return statusComparison;
      return new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime();
    });
  };

  const upcomingBookings = sortUpcomingBookings([...currentBookings, ...futureBookings]);
  const filteredByStatus = statusFilter === 'ALL' ? upcomingBookings : upcomingBookings.filter(booking => booking.taskStatus === statusFilter);
  const filteredUpcomingBookings = filterBookings(filteredByStatus, searchTerm);
  const filteredPastBookings = filterBookings(pastBookings, searchTerm);

  const statusTabs = [
    { value: 'ALL', label: t('common.all'), count: upcomingBookings.length },
    { value: 'NOT_STARTED', label: t('booking.status.notStarted'), count: upcomingBookings.filter(b => b.taskStatus === 'NOT_STARTED').length },
    { value: 'IN_PROGRESS', label: t('booking.status.inProgress'), count: upcomingBookings.filter(b => b.taskStatus === 'IN_PROGRESS').length },
    { value: 'COMPLETED', label: t('booking.status.completed'), count: upcomingBookings.filter(b => b.taskStatus === 'COMPLETED').length },
    { value: 'CANCELLED', label: t('booking.status.cancelled'), count: upcomingBookings.filter(b => b.taskStatus === 'CANCELLED').length },
  ];

  // Render scheduled message
  const renderScheduledMessage = (booking: Booking) => {
    if (!booking.today_service) return null;
    const { status, can_generate_otp, otp_active } = booking.today_service;
    switch (status) {
      case "SCHEDULED":
        return (
          <View style={[styles.scheduledMessageContainer, { backgroundColor: colors.surface }]}>
            <View style={[styles.scheduledMessageCard, { backgroundColor: colors.infoLight, borderColor: colors.info }]}>
              <View style={styles.scheduledMessageHeader}>
                <Icon name="check-circle" size={16} color={colors.success} />
                <View style={styles.scheduledMessageTitleContainer}>
                  <Text style={[styles.scheduledMessageTitle, { color: colors.text, fontSize: fontSizes.serviceTitle }]}>{t('booking.messages.scheduled')}</Text>
                  <Badge style={[styles.scheduledBadge, { backgroundColor: colors.success + '15', borderColor: colors.success + '30' }]}>
                    <Text style={[styles.scheduledBadgeText, { color: colors.success, fontSize: fontSizes.badgeText }]}>{t('booking.status.scheduled')}</Text>
                  </Badge>
                </View>
              </View>
              <Text style={[styles.scheduledMessageText, { color: colors.textSecondary, fontSize: fontSizes.infoText }]}>{t('booking.messages.scheduledDesc', { time: formatTimeToAMPM(booking.start_time) })}</Text>
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
                  <Text style={[styles.scheduledMessageTitle, { color: colors.text, fontSize: fontSizes.serviceTitle }]}>{t('booking.messages.inProgress')}</Text>
                  <Badge style={[styles.inProgressBadge, { backgroundColor: colors.warning + '15', borderColor: colors.warning + '30' }]}>
                    <Text style={[styles.inProgressBadgeText, { color: colors.warning, fontSize: fontSizes.badgeText }]}>{t('booking.status.inProgress')}</Text>
                  </Badge>
                </View>
              </View>
              <Text style={[styles.scheduledMessageText, { color: colors.textSecondary, fontSize: fontSizes.infoText }]}>{t('booking.messages.inProgressDesc')}</Text>
              <View style={styles.otpButtonContainer}>
                <Button style={[styles.otpButton, { backgroundColor: colors.primary, borderColor: colors.primary }, otpLoading === booking.id && styles.disabledButton]} onPress={() => handleGenerateOTP(booking)} disabled={otpLoading === booking.id || !booking.today_service?.can_generate_otp}>
                  {otpLoading === booking.id ? (
                    <><ActivityIndicator size="small" color="#fff" /><Text style={[styles.otpButtonText, { color: '#fff', fontSize: fontSizes.buttonText }]}>{t('common.loading')}</Text></>
                  ) : (
                    <><Icon name="check-circle" size={16} color="#fff" /><Text style={[styles.otpButtonText, { color: '#fff', fontSize: fontSizes.buttonText }]}>{booking.today_service.otp_active ? t('booking.cards.otpGenerated') : t('booking.cards.generateOTP')}</Text></>
                  )}
                </Button>
                {booking.today_service.otp_active && (
                  <Badge style={[styles.otpActiveBadge, { backgroundColor: colors.success + '15', borderColor: colors.success + '30' }]}>
                    <Text style={[styles.otpActiveBadgeText, { color: colors.success, fontSize: fontSizes.badgeText }]}>{t('booking.cards.otpActive')}</Text>
                  </Badge>
                )}
              </View>
              {booking.today_service.otp_active && generatedOTPs[booking.id] && (
                <View style={[styles.otpDisplayContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.otpDisplayLabel, { color: colors.text, fontSize: fontSizes.infoText }]}>{t('booking.cards.shareOTP')}</Text>
                  <View style={styles.otpDisplay}>
                    <Text style={[styles.otpCode, { color: colors.text, fontSize: fontSizes.headerTitle }]}>{generatedOTPs[booking.id]}</Text>
                    <Button style={[styles.copyOtpButton, { borderColor: colors.border }]} onPress={() => Alert.alert(t('common.success'), t('booking.otp.copied'))}>
                      <Text style={[styles.copyOtpButtonText, { color: colors.primary, fontSize: fontSizes.buttonText }]}>{t('booking.cards.copy')}</Text>
                    </Button>
                  </View>
                  <Text style={[styles.otpExpiryText, { color: colors.textSecondary, fontSize: fontSizes.infoText }]}>{t('booking.cards.validFor')}</Text>
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
                  <Text style={[styles.scheduledMessageTitle, { color: colors.text, fontSize: fontSizes.serviceTitle }]}>{t('booking.messages.completed')}</Text>
                  <Badge style={[styles.completedBadge, { backgroundColor: colors.success + '15', borderColor: colors.success + '30' }]}>
                    <Text style={[styles.completedBadgeText, { color: colors.success, fontSize: fontSizes.badgeText }]}>{t('booking.status.completed')}</Text>
                  </Badge>
                </View>
              </View>
              <Text style={[styles.scheduledMessageText, { color: colors.textSecondary, fontSize: fontSizes.infoText }]}>{t('booking.messages.completedDesc', { service: getServiceTitle(booking.service_type, t), time: formatTimeToAMPM(booking.end_time) })}</Text>
              <View style={[styles.reviewPromptContainer, { borderTopColor: colors.success }]}>
                <View style={styles.reviewPromptContent}>
                  <Text style={[styles.reviewPromptTitle, { color: colors.text, fontSize: fontSizes.serviceTitle }]}>{t('booking.cards.howWasExperience')}</Text>
                  <Text style={[styles.reviewPromptSubtitle, { color: colors.textSecondary, fontSize: fontSizes.infoText }]}>{t('booking.cards.helpUsImprove')}</Text>
                </View>
                <Button style={[styles.leaveReviewButton, { borderColor: colors.border }]} onPress={() => handleLeaveReviewClick(booking)}>
                  <Icon name="message-text" size={16} color={colors.text} />
                  <Text style={[styles.leaveReviewButtonText, { color: colors.text, fontSize: fontSizes.buttonText }]}>{t('booking.cards.leaveReview')}</Text>
                </Button>
              </View>
            </View>
          </View>
        );
      default: return null;
    }
  };

  // Action buttons for each booking card
  const renderActionButtons = (booking: Booking) => {
    const modificationDisabled = isModificationDisabled(booking);
    const hasExistingVacation = hasVacation(booking);
    const isPaymentPending = booking.payment && booking.payment.status === "PENDING";
    const canShowPaymentButton = isPaymentPending && booking.taskStatus !== 'CANCELLED';

    if (canShowPaymentButton) {
      return (
        <View style={styles.paymentActionContainer}>
          <Button style={[styles.actionButton, styles.paymentButton, { backgroundColor: colors.error, borderColor: colors.error }]} onPress={() => handlePaymentClick(booking)} disabled={paymentLoading === booking.id}>
            {paymentLoading === booking.id ? (
              <><ActivityIndicator size="small" color="#fff" /><Text style={[styles.paymentButtonText, { color: '#fff', fontSize: fontSizes.buttonText }]}>{t('booking.cards.processing')}</Text></>
            ) : (
              <><Icon name="credit-card" size={16} color="#fff" /><Text style={[styles.paymentButtonText, { color: '#fff', fontSize: fontSizes.buttonText }]}>{t('booking.cards.completePayment')}</Text></>
            )}
          </Button>
          <Button style={[styles.actionButton, styles.cancelButton, { backgroundColor: colors.error, borderColor: colors.error }]} onPress={() => handleCancelClick(booking)}>
            <Icon name="close-circle" size={16} color="#fff" />
            <Text style={[styles.cancelButtonText, { color: '#fff', fontSize: fontSizes.buttonText }]}>{t('booking.cards.cancel')}</Text>
          </Button>
        </View>
      );
    }

    switch (booking.taskStatus) {
      case 'NOT_STARTED':
        return (
          <View style={styles.compactActionRow}>
            {booking.bookingType === "MONTHLY" && (
              <Button style={[styles.compactActionButton, styles.modifyButton, { borderColor: colors.primary, backgroundColor: colors.card }, modificationDisabled && styles.disabledButton]} onPress={() => handleModifyClick(booking)} disabled={modificationDisabled}>
                <Icon name="pencil" size={16} color={modificationDisabled ? colors.textSecondary : colors.primary} />
                <Text style={[styles.modifyButtonText, { color: modificationDisabled ? colors.textSecondary : colors.primary, fontSize: fontSizes.buttonText }]}>{t('booking.cards.modify')}</Text>
              </Button>
            )}
            {booking.bookingType === "MONTHLY" && (
              <>
                {hasExistingVacation ? (
                  <Button style={[styles.compactActionButton, styles.vacationModifiedButton, { backgroundColor: colors.infoLight, borderColor: colors.info }]} onPress={() => handleModifyVacationClick(booking)} disabled={isRefreshing}>
                    <Icon name="pencil" size={16} color={colors.primary} />
                    <Text style={[styles.vacationModifiedText, { color: colors.primary, fontSize: fontSizes.buttonText }]}>{t('booking.cards.modifyVacation')}</Text>
                  </Button>
                ) : (
                  <Button style={[styles.compactActionButton, styles.vacationButton, { borderColor: colors.primary, backgroundColor: colors.card }]} onPress={() => handleVacationClick(booking)} disabled={isRefreshing}>
                    <Icon name="calendar" size={16} color={colors.primary} />
                    <Text style={[styles.vacationButtonText, { color: colors.primary, fontSize: fontSizes.buttonText }]}>{t('booking.cards.addVacation')}</Text>
                  </Button>
                )}
              </>
            )}
          </View>
        );
      case 'IN_PROGRESS':
        return (
          <View style={styles.actionButtonsRow}>
            <Button style={[styles.actionButton, styles.callButton, { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => Alert.alert(t('booking.cards.call'), `${t('booking.cards.call')} ${getServiceTitle(booking.service_type, t)}`)}>
              <Icon name="phone" size={16} color="#fff" />
              <Text style={[styles.callButtonText, { color: '#fff', fontSize: fontSizes.buttonText }]}>{t('booking.cards.call')}</Text>
            </Button>
            <Button style={[styles.actionButton, styles.messageButton, { backgroundColor: colors.success, borderColor: colors.success }]} onPress={() => Alert.alert(t('booking.cards.message'), `${t('booking.cards.message')} ${getServiceTitle(booking.service_type, t)}`)}>
              <Icon name="message-text" size={16} color="#fff" />
              <Text style={[styles.messageButtonText, { color: '#fff', fontSize: fontSizes.buttonText }]}>{t('booking.cards.message')}</Text>
            </Button>
            <Button style={[styles.actionButton, styles.cancelButton, { backgroundColor: colors.error, borderColor: colors.error }]} onPress={() => handleCancelClick(booking)}>
              <Icon name="close-circle" size={16} color="#fff" />
              <Text style={[styles.cancelButtonText, { color: '#fff', fontSize: fontSizes.buttonText }]}>{t('booking.cards.cancel')}</Text>
            </Button>
            {booking.bookingType === "MONTHLY" && (
              <>
                {hasExistingVacation ? (
                  <Button style={[styles.actionButton, styles.vacationModifiedButton, { backgroundColor: colors.infoLight, borderColor: colors.info }]} onPress={() => handleModifyVacationClick(booking)} disabled={isRefreshing}>
                    <Icon name="pencil" size={16} color={colors.primary} />
                    <Text style={[styles.vacationModifiedText, { color: colors.primary, fontSize: fontSizes.buttonText }]}>{t('booking.cards.modifyVacation')}</Text>
                  </Button>
                ) : (
                  <Button style={[styles.actionButton, styles.vacationButton, { borderColor: colors.primary, backgroundColor: colors.card }]} onPress={() => handleVacationClick(booking)} disabled={isRefreshing}>
                    <Icon name="calendar" size={16} color={colors.primary} />
                    <Text style={[styles.vacationButtonText, { color: colors.primary, fontSize: fontSizes.buttonText }]}>{t('booking.cards.addVacation')}</Text>
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
              <Button style={[styles.actionButton, styles.reviewSubmittedButton, { backgroundColor: colors.successLight, borderColor: colors.success }]} disabled={true}>
                <Icon name="check-circle" size={16} color={colors.success} />
                <Text style={[styles.reviewSubmittedText, { color: colors.success, fontSize: fontSizes.buttonText }]}>{t('booking.cards.reviewed')}</Text>
              </Button>
            ) : (
              <Button style={[styles.actionButton, styles.reviewButton, { borderColor: colors.primary, backgroundColor: colors.card }]} onPress={() => handleLeaveReviewClick(booking)}>
                <Icon name="message-text" size={16} color={colors.primary} />
                <Text style={[styles.reviewButtonText, { color: colors.primary, fontSize: fontSizes.buttonText }]}>{t('booking.cards.review')}</Text>
              </Button>
            )}
            <Button style={[styles.actionButton, styles.bookAgainButton, { borderColor: colors.primary, backgroundColor: colors.card }]} onPress={() => setServicesDialogOpen(true)}>
              <Icon name="calendar-plus" size={16} color={colors.primary} />
              <Text style={[styles.bookAgainText, { color: colors.primary, fontSize: fontSizes.buttonText }]}>{t('booking.cards.bookAgain')}</Text>
            </Button>
          </View>
        );
      case 'CANCELLED':
        return (
          <View style={styles.actionButtonsRow}>
            <Button style={[styles.actionButton, styles.bookAgainButton, { borderColor: colors.primary, backgroundColor: colors.card }]} onPress={() => setServicesDialogOpen(true)}>
              <Icon name="calendar-plus" size={16} color={colors.primary} />
              <Text style={[styles.bookAgainText, { color: colors.primary, fontSize: fontSizes.buttonText }]}>{t('booking.cards.bookAgain')}</Text>
            </Button>
          </View>
        );
      default:
        return null;
    }
  };

  const renderBookingItem = ({ item }: { item: Booking }) => {
    const serviceType = item.serviceType || item.service_type;
    const isPaymentPending = item.payment && item.payment.status === "PENDING";
    return (
      <Card style={[styles.bookingCard, { borderColor: colors.border }]} onPress={() => handleViewDetails(item)}>
        <View style={styles.cardHeader}>
          <View style={styles.serviceInfoContainer}>
            <View style={[styles.serviceIconContainer, { backgroundColor: colors.primary + '15' }]}>
              <Icon name={getServiceIcon(serviceType)} size={20} color={colors.primary} />
            </View>
            <Text style={[styles.serviceTitle, { color: colors.text, fontSize: fontSizes.serviceTitle }]}>{getServiceTitle(serviceType, t)}</Text>
          </View>
          <View style={styles.statusContainer}>{getBookingTypeBadge(item.bookingType, colors, fontSizes, t)}</View>
        </View>
        {isPaymentPending && item.taskStatus !== 'CANCELLED' && (
          <View style={styles.paymentPendingRow}>
            <Badge style={[styles.paymentPendingBadge, { backgroundColor: colors.error + '15', borderColor: colors.error + '30' }]}>
              <Icon name="alert-circle" size={14} color={colors.error} />
              <Text style={[styles.paymentPendingBadgeText, { color: colors.error, fontSize: fontSizes.badgeText }]}>{t('booking.cards.paymentRequired')}</Text>
            </Badge>
          </View>
        )}
        {item.assignmentStatus === "UNASSIGNED" && !isPaymentPending && (
          <View style={styles.awaitingRow}>
            <Badge style={[styles.awaitingBadge, { backgroundColor: colors.warning + '15', borderColor: colors.warning + '30' }]}>
              <Icon name="clock" size={14} color={colors.warning} />
              <Text style={[styles.awaitingBadgeText, { color: colors.warning, fontSize: fontSizes.badgeText }]}>{t('booking.cards.awaitingAssignment')}</Text>
            </Badge>
          </View>
        )}
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
        <View style={styles.scheduledMessageSection}>{renderScheduledMessage(item)}</View>
        <Separator style={styles.separator} />
        <View style={styles.actionButtonsContainer}>{renderActionButtons(item)}</View>
        <View style={styles.viewDetailsIndicator}>
          <Text style={[styles.viewDetailsText, { color: colors.textSecondary, fontSize: fontSizes.viewDetailsText }]}>{t('booking.page.tapToViewDetails')}</Text>
          <Icon name="chevron-right" size={16} color={colors.textSecondary} />
        </View>
      </Card>
    );
  };

  // Back button handling
  const handleBackPress = () => {
    if (detailsDrawerOpen) { setDetailsDrawerOpen(false); return true; }
    if (modifyDialogOpen) { setModifyDialogOpen(false); return true; }
    if (holidayDialogOpen) { setHolidayDialogOpen(false); return true; }
    if (vacationManagementDialogOpen) { setVacationManagementDialogOpen(false); return true; }
    if (reviewDialogVisible) { setReviewDialogVisible(false); return true; }
    if (servicesDialogOpen) { setServicesDialogOpen(false); return true; }
    if (walletDialogOpen) { setWalletDialogOpen(false); return true; }
    if (confirmationDialog.open) { setConfirmationDialog(prev => ({ ...prev, open: false })); return true; }
    if (onBackToHome) { onBackToHome(); return true; }
    return false;
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [detailsDrawerOpen, modifyDialogOpen, holidayDialogOpen, vacationManagementDialogOpen, reviewDialogVisible, servicesDialogOpen, walletDialogOpen, confirmationDialog.open, onBackToHome]);

  // Deep linking (simplified)
  useEffect(() => {
    const getInitialUrl = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        // process deep link (keep your existing logic)
      }
    };
    getInitialUrl();
    const subscription = Linking.addEventListener('url', ({ url }) => {});
    return () => subscription.remove();
  }, []);

  if (isLoading) {
    return <BookingPageSkeleton colors={colors} fontSizes={fontSizes} />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[isDarkMode ? 'rgba(14, 48, 92, 0.9)' : 'rgba(139, 187, 221, 0.8)', isDarkMode ? 'rgba(30, 64, 108, 0.9)' : 'rgba(213, 229, 233, 0.8)', isDarkMode ? colors.background : 'rgba(255,255,255,1)']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.header}>
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: 'rgba(255, 255, 255, 0.9)' }]} onPress={handleBackPress}>
            <Icon name="arrow-left" size={24} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: colors.primary, fontSize: fontSizes.headerTitle }]}>{t('booking.page.title')}</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary, fontSize: fontSizes.headerSubtitle }]}>{t('booking.page.subtitle')}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.searchContainer}>
            <TextInput style={[styles.searchInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, fontSize: fontSizes.searchInput }]} placeholder={t('booking.page.searchPlaceholder')} placeholderTextColor={colors.placeholder} value={searchTerm} onChangeText={setSearchTerm} />
            {searchTerm && <TouchableOpacity style={styles.clearSearchButton} onPress={() => setSearchTerm('')}><Icon name="close-circle" size={20} color={colors.textSecondary} /></TouchableOpacity>}
          </View>
          <TouchableOpacity style={[styles.walletButton, { backgroundColor: colors.primary }]} onPress={() => setWalletDialogOpen(true)}>
            <Icon name="wallet" size={24} color="#fff" />
            <Text style={[styles.walletText, { color: '#fff', fontSize: fontSizes.badgeText }]}>{t('navigation.wallet')}</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { backgroundColor: colors.primary + '15', borderLeftColor: colors.primary }]}>
            <Icon name="alert-circle" size={24} color={colors.primary} />
            <View style={styles.sectionHeaderContent}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSizes.sectionTitle }]}>{t('booking.page.upcoming')}</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary, fontSize: fontSizes.sectionSubtitle }]}>{filteredUpcomingBookings.length} {filteredUpcomingBookings.length === 1 ? t('booking.page.upcomingCount', { count: filteredUpcomingBookings.length }) : t('booking.page.upcomingCount_plural', { count: filteredUpcomingBookings.length })}</Text>
            </View>
            <Badge style={[styles.sectionBadge, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
              <Text style={[styles.sectionBadgeText, { color: colors.primary, fontSize: fontSizes.badgeText }]}>{upcomingBookings.length}</Text>
            </Badge>
          </View>
          <View style={styles.statusFilterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {statusTabs.map((tab) => (
                <TouchableOpacity key={tab.value} style={[styles.statusTab, { backgroundColor: colors.surface }, statusFilter === tab.value && { backgroundColor: colors.primary }]} onPress={() => setStatusFilter(tab.value)}>
                  <Text style={[styles.statusTabText, { color: colors.textSecondary, fontSize: fontSizes.badgeText }, statusFilter === tab.value && { color: '#fff' }]}>{tab.label}</Text>
                  <View style={[styles.statusTabCount, { backgroundColor: colors.border }]}>
                    <Text style={[styles.statusTabCountText, { color: colors.textSecondary, fontSize: fontSizes.badgeText }]}>{tab.count}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          {filteredUpcomingBookings.length > 0 ? (
            <FlatList data={filteredUpcomingBookings} renderItem={renderBookingItem} keyExtractor={(item) => item.id.toString()} scrollEnabled={false} />
          ) : (
            <Card style={[styles.emptyStateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Icon name="calendar" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyStateTitle, { color: colors.text, fontSize: fontSizes.emptyStateTitle }]}>{t('booking.page.noUpcoming')}</Text>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary, fontSize: fontSizes.emptyStateText }]}>{t('booking.page.noUpcomingDesc')}</Text>
              <Button style={[styles.emptyStateButton, { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setServicesDialogOpen(true)}>
                <Text style={{ color: '#fff', fontSize: fontSizes.buttonText }}>{t('booking.page.bookService')}</Text>
              </Button>
            </Card>
          )}
        </View>

        <View style={styles.section}>
          <View style={[styles.sectionHeader, styles.pastSectionHeader, { backgroundColor: colors.textSecondary + '15', borderLeftColor: colors.textSecondary }]}>
            <Icon name="history" size={24} color={colors.textSecondary} />
            <View style={styles.sectionHeaderContent}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSizes.sectionTitle }]}>{t('booking.page.past')}</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary, fontSize: fontSizes.sectionSubtitle }]}>{filteredPastBookings.length} {filteredPastBookings.length === 1 ? t('booking.page.pastCount', { count: filteredPastBookings.length }) : t('booking.page.pastCount_plural', { count: filteredPastBookings.length })}</Text>
            </View>
            <Badge style={[styles.sectionBadge, styles.pastBadge, { backgroundColor: colors.textSecondary + '15', borderColor: colors.textSecondary + '30' }]}>
              <Text style={[styles.sectionBadgeText, styles.pastBadge, { color: colors.textSecondary, fontSize: fontSizes.badgeText }]}>{pastBookings.length}</Text>
            </Badge>
          </View>
          {filteredPastBookings.length > 0 ? (
            <FlatList data={filteredPastBookings} renderItem={renderBookingItem} keyExtractor={(item) => item.id.toString()} scrollEnabled={false} />
          ) : (
            <Card style={[styles.emptyStateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Icon name="clock" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyStateTitle, { color: colors.text, fontSize: fontSizes.emptyStateTitle }]}>{t('booking.page.noPast')}</Text>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary, fontSize: fontSizes.emptyStateText }]}>{t('booking.page.noPastDesc')}</Text>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Dialogs */}
      <UserHoliday open={holidayDialogOpen} onClose={() => setHolidayDialogOpen(false)} booking={convertBookingForChildComponents(selectedBookingForLeave)} onLeaveSubmit={handleLeaveSubmit} />
      <VacationManagementDialog open={vacationManagementDialogOpen} onClose={() => { setVacationManagementDialogOpen(false); setSelectedBookingForVacationManagement(null); }} booking={convertBookingForChildComponents(selectedBookingForVacationManagement)} customerId={customerId} onSuccess={handleVacationSuccess} />
      <ModifyBookingDialog open={modifyDialogOpen} onClose={() => setModifyDialogOpen(false)} booking={convertBookingForChildComponents(selectedBooking)} timeSlots={timeSlots} onSave={handleSaveModifiedBooking} customerId={customerId} refreshBookings={refreshBookings} setOpenSnackbar={setOpenSnackbar} />
      <ConfirmationDialog open={confirmationDialog.open} onClose={() => setConfirmationDialog(prev => ({ ...prev, open: false }))} onConfirm={handleConfirmAction} title={confirmationDialog.title} message={confirmationDialog.message} confirmText={confirmationDialog.type === 'cancel' ? t('booking.confirmation.confirm') : t('booking.confirmation.confirmPayment')} loading={actionLoading} severity={confirmationDialog.severity} />
      <AddReviewDialog visible={reviewDialogVisible} onClose={closeReviewDialog} booking={convertBookingForChildComponents(selectedReviewBooking)} onReviewSubmitted={handleReviewSubmitted} />
      <WalletDialog open={walletDialogOpen} onClose={() => setWalletDialogOpen(false)} />
      <ServicesDialog open={servicesDialogOpen} onClose={() => setServicesDialogOpen(false)} onServiceSelect={(serviceType) => {}} />
      <EngagementDetailsDrawer isOpen={detailsDrawerOpen} onClose={() => { setDetailsDrawerOpen(false); setSelectedBooking(null); }} booking={selectedBooking} />

      {openSnackbar && (
        <View style={[styles.snackbar, { backgroundColor: colors.success }]}>
          <Text style={[styles.snackbarText, { color: '#fff', fontSize: fontSizes.infoText }]}>{snackbarMessage}</Text>
          <TouchableOpacity onPress={() => setOpenSnackbar(false)}><Icon name="close" size={20} color="#fff" /></TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, marginBottom: 16, padding: 16 },
  button: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', borderWidth: 1, minHeight: 40 },
  disabledButton: { opacity: 0.6 },
  badgeBase: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', marginHorizontal: 4 },
  separatorBase: { height: 1, marginVertical: 16 },
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16 },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingTop: 50 },
  headerTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  headerContent: { flex: 1, alignItems: 'center' },
  headerTitle: { fontWeight: 'bold' },
  headerSubtitle: { marginTop: 8, textAlign: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  searchContainer: { flex: 1, position: 'relative', marginRight: 12 },
  searchInput: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1 },
  clearSearchButton: { position: 'absolute', right: 12, top: 12 },
  walletButton: { padding: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', width: 70 },
  walletText: { marginTop: 4, fontWeight: '500' },
  section: { padding: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, padding: 16, borderRadius: 12, borderLeftWidth: 4 },
  pastSectionHeader: { borderLeftColor: 'rgba(156, 163, 175, 0.4)' },
  sectionHeaderContent: { flex: 1, marginLeft: 16 },
  sectionTitle: { fontWeight: '700' },
  sectionSubtitle: { marginTop: 4 },
  sectionBadge: { paddingHorizontal: 12, paddingVertical: 8 },
  pastBadge: { backgroundColor: 'rgba(156, 163, 175, 0.15)', borderColor: 'rgba(156, 163, 175, 0.4)' },
  sectionBadgeText: { fontWeight: '700' },
  statusFilterContainer: { marginBottom: 20 },
  statusTab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10 },
  statusTabActive: { backgroundColor: '#3b82f6' },
  statusTabText: { fontWeight: '600', marginRight: 8 },
  statusTabCount: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, minWidth: 24, alignItems: 'center' },
  statusTabCountText: { fontWeight: '600' },
  bookingCard: { marginBottom: 20, borderRadius: 12, overflow: 'hidden', borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  serviceInfoContainer: { flexDirection: 'row', alignItems: 'center' },
  serviceIconContainer: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 8 },
  serviceTitle: { fontWeight: '600' },
  statusContainer: { flexDirection: 'row' },
  paymentPendingRow: { marginBottom: 8 },
  awaitingRow: { marginBottom: 8 },
  dateTimeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  infoItem: { flexDirection: 'row', alignItems: 'center' },
  infoText: { marginLeft: 6 },
  actionButtonsContainer: { width: '100%', marginBottom: 8 },
  actionButtonsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionButton: { flex: 1, minWidth: '22%', justifyContent: 'center', backgroundColor: '#fff', borderWidth: 1, paddingVertical: 8, paddingHorizontal: 4 },
  callButton: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  callButtonText: { color: '#fff', marginLeft: 6, fontWeight: '600' },
  messageButton: { backgroundColor: '#10b981', borderColor: '#10b981' },
  messageButtonText: { color: '#fff', marginLeft: 6, fontWeight: '600' },
  cancelButton: { backgroundColor: '#ef4444', borderColor: '#ef4444' },
  cancelButtonText: { color: '#fff', marginLeft: 6, fontWeight: '600' },
  modifyButton: { backgroundColor: '#fff', borderColor: '#1e40af' },
  compactActionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: '100%', justifyContent: 'flex-start', marginTop: 4, marginBottom: 4 },
  compactActionButton: { flex: 0, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#fff', borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginRight: 8, alignSelf: 'flex-start' },
  modifyButtonText: { color: '#1e40af', marginLeft: 6, fontWeight: '600' },
  vacationButton: { backgroundColor: '#fff', borderColor: '#1e40af' },
  vacationButtonText: { color: '#1e40af', marginLeft: 6, fontWeight: '600' },
  vacationModifiedButton: { backgroundColor: '#dbeafe', borderColor: '#93c5fd' },
  vacationModifiedText: { color: '#1e40af', marginLeft: 6, fontWeight: '600' },
  reviewButton: { backgroundColor: '#fff', borderColor: '#1e40af' },
  reviewButtonText: { color: '#1e40af', marginLeft: 6, fontWeight: '600' },
  reviewSubmittedButton: { backgroundColor: '#f0fdf4', borderColor: '#86efac' },
  reviewSubmittedText: { color: '#10b981', marginLeft: 6, fontWeight: '600' },
  bookAgainButton: { backgroundColor: '#fff', borderColor: '#3b82f6' },
  bookAgainText: { color: '#3b82f6', marginLeft: 6, fontWeight: '600' },
  viewDetailsIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  viewDetailsText: { marginRight: 4 },
  paymentActionContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: '100%', marginBottom: 8 },
  paymentButton: { backgroundColor: '#dc2626', borderColor: '#dc2626', flex: 1, minWidth: '45%' },
  paymentButtonText: { color: '#fff', marginLeft: 6, fontWeight: '600' },
  activeBadge: { paddingHorizontal: 8, paddingVertical: 4 },
  activeBadgeText: { marginLeft: 4, fontWeight: '600' },
  completedBadge: { paddingHorizontal: 8, paddingVertical: 4 },
  completedBadgeText: { marginLeft: 4, fontWeight: '600' },
  cancelledBadge: { paddingHorizontal: 8, paddingVertical: 4 },
  cancelledBadgeText: { marginLeft: 4, fontWeight: '600' },
  inProgressBadge: { paddingHorizontal: 8, paddingVertical: 4 },
  inProgressBadgeText: { marginLeft: 4, fontWeight: '600' },
  notStartedBadge: { paddingHorizontal: 8, paddingVertical: 4 },
  notStartedBadgeText: { marginLeft: 4, fontWeight: '600' },
  onDemandBadge: { paddingHorizontal: 8, paddingVertical: 4 },
  onDemandBadgeText: { fontWeight: '600' },
  monthlyBadge: { paddingHorizontal: 8, paddingVertical: 4 },
  monthlyBadgeText: { fontWeight: '600' },
  shortTermBadge: { paddingHorizontal: 8, paddingVertical: 4 },
  shortTermBadgeText: { fontWeight: '600' },
  defaultBadge: { paddingHorizontal: 8, paddingVertical: 4 },
  defaultBadgeText: { fontWeight: '600' },
  awaitingBadge: { paddingHorizontal: 8, paddingVertical: 4 },
  awaitingBadgeText: { marginLeft: 4, fontWeight: '600' },
  paymentPendingBadge: { paddingHorizontal: 8, paddingVertical: 4 },
  paymentPendingBadgeText: { marginLeft: 4, fontWeight: '600' },
  scheduledMessageSection: { marginTop: 12 },
  scheduledMessageContainer: { marginTop: 12, width: '100%' },
  scheduledMessageCard: { padding: 12, borderWidth: 1, borderRadius: 8 },
  inProgressMessageCard: { padding: 12, borderWidth: 1, borderRadius: 8 },
  completedMessageCard: { padding: 12, borderWidth: 1, borderRadius: 8 },
  scheduledMessageHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  scheduledMessageTitleContainer: { flex: 1, marginLeft: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' },
  scheduledMessageTitle: { fontWeight: '600', flex: 1 },
  scheduledMessageText: { marginBottom: 12, lineHeight: 18, fontWeight: '400' },
  scheduledBadge: { marginLeft: 8, paddingHorizontal: 8, paddingVertical: 4 },
  scheduledBadgeText: { fontWeight: '600' },
  otpButtonContainer: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  otpButton: { minWidth: 160, flex: 1, paddingVertical: 10 },
  otpButtonText: { marginLeft: 8, fontWeight: '600' },
  otpActiveBadge: { paddingHorizontal: 8, paddingVertical: 4 },
  otpActiveBadgeText: { fontWeight: '600' },
  otpDisplayContainer: { padding: 12, borderRadius: 8, marginTop: 8, borderWidth: 1 },
  otpDisplayLabel: { fontWeight: '500', marginBottom: 6 },
  otpDisplay: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  otpCode: { fontWeight: 'bold', letterSpacing: 4 },
  copyOtpButton: { backgroundColor: 'transparent', paddingHorizontal: 12, paddingVertical: 6 },
  copyOtpButtonText: { fontSize: 12, fontWeight: '600' },
  otpExpiryText: { fontStyle: 'italic' },
  reviewPromptContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: 12, marginTop: 12 },
  reviewPromptContent: { flex: 1 },
  reviewPromptTitle: { fontWeight: '600' },
  reviewPromptSubtitle: { marginTop: 2, lineHeight: 16 },
  leaveReviewButton: { backgroundColor: 'transparent', marginLeft: 12, paddingVertical: 8, paddingHorizontal: 12 },
  leaveReviewButtonText: { marginLeft: 6, fontWeight: '600' },
  emptyStateCard: { alignItems: 'center', padding: 40, borderRadius: 12, borderWidth: 1 },
  emptyStateTitle: { fontWeight: '700', marginTop: 20 },
  emptyStateText: { marginTop: 8, textAlign: 'center', lineHeight: 24 },
  emptyStateButton: { marginTop: 24, paddingVertical: 16, paddingHorizontal: 32 },
  snackbar: { position: 'absolute', bottom: 20, left: 20, right: 20, padding: 16, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
  snackbarText: { fontWeight: '600', flex: 1 },
  separator: { height: 1, marginVertical: 12 },
});

export default Booking;