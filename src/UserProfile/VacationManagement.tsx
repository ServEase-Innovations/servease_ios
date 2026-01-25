import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TextInput,
  Platform,
} from 'react-native';
import dayjs from 'dayjs';
import DateTimePicker from '@react-native-community/datetimepicker';
import PaymentInstance from '../services/paymentInstance'; // Adjust path as needed

interface VacationDetails {
  leave_start_date?: string;
  leave_end_date?: string;
  total_days?: number;
}

interface VacationBooking {
  id: number;
  vacationDetails?: VacationDetails;
}

interface VacationManagementDialogProps {
  open: boolean;
  onClose: () => void;
  booking: VacationBooking | null;
  customerId: number | null;
  onSuccess: () => void;
}

const VacationManagementDialog: React.FC<VacationManagementDialogProps> = ({
  open,
  onClose,
  booking,
  customerId,
  onSuccess,
}) => {
  const today = dayjs();
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Calculate total days between start and end date
  const calculateTotalDays = (): number => {
    if (!startDate || !endDate) return 0;
    return endDate.diff(startDate, 'day') + 1;
  };

  const totalDays = calculateTotalDays();

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open && booking) {
      if (booking.vacationDetails?.leave_start_date && booking.vacationDetails?.leave_end_date) {
        setStartDate(dayjs(booking.vacationDetails.leave_start_date));
        setEndDate(dayjs(booking.vacationDetails.leave_end_date));
      } else {
        setStartDate(null);
        setEndDate(null);
      }
      setError(null);
      setSuccess(null);
    }
  }, [open, booking]);

  const handleApplyVacation = async () => {
    if (!startDate || !endDate || !booking) {
      setError("Please select both start and end dates");
      return;
    }

    if (startDate.isBefore(today, 'day')) {
      setError("Vacation start date cannot be in the past");
      return;
    }

    if (endDate.isBefore(startDate)) {
      setError("Vacation end date must be after start date");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        vacation_start_date: startDate.format("YYYY-MM-DD"),
        vacation_end_date: endDate.format("YYYY-MM-DD"),
        modified_by_id: customerId,
        modified_by_role: "CUSTOMER",
      };

      console.log("📦 Applying vacation:", payload);

      const response = await PaymentInstance.put(
        `/api/engagements/${booking.id}`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      setSuccess("Vacation applied successfully!");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (error) {
      console.error("❌ Error applying vacation:", error);
      setError("Failed to apply vacation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelVacation = async () => {
    if (!booking) return;

    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        cancel_vacation: true,
        modified_by_id: customerId,
        modified_by_role: "CUSTOMER",
      };

      console.log("📦 Canceling vacation:", payload);

      const response = await PaymentInstance.put(
        `/api/engagements/${booking.id}`,
        payload,
        { headers: { "Content-Type": "application/json" } }
      );

      setSuccess("Vacation cancelled successfully!");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (error) {
      console.error("❌ Error canceling vacation:", error);
      setError("Failed to cancel vacation. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartPicker(false);
    if (selectedDate) {
      const newStartDate = dayjs(selectedDate);
      setStartDate(newStartDate);
      // If end date is before new start date, reset end date
      if (endDate && endDate.isBefore(newStartDate)) {
        setEndDate(null);
      }
    }
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndPicker(false);
    if (selectedDate) {
      setEndDate(dayjs(selectedDate));
    }
  };

  const formatDateDisplay = (date: dayjs.Dayjs | null): string => {
    return date ? date.format('MMM D, YYYY') : 'Select date';
  };

  const getMinEndDate = (): Date => {
    return startDate ? startDate.toDate() : today.toDate();
  };

  const hasExistingVacation = booking?.vacationDetails?.leave_start_date && 
                             booking?.vacationDetails?.leave_end_date;

  return (
    <Modal
      visible={open}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.modalTitle}>Manage Vacation</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIcon}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Existing Vacation Info */}
            {hasExistingVacation && (
              <View style={[styles.alert, styles.infoAlert]}>
                <Text style={styles.alertTitle}>Current Vacation Period</Text>
                <Text style={styles.alertText}>
                  {dayjs(booking.vacationDetails?.leave_start_date).format("MMM D, YYYY")} 
                  {" to "}
                  {dayjs(booking.vacationDetails?.leave_end_date).format("MMM D, YYYY")}
                </Text>
                <Text style={styles.alertText}>
                  Total days: {booking.vacationDetails?.total_days}
                </Text>
              </View>
            )}

            {/* Alerts */}
            {error && (
              <View style={[styles.alert, styles.errorAlert]}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            
            {success && (
              <View style={[styles.alert, styles.successAlert]}>
                <Text style={styles.successText}>{success}</Text>
              </View>
            )}

            {/* Vacation Date Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                {hasExistingVacation ? "Modify Vacation Dates" : "Apply for Vacation"}
              </Text>
              
              {/* Start Date Picker */}
              <View style={styles.datePickerContainer}>
                <Text style={styles.dateLabel}>Vacation Start Date</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => setShowStartPicker(true)}
                >
                  <Text style={[
                    styles.dateInputText,
                    !startDate && styles.placeholderText
                  ]}>
                    {formatDateDisplay(startDate)}
                  </Text>
                </TouchableOpacity>
                {showStartPicker && (
                  <DateTimePicker
                    value={startDate?.toDate() || today.toDate()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleStartDateChange}
                    minimumDate={today.toDate()}
                  />
                )}
              </View>

              {/* End Date Picker */}
              <View style={styles.datePickerContainer}>
                <Text style={styles.dateLabel}>Vacation End Date</Text>
                <TouchableOpacity 
                  style={[
                    styles.dateInput,
                    (!startDate && styles.disabledInput)
                  ]}
                  onPress={() => startDate && setShowEndPicker(true)}
                  disabled={!startDate}
                >
                  <Text style={[
                    styles.dateInputText,
                    !endDate && styles.placeholderText,
                    !startDate && styles.disabledText
                  ]}>
                    {formatDateDisplay(endDate)}
                  </Text>
                </TouchableOpacity>
                {showEndPicker && (
                  <DateTimePicker
                    value={endDate?.toDate() || getMinEndDate()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleEndDateChange}
                    minimumDate={getMinEndDate()}
                  />
                )}
              </View>

              {totalDays > 0 && (
                <View style={styles.totalDaysContainer}>
                  <Text style={styles.totalDaysText}>
                    Total vacation days: <Text style={styles.totalDaysBold}>{totalDays}</Text>
                  </Text>
                </View>
              )}
            </View>

            {/* Vacation Policy Info */}
            <View style={styles.policyContainer}>
              <Text style={styles.policyTitle}>Vacation Policy</Text>
              <Text style={styles.policyText}>
                <Text style={styles.policyBold}>Vacation Policy:</Text> During vacation period, services will be paused and 
                applicable refunds will be processed to your wallet. A penalty may apply for modifications 
                to existing vacation periods.
              </Text>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            {hasExistingVacation && (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancelVacation}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel Vacation</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[
                styles.button, 
                styles.applyButton,
                (!startDate || !endDate || isLoading) && styles.disabledButton
              ]}
              onPress={handleApplyVacation}
              disabled={!startDate || !endDate || isLoading}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="white" size="small" />
                  <Text style={styles.buttonText}>
                    {hasExistingVacation ? "Updating..." : "Applying..."}
                  </Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>
                  {hasExistingVacation ? "Update Vacation" : "Apply Vacation"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  closeIcon: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  datePickerContainer: {
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 12,
    backgroundColor: 'white',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  dateInputText: {
    fontSize: 14,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  disabledText: {
    color: '#bdbdbd',
  },
  totalDaysContainer: {
    marginTop: 8,
  },
  totalDaysText: {
    fontSize: 14,
    color: '#1976d2',
  },
  totalDaysBold: {
    fontWeight: 'bold',
  },
  alert: {
    padding: 12,
    borderRadius: 6,
    marginBottom: 16,
  },
  infoAlert: {
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 4,
    borderLeftColor: '#1976d2',
  },
  errorAlert: {
    backgroundColor: '#ffebee',
    borderLeftWidth: 4,
    borderLeftColor: '#d32f2f',
  },
  successAlert: {
    backgroundColor: '#e8f5e9',
    borderLeftWidth: 4,
    borderLeftColor: '#2e7d32',
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#1976d2',
  },
  alertText: {
    fontSize: 13,
    color: '#1976d2',
    lineHeight: 18,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  successText: {
    color: '#2e7d32',
    fontSize: 14,
  },
  policyContainer: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 6,
  },
  policyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#666',
  },
  policyText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  policyBold: {
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 8,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#d32f2f',
    backgroundColor: 'transparent',
  },
  applyButton: {
    backgroundColor: '#1976d2',
  },
  disabledButton: {
    backgroundColor: '#bdbdbd',
  },
  cancelButtonText: {
    color: '#d32f2f',
    fontWeight: '500',
    fontSize: 14,
  },
  buttonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 14,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

export default VacationManagementDialog;