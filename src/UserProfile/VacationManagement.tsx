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
import PaymentInstance from '../services/paymentInstance';
import { useTheme } from '../../src/Settings/ThemeContext';

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
  const { colors, fontSize, isDarkMode } = useTheme();
  const today = dayjs();
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // Get font sizes based on theme
  const getFontSizes = () => {
    switch (fontSize) {
      case 'small':
        return {
          modalTitle: 16,
          sectionTitle: 15,
          dateLabel: 13,
          dateInputText: 13,
          totalDaysText: 13,
          alertTitle: 13,
          alertText: 12,
          errorText: 12,
          successText: 12,
          policyTitle: 13,
          policyText: 11,
          buttonText: 13,
          placeholderText: 13,
        };
      case 'large':
        return {
          modalTitle: 20,
          sectionTitle: 18,
          dateLabel: 16,
          dateInputText: 16,
          totalDaysText: 16,
          alertTitle: 16,
          alertText: 15,
          errorText: 15,
          successText: 15,
          policyTitle: 16,
          policyText: 14,
          buttonText: 16,
          placeholderText: 16,
        };
      default:
        return {
          modalTitle: 18,
          sectionTitle: 16,
          dateLabel: 14,
          dateInputText: 14,
          totalDaysText: 14,
          alertTitle: 14,
          alertText: 13,
          errorText: 14,
          successText: 14,
          policyTitle: 14,
          policyText: 12,
          buttonText: 14,
          placeholderText: 14,
        };
    }
  };

  const fontSizes = getFontSizes();

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

  const dynamicStyles = StyleSheet.create({
    centeredView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.overlay,
    },
    modalView: {
      width: '90%',
      maxHeight: '80%',
      backgroundColor: colors.card,
      borderRadius: 12,
      overflow: 'hidden',
      elevation: 5,
      shadowColor: colors.shadow,
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
      borderBottomColor: colors.border,
    },
    modalTitle: {
      fontSize: fontSizes.modalTitle,
      fontWeight: 'bold',
      color: colors.text,
    },
    closeButton: {
      padding: 4,
    },
    closeIcon: {
      fontSize: 24,
      color: colors.textSecondary,
      fontWeight: 'bold',
    },
    modalContent: {
      padding: 16,
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: fontSizes.sectionTitle,
      fontWeight: '600',
      marginBottom: 16,
      color: colors.text,
    },
    datePickerContainer: {
      marginBottom: 16,
    },
    dateLabel: {
      fontSize: fontSizes.dateLabel,
      fontWeight: '500',
      marginBottom: 8,
      color: colors.text,
    },
    dateInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 6,
      padding: 12,
      backgroundColor: colors.card,
    },
    disabledInput: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
    },
    dateInputText: {
      fontSize: fontSizes.dateInputText,
      color: colors.text,
    },
    placeholderText: {
      color: colors.placeholder,
      fontSize: fontSizes.placeholderText,
    },
    disabledText: {
      color: colors.textTertiary || colors.textSecondary,
    },
    totalDaysContainer: {
      marginTop: 8,
    },
    totalDaysText: {
      fontSize: fontSizes.totalDaysText,
      color: colors.primary,
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
      backgroundColor: colors.infoLight,
      borderLeftWidth: 4,
      borderLeftColor: colors.info,
    },
    errorAlert: {
      backgroundColor: colors.errorLight,
      borderLeftWidth: 4,
      borderLeftColor: colors.error,
    },
    successAlert: {
      backgroundColor: colors.successLight,
      borderLeftWidth: 4,
      borderLeftColor: colors.success,
    },
    alertTitle: {
      fontSize: fontSizes.alertTitle,
      fontWeight: 'bold',
      marginBottom: 4,
      color: colors.info,
    },
    alertText: {
      fontSize: fontSizes.alertText,
      color: colors.info,
      lineHeight: 18,
    },
    errorText: {
      color: colors.error,
      fontSize: fontSizes.errorText,
    },
    successText: {
      color: colors.success,
      fontSize: fontSizes.successText,
    },
    policyContainer: {
      backgroundColor: colors.surface,
      padding: 12,
      borderRadius: 6,
    },
    policyTitle: {
      fontSize: fontSizes.policyTitle,
      fontWeight: 'bold',
      marginBottom: 4,
      color: colors.textSecondary,
    },
    policyText: {
      fontSize: fontSizes.policyText,
      color: colors.textSecondary,
      lineHeight: 16,
    },
    policyBold: {
      fontWeight: 'bold',
      color: colors.text,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
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
      borderColor: colors.error,
      backgroundColor: 'transparent',
    },
    applyButton: {
      backgroundColor: colors.primary,
    },
    disabledButton: {
      backgroundColor: colors.disabled,
    },
    cancelButtonText: {
      color: colors.error,
      fontWeight: '500',
      fontSize: fontSizes.buttonText,
    },
    buttonText: {
      color: '#ffffff',
      fontWeight: '500',
      fontSize: fontSizes.buttonText,
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
  });

  return (
    <Modal
      visible={open}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={dynamicStyles.centeredView}>
        <View style={dynamicStyles.modalView}>
          {/* Header */}
          <View style={dynamicStyles.header}>
            <Text style={dynamicStyles.modalTitle}>Manage Vacation</Text>
            <TouchableOpacity onPress={onClose} style={dynamicStyles.closeButton}>
              <Text style={dynamicStyles.closeIcon}>×</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={dynamicStyles.modalContent}>
            {/* Existing Vacation Info */}
            {hasExistingVacation && (
              <View style={[dynamicStyles.alert, dynamicStyles.infoAlert]}>
                <Text style={dynamicStyles.alertTitle}>Current Vacation Period</Text>
                <Text style={dynamicStyles.alertText}>
                  {dayjs(booking.vacationDetails?.leave_start_date).format("MMM D, YYYY")} 
                  {" to "}
                  {dayjs(booking.vacationDetails?.leave_end_date).format("MMM D, YYYY")}
                </Text>
                <Text style={dynamicStyles.alertText}>
                  Total days: {booking.vacationDetails?.total_days}
                </Text>
              </View>
            )}

            {/* Alerts */}
            {error && (
              <View style={[dynamicStyles.alert, dynamicStyles.errorAlert]}>
                <Text style={dynamicStyles.errorText}>{error}</Text>
              </View>
            )}
            
            {success && (
              <View style={[dynamicStyles.alert, dynamicStyles.successAlert]}>
                <Text style={dynamicStyles.successText}>{success}</Text>
              </View>
            )}

            {/* Vacation Date Selection */}
            <View style={dynamicStyles.section}>
              <Text style={dynamicStyles.sectionTitle}>
                {hasExistingVacation ? "Modify Vacation Dates" : "Apply for Vacation"}
              </Text>
              
              {/* Start Date Picker */}
              <View style={dynamicStyles.datePickerContainer}>
                <Text style={dynamicStyles.dateLabel}>Vacation Start Date</Text>
                <TouchableOpacity 
                  style={dynamicStyles.dateInput}
                  onPress={() => setShowStartPicker(true)}
                >
                  <Text style={[
                    dynamicStyles.dateInputText,
                    !startDate && dynamicStyles.placeholderText
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
              <View style={dynamicStyles.datePickerContainer}>
                <Text style={dynamicStyles.dateLabel}>Vacation End Date</Text>
                <TouchableOpacity 
                  style={[
                    dynamicStyles.dateInput,
                    (!startDate && dynamicStyles.disabledInput)
                  ]}
                  onPress={() => startDate && setShowEndPicker(true)}
                  disabled={!startDate}
                >
                  <Text style={[
                    dynamicStyles.dateInputText,
                    !endDate && dynamicStyles.placeholderText,
                    !startDate && dynamicStyles.disabledText
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
                <View style={dynamicStyles.totalDaysContainer}>
                  <Text style={dynamicStyles.totalDaysText}>
                    Total vacation days: <Text style={dynamicStyles.totalDaysBold}>{totalDays}</Text>
                  </Text>
                </View>
              )}
            </View>

            {/* Vacation Policy Info */}
            <View style={dynamicStyles.policyContainer}>
              <Text style={dynamicStyles.policyTitle}>Vacation Policy</Text>
              <Text style={dynamicStyles.policyText}>
                <Text style={dynamicStyles.policyBold}>Vacation Policy:</Text> During vacation period, services will be paused and 
                applicable refunds will be processed to your wallet. A penalty may apply for modifications 
                to existing vacation periods.
              </Text>
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={dynamicStyles.actions}>
            {hasExistingVacation && (
              <TouchableOpacity
                style={[dynamicStyles.button, dynamicStyles.cancelButton]}
                onPress={handleCancelVacation}
                disabled={isLoading}
              >
                <Text style={dynamicStyles.cancelButtonText}>Cancel Vacation</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[
                dynamicStyles.button, 
                dynamicStyles.applyButton,
                (!startDate || !endDate || isLoading) && dynamicStyles.disabledButton
              ]}
              onPress={handleApplyVacation}
              disabled={!startDate || !endDate || isLoading}
            >
              {isLoading ? (
                <View style={dynamicStyles.loadingContainer}>
                  <ActivityIndicator color="#ffffff" size="small" />
                  <Text style={dynamicStyles.buttonText}>
                    {hasExistingVacation ? "Updating..." : "Applying..."}
                  </Text>
                </View>
              ) : (
                <Text style={dynamicStyles.buttonText}>
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

export default VacationManagementDialog;