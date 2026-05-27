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
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import dayjs from 'dayjs';
import LinearGradient from 'react-native-linear-gradient';
import Snackbar from 'react-native-snackbar';
import RazorpayCheckout from 'react-native-razorpay';

// Import your existing utilities and services
import PaymentInstance from '../services/paymentInstance';
import { useTheme } from '../../src/Settings/ThemeContext';
import Invoice from '../Invoice/Invoice';
import UserHoliday from './UserHoliday';
import VacationManagementDialog from './VacationManagement';
import { BOOKING_HEADER_GRADIENT } from "../theme/brandColors";

const { width, height } = Dimensions.get('window');

// ==================== Types ====================
interface EngagementDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onPaymentComplete?: () => void | Promise<void>;
  refreshBookings?: () => void | Promise<void>;
  customerId?: number | null;
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
              colors={[...BOOKING_HEADER_GRADIENT]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
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

// ==================== Main Component - Custom Dialog without Modal ====================
const EngagementDetailsDrawer: React.FC<EngagementDetailsDrawerProps> = ({ 
  isOpen, 
  onClose, 
  booking, 
  onPaymentComplete,
  refreshBookings,
  customerId
}) => {
  const { colors, fontSize } = useTheme();
  const [isProcessingPayment, setIsProcessingPayment] = React.useState(false);
  const [isCallLoading, setIsCallLoading] = React.useState(false);
  const [isCancelLoading, setIsCancelLoading] = React.useState(false);
  const [showCancelDialog, setShowCancelDialog] = React.useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = React.useState(false);
  
  // Animation values
  const slideAnim = React.useRef(new Animated.Value(height)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  
  // Create a ref for the ScrollView
  const scrollViewRef = React.useRef<ScrollView>(null);
  
  // Vacation states
  const [holidayDialogOpen, setHolidayDialogOpen] = React.useState(false);
  const [vacationManagementDialogOpen, setVacationManagementDialogOpen] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Handle animation when isOpen changes
  React.useEffect(() => {
    if (isOpen) {
      // Animate in
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
      ]).start(() => {
        // Scroll to bottom after animation completes
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      });
    } else {
      // Animate out
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

  // Scroll to bottom when content changes
  React.useEffect(() => {
    if (isOpen && booking) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 200);
    }
  }, [isOpen, booking?.payment?.status, booking?.modifications?.length]);

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

  if (!booking) return null;

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': 
        return { backgroundColor: colors.successLight, color: colors.success };
      case 'PENDING': 
        return { backgroundColor: colors.warningLight, color: colors.warning };
      case 'FAILED': 
        return { backgroundColor: colors.errorLight, color: colors.error };
      default: 
        return { backgroundColor: colors.surface, color: colors.textSecondary };
    }
  };

  const getBookingTypeBadge = (type: string) => {
    switch (type) {
      case 'ON_DEMAND':
        return (
          <Badge style={[styles.onDemandBadge, { backgroundColor: colors.info + '15', borderColor: colors.info + '30' }]}>
            <Text style={[styles.onDemandBadgeText, { color: colors.info }]}>On Demand</Text>
          </Badge>
        );
      case 'MONTHLY':
        return (
          <Badge style={[styles.monthlyBadge, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
            <Text style={[styles.monthlyBadgeText, { color: colors.primary }]}>Monthly</Text>
          </Badge>
        );
      case 'SHORT_TERM':
        return (
          <Badge style={[styles.shortTermBadge, { backgroundColor: colors.success + '15', borderColor: colors.success + '30' }]}>
            <Text style={[styles.shortTermBadgeText, { color: colors.success }]}>Short Term</Text>
          </Badge>
        );
      default:
        return (
          <Badge style={[styles.defaultBadge, { backgroundColor: colors.textSecondary + '15', borderColor: colors.textSecondary + '30' }]}>
            <Text style={[styles.defaultBadgeText, { color: colors.textSecondary }]}>{type}</Text>
          </Badge>
        );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <Badge style={[styles.activeBadge, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
            <Icon name="alert-circle" size={14} color={colors.primary} />
            <Text style={[styles.activeBadgeText, { color: colors.primary }]}>Active</Text>
          </Badge>
        );
      case 'COMPLETED':
        return (
          <Badge style={[styles.completedBadge, { backgroundColor: colors.success + '15', borderColor: colors.success + '30' }]}>
            <Icon name="check-circle" size={14} color={colors.success} />
            <Text style={[styles.completedBadgeText, { color: colors.success }]}>Completed</Text>
          </Badge>
        );
      case 'CANCELLED':
        return (
          <Badge style={[styles.cancelledBadge, { backgroundColor: colors.error + '15', borderColor: colors.error + '30' }]}>
            <Icon name="close-circle" size={14} color={colors.error} />
            <Text style={[styles.cancelledBadgeText, { color: colors.error }]}>Cancelled</Text>
          </Badge>
        );
      case 'IN_PROGRESS':
        return (
          <Badge style={[styles.inProgressBadge, { backgroundColor: colors.warning + '15', borderColor: colors.warning + '30' }]}>
            <Icon name="clock" size={14} color={colors.warning} />
            <Text style={[styles.inProgressBadgeText, { color: colors.warning }]}>In Progress</Text>
          </Badge>
        );
      case 'NOT_STARTED':
        return (
          <Badge style={[styles.notStartedBadge, { backgroundColor: colors.textSecondary + '15', borderColor: colors.textSecondary + '30' }]}>
            <Icon name="clock" size={14} color={colors.textSecondary} />
            <Text style={[styles.notStartedBadgeText, { color: colors.textSecondary }]}>Not Started</Text>
          </Badge>
        );
      default: return null;
    }
  };

  const isProviderAssigned = () => {
    const notAssignedString = 'Not Assigned';
    return !!(
      booking.serviceProviderName &&
      booking.serviceProviderName !== notAssignedString &&
      booking.serviceProviderName.trim() !== '' &&
      booking.serviceProviderName !== 'Not Assigned'
    );
  };

  const handleDownloadInvoice = () => {
    console.log('Opening invoice modal for booking:', booking.id);
    setShowInvoiceModal(true);
  };

  const handleCloseInvoice = () => {
    setShowInvoiceModal(false);
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
      Alert.alert('Call', `Calling ${booking.serviceProviderName || 'service provider'}...`);
    }, 500);
  };

  const handleCancelBooking = () => setShowCancelDialog(true);
  
  const confirmCancelBooking = async () => {
    setIsCancelLoading(true);
    try {
      await PaymentInstance.post(`/api/v2/engagements/${booking.id}/cancel`, {});
      setShowCancelDialog(false);
      Snackbar.show({
        text: `${getServiceTitle(booking.service_type)} service cancelled successfully`,
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
  const handleAddVacation = () => {
    setHolidayDialogOpen(true);
  };

  const handleModifyVacation = () => {
    setVacationManagementDialogOpen(true);
  };

  const handleLeaveSubmit = async (startDate: string, endDate: string, service_type: string): Promise<void> => {
    if (!customerId) {
      Snackbar.show({
        text: 'Customer ID not found. Please try again.',
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: colors.error,
        textColor: '#FFFFFF',
      });
      throw new Error('Customer ID not found');
    }
    
    try {
      setIsRefreshing(true);
      await PaymentInstance.post(`/api/v2/engagements/${booking.id}/vacation`, {
        customerid: customerId,
        vacation_start_date: startDate,
        vacation_end_date: endDate,
        leave_type: "VACATION",
        modified_by_id: booking.id,
        modified_by_role: "CUSTOMER",
      });
      
      if (refreshBookings) await refreshBookings();
      Snackbar.show({
        text: 'Vacation applied successfully',
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: colors.success,
        textColor: '#FFFFFF',
      });
      setHolidayDialogOpen(false);
    } catch (error) {
      console.error('Error applying leave:', error);
      throw error;
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleVacationSuccess = async () => {
    Snackbar.show({
      text: 'Vacation updated successfully',
      duration: Snackbar.LENGTH_SHORT,
      backgroundColor: colors.success,
      textColor: '#FFFFFF',
    });
    if (refreshBookings) await refreshBookings();
    setVacationManagementDialogOpen(false);
  };

  const handleModifyClick = () => {
    onClose();
    setTimeout(() => {
      Alert.alert('Modify Booking', 'Please use the modify button from the main booking screen');
    }, 500);
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'maid': return '🧹';
      case 'cook': return '👩‍🍳';
      case 'nanny': return '❤️';
      default: return '🧹';
    }
  };

  const isEngagementCancelled = () => {
    const life = String((booking as any)?.engagement_status ?? '').toUpperCase();
    return life === 'CANCELLED' || booking.taskStatus === 'CANCELLED';
  };

  const isCancellable = () => !['COMPLETED', 'CANCELLED'].includes(booking.taskStatus) && !isEngagementCancelled();
  const hasExistingVacation = hasVacation(booking);
  const modificationDisabled = isModificationDisabled(booking);
  const isPaymentPending = booking.payment && booking.payment.status === "PENDING";
  const canShowPaymentButton = isPaymentPending && booking.taskStatus !== 'CANCELLED';
  
  const shouldShowModifyButton = booking.bookingType === "MONTHLY" && booking.taskStatus === 'NOT_STARTED';
  const shouldShowVacationButton = booking.bookingType === "MONTHLY" && booking.taskStatus !== 'CANCELLED' && booking.taskStatus !== 'COMPLETED';

  const convertBookingForChildComponents = (bookingData: any): any => {
    if (!bookingData) return null;
    return {
      ...bookingData,
      serviceType: bookingData.serviceType || bookingData.service_type,
      vacationDetails: bookingData.vacationDetails ? {
        ...bookingData.vacationDetails,
        leave_start_date: bookingData.vacationDetails.leave_start_date || bookingData.vacationDetails.start_date,
        leave_end_date: bookingData.vacationDetails.leave_end_date || bookingData.vacationDetails.end_date,
      } : null,
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
            backgroundColor: colors.card,
          }
        ]}
      >
        {/* Header with BOOKING_HEADER_GRADIENT */}
        <LinearGradient 
          colors={[...BOOKING_HEADER_GRADIENT]} 
          start={{ x: 0, y: 0 }} 
          end={{ x: 1, y: 0 }} 
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerLeftPlaceholder} />
            <Text style={[styles.headerTitle, { fontSize: fontSizes.headerTitle }]}>Booking Details</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="x" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Scrollable Content */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          bounces={true}
          overScrollMode="always"
          nestedScrollEnabled={true}
        >
          {/* Booking ID and Status */}
          <View style={styles.rowBetween}>
            <View>
              <Text style={[styles.labelText, { fontSize: fontSizes.labelText, color: colors.textSecondary }]}>Booking ID</Text>
              <Text style={[styles.bookingIdText, { fontSize: fontSizes.bookingIdText, color: colors.text }]}>#{booking.id}</Text>
            </View>
            <View style={styles.statusContainer}>
              {getBookingTypeBadge(booking.bookingType)}
              {getStatusBadge(booking.taskStatus)}
            </View>
          </View>

          {/* Service Type */}
          <View style={[styles.serviceCard, { backgroundColor: colors.primary + '15', marginTop: 20 }]}>
            <View style={[styles.serviceIconContainer, { backgroundColor: colors.card }]}>
              <Text style={styles.serviceIcon}>{getServiceIcon(booking.service_type)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.labelText, { fontSize: fontSizes.labelText, color: colors.textSecondary }]}>Service Type</Text>
              <Text style={[styles.serviceTitle, { fontSize: fontSizes.serviceTitle, color: colors.text }]}>{getServiceTitle(booking.service_type)}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={{ marginTop: 20 }}>
            {!canShowPaymentButton ? (
              <View style={styles.buttonGrid}>
                <TouchableOpacity 
                  style={[styles.actionButton, styles.callButton, { backgroundColor: colors.primary }]} 
                  onPress={handleCallProvider} 
                  disabled={isCallLoading}
                >
                  {isCallLoading ? 
                    <ActivityIndicator size="small" color="#FFFFFF" /> : 
                    <Icon name="phone" size={18} color="#FFFFFF" />
                  }
                  <Text style={[styles.actionButtonText, { color: '#FFFFFF', fontSize: fontSizes.actionButtonText }]}>Call</Text>
                </TouchableOpacity>
                
                {isCancellable() && (
                  <TouchableOpacity 
                    style={[styles.outlineButton, { borderColor: colors.error }]} 
                    onPress={handleCancelBooking} 
                    disabled={isCancelLoading}
                  >
                    {isCancelLoading ? 
                      <ActivityIndicator size="small" color={colors.error} /> : 
                      <Icon name="x-circle" size={18} color={colors.error} />
                    }
                    <Text style={[styles.outlineButtonText, { color: colors.error, fontSize: fontSizes.actionButtonText }]}>Cancel</Text>
                  </TouchableOpacity>
                )}
                
                {shouldShowModifyButton && (
                  <TouchableOpacity 
                    style={[styles.outlineButton, { borderColor: colors.primary, opacity: modificationDisabled ? 0.5 : 1 }]} 
                    onPress={handleModifyClick}
                    disabled={modificationDisabled}
                  >
                    <Icon name="edit-2" size={18} color={modificationDisabled ? colors.textSecondary : colors.primary} />
                    <Text style={[styles.outlineButtonText, { color: modificationDisabled ? colors.textSecondary : colors.primary, fontSize: fontSizes.actionButtonText }]}>Modify</Text>
                  </TouchableOpacity>
                )}
                
                {shouldShowVacationButton && (
                  <>
                    {hasExistingVacation ? (
                      <TouchableOpacity 
                        style={[styles.outlineButton, { borderColor: colors.primary }]} 
                        onPress={handleModifyVacation}
                        disabled={isRefreshing}
                      >
                        <Icon name="edit-2" size={18} color={colors.primary} />
                        <Text style={[styles.outlineButtonText, { color: colors.primary, fontSize: fontSizes.actionButtonText }]}>Modify Vacation</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity 
                        style={[styles.outlineButton, { borderColor: colors.primary }]} 
                        onPress={handleAddVacation}
                        disabled={isRefreshing}
                      >
                        <Icon name="calendar" size={18} color={colors.primary} />
                        <Text style={[styles.outlineButtonText, { color: colors.primary, fontSize: fontSizes.actionButtonText }]}>Add Vacation</Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </View>
            ) : (
              <View style={styles.buttonGrid}>
                <TouchableOpacity 
                  style={[styles.outlineButton, { borderColor: colors.error, flex: 1 }]} 
                  onPress={handleCompletePayment} 
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? 
                    <ActivityIndicator size="small" color={colors.error} /> : (
                    <>
                      <Icon name="credit-card" size={18} color={colors.error} />
                      <Text style={[styles.outlineButtonText, { color: colors.error, fontSize: fontSizes.actionButtonText }]}>Complete Payment</Text>
                    </>
                  )}
                </TouchableOpacity>
                
                {isCancellable() && (
                  <TouchableOpacity 
                    style={[styles.outlineButton, { borderColor: colors.error, flex: 1 }]} 
                    onPress={handleCancelBooking} 
                    disabled={isCancelLoading}
                  >
                    {isCancelLoading ? 
                      <ActivityIndicator size="small" color={colors.error} /> : 
                      <Icon name="x-circle" size={18} color={colors.error} />
                    }
                    <Text style={[styles.outlineButtonText, { color: colors.error, fontSize: fontSizes.actionButtonText }]}>Cancel</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* Schedule */}
          <View style={{ marginTop: 24 }}>
            <View style={styles.sectionHeader}>
              <Icon name="calendar" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { fontSize: fontSizes.sectionTitle, color: colors.text }]}>Schedule</Text>
            </View>
            <View style={styles.grid2}>
              <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
                <Text style={[styles.labelText, { fontSize: fontSizes.labelText, color: colors.textSecondary }]}>Start Date</Text>
                <Text style={[styles.valueText, { fontSize: fontSizes.scheduleValue, color: colors.text }]}>{formatDate(booking.startDate)}</Text>
              </View>
              <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
                <Text style={[styles.labelText, { fontSize: fontSizes.labelText, color: colors.textSecondary }]}>End Date</Text>
                <Text style={[styles.valueText, { fontSize: fontSizes.scheduleValue, color: colors.text }]}>{formatDate(booking.endDate)}</Text>
              </View>
            </View>
            <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.labelText, { fontSize: fontSizes.labelText, color: colors.textSecondary }]}>Time Slot</Text>
              <View style={styles.rowGap8}>
                <Icon name="clock" size={16} color={colors.textSecondary} />
                <Text style={[styles.valueText, { fontSize: fontSizes.scheduleValue, color: colors.text }]}>
                  {formatTimeToAMPM(booking.start_time)} - {formatTimeToAMPM(booking.end_time)}
                </Text>
              </View>
            </View>
          </View>

          {/* Provider */}
          {isProviderAssigned() && (
            <View style={{ marginTop: 24 }}>
              <View style={styles.sectionHeader}>
                <Icon name="user" size={20} color={colors.success} />
                <Text style={[styles.sectionTitle, { fontSize: fontSizes.sectionTitle, color: colors.text }]}>Service Provider</Text>
              </View>
              <View style={[styles.providerCard, { backgroundColor: colors.surface }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.providerName, { fontSize: fontSizes.providerName, color: colors.text }]}>{booking.serviceProviderName}</Text>
                </View>
                {booking.providerRating > 0 && (
                  <Badge style={{ backgroundColor: colors.warningLight }}>
                    ⭐ {booking.providerRating.toFixed(1)}
                  </Badge>
                )}
              </View>
            </View>
          )}

          {/* Tasks */}
          <View style={{ marginTop: 24 }}>
            <View style={styles.sectionHeader}>
              <Icon name="file-text" size={20} color={colors.info} />
              <Text style={[styles.sectionTitle, { fontSize: fontSizes.sectionTitle, color: colors.text }]}>Tasks & Responsibilities</Text>
            </View>
            
            {booking.responsibilities?.tasks?.length > 0 && (
              <View>
                <Text style={[styles.labelText, { fontSize: fontSizes.labelText, color: colors.textSecondary, marginBottom: 8 }]}>Main Tasks</Text>
                <View style={styles.wrapContainer}>
                  {booking.responsibilities.tasks.map((task: any, index: number) => {
                    const taskDetails = Object.entries(task)
                      .filter(([key]) => key !== 'taskType')
                      .map(([key, value]) => `${value} ${key}`)
                      .join(', ');
                    return (
                      <Badge key={index} variant="outline" style={{ backgroundColor: colors.primary + '15' }}>
                        {task.taskType} {taskDetails && `- ${taskDetails}`}
                      </Badge>
                    );
                  })}
                </View>
              </View>
            )}
            
            {booking.responsibilities?.add_ons?.length > 0 && (
              <View style={{ marginTop: 12 }}>
                <Text style={[styles.labelText, { fontSize: fontSizes.labelText, color: colors.textSecondary, marginBottom: 8 }]}>Add-ons</Text>
                <View style={styles.wrapContainer}>
                  {booking.responsibilities.add_ons.map((addon: any, index: number) => (
                    <Badge key={index} variant="outline" style={{ backgroundColor: colors.successLight }}>
                      {addon.taskType}
                    </Badge>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Payment Details */}
          {booking.payment && (
            <View style={{ marginTop: 24 }}>
              <View style={styles.sectionHeader}>
                <Icon name="credit-card" size={20} color={colors.warning} />
                <Text style={[styles.sectionTitle, { fontSize: fontSizes.sectionTitle, color: colors.text }]}>Payment Details</Text>
              </View>
              <View style={[styles.paymentCard, { backgroundColor: colors.surface }]}>
                <View style={styles.rowBetween}>
                  <Text style={[styles.labelText, { fontSize: fontSizes.labelText, color: colors.textSecondary }]}>Base Amount</Text>
                  <Text style={[styles.valueText, { fontSize: fontSizes.paymentValue, color: colors.text }]}>₹{booking.payment.base_amount}</Text>
                </View>
                <View style={styles.rowBetween}>
                  <Text style={[styles.labelText, { fontSize: fontSizes.labelText, color: colors.textSecondary }]}>Platform Fee</Text>
                  <Text style={[styles.valueText, { fontSize: fontSizes.paymentValue, color: colors.text }]}>₹{booking.payment.platform_fee}</Text>
                </View>
                <View style={styles.rowBetween}>
                  <Text style={[styles.labelText, { fontSize: fontSizes.labelText, color: colors.textSecondary }]}>GST</Text>
                  <Text style={[styles.valueText, { fontSize: fontSizes.paymentValue, color: colors.text }]}>₹{booking.payment.gst}</Text>
                </View>
                <Separator />
                <View style={styles.rowBetween}>
                  <Text style={[styles.sectionTitle, { fontSize: fontSizes.sectionTitle, color: colors.text }]}>Total</Text>
                  <Text style={[styles.totalAmount, { fontSize: fontSizes.paymentTotalValue, color: colors.primary }]}>₹{booking.payment.total_amount}</Text>
                </View>
                <View style={styles.rowBetween}>
                  <Text style={[styles.labelText, { fontSize: fontSizes.labelText, color: colors.textSecondary }]}>Payment Status</Text>
                  <Badge style={[getPaymentStatusColor(booking.payment.status)]}>
                    {booking.payment.status}
                  </Badge>
                </View>
                <View style={styles.rowBetween}>
                  <Text style={[styles.labelText, { fontSize: fontSizes.labelText, color: colors.textSecondary }]}>Payment Mode</Text>
                  <Text style={[styles.valueText, { fontSize: fontSizes.paymentValue, color: colors.text, textTransform: 'capitalize' }]}>{booking.payment.payment_mode}</Text>
                </View>
                {booking.payment.transaction_id && (
                  <View style={styles.rowBetween}>
                    <Text style={[styles.labelText, { fontSize: fontSizes.labelText, color: colors.textSecondary }]}>Transaction ID</Text>
                    <Text style={[styles.valueText, { fontSize: fontSizes.paymentValue, color: colors.text }]}>{booking.payment.transaction_id}</Text>
                  </View>
                )}
                
                {booking.payment.status === 'PENDING' && booking.taskStatus !== 'CANCELLED' && (
                  <TouchableOpacity 
                    style={[styles.fullButton, { borderColor: colors.error, marginTop: 16 }]} 
                    onPress={handleCompletePayment} 
                    disabled={isProcessingPayment}
                  >
                    {isProcessingPayment ? 
                      <ActivityIndicator size="small" color={colors.error} /> : (
                      <>
                        <Icon name="credit-card" size={20} color={colors.error} />
                        <Text style={[styles.fullButtonText, { color: colors.error, fontSize: fontSizes.sectionTitle }]}>Complete Payment Now</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
                
                {booking.payment.status === 'SUCCESS' && (
                  <TouchableOpacity 
                    style={[styles.fullButton, { borderColor: colors.primary, marginTop: 16 }]} 
                    onPress={handleDownloadInvoice}
                  >
                    <Icon name="file-text" size={20} color={colors.primary} />
                    <Text style={[styles.fullButtonText, { color: colors.primary, fontSize: fontSizes.sectionTitle }]}>View & Download Invoice</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Modification History */}
          {booking.modifications?.length > 0 && (
            <View style={{ marginTop: 24 }}>
              <View style={styles.sectionHeader}>
                <Icon name="alert-circle" size={20} color={colors.warning} />
                <Text style={[styles.sectionTitle, { fontSize: fontSizes.sectionTitle, color: colors.text }]}>Modification History</Text>
              </View>
              {booking.modifications.map((mod: any, index: number) => (
                <View key={index} style={[styles.modificationCard, { backgroundColor: colors.warningLight, marginBottom: 8 }]}>
                  <View style={styles.wrapContainer}>
                    <Badge style={{ backgroundColor: colors.warning }}>{mod.action}</Badge>
                    <Text style={[styles.smallText, { fontSize: fontSizes.labelText, color: colors.textSecondary }]}>
                      {dayjs(mod.date).format('MMM D, YYYY h:mm A')}
                    </Text>
                  </View>
                  {mod.refund && <Text style={[styles.successText, { fontSize: fontSizes.labelText, marginTop: 4 }]}>Refund: ₹{mod.refund}</Text>}
                  {mod.penalty && <Text style={[styles.errorText, { fontSize: fontSizes.labelText, marginTop: 4 }]}>Penalty: ₹{mod.penalty}</Text>}
                </View>
              ))}
            </View>
          )}

          {/* Additional Info */}
          <View style={{ marginTop: 24, marginBottom: 20 }}>
            <View style={styles.sectionHeader}>
              <Icon name="tag" size={20} color={colors.textSecondary} />
              <Text style={[styles.sectionTitle, { fontSize: fontSizes.sectionTitle, color: colors.text }]}>Additional Information</Text>
            </View>
            <View style={styles.grid2}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.labelText, { fontSize: fontSizes.labelText, color: colors.textSecondary }]}>Booking Date</Text>
                <Text style={[styles.valueText, { fontSize: fontSizes.additionalInfoValue, color: colors.text }]}>
                  {dayjs(booking.bookingDate).format('MMM D, YYYY')}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.labelText, { fontSize: fontSizes.labelText, color: colors.textSecondary }]}>Assignment Status</Text>
                <Text style={[styles.valueText, { fontSize: fontSizes.additionalInfoValue, color: colors.text, textTransform: 'capitalize' }]}>{booking.assignmentStatus}</Text>
              </View>
              {booking.leave_days > 0 && (
                <View style={{ flex: 1 }}>
                  <Text style={[styles.labelText, { fontSize: fontSizes.labelText, color: colors.textSecondary }]}>Leave Days</Text>
                  <Text style={[styles.valueText, { fontSize: fontSizes.additionalInfoValue, color: colors.text }]}>{booking.leave_days}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Bottom spacer */}
          <View style={{ height: 40 }} />
        </ScrollView>
      </Animated.View>

      {/* Invoice Modal - Rendered at the highest level */}
      <Modal
        visible={showInvoiceModal}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseInvoice}
      >
        <Invoice 
          booking={booking} 
          onClose={handleCloseInvoice} 
        />
      </Modal>

      {/* Holiday Dialog */}
      {holidayDialogOpen && (
        <UserHoliday 
          open={holidayDialogOpen} 
          onClose={() => setHolidayDialogOpen(false)} 
          booking={convertBookingForChildComponents(booking)} 
          onLeaveSubmit={handleLeaveSubmit} 
        />
      )}
      
      {/* Vacation Management Dialog */}
      {vacationManagementDialogOpen && (
        <VacationManagementDialog 
          open={vacationManagementDialogOpen} 
          onClose={() => setVacationManagementDialogOpen(false)} 
          booking={convertBookingForChildComponents(booking)} 
          customerId={customerId ?? null}
          onSuccess={handleVacationSuccess} 
        />
      )}

      {/* Cancel Dialog */}
      {showCancelDialog && (
        <CancelDialog
          visible={showCancelDialog}
          onClose={() => setShowCancelDialog(false)}
          onConfirm={confirmCancelBooking}
          serviceName={getServiceTitle(booking.service_type)}
          isLoading={isCancelLoading}
        />
      )}
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
    height: '90%',
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
  header: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerLeftPlaceholder: {
    width: 40,
  },
  headerTitle: {
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
  },
  closeButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowGap8: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  grid2: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  wrapContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  labelText: {
    fontWeight: '500',
  },
  bookingIdText: {
    fontWeight: '500',
  },
  serviceCard: {
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIconContainer: {
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  serviceIcon: {
    fontSize: 24,
  },
  serviceTitle: {
    fontWeight: '700',
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    minWidth: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
  },
  outlineButton: {
    flex: 1,
    minWidth: '30%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
    borderWidth: 2,
  },
  actionButtonText: {
    fontWeight: '600',
  },
  outlineButtonText: {
    fontWeight: '600',
  },
  callButton: {
    backgroundColor: '#0b5bd3',
  },
  sectionTitle: {
    fontWeight: '500',
  },
  infoCard: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
  },
  valueText: {
    fontWeight: '500',
  },
  providerCard: {
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  providerName: {
    fontWeight: '500',
  },
  paymentCard: {
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  totalAmount: {
    fontWeight: '700',
  },
  fullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
    borderWidth: 2,
  },
  fullButtonText: {
    fontWeight: '600',
  },
  modificationCard: {
    padding: 12,
    borderRadius: 8,
  },
  smallText: {
    fontWeight: '500',
  },
  successText: {
    color: '#4CAF50',
  },
  errorText: {
    color: '#F44336',
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
  onDemandBadge: { paddingHorizontal: 8, paddingVertical: 4 },
  onDemandBadgeText: { fontWeight: '600' },
  monthlyBadge: { paddingHorizontal: 8, paddingVertical: 4 },
  monthlyBadgeText: { fontWeight: '600' },
  shortTermBadge: { paddingHorizontal: 8, paddingVertical: 4 },
  shortTermBadgeText: { fontWeight: '600' },
  defaultBadge: { paddingHorizontal: 8, paddingVertical: 4 },
  defaultBadgeText: { fontWeight: '600' },
  activeBadge: { paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center' },
  activeBadgeText: { marginLeft: 4, fontWeight: '600' },
  completedBadge: { paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center' },
  completedBadgeText: { marginLeft: 4, fontWeight: '600' },
  cancelledBadge: { paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center' },
  cancelledBadgeText: { marginLeft: 4, fontWeight: '600' },
  inProgressBadge: { paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center' },
  inProgressBadgeText: { marginLeft: 4, fontWeight: '600' },
  notStartedBadge: { paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center' },
  notStartedBadgeText: { marginLeft: 4, fontWeight: '600' },
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