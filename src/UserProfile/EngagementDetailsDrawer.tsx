/* eslint-disable */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView,
  Animated,
  TouchableWithoutFeedback,
  Modal,
  Image,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import dayjs from 'dayjs';
import LinearGradient from 'react-native-linear-gradient';
import Snackbar from 'react-native-snackbar';
import RazorpayCheckout from 'react-native-razorpay';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import your existing utilities and services
import PaymentInstance from '../services/paymentInstance';
import { useTheme } from '../../src/Settings/ThemeContext';
import Invoice from '../Invoice/Invoice';
import VacationManagementDialog from './VacationManagement';
import RaiseComplaintDialog from './RaiseComplaintDialog';
import { HOME_HERO_GRADIENT, HOME_M3 } from "../theme/brandColors";

const cookImage = require('../../assets/images/Cooknew.png');
const maidImage = require('../../assets/images/Maidnew.png');
const nannyImage = require('../../assets/images/Nannynew.png');
import {
  getPaymentTimeoutCancellationMessage,
  isPaymentTimeoutCancellation,
} from '../utils/bookingCancellation';

const { width, height } = Dimensions.get('window');

// ==================== Types ====================
interface EngagementDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onPaymentComplete?: () => void | Promise<void>;
  refreshBookings?: () => void | Promise<void>;
  customerId?: number | null;
  onBookAgain?: (booking: any) => void;
  onModify?: (booking: any) => void;
}

// ==================== Helper Components ====================
const Badge: React.FC<{ children: React.ReactNode; variant?: 'default' | 'outline'; style?: any }> = ({ 
  children, 
  variant = 'default', 
  style 
}) => {
  const { colors } = useTheme();
  return (
    <View style={[styles.badge, variant === 'outline' && styles.badgeOutline, style]}>
      <Text style={[styles.badgeText, variant === 'outline' && styles.badgeOutlineText]}>{children}</Text>
    </View>
  );
};

const Separator: React.FC<{ style?: any }> = ({ style }) => {
  const { colors } = useTheme();
  return <View style={[styles.separator, { backgroundColor: colors.border }, style]} />;
};

// ==================== Cancel Dialog Component ====================
const CancelDialog: React.FC<{
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  serviceName: string;
  isLoading: boolean;
}> = ({ visible, onClose, onConfirm, serviceName, isLoading }) => {
  const { colors, fontSize } = useTheme();
  
  const getFontSizes = () => {
    switch (fontSize) {
      case 'small': return { title: 20, message: 14, buttonText: 14 };
      case 'large': return { title: 24, message: 16, buttonText: 16 };
      default: return { title: 20, message: 14, buttonText: 14 };
    }
  };
  
  const fontSizes = getFontSizes();
  
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={cancelDialogStyles.overlay}>
        <View style={[cancelDialogStyles.dialogContainer, { backgroundColor: colors.card }]}>
          <View style={cancelDialogStyles.headerShell}>
            <LinearGradient
              colors={[...HOME_HERO_GRADIENT]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={cancelDialogStyles.headerContent}>
              <Icon name="alert-triangle" size={22} color="#FFFFFF" />
              <Text
                style={[
                  cancelDialogStyles.headerTitle,
                  { fontSize: fontSizes.title, lineHeight: fontSizes.title + 8 },
                ]}
              >
                Cancel Booking
              </Text>
            </View>
          </View>
          <View style={cancelDialogStyles.content}>
            <Text style={[cancelDialogStyles.message, { fontSize: fontSizes.message, color: colors.text }]}>
              Are you sure you want to cancel the {serviceName} service? This action cannot be undone.
            </Text>
            <View style={cancelDialogStyles.buttonContainer}>
              <TouchableOpacity
                style={[cancelDialogStyles.button, cancelDialogStyles.cancelButton, { borderColor: colors.border }]}
                onPress={onClose}
                disabled={isLoading}
              >
                <Text style={[cancelDialogStyles.buttonText, { fontSize: fontSizes.buttonText, color: colors.textSecondary }]}>
                  No, Keep It
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[cancelDialogStyles.button, cancelDialogStyles.confirmButton, { backgroundColor: colors.error }]}
                onPress={onConfirm}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={[cancelDialogStyles.buttonText, { fontSize: fontSizes.buttonText, color: '#FFFFFF' }]}>
                    Yes, Cancel Booking
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// ==================== Helper Functions ====================
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

const formatDate = (dateString: string) => dayjs(dateString).format('MMMM D, YYYY');

const hasVacation = (booking: any): boolean => {
  return booking.hasVacation || (booking.vacationDetails && (booking.vacationDetails.total_days || 0) > 0) || false;
};

const isModificationTimeAllowed = (startEpoch: any): boolean => {
  if (!startEpoch) return false;
  const now = dayjs().unix();
  const cutoff = startEpoch - 30 * 60;
  return now < cutoff;
};

const isBookingAlreadyModified = (booking: any | null): boolean => {
  if (!booking) return false;
  return !!(booking.modifications?.some((mod: any) =>
    mod.action === "Date Rescheduled" ||
    mod.action === "Time Rescheduled" ||
    mod.action === "Modified" ||
    mod.action?.includes("Reschedule")
  ));
};

const isModificationDisabled = (booking: any | null): boolean => {
  if (!booking) return true;
  return !isModificationTimeAllowed(booking.start_epoch) || isBookingAlreadyModified(booking);
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

const getServiceImage = (type: string) => {
  switch (type) {
    case 'cook': return cookImage;
    case 'maid': return maidImage;
    case 'nanny': return nannyImage;
    default: return cookImage;
  }
};

const getProviderInitials = (name: string) => {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
  }
  return String(name || 'SP').slice(0, 2).toUpperCase();
};

const formatPaymentMode = (mode?: string) => {
  if (!mode) return '—';
  return mode
    .split(/[+,_]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' + ');
};

const getModificationBadgeStyle = (action: string) => {
  const normalized = String(action || '').toLowerCase();
  if (normalized.includes('vacation applied')) {
    return { backgroundColor: '#fef3c7', color: '#92400e', borderColor: '#fcd34d' };
  }
  if (normalized.includes('vacation cancelled') || normalized.includes('vacation canceled')) {
    return { backgroundColor: '#f1f5f9', color: '#475569', borderColor: '#cbd5e1' };
  }
  if (normalized.includes('reschedule') || normalized.includes('modified')) {
    return { backgroundColor: '#dbeafe', color: '#1d4ed8', borderColor: '#93c5fd' };
  }
  return { backgroundColor: '#fff7ed', color: '#c2410c', borderColor: '#fdba74' };
};

// ==================== Main Component - Custom Dialog without Modal ====================
const EngagementDetailsDrawer: React.FC<EngagementDetailsDrawerProps> = ({ 
  isOpen, 
  onClose, 
  booking, 
  onPaymentComplete,
  refreshBookings,
  customerId,
  onBookAgain,
  onModify,
}) => {
  const { colors, fontSize } = useTheme();
  const insets = useSafeAreaInsets();
  const [isProcessingPayment, setIsProcessingPayment] = React.useState(false);
  const [isCallLoading, setIsCallLoading] = React.useState(false);
  const [isCancelLoading, setIsCancelLoading] = React.useState(false);
  const [showCancelDialog, setShowCancelDialog] = React.useState(false);
  const [complaintDialogVisible, setComplaintDialogVisible] = React.useState(false);
  
  // Animation values
  const slideAnim = React.useRef(new Animated.Value(height)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  
  // Create a ref for the ScrollView
  const scrollViewRef = React.useRef<ScrollView>(null);
  
  // Vacation states
  const [vacationManagementDialogOpen, setVacationManagementDialogOpen] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Extension states
  const [showExtendDialog, setShowExtendDialog] = React.useState(false);
  const [extensionAvailability, setExtensionAvailability] = React.useState<any>(null);
  const [loadingAvailability, setLoadingAvailability] = React.useState(false);
  const [selectedExtension, setSelectedExtension] = React.useState<any>(null);
  const [isExtending, setIsExtending] = React.useState(false);

  // Reset drawer scroll position when opened or when a different booking is shown
  React.useEffect(() => {
    if (!isOpen) return;
    const frame = requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    });
    return () => cancelAnimationFrame(frame);
  }, [isOpen, booking?.id]);

  // Handle animation when isOpen changes
  React.useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  const getFontSizes = () => {
    switch (fontSize) {
      case 'small':
        return { 
          headerTitle: 18, bookingIdText: 16, serviceTitle: 18, sectionTitle: 15, 
          scheduleValue: 13, providerName: 15, paymentValue: 13, paymentTotalValue: 16, 
          actionButtonText: 13, badgeText: 11, additionalInfoValue: 11, labelText: 11 
        };
      case 'large':
        return { 
          headerTitle: 24, bookingIdText: 20, serviceTitle: 22, sectionTitle: 18, 
          scheduleValue: 16, providerName: 18, paymentValue: 16, paymentTotalValue: 20, 
          actionButtonText: 16, badgeText: 14, additionalInfoValue: 14, labelText: 14 
        };
      default:
        return { 
          headerTitle: 20, bookingIdText: 18, serviceTitle: 20, sectionTitle: 16, 
          scheduleValue: 14, providerName: 16, paymentValue: 14, paymentTotalValue: 18, 
          actionButtonText: 14, badgeText: 12, additionalInfoValue: 12, labelText: 12 
        };
    }
  };
  
  const fontSizes = getFontSizes();

  if (!booking || !booking.id) return null;
  
  // Ensure critical booking properties have safe defaults
  const safeBooking = {
    ...booking,
    id: booking.id || 0,
    service_type: booking.service_type || booking.serviceType || 'other',
    bookingType: booking.bookingType || 'ON_DEMAND',
    taskStatus: booking.taskStatus || 'NOT_STARTED',
    serviceProviderName: booking.serviceProviderName || 'Not Assigned',
    start_time: booking.start_time || '',
    end_time: booking.end_time || '',
    startDate: booking.startDate || booking.date || '',
    providerRating: booking.providerRating || 0,
  };

  const getBookingTypeBadge = (type: string) => {
    switch (type) {
      case 'ON_DEMAND':
        return (
          <View style={[styles.pillBadge, styles.onDemandPill]}>
            <Text style={[styles.pillBadgeText, styles.onDemandPillText]}>On Demand</Text>
          </View>
        );
      case 'MONTHLY':
        return (
          <View style={[styles.pillBadge, styles.monthlyPill]}>
            <Text style={[styles.pillBadgeText, styles.monthlyPillText]}>Monthly</Text>
          </View>
        );
      case 'SHORT_TERM':
        return (
          <View style={[styles.pillBadge, styles.shortTermPill]}>
            <Text style={[styles.pillBadgeText, styles.shortTermPillText]}>Short Term</Text>
          </View>
        );
      default:
        return (
          <View style={[styles.pillBadge, styles.defaultPill]}>
            <Text style={[styles.pillBadgeText, styles.defaultPillText]}>{type}</Text>
          </View>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    const label =
      status === 'NOT_STARTED'
        ? 'Not Started'
        : status === 'IN_PROGRESS'
          ? 'In Progress'
          : status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, ' ');

    let pillStyle = styles.notStartedPill;
    let textStyle = styles.notStartedPillText;
    let iconColor = '#64748b';

    if (status === 'COMPLETED') {
      pillStyle = styles.completedPill;
      textStyle = styles.completedPillText;
      iconColor = '#15803d';
    } else if (status === 'CANCELLED') {
      pillStyle = styles.cancelledPill;
      textStyle = styles.cancelledPillText;
      iconColor = '#dc2626';
    } else if (status === 'IN_PROGRESS') {
      pillStyle = styles.inProgressPill;
      textStyle = styles.inProgressPillText;
      iconColor = '#c2410c';
    }

    return (
      <View style={[styles.pillBadge, pillStyle]}>
        <Icon
          name={
            status === 'COMPLETED'
              ? 'check-circle'
              : status === 'CANCELLED'
                ? 'x-circle'
                : 'clock'
          }
          size={12}
          color={iconColor}
        />
        <Text style={[styles.pillBadgeText, textStyle]}>{label}</Text>
      </View>
    );
  };

  // ==================== EXTENSION HANDLERS ====================
  
  const canShowExtendButton = () => {
    return (
      safeBooking.bookingType === 'ON_DEMAND' &&
      safeBooking.serviceProviderId &&
      ['NOT_STARTED', 'IN_PROGRESS'].includes(safeBooking.taskStatus) &&
      isProviderAssigned()
    );
  };

  const handleExtendClick = async () => {
    setShowExtendDialog(true);
    await checkExtensionAvailability();
  };

  const checkExtensionAvailability = async () => {
    try {
      setLoadingAvailability(true);
      const response = await PaymentInstance.get(
        `/api/v2/engagements/${booking.id}/extension-availability`
      );
      setExtensionAvailability(response.data);
      
      if (!response.data.canExtend) {
        Alert.alert(
          'Cannot Extend',
          response.data.reason || 'Booking cannot be extended at this time',
          [{ text: 'OK', onPress: () => setShowExtendDialog(false) }]
        );
      }
    } catch (error: any) {
      console.error('Error checking availability:', error);
      Alert.alert(
        'Error',
        'Unable to check extension availability. Please try again.',
        [{ text: 'OK', onPress: () => setShowExtendDialog(false) }]
      );
    } finally {
      setLoadingAvailability(false);
    }
  };

  const handleExtendBooking = async () => {
    if (!selectedExtension) {
      Alert.alert('Error', 'Please select an extension option');
      return;
    }

    Alert.alert(
      'Confirm Extension',
      `Extend booking by ${selectedExtension.hours} hour${selectedExtension.hours > 1 ? 's' : ''} for ₹${selectedExtension.additionalCost}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setIsExtending(true);
              const response = await PaymentInstance.post(
                `/api/v2/engagements/${booking.id}/extend`,
                {
                  extensionHours: selectedExtension.hours,
                  newEndTime: selectedExtension.newEndTime,
                  additionalAmount: selectedExtension.additionalCost,
                  paymentMode: 'CASH' // Can be updated to support other payment modes
                }
              );

              Snackbar.show({
                text: response.data.message || 'Booking extended successfully',
                duration: Snackbar.LENGTH_LONG,
                backgroundColor: colors.success,
                textColor: '#FFFFFF',
              });

              setShowExtendDialog(false);
              setSelectedExtension(null);
              
              if (refreshBookings) await refreshBookings();
              setTimeout(() => onClose(), 500);
            } catch (error: any) {
              const message = error?.response?.data?.error || 'Failed to extend booking';
              Alert.alert('Error', message);
            } finally {
              setIsExtending(false);
            }
          }
        }
      ]
    );
  };

  const isProviderAssigned = () => {
    const notAssignedString = 'Not Assigned';
    return !!(
      safeBooking.serviceProviderName &&
      safeBooking.serviceProviderName !== notAssignedString &&
      safeBooking.serviceProviderName.trim() !== '' &&
      safeBooking.serviceProviderName !== 'Not Assigned'
    );
  };

  const handleCompletePayment = async () => {
    const engagementId = booking.payment?.engagement_id ?? booking.id;
    if (!engagementId) {
      Alert.alert('Error', 'Unable to resume payment');
      return;
    }

    try {
      setIsProcessingPayment(true);
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
        amountPaise = Math.round(Number(amount_inr) * 100);
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
        name: 'Serveaso',
        description: 'Complete your payment',
        prefill: {
          name: customer?.firstname || booking.customerName,
          contact: customer?.contact || customer?.mobile || '9999999999',
          email: customer?.email || '',
        },
        theme: { color: colors.primary },
      };

      RazorpayCheckout.open(options)
        .then(async (data: any) => {
          try {
            await PaymentInstance.post('/api/v2/createEngagements/verify', {
              engagementId: resolvedEngagementId,
              razorpay_order_id: data.razorpay_order_id,
              razorpay_payment_id: data.razorpay_payment_id,
              razorpay_signature: data.razorpay_signature,
            });
            if (onPaymentComplete) {
              await onPaymentComplete();
            } else if (refreshBookings) {
              await refreshBookings();
            }
            onClose();
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
      const msg = err?.response?.data?.error || 'Unable to resume payment';
      Alert.alert('Error', msg);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCallProvider = () => {
    setIsCallLoading(true);
    setTimeout(() => {
      setIsCallLoading(false);
      Alert.alert('Call', `Calling ${safeBooking.serviceProviderName || 'service provider'}...`);
    }, 500);
  };

  const handleCancelBooking = () => setShowCancelDialog(true);
  
  const confirmCancelBooking = async () => {
    setIsCancelLoading(true);
    try {
      await PaymentInstance.post(`/api/v2/engagements/${booking.id}/cancel`, {});
      setShowCancelDialog(false);
      Snackbar.show({
        text: `${getServiceTitle(safeBooking.service_type)} service cancelled successfully`,
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: colors.success,
        textColor: '#FFFFFF',
      });
      if (onPaymentComplete) onPaymentComplete();
      if (refreshBookings) refreshBookings();
      setTimeout(() => onClose(), 500);
    } catch (error: any) {
      Snackbar.show({
        text:
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          'Failed to cancel booking. Please try again.',
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: colors.error,
        textColor: '#FFFFFF',
      });
    } finally {
      setIsCancelLoading(false);
    }
  };

  // Vacation Handlers
  const openVacationDialog = () => {
    setVacationManagementDialogOpen(true);
  };

  const handleAddVacation = () => {
    openVacationDialog();
  };

  const handleModifyVacation = () => {
    openVacationDialog();
  };

  const handleVacationSuccess = async (message = 'Vacation updated successfully') => {
    Snackbar.show({
      text: message,
      duration: Snackbar.LENGTH_SHORT,
      backgroundColor: colors.success,
      textColor: '#FFFFFF',
    });
    if (refreshBookings) await refreshBookings();
    setVacationManagementDialogOpen(false);
  };

  // Report Issue Handler
  const handleReportIssueClick = () => {
    console.log('🟡 Report Issue clicked from EngagementDetailsDrawer for booking:', booking.id);
    setComplaintDialogVisible(true);
  };

  const handleModifyClick = () => {
    if (onModify) {
      onModify(booking);
      return;
    }
    onClose();
    setTimeout(() => {
      Alert.alert('Modify Booking', 'Please use the modify button from the main booking screen');
    }, 500);
  };

  const isEngagementCancelled = () => {
    const life = String((safeBooking as any)?.engagement_status ?? '').toUpperCase();
    return life === 'CANCELLED' || safeBooking.taskStatus === 'CANCELLED';
  };

  const isCancellable = () => !['COMPLETED', 'CANCELLED'].includes(safeBooking.taskStatus) && !isEngagementCancelled();
  const hasExistingVacation = hasVacation(booking);
  const modificationDisabled = isModificationDisabled(booking);
  const isPaymentPending = booking.payment && booking.payment.status === "PENDING";
  const canShowPaymentButton = isPaymentPending && safeBooking.taskStatus !== 'CANCELLED';
  
  const shouldShowModifyButton = safeBooking.bookingType === "MONTHLY" && safeBooking.taskStatus === 'NOT_STARTED';
  const shouldShowVacationButton = safeBooking.bookingType === "MONTHLY" && safeBooking.taskStatus !== 'CANCELLED' && safeBooking.taskStatus !== 'COMPLETED';
  const canBookAgain =
    Boolean(onBookAgain) &&
    (safeBooking.taskStatus === 'COMPLETED' || safeBooking.taskStatus === 'CANCELLED');
  const showPaymentTimeoutNotice = isPaymentTimeoutCancellation(booking);

  const convertBookingForChildComponents = (bookingData: any): any => {
    if (!bookingData) return null;
    const vacationDetails = bookingData.vacationDetails
      ? {
          ...bookingData.vacationDetails,
          leave_start_date:
            bookingData.vacationDetails.leave_start_date ||
            bookingData.vacationDetails.start_date,
          leave_end_date:
            bookingData.vacationDetails.leave_end_date ||
            bookingData.vacationDetails.end_date,
        }
      : null;
    const vacation =
      bookingData.vacation?.start_date && bookingData.vacation?.end_date
        ? bookingData.vacation
        : vacationDetails
          ? {
              start_date: vacationDetails.start_date || vacationDetails.leave_start_date,
              end_date: vacationDetails.end_date || vacationDetails.leave_end_date,
              leave_days: vacationDetails.total_days ?? bookingData.leave_days,
            }
          : undefined;
    return {
      ...bookingData,
      serviceType: bookingData.serviceType || bookingData.service_type,
      vacation,
      vacationDetails,
    };
  };

  // Don't render if not open
  if (!isOpen) return null;

  // ==================== Render Custom Dialog ====================
  return (
    <>
      {/* Overlay and Drawer */}
      <Animated.View 
        style={[
          styles.overlay, 
          { 
            opacity: fadeAnim,
            backgroundColor: 'rgba(0,0,0,0.5)',
          }
        ]}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlayTouchable} />
        </TouchableWithoutFeedback>
      </Animated.View>
      
      <Animated.View 
        style={[
          styles.drawerContainer,
          {
            transform: [{ translateY: slideAnim }],
            backgroundColor: HOME_M3.surface,
          }
        ]}
      >
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

        <View
          style={[
            styles.headerShell,
            {
              height: Platform.OS === 'ios' ? 60 : Math.max(insets.top, 8) + 30,
            },
          ]}
        >
          <LinearGradient
            colors={[...HOME_HERO_GRADIENT]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.headerToolbar}>
            <TouchableOpacity onPress={onClose} style={styles.headerSideBtn} hitSlop={10}>
              <Icon name="arrow-left" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <Text
              style={[
                styles.headerTitleCenter,
                { fontSize: fontSizes.headerTitle - 1 },
                Platform.OS === 'android' ? { includeFontPadding: false } : null,
              ]}
              numberOfLines={1}
            >
              Booking Details
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.headerSideBtn} hitSlop={10}>
              <Icon name="x" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          bounces={true}
          overScrollMode="always"
          nestedScrollEnabled={true}
        >
          <View style={styles.heroSheet}>
            <View style={styles.rowBetween}>
              <View>
                <Text style={[styles.metaLabel, { fontSize: fontSizes.labelText }]}>Booking ID</Text>
                <Text style={[styles.bookingIdHero, { fontSize: fontSizes.bookingIdText + 6 }]}>#{safeBooking.id}</Text>
              </View>
              <View style={styles.statusStack}>
                {getBookingTypeBadge(safeBooking.bookingType)}
                {getStatusBadge(safeBooking.taskStatus)}
              </View>
            </View>

            <View style={styles.serviceCard}>
              <View style={styles.serviceImageWrap}>
                <Image
                  source={getServiceImage(safeBooking.service_type)}
                  style={styles.serviceImage}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.serviceTextCol}>
                <Text style={[styles.metaLabel, { fontSize: fontSizes.labelText }]}>Service Type</Text>
                <Text style={[styles.serviceTitle, { fontSize: fontSizes.serviceTitle }]}>
                  {getServiceTitle(safeBooking.service_type)}
                </Text>
              </View>
            </View>

            {showPaymentTimeoutNotice ? (
              <View style={styles.paymentTimeoutNotice}>
                <View style={styles.paymentTimeoutIconWrap}>
                  <Icon name="alert-circle" size={18} color="#b45309" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentTimeoutTitle}>Booking cancelled — payment not received</Text>
                  <Text style={styles.paymentTimeoutBody}>
                    {getPaymentTimeoutCancellationMessage(booking)}
                  </Text>
                </View>
              </View>
            ) : null}

            {canBookAgain ? (
              <TouchableOpacity
                style={[styles.secondaryFullButton, { borderColor: colors.info, marginBottom: 12 }]}
                onPress={() => onBookAgain?.(booking)}
              >
                <Icon name="calendar" size={18} color={colors.info} />
                <Text style={[styles.secondaryFullButtonText, { color: colors.info, fontSize: fontSizes.actionButtonText }]}>
                  Book Again
                </Text>
              </TouchableOpacity>
            ) : null}

            {!canShowPaymentButton ? (
              <>
                {/* Extend Service Hour Button */}
                {canShowExtendButton() && (
                  <TouchableOpacity
                    style={[styles.secondaryFullButton, { borderColor: colors.accent, marginBottom: 12 }]}
                    onPress={handleExtendClick}
                  >
                    <Icon name="clock" size={18} color={colors.accent} />
                    <Text style={[styles.secondaryFullButtonText, { color: colors.accent, fontSize: fontSizes.actionButtonText }]}>
                      Extend Service Hour
                    </Text>
                  </TouchableOpacity>
                )}

                <View style={styles.primaryActionRow}>
                  <TouchableOpacity
                    style={[styles.callButton, styles.primaryActionBtn]}
                    onPress={handleCallProvider}
                    disabled={isCallLoading}
                  >
                    {isCallLoading ? (
                      <ActivityIndicator size="small" color={HOME_M3.secondary} />
                    ) : (
                      <>
                        <Icon name="phone" size={16} color={HOME_M3.secondary} />
                        <Text style={[styles.callButtonText, { fontSize: fontSizes.actionButtonText }]}>Call</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {isCancellable() ? (
                    <TouchableOpacity
                      style={[styles.outlineActionBtn, styles.cancelOutlineBtn]}
                      onPress={handleCancelBooking}
                      disabled={isCancelLoading}
                    >
                      {isCancelLoading ? (
                        <ActivityIndicator size="small" color="#dc2626" />
                      ) : (
                        <>
                          <Icon name="x-circle" size={16} color="#dc2626" />
                          <Text style={[styles.cancelOutlineText, { fontSize: fontSizes.actionButtonText }]}>Cancel</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : null}

                  {shouldShowModifyButton ? (
                    <TouchableOpacity
                      style={[
                        styles.outlineActionBtn,
                        styles.modifyOutlineBtn,
                        modificationDisabled && styles.disabledActionBtn,
                      ]}
                      onPress={handleModifyClick}
                      disabled={modificationDisabled}
                    >
                      <Icon
                        name="edit-2"
                        size={16}
                        color={modificationDisabled ? '#94a3b8' : HOME_M3.onSurface}
                      />
                      <Text
                        style={[
                          styles.modifyOutlineText,
                          { fontSize: fontSizes.actionButtonText },
                          modificationDisabled && styles.disabledActionText,
                        ]}
                      >
                        Modify
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {shouldShowVacationButton ? (
                  <TouchableOpacity
                    style={styles.vacationButton}
                    onPress={hasExistingVacation ? handleModifyVacation : handleAddVacation}
                    disabled={isRefreshing}
                  >
                    <Icon name="calendar" size={16} color={HOME_M3.secondary} />
                    <Text style={[styles.vacationButtonText, { fontSize: fontSizes.actionButtonText }]}>
                      {hasExistingVacation ? 'Modify Vacation' : 'Add Vacation'}
                    </Text>
                  </TouchableOpacity>
                ) : null}

                {/* Report Issue Button - Show for all bookings */}
                <TouchableOpacity
                  style={styles.reportIssueButton}
                  onPress={handleReportIssueClick}
                >
                  <Icon name="alert-triangle" size={16} color="#dc2626" />
                  <Text style={[styles.reportIssueButtonText, { fontSize: fontSizes.actionButtonText }]}>
                    Report Issue
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.primaryActionRow}>
                <TouchableOpacity
                  style={[styles.outlineActionBtn, styles.cancelOutlineBtn, { flex: 1 }]}
                  onPress={handleCompletePayment}
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <ActivityIndicator size="small" color="#dc2626" />
                  ) : (
                    <>
                      <Icon name="credit-card" size={16} color="#dc2626" />
                      <Text style={[styles.cancelOutlineText, { fontSize: fontSizes.actionButtonText }]}>
                        Complete Payment
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {isCancellable() ? (
                  <TouchableOpacity
                    style={[styles.outlineActionBtn, styles.cancelOutlineBtn, { flex: 1 }]}
                    onPress={handleCancelBooking}
                    disabled={isCancelLoading}
                  >
                    {isCancelLoading ? (
                      <ActivityIndicator size="small" color="#dc2626" />
                    ) : (
                      <>
                        <Icon name="x-circle" size={16} color="#dc2626" />
                        <Text style={[styles.cancelOutlineText, { fontSize: fontSizes.actionButtonText }]}>Cancel</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
          </View>

          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <Icon name="calendar" size={18} color={HOME_M3.secondary} />
              <Text style={[styles.sectionTitle, { fontSize: fontSizes.sectionTitle }]}>Schedule</Text>
            </View>
            <View style={styles.sectionCard}>
              <View style={styles.grid2}>
                <View style={styles.infoCell}>
                  <Text style={[styles.metaLabel, { fontSize: fontSizes.labelText }]}>Start Date</Text>
                  <Text style={[styles.valueText, { fontSize: fontSizes.scheduleValue }]}>{formatDate(booking.startDate)}</Text>
                </View>
                <View style={styles.infoCell}>
                  <Text style={[styles.metaLabel, { fontSize: fontSizes.labelText }]}>End Date</Text>
                  <Text style={[styles.valueText, { fontSize: fontSizes.scheduleValue }]}>{formatDate(booking.endDate)}</Text>
                </View>
              </View>
              <View style={styles.timeSlotRow}>
                <Text style={[styles.metaLabel, { fontSize: fontSizes.labelText }]}>Time Slot</Text>
                <View style={styles.rowGap8}>
                  <Icon name="clock" size={15} color={HOME_M3.onSurfaceVariant} />
                  <Text style={[styles.valueText, { fontSize: fontSizes.scheduleValue }]}>
                    {formatTimeToAMPM(booking.start_time)} – {formatTimeToAMPM(booking.end_time)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {isProviderAssigned() ? (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <Icon name="user" size={18} color={HOME_M3.secondary} />
                <Text style={[styles.sectionTitle, { fontSize: fontSizes.sectionTitle }]}>Service Provider</Text>
              </View>
              <View style={[styles.sectionCard, styles.providerRow]}>
                <View style={styles.providerAvatar}>
                  <Text style={styles.providerAvatarText}>
                    {getProviderInitials(safeBooking.serviceProviderName)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.providerName, { fontSize: fontSizes.providerName }]}>
                    {safeBooking.serviceProviderName}
                  </Text>
                  {safeBooking.providerRating > 0 ? (
                    <Text style={styles.providerRatingText}>⭐ {booking.providerRating.toFixed(1)}</Text>
                  ) : null}
                </View>
              </View>
            </View>
          ) : null}

          {booking.payment ? (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <Icon name="credit-card" size={18} color={HOME_M3.secondary} />
                <Text style={[styles.sectionTitle, { fontSize: fontSizes.sectionTitle }]}>Payment Details</Text>
              </View>
              <View style={styles.sectionCard}>
                <View style={styles.paymentLine}>
                  <Text style={[styles.metaLabel, { fontSize: fontSizes.labelText }]}>Base Amount</Text>
                  <Text style={[styles.paymentAmount, { fontSize: fontSizes.paymentValue }]}>₹{booking.payment.base_amount}</Text>
                </View>
                <View style={styles.paymentLine}>
                  <Text style={[styles.metaLabel, { fontSize: fontSizes.labelText }]}>Platform Fee</Text>
                  <Text style={[styles.paymentAmount, { fontSize: fontSizes.paymentValue }]}>₹{booking.payment.platform_fee}</Text>
                </View>
                <View style={styles.paymentLine}>
                  <Text style={[styles.metaLabel, { fontSize: fontSizes.labelText }]}>GST</Text>
                  <Text style={[styles.paymentAmount, { fontSize: fontSizes.paymentValue }]}>₹{booking.payment.gst}</Text>
                </View>

                <View style={styles.paymentTotalBar}>
                  <Text style={[styles.paymentTotalLabel, { fontSize: fontSizes.sectionTitle }]}>Total</Text>
                  <Text style={[styles.paymentTotalValue, { fontSize: fontSizes.paymentTotalValue + 2 }]}>
                    ₹{booking.payment.total_amount}
                  </Text>
                </View>

                <View style={styles.paymentMetaRow}>
                  <Text style={[styles.paymentMetaText, { fontSize: fontSizes.labelText }]}>
                    Status:{' '}
                    <Text
                      style={[
                        styles.paymentMetaStrong,
                        {
                          color:
                            booking.payment.status === 'SUCCESS'
                              ? '#16a34a'
                              : booking.payment.status === 'PENDING'
                                ? '#d97706'
                                : '#dc2626',
                        },
                      ]}
                    >
                      {booking.payment.status}
                    </Text>
                  </Text>
                  <Text style={[styles.paymentMetaText, { fontSize: fontSizes.labelText }]}>
                    Payment Mode:{' '}
                    <Text style={styles.paymentMetaStrong}>
                      {formatPaymentMode(booking.payment.payment_mode)}
                    </Text>
                  </Text>
                </View>

                {booking.payment.transaction_id ? (
                  <View style={styles.paymentLine}>
                    <Text style={[styles.metaLabel, { fontSize: fontSizes.labelText }]}>Transaction ID</Text>
                    <Text style={[styles.paymentAmount, { fontSize: fontSizes.paymentValue }]}>
                      {booking.payment.transaction_id}
                    </Text>
                  </View>
                ) : null}

                {booking.payment.status === 'PENDING' && booking.taskStatus !== 'CANCELLED' ? (
                  <TouchableOpacity
                    style={[styles.secondaryFullButton, styles.cancelOutlineBtn, { marginTop: 12 }]}
                    onPress={handleCompletePayment}
                    disabled={isProcessingPayment}
                  >
                    {isProcessingPayment ? (
                      <ActivityIndicator size="small" color="#dc2626" />
                    ) : (
                      <>
                        <Icon name="credit-card" size={18} color="#dc2626" />
                        <Text style={[styles.cancelOutlineText, { fontSize: fontSizes.actionButtonText }]}>
                          Complete Payment Now
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : null}

                {booking.payment.status === 'SUCCESS' ? (
                  <View style={styles.invoiceWrap}>
                    <Invoice booking={booking} variant="inline" />
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}

          {booking.modifications?.length > 0 ? (
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <Icon name="rotate-ccw" size={18} color={HOME_M3.secondary} />
                <Text style={[styles.sectionTitle, { fontSize: fontSizes.sectionTitle }]}>Modification History</Text>
              </View>
              <View style={styles.modificationPanel}>
                {booking.modifications.map((mod: any, index: number) => {
                  const badgeStyle = getModificationBadgeStyle(mod.action);
                  return (
                    <View
                      key={index}
                      style={[
                        styles.modificationCard,
                        index < booking.modifications.length - 1 && styles.modificationCardSpacing,
                      ]}
                    >
                      <View style={styles.modificationTopRow}>
                        <View style={[styles.modificationBadge, { backgroundColor: badgeStyle.backgroundColor, borderColor: badgeStyle.borderColor }]}>
                          <Text style={[styles.modificationBadgeText, { color: badgeStyle.color }]}>{mod.action}</Text>
                        </View>
                        <Text style={[styles.modificationDate, { fontSize: fontSizes.labelText }]}>
                          {dayjs(mod.date).format('MMM D, YYYY h:mm A')}
                        </Text>
                      </View>
                      {mod.refund ? (
                        <Text style={[styles.refundText, { fontSize: fontSizes.labelText }]}>Refund: ₹{mod.refund}</Text>
                      ) : null}
                      {mod.penalty ? (
                        <Text style={[styles.penaltyText, { fontSize: fontSizes.labelText }]}>Penalty: ₹{mod.penalty}</Text>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            </View>
          ) : null}

          <View style={styles.footerMeta}>
            <View style={styles.footerMetaCol}>
              <Text style={[styles.metaLabel, { fontSize: fontSizes.labelText }]}>Booking Date</Text>
              <Text style={[styles.footerMetaValue, { fontSize: fontSizes.additionalInfoValue }]}>
                {dayjs(booking.bookingDate).format('MMM D, YYYY')}
              </Text>
            </View>
            <View style={styles.footerMetaCol}>
              <Text style={[styles.metaLabel, { fontSize: fontSizes.labelText }]}>Assignment Status</Text>
              <Text style={[styles.footerMetaValue, { fontSize: fontSizes.additionalInfoValue, textTransform: 'capitalize' }]}>
                {booking.assignmentStatus || '—'}
              </Text>
            </View>
            {booking.leave_days > 0 ? (
              <View style={styles.footerMetaCol}>
                <Text style={[styles.metaLabel, { fontSize: fontSizes.labelText }]}>Leave Days</Text>
                <Text style={[styles.footerMetaValue, { fontSize: fontSizes.additionalInfoValue }]}>
                  {booking.leave_days}
                </Text>
              </View>
            ) : null}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>

      {vacationManagementDialogOpen ? (
        <VacationManagementDialog
          open={vacationManagementDialogOpen}
          onClose={() => setVacationManagementDialogOpen(false)}
          booking={convertBookingForChildComponents(booking)}
          customerId={customerId ?? null}
          onSuccess={handleVacationSuccess}
        />
      ) : null}

      {/* Report Issue Dialog */}
      <RaiseComplaintDialog
        visible={complaintDialogVisible}
        onClose={() => setComplaintDialogVisible(false)}
        booking={booking}
        onSubmitted={() => {
          setComplaintDialogVisible(false);
          Snackbar.show({
            text: 'Complaint submitted successfully',
            duration: Snackbar.LENGTH_SHORT,
            backgroundColor: colors.success,
            textColor: '#FFFFFF',
          });
        }}
      />

      {/* Cancel Dialog */}
      {showCancelDialog && (
        <CancelDialog
          visible={showCancelDialog}
          onClose={() => setShowCancelDialog(false)}
          onConfirm={confirmCancelBooking}
          serviceName={getServiceTitle(safeBooking.service_type)}
          isLoading={isCancelLoading}
        />
      )}

      {/* Extend Service Hour Dialog */}
      <Modal
        visible={showExtendDialog}
        transparent
        animationType="fade"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={() => setShowExtendDialog(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.extendDialogContainer, { backgroundColor: colors.card }]}>
            <View style={styles.extendDialogHeader}>
              <LinearGradient
                colors={[...HOME_HERO_GRADIENT]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.extendHeaderContent}>
                <Icon name="clock" size={22} color="#FFFFFF" />
                <Text style={[styles.extendDialogTitle, { fontSize: fontSizes.serviceTitle }]}>
                  Extend Service Hour
                </Text>
              </View>
              <TouchableOpacity
                style={styles.extendCloseButton}
                onPress={() => setShowExtendDialog(false)}
              >
                <Icon name="x" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.extendDialogContent}>
              {loadingAvailability ? (
                <View style={styles.extendLoadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[styles.extendLoadingText, { color: colors.text }]}>
                    Checking provider availability...
                  </Text>
                </View>
              ) : extensionAvailability && extensionAvailability.canExtend ? (
                <>
                  <View style={[styles.extendInfoBox, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.extendInfoLabel, { color: colors.textSecondary }]}>
                      Current End Time
                    </Text>
                    <Text style={[styles.extendInfoValue, { color: colors.text }]}>
                      {extensionAvailability.currentEndTimeFormatted}
                    </Text>
                    <Text style={[styles.extendInfoLabel, { color: colors.textSecondary, marginTop: 8 }]}>
                      Hourly Rate
                    </Text>
                    <Text style={[styles.extendInfoValue, { color: colors.accent }]}>
                      {`₹${extensionAvailability.hourlyRate}/hour`}
                    </Text>
                  </View>

                  <Text style={[styles.extendSectionTitle, { color: colors.text }]}>
                    Select Extension Duration
                  </Text>

                  {extensionAvailability.availableSlots?.map((slot: any, index: number) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.extendOptionCard,
                        { 
                          backgroundColor: selectedExtension?.hours === slot.hours 
                            ? colors.primary + '15' 
                            : colors.surface,
                          borderColor: selectedExtension?.hours === slot.hours 
                            ? colors.primary 
                            : colors.border,
                        }
                      ]}
                      onPress={() => setSelectedExtension(slot)}
                    >
                      <View style={styles.extendOptionLeft}>
                        <View style={[
                          styles.extendRadio,
                          { borderColor: selectedExtension?.hours === slot.hours ? colors.primary : colors.border }
                        ]}>
                          {selectedExtension?.hours === slot.hours && (
                            <View style={[styles.extendRadioInner, { backgroundColor: colors.primary }]} />
                          )}
                        </View>
                        <View>
                          <Text style={[styles.extendOptionHours, { color: colors.text }]}>
                            {`+${slot.hours} hour${slot.hours > 1 ? 's' : ''}`}
                          </Text>
                          <Text style={[styles.extendOptionTime, { color: colors.textSecondary }]}>
                            {`Until ${slot.newEndTimeFormatted}`}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.extendOptionRight}>
                        <Text style={[styles.extendOptionPrice, { color: colors.accent }]}>
                          {`+₹${slot.additionalCost}`}
                        </Text>
                        <Text style={[styles.extendOptionTotal, { color: colors.textSecondary }]}>
                          {`Total: ₹${slot.totalCost}`}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}

                  {selectedExtension && (
                    <View style={[styles.extendSummaryBox, { backgroundColor: colors.accent + '10', borderColor: colors.accent }]}>
                      <Text style={[styles.extendSummaryTitle, { color: colors.text }]}>
                        Extension Summary
                      </Text>
                      <View style={styles.extendSummaryRow}>
                        <Text style={[styles.extendSummaryLabel, { color: colors.textSecondary }]}>
                          Duration:
                        </Text>
                        <Text style={[styles.extendSummaryValue, { color: colors.text }]}>
                          {`+${selectedExtension.hours} hour${selectedExtension.hours > 1 ? 's' : ''}`}
                        </Text>
                      </View>
                      <View style={styles.extendSummaryRow}>
                        <Text style={[styles.extendSummaryLabel, { color: colors.textSecondary }]}>
                          New End Time:
                        </Text>
                        <Text style={[styles.extendSummaryValue, { color: colors.text }]}>
                          {selectedExtension.newEndTimeFormatted}
                        </Text>
                      </View>
                      <View style={[styles.extendSummaryRow, styles.extendSummaryTotal]}>
                        <Text style={[styles.extendSummaryLabel, { color: colors.text, fontWeight: '700' }]}>
                          Additional Cost:
                        </Text>
                        <Text style={[styles.extendSummaryValue, { color: colors.accent, fontWeight: '700', fontSize: 18 }]}>
                          {`₹${selectedExtension.additionalCost}`}
                        </Text>
                      </View>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.extendEmptyContainer}>
                  <Icon name="alert-circle" size={48} color={colors.error} />
                  <Text style={[styles.extendEmptyTitle, { color: colors.text }]}>
                    Cannot Extend
                  </Text>
                  <Text style={[styles.extendEmptyMessage, { color: colors.textSecondary }]}>
                    {extensionAvailability?.reason || 'This booking cannot be extended at this time'}
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={[styles.extendDialogFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.extendCancelButton, { borderColor: colors.border }]}
                onPress={() => setShowExtendDialog(false)}
                disabled={isExtending}
              >
                <Text style={[styles.extendCancelButtonText, { color: colors.textSecondary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.extendConfirmButton,
                  { backgroundColor: colors.accent },
                  (!selectedExtension || isExtending) && { opacity: 0.5 }
                ]}
                onPress={handleExtendBooking}
                disabled={!selectedExtension || isExtending}
              >
                {isExtending ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Icon name="check" size={18} color="#FFFFFF" />
                    <Text style={styles.extendConfirmButtonText}>
                      Confirm Extension
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

// ==================== Styles ====================
const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  overlayTouchable: {
    flex: 1,
  },
  drawerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '92%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  headerShell: {
    position: 'relative',
    backgroundColor: HOME_M3.primary,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 30,
    paddingHorizontal: 8,
  },
  headerSideBtn: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  headerTitleCenter: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
    lineHeight: 20,
    paddingHorizontal: 4,
  },
  scrollView: {
    flex: 1,
    backgroundColor: HOME_M3.surface,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSheet: {
    backgroundColor: HOME_M3.surfaceContainerLowest,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    marginBottom: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  rowGap8: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  grid2: {
    flexDirection: 'row',
    gap: 12,
  },
  sectionBlock: {
    paddingHorizontal: 20,
    marginTop: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontWeight: '700',
    color: HOME_M3.onSurface,
  },
  sectionCard: {
    backgroundColor: HOME_M3.surfaceContainerLowest,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: HOME_M3.outlineVariant,
    padding: 14,
  },
  statusStack: {
    alignItems: 'flex-end',
    gap: 8,
  },
  metaLabel: {
    color: HOME_M3.onSurfaceVariant,
    fontWeight: '500',
  },
  bookingIdHero: {
    color: HOME_M3.primary,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  serviceCard: {
    marginTop: 18,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: HOME_M3.outlineVariant,
    backgroundColor: HOME_M3.surfaceContainerLowest,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  serviceImageWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fde8d8',
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  serviceTextCol: {
    flex: 1,
  },
  serviceTitle: {
    fontWeight: '700',
    color: HOME_M3.onSurface,
    marginTop: 2,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  pillBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  monthlyPill: { backgroundColor: '#ede9fe', borderColor: '#c4b5fd' },
  monthlyPillText: { color: '#5b21b6' },
  onDemandPill: { backgroundColor: '#e0f2fe', borderColor: '#7dd3fc' },
  onDemandPillText: { color: '#0369a1' },
  shortTermPill: { backgroundColor: '#dcfce7', borderColor: '#86efac' },
  shortTermPillText: { color: '#15803d' },
  defaultPill: { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' },
  defaultPillText: { color: '#475569' },
  notStartedPill: { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' },
  notStartedPillText: { color: '#64748b' },
  inProgressPill: { backgroundColor: '#fff7ed', borderColor: '#fdba74' },
  inProgressPillText: { color: '#c2410c' },
  completedPill: { backgroundColor: '#ecfdf5', borderColor: '#86efac' },
  completedPillText: { color: '#15803d' },
  cancelledPill: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  cancelledPillText: { color: '#dc2626' },
  primaryActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  primaryActionBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  callButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: HOME_M3.secondary,
  },
  callButtonText: {
    color: HOME_M3.secondary,
    fontWeight: '700',
  },
  vacationButton: {
    marginTop: 10,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: HOME_M3.secondary,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
    alignSelf: 'stretch',
  },
  vacationButtonText: {
    color: HOME_M3.secondary,
    fontWeight: '700',
  },
  outlineActionBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
    backgroundColor: '#ffffff',
  },
  cancelOutlineBtn: {
    borderColor: '#fca5a5',
  },
  cancelOutlineText: {
    color: '#dc2626',
    fontWeight: '700',
  },
  modifyOutlineBtn: {
    borderColor: '#cbd5e1',
  },
  modifyOutlineText: {
    color: HOME_M3.onSurface,
    fontWeight: '700',
  },
  disabledActionBtn: {
    opacity: 0.55,
  },
  disabledActionText: {
    color: '#94a3b8',
  },
  secondaryFullButton: {
    marginTop: 10,
    minHeight: 46,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: HOME_M3.outlineVariant,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  secondaryFullButtonText: {
    color: HOME_M3.secondary,
    fontWeight: '700',
  },
  reportIssueButton: {
    marginTop: 10,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#fca5a5',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
    alignSelf: 'stretch',
  },
  reportIssueButtonText: {
    color: '#dc2626',
    fontWeight: '700',
  },
  paymentTimeoutNotice: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#fffbeb',
  },
  paymentTimeoutIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentTimeoutTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#78350f',
    marginBottom: 4,
  },
  paymentTimeoutBody: {
    fontSize: 12,
    lineHeight: 18,
    color: '#92400e',
  },
  infoCell: {
    flex: 1,
  },
  timeSlotRow: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: HOME_M3.outlineVariant,
  },
  valueText: {
    fontWeight: '600',
    color: HOME_M3.onSurface,
    marginTop: 4,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  providerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: HOME_M3.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerAvatarText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  providerName: {
    fontWeight: '700',
    color: HOME_M3.onSurface,
  },
  providerRatingText: {
    marginTop: 2,
    color: HOME_M3.onSurfaceVariant,
    fontSize: 12,
    fontWeight: '600',
  },
  paymentLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  paymentAmount: {
    fontWeight: '600',
    color: HOME_M3.onSurface,
  },
  paymentTotalBar: {
    marginTop: 4,
    marginBottom: 12,
    backgroundColor: HOME_M3.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentTotalLabel: {
    color: '#ffffff',
    fontWeight: '700',
  },
  paymentTotalValue: {
    color: '#ffffff',
    fontWeight: '800',
  },
  paymentMetaRow: {
    gap: 8,
    marginBottom: 4,
  },
  paymentMetaText: {
    color: HOME_M3.onSurfaceVariant,
    fontWeight: '500',
  },
  paymentMetaStrong: {
    color: HOME_M3.onSurface,
    fontWeight: '700',
  },
  invoiceWrap: {
    marginTop: 12,
  },
  modificationPanel: {
    backgroundColor: '#eef6ff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    padding: 12,
  },
  modificationCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
    padding: 12,
  },
  modificationCardSpacing: {
    marginBottom: 10,
  },
  modificationTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  modificationBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexShrink: 1,
  },
  modificationBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  modificationDate: {
    color: HOME_M3.onSurfaceVariant,
    fontWeight: '500',
    flexShrink: 0,
  },
  refundText: {
    color: '#16a34a',
    fontWeight: '700',
  },
  penaltyText: {
    color: '#dc2626',
    fontWeight: '700',
  },
  footerMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingHorizontal: 20,
    marginTop: 22,
    marginBottom: 8,
  },
  footerMetaCol: {
    minWidth: '42%',
    flex: 1,
  },
  footerMetaValue: {
    color: HOME_M3.onSurface,
    fontWeight: '700',
    marginTop: 4,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  badgeOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  badgeText: {
    fontWeight: '500',
  },
  badgeOutlineText: {
    fontWeight: '500',
  },
  separator: {
    height: 1,
    marginVertical: 8,
  },
  // Extension Dialog Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  extendDialogContainer: {
    width: '100%',
    maxWidth: width - 40,
    maxHeight: height * 0.85,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    overflow: 'hidden',
  },
  extendDialogHeader: {
    minHeight: 60,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  extendHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  extendDialogTitle: {
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  extendCloseButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  extendDialogContent: {
    maxHeight: height * 0.65,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  extendLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  extendLoadingText: {
    fontSize: 14,
    fontWeight: '500',
  },
  extendInfoBox: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: HOME_M3.outline,
  },
  extendInfoLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  extendInfoValue: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 4,
  },
  extendSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 8,
  },
  extendOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 12,
  },
  extendOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  extendRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extendRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  extendOptionHours: {
    fontSize: 16,
    fontWeight: '700',
  },
  extendOptionTime: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
  },
  extendOptionRight: {
    alignItems: 'flex-end',
  },
  extendOptionPrice: {
    fontSize: 18,
    fontWeight: '800',
  },
  extendOptionTotal: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  extendSummaryBox: {
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 2,
  },
  extendSummaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  extendSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  extendSummaryLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  extendSummaryValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  extendSummaryTotal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  extendEmptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    gap: 12,
  },
  extendEmptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 8,
  },
  extendEmptyMessage: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
  },
  extendDialogFooter: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  extendCancelButton: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extendCancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  extendConfirmButton: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  extendConfirmButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

const cancelDialogStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: width - 48,
    borderRadius: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  headerShell: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
    minHeight: 56,
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 10,
  },
  headerTitle: {
    fontWeight: '600',
    color: '#FFFFFF',
    flexShrink: 1,
    textAlign: 'center',
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  message: {
    lineHeight: 22,
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 12,
  },
  button: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  confirmButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    fontWeight: '600',
  },
});

export default EngagementDetailsDrawer;