import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import ConfirmationDialog from './ConfirmationDialog';

interface Booking {
  id: number;
  serviceType: string;
  startDate: string;
  endDate: string;
  bookingType: string;
}

interface UserHolidayProps {
  open: boolean;
  onClose: () => void;
  booking: Booking | null;
  onLeaveSubmit: (startDate: string, endDate: string, serviceType: string) => Promise<void>;
}

const UserHoliday: React.FC<UserHolidayProps> = ({ open, onClose, booking, onLeaveSubmit }) => {
  const [leaveStartDate, setLeaveStartDate] = useState<Date | null>(null);
  const [leaveEndDate, setLeaveEndDate] = useState<Date | null>(null);
  const [minDate, setMinDate] = useState<Date | undefined>();
  const [maxDate, setMaxDate] = useState<Date | undefined>();
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const getServiceTitle = (serviceType: string) => {
    const serviceMap: { [key: string]: string } = {
      'homeCook': 'Home Cook',
      'maid': 'Maid',
      'careGiver': 'Care Giver',
      'nanny': 'Nanny'
    };
    return serviceMap[serviceType] || serviceType;
  };

  useEffect(() => {
    if (booking) {
      const start = new Date(booking.startDate);
      const end = new Date(booking.endDate);

      // ✅ Ensure start date cannot be in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const effectiveMin = start < today ? today : start;

      setMinDate(effectiveMin);
      setMaxDate(end);
      setLeaveStartDate(effectiveMin);
      setLeaveEndDate(null);
    }
  }, [booking]);

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(false);
    if (selectedDate) {
      setLeaveStartDate(selectedDate);
      setLeaveEndDate(null); // reset end date when start date changes
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(false);
    if (selectedDate) {
      setLeaveEndDate(selectedDate);
    }
  };

  const handleSubmit = () => {
    if (!leaveStartDate || !leaveEndDate || !booking?.serviceType) return;

    if (leaveStartDate < minDate! || leaveEndDate > maxDate!) {
      Alert.alert('Error', 'Holiday dates must be within your booked period');
      return;
    }

    const diffInDays = Math.floor((leaveEndDate.getTime() - leaveStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (diffInDays < 10) {
      Alert.alert('Error', 'Leave duration must be at least 10 days');
      return;
    }

    onClose();
    setShowConfirmation(true);
  };

  const handleConfirmSubmit = async () => {
    if (!leaveStartDate || !leaveEndDate || !booking?.serviceType) return;

    setIsSubmitting(true);
    try {
      await onLeaveSubmit(
        dayjs(leaveStartDate).format('YYYY-MM-DD'),
        dayjs(leaveEndDate).format('YYYY-MM-DD'),
        booking.serviceType
      );
      setSnackbarOpen(true);
      setShowConfirmation(false);
      onClose();
    } catch (error) {
      console.error("Error submitting leave:", error);
      Alert.alert('Error', 'Failed to submit leave application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  interface ButtonProps {
    children: React.ReactNode;
    onPress: () => void;
    variant?: 'primary' | 'outline';
    disabled?: boolean;
  }

  const Button: React.FC<ButtonProps> = ({ children, onPress, variant = 'primary', disabled = false }) => {
    const isOutline = variant === 'outline';
    
    return (
      <TouchableOpacity
        style={[
          styles.button,
          isOutline ? styles.outlineButton : styles.primaryButton,
          disabled && styles.disabledButton,
        ]}
        onPress={onPress}
        disabled={disabled}
      >
        <Text style={[
          styles.buttonText,
          isOutline ? styles.outlineButtonText : styles.primaryButtonText,
          disabled && styles.disabledText
        ]}>
          {children}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Modal
        visible={open}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.overlay}>
            <View style={styles.dialogContainer}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.dialogTitle}>Apply Holiday</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeIcon}>×</Text>
                </TouchableOpacity>
              </View>

              {/* Content */}
              <ScrollView style={styles.content}>
                <View style={styles.datePickerContainer}>
                  {/* Start Date Picker */}
                  <TouchableOpacity 
                    style={styles.dateInput}
                    onPress={() => setShowStartPicker(true)}
                  >
                    <Text style={styles.dateLabel}>Start Date</Text>
                    <Text style={styles.dateValue}>
                      {leaveStartDate ? dayjs(leaveStartDate).format('MMMM DD, YYYY') : 'Select start date'}
                    </Text>
                  </TouchableOpacity>

                  {/* End Date Picker */}
                  <TouchableOpacity 
                    style={styles.dateInput}
                    onPress={() => setShowEndPicker(true)}
                    disabled={!leaveStartDate}
                  >
                    <Text style={styles.dateLabel}>End Date</Text>
                    <Text style={[
                      styles.dateValue,
                      !leaveStartDate && styles.disabledText
                    ]}>
                      {leaveEndDate ? dayjs(leaveEndDate).format('MMMM DD, YYYY') : 'Select end date'}
                    </Text>
                  </TouchableOpacity>

                  {showStartPicker && (
                    <DateTimePicker
                      value={leaveStartDate || new Date()}
                      mode="date"
                      display="default"
                      minimumDate={minDate}
                      maximumDate={maxDate}
                      onChange={handleStartDateChange}
                    />
                  )}

                  {showEndPicker && (
                    <DateTimePicker
                      value={leaveEndDate || leaveStartDate || new Date()}
                      mode="date"
                      display="default"
                      minimumDate={leaveStartDate ? new Date(leaveStartDate.getTime() + 9 * 24 * 60 * 60 * 1000) : minDate}
                      maximumDate={maxDate}
                      onChange={handleEndDateChange}
                    />
                  )}

                  {/* Helper message */}
                  <Text style={styles.helperText}>
                    📌 Note: Holiday applications must be for a minimum of 10 days.  
                    You can only select an end date that is at least 9 days after your start date.
                  </Text>

                  {booking && (
                    <View style={styles.bookingInfo}>
                      <Text style={styles.bookingText}>
                        Your booked period: {dayjs(booking.startDate).format('DD/MM/YYYY')} to {dayjs(booking.endDate).format('DD/MM/YYYY')}
                      </Text>
                      <Text style={styles.bookingText}>
                        Service Type: {booking.serviceType}
                      </Text>
                      <Text style={styles.bookingText}>
                        Booking Type: {booking.bookingType}
                      </Text>
                    </View>
                  )}
                </View>
              </ScrollView>

              {/* Actions */}
              <View style={styles.actions}>
                <Button
                  variant="outline"
                  onPress={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  onPress={handleSubmit}
                  disabled={isSubmitting || !leaveStartDate || !leaveEndDate}
                >
                  Submit
                </Button>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      <ConfirmationDialog
        open={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        onConfirm={handleConfirmSubmit}
        title="Confirm Vacation Application"
        message={`Are you sure you want to apply for vacation from ${leaveStartDate ? dayjs(leaveStartDate).format('MMMM DD, YYYY') : ''} to ${leaveEndDate ? dayjs(leaveEndDate).format('MMMM DD, YYYY') : ''} for your ${getServiceTitle(booking?.serviceType || '')} service?`}
        confirmText="Yes, Apply"
        cancelText="Cancel"
        loading={isSubmitting}
        severity="info"
      />

      {/* Snackbar equivalent */}
      {snackbarOpen && (
        <View style={styles.snackbar}>
          <Text style={styles.snackbarText}>Vacation application submitted successfully!</Text>
          <TouchableOpacity onPress={() => setSnackbarOpen(false)}>
            <Text style={styles.snackbarClose}>×</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dialogTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  closeButton: {
    padding: 4,
  },
  closeIcon: {
    fontSize: 24,
    color: '#9ca3af',
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
    maxHeight: 400,
  },
  datePickerContainer: {
    gap: 16,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    backgroundColor: 'white',
  },
  dateLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  helperText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginTop: 8,
  },
  bookingInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
  },
  bookingText: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  primaryButtonText: {
    color: 'white',
  },
  outlineButtonText: {
    color: '#374151',
  },
  disabledButton: {
    opacity: 0.6,
  },
  disabledText: {
    opacity: 0.6,
  },
  snackbar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#10b981',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  snackbarText: {
    color: 'white',
    fontWeight: '500',
  },
  snackbarClose: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

export default UserHoliday;