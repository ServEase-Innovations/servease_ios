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
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {children}
    </Container>
  );
};

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

const Badge: React.FC<{ children: React.ReactNode; style?: StyleProp<ViewStyle> }> = ({ children, style }) => {
  const { colors } = useTheme();
  return <View style={[styles.badgeBase, { borderColor: colors.border }, style]}>{children}</View>;
};

const Separator: React.FC<{ style?: StyleProp<ViewStyle> }> = ({ style }) => {
  const { colors } = useTheme();
  return <View style={[styles.separatorBase, { backgroundColor: colors.border }, style]} />;
};

// ---------- Skeleton Loaders ----------
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
          <SkeletonLoader key={item} width={80} height={36} variant="rectangular" style={{ marginRight: 10 }} />
        ))}
      </ScrollView>
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
    case 'cook': return 'Home Cook';
    case 'maid': return 'Maid Service';
    case 'nanny': return 'Caregiver';
    case 'cleaning': return 'Cleaning Service';
    default: return 'Home Service';
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

  // State variables
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

  // Auto-hide tooltip after 5 seconds
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

  // Expose methods to parent component via ref
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

  // Font sizes
  const getFontSizes = () => {
    switch (fontSize) {
      case 'small':
        return { headerTitle: 24, headerSubtitle: 14, sectionTitle: 20, sectionSubtitle: 13, serviceTitle: 15, infoText: 13, viewDetailsText: 11, buttonText: 11, badgeText: 11, emptyStateTitle: 18, emptyStateText: 15, searchInput: 14, tooltipText: 11 };
      case 'large':
        return { headerTitle: 32, headerSubtitle: 18, sectionTitle: 24, sectionSubtitle: 16, serviceTitle: 18, infoText: 16, viewDetailsText: 14, buttonText: 14, badgeText: 14, emptyStateTitle: 22, emptyStateText: 18, searchInput: 18, tooltipText: 13 };
      default:
        return { headerTitle: 28, headerSubtitle: 16, sectionTitle: 22, sectionSubtitle: 14, serviceTitle: 16, infoText: 14, viewDetailsText: 12, buttonText: 12, badgeText: 12, emptyStateTitle: 20, emptyStateText: 16, searchInput: 16, tooltipText: 12 };
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
      } : null,
    };
  };

  // ---------- Core Data Mapping ----------
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

  // Enhanced refresh function with animation
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

  // Pull to refresh handler
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

  // ---------- OTP & Payment Handlers ----------
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

  // ---------- Action Handlers ----------
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

  // ---------- Filtering & Sorting ----------
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
    { value: 'ALL', label: 'All', count: upcomingBookings.length },
    { value: 'NOT_STARTED', label: 'Not Started', count: upcomingBookings.filter(b => b.taskStatus === 'NOT_STARTED').length },
    { value: 'IN_PROGRESS', label: 'In Progress', count: upcomingBookings.filter(b => b.taskStatus === 'IN_PROGRESS').length },
    { value: 'COMPLETED', label: 'Completed', count: upcomingBookings.filter(b => b.taskStatus === 'COMPLETED').length },
    { value: 'CANCELLED', label: 'Cancelled', count: upcomingBookings.filter(b => b.taskStatus === 'CANCELLED').length },
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

  // ---------- Render Helpers ----------
  const renderActionButtons = (booking: Booking) => {
    const isPaymentPending = booking.payment && booking.payment.status === "PENDING";
    const canShowPaymentButton = isPaymentPending && booking.taskStatus !== 'CANCELLED';

    if (canShowPaymentButton) {
      return (
        <View style={styles.paymentActionContainer}>
          <Button 
            style={[styles.actionButton, styles.paymentButton, { backgroundColor: colors.card, borderColor: colors.error }]} 
            onPress={() => handlePaymentClick(booking)} 
            disabled={paymentLoading === booking.id}
          >
            {paymentLoading === booking.id ? (
              <><ActivityIndicator size="small" color={colors.error} /><Text style={[styles.paymentButtonText, { color: colors.error, fontSize: fontSizes.buttonText }]}>Processing...</Text></>
            ) : (
              <><Icon name="credit-card" size={16} color={colors.error} /><Text style={[styles.paymentButtonText, { color: colors.error, fontSize: fontSizes.buttonText }]}>Complete Payment</Text></>
            )}
          </Button>
          <Button 
            style={[styles.actionButton, styles.cancelButton, { backgroundColor: colors.card, borderColor: colors.error }]} 
            onPress={() => handleCancelClick(booking)}
          >
            <Icon name="close-circle" size={16} color={colors.error} />
            <Text style={[styles.cancelButtonText, { color: colors.error, fontSize: fontSizes.buttonText }]}>Cancel</Text>
          </Button>
        </View>
      );
    }

    switch (booking.taskStatus) {
      case 'NOT_STARTED':
        return null;
      case 'IN_PROGRESS':
        return (
          <View style={styles.actionButtonsRow}>
            <Button style={[styles.actionButton, styles.callButton, { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => Alert.alert('Call', `Call ${getServiceTitle(booking.service_type)}`)}>
              <Icon name="phone" size={16} color="#fff" />
              <Text style={[styles.callButtonText, { color: '#fff', fontSize: fontSizes.buttonText }]}>Call</Text>
            </Button>
            <Button style={[styles.actionButton, styles.messageButton, { backgroundColor: colors.success, borderColor: colors.success }]} onPress={() => Alert.alert('Message', `Message ${getServiceTitle(booking.service_type)}`)}>
              <Icon name="message-text" size={16} color="#fff" />
              <Text style={[styles.messageButtonText, { color: '#fff', fontSize: fontSizes.buttonText }]}>Message</Text>
            </Button>
            <Button style={[styles.actionButton, styles.cancelButton, { backgroundColor: colors.error, borderColor: colors.error }]} onPress={() => handleCancelClick(booking)}>
              <Icon name="close-circle" size={16} color="#fff" />
              <Text style={[styles.cancelButtonText, { color: '#fff', fontSize: fontSizes.buttonText }]}>Cancel</Text>
            </Button>
          </View>
        );
      case 'COMPLETED':
        return (
          <View style={styles.actionButtonsRow}>
            {hasReview(booking) ? (
              <Button style={[styles.actionButton, styles.reviewSubmittedButton, { backgroundColor: colors.successLight, borderColor: colors.success }]} disabled={true}>
                <Icon name="check-circle" size={16} color={colors.success} />
                <Text style={[styles.reviewSubmittedText, { color: colors.success, fontSize: fontSizes.buttonText }]}>Reviewed</Text>
              </Button>
            ) : (
              <Button style={[styles.actionButton, styles.reviewButton, { borderColor: colors.primary, backgroundColor: colors.card }]} onPress={() => handleLeaveReviewClick(booking)}>
                <Icon name="message-text" size={16} color={colors.primary} />
                <Text style={[styles.reviewButtonText, { color: colors.primary, fontSize: fontSizes.buttonText }]}>Review</Text>
              </Button>
            )}
            <Button style={[styles.actionButton, styles.bookAgainButton, { borderColor: colors.primary, backgroundColor: colors.card }]} onPress={() => setServicesDialogOpen(true)}>
              <Icon name="calendar-plus" size={16} color={colors.primary} />
              <Text style={[styles.bookAgainText, { color: colors.primary, fontSize: fontSizes.buttonText }]}>Book Again</Text>
            </Button>
          </View>
        );
      case 'CANCELLED':
        return (
          <View style={styles.actionButtonsRow}>
            <Button style={[styles.actionButton, styles.bookAgainButton, { borderColor: colors.primary, backgroundColor: colors.card }]} onPress={() => setServicesDialogOpen(true)}>
              <Icon name="calendar-plus" size={16} color={colors.primary} />
              <Text style={[styles.bookAgainText, { color: colors.primary, fontSize: fontSizes.buttonText }]}>Book Again</Text>
            </Button>
          </View>
        );
      default: return null;
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
            <Text style={[styles.serviceTitle, { color: colors.text, fontSize: fontSizes.serviceTitle }]}>{getServiceTitle(serviceType)}</Text>
          </View>
          <View style={styles.statusContainer}>{getBookingTypeBadge(item.bookingType, colors, fontSizes)}</View>
        </View>
        {isPaymentPending && item.taskStatus !== 'CANCELLED' && (
          <View style={styles.paymentPendingRow}>
            <Badge style={[styles.paymentPendingBadge, { backgroundColor: colors.error + '15', borderColor: colors.error + '30' }]}>
              <Icon name="alert-circle" size={14} color={colors.error} />
              <Text style={[styles.paymentPendingBadgeText, { color: colors.error, fontSize: fontSizes.badgeText }]}>Payment Required</Text>
            </Badge>
          </View>
        )}
        {item.assignmentStatus === "UNASSIGNED" && !isPaymentPending && (
          <View style={styles.awaitingRow}>
            <Badge style={[styles.awaitingBadge, { backgroundColor: colors.warning + '15', borderColor: colors.warning + '30' }]}>
              <Icon name="clock" size={14} color={colors.warning} />
              <Text style={[styles.awaitingBadgeText, { color: colors.warning, fontSize: fontSizes.badgeText }]}>Awaiting Assignment</Text>
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
        <Separator style={styles.separator} />
        <View style={styles.actionButtonsContainer}>{renderActionButtons(item)}</View>
        <View style={styles.viewDetailsIndicator}>
          <Text style={[styles.viewDetailsText, { color: colors.textSecondary, fontSize: fontSizes.viewDetailsText }]}>Tap to view details</Text>
          <Icon name="chevron-right" size={16} color={colors.textSecondary} />
        </View>
      </Card>
    );
  };

  // ---------- Back Button Handling ----------
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

  // Deep linking (simplified)
  useEffect(() => {
    const getInitialUrl = async () => {
      const initialUrl = await Linking.getInitialURL();
    };
    getInitialUrl();
    const subscription = Linking.addEventListener('url', ({ url }) => {});
    return () => subscription.remove();
  }, []);

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
          <View style={styles.headerRight}>
            <View style={styles.searchContainer}>
              <SkeletonLoader width="100%" height={48} variant="rectangular" />
            </View>
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
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[isDarkMode ? 'rgba(14, 48, 92, 0.9)' : 'rgba(139, 187, 221, 0.8)', isDarkMode ? 'rgba(30, 64, 108, 0.9)' : 'rgba(213, 229, 233, 0.8)', isDarkMode ? colors.background : 'rgba(255,255,255,1)']}
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
        <View style={styles.headerRight}>
          <View style={styles.searchContainer}>
            <TextInput
              style={[styles.searchInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text, fontSize: fontSizes.searchInput }]}
              placeholder="Search bookings..."
              placeholderTextColor={colors.placeholder}
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
            {searchTerm && (
              <TouchableOpacity style={styles.clearSearchButton} onPress={() => setSearchTerm('')}>
                <Icon name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* Refresh Tooltip - Shows after header */}
      <RefreshTooltip />

      {/* Main ScrollView with Pull to Refresh */}
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
          <View style={[styles.sectionHeader, { backgroundColor: colors.primary + '15', borderLeftColor: colors.primary }]}>
            <Icon name="alert-circle" size={24} color={colors.primary} />
            <View style={styles.sectionHeaderContent}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSizes.sectionTitle }]}>Upcoming Bookings</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary, fontSize: fontSizes.sectionSubtitle }]}>
                {filteredUpcomingBookings.length} {filteredUpcomingBookings.length === 1 ? 'upcoming booking' : 'upcoming bookings'}
              </Text>
            </View>
            <Badge style={[styles.sectionBadge, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
              <Text style={[styles.sectionBadgeText, { color: colors.primary, fontSize: fontSizes.badgeText }]}>{upcomingBookings.length}</Text>
            </Badge>
          </View>

          {/* Status Filter Tabs */}
          <View style={styles.statusFilterContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusTabsContent}>
              {statusTabs.map((tab) => (
                <TouchableOpacity
                  key={tab.value}
                  style={[styles.statusTab, { backgroundColor: colors.surface }, statusFilter === tab.value && { backgroundColor: colors.primary }]}
                  onPress={() => setStatusFilter(tab.value)}
                >
                  <Text style={[styles.statusTabText, { color: colors.textSecondary, fontSize: fontSizes.badgeText }, statusFilter === tab.value && { color: '#fff' }]}>{tab.label}</Text>
                  <View style={[styles.statusTabCount, { backgroundColor: colors.border }]}>
                    <Text style={[styles.statusTabCountText, { color: colors.textSecondary, fontSize: fontSizes.badgeText }]}>{tab.count}</Text>
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
            <Card style={[styles.emptyStateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Icon name="calendar" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyStateTitle, { color: colors.text, fontSize: fontSizes.emptyStateTitle }]}>No Upcoming Bookings</Text>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary, fontSize: fontSizes.emptyStateText }]}>You don't have any upcoming service bookings</Text>
              <Button style={[styles.emptyStateButton, { backgroundColor: colors.primary, borderColor: colors.primary }]} onPress={() => setServicesDialogOpen(true)}>
                <Text style={{ color: '#fff', fontSize: fontSizes.buttonText }}>Book a Service</Text>
              </Button>
            </Card>
          )}
        </View>

        {/* Past Bookings Section */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, styles.pastSectionHeader, { backgroundColor: colors.textSecondary + '15', borderLeftColor: colors.textSecondary }]}>
            <Icon name="history" size={24} color={colors.textSecondary} />
            <View style={styles.sectionHeaderContent}>
              <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSizes.sectionTitle }]}>Past Bookings</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textSecondary, fontSize: fontSizes.sectionSubtitle }]}>
                {filteredPastBookings.length} {filteredPastBookings.length === 1 ? 'past booking' : 'past bookings'}
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
              style={styles.bookingsList}
            />
          ) : (
            <Card style={[styles.emptyStateCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Icon name="clock" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyStateTitle, { color: colors.text, fontSize: fontSizes.emptyStateTitle }]}>No Past Bookings</Text>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary, fontSize: fontSizes.emptyStateText }]}>Your completed bookings will appear here</Text>
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Refresh Animation Overlay */}
      <RefreshAnimationOverlay />

      {/* Dialogs */}
      <ModifyBookingDialog open={modifyDialogOpen} onClose={() => setModifyDialogOpen(false)} booking={convertBookingForChildComponents(selectedBooking)} timeSlots={timeSlots} onSave={handleSaveModifiedBooking} customerId={customerId} refreshBookings={refreshBookings} setOpenSnackbar={setOpenSnackbar} />
      <ConfirmationDialog open={confirmationDialog.open} onClose={() => setConfirmationDialog(prev => ({ ...prev, open: false }))} onConfirm={handleConfirmAction} title={confirmationDialog.title} message={confirmationDialog.message} confirmText={confirmationDialog.type === 'cancel' ? 'Confirm' : 'Pay Now'} loading={actionLoading} severity={confirmationDialog.severity} />
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
          <Text style={[styles.snackbarText, { color: '#fff', fontSize: fontSizes.infoText }]}>{snackbarMessage}</Text>
          <TouchableOpacity onPress={() => setOpenSnackbar(false)}><Icon name="close" size={20} color="#fff" /></TouchableOpacity>
        </View>
      )}
    </View>
  );
});

// ---------- Styles ----------
const styles = StyleSheet.create({
  card: { borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2, marginBottom: 16, padding: 16 },
  button: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', borderWidth: 1, minHeight: 40 },
  disabledButton: { opacity: 0.6 },
  badgeBase: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', marginHorizontal: 4 },
  separatorBase: { height: 1, marginVertical: 16 },
  container: { flex: 1 },
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
  mainScrollView: { flex: 1 },
  scrollContentContainer: { flexGrow: 1, paddingBottom: 20 },
  section: { paddingHorizontal: 20, paddingTop: 0, paddingBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, padding: 16, borderRadius: 12, borderLeftWidth: 4 },
  pastSectionHeader: { borderLeftColor: 'rgba(156, 163, 175, 0.4)' },
  sectionHeaderContent: { flex: 1, marginLeft: 16 },
  sectionTitle: { fontWeight: '700' },
  sectionSubtitle: { marginTop: 4 },
  sectionBadge: { paddingHorizontal: 12, paddingVertical: 8 },
  pastBadge: { backgroundColor: 'rgba(156, 163, 175, 0.15)', borderColor: 'rgba(156, 163, 175, 0.4)' },
  sectionBadgeText: { fontWeight: '700' },
  statusFilterContainer: { marginBottom: 16 },
  statusTabsContent: { paddingRight: 16 },
  statusTab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10 },
  statusTabText: { fontWeight: '600', marginRight: 8 },
  statusTabCount: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2, minWidth: 24, alignItems: 'center' },
  statusTabCountText: { fontWeight: '600' },
  bookingsList: { marginTop: 0 },
  bookingCard: { marginBottom: 16, borderRadius: 12, overflow: 'hidden', borderWidth: 1 },
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
  cancelButton: { backgroundColor: '#fff', borderColor: '#ef4444' },
  cancelButtonText: { color: '#ef4444', marginLeft: 6, fontWeight: '600' },
  reviewButton: { backgroundColor: '#fff', borderColor: '#1e40af' },
  reviewButtonText: { color: '#1e40af', marginLeft: 6, fontWeight: '600' },
  reviewSubmittedButton: { backgroundColor: '#f0fdf4', borderColor: '#86efac' },
  reviewSubmittedText: { color: '#10b981', marginLeft: 6, fontWeight: '600' },
  bookAgainButton: { backgroundColor: '#fff', borderColor: '#3b82f6' },
  bookAgainText: { color: '#3b82f6', marginLeft: 6, fontWeight: '600' },
  viewDetailsIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  viewDetailsText: { marginRight: 4 },
  paymentActionContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, width: '100%', marginBottom: 8 },
  paymentButton: { backgroundColor: '#fff', borderColor: '#ef4444', flex: 1, minWidth: '45%' },
  paymentButtonText: { color: '#ef4444', marginLeft: 6, fontWeight: '600' },
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
  emptyStateCard: { alignItems: 'center', padding: 40, borderRadius: 12, borderWidth: 1 },
  emptyStateTitle: { fontWeight: '700', marginTop: 20 },
  emptyStateText: { marginTop: 8, textAlign: 'center', lineHeight: 24 },
  emptyStateButton: { marginTop: 24, paddingVertical: 16, paddingHorizontal: 32 },
  snackbar: { position: 'absolute', bottom: 20, left: 20, right: 20, padding: 16, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
  snackbarText: { fontWeight: '600', flex: 1 },
  separator: { height: 1, marginVertical: 12 },
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
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  refreshAnimationText: {
    marginTop: 16,
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
});

export default Booking;