/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable */

import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Pressable,
  ViewStyle,
  TextStyle,
  StyleProp,
  RefreshControl,
  Linking,
  BackHandler,
  Animated,
  Modal as RNModal,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth0 } from 'react-native-auth0';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import dayjs from 'dayjs';
import RazorpayCheckout from 'react-native-razorpay';
import { useTheme } from '../../src/Settings/ThemeContext';
import { SkeletonLoader } from '../common/SkeletonLoader';
import ModifyBookingDialog from './ModifyBookingDialog';
import ConfirmationDialog from './ConfirmationDialog';
import AddReviewDialog from './AddReviewDialog';
import RaiseComplaintDialog from './RaiseComplaintDialog';
import { fetchMyTickets } from '../services/ticketsService';
import EngagementDetailsDrawer from './EngagementDetailsDrawer';
import LinearGradient from 'react-native-linear-gradient';
import PaymentInstance from '../services/paymentInstance';
import { useAppUser } from '../context/AppUserContext';
import ServicesDialog from '../ServiceDialogs/ServicesDialog';
import GlassCard from '../design-system/GlassCard';
import SegmentedRail from '../design-system/SegmentedRail';
import ActionRow from '../design-system/ActionRow';
import { BOOKING_HEADER_GRADIENT, BRAND } from "../theme/brandColors";
import { getMobileTabBarHeight } from "../Constants/mobileLayout";
import { resolveCustomerId } from "../services/couponService";

// ---------- Helper Components ----------
const Card: React.FC<{ children: React.ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void }> = ({ children, style, onPress }) => {
  const { colors } = useTheme();
  const Container = onPress ? TouchableOpacity : View;
  return (
    <Container
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border + '20' }, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {children}
    </Container>
  );
};

const GradientButton: React.FC<{
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  innerStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
  gradientColors?: string[];
}> = ({ children, onPress, style, innerStyle, disabled = false, gradientColors }) => {
  const defaultGradient = [...BOOKING_HEADER_GRADIENT];
  
  if (disabled) {
    return (
      <View style={[styles.gradientButton, { opacity: 0.5 }, style]}>
        <LinearGradient colors={['#9CA3AF', '#6B7280']} style={[styles.gradientInner, innerStyle]}>
          {children}
        </LinearGradient>
      </View>
    );
  }
  
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.gradientButton, style]}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={gradientColors || defaultGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradientInner, styles.gradientInnerFill, innerStyle]}
      >
        {children}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const EmptyStateBookButton: React.FC<{
  onPress: () => void;
  labelFontSize: number;
}> = ({ onPress, labelFontSize }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={styles.emptyStateCta}
    accessibilityRole="button"
    accessibilityLabel="Book a Service"
  >
    <View style={styles.emptyStateCtaContent}>
      <Icon name="plus" size={20} color={BRAND.accent} />
      <Text
        allowFontScaling={false}
        style={[styles.emptyStateButtonText, { fontSize: labelFontSize, color: BRAND.accent }]}
      >
        Book a Service
      </Text>
    </View>
  </TouchableOpacity>
);

const Badge: React.FC<{ children: React.ReactNode; style?: StyleProp<ViewStyle>; variant?: 'success' | 'warning' | 'info' | 'error' }> = ({ children, style, variant = 'info' }) => {
  const { colors } = useTheme();
  const getVariantColors = () => {
    switch (variant) {
      case 'success': return { bg: colors.success + '15', border: colors.success + '30', text: colors.success };
      case 'warning': return { bg: colors.warning + '15', border: colors.warning + '30', text: colors.warning };
      case 'error': return { bg: colors.error + '15', border: colors.error + '30', text: colors.error };
      default: return { bg: colors.primary + '15', border: colors.primary + '30', text: colors.primary };
    }
  };
  const variantColors = getVariantColors();
  return (
    <View style={[styles.badgeBase, { backgroundColor: variantColors.bg, borderColor: variantColors.border }, style]}>
      {children}
    </View>
  );
};

const StatusChip: React.FC<{ status: string }> = ({ status }) => {
  const { colors } = useTheme();
  const getStatusConfig = () => {
    switch (status) {
      case 'NOT_STARTED': return { label: 'Not Started', icon: 'clock-outline', color: colors.warning, bg: colors.warning + '15' };
      case 'IN_PROGRESS': return { label: 'In Progress', icon: 'progress-clock', color: colors.info, bg: colors.info + '15' };
      case 'COMPLETED': return { label: 'Completed', icon: 'check-circle', color: colors.success, bg: colors.success + '15' };
      case 'CANCELLED': return { label: 'Cancelled', icon: 'close-circle', color: colors.error, bg: colors.error + '15' };
      default: return { label: status, icon: 'minus-circle', color: colors.textSecondary, bg: colors.textSecondary + '15' };
    }
  };
  const config = getStatusConfig();
  return (
    <View style={[styles.statusChip, { backgroundColor: config.bg }]}>
      <Icon name={config.icon} size={12} color={config.color} />
      <Text style={[styles.statusChipText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
};

// ---------- Skeleton Loaders ----------
const BookingCardSkeleton: React.FC<{ colors: any; fontSizes: any }> = ({ colors, fontSizes }) => {
  return (
    <View style={[styles.bookingCard, { backgroundColor: colors.card, borderColor: colors.border + '20' }]}>
      <View style={styles.cardHeader}>
        <View style={styles.serviceInfoContainer}>
          <SkeletonLoader width={48} height={48} variant="circular" />
          <View style={{ marginLeft: 12 }}>
            <SkeletonLoader width={140} height={20} />
            <SkeletonLoader width={100} height={14} style={{ marginTop: 4 }} />
          </View>
        </View>
        <SkeletonLoader width={80} height={24} variant="rectangular" />
      </View>
      <View style={styles.detailsGrid}>
        <SkeletonLoader width="100%" height={16} style={{ marginBottom: 8 }} />
        <SkeletonLoader width="90%" height={16} style={{ marginBottom: 8 }} />
        <SkeletonLoader width="80%" height={16} />
      </View>
      <View style={styles.actionButtonsRow}>
        <SkeletonLoader width={100} height={36} variant="rectangular" style={{ borderRadius: 20 }} />
        <SkeletonLoader width={100} height={36} variant="rectangular" style={{ borderRadius: 20 }} />
      </View>
    </View>
  );
};

// ---------- Interfaces ----------
export interface BookingRef {
  refreshBookings: () => Promise<void>;
  forceRefresh: () => Promise<void>;
}

interface TodayService {
  service_day_id: string;
  status: string;
  can_start: boolean;
  can_generate_otp: boolean;
  can_complete: boolean;
  otp_active: boolean;
}

interface CustomerTodayBookingSlot {
  availability_id: number;
  engagement_id: number;
  start_time_ist: string | null;
  end_time_ist: string | null;
  booking_type: string;
  service_type: string;
  task_status: string;
  address: string | null;
  base_amount?: number | null;
  provider_firstname: string | null;
  provider_lastname: string | null;
  provider_mobileno: string | null;
  service_day_id: number | null;
  service_day_status: string | null;
  today_service?: {
    service_day_id: number;
    status: string;
    can_generate_otp?: boolean;
    otp_active?: boolean;
  } | null;
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
  changes?: any;
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
  transaction_id?: string;
}

interface Booking {
  id: number;
  customerId?: number;
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
  vacation?: any;
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
  leave_days?: number;
  provider?: any;
}

interface BookingProps {
  onBackToHome?: () => void;
}

// ---------- Utility Functions ----------
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

const getServiceTitle = (type: string) => {
  const serviceType = type || 'other';
  switch (serviceType) {
    case 'cook': return 'Home Cook';
    case 'maid': return 'Maid Service';
    case 'nanny': return 'Caregiver';
    case 'cleaning': return 'Cleaning Service';
    default: return 'Home Service';
  }
};

const getBookingTypeIcon = (type: string) => {
  switch (type) {
    case 'ON_DEMAND': return 'flash';
    case 'MONTHLY': return 'calendar-month';
    case 'SHORT_TERM': return 'calendar-clock';
    default: return 'calendar';
  }
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
  } catch {
    return timeString;
  }
};

const getEffectiveTaskStatus = (booking: Booking): string => {
  const visit = booking.today_service?.status?.toUpperCase();
  if (visit === 'IN_PROGRESS' || visit === 'STARTED') return 'IN_PROGRESS';
  if (visit === 'COMPLETED' || visit === 'DONE') return 'COMPLETED';
  return booking.taskStatus;
};

const isUpcomingTabBooking = (booking: Booking): boolean => {
  const status = getEffectiveTaskStatus(booking);
  return status !== 'CANCELLED' && status !== 'COMPLETED';
};

const mapTodaySlotTaskStatus = (slot: CustomerTodayBookingSlot): string => {
  const sd = String(slot.service_day_status ?? slot.today_service?.status ?? '').toUpperCase();
  if (sd === 'IN_PROGRESS' || sd === 'STARTED') return 'IN_PROGRESS';
  if (sd === 'COMPLETED' || sd === 'DONE') return 'COMPLETED';
  return slot.task_status || 'NOT_STARTED';
};

const formatTimeRange = (startTime: string, endTime: string): string => {
  return `${formatTimeToAMPM(startTime)} - ${formatTimeToAMPM(endTime)}`;
};

const isModificationTimeAllowed = (startEpoch: number | undefined): boolean => {
  if (!startEpoch) return false;
  const now = dayjs().unix();
  const cutoff = startEpoch - 30 * 60;
  return now < cutoff;
};

const isBookingAlreadyModified = (booking: Booking | null): boolean => {
  if (!booking) return false;
  return !!(booking.modifications?.some((mod) =>
    mod.action === "Date Rescheduled" ||
    mod.action === "Time Rescheduled" ||
    mod.action === "Modified" ||
    mod.action?.includes("Reschedule")
  ));
};

const isModificationDisabled = (booking: Booking | null): boolean => {
  if (!booking) return true;
  return !isModificationTimeAllowed(booking.start_epoch) || isBookingAlreadyModified(booking);
};

const hasVacation = (booking: Booking): boolean => {
  return booking.hasVacation || false;
};

// ---------- Main Booking Component ----------
const HORIZONTAL_GUTTER = 10;

const Booking = forwardRef<BookingRef, BookingProps>(({ onBackToHome }, ref) => {
  const { colors, fontSize, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();

  const [currentBookings, setCurrentBookings] = useState<Booking[]>([]);
  const [pastBookings, setPastBookings] = useState<Booking[]>([]);
  const [futureBookings, setFutureBookings] = useState<Booking[]>([]);
  const [cancelledBookings, setCancelledBookings] = useState<Booking[]>([]);
  const [activeSectionTab, setActiveSectionTab] = useState<'action_needed' | 'upcoming' | 'past' | 'cancelled'>('action_needed');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [bookingTypeFilter, setBookingTypeFilter] = useState<
    'TODAY' | 'ON_DEMAND' | 'RECURRING'
  >('TODAY');
  const [generatedOTPs, setGeneratedOTPs] = useState<Record<number, string>>({});
  const [todaySchedule, setTodaySchedule] = useState<CustomerTodayBookingSlot[]>([]);
  const [modifyDialogOpen, setModifyDialogOpen] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [reviewedBookings, setReviewedBookings] = useState<number[]>([]);
  const [servicesDialogOpen, setServicesDialogOpen] = useState(false);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRefreshTooltip, setShowRefreshTooltip] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState<number | null>(null);
  const [paymentLoading, setPaymentLoading] = useState<number | null>(null);
  const [timeSlots] = useState<string[]>([]);
  const [reviewDialogVisible, setReviewDialogVisible] = useState(false);
  const [selectedReviewBooking, setSelectedReviewBooking] = useState<Booking | null>(null);
  const [complaintDialogVisible, setComplaintDialogVisible] = useState(false);
  const [selectedComplaintBooking, setSelectedComplaintBooking] = useState<Booking | null>(null);
  const tooltipAnim = useRef(new Animated.Value(0)).current;
  const lastLoadedCustomerIdRef = useRef<string | null>(null);

  const [confirmationDialog, setConfirmationDialog] = useState<{
    open: boolean;
    type: 'cancel' | 'modify' | 'payment' | null;
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
    severity: 'info',
  });

  const { user: auth0User } = useAuth0();
  const { appUser, isLoading: isUserLoading } = useAppUser();
  const isAuthenticated = useMemo(
    () => !!(auth0User || appUser?.token),
    [auth0User, appUser?.token]
  );
  const resolvedCustomerId = useMemo(() => resolveCustomerId(appUser), [appUser]);

  useEffect(() => {
    if (showRefreshTooltip) {
      Animated.sequence([
        Animated.timing(tooltipAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.delay(4000),
        Animated.timing(tooltipAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowRefreshTooltip(false);
      });
    }
  }, [showRefreshTooltip]);

  useImperativeHandle(ref, () => ({
    refreshBookings: async () => {
      console.log("🔄 Manual refresh triggered from parent");
      await performRefresh();
    },
    forceRefresh: async () => {
      console.log("💪 Force refresh triggered from parent");
      await performRefresh();
    }
  }));

  const getFontSizes = () => {
    switch (fontSize) {
      case 'small':
        return { headerTitle: 18, headerSubtitle: 14, sectionTitle: 14, sectionSubtitle: 13, serviceTitle: 17, infoText: 14, viewDetailsText: 12, buttonText: 12, badgeText: 11, emptyStateTitle: 20, emptyStateText: 15, searchInput: 15, tooltipText: 11 };
      case 'large':
        return { headerTitle: 22, headerSubtitle: 17, sectionTitle: 14, sectionSubtitle: 15, serviceTitle: 19, infoText: 16, viewDetailsText: 14, buttonText: 14, badgeText: 13, emptyStateTitle: 24, emptyStateText: 17, searchInput: 17, tooltipText: 13 };
      default:
        return { headerTitle: 20, headerSubtitle: 15, sectionTitle: 14, sectionSubtitle: 14, serviceTitle: 18, infoText: 15, viewDetailsText: 13, buttonText: 13, badgeText: 12, emptyStateTitle: 22, emptyStateText: 16, searchInput: 16, tooltipText: 12 };
    }
  };
  const fontSizes = getFontSizes();
  const footerClearance = getMobileTabBarHeight(insets.bottom) + 28;

  const convertBookingForChildComponents = (booking: Booking | null): any => {
    if (!booking) return null;
    return {
      ...booking,
      serviceType: booking.serviceType || booking.service_type,
      vacationDetails: booking.vacationDetails ? {
        ...booking.vacationDetails,
        leave_start_date: booking.vacationDetails.leave_start_date || booking.vacationDetails.start_date,
        leave_end_date: booking.vacationDetails.leave_end_date || booking.vacationDetails.end_date,
      } : null,
    };
  };

  /** True when DB lifecycle or stored task marks the engagement cancelled (works before API `cancelled` bucket is deployed). */
  const isCancelledEngagementItem = (item: any): boolean => {
    const life = String(item?.engagement_status ?? '').toUpperCase();
    const stored = String(item?.task_status_stored ?? item?.task_status ?? '').toUpperCase();
    return life === 'CANCELLED' || stored === 'CANCELLED';
  };

  const resolveTaskStatusFromEngagement = (item: any): string => {
    if (isCancelledEngagementItem(item)) return 'CANCELLED';
    return item?.task_status || '';
  };

  const partitionEngagementLists = (
    upcoming: any[],
    ongoing: any[],
    past: any[],
    cancelledFromApi: any[] = []
  ) => {
    const cancelled: any[] = [...cancelledFromApi];
    const activeUpcoming: any[] = [];
    const activeOngoing: any[] = [];
    const activePast: any[] = [];

    upcoming.forEach((item) =>
      (isCancelledEngagementItem(item) ? cancelled : activeUpcoming).push(item)
    );
    ongoing.forEach((item) =>
      (isCancelledEngagementItem(item) ? cancelled : activeOngoing).push(item)
    );
    past.forEach((item) =>
      (isCancelledEngagementItem(item) ? cancelled : activePast).push(item)
    );

    const seen = new Set<number>();
    const dedupedCancelled = cancelled.filter((item) => {
      const id = Number(item?.engagement_id);
      if (!Number.isFinite(id) || seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    return {
      upcoming: activeUpcoming,
      ongoing: activeOngoing,
      past: activePast,
      cancelled: dedupedCancelled,
    };
  };

  const mapBookingData = (data: any[]): Booking[] => {
    if (!Array.isArray(data)) return [];

    return data.map((item): Booking => {
      const hasVacationFlag = (item.leave_days && item.leave_days > 0) ||
                              (item.vacations && Array.isArray(item.vacations) && item.vacations.length > 0);

      let vacationDetails = undefined;
      if (hasVacationFlag) {
        if (item.vacations && item.vacations.length > 0) {
          const latestVacation = item.vacations[0];
          vacationDetails = {
            leave_type: "VACATION",
            total_days: latestVacation.leave_days || item.leave_days,
            refund_amount: latestVacation.refund,
            leave_start_date: latestVacation.start_date,
            leave_end_date: latestVacation.end_date,
            start_date: latestVacation.start_date,
            end_date: latestVacation.end_date,
          };
        } else if (item.vacation_start_date && item.vacation_end_date) {
          vacationDetails = {
            leave_type: "VACATION",
            total_days: item.leave_days,
            refund_amount: item.refund,
            leave_start_date: item.vacation_start_date,
            leave_end_date: item.vacation_end_date,
            start_date: item.vacation_start_date,
            end_date: item.vacation_end_date,
          };
        }
      }

      const serviceType = item.service_type?.toLowerCase() || item.serviceType?.toLowerCase() || 'other';
      const modifications = item.modifications || [];
      const hasModifications = modifications.length > 0;

      let serviceProviderName = 'Not Assigned';
      let providerRating = 0;

      if (item.provider) {
        const firstName = item.provider.firstName || item.provider.firstname || '';
        const lastName = item.provider.lastName || item.provider.lastname || '';
        const fullName = `${firstName} ${lastName}`.trim();
        if (fullName && fullName !== ' ') {
          serviceProviderName = fullName;
          providerRating = item.provider.rating || 0;
        }
      } else if (item.service_provider) {
        const firstName = item.service_provider.firstName || item.service_provider.firstname || '';
        const lastName = item.service_provider.lastName || item.service_provider.lastname || '';
        const fullName = `${firstName} ${lastName}`.trim();
        if (fullName && fullName !== ' ') {
          serviceProviderName = fullName;
          providerRating = item.service_provider.rating || 0;
        }
      } else if (item.assignment_status === "UNASSIGNED") {
        serviceProviderName = 'Awaiting Assignment';
      } else if (item.serviceProviderName && item.serviceProviderName !== "undefined undefined") {
        serviceProviderName = item.serviceProviderName;
      } else if (item.provider_name) {
        serviceProviderName = item.provider_name;
      }

      const amount = item.base_amount || item.monthlyAmount || item.total_amount || 0;
      const startEpoch = item.start_epoch ? Number(item.start_epoch) : 0;

      return {
        id: Number(item.engagement_id),
        customerId:
          item.customerId != null
            ? Number(item.customerId)
            : item.customerid != null
              ? Number(item.customerid)
              : undefined,
        name: item.customerName || '',
        serviceProviderId:
          item.serviceProviderId != null
            ? Number(item.serviceProviderId)
            : item.serviceproviderid != null
              ? Number(item.serviceproviderid)
              : 0,
        timeSlot: item.start_time || '',
        date: item.start_date || '',
        startDate: item.start_date || '',
        endDate: item.end_date || '',
        start_time: item.start_time || '',
        end_time: item.end_time || '',
        bookingType: item.booking_type || '',
        monthlyAmount: Number(amount),
        paymentMode: item.paymentMode || '',
        address: item.address || 'Address',
        customerName: item.customerName || '',
        serviceProviderName: serviceProviderName,
        providerRating: providerRating,
        taskStatus: resolveTaskStatusFromEngagement(item),
        engagements: item.engagements || '',
        bookingDate: item.created_at || new Date().toISOString(),
        service_type: serviceType,
        serviceType: serviceType,
        childAge: item.childAge || '',
        experience: item.experience || '',
        noOfPersons: item.noOfPersons || '',
        mealType: item.mealType || '',
        modifiedDate: hasModifications ? modifications[modifications.length - 1]?.date || item.created_at : item.created_at,
        responsibilities: item.responsibilities || { tasks: [] },
        hasVacation: hasVacationFlag,
        assignmentStatus: item.assignment_status || "ASSIGNED",
        start_epoch: startEpoch,
        vacation: item.vacation || null,
        vacationDetails: vacationDetails,
        modifications: modifications,
        today_service: item.today_service,
        payment: item.payment,
        leave_days: item.leave_days || 0,
        provider: item.provider,
      };
    });
  };

  const refreshBookings = async (id?: string) => {
    const effectiveId = id || customerId;
    if (!effectiveId) return;
    try {
      const [engagementsRes, todayRes] = await Promise.all([
        PaymentInstance.get(`/api/customers/${effectiveId}/engagements`, {
          timeout: 45000,
        }),
        PaymentInstance.get(`/api/customers/${effectiveId}/today-bookings`, {
          timeout: 45000,
        }).catch(() => ({ data: { bookings: [] } })),
      ]);
      const {
        past = [],
        ongoing = [],
        upcoming = [],
        cancelled: cancelledFromApi = [],
      } = engagementsRes.data || {};

      const partitioned = partitionEngagementLists(
        upcoming,
        ongoing,
        past,
        cancelledFromApi
      );

      setPastBookings(mapBookingData(partitioned.past));
      setCurrentBookings(mapBookingData(partitioned.ongoing));
      setFutureBookings(mapBookingData(partitioned.upcoming));
      setCancelledBookings(mapBookingData(partitioned.cancelled));
      setTodaySchedule(todayRes.data?.bookings ?? []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  };

  const performRefresh = async () => {
    try {
      if (customerId) {
        await refreshBookings();
        setSnackbarMessage('Bookings refreshed successfully');
        setOpenSnackbar(true);
        setTimeout(() => setOpenSnackbar(false), 3000);
      }
    } catch (error) {
      console.error('Error refreshing bookings:', error);
      setSnackbarMessage('Failed to refresh bookings');
      setOpenSnackbar(true);
      setTimeout(() => setOpenSnackbar(false), 3000);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (customerId) {
        await refreshBookings();
        setSnackbarMessage('Bookings refreshed successfully');
        setOpenSnackbar(true);
        setTimeout(() => setOpenSnackbar(false), 3000);
      }
    } catch (error) {
      console.error('Error refreshing bookings:', error);
      setSnackbarMessage('Failed to refresh bookings');
      setOpenSnackbar(true);
      setTimeout(() => setOpenSnackbar(false), 3000);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isUserLoading) {
      return;
    }

    const nextCustomerId = resolvedCustomerId;

    if (!isAuthenticated || !nextCustomerId) {
      lastLoadedCustomerIdRef.current = null;
      setIsLoading(false);
      return;
    }

    if (lastLoadedCustomerIdRef.current === nextCustomerId) {
      return;
    }

    let isActive = true;
    lastLoadedCustomerIdRef.current = nextCustomerId;
    setCustomerId(Number(nextCustomerId));
    setIsLoading(true);

    (async () => {
      try {
        await refreshBookings(nextCustomerId);
      } catch (error: any) {
        console.error('Error fetching booking details:', error);
        const timedOut =
          error?.code === 'ECONNABORTED' ||
          (typeof error?.message === 'string' && error.message.toLowerCase().includes('timeout'));
        setSnackbarMessage(timedOut ? 'Request timed out. Pull to refresh and try again.' : 'Failed to load bookings');
        setOpenSnackbar(true);
        setTimeout(() => setOpenSnackbar(false), 3000);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isActive = false;
    };
  }, [isUserLoading, resolvedCustomerId, isAuthenticated]);

  // [Keep all existing handler functions unchanged]
  const applyOtpGenerated = (engagementId: number, otp: string) => {
    setGeneratedOTPs((prev) => ({ ...prev, [engagementId]: otp }));
    const patch = (ts: TodayService | undefined) =>
      ts ? { ...ts, otp_active: true, can_generate_otp: false } : ts;
    setCurrentBookings((prev) =>
      prev.map((b) =>
        b.id === engagementId ? { ...b, today_service: patch(b.today_service) } : b
      )
    );
    setFutureBookings((prev) =>
      prev.map((b) =>
        b.id === engagementId ? { ...b, today_service: patch(b.today_service) } : b
      )
    );
    setTodaySchedule((prev) =>
      prev.map((slot) =>
        slot.engagement_id === engagementId && slot.today_service
          ? {
              ...slot,
              today_service: {
                ...slot.today_service,
                otp_active: true,
                can_generate_otp: false,
              },
            }
          : slot
      )
    );
  };

  const handleGenerateOTP = async (booking: Booking) => {
    if (!booking.today_service?.service_day_id) {
      Alert.alert('Error', 'Failed to generate OTP');
      return;
    }
    try {
      setOtpLoading(booking.id);
      const response = await PaymentInstance.post(
        `/api/engagement-service/service-days/${booking.today_service.service_day_id}/otp`
      );
      if (response.status === 200 || response.status === 201) {
        const otp = response.data.otp || response.data.data?.otp || '123456';
        applyOtpGenerated(booking.id, otp);
        Alert.alert('Success', 'OTP generated successfully');
      }
    } catch (error: any) {
      console.error('Error generating OTP:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to generate OTP');
    } finally {
      setOtpLoading(null);
    }
  };

  const afterPaymentSuccess = async () => {
    const effectiveCustomerId =
      customerId ?? appUser?.customerId ?? appUser?.customerid;
    if (effectiveCustomerId) {
      await refreshBookings(effectiveCustomerId);
    }
    setDetailsDrawerOpen(false);
    setSelectedBooking(null);
    setActiveSectionTab('upcoming');
    setSnackbarMessage('Payment completed successfully');
    setOpenSnackbar(true);
    setTimeout(() => setOpenSnackbar(false), 3000);
  };

  const handleCompletePayment = async (booking: Booking) => {
    const engagementId = booking.payment?.engagement_id ?? booking.id;
    if (!engagementId) {
      Alert.alert('Error', 'Failed to resume payment');
      return;
    }
    try {
      setPaymentLoading(booking.id);
      const resumeRes = await PaymentInstance.post(
        '/api/v2/createEngagements/resume-payment',
        { engagementId }
      );
      const {
        razorpay_order_id,
        razorpay_key_id,
        amount,
        amount_inr,
        currency,
        engagementId: engagement_id,
        engagement_id: engagement_id_snake,
        customer,
      } = resumeRes.data;
      const resolvedEngagementId = engagement_id ?? engagement_id_snake ?? engagementId;
      let amountPaise = Number(amount);
      if (!Number.isFinite(amountPaise) || amountPaise <= 0) {
        const inr = Number(amount_inr);
        amountPaise = Math.round(inr * 100);
      }
      if (!razorpay_order_id) {
        Alert.alert('Error', 'Payment order could not be created. Please try again.');
        return;
      }
      const options = {
        key: razorpay_key_id || 'rzp_test_lTdgjtSRlEwreA',
        amount: amountPaise,
        currency: currency || 'INR',
        order_id: razorpay_order_id,
        name: "Serveaso",
        description: `Payment for ${getServiceTitle(booking.service_type)}`,
        prefill: {
          name: customer?.firstName || customer?.firstname || booking.customerName,
          contact: customer?.contact || customer?.mobile || '9999999999',
          email: customer?.email || auth0User?.email || '',
        },
        theme: { color: colors.primary },
      };
      RazorpayCheckout.open(options)
        .then(async (data: any) => {
          try {
            await PaymentInstance.post("/api/v2/createEngagements/verify", {
              engagementId: resolvedEngagementId,
              razorpay_order_id: data.razorpay_order_id,
              razorpay_payment_id: data.razorpay_payment_id,
              razorpay_signature: data.razorpay_signature,
            });
            await afterPaymentSuccess();
          } catch (verifyError) {
            console.error('Payment verification error:', verifyError);
            Alert.alert('Error', 'Payment verification failed');
          }
        })
        .catch((error: any) => {
          if (error.code !== 2) Alert.alert('Error', 'Payment failed');
        });
    } catch (err: any) {
      console.error('Complete payment error:', err);
      const msg = err?.response?.data?.error || 'Failed to resume payment';
      Alert.alert('Error', msg);
    } finally {
      setPaymentLoading(null);
    }
  };

  const handleCancelBooking = async (booking: Booking) => {
    await PaymentInstance.post(`/api/v2/engagements/${booking.id}/cancel`, {});
    await refreshBookings();
    setActiveSectionTab('cancelled');
    setSnackbarMessage('Booking cancelled successfully');
    setOpenSnackbar(true);
    setTimeout(() => setOpenSnackbar(false), 3000);
  };

  const showConfirmation = (type: 'cancel' | 'modify' | 'payment', booking: Booking, title: string, message: string, severity: 'info' | 'warning' | 'error' | 'success' = 'info') => {
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
        case 'payment': await handleCompletePayment(booking); break;
      }
    } catch (error: any) {
      console.error('Error performing action:', error);
      if (type === 'cancel') {
        const msg =
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          'Failed to cancel booking. Please try again.';
        setSnackbarMessage(msg);
        setOpenSnackbar(true);
        setTimeout(() => setOpenSnackbar(false), 4000);
      }
    } finally {
      setActionLoading(false);
      setConfirmationDialog(prev => ({ ...prev, open: false }));
    }
  };

  const handleCancelClick = (booking: Booking) => {
    showConfirmation('cancel', booking, 'Cancel Booking', `Are you sure you want to cancel your ${getServiceTitle(booking.service_type)} booking?`, 'warning');
  };

  const handlePaymentClick = (booking: Booking) => {
    showConfirmation('payment', booking, 'Complete Payment', `Complete payment of ₹${booking.monthlyAmount} for ${getServiceTitle(booking.service_type)}?`, 'info');
  };

  const handleLeaveReviewClick = (booking: Booking) => {
    setSelectedReviewBooking(booking);
    setReviewDialogVisible(true);
  };

  const handleReportIssueClick = (booking: Booking) => {
    setSelectedComplaintBooking(booking);
    setComplaintDialogVisible(true);
  };

  const handleOpenMyTickets = async () => {
    const cid = customerId ? Number(customerId) : NaN;
    if (!Number.isFinite(cid)) {
      Alert.alert('Sign in required', 'Please sign in to view your support tickets.');
      return;
    }
    try {
      const tickets = await fetchMyTickets(cid);
      if (!tickets.length) {
        Alert.alert('Support tickets', 'No tickets yet. Use Report issue on a booking to raise a complaint.');
        return;
      }
      const lines = tickets
        .slice(0, 8)
        .map(
          (t) =>
            `${t.ticket_number}: ${t.subject}\n${t.status}${t.is_overdue ? ' (overdue)' : ''}`
        )
        .join('\n\n');
      Alert.alert('My support tickets', lines);
    } catch {
      Alert.alert('Error', 'Could not load tickets. Check tickets service URL.');
    }
  };

  const handleVacationClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setDetailsDrawerOpen(true);
  };

  const closeReviewDialog = () => {
    setReviewDialogVisible(false);
    setSelectedReviewBooking(null);
  };

  const handleReviewSubmitted = (bookingId: number) => {
    setReviewedBookings(prev => [...prev, bookingId]);
    performRefresh();
  };

  const hasReview = (booking: Booking): boolean => reviewedBookings.includes(booking.id);

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setDetailsDrawerOpen(true);
  };

  const handleSaveModifiedBooking = async () => {
    setModifyDialogOpen(false);
    await performRefresh();
  };

  const normalizeSearchQuery = (term: string) =>
    term.trim().toLowerCase().replace(/^#/, '');

  const bookingMatchesSearch = (booking: Booking, term: string): boolean => {
    const q = normalizeSearchQuery(term);
    if (!q) return true;
    const idStr = String(booking.id ?? '');
    if (idStr === q || idStr.includes(q)) return true;
    return (
      getServiceTitle(booking.service_type).toLowerCase().includes(q) ||
      booking.serviceProviderName.toLowerCase().includes(q) ||
      booking.address.toLowerCase().includes(q) ||
      booking.bookingType.toLowerCase().includes(q)
    );
  };

  const filterBookings = (bookings: Booking[], term: string) => {
    if (!term.trim()) return bookings;
    return bookings.filter((booking) => bookingMatchesSearch(booking, term));
  };
  
  const filterByBookingType = (bookings: Booking[]) => {
    if (bookingTypeFilter === 'TODAY') return [];
    if (bookingTypeFilter === 'ON_DEMAND') {
      return bookings.filter((booking) => booking.bookingType === 'ON_DEMAND');
    }
    return bookings.filter(
      (booking) => booking.bookingType === 'MONTHLY' || booking.bookingType === 'SHORT_TERM'
    );
  };

  const filteredTodaySchedule = (() => {
    if (!searchTerm.trim()) return todaySchedule;
    const term = searchTerm.toLowerCase();
    return todaySchedule.filter((slot) => {
      const providerName = [slot.provider_firstname, slot.provider_lastname]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return (
        getServiceTitle(slot.service_type || '').toLowerCase().includes(term) ||
        providerName.includes(term) ||
        String(slot.engagement_id).includes(term) ||
        (slot.address || '').toLowerCase().includes(term)
      );
    });
  })();

  const slotToTodayBooking = (slot: CustomerTodayBookingSlot): Booking => {
    const existing = [...currentBookings, ...futureBookings].find(
      (b) => b.id === slot.engagement_id
    );
    const providerName =
      [slot.provider_firstname, slot.provider_lastname].filter(Boolean).join(' ').trim() ||
      'Provider';
    const todayYmd = dayjs().format('YYYY-MM-DD');
    const taskStatus = mapTodaySlotTaskStatus(slot);
    const todayService: TodayService | undefined = slot.today_service
      ? {
          service_day_id: String(slot.today_service.service_day_id),
          status: slot.today_service.status,
          can_start: false,
          can_generate_otp: !!slot.today_service.can_generate_otp,
          can_complete: false,
          otp_active: !!slot.today_service.otp_active,
        }
      : slot.service_day_id
        ? {
            service_day_id: String(slot.service_day_id),
            status: slot.service_day_status || 'SCHEDULED',
            can_start: false,
            can_generate_otp: false,
            can_complete: false,
            otp_active: false,
          }
        : undefined;

    if (existing) {
      return {
        ...existing,
        date: todayYmd,
        startDate: todayYmd,
        start_time: slot.start_time_ist || existing.start_time,
        end_time: slot.end_time_ist || existing.end_time,
        taskStatus,
        today_service: todayService ?? existing.today_service,
        serviceProviderName: existing.serviceProviderName || providerName,
        monthlyAmount:
          slot.base_amount != null ? Number(slot.base_amount) : existing.monthlyAmount,
        address: slot.address || existing.address,
      };
    }

    const serviceType = (slot.service_type || 'other').toLowerCase();
    return {
      id: slot.engagement_id,
      name: '',
      serviceProviderId: 0,
      timeSlot: slot.start_time_ist || '',
      date: todayYmd,
      startDate: todayYmd,
      endDate: todayYmd,
      start_time: slot.start_time_ist || '',
      end_time: slot.end_time_ist || '',
      bookingType: slot.booking_type || 'ON_DEMAND',
      monthlyAmount: slot.base_amount != null ? Number(slot.base_amount) : 0,
      paymentMode: '',
      address: slot.address || '',
      customerName: '',
      serviceProviderName: providerName,
      providerRating: 0,
      taskStatus,
      bookingDate: new Date().toISOString(),
      engagements: '',
      service_type: serviceType,
      serviceType,
      childAge: '',
      experience: '',
      noOfPersons: '',
      mealType: '',
      modifiedDate: new Date().toISOString(),
      responsibilities: { tasks: [] },
      assignmentStatus: 'ASSIGNED',
      modifications: [],
      today_service: todayService,
    };
  };

  const todayBookings = filteredTodaySchedule.map(slotToTodayBooking);

  const renderBookingTypeChips = () => (
    <View style={styles.bookingTypeFilterWrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.bookingTypeFilterRow}
      >
        <TouchableOpacity
          style={[
            styles.bookingTypeChip,
            { backgroundColor: isDarkMode ? colors.card : '#ffffff', borderColor: colors.border + '55' },
            bookingTypeFilter === 'TODAY' && {
              backgroundColor: colors.primary + 'E8',
              borderColor: colors.primary,
            },
          ]}
          onPress={() => setBookingTypeFilter('TODAY')}
        >
          <Text
            style={[
              styles.bookingTypeChipText,
              { color: bookingTypeFilter === 'TODAY' ? '#fff' : colors.textSecondary },
            ]}
          >
            Today&apos;s service
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.bookingTypeChip,
            { backgroundColor: isDarkMode ? colors.card : '#ffffff', borderColor: colors.border + '55' },
            bookingTypeFilter === 'ON_DEMAND' && {
              backgroundColor: colors.primary + 'E8',
              borderColor: colors.primary,
            },
          ]}
          onPress={() => setBookingTypeFilter('ON_DEMAND')}
        >
          <Text
            style={[
              styles.bookingTypeChipText,
              { color: bookingTypeFilter === 'ON_DEMAND' ? '#fff' : colors.textSecondary },
            ]}
          >
            One-time (On-demand)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.bookingTypeChip,
            { backgroundColor: isDarkMode ? colors.card : '#ffffff', borderColor: colors.border + '55' },
            bookingTypeFilter === 'RECURRING' && {
              backgroundColor: colors.primary + 'E8',
              borderColor: colors.primary,
            },
          ]}
          onPress={() => setBookingTypeFilter('RECURRING')}
        >
          <Text
            style={[
              styles.bookingTypeChipText,
              { color: bookingTypeFilter === 'RECURRING' ? '#fff' : colors.textSecondary },
            ]}
          >
            Recurring
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );


  const sortUpcomingBookings = (bookings: Booking[]): Booking[] => {
    const statusOrder: Record<string, number> = { 'NOT_STARTED': 2, 'IN_PROGRESS': 1, 'COMPLETED': 3, 'CANCELLED': 4 };
    return [...bookings].sort((a, b) => {
      const statusComparison = statusOrder[a.taskStatus] - statusOrder[b.taskStatus];
      if (statusComparison !== 0) return statusComparison;
      return new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime();
    });
  };

  const upcomingBookings = sortUpcomingBookings(
    [...currentBookings, ...futureBookings].filter(isUpcomingTabBooking)
  );
  const filteredByStatus = statusFilter === 'ALL' ? upcomingBookings : upcomingBookings.filter(booking => booking.taskStatus === statusFilter);
  const filteredUpcomingBookings = filterBookings(filterByBookingType(filteredByStatus), searchTerm);
  const filteredPastBookings = filterBookings(filterByBookingType(pastBookings), searchTerm);
  const filteredCancelledBookings = filterBookings(filterByBookingType(cancelledBookings), searchTerm);
  
  const actionNeededBookings = filterBookings(
    filterByBookingType(upcomingBookings.filter((booking) =>
      (booking.payment && booking.payment.status === 'PENDING' && booking.taskStatus !== 'CANCELLED') ||
      booking.assignmentStatus === 'UNASSIGNED' ||
      booking.taskStatus === 'NOT_STARTED'
    )),
    searchTerm
  );

  const upcomingBaseBookings = filterBookings(filterByBookingType(upcomingBookings), searchTerm);

  const upcomingStatusTabs = [
    { value: 'ALL', label: 'All', icon: 'view-dashboard', count: upcomingBaseBookings.length },
    {
      value: 'NOT_STARTED',
      label: 'Not started',
      icon: 'clock-outline',
      count: upcomingBaseBookings.filter((b) => b.taskStatus === 'NOT_STARTED').length,
    },
    {
      value: 'IN_PROGRESS',
      label: 'In progress',
      icon: 'progress-clock',
      count: upcomingBaseBookings.filter((b) => b.taskStatus === 'IN_PROGRESS').length,
    },
  ];

  const handleSectionTabChange = (tab: 'action_needed' | 'upcoming' | 'past' | 'cancelled') => {
    setActiveSectionTab(tab);
    if (tab === 'upcoming') {
      setStatusFilter('ALL');
    }
  };

  // Updated header with LinearGradient from BookingDialog
  const renderBookingsHeader = () => (
    <LinearGradient
      colors={[...BOOKING_HEADER_GRADIENT]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.headerGradient}
    >
      <View style={styles.headerContent}>
        <TouchableOpacity
          style={[styles.headerSideSlot, styles.headerBackBtn]}
          onPress={handleBackPress}
          accessibilityLabel="Go back"
        >
          <Icon name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <View style={styles.headerTitleBlock} pointerEvents="none">
          <Text
            style={[styles.headerTitle, { fontSize: fontSizes.headerTitle + 2 }]}
            numberOfLines={1}
          >
            My Bookings
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            Manage your service bookings
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.headerSideSlot, { alignItems: 'flex-end' }]}
          onPress={() => void handleOpenMyTickets()}
          accessibilityLabel="My support tickets"
        >
          <Icon name="lifebuoy" size={22} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );

  const renderBookingsSearch = (skeleton?: boolean) => (
    <View style={[styles.searchSection, { backgroundColor: colors.background }]}>
      {skeleton ? (
        <SkeletonLoader width="100%" height={44} variant="rectangular" style={{ borderRadius: 12 }} />
      ) : (
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: isDarkMode ? colors.card : '#ffffff',
              borderColor: colors.border + '60',
            },
          ]}
        >
          <Icon name="magnify" size={18} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text, fontSize: fontSizes.searchInput, flex: 1 }]}
            placeholder="Search bookings..."
            placeholderTextColor={colors.textSecondary + '99'}
            value={searchTerm}
            onChangeText={setSearchTerm}
            returnKeyType="search"
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  const renderUpcomingStatusFilter = () => (
    <View style={styles.upcomingFiltersBlock}>
      <Text style={[styles.filterGroupLabel, { color: colors.textSecondary, fontSize: fontSizes.badgeText }]}>
        Filter by status
      </Text>
      <View style={styles.statusFilterWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.statusFilterScroll}
          contentContainerStyle={styles.statusFilterScrollContent}
        >
          {upcomingStatusTabs.map((tab) => {
          const selected = statusFilter === tab.value;
          return (
            <TouchableOpacity
              key={tab.value}
              style={[
                styles.statusChip,
                {
                  backgroundColor: selected
                    ? colors.primary
                    : isDarkMode
                      ? colors.card
                      : '#ffffff',
                  borderColor: selected ? colors.primary : colors.border + '55',
                },
              ]}
              onPress={() => setStatusFilter(tab.value)}
              activeOpacity={0.85}
            >
              <Icon
                name={tab.icon}
                size={14}
                color={selected ? '#fff' : colors.textSecondary}
              />
              <Text
                style={[
                  styles.statusChipText,
                  {
                    color: selected ? '#fff' : colors.textSecondary,
                    fontSize: fontSizes.badgeText,
                  },
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
              <View
                style={[
                  styles.statusChipCount,
                  {
                    backgroundColor: selected ? 'rgba(255,255,255,0.28)' : colors.border + '90',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusChipCountText,
                    { color: selected ? '#fff' : colors.textSecondary },
                  ]}
                >
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
          })}
        </ScrollView>
      </View>
    </View>
  );

  const renderTodayEmptyState = () => (
    <View style={styles.emptyStateWrap}>
      <View
        style={[
          styles.emptyStateCard,
          {
            backgroundColor: colors.surfaceElevated ?? colors.card,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={[styles.emptyStateIconContainer, { backgroundColor: colors.accentSoft }]}>
          <Icon name="calendar-today" size={40} color={colors.primary} />
        </View>
        <Text style={[styles.emptyStateTitle, { color: colors.textPrimary, fontSize: fontSizes.emptyStateTitle }]}>
          No service today
        </Text>
        <Text style={[styles.emptyStateText, { color: colors.textSecondary, fontSize: fontSizes.emptyStateText }]}>
          You do not have any visits scheduled for today
        </Text>
      </View>
      <EmptyStateBookButton
        onPress={() => setServicesDialogOpen(true)}
        labelFontSize={fontSizes.buttonText}
      />
    </View>
  );

  const renderUpcomingEmptyState = () => {
    if (upcomingBaseBookings.length === 0) {
      return (
        <View style={styles.emptyStateWrap}>
          <View
            style={[
              styles.emptyStateCard,
              {
                backgroundColor: colors.surfaceElevated ?? colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={[styles.emptyStateIconContainer, { backgroundColor: colors.accentSoft }]}>
              <Icon name="calendar-check" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.emptyStateTitle, { color: colors.textPrimary, fontSize: fontSizes.emptyStateTitle }]}>
              No Upcoming Bookings
            </Text>
            <Text style={[styles.emptyStateText, { color: colors.textSecondary, fontSize: fontSizes.emptyStateText }]}>
              You do not have any upcoming service bookings
            </Text>
          </View>
          <EmptyStateBookButton
            onPress={() => setServicesDialogOpen(true)}
            labelFontSize={fontSizes.buttonText}
          />
        </View>
      );
    }

    const statusLabel =
      upcomingStatusTabs.find((t) => t.value === statusFilter)?.label ?? 'selected status';

    return (
      <View style={[styles.emptyStateCard, { backgroundColor: colors.card, borderColor: colors.border + '20' }]}>
        <View style={[styles.emptyStateIconContainer, { backgroundColor: colors.primary + '10' }]}>
          <Icon name="filter-off-outline" size={44} color={colors.primary} />
        </View>
        <Text style={[styles.emptyStateTitle, { color: colors.text, fontSize: fontSizes.emptyStateTitle }]}>
          No {statusLabel} Bookings
        </Text>
        <Text style={[styles.emptyStateText, { color: colors.textSecondary, fontSize: fontSizes.emptyStateText }]}>
          None of your upcoming bookings match this status. Try another filter or show all.
        </Text>
        <TouchableOpacity
          style={[styles.clearFilterBtn, { borderColor: colors.primary }]}
          onPress={() => setStatusFilter('ALL')}
        >
          <Text style={[styles.clearFilterBtnText, { color: colors.primary, fontSize: fontSizes.buttonText }]}>
            Show all upcoming
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderBookingsList = (bookings: Booking[], emptyNode: React.ReactNode) => {
    if (bookings.length === 0) {
      return emptyNode;
    }
    return (
      <View style={styles.bookingsList}>
        {bookings.map((item) => (
          <View key={String(item.id)} style={styles.bookingListItem}>
            {renderBookingItem({ item })}
          </View>
        ))}
      </View>
    );
  };

  const renderSectionTabs = () => {
    const tabs = [
      { key: 'action_needed' as const, label: 'Action needed', count: actionNeededBookings.length, icon: 'alert-circle' },
      { key: 'upcoming' as const, label: 'Upcoming', count: upcomingBaseBookings.length, icon: 'calendar-clock' },
      {
        key: 'past' as const,
        label: 'Past',
        count: filterBookings(filterByBookingType(pastBookings), searchTerm).length,
        icon: 'history',
      },
      {
        key: 'cancelled' as const,
        label: 'Cancelled',
        count: filterBookings(filterByBookingType(cancelledBookings), searchTerm).length,
        icon: 'close-circle',
      },
    ];

    return (
      <SegmentedRail
        items={tabs}
        activeKey={activeSectionTab}
        onChange={(k) => {
          if (k === 'action_needed' || k === 'upcoming' || k === 'past' || k === 'cancelled') {
            handleSectionTabChange(k);
          }
        }}
        colors={colors}
        fontSize={fontSizes.badgeText}
      />
    );
  };

  const RefreshTooltip = () => {
    if (!showRefreshTooltip) return null;
    
    return (
      <Animated.View 
        style={[
          styles.tooltipContainer, 
          { 
            opacity: tooltipAnim,
            transform: [{
              translateY: tooltipAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-20, 0]
              })
            }]
          }
        ]}
      >
        <View style={[styles.tooltipContent, { backgroundColor: colors.primary + 'E6' }]}>
          <Icon name="gesture-double-tap" size={16} color="#fff" />
          <Text style={[styles.tooltipText, { color: '#fff', fontSize: fontSizes.tooltipText }]}>
            Double-tap "Bookings" in footer to refresh
          </Text>
        </View>
        <View style={[styles.tooltipArrow, { borderTopColor: colors.primary + 'E6' }]} />
      </Animated.View>
    );
  };

  const reportIssueButton = (booking: Booking) => (
    <TouchableOpacity
      style={[styles.iconButton, { backgroundColor: colors.warning + '10' }]}
      onPress={() => handleReportIssueClick(booking)}
    >
      <Icon name="alert-circle-outline" size={20} color={colors.warning} />
      <Text style={[styles.iconButtonText, { color: colors.warning, fontSize: fontSizes.buttonText }]}>
        Report issue
      </Text>
    </TouchableOpacity>
  );

  const renderActionButtons = (booking: Booking) => {
    const isPaymentPending = booking.payment && booking.payment.status === "PENDING";
    const canShowPaymentButton = isPaymentPending && booking.taskStatus !== 'CANCELLED';
    const modificationDisabled = isModificationDisabled(booking);
    const hasExistingVacation = hasVacation(booking);

    if (canShowPaymentButton) {
      return (
        <View style={styles.paymentActionContainer}>
          <GradientButton 
            style={[styles.actionButton, styles.paymentButton]} 
            onPress={() => handlePaymentClick(booking)} 
            disabled={paymentLoading === booking.id}
            gradientColors={['#EF4444', '#DC2626']}
          >
            {paymentLoading === booking.id ? (
              <><ActivityIndicator size="small" color="#fff" /><Text style={[styles.paymentButtonText, { color: '#fff', fontSize: fontSizes.buttonText }]}>Processing...</Text></>
            ) : (
              <><Icon name="credit-card" size={18} color="#fff" /><Text style={[styles.paymentButtonText, { color: '#fff', fontSize: fontSizes.buttonText }]}>Pay Now</Text></>
            )}
          </GradientButton>
          <TouchableOpacity 
            style={[styles.outlineButton, { borderColor: colors.error }]} 
            onPress={() => handleCancelClick(booking)}
          >
            <Icon name="close-circle" size={18} color={colors.error} />
            <Text style={[styles.outlineButtonText, { color: colors.error, fontSize: fontSizes.buttonText }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      );
    }

    switch (booking.taskStatus) {
      case 'NOT_STARTED':
        return (
          <ActionRow>
            <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.primary + '10' }]} onPress={() => handleViewDetails(booking)}>
              <Icon name="eye-outline" size={20} color={colors.primary} />
              <Text style={[styles.iconButtonText, { color: colors.primary, fontSize: fontSizes.buttonText }]}>View Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.iconButton,
                { backgroundColor: modificationDisabled ? colors.textSecondary + '10' : colors.warning + '10' },
                modificationDisabled && styles.disabledButton
              ]}
              onPress={() => showConfirmation('modify', booking, 'Modify Booking', 'Do you want to modify this booking?', 'info')}
              disabled={modificationDisabled}
            >
              <Icon name="square-edit-outline" size={20} color={modificationDisabled ? colors.textSecondary : colors.warning} />
              <Text style={[styles.iconButtonText, { color: modificationDisabled ? colors.textSecondary : colors.warning, fontSize: fontSizes.buttonText }]}>
                {modificationDisabled ? 'Modify Unavailable' : 'Modify Booking'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.info + '10' }]} onPress={() => handleVacationClick(booking)}>
              <Icon name="palm-tree" size={20} color={colors.info} />
              <Text style={[styles.iconButtonText, { color: colors.info, fontSize: fontSizes.buttonText }]}>
                {hasExistingVacation ? 'Manage Vacation' : 'Add Vacation'}
              </Text>
            </TouchableOpacity>
            {reportIssueButton(booking)}
          </ActionRow>
        );
      case 'IN_PROGRESS':
        return (
          <View style={styles.actionButtonsContainer}>
            <ActionRow>
              <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.primary + '10' }]} onPress={() => Alert.alert('Call', `Call ${getServiceTitle(booking.service_type)}`)}>
                <Icon name="phone" size={20} color={colors.primary} />
                <Text style={[styles.iconButtonText, { color: colors.primary, fontSize: fontSizes.buttonText }]}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.success + '10' }]} onPress={() => Alert.alert('Message', `Message ${getServiceTitle(booking.service_type)}`)}>
                <Icon name="message-text" size={20} color={colors.success} />
                <Text style={[styles.iconButtonText, { color: colors.success, fontSize: fontSizes.buttonText }]}>Message</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.error + '10' }]} onPress={() => handleCancelClick(booking)}>
                <Icon name="close-circle" size={20} color={colors.error} />
                <Text style={[styles.iconButtonText, { color: colors.error, fontSize: fontSizes.buttonText }]}>Cancel</Text>
              </TouchableOpacity>
            </ActionRow>
            <ActionRow style={{ marginTop: 10 }}>
              <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.primary + '10' }]} onPress={() => handleViewDetails(booking)}>
                <Icon name="eye-outline" size={20} color={colors.primary} />
                <Text style={[styles.iconButtonText, { color: colors.primary, fontSize: fontSizes.buttonText }]}>View Details</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.info + '10' }]} onPress={() => handleVacationClick(booking)}>
                <Icon name="palm-tree" size={20} color={colors.info} />
                <Text style={[styles.iconButtonText, { color: colors.info, fontSize: fontSizes.buttonText }]}>
                  {hasExistingVacation ? 'Manage Vacation' : 'Add Vacation'}
                </Text>
              </TouchableOpacity>
              {reportIssueButton(booking)}
            </ActionRow>
          </View>
        );
      case 'COMPLETED':
        return (
          <ActionRow>
            {reportIssueButton(booking)}
            {hasReview(booking) ? (
              <View style={[styles.reviewSubmittedBadge, { backgroundColor: colors.success + '10' }]}>
                <Icon name="check-circle" size={18} color={colors.success} />
                <Text style={[styles.reviewSubmittedText, { color: colors.success, fontSize: fontSizes.buttonText }]}>Reviewed</Text>
              </View>
            ) : (
              <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.primary + '10' }]} onPress={() => handleLeaveReviewClick(booking)}>
                <Icon name="star" size={20} color={colors.primary} />
                <Text style={[styles.iconButtonText, { color: colors.primary, fontSize: fontSizes.buttonText }]}>Write Review</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.info + '10' }]} onPress={() => setServicesDialogOpen(true)}>
              <Icon name="calendar-plus" size={20} color={colors.info} />
              <Text style={[styles.iconButtonText, { color: colors.info, fontSize: fontSizes.buttonText }]}>Book Again</Text>
            </TouchableOpacity>
          </ActionRow>
        );
      case 'CANCELLED':
        return (
          <ActionRow>
            {reportIssueButton(booking)}
            <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.info + '10' }]} onPress={() => setServicesDialogOpen(true)}>
              <Icon name="calendar-plus" size={20} color={colors.info} />
              <Text style={[styles.iconButtonText, { color: colors.info, fontSize: fontSizes.buttonText }]}>Book Again</Text>
            </TouchableOpacity>
          </ActionRow>
        );
      default: return null;
    }
  };

  const renderTodayServicePanel = (item: Booking) => {
    const ts = item.today_service;
    if (!ts || bookingTypeFilter !== 'TODAY') return null;

    const status = String(ts.status || '').toUpperCase();
    const otp = generatedOTPs[item.id];

    if (status === 'SCHEDULED') {
      return (
        <View style={[styles.todayPanel, { backgroundColor: colors.info + '12', borderColor: colors.info + '35' }]}>
          <View style={styles.todayPanelRow}>
            <Icon name="clock-check-outline" size={18} color={colors.info} />
            <Text style={[styles.todayPanelText, styles.todayPanelTextInRow, { color: colors.textSecondary, fontSize: fontSizes.badgeText }]}>
              Scheduled for today — your provider will start at {formatTimeRange(item.start_time, item.end_time)}.
            </Text>
          </View>
        </View>
      );
    }

    if (status === 'IN_PROGRESS') {
      const otpDisabled = otpLoading === item.id || !ts.can_generate_otp;
      return (
        <View style={[styles.todayPanel, { backgroundColor: colors.success + '12', borderColor: colors.success + '35' }]}>
          <Text style={[styles.todayPanelTitle, { color: colors.text, fontSize: fontSizes.buttonText }]}>
            Service in progress
          </Text>
          <Text style={[styles.todayPanelText, { color: colors.textSecondary, fontSize: fontSizes.badgeText }]}>
            Generate an OTP for your provider to complete the visit.
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.todayOtpButton,
              { backgroundColor: colors.primary },
              otpDisabled && styles.todayOtpButtonDisabled,
            ]}
            onPress={() => handleGenerateOTP(item)}
            disabled={otpDisabled}
          >
            {otpLoading === item.id ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <View style={styles.todayOtpButtonContent}>
                <Icon name="shield-key" size={18} color="#fff" />
                <Text
                  style={[styles.todayOtpButtonText, { fontSize: fontSizes.buttonText }]}
                  includeFontPadding={false}
                >
                  Generate OTP
                </Text>
              </View>
            )}
          </TouchableOpacity>
          {ts.otp_active && otp ? (
            <View style={[styles.todayOtpDisplay, { backgroundColor: colors.card, borderColor: colors.border + '40' }]}>
              <Text style={[styles.todayOtpLabel, { color: colors.textSecondary, fontSize: fontSizes.badgeText }]}>
                Share with provider:
              </Text>
              <Text style={[styles.todayOtpCode, { color: colors.text }]}>{otp}</Text>
            </View>
          ) : null}
        </View>
      );
    }

    if (status === 'COMPLETED') {
      return (
        <View style={[styles.todayPanel, { backgroundColor: colors.success + '12', borderColor: colors.success + '35' }]}>
          <View style={styles.todayPanelRow}>
            <Icon name="check-circle" size={18} color={colors.success} />
            <Text style={[styles.todayPanelText, styles.todayPanelTextInRow, { color: colors.textSecondary, fontSize: fontSizes.badgeText }]}>
              Today&apos;s visit is complete.
            </Text>
          </View>
        </View>
      );
    }

    return null;
  };

  const renderBookingItem = ({ item }: { item: Booking }) => {
    const serviceType = item.serviceType || item.service_type;
    const isPaymentPending = item.payment && item.payment.status === "PENDING";
    const displayTaskStatus =
      bookingTypeFilter === 'TODAY' ? getEffectiveTaskStatus(item) : item.taskStatus;
    const compactPrimaryText = colors.text;
    const compactSecondaryText = colors.textSecondary;
    const amountValue =
      Number(item.monthlyAmount || 0) > 0
        ? Number(item.monthlyAmount)
        : Number(item.payment?.total_amount || item.payment?.base_amount || 0);
    const amountText = amountValue > 0 ? `₹${amountValue.toFixed(2)}` : '—';
    const getUrgencyLabel = () => {
      if (bookingTypeFilter === 'TODAY' && item.today_service) {
        const visit = String(item.today_service.status || '').toUpperCase();
        if (visit === 'IN_PROGRESS') return 'In progress today';
        if (visit === 'SCHEDULED') return 'Scheduled today';
        if (visit === 'COMPLETED') return 'Completed today';
      }
      if (isPaymentPending && item.taskStatus !== 'CANCELLED') return 'Payment due';
      if (item.assignmentStatus === 'UNASSIGNED') return 'Provider assigning';
      if (item.taskStatus === 'NOT_STARTED') {
        const bookingStart = dayjs(`${item.startDate || item.date}T${item.start_time}`);
        if (bookingStart.isValid()) {
          const mins = bookingStart.diff(dayjs(), 'minute');
          if (mins > 0 && mins <= 180) {
            return mins < 60 ? `Starts in ${mins}m` : `Starts in ${Math.floor(mins / 60)}h`;
          }
        }
      }
      return null;
    };
    const urgencyLabel = getUrgencyLabel();
    const hasTodayPanel =
      bookingTypeFilter === 'TODAY' &&
      Boolean(item.today_service?.status);
    
    return (
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => handleViewDetails(item)}
        style={styles.compactCardTouch}
      >
        <View
          style={[
            styles.bookingCardCompact,
            hasTodayPanel && styles.bookingCardCompactWithPanel,
            {
              borderColor: colors.border + '25',
              backgroundColor: isDarkMode ? colors.card : colors.card,
            },
          ]}
        >
          <View style={styles.compactHeaderBlock}>
            <View style={styles.compactTopRow}>
              <View style={styles.compactServiceInfo}>
                <View style={[styles.compactServiceIcon, { backgroundColor: colors.primary + '18' }]}>
                  <Icon name={getServiceIcon(serviceType)} size={18} color={colors.primary} />
                </View>
                <View style={styles.compactTitleBlock}>
                  <Text
                    style={[styles.serviceTitle, { color: compactPrimaryText, fontSize: Math.max(14, fontSizes.serviceTitle - 2) }]}
                    numberOfLines={1}
                  >
                    {getServiceTitle(serviceType)}
                  </Text>
                  <Text style={[styles.compactProviderText, { color: compactSecondaryText }]} numberOfLines={2}>
                    #{item.id} · {item.serviceProviderName}
                  </Text>
                </View>
              </View>
              <View style={styles.compactAmountCol}>
                <Text style={[styles.compactAmountValue, { color: compactPrimaryText }]} numberOfLines={1}>
                  {amountText}
                </Text>
                <Text style={[styles.compactAmountLabel, { color: compactSecondaryText }]} numberOfLines={1}>
                  {item.bookingType === 'ON_DEMAND' ? 'ON DEMAND' : item.bookingType}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.compactMetaList}>
            <View style={styles.compactMetaRow}>
              <View style={styles.compactMetaIcon}>
                <Icon name="calendar-blank-outline" size={14} color={compactSecondaryText} />
              </View>
              <View style={styles.compactMetaTextWrap}>
                <Text style={[styles.compactMetaText, { color: compactSecondaryText }]}>
                  {bookingTypeFilter === 'TODAY'
                    ? `Today · ${dayjs(item.date).format('dddd, MMMM D')}`
                    : dayjs(item.date).format('dddd, MMMM D, YYYY')}
                </Text>
              </View>
            </View>
            <View style={styles.compactMetaRow}>
              <View style={styles.compactMetaIcon}>
                <Icon name="clock-outline" size={14} color={compactSecondaryText} />
              </View>
              <View style={styles.compactMetaTextWrap}>
                <Text style={[styles.compactMetaText, { color: compactSecondaryText }]}>
                  {formatTimeRange(item.start_time, item.end_time)}
                </Text>
              </View>
            </View>
            <View style={styles.compactMetaRow}>
              <View style={styles.compactMetaIcon}>
                <Icon name="map-marker-outline" size={14} color={compactSecondaryText} />
              </View>
              <View style={styles.compactMetaTextWrap}>
                <Text style={[styles.compactMetaText, { color: compactSecondaryText }]}>{item.address || 'Address'}</Text>
              </View>
            </View>
          </View>

          {renderTodayServicePanel(item)}

          <View style={styles.compactFooterRow}>
            <View style={styles.compactBadgeRow}>
              <Badge variant={item.bookingType === 'MONTHLY' ? 'info' : item.bookingType === 'ON_DEMAND' ? 'warning' : 'success'}>
                <Text style={[styles.badgeText, styles.badgeMultilineLabel, { color: colors.primary, fontSize: fontSizes.badgeText }]}>
                  {item.bookingType === 'ON_DEMAND' ? 'ON DEMAND' : item.bookingType === 'MONTHLY' ? 'MONTHLY' : 'SHORT TERM'}
                </Text>
              </Badge>
              <StatusChip status={displayTaskStatus} />
              {urgencyLabel && (
                <Badge variant="warning">
                  <Text style={[styles.badgeText, styles.badgeMultilineLabel, { color: colors.warning, fontSize: fontSizes.badgeText }]}>
                    {urgencyLabel}
                  </Text>
                </Badge>
              )}
            </View>
            <TouchableOpacity style={[styles.compactChevronBtn, { borderColor: colors.border + '50', backgroundColor: colors.surface }]} onPress={() => handleViewDetails(item)}>
              <Icon name="chevron-right" size={18} color={compactSecondaryText} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const handleBackPress = () => {
    if (detailsDrawerOpen) { setDetailsDrawerOpen(false); return true; }
    if (modifyDialogOpen) { setModifyDialogOpen(false); return true; }
    if (reviewDialogVisible) { setReviewDialogVisible(false); return true; }
    if (complaintDialogVisible) { setComplaintDialogVisible(false); return true; }
    if (servicesDialogOpen) { setServicesDialogOpen(false); return true; }
    if (confirmationDialog.open) { setConfirmationDialog(prev => ({ ...prev, open: false })); return true; }
    if (onBackToHome) { onBackToHome(); return true; }
    return false;
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [detailsDrawerOpen, modifyDialogOpen, reviewDialogVisible, complaintDialogVisible, servicesDialogOpen, confirmationDialog.open, onBackToHome]);

  useEffect(() => {
    const getInitialUrl = async () => {
      const initialUrl = await Linking.getInitialURL();
    };
    getInitialUrl();
    const subscription = Linking.addEventListener('url', ({ url }) => {});
    return () => subscription.remove();
  }, []);

  // Loading State
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderBookingsHeader()}
        {renderBookingsSearch(true)}

        <View style={styles.bookingTypeFilterWrap}>
          <View style={styles.bookingTypeFilterRow}>
            <SkeletonLoader width={120} height={36} variant="rectangular" style={{ borderRadius: 999 }} />
            <SkeletonLoader width={180} height={36} variant="rectangular" style={{ borderRadius: 999 }} />
            <SkeletonLoader width={110} height={36} variant="rectangular" style={{ borderRadius: 999 }} />
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: footerClearance }}
        >
          <View style={styles.section}>
            {[1, 2, 3].map((item) => (
              <BookingCardSkeleton key={item} colors={colors} fontSizes={fontSizes} />
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  // Main Render - REMOVED the outer ScrollView that was blocking the modal
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderBookingsHeader()}
      {renderBookingsSearch()}
      {renderBookingTypeChips()}
      <RefreshTooltip />

      {/* Content without wrapping ScrollView - using FlatList alternative */}
      <ScrollView 
        style={styles.mainScrollView}
        contentContainerStyle={[
          styles.scrollContentContainer,
          { paddingBottom: footerClearance },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.card}
          />
        }
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {bookingTypeFilter !== 'TODAY' && renderSectionTabs()}

        {bookingTypeFilter === 'TODAY' && (
          <View style={styles.section}>
            {renderBookingsList(todayBookings, renderTodayEmptyState())}
          </View>
        )}

        {bookingTypeFilter !== 'TODAY' && activeSectionTab === 'action_needed' && (
          <View style={styles.section}>
            {renderBookingsList(
              actionNeededBookings,
              <View style={[styles.emptyStateCard, { backgroundColor: colors.card, borderColor: colors.border + '20' }]}>
                <View style={[styles.emptyStateIconContainer, { backgroundColor: colors.success + '10' }]}>
                  <Icon name="check-circle-outline" size={48} color={colors.success} />
                </View>
                <Text style={[styles.emptyStateTitle, { color: colors.text, fontSize: fontSizes.emptyStateTitle }]}>All Caught Up</Text>
                <Text style={[styles.emptyStateText, { color: colors.textSecondary, fontSize: fontSizes.emptyStateText }]}>
                  No urgent booking actions pending right now
                </Text>
              </View>
            )}
          </View>
        )}

        {bookingTypeFilter !== 'TODAY' && activeSectionTab === 'upcoming' && (
          <View style={styles.section}>
            {renderUpcomingStatusFilter()}
            {renderBookingsList(filteredUpcomingBookings, renderUpcomingEmptyState())}
          </View>
        )}

        {bookingTypeFilter !== 'TODAY' && activeSectionTab === 'past' && (
          <View style={styles.section}>
            {renderBookingsList(
              filteredPastBookings,
              <View style={[styles.emptyStateCard, { backgroundColor: colors.card, borderColor: colors.border + '20' }]}>
                <View style={[styles.emptyStateIconContainer, { backgroundColor: colors.textSecondary + '10' }]}>
                  <Icon name="clock-time-four" size={48} color={colors.textSecondary} />
                </View>
                <Text style={[styles.emptyStateTitle, { color: colors.text, fontSize: fontSizes.emptyStateTitle }]}>No Past Bookings</Text>
                <Text style={[styles.emptyStateText, { color: colors.textSecondary, fontSize: fontSizes.emptyStateText }]}>
                  Your completed bookings will appear here
                </Text>
              </View>
            )}
          </View>
        )}

        {bookingTypeFilter !== 'TODAY' && activeSectionTab === 'cancelled' && (
          <View style={styles.section}>
            {renderBookingsList(
              filteredCancelledBookings,
              <View style={[styles.emptyStateCard, { backgroundColor: colors.card, borderColor: colors.border + '20' }]}>
                <View style={[styles.emptyStateIconContainer, { backgroundColor: colors.error + '10' }]}>
                  <Icon name="close-octagon-outline" size={48} color={colors.error} />
                </View>
                <Text style={[styles.emptyStateTitle, { color: colors.text, fontSize: fontSizes.emptyStateTitle }]}>No Cancelled Bookings</Text>
                <Text style={[styles.emptyStateText, { color: colors.textSecondary, fontSize: fontSizes.emptyStateText }]}>
                  Cancelled services will appear here
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Dialogs - These are Modals and won't be affected by parent ScrollView */}
      <ModifyBookingDialog open={modifyDialogOpen} onClose={() => setModifyDialogOpen(false)} booking={convertBookingForChildComponents(selectedBooking)} timeSlots={timeSlots} onSave={handleSaveModifiedBooking} customerId={customerId} refreshBookings={refreshBookings} setOpenSnackbar={setOpenSnackbar} />
      <ConfirmationDialog open={confirmationDialog.open} onClose={() => setConfirmationDialog(prev => ({ ...prev, open: false }))} onConfirm={handleConfirmAction} title={confirmationDialog.title} message={confirmationDialog.message} confirmText={confirmationDialog.type === 'cancel' ? 'Confirm Cancellation' : 'Pay Now'} loading={actionLoading} severity={confirmationDialog.severity} />
      <AddReviewDialog visible={reviewDialogVisible} onClose={closeReviewDialog} booking={convertBookingForChildComponents(selectedReviewBooking)} onReviewSubmitted={handleReviewSubmitted} />
      <RaiseComplaintDialog
        visible={complaintDialogVisible}
        onClose={() => {
          setComplaintDialogVisible(false);
          setSelectedComplaintBooking(null);
        }}
        booking={convertBookingForChildComponents(selectedComplaintBooking)}
      />
      <ServicesDialog open={servicesDialogOpen} onClose={() => setServicesDialogOpen(false)} onServiceSelect={() => {}} />
      
      {/* EngagementDetailsDrawer - This is a Modal, it will render on top independently */}
      <EngagementDetailsDrawer 
        isOpen={detailsDrawerOpen} 
        onClose={() => { 
          setDetailsDrawerOpen(false); 
          setSelectedBooking(null); 
        }} 
        booking={selectedBooking} 
        onPaymentComplete={afterPaymentSuccess}
        refreshBookings={afterPaymentSuccess}
        customerId={customerId}
      />

      {openSnackbar && (
        <View style={[styles.snackbar, { backgroundColor: colors.success, bottom: insets.bottom + 88 }]}>
          <Icon name="check-circle" size={20} color="#fff" />
          <Text style={[styles.snackbarText, { color: '#fff', fontSize: fontSizes.infoText, flex: 1, marginLeft: 8 }]}>
            {snackbarMessage}
          </Text>
          <TouchableOpacity onPress={() => setOpenSnackbar(false)}>
            <Icon name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

// ---------- Styles ----------
const styles = StyleSheet.create({
  container: { flex: 1 },
  
  headerGradient: {
    width: '100%',
    alignSelf: 'stretch',
    backgroundColor: 'transparent',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    paddingBottom: 12,
    paddingTop: 6,
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    minHeight: 68,
    paddingHorizontal: HORIZONTAL_GUTTER,
  },
  headerSideSlot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  headerBackBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitleBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    minWidth: 0,
  },
  headerTitle: {
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
    width: '100%',
  },
  headerSubtitle: {
    color: 'rgba(219, 234, 254, 0.95)',
    textAlign: 'center',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
  },

  searchSection: {
    width: '100%',
    alignSelf: 'stretch',
    paddingHorizontal: HORIZONTAL_GUTTER,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
  },
  searchInput: {
    padding: 0,
    margin: 0,
  },
  bookingTypeFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: HORIZONTAL_GUTTER,
  },
  bookingTypeFilterWrap: {
    marginTop: 8,
    width: '100%',
    alignSelf: 'stretch',
    paddingHorizontal: HORIZONTAL_GUTTER,
  },
  bookingTypeChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  bookingTypeChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  
  mainScrollView: { flex: 1 },
  scrollContentContainer: { flexGrow: 1, paddingBottom: 16 },
  
  section: {
    width: '100%',
    alignSelf: 'stretch',
    paddingHorizontal: HORIZONTAL_GUTTER,
    paddingTop: 12,
    paddingBottom: 20,
    alignItems: 'stretch',
  },
  
  upcomingFiltersBlock: {
    width: '100%',
    marginBottom: 12,
  },
  filterGroupLabel: {
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statusFilterWrap: {
    width: '100%',
    height: 40,
    marginBottom: 12,
    flexGrow: 0,
  },
  statusFilterScroll: {
    height: 40,
    flexGrow: 0,
  },
  statusFilterScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 8,
    height: 40,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 17,
    borderWidth: 1,
    gap: 5,
  },
  statusChipText: {
    fontWeight: '600',
  },
  statusChipCount: {
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusChipCountText: {
    fontSize: 9,
    fontWeight: '700',
  },

  bookingsList: {
    width: '100%',
    alignSelf: 'stretch',
  },
  bookingListItem: {
    width: '100%',
    alignSelf: 'stretch',
  },
  bookingCard: {
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 5,
  },
  compactCardTouch: {
    width: '100%',
    alignSelf: 'stretch',
    marginBottom: 12,
  },
  bookingCardCompact: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  bookingCardCompactWithPanel: {
    paddingBottom: 16,
  },
  todayPanel: {
    marginTop: 10,
    marginBottom: 2,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  todayPanelRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  todayPanelTitle: {
    fontWeight: '600',
    marginBottom: 6,
  },
  todayPanelText: {
    lineHeight: 18,
  },
  todayPanelTextInRow: {
    flex: 1,
    flexShrink: 1,
  },
  todayOtpButton: {
    marginTop: 10,
    height: 48,
    width: '100%',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayOtpButtonDisabled: {
    opacity: 0.5,
  },
  todayOtpButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  todayOtpButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
    lineHeight: 20,
  },
  todayOtpDisplay: {
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  todayOtpLabel: {
    marginBottom: 4,
  },
  todayOtpCode: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 4,
  },
  compactHeaderBlock: {
    width: '100%',
    marginBottom: 10,
  },
  compactTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  compactAmountCol: {
    alignItems: 'flex-end',
    flexShrink: 0,
    maxWidth: '40%',
    gap: 2,
  },
  compactTitleBlock: {
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  compactServiceInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    minWidth: 0,
    gap: 10,
  },
  compactServiceIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactProviderText: {
    fontSize: 12,
    fontWeight: '500',
    opacity: 0.82,
    marginTop: 2,
  },
  compactAmountValue: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.2,
    textAlign: 'right',
    maxWidth: '100%',
  },
  compactAmountLabel: {
    fontSize: 11,
    fontWeight: '700',
    opacity: 0.75,
    marginTop: 2,
    textAlign: 'right',
    maxWidth: '100%',
  },
  compactMetaList: {
    gap: 6,
    marginBottom: 10,
  },
  compactMetaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 7,
  },
  compactMetaIcon: {
    width: 18,
    paddingTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactMetaTextWrap: {
    flex: 1,
    minWidth: 0,
    alignSelf: 'stretch',
  },
  compactMetaText: {
    fontSize: 13,
    fontWeight: '500',
    opacity: 0.9,
    width: '100%',
  },
  compactFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 2,
  },
  compactBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  compactChevronBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  serviceInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceTitle: {
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  
  badgeBase: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    fontWeight: '600',
  },
  badgeMultilineLabel: {
    flexShrink: 1,
  },
  
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  
  actionButtonsContainer: {
    width: '100%',
    marginBottom: 12,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    justifyContent: 'center',
  },
  gradientButton: {
    borderRadius: 14,
    overflow: 'hidden',
    alignSelf: 'stretch',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  gradientInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 8,
    minHeight: 52,
  },
  gradientInnerFill: {
    width: '100%',
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 6,
    flex: 1,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  iconButtonText: {
    fontWeight: '700',
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
    justifyContent: 'center',
    flex: 1,
  },
  outlineButtonText: {
    fontWeight: '700',
  },
  paymentActionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
  },
  paymentButton: {
    flex: 2,
  },
  paymentButtonText: {
    fontWeight: '700',
  },
  reviewSubmittedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    gap: 6,
    flex: 1,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  reviewSubmittedText: {
    fontWeight: '700',
  },
  
  emptyStateWrap: {
    width: '100%',
    alignItems: 'stretch',
    paddingBottom: 12,
  },
  emptyStateCard: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 28,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 8,
    width: '100%',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  clearFilterBtn: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  clearFilterBtnText: {
    fontWeight: '700',
  },
  emptyStateIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyStateText: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 0,
    opacity: 0.7,
  },
  emptyStateCta: {
    width: '100%',
    marginTop: 16,
    alignSelf: 'stretch',
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BRAND.accent,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  emptyStateCtaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyStateButtonText: {
    fontWeight: '600',
    lineHeight: 22,
    textAlign: 'center',
    includeFontPadding: false,
    letterSpacing: 0.2,
  },
  
  snackbar: {
    position: 'absolute',
    left: HORIZONTAL_GUTTER,
    right: HORIZONTAL_GUTTER,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    gap: 8,
  },
  snackbarText: {
    fontWeight: '600',
  },
  
  tooltipContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    zIndex: 10,
  },
  tooltipContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    gap: 8,
  },
  tooltipText: {
    fontWeight: '500',
  },
  tooltipArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  
  card: { borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, marginBottom: 16, padding: 16 },
  disabledButton: { opacity: 0.6 },
});

export default Booking;