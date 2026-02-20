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
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { getServiceTitle, getBookingTypeBadge, getStatusBadge } from '../common/BookingUtils';
import dayjs from 'dayjs';
import PaymentInstance from '../services/paymentInstance';
import { Button } from '../common/Button';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

interface EngagementDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  booking: any; // Replace with proper Booking type
  onPaymentComplete?: () => void; // Callback to refresh bookings after payment
}

// Built-in Badge Component
const Badge: React.FC<{
  children: React.ReactNode;
  variant?: 'default' | 'outline';
  style?: any;
}> = ({ children, variant = 'default', style }) => {
  const badgeStyles = [
    styles.badge,
    variant === 'outline' && styles.badgeOutline,
    style,
  ];
  
  return (
    <View style={badgeStyles}>
      <Text style={[
        styles.badgeText,
        variant === 'outline' && styles.badgeOutlineText
      ]}>
        {children}
      </Text>
    </View>
  );
};

// Built-in Separator Component
const Separator: React.FC<{ style?: any }> = ({ style }) => {
  return <View style={[styles.separator, style]} />;
};

// Built-in DialogHeader Component
const DialogHeader: React.FC<{
  children: React.ReactNode;
  style?: any;
}> = ({ children, style }) => {
  return <View style={[styles.dialogHeader, style]}>{children}</View>;
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

const formatDate = (dateString: string) => {
  return dayjs(dateString).format('MMMM D, YYYY');
};

const EngagementDetailsDrawer: React.FC<EngagementDetailsDrawerProps> = ({ 
  isOpen, 
  onClose, 
  booking,
  onPaymentComplete 
}) => {
  const [isProcessingPayment, setIsProcessingPayment] = React.useState(false);

  if (!isOpen || !booking) return null;

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'SUCCESS': return styles.paymentSuccess;
      case 'PENDING': return styles.paymentPending;
      case 'FAILED': return styles.paymentFailed;
      default: return styles.paymentDefault;
    }
  };

  const handleCompletePayment = async () => {
    try {
      setIsProcessingPayment(true);
      
      const resumeRes = await PaymentInstance.get(
        `/api/payments/${booking.payment?.engagement_id}/resume`
      );

      const {
        razorpay_order_id,
        amount,
        currency,
        engagement_id,
        customer
      } = resumeRes.data;

      const options = {
        key: "rzp_test_lTdgjtSRlEwreA",
        amount: amount * 100,
        currency,
        order_id: razorpay_order_id,
        name: "Serveaso",
        description: "Complete your payment",
        prefill: {
          name: customer?.firstname || booking.customerName,
          contact: customer?.contact || '9999999999',
        },
        handler: async function (response: any) {
          try {
            await PaymentInstance.post("/api/payments/verify", {
              engagementId: engagement_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            
            if (onPaymentComplete) {
              onPaymentComplete();
            }
            
            console.log('Payment completed successfully');
            
          } catch (verifyError) {
            console.error("Payment verification error:", verifyError);
            Alert.alert("Error", "Payment verification failed. Please contact support.");
          }
        },
        theme: {
          color: "#0A7CFF",
        },
      };

      // Note: You'll need to integrate Razorpay SDK for React Native
      // This is a placeholder - actual implementation will depend on the Razorpay React Native package
      Alert.alert("Info", "Razorpay integration requires react-native-razorpay package");
      
    } catch (err: any) {
      console.error("Complete payment error:", err);
      Alert.alert("Error", "Unable to resume payment. Please try again.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const getServiceIcon = (serviceType: string) => {
    switch (serviceType) {
      case 'maid': return '🧹';
      case 'cook': return '👩‍🍳';
      case 'nanny': return '❤️';
      default: return '🧹';
    }
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.overlayTouchable} onPress={onClose} />
       
        <View style={styles.drawerContainer}>
          {/* Header */}
          {/* <DialogHeader style={styles.header}> */}
        {/* Header */}
<LinearGradient
  colors={["#0a2a66ff", "#004aadff"]}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 0 }}
  style={styles.header}
>
  <View style={styles.headerContent}>
    <View style={styles.headerLeftPlaceholder} />
    <Text style={styles.headerTitle}>Booking Details</Text>
    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
      <Icon name="x" size={24} color="#FFFFFF" />
    </TouchableOpacity>
  </View>
</LinearGradient>
          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Booking ID and Status */}
            <View style={styles.bookingIdContainer}>
              <View>
                <Text style={styles.labelText}>Booking ID</Text>
                <Text style={styles.bookingIdText}>#{booking.id}</Text>
              </View>
              <View style={styles.statusContainer}>
                {getBookingTypeBadge(booking.bookingType)}
                {getStatusBadge(booking.taskStatus)}
              </View>
            </View>

            {/* Service Type */}
            <View style={styles.serviceTypeContainer}>
              <View style={styles.serviceIconContainer}>
                <Text style={styles.serviceIcon}>
                  {getServiceIcon(booking.service_type)}
                </Text>
              </View>
              <View style={styles.serviceTextContainer}>
                <Text style={styles.serviceLabel}>Service Type</Text>
                <Text style={styles.serviceTitle}>{getServiceTitle(booking.service_type)}</Text>
              </View>
            </View>

            {/* Schedule Information */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="calendar" size={20} color="#3B82F6" />
                <Text style={styles.sectionTitle}>Schedule</Text>
              </View>
              
              <View style={styles.scheduleGrid}>
                <View style={styles.scheduleItem}>
                  <Text style={styles.scheduleLabel}>Start Date</Text>
                  <Text style={styles.scheduleValue}>{formatDate(booking.startDate)}</Text>
                </View>
                <View style={styles.scheduleItem}>
                  <Text style={styles.scheduleLabel}>End Date</Text>
                  <Text style={styles.scheduleValue}>{formatDate(booking.endDate)}</Text>
                </View>
              </View>

              <View style={styles.timeSlotContainer}>
                <Text style={styles.scheduleLabel}>Time Slot</Text>
                <View style={styles.timeSlotValueContainer}>
                  <Icon name="clock" size={16} color="#9CA3AF" />
                  <Text style={styles.scheduleValue}>
                    {formatTimeToAMPM(booking.start_time)} - {formatTimeToAMPM(booking.end_time)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Provider Information */}
            {booking.serviceProviderName && booking.serviceProviderName !== 'Not Assigned' && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Icon name="user" size={20} color="#10B981" />
                  <Text style={styles.sectionTitle}>Service Provider</Text>
                </View>
                
                <View style={styles.providerContainer}>
                  <View style={styles.providerInfo}>
                    <Text style={styles.providerName}>{booking.serviceProviderName}</Text>
                  </View>
                  {booking.providerRating > 0 && (
                    <Badge style={styles.ratingBadge}>
                      ⭐ {booking.providerRating.toFixed(1)}
                    </Badge>
                  )}
                </View>
              </View>
            )}

            {/* Tasks & Responsibilities */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="file-text" size={20} color="#8B5CF6" />
                <Text style={styles.sectionTitle}>Tasks & Responsibilities</Text>
              </View>
              
              <View style={styles.tasksContainer}>
                {/* Main Tasks */}
                {booking.responsibilities?.tasks && booking.responsibilities.tasks.length > 0 && (
                  <View>
                    <Text style={styles.tasksSubLabel}>Main Tasks</Text>
                    <View style={styles.tasksList}>
                      {booking.responsibilities.tasks.map((task: any, index: number) => {
                        const taskDetails = Object.entries(task)
                          .filter(([key]) => key !== 'taskType')
                          .map(([key, value]) => `${value} ${key}`)
                          .join(', ');
                        
                        return (
                          <Badge key={index} variant="outline" style={styles.mainTaskBadge}>
                            {task.taskType} {taskDetails && `- ${taskDetails}`}
                          </Badge>
                        );
                      })}
                    </View>
                  </View>
                )}

                {/* Add-ons */}
                {booking.responsibilities?.add_ons && booking.responsibilities.add_ons.length > 0 && (
                  <View>
                    <Text style={styles.tasksSubLabel}>Add-ons</Text>
                    <View style={styles.tasksList}>
                      {booking.responsibilities.add_ons.map((addon: any, index: number) => (
                        <Badge key={index} variant="outline" style={styles.addonBadge}>
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
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Icon name="credit-card" size={20} color="#F97316" />
                  <Text style={styles.sectionTitle}>Payment Details</Text>
                </View>
                
                <View style={styles.paymentContainer}>
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Base Amount</Text>
                    <Text style={styles.paymentValue}>₹{booking.payment.base_amount}</Text>
                  </View>
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Platform Fee</Text>
                    <Text style={styles.paymentValue}>₹{booking.payment.platform_fee}</Text>
                  </View>
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>GST</Text>
                    <Text style={styles.paymentValue}>₹{booking.payment.gst}</Text>
                  </View>
                  <Separator style={styles.separator} />
                  <View style={styles.paymentTotalRow}>
                    <Text style={styles.paymentTotalLabel}>Total</Text>
                    <Text style={styles.paymentTotalValue}>₹{booking.payment.total_amount}</Text>
                  </View>
                  
                  <View style={styles.paymentStatusRow}>
                    <Text style={styles.paymentLabel}>Payment Status</Text>
                    <Badge style={[styles.paymentStatusBadge, getPaymentStatusColor(booking.payment.status)]}>
                      {booking.payment.status}
                    </Badge>
                  </View>
                  
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Payment Mode</Text>
                    <Text style={styles.paymentModeValue}>{booking.payment.payment_mode}</Text>
                  </View>

                  {/* Complete Payment Button - Show only for PENDING status */}
                  {booking.payment.status === 'PENDING' && booking.taskStatus !== 'CANCELLED' && (
                    <View style={styles.completePaymentContainer}>
                      <Button
                        variant="primary"
                        size="large"
                        onPress={handleCompletePayment}
                        disabled={isProcessingPayment}
                        style={styles.completePaymentButton}
                      >
                        {isProcessingPayment ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Icon name="credit-card" size={20} color="#FFFFFF" />
                            <Text style={styles.completePaymentText}>Complete Payment Now</Text>
                          </>
                        )}
                      </Button>
                      <Text style={styles.completePaymentNote}>
                        Complete payment to confirm your booking
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Modification History */}
            {booking.modifications && booking.modifications.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Icon name="alert-circle" size={20} color="#EAB308" />
                  <Text style={styles.sectionTitle}>Modification History</Text>
                </View>
                
                <View style={styles.modificationsContainer}>
                  {booking.modifications.map((mod: any, index: number) => (
                    <View key={index} style={styles.modificationItem}>
                      <View style={styles.modificationHeader}>
                        <Badge style={styles.modificationBadge}>
                          {mod.action}
                        </Badge>
                        <Text style={styles.modificationDate}>
                          {dayjs(mod.date).format('MMM D, YYYY h:mm A')}
                        </Text>
                      </View>
                      {mod.refund && (
                        <Text style={styles.refundText}>Refund: ₹{mod.refund}</Text>
                      )}
                      {mod.penalty && (
                        <Text style={styles.penaltyText}>Penalty: ₹{mod.penalty}</Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Additional Information */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Icon name="tag" size={20} color="#6B7280" />
                <Text style={styles.sectionTitle}>Additional Information</Text>
              </View>
              
              <View style={styles.additionalInfoGrid}>
                <View style={styles.additionalInfoItem}>
                  <Text style={styles.additionalInfoLabel}>Booking Date</Text>
                  <Text style={styles.additionalInfoValue}>
                    {dayjs(booking.bookingDate).format('MMM D, YYYY')}
                  </Text>
                </View>
                <View style={styles.additionalInfoItem}>
                  <Text style={styles.additionalInfoLabel}>Assignment Status</Text>
                  <Text style={styles.additionalInfoValue}>
                    {booking.assignmentStatus}
                  </Text>
                </View>
                {booking.leave_days > 0 && (
                  <View style={styles.additionalInfoItem}>
                    <Text style={styles.additionalInfoLabel}>Leave Days</Text>
                    <Text style={styles.additionalInfoValue}>{booking.leave_days}</Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
      
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
  },
  drawerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '90%',
    width: '100%',
  },
  dialogHeader: {
    backgroundColor: '#111827',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
header: {
  // Your existing header styles
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
},
headerContent: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 16,
  paddingVertical: 12,
  width: '100%',
},
headerLeftPlaceholder: {
  width: 40, // Same width as close button to maintain center alignment
},
headerTitle: {
  fontSize: 20,
  fontWeight: '600',
  color: '#FFFFFF',
  textAlign: 'center',
  flex: 1, // Takes up available space
},
closeButton: {
  padding: 8,
  width: 40, // Fixed width for consistent alignment
  alignItems: 'center',
  justifyContent: 'center',
},
  content: {
    flex: 1,
    padding: 20,
  },
  bookingIdContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  labelText: {
    fontSize: 12,
    color: '#6B7280',
  },
  bookingIdText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#111827',
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  serviceTypeContainer: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  serviceIconContainer: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginRight: 12,
  },
  serviceIcon: {
    fontSize: 24,
  },
  serviceTextContainer: {
    flex: 1,
  },
  serviceLabel: {
    fontSize: 12,
    color: '#4B5563',
  },
  serviceTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  scheduleGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  scheduleItem: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  scheduleLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 4,
  },
  scheduleValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  timeSlotContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  timeSlotValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  providerContainer: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  ratingBadge: {
    backgroundColor: '#FEF3C7',
  },
  tasksContainer: {
    gap: 12,
  },
  tasksSubLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  tasksList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mainTaskBadge: {
    backgroundColor: '#EFF6FF',
  },
  addonBadge: {
    backgroundColor: '#F0FDF4',
  },
  paymentContainer: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#4B5563',
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  paymentTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  paymentTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  paymentTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563EB',
  },
  paymentStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  paymentStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  paymentModeValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    textTransform: 'capitalize',
  },
  paymentSuccess: {
    backgroundColor: '#F0FDF4',
    color: '#16A34A',
  },
  paymentPending: {
    backgroundColor: '#FEFCE8',
    color: '#CA8A04',
  },
  paymentFailed: {
    backgroundColor: '#FEF2F2',
    color: '#DC2626',
  },
  paymentDefault: {
    backgroundColor: '#F9FAFB',
    color: '#4B5563',
  },
  completePaymentContainer: {
    marginTop: 16,
  },
  completePaymentButton: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  completePaymentText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  completePaymentNote: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
  modificationsContainer: {
    gap: 8,
  },
  modificationItem: {
    backgroundColor: '#FEFCE8',
    padding: 12,
    borderRadius: 8,
  },
  modificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  modificationBadge: {
    backgroundColor: '#FEF08A',
  },
  modificationDate: {
    fontSize: 10,
    color: '#6B7280',
  },
  refundText: {
    fontSize: 12,
    color: '#16A34A',
  },
  penaltyText: {
    fontSize: 12,
    color: '#DC2626',
  },
  additionalInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  additionalInfoItem: {
    flex: 1,
    minWidth: '40%',
  },
  additionalInfoLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 2,
  },
  additionalInfoValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
    textTransform: 'capitalize',
  },
  // Badge styles
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    alignSelf: 'flex-start',
  },
  badgeOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  badgeOutlineText: {
    color: '#4B5563',
  },
});

export default EngagementDetailsDrawer;