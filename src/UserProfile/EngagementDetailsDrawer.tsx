/* eslint-disable */
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
  Platform,
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
import BottomSheetScaffold from '../design-system/BottomSheetScaffold';

const { width } = Dimensions.get('window');

// ==================== Types ====================
interface EngagementDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any;
  onPaymentComplete?: () => void;
  refreshBookings?: () => void;
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
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={cancelDialogStyles.overlay}>
        <View style={[cancelDialogStyles.dialogContainer, { backgroundColor: colors.card }]}>
          <LinearGradient 
            colors={["#0a2a66ff", "#004aadff"]} 
            start={{ x: 0, y: 0 }} 
            end={{ x: 1, y: 0 }} 
            style={cancelDialogStyles.header}
          >
            <View style={cancelDialogStyles.headerContent}>
              <Icon name="alert-triangle" size={24} color="#FFFFFF" />
              <Text style={[cancelDialogStyles.headerTitle, { fontSize: fontSizes.title }]}>Cancel Booking</Text>
            </View>
          </LinearGradient>
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

// Helper function to check if booking has vacation
const hasVacation = (booking: any): boolean => {
  return booking.hasVacation || (booking.vacationDetails && (booking.vacationDetails.total_days || 0) > 0) || false;
};

// Helper function to check modification time allowance
const isModificationTimeAllowed = (startEpoch: any): boolean => {
  if (!startEpoch) return false;
  const now = dayjs().unix();
  const cutoff = startEpoch - 30 * 60;
  return now < cutoff;
};

// Helper function to check if booking is already modified
const isBookingAlreadyModified = (booking: any | null): boolean => {
  if (!booking) return false;
  return !!(booking.modifications?.some((mod: any) =>
    mod.action === "Date Rescheduled" ||
    mod.action === "Time Rescheduled" ||
    mod.action === "Modified" ||
    mod.action?.includes("Reschedule")
  ));
};

// Helper function to check if modification is disabled
const isModificationDisabled = (booking: any | null): boolean => {
  if (!booking) return true;
  return !isModificationTimeAllowed(booking.start_epoch) || isBookingAlreadyModified(booking);
};

// Helper function to get service title
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

// Helper function to get booking type badge
const getBookingTypeBadge = (type: string) => {
  const { colors } = useTheme();
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

// Helper function to get status badge
const getStatusBadge = (status: string) => {
  const { colors } = useTheme();
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

// ==================== Main Component ====================
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
  
  // Vacation states
  const [holidayDialogOpen, setHolidayDialogOpen] = React.useState(false);
  const [vacationManagementDialogOpen, setVacationManagementDialogOpen] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

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

  if (!isOpen || !booking) return null;

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
    setShowInvoiceModal(true);
  };

  const handleCompletePayment = async () => {
    if (!booking.payment?.engagement_id) {
      Alert.alert('Error', 'Unable to resume payment');
      return;
    }
    
    try {
      setIsProcessingPayment(true);
      const resumeRes = await PaymentInstance.get(`/api/payments/${booking.payment.engagement_id}/resume`);
      const { razorpay_order_id, amount, currency, engagement_id, customer } = resumeRes.data;
      
      const options = {
        key: "rzp_test_lTdgjtSRlEwreA",
        amount: amount * 100,
        currency,
        order_id: razorpay_order_id,
        name: "Serveaso",
        description: 'Complete your payment',
        prefill: {
          name: customer?.firstname || booking.customerName,
          contact: customer?.contact || '9999999999',
          email: customer?.email || '',
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
            if (onPaymentComplete) onPaymentComplete();
            if (refreshBookings) refreshBookings();
            Alert.alert('Success', 'Payment completed successfully');
          } catch (verifyError) {
            console.error("Payment verification error:", verifyError);
            Alert.alert('Error', 'Payment verification failed');
          }
        })
        .catch((error: any) => {
          if (error.code !== 2) Alert.alert('Error', 'Payment failed');
        });
    } catch (err) {
      console.error("Complete payment error:", err);
      Alert.alert('Error', 'Unable to resume payment');
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
      await PaymentInstance.put(`/api/engagements/${booking.id}`, { task_status: "CANCELLED" });
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
        text: error?.response?.data?.message || 'Failed to cancel booking. Please try again.',
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
    // Close the drawer and let the parent component handle the modify dialog
    onClose();
    // You can emit an event or directly call a callback if needed
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

  const isCancellable = () => !['COMPLETED', 'CANCELLED'].includes(booking.taskStatus);
  const hasExistingVacation = hasVacation(booking);
  const modificationDisabled = isModificationDisabled(booking);
  const isPaymentPending = booking.payment && booking.payment.status === "PENDING";
  const canShowPaymentButton = isPaymentPending && booking.taskStatus !== 'CANCELLED';
  
  // Determine which action buttons to show based on booking status
  const shouldShowModifyButton = booking.bookingType === "MONTHLY" && booking.taskStatus === 'NOT_STARTED';
  const shouldShowVacationButton = booking.bookingType === "MONTHLY" && booking.taskStatus !== 'CANCELLED' && booking.taskStatus !== 'COMPLETED';

  // Convert booking for child components
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

  // ==================== Styles ====================
  const dynamicStyles = StyleSheet.create({
    modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
    overlayTouchable: { flex: 1 },
    drawerContainer: { 
      backgroundColor: colors.card, 
      borderTopLeftRadius: 20, 
      borderTopRightRadius: 20, 
      height: '90%', 
      width: '100%' 
    },
    header: { borderTopLeftRadius: 20, borderTopRightRadius: 20 },
    headerContent: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'space-between', 
      paddingHorizontal: 16, 
      paddingVertical: 12, 
      width: '100%' 
    },
    headerLeftPlaceholder: { width: 40 },
    headerTitle: { 
      fontSize: fontSizes.headerTitle, 
      fontWeight: '600', 
      color: '#FFFFFF', 
      textAlign: 'center', 
      flex: 1 
    },
    closeButton: { padding: 8, width: 40, alignItems: 'center', justifyContent: 'center' },
    content: { flex: 1, padding: 20 },
    bookingIdContainer: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: 20 
    },
    labelText: { fontSize: fontSizes.labelText, color: colors.textSecondary },
    bookingIdText: { fontSize: fontSizes.bookingIdText, fontWeight: '500', color: colors.text },
    statusContainer: { flexDirection: 'row', gap: 8 },
    serviceTypeContainer: { 
      backgroundColor: colors.primary + '15', 
      padding: 16, 
      borderRadius: 8, 
      marginBottom: 20, 
      flexDirection: 'row', 
      alignItems: 'center' 
    },
    serviceIconContainer: { padding: 8, backgroundColor: colors.card, borderRadius: 8, marginRight: 12 },
    serviceIcon: { fontSize: 24 },
    serviceTextContainer: { flex: 1 },
    serviceLabel: { fontSize: fontSizes.labelText, color: colors.textSecondary },
    serviceTitle: { fontSize: fontSizes.serviceTitle, fontWeight: '700', color: colors.text },
    actionButtonsContainer: { 
      flexDirection: 'row', 
      flexWrap: 'wrap',
      justifyContent: 'space-between', 
      gap: 10, 
      marginBottom: 20 
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
      minHeight: 44 
    },
    actionButtonText: { fontSize: fontSizes.actionButtonText, fontWeight: '600' },
    callButton: { backgroundColor: colors.primary },
    callButtonText: { color: '#FFFFFF' },
    // Payment Button Outline Style
    paymentButtonOutline: { 
      backgroundColor: colors.card, 
      borderWidth: 2, 
      borderColor: colors.error,
      flex: 1 
    },
    paymentButtonOutlineText: { 
      color: colors.error, 
      fontSize: fontSizes.actionButtonText, 
      fontWeight: '600' 
    },
    // Cancel Button Outline Style
    cancelButtonOutline: { 
      backgroundColor: colors.card, 
      borderWidth: 2, 
      borderColor: colors.error,
      flex: 1 
    },
    cancelButtonOutlineText: { 
      color: colors.error, 
      fontSize: fontSizes.actionButtonText, 
      fontWeight: '600' 
    },
    modifyButton: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.primary },
    modifyButtonText: { color: colors.primary, fontSize: fontSizes.actionButtonText, fontWeight: '600' },
    vacationButton: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.primary },
    vacationButtonText: { color: colors.primary, fontSize: fontSizes.actionButtonText, fontWeight: '600' },
    vacationModifiedButton: { backgroundColor: colors.infoLight, borderColor: colors.info },
    vacationModifiedText: { color: colors.primary, fontSize: fontSizes.actionButtonText, fontWeight: '600' },
    disabledButton: { opacity: 0.6 },
    section: { marginBottom: 24 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
    sectionTitle: { fontSize: fontSizes.sectionTitle, fontWeight: '500', color: colors.text },
    scheduleGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
    scheduleItem: { flex: 1, backgroundColor: colors.surface, padding: 12, borderRadius: 8 },
    scheduleLabel: { fontSize: fontSizes.labelText, color: colors.textSecondary, marginBottom: 4 },
    scheduleValue: { fontSize: fontSizes.scheduleValue, fontWeight: '500', color: colors.text },
    timeSlotContainer: { backgroundColor: colors.surface, padding: 12, borderRadius: 8 },
    timeSlotValueContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    providerContainer: { 
      backgroundColor: colors.surface, 
      padding: 16, 
      borderRadius: 8, 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center' 
    },
    providerInfo: { flex: 1 },
    providerName: { fontSize: fontSizes.providerName, fontWeight: '500', color: colors.text },
    ratingBadge: { backgroundColor: colors.warningLight },
    tasksContainer: { gap: 12 },
    tasksSubLabel: { fontSize: fontSizes.labelText, color: colors.textSecondary, marginBottom: 8 },
    tasksList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    mainTaskBadge: { backgroundColor: colors.primary + '15' },
    addonBadge: { backgroundColor: colors.successLight },
    paymentContainer: { backgroundColor: colors.surface, padding: 16, borderRadius: 8 },
    paymentRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    paymentLabel: { fontSize: fontSizes.scheduleValue, color: colors.textSecondary },
    paymentValue: { fontSize: fontSizes.paymentValue, fontWeight: '500', color: colors.text },
    separator: { height: 1, marginVertical: 8 },
    paymentTotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
    paymentTotalLabel: { fontSize: fontSizes.sectionTitle, fontWeight: '700', color: colors.text },
    paymentTotalValue: { fontSize: fontSizes.paymentTotalValue, fontWeight: '700', color: colors.primary },
    paymentStatusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    paymentStatusBadge: { paddingHorizontal: 8, paddingVertical: 4 },
    paymentModeValue: { fontSize: fontSizes.paymentValue, fontWeight: '500', color: colors.text, textTransform: 'capitalize' },
    completePaymentContainer: { marginTop: 16 },
    // Complete Payment Button Outline Style
    completePaymentButtonOutline: { 
      backgroundColor: colors.card, 
      borderWidth: 2, 
      borderColor: colors.error,
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: 16, 
      borderRadius: 8, 
      gap: 8 
    },
    completePaymentButtonOutlineText: { 
      color: colors.error, 
      fontSize: fontSizes.sectionTitle, 
      fontWeight: '600' 
    },
    completePaymentNote: { fontSize: fontSizes.labelText, color: colors.textSecondary, textAlign: 'center', marginTop: 8 },
    invoiceButtonContainer: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
    invoiceButton: { 
      backgroundColor: 'transparent', 
      borderWidth: 1, 
      borderColor: colors.primary, 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'center', 
      padding: 16, 
      borderRadius: 8, 
      gap: 8 
    },
    invoiceButtonText: { color: colors.primary, fontSize: fontSizes.sectionTitle, fontWeight: '600' },
    invoiceNote: { fontSize: fontSizes.labelText, color: colors.textSecondary, textAlign: 'center', marginTop: 8 },
    modificationsContainer: { gap: 8 },
    modificationItem: { backgroundColor: colors.warningLight, padding: 12, borderRadius: 8 },
    modificationHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' },
    modificationBadge: { backgroundColor: colors.warning },
    modificationDate: { fontSize: fontSizes.labelText, color: colors.textSecondary },
    refundText: { fontSize: fontSizes.labelText, color: colors.success },
    penaltyText: { fontSize: fontSizes.labelText, color: colors.error },
    additionalInfoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    additionalInfoItem: { flex: 1, minWidth: '40%' },
    additionalInfoLabel: { fontSize: fontSizes.labelText, color: colors.textSecondary, marginBottom: 2 },
    additionalInfoValue: { fontSize: fontSizes.additionalInfoValue, fontWeight: '500', color: colors.text, textTransform: 'capitalize' },
  });

  // ==================== Render ====================
  return (
    <>
      <Modal visible={isOpen} animationType="slide" transparent onRequestClose={onClose}>
        <View style={dynamicStyles.modalOverlay}>
          <TouchableOpacity style={dynamicStyles.overlayTouchable} onPress={onClose} />
          <BottomSheetScaffold
            backgroundColor={colors.background}
            borderColor={colors.border}
            style={dynamicStyles.drawerContainer}
          >
            <LinearGradient 
              colors={["#0a2a66ff", "#004aadff"]} 
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 0 }} 
              style={dynamicStyles.header}
            >
              <View style={dynamicStyles.headerContent}>
                <View style={dynamicStyles.headerLeftPlaceholder} />
                <Text style={dynamicStyles.headerTitle}>Booking Details</Text>
                <TouchableOpacity onPress={onClose} style={dynamicStyles.closeButton}>
                  <Icon name="x" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
            
            <ScrollView style={dynamicStyles.content} showsVerticalScrollIndicator={false}>
              {/* Booking ID and Status */}
              <View style={dynamicStyles.bookingIdContainer}>
                <View>
                  <Text style={dynamicStyles.labelText}>Booking ID</Text>
                  <Text style={dynamicStyles.bookingIdText}>#{booking.id}</Text>
                </View>
                <View style={dynamicStyles.statusContainer}>
                  {getBookingTypeBadge(booking.bookingType)}
                  {getStatusBadge(booking.taskStatus)}
                </View>
              </View>

              {/* Service Type */}
              <View style={dynamicStyles.serviceTypeContainer}>
                <View style={dynamicStyles.serviceIconContainer}>
                  <Text style={dynamicStyles.serviceIcon}>{getServiceIcon(booking.service_type)}</Text>
                </View>
                <View style={dynamicStyles.serviceTextContainer}>
                  <Text style={dynamicStyles.serviceLabel}>Service Type</Text>
                  <Text style={dynamicStyles.serviceTitle}>{getServiceTitle(booking.service_type)}</Text>
                </View>
              </View>

              {/* Action Buttons - Updated with red border style for payment and cancel */}
              {!canShowPaymentButton ? (
                <View style={dynamicStyles.actionButtonsContainer}>
                  {/* Call Button */}
                  <TouchableOpacity 
                    style={[dynamicStyles.actionButton, dynamicStyles.callButton]} 
                    onPress={handleCallProvider} 
                    disabled={isCallLoading}
                  >
                    {isCallLoading ? 
                      <ActivityIndicator size="small" color="#FFFFFF" /> : 
                      <Icon name="phone" size={18} color="#FFFFFF" />
                    }
                    <Text style={[dynamicStyles.actionButtonText, dynamicStyles.callButtonText]}>Call</Text>
                  </TouchableOpacity>
                  
                  {/* Cancel Button (if cancellable) - Now with red border and red text */}
                  {isCancellable() && (
                    <TouchableOpacity 
                      style={[dynamicStyles.actionButton, dynamicStyles.cancelButtonOutline]} 
                      onPress={handleCancelBooking} 
                      disabled={isCancelLoading}
                    >
                      {isCancelLoading ? 
                        <ActivityIndicator size="small" color={colors.error} /> : 
                        <Icon name="x-circle" size={18} color={colors.error} />
                      }
                      <Text style={dynamicStyles.cancelButtonOutlineText}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                  
                  {/* Modify Button - Only for MONTHLY and NOT_STARTED */}
                  {shouldShowModifyButton && (
                    <TouchableOpacity 
                      style={[dynamicStyles.actionButton, dynamicStyles.modifyButton, modificationDisabled && dynamicStyles.disabledButton]} 
                      onPress={handleModifyClick}
                      disabled={modificationDisabled}
                    >
                      <Icon name="edit-2" size={18} color={modificationDisabled ? colors.textSecondary : colors.primary} />
                      <Text style={[dynamicStyles.modifyButtonText, modificationDisabled && { color: colors.textSecondary }]}>Modify</Text>
                    </TouchableOpacity>
                  )}
                  
                  {/* Vacation Button - For MONTHLY bookings that are not cancelled/completed */}
                  {shouldShowVacationButton && (
                    <>
                      {hasExistingVacation ? (
                        <TouchableOpacity 
                          style={[dynamicStyles.actionButton, dynamicStyles.vacationModifiedButton]} 
                          onPress={handleModifyVacation}
                          disabled={isRefreshing}
                        >
                          <Icon name="edit-2" size={18} color={colors.primary} />
                          <Text style={dynamicStyles.vacationModifiedText}>Modify Vacation</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity 
                          style={[dynamicStyles.actionButton, dynamicStyles.vacationButton]} 
                          onPress={handleAddVacation}
                          disabled={isRefreshing}
                        >
                          <Icon name="calendar" size={18} color={colors.primary} />
                          <Text style={dynamicStyles.vacationButtonText}>Add Vacation</Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </View>
              ) : (
                /* Payment Button for pending payments - Now with red border and red text */
                <View style={dynamicStyles.actionButtonsContainer}>
                  <TouchableOpacity 
                    style={[dynamicStyles.actionButton, dynamicStyles.paymentButtonOutline]} 
                    onPress={handleCompletePayment} 
                    disabled={isProcessingPayment}
                  >
                    {isProcessingPayment ? 
                      <ActivityIndicator size="small" color={colors.error} /> : (
                      <>
                        <Icon name="credit-card" size={18} color={colors.error} />
                        <Text style={dynamicStyles.paymentButtonOutlineText}>Complete Payment</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  
                  {isCancellable() && (
                    <TouchableOpacity 
                      style={[dynamicStyles.actionButton, dynamicStyles.cancelButtonOutline]} 
                      onPress={handleCancelBooking} 
                      disabled={isCancelLoading}
                    >
                      {isCancelLoading ? 
                        <ActivityIndicator size="small" color={colors.error} /> : 
                        <Icon name="x-circle" size={18} color={colors.error} />
                      }
                      <Text style={dynamicStyles.cancelButtonOutlineText}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Schedule Information */}
              <View style={dynamicStyles.section}>
                <View style={dynamicStyles.sectionHeader}>
                  <Icon name="calendar" size={20} color={colors.primary} />
                  <Text style={dynamicStyles.sectionTitle}>Schedule</Text>
                </View>
                <View style={dynamicStyles.scheduleGrid}>
                  <View style={dynamicStyles.scheduleItem}>
                    <Text style={dynamicStyles.scheduleLabel}>Start Date</Text>
                    <Text style={dynamicStyles.scheduleValue}>{formatDate(booking.startDate)}</Text>
                  </View>
                  <View style={dynamicStyles.scheduleItem}>
                    <Text style={dynamicStyles.scheduleLabel}>End Date</Text>
                    <Text style={dynamicStyles.scheduleValue}>{formatDate(booking.endDate)}</Text>
                  </View>
                </View>
                <View style={dynamicStyles.timeSlotContainer}>
                  <Text style={dynamicStyles.scheduleLabel}>Time Slot</Text>
                  <View style={dynamicStyles.timeSlotValueContainer}>
                    <Icon name="clock" size={16} color={colors.textSecondary} />
                    <Text style={dynamicStyles.scheduleValue}>
                      {formatTimeToAMPM(booking.start_time)} - {formatTimeToAMPM(booking.end_time)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Provider Information */}
              {isProviderAssigned() && (
                <View style={dynamicStyles.section}>
                  <View style={dynamicStyles.sectionHeader}>
                    <Icon name="user" size={20} color={colors.success} />
                    <Text style={dynamicStyles.sectionTitle}>Service Provider</Text>
                  </View>
                  <View style={dynamicStyles.providerContainer}>
                    <View style={dynamicStyles.providerInfo}>
                      <Text style={dynamicStyles.providerName}>{booking.serviceProviderName}</Text>
                    </View>
                    {booking.providerRating > 0 && (
                      <Badge style={dynamicStyles.ratingBadge}>
                        ⭐ {booking.providerRating.toFixed(1)}
                      </Badge>
                    )}
                  </View>
                </View>
              )}

              {/* Tasks & Responsibilities */}
              <View style={dynamicStyles.section}>
                <View style={dynamicStyles.sectionHeader}>
                  <Icon name="file-text" size={20} color={colors.info} />
                  <Text style={dynamicStyles.sectionTitle}>Tasks & Responsibilities</Text>
                </View>
                <View style={dynamicStyles.tasksContainer}>
                  {booking.responsibilities?.tasks?.length > 0 && (
                    <View>
                      <Text style={dynamicStyles.tasksSubLabel}>Main Tasks</Text>
                      <View style={dynamicStyles.tasksList}>
                        {booking.responsibilities.tasks.map((task: any, index: number) => {
                          const taskDetails = Object.entries(task)
                            .filter(([key]) => key !== 'taskType')
                            .map(([key, value]) => `${value} ${key}`)
                            .join(', ');
                          return (
                            <Badge key={index} variant="outline" style={dynamicStyles.mainTaskBadge}>
                              {task.taskType} {taskDetails && `- ${taskDetails}`}
                            </Badge>
                          );
                        })}
                      </View>
                    </View>
                  )}
                  {booking.responsibilities?.add_ons?.length > 0 && (
                    <View>
                      <Text style={dynamicStyles.tasksSubLabel}>Add-ons</Text>
                      <View style={dynamicStyles.tasksList}>
                        {booking.responsibilities.add_ons.map((addon: any, index: number) => (
                          <Badge key={index} variant="outline" style={dynamicStyles.addonBadge}>
                            {addon.taskType}
                          </Badge>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              </View>

              {/* Payment Details */}
              {booking.payment && (
                <View style={dynamicStyles.section}>
                  <View style={dynamicStyles.sectionHeader}>
                    <Icon name="credit-card" size={20} color={colors.warning} />
                    <Text style={dynamicStyles.sectionTitle}>Payment Details</Text>
                  </View>
                  <View style={dynamicStyles.paymentContainer}>
                    <View style={dynamicStyles.paymentRow}>
                      <Text style={dynamicStyles.paymentLabel}>Base Amount</Text>
                      <Text style={dynamicStyles.paymentValue}>₹{booking.payment.base_amount}</Text>
                    </View>
                    <View style={dynamicStyles.paymentRow}>
                      <Text style={dynamicStyles.paymentLabel}>Platform Fee</Text>
                      <Text style={dynamicStyles.paymentValue}>₹{booking.payment.platform_fee}</Text>
                    </View>
                    <View style={dynamicStyles.paymentRow}>
                      <Text style={dynamicStyles.paymentLabel}>GST</Text>
                      <Text style={dynamicStyles.paymentValue}>₹{booking.payment.gst}</Text>
                    </View>
                    <Separator style={dynamicStyles.separator} />
                    <View style={dynamicStyles.paymentTotalRow}>
                      <Text style={dynamicStyles.paymentTotalLabel}>Total</Text>
                      <Text style={dynamicStyles.paymentTotalValue}>₹{booking.payment.total_amount}</Text>
                    </View>
                    <View style={dynamicStyles.paymentStatusRow}>
                      <Text style={dynamicStyles.paymentLabel}>Payment Status</Text>
                      <Badge style={[dynamicStyles.paymentStatusBadge, getPaymentStatusColor(booking.payment.status)]}>
                        {booking.payment.status}
                      </Badge>
                    </View>
                    <View style={dynamicStyles.paymentRow}>
                      <Text style={dynamicStyles.paymentLabel}>Payment Mode</Text>
                      <Text style={dynamicStyles.paymentModeValue}>{booking.payment.payment_mode}</Text>
                    </View>
                    {booking.payment.transaction_id && (
                      <View style={dynamicStyles.paymentRow}>
                        <Text style={dynamicStyles.paymentLabel}>Transaction ID</Text>
                        <Text style={dynamicStyles.paymentValue}>{booking.payment.transaction_id}</Text>
                      </View>
                    )}
                    
                    {booking.payment.status === 'PENDING' && booking.taskStatus !== 'CANCELLED' && (
                      <View style={dynamicStyles.completePaymentContainer}>
                        <TouchableOpacity 
                          style={dynamicStyles.completePaymentButtonOutline} 
                          onPress={handleCompletePayment} 
                          disabled={isProcessingPayment}
                        >
                          {isProcessingPayment ? 
                            <ActivityIndicator size="small" color={colors.error} /> : (
                            <>
                              <Icon name="credit-card" size={20} color={colors.error} />
                              <Text style={dynamicStyles.completePaymentButtonOutlineText}>Complete Payment Now</Text>
                            </>
                          )}
                        </TouchableOpacity>
                        <Text style={dynamicStyles.completePaymentNote}>Complete payment to confirm your booking</Text>
                      </View>
                    )}
                    
                    {booking.payment.status === 'SUCCESS' && (
                      <View style={dynamicStyles.invoiceButtonContainer}>
                        <TouchableOpacity 
                          style={dynamicStyles.invoiceButton} 
                          onPress={handleDownloadInvoice}
                        >
                          <Icon name="file-text" size={20} color={colors.primary} />
                          <Text style={dynamicStyles.invoiceButtonText}>View & Download Invoice</Text>
                        </TouchableOpacity>
                        <Text style={dynamicStyles.invoiceNote}>Click to view full invoice and download PDF</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Modification History */}
              {booking.modifications?.length > 0 && (
                <View style={dynamicStyles.section}>
                  <View style={dynamicStyles.sectionHeader}>
                    <Icon name="alert-circle" size={20} color={colors.warning} />
                    <Text style={dynamicStyles.sectionTitle}>Modification History</Text>
                  </View>
                  <View style={dynamicStyles.modificationsContainer}>
                    {booking.modifications.map((mod: any, index: number) => (
                      <View key={index} style={dynamicStyles.modificationItem}>
                        <View style={dynamicStyles.modificationHeader}>
                          <Badge style={dynamicStyles.modificationBadge}>{mod.action}</Badge>
                          <Text style={dynamicStyles.modificationDate}>
                            {dayjs(mod.date).format('MMM D, YYYY h:mm A')}
                          </Text>
                        </View>
                        {mod.refund && <Text style={dynamicStyles.refundText}>Refund: ₹{mod.refund}</Text>}
                        {mod.penalty && <Text style={dynamicStyles.penaltyText}>Penalty: ₹{mod.penalty}</Text>}
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Additional Information */}
              <View style={dynamicStyles.section}>
                <View style={dynamicStyles.sectionHeader}>
                  <Icon name="tag" size={20} color={colors.textSecondary} />
                  <Text style={dynamicStyles.sectionTitle}>Additional Information</Text>
                </View>
                <View style={dynamicStyles.additionalInfoGrid}>
                  <View style={dynamicStyles.additionalInfoItem}>
                    <Text style={dynamicStyles.additionalInfoLabel}>Booking Date</Text>
                    <Text style={dynamicStyles.additionalInfoValue}>
                      {dayjs(booking.bookingDate).format('MMM D, YYYY')}
                    </Text>
                  </View>
                  <View style={dynamicStyles.additionalInfoItem}>
                    <Text style={dynamicStyles.additionalInfoLabel}>Assignment Status</Text>
                    <Text style={dynamicStyles.additionalInfoValue}>{booking.assignmentStatus}</Text>
                  </View>
                  {booking.leave_days > 0 && (
                    <View style={dynamicStyles.additionalInfoItem}>
                      <Text style={dynamicStyles.additionalInfoLabel}>Leave Days</Text>
                      <Text style={dynamicStyles.additionalInfoValue}>{booking.leave_days}</Text>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>
          </BottomSheetScaffold>
        </View>
      </Modal>

      {/* Invoice Modal */}
      <Modal
        visible={showInvoiceModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowInvoiceModal(false)}
      >
        <Invoice booking={booking} onClose={() => setShowInvoiceModal(false)} />
      </Modal>

      {/* Vacation Dialogs */}
      <UserHoliday 
        open={holidayDialogOpen} 
        onClose={() => setHolidayDialogOpen(false)} 
        booking={convertBookingForChildComponents(booking)} 
        onLeaveSubmit={handleLeaveSubmit} 
      />
      
      <VacationManagementDialog 
        open={vacationManagementDialogOpen} 
        onClose={() => { 
          setVacationManagementDialogOpen(false); 
        }} 
        booking={convertBookingForChildComponents(booking)} 
        customerId={customerId ?? null}
        onSuccess={handleVacationSuccess} 
      />

      {/* Cancel Dialog */}
      <CancelDialog
        visible={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        onConfirm={confirmCancelBooking}
        serviceName={getServiceTitle(booking.service_type)}
        isLoading={isCancelLoading}
      />
    </>
  );
};

// ==================== Global Styles ====================
const styles = StyleSheet.create({
  badge: { 
    paddingHorizontal: 8, 
    paddingVertical: 4, 
    borderRadius: 4, 
    alignSelf: 'flex-start' 
  },
  badgeOutline: { 
    backgroundColor: 'transparent', 
    borderWidth: 1 
  },
  badgeText: { 
    fontWeight: '500' 
  },
  badgeOutlineText: { 
    fontWeight: '500' 
  },
  separator: { 
    height: 1 
  },
  // Badge styles for booking type
  onDemandBadge: { paddingHorizontal: 8, paddingVertical: 4 },
  onDemandBadgeText: { fontWeight: '600' },
  monthlyBadge: { paddingHorizontal: 8, paddingVertical: 4 },
  monthlyBadgeText: { fontWeight: '600' },
  shortTermBadge: { paddingHorizontal: 8, paddingVertical: 4 },
  shortTermBadgeText: { fontWeight: '600' },
  defaultBadge: { paddingHorizontal: 8, paddingVertical: 4 },
  defaultBadgeText: { fontWeight: '600' },
  // Badge styles for status
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
    alignItems: 'center' 
  },
  dialogContainer: { 
    width: width - 48, 
    borderRadius: 12, 
    overflow: 'hidden', 
    elevation: 5, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.25, 
    shadowRadius: 3.84 
  },
  header: { 
    paddingVertical: 16, 
    paddingHorizontal: 20 
  },
  headerContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12 
  },
  headerTitle: { 
    fontWeight: '600', 
    color: '#FFFFFF' 
  },
  content: { 
    padding: 20 
  },
  message: { 
    lineHeight: 20, 
    marginBottom: 24, 
    textAlign: 'center' 
  },
  buttonContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    gap: 12 
  },
  button: { 
    flex: 1, 
    paddingVertical: 12, 
    borderRadius: 8, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  cancelButton: { 
    borderWidth: 1, 
    backgroundColor: 'transparent' 
  },
  confirmButton: { 
    backgroundColor: '#FF3B30' 
  },
  buttonText: { 
    fontWeight: '600' 
  },
});

export default EngagementDetailsDrawer;