/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable */

import React, { useEffect, useState, useRef, forwardRef, useImperativeHandle } from 'react';
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
  RefreshControl,
  Linking,
  BackHandler,
  Animated,
  Dimensions,
} from 'react-native';
import { useAuth0 } from 'react-native-auth0';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import dayjs from 'dayjs';
import RazorpayCheckout from 'react-native-razorpay';
import { useTheme } from '../../src/Settings/ThemeContext';
import { SkeletonLoader } from '../common/SkeletonLoader';
import ModifyBookingDialog from './ModifyBookingDialog';
import ConfirmationDialog from './ConfirmationDialog';
import AddReviewDialog from './AddReviewDialog';
import EngagementDetailsDrawer from './EngagementDetailsDrawer';
import LinearGradient from 'react-native-linear-gradient';
import PaymentInstance from '../services/paymentInstance';
import { useAppUser } from '../context/AppUserContext';
import ServicesDialog from '../ServiceDialogs/ServicesDialog';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  disabled?: boolean;
  gradientColors?: string[];
}> = ({ children, onPress, style, disabled = false, gradientColors }) => {
  const { colors } = useTheme();
  const defaultGradient = [colors.primary, colors.primary + 'DD'];
  
  if (disabled) {
    return (
      <View style={[styles.gradientButton, { opacity: 0.5 }, style]}>
        <LinearGradient colors={['#9CA3AF', '#6B7280']} style={styles.gradientInner}>
          {children}
        </LinearGradient>
      </View>
    );
  }
  
  return (
    <TouchableOpacity onPress={onPress} style={[styles.gradientButton, style]} activeOpacity={0.85}>
      <LinearGradient colors={gradientColors || defaultGradient} style={styles.gradientInner}>
        {children}
      </LinearGradient>
    </TouchableOpacity>
  );
};

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

// ---------- Skeleton Loaders (Enhanced) ----------
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

// [Keep all existing interface definitions unchanged]
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

const formatTimeRange = (startTime: string, endTime: string): string => {
  return `${formatTimeToAMPM(startTime)} - ${formatTimeToAMPM(endTime)}`;
};

// ---------- Main Booking Component ----------
const Booking = forwardRef<BookingRef, BookingProps>(({ onBackToHome }, ref) => {
  const { colors, fontSize, isDarkMode } = useTheme();

  // [Keep all existing state declarations unchanged]
  const [currentBookings, setCurrentBookings] = useState<Booking[]>([]);
  const [pastBookings, setPastBookings] = useState<Booking[]>([]);
  const [futureBookings, setFutureBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [generatedOTPs, setGeneratedOTPs] = useState<Record<number, string>>({});
  const [modifyDialogOpen, setModifyDialogOpen] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [reviewedBookings, setReviewedBookings] = useState<number[]>([]);
  const [servicesDialogOpen, setServicesDialogOpen] = useState(false);
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isForceRefreshing, setIsForceRefreshing] = useState(false);
  const [showRefreshAnimation, setShowRefreshAnimation] = useState(false);
  const [showRefreshTooltip, setShowRefreshTooltip] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState<number | null>(null);
  const [paymentLoading, setPaymentLoading] = useState<number | null>(null);
  const [timeSlots] = useState<string[]>([]);
  const [reviewDialogVisible, setReviewDialogVisible] = useState(false);
  const [selectedReviewBooking, setSelectedReviewBooking] = useState<Booking | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const tooltipAnim = useRef(new Animated.Value(0)).current;

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
  const isAuthenticated = auth0User !== undefined && auth0User !== null;
  const { appUser } = useAppUser();

  // [Keep all existing useEffect hooks unchanged]
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
      await performRefresh(false);
    },
    forceRefresh: async () => {
      console.log("💪 Force refresh triggered from parent");
      await performRefresh(true);
    }
  }));

  const getFontSizes = () => {
    switch (fontSize) {
      case 'small':
        return { headerTitle: 28, headerSubtitle: 14, sectionTitle: 22, sectionSubtitle: 13, serviceTitle: 17, infoText: 14, viewDetailsText: 12, buttonText: 12, badgeText: 11, emptyStateTitle: 20, emptyStateText: 15, searchInput: 15, tooltipText: 11 };
      case 'large':
        return { headerTitle: 34, headerSubtitle: 17, sectionTitle: 24, sectionSubtitle: 15, serviceTitle: 19, infoText: 16, viewDetailsText: 14, buttonText: 14, badgeText: 13, emptyStateTitle: 24, emptyStateText: 17, searchInput: 17, tooltipText: 13 };
      default:
        return { headerTitle: 30, headerSubtitle: 15, sectionTitle: 23, sectionSubtitle: 14, serviceTitle: 18, infoText: 15, viewDetailsText: 13, buttonText: 13, badgeText: 12, emptyStateTitle: 22, emptyStateText: 16, searchInput: 16, tooltipText: 12 };
    }
  };
  const fontSizes = getFontSizes();

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

  // [Keep all existing data mapping functions unchanged]
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
        customerId: item.customerid ? Number(item.customerid) : undefined,
        name: item.customerName || '',
        serviceProviderId: item.serviceproviderid ? Number(item.serviceproviderid) : 0,
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
        taskStatus: item.task_status || '',
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
      const response = await PaymentInstance.get(`/api/customers/${effectiveId}/engagements`);
      const { past = [], ongoing = [], upcoming = [], cancelled = [] } = response.data || {};
      setPastBookings(mapBookingData(past));
      setCurrentBookings(mapBookingData(ongoing));
      setFutureBookings(mapBookingData(upcoming));
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  };

  const fetchBookings = async (id: string) => {
    try {
      await refreshBookings(id);
    } catch (error) {
      console.error('Error fetching booking details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const performRefresh = async (showFullAnimation = true) => {
    if (showFullAnimation) {
      setIsForceRefreshing(true);
      setShowRefreshAnimation(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
    
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
      if (showFullAnimation) {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setIsForceRefreshing(false);
          setShowRefreshAnimation(false);
        });
      }
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
    if (isAuthenticated && appUser?.customerid) {
      setIsLoading(true);
      setCustomerId(appUser.customerid);
      fetchBookings(appUser.customerid);
    } else {
      setIsLoading(false);
    }
  }, [appUser, isAuthenticated]);

  // [Keep all existing handler functions unchanged]
  const handleGenerateOTP = async (booking: Booking) => {
    if (!booking.today_service?.service_day_id) {
      Alert.alert('Error', 'Failed to generate OTP');
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
        Alert.alert('Success', 'OTP generated successfully');
      }
    } catch (error: any) {
      console.error('Error generating OTP:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to generate OTP');
    } finally {
      setOtpLoading(null);
    }
  };

  const handleCompletePayment = async (booking: Booking) => {
    if (!booking.payment?.engagement_id) {
      Alert.alert('Error', 'Failed to resume payment');
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
        description: `Payment for ${getServiceTitle(booking.service_type)}`,
        prefill: {
          name: customer?.firstname || booking.customerName,
          contact: customer?.contact || '9999999999',
          email: customer?.email || auth0User?.email || '',
        },
        theme: { color: colors.primary },
      };
      RazorpayCheckout.open(options)
        .then(async (data: any) => {
          try {
            await PaymentInstance.post("/api/payments/verify", {
              engagementId: engagement_id,
              razorpay_order_id: data.razorpay_order_id,
              razorpay_payment_id: data.razorpay_payment_id,
              razorpay_signature: data.razorpay_signature,
            });
            Alert.alert('Success', 'Payment completed successfully');
            if (customerId) await refreshBookings();
          } catch (verifyError) {
            console.error('Payment verification error:', verifyError);
            Alert.alert('Error', 'Payment verification failed');
          }
        })
        .catch((error: any) => {
          if (error.code !== 2) Alert.alert('Error', 'Payment failed');
        });
    } catch (err) {
      console.error('Complete payment error:', err);
      Alert.alert('Error', 'Failed to resume payment');
    } finally {
      setPaymentLoading(null);
    }
  };

  const handleCancelBooking = async (booking: Booking) => {
    try {
      setActionLoading(true);
      await PaymentInstance.put(`/api/engagements/${booking.id}`, { task_status: "CANCELLED" });
      await refreshBookings();
      setSnackbarMessage('Booking cancelled successfully');
      setOpenSnackbar(true);
      setTimeout(() => setOpenSnackbar(false), 3000);
    } catch (error) {
      console.error('Error cancelling engagement:', error);
      setCurrentBookings(prev => prev.map(b => b.id === booking.id ? { ...b, taskStatus: "CANCELLED" } : b));
      setFutureBookings(prev => prev.map(b => b.id === booking.id ? { ...b, taskStatus: "CANCELLED" } : b));
    } finally {
      setActionLoading(false);
    }
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
    } catch (error) {
      console.error('Error performing action:', error);
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

  const closeReviewDialog = () => {
    setReviewDialogVisible(false);
    setSelectedReviewBooking(null);
  };

  const handleReviewSubmitted = (bookingId: number) => {
    setReviewedBookings(prev => [...prev, bookingId]);
    performRefresh(false);
  };

  const hasReview = (booking: Booking): boolean => reviewedBookings.includes(booking.id);

  const handleViewDetails = (booking: Booking) => {
    setSelectedBooking(booking);
    setDetailsDrawerOpen(true);
  };

  const handleSaveModifiedBooking = async () => {
    setModifyDialogOpen(false);
    await performRefresh(false);
  };

  // [Keep all existing filter functions unchanged]
  const filterBookings = (bookings: Booking[], term: string) => {
    if (!term) return bookings;
    return bookings.filter(booking =>
      getServiceTitle(booking.service_type).toLowerCase().includes(term.toLowerCase()) ||
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
    { value: 'ALL', label: 'All', icon: 'view-dashboard', count: upcomingBookings.length },
    { value: 'NOT_STARTED', label: 'Not Started', icon: 'clock-outline', count: upcomingBookings.filter(b => b.taskStatus === 'NOT_STARTED').length },
    { value: 'IN_PROGRESS', label: 'In Progress', icon: 'progress-clock', count: upcomingBookings.filter(b => b.taskStatus === 'IN_PROGRESS').length },
    { value: 'COMPLETED', label: 'Completed', icon: 'check-circle', count: upcomingBookings.filter(b => b.taskStatus === 'COMPLETED').length },
    { value: 'CANCELLED', label: 'Cancelled', icon: 'close-circle', count: upcomingBookings.filter(b => b.taskStatus === 'CANCELLED').length },
  ];

  // Refresh Animation Overlay Component
  const RefreshAnimationOverlay = () => {
    if (!showRefreshAnimation) return null;
    
    return (
      <Animated.View style={[styles.refreshOverlay, { backgroundColor: colors.background + 'CC', opacity: fadeAnim }]}>
        <View style={[styles.refreshAnimationContainer, { backgroundColor: colors.card }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.refreshAnimationText, { color: colors.text, fontSize: fontSizes.serviceTitle }]}>
            Refreshing Bookings...
          </Text>
        </View>
      </Animated.View>
    );
  };

  // Refresh Tooltip Component
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

  // ---------- Enhanced Render Helpers ----------
  const renderActionButtons = (booking: Booking) => {
    const isPaymentPending = booking.payment && booking.payment.status === "PENDING";
    const canShowPaymentButton = isPaymentPending && booking.taskStatus !== 'CANCELLED';

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
        return null;
      case 'IN_PROGRESS':
        return (
          <View style={styles.actionButtonsRow}>
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
          </View>
        );
      case 'COMPLETED':
        return (
          <View style={styles.actionButtonsRow}>
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
          </View>
        );
      case 'CANCELLED':
        return (
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity style={[styles.iconButton, { backgroundColor: colors.info + '10' }]} onPress={() => setServicesDialogOpen(true)}>
              <Icon name="calendar-plus" size={20} color={colors.info} />
              <Text style={[styles.iconButtonText, { color: colors.info, fontSize: fontSizes.buttonText }]}>Book Again</Text>
            </TouchableOpacity>
          </View>
        );
      default: return null;
    }
  };

  const renderBookingItem = ({ item }: { item: Booking }) => {
    const serviceType = item.serviceType || item.service_type;
    const isPaymentPending = item.payment && item.payment.status === "PENDING";
    
    return (
      <TouchableOpacity activeOpacity={0.95} onPress={() => handleViewDetails(item)}>
        <LinearGradient
          colors={[colors.card, colors.card]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.bookingCard, { borderColor: colors.border + '20' }]}
        >
          {/* Header Section */}
          <View style={styles.cardHeader}>
            <View style={styles.serviceInfoContainer}>
              <LinearGradient
                colors={[colors.primary + '20', colors.primary + '10']}
                style={styles.serviceIconContainer}
              >
                <Icon name={getServiceIcon(serviceType)} size={24} color={colors.primary} />
              </LinearGradient>
              <View>
                <Text style={[styles.serviceTitle, { color: colors.text, fontSize: fontSizes.serviceTitle }]}>
                  {getServiceTitle(serviceType)}
                </Text>
                <View style={styles.providerInfo}>
                  <Icon name="account" size={12} color={colors.textSecondary} />
                  <Text style={[styles.providerName, { color: colors.textSecondary, fontSize: fontSizes.infoText - 2 }]}>
                    {item.serviceProviderName}
                  </Text>
                  {item.providerRating > 0 && (
                    <View style={styles.ratingContainer}>
                      <Icon name="star" size={12} color="#FBBF24" />
                      <Text style={[styles.ratingText, { color: colors.textSecondary, fontSize: fontSizes.infoText - 2 }]}>
                        {item.providerRating}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
            <Badge variant={item.bookingType === 'MONTHLY' ? 'info' : item.bookingType === 'ON_DEMAND' ? 'warning' : 'success'}>
              <Icon name={getBookingTypeIcon(item.bookingType)} size={14} color={colors.primary} />
              <Text style={[styles.badgeText, { color: colors.primary, fontSize: fontSizes.badgeText }]}>
                {item.bookingType === 'ON_DEMAND' ? 'On Demand' : item.bookingType === 'MONTHLY' ? 'Monthly' : 'Short Term'}
              </Text>
            </Badge>
          </View>

          {/* Status and Payment Info */}
          <View style={styles.statusRow}>
            <StatusChip status={item.taskStatus} />
            {isPaymentPending && item.taskStatus !== 'CANCELLED' && (
              <Badge variant="error">
                <Icon name="alert-circle" size={14} color={colors.error} />
                <Text style={[styles.badgeText, { color: colors.error, fontSize: fontSizes.badgeText }]}>Payment Pending</Text>
              </Badge>
            )}
            {item.assignmentStatus === "UNASSIGNED" && !isPaymentPending && (
              <Badge variant="warning">
                <Icon name="clock" size={14} color={colors.warning} />
                <Text style={[styles.badgeText, { color: colors.warning, fontSize: fontSizes.badgeText }]}>Awaiting Assignment</Text>
              </Badge>
            )}
          </View>

          {/* Date & Time Section */}
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <View style={[styles.detailIconBg, { backgroundColor: colors.primary + '10' }]}>
                <Icon name="calendar" size={16} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.detailLabel, { color: colors.textSecondary, fontSize: fontSizes.infoText - 2 }]}>Date</Text>
                <Text style={[styles.detailValue, { color: colors.text, fontSize: fontSizes.infoText }]}>
                  {dayjs(item.date).format('ddd, MMM D, YYYY')}
                </Text>
              </View>
            </View>
            <View style={styles.detailItem}>
              <View style={[styles.detailIconBg, { backgroundColor: colors.primary + '10' }]}>
                <Icon name="clock-outline" size={16} color={colors.primary} />
              </View>
              <View>
                <Text style={[styles.detailLabel, { color: colors.textSecondary, fontSize: fontSizes.infoText - 2 }]}>Time</Text>
                <Text style={[styles.detailValue, { color: colors.text, fontSize: fontSizes.infoText }]}>
                  {formatTimeRange(item.start_time, item.end_time)}
                </Text>
              </View>
            </View>
            {item.monthlyAmount > 0 && (
              <View style={styles.detailItem}>
                <View style={[styles.detailIconBg, { backgroundColor: colors.primary + '10' }]}>
                  <Icon name="currency-inr" size={16} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary, fontSize: fontSizes.infoText - 2 }]}>Amount</Text>
                  <Text style={[styles.detailValue, { color: colors.text, fontSize: fontSizes.infoText, fontWeight: '600' }]}>
                    ₹{item.monthlyAmount.toLocaleString()}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            {renderActionButtons(item)}
          </View>

          {/* View Details Indicator */}
          <View style={styles.viewDetailsIndicator}>
            <Text style={[styles.viewDetailsText, { color: colors.textSecondary + '80', fontSize: fontSizes.viewDetailsText }]}>
              Tap to view full details
            </Text>
            <Icon name="chevron-right" size={16} color={colors.textSecondary + '80'} />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  // [Keep existing back button handling]
  const handleBackPress = () => {
    if (detailsDrawerOpen) { setDetailsDrawerOpen(false); return true; }
    if (modifyDialogOpen) { setModifyDialogOpen(false); return true; }
    if (reviewDialogVisible) { setReviewDialogVisible(false); return true; }
    if (servicesDialogOpen) { setServicesDialogOpen(false); return true; }
    if (confirmationDialog.open) { setConfirmationDialog(prev => ({ ...prev, open: false })); return true; }
    if (onBackToHome) { onBackToHome(); return true; }
    return false;
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [detailsDrawerOpen, modifyDialogOpen, reviewDialogVisible, servicesDialogOpen, confirmationDialog.open, onBackToHome]);

  // [Keep existing deep linking]
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
        <LinearGradient
          colors={[colors.primary + '40', colors.primary + '20', colors.background]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerTopRow}>
            <TouchableOpacity style={[styles.backButton, { backgroundColor: 'rgba(255, 255, 255, 0.9)' }]} onPress={handleBackPress}>
              <Icon name="arrow-left" size={24} color={colors.primary} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={[styles.headerTitle, { color: colors.primary, fontSize: fontSizes.headerTitle }]}>My Bookings</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary, fontSize: fontSizes.headerSubtitle }]}>Manage your service bookings</Text>
            </View>
          </View>
        </LinearGradient>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <View style={[styles.sectionHeader, { backgroundColor: colors.primary + '15', borderLeftColor: colors.primary }]}>
              <SkeletonLoader width={24} height={24} variant="circular" />
              <View style={styles.sectionHeaderContent}>
                <SkeletonLoader width={150} height={24} />
                <SkeletonLoader width={100} height={16} style={{ marginTop: 4 }} />
              </View>
              <SkeletonLoader width={40} height={32} variant="rectangular" />
            </View>
            <View style={styles.statusFilterContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {[1, 2, 3, 4, 5].map((item) => (
                  <SkeletonLoader key={item} width={80} height={36} variant="rectangular" style={{ marginRight: 10, borderRadius: 20 }} />
                ))}
              </ScrollView>
            </View>
            {[1, 2, 3].map((item) => (
              <BookingCardSkeleton key={item} colors={colors} fontSizes={fontSizes} />
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  // Main Render
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[isDarkMode ? colors.primary + 'CC' : colors.primary + 'DD', isDarkMode ? colors.primary + '99' : colors.primary + 'AA', colors.background]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerTopRow}>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: 'rgba(255, 255, 255, 0.95)' }]} onPress={handleBackPress}>
            <Icon name="arrow-left" size={24} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, { color: '#fff', fontSize: fontSizes.headerTitle }]}>My Bookings</Text>
            <Text style={[styles.headerSubtitle, { color: '#fff', fontSize: fontSizes.headerSubtitle, opacity: 0.9 }]}>
              Manage your service bookings
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <View style={[styles.searchContainer, { backgroundColor: '#fff', borderColor: '#fff' }]}>
            <Icon name="magnify" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text, fontSize: fontSizes.searchInput, flex: 1 }]}
              placeholder="Search bookings..."
              placeholderTextColor={colors.textSecondary + '80'}
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
            {searchTerm && (
              <TouchableOpacity onPress={() => setSearchTerm('')}>
                <Icon name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      <RefreshTooltip />

      <ScrollView 
        style={styles.mainScrollView}
        contentContainerStyle={styles.scrollContentContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
            progressBackgroundColor={colors.card}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Upcoming Bookings Section */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { backgroundColor: colors.primary + '10', borderLeftColor: colors.primary }]}>
            <View style={[styles.sectionIconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Icon name="calendar-clock" size={24} color={colors.primary} />
            </View>
            <View style={styles.sectionHeaderContent}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSizes.sectionTitle }]}>Upcoming Bookings</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary, fontSize: fontSizes.sectionSubtitle }]}>
                {filteredUpcomingBookings.length} {filteredUpcomingBookings.length === 1 ? 'upcoming booking' : 'upcoming bookings'}
              </Text>
            </View>
            <View style={[styles.sectionBadge, { backgroundColor: colors.primary + '15' }]}>
              <Text style={[styles.sectionBadgeText, { color: colors.primary, fontSize: fontSizes.badgeText, fontWeight: '700' }]}>
                {upcomingBookings.length}
              </Text>
            </View>
          </View>

          {/* Status Filter Tabs */}
          <View style={styles.statusFilterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusTabsContent}>
              {statusTabs.map((tab) => (
                <TouchableOpacity
                  key={tab.value}
                  style={[
                    styles.statusTab,
                    { backgroundColor: colors.surface },
                    statusFilter === tab.value && { backgroundColor: colors.primary }
                  ]}
                  onPress={() => setStatusFilter(tab.value)}
                >
                  <Icon name={tab.icon} size={16} color={statusFilter === tab.value ? '#fff' : colors.textSecondary} />
                  <Text style={[
                    styles.statusTabText, 
                    { color: statusFilter === tab.value ? '#fff' : colors.textSecondary, fontSize: fontSizes.badgeText }
                  ]}>
                    {tab.label}
                  </Text>
                  <View style={[
                    styles.statusTabCount, 
                    { backgroundColor: statusFilter === tab.value ? '#ffffff30' : colors.border }
                  ]}>
                    <Text style={[
                      styles.statusTabCountText, 
                      { color: statusFilter === tab.value ? '#fff' : colors.textSecondary, fontSize: fontSizes.badgeText - 2 }
                    ]}>
                      {tab.count}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Bookings List */}
          {filteredUpcomingBookings.length > 0 ? (
            <FlatList 
              data={filteredUpcomingBookings} 
              renderItem={renderBookingItem} 
              keyExtractor={(item) => item.id.toString()} 
              scrollEnabled={false}
              style={styles.bookingsList}
            />
          ) : (
            <View style={[styles.emptyStateCard, { backgroundColor: colors.card, borderColor: colors.border + '20' }]}>
              <View style={[styles.emptyStateIconContainer, { backgroundColor: colors.primary + '10' }]}>
                <Icon name="calendar-check" size={48} color={colors.primary} />
              </View>
              <Text style={[styles.emptyStateTitle, { color: colors.text, fontSize: fontSizes.emptyStateTitle }]}>No Upcoming Bookings</Text>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary, fontSize: fontSizes.emptyStateText }]}>
                You don't have any upcoming service bookings
              </Text>
              <GradientButton 
                style={styles.emptyStateButton} 
                onPress={() => setServicesDialogOpen(true)}
              >
                <Icon name="plus" size={20} color="#fff" />
                <Text style={{ color: '#fff', fontSize: fontSizes.buttonText, fontWeight: '600' }}>Book a Service</Text>
              </GradientButton>
            </View>
          )}
        </View>

        {/* Past Bookings Section */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, styles.pastSectionHeader, { backgroundColor: colors.textSecondary + '10', borderLeftColor: colors.textSecondary }]}>
            <View style={[styles.sectionIconContainer, { backgroundColor: colors.textSecondary + '20' }]}>
              <Icon name="history" size={24} color={colors.textSecondary} />
            </View>
            <View style={styles.sectionHeaderContent}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSizes.sectionTitle }]}>Past Bookings</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary, fontSize: fontSizes.sectionSubtitle }]}>
                {filteredPastBookings.length} {filteredPastBookings.length === 1 ? 'past booking' : 'past bookings'}
              </Text>
            </View>
            <View style={[styles.sectionBadge, { backgroundColor: colors.textSecondary + '15' }]}>
              <Text style={[styles.sectionBadgeText, { color: colors.textSecondary, fontSize: fontSizes.badgeText, fontWeight: '700' }]}>
                {pastBookings.length}
              </Text>
            </View>
          </View>

          {filteredPastBookings.length > 0 ? (
            <FlatList 
              data={filteredPastBookings} 
              renderItem={renderBookingItem} 
              keyExtractor={(item) => item.id.toString()} 
              scrollEnabled={false}
              style={styles.bookingsList}
            />
          ) : (
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
      </ScrollView>

      <RefreshAnimationOverlay />

      {/* Dialogs */}
      <ModifyBookingDialog open={modifyDialogOpen} onClose={() => setModifyDialogOpen(false)} booking={convertBookingForChildComponents(selectedBooking)} timeSlots={timeSlots} onSave={handleSaveModifiedBooking} customerId={customerId} refreshBookings={refreshBookings} setOpenSnackbar={setOpenSnackbar} />
      <ConfirmationDialog open={confirmationDialog.open} onClose={() => setConfirmationDialog(prev => ({ ...prev, open: false }))} onConfirm={handleConfirmAction} title={confirmationDialog.title} message={confirmationDialog.message} confirmText={confirmationDialog.type === 'cancel' ? 'Confirm Cancellation' : 'Pay Now'} loading={actionLoading} severity={confirmationDialog.severity} />
      <AddReviewDialog visible={reviewDialogVisible} onClose={closeReviewDialog} booking={convertBookingForChildComponents(selectedReviewBooking)} onReviewSubmitted={handleReviewSubmitted} />
      <ServicesDialog open={servicesDialogOpen} onClose={() => setServicesDialogOpen(false)} onServiceSelect={() => {}} />
      <EngagementDetailsDrawer 
        isOpen={detailsDrawerOpen} 
        onClose={() => { 
          setDetailsDrawerOpen(false); 
          setSelectedBooking(null); 
        }} 
        booking={selectedBooking} 
        onPaymentComplete={refreshBookings}
        refreshBookings={refreshBookings}
        customerId={customerId}
      />

      {openSnackbar && (
        <View style={[styles.snackbar, { backgroundColor: colors.success }]}>
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

// ---------- Enhanced Styles ----------
const styles = StyleSheet.create({
  container: { flex: 1 },
  
  // Header Styles
  header: { 
    paddingHorizontal: 20, 
    paddingTop: 50, 
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTopRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: { 
    flex: 1, 
    alignItems: 'center' 
  },
  headerTitle: { 
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerSubtitle: { 
    marginTop: 4,
    textAlign: 'center',
  },
  
  // Search Styles
  searchWrapper: {
    marginTop: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    padding: 0,
    margin: 0,
  },
  
  // Main Content
  mainScrollView: { flex: 1 },
  scrollContentContainer: { flexGrow: 1, paddingBottom: 20 },
  section: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  
  // Section Header
  sectionHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 16, 
    padding: 16, 
    borderRadius: 16,
    borderLeftWidth: 4,
  },
  pastSectionHeader: { borderLeftColor: 'rgba(156, 163, 175, 0.4)' },
  sectionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeaderContent: { flex: 1, marginLeft: 16 },
  sectionTitle: { fontWeight: '700', letterSpacing: -0.3 },
  sectionSubtitle: { marginTop: 4, opacity: 0.7 },
  sectionBadge: { 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 20,
    minWidth: 48,
    alignItems: 'center',
  },
  sectionBadgeText: { fontWeight: '700' },
  
  // Status Tabs
  statusFilterContainer: { marginBottom: 20 },
  statusTabsContent: { paddingRight: 16, gap: 10 },
  statusTab: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8,
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 30,
    marginRight: 10,
  },
  statusTabText: { fontWeight: '600', marginRight: 4 },
  statusTabCount: { 
    borderRadius: 20, 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    minWidth: 28, 
    alignItems: 'center',
  },
  statusTabCountText: { fontWeight: '600' },
  
  // Booking Card
  bookingsList: { marginTop: 0 },
  bookingCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
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
  serviceIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceTitle: {
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  providerName: {
    opacity: 0.7,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 8,
  },
  ratingText: {
    opacity: 0.7,
  },
  
  // Badge Styles
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
  
  // Status Row
  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Details Grid
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: '45%',
  },
  detailIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailLabel: {
    opacity: 0.6,
    marginBottom: 2,
  },
  detailValue: {
    fontWeight: '500',
  },
  
  // Action Buttons
  actionButtonsContainer: {
    width: '100%',
    marginBottom: 12,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gradientButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradientInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  iconButtonText: {
    fontWeight: '600',
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    justifyContent: 'center',
    flex: 1,
  },
  outlineButtonText: {
    fontWeight: '600',
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
    fontWeight: '600',
  },
  reviewSubmittedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  reviewSubmittedText: {
    fontWeight: '600',
  },
  
  // View Details Indicator
  viewDetailsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    gap: 4,
  },
  viewDetailsText: {
    opacity: 0.6,
  },
  
  // Empty State
  emptyStateCard: {
    alignItems: 'center',
    padding: 48,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 8,
  },
  emptyStateIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  emptyStateText: {
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    opacity: 0.7,
  },
  emptyStateButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  
  // Snackbar
  snackbar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
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
  
  // Refresh Overlay
  refreshOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  refreshAnimationContainer: {
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  refreshAnimationText: {
    marginTop: 16,
    fontWeight: '600',
  },
  
  // Tooltip
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
  
  // Misc
  separator: { height: 1, marginVertical: 12 },
  card: { borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, marginBottom: 16, padding: 16 },
  button: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', borderWidth: 1, minHeight: 40 },
  disabledButton: { opacity: 0.6 },
  separatorBase: { height: 1, marginVertical: 16 },
});

export default Booking;