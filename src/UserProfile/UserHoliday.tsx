import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import dayjs from 'dayjs';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../src/Settings/ThemeContext';

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

const MIN_VACATION_DAYS = 10;

const startOfDay = (value: Date): Date => {
  const normalized = new Date(value);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const countInclusiveDays = (start: Date, end: Date): number => {
  const startMs = startOfDay(start).getTime();
  const endMs = startOfDay(end).getTime();
  return Math.floor((endMs - startMs) / (1000 * 60 * 60 * 24)) + 1;
};

const UserHoliday: React.FC<UserHolidayProps> = ({ open, onClose, booking, onLeaveSubmit }) => {
  const { colors, fontSize } = useTheme();
  const [leaveStartDate, setLeaveStartDate] = useState<Date | null>(null);
  const [leaveEndDate, setLeaveEndDate] = useState<Date | null>(null);
  const [minDate, setMinDate] = useState<Date | undefined>();
  const [maxDate, setMaxDate] = useState<Date | undefined>();
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const getFontSizes = () => {
    switch (fontSize) {
      case 'small':
        return {
          dialogTitle: 16, dateLabel: 13, dateValue: 14, helperText: 12,
          bookingText: 12, buttonText: 13,
        };
      case 'large':
        return {
          dialogTitle: 20, dateLabel: 16, dateValue: 18, helperText: 15,
          bookingText: 15, buttonText: 16,
        };
      default:
        return {
          dialogTitle: 18, dateLabel: 14, dateValue: 16, helperText: 14,
          bookingText: 14, buttonText: 14,
        };
    }
  };
  const fontSizes = getFontSizes();

  const getServiceTitle = (serviceType: string) => {
    const serviceMap: { [key: string]: string } = {
      'homeCook': 'Home Cook',
      'maid': 'Maid Service',
      'careGiver': 'Caregiver',
      'nanny': 'Caregiver'
    };
    return serviceMap[serviceType] || serviceType;
  };

  useEffect(() => {
    if (!booking) return;
    const start = startOfDay(dayjs(booking.startDate).toDate());
    const end = startOfDay(dayjs(booking.endDate).toDate());
    const today = startOfDay(new Date());
    const effectiveMin = start < today ? today : start;
    setMinDate(effectiveMin);
    setMaxDate(end);
    setLeaveStartDate(null);
    setLeaveEndDate(null);
    setFormError(null);
  }, [booking, open]);

  const totalDays =
    leaveStartDate && leaveEndDate
      ? countInclusiveDays(leaveStartDate, leaveEndDate)
      : 0;

  const earliestEndDate = leaveStartDate
    ? startOfDay(new Date(leaveStartDate.getTime() + (MIN_VACATION_DAYS - 1) * 24 * 60 * 60 * 1000))
    : null;

  const isValidVacationPeriod =
    totalDays >= MIN_VACATION_DAYS &&
    !!leaveStartDate &&
    !!leaveEndDate &&
    !!minDate &&
    !!maxDate &&
    startOfDay(leaveStartDate) >= minDate &&
    startOfDay(leaveEndDate) <= maxDate;

  const handleStartDateChange = (_event: unknown, selectedDate?: Date) => {
    setShowStartPicker(false);
    if (selectedDate) {
      setLeaveStartDate(startOfDay(selectedDate));
      setLeaveEndDate(null);
      setFormError(null);
    }
  };

  const handleEndDateChange = (_event: unknown, selectedDate?: Date) => {
    setShowEndPicker(false);
    if (selectedDate) {
      setLeaveEndDate(startOfDay(selectedDate));
      setFormError(null);
    }
  };

  const handleSubmit = async () => {
    if (!leaveStartDate || !leaveEndDate || !booking?.serviceType) {
      setFormError('Please select both start and end dates.');
      return;
    }

    if (startOfDay(leaveStartDate) < minDate! || startOfDay(leaveEndDate) > maxDate!) {
      setFormError('Please select dates within your booking period.');
      return;
    }

    if (totalDays < MIN_VACATION_DAYS) {
      setFormError('Leave duration must be at least 10 days.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      await onLeaveSubmit(
        dayjs(leaveStartDate).format('YYYY-MM-DD'),
        dayjs(leaveEndDate).format('YYYY-MM-DD'),
        booking.serviceType
      );
      // Success – close dialog (snackbar shown by parent)
      onClose();
    } catch (error: any) {
      const apiMessage = error?.response?.data?.error || error?.response?.data?.message;
      setFormError(apiMessage || 'Failed to submit leave application. Please try again.');
      console.error("Leave submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const Button: React.FC<{
    children: React.ReactNode;
    onPress: () => void;
    variant?: 'primary' | 'outline';
    disabled?: boolean;
  }> = ({ children, onPress, variant = 'primary', disabled = false }) => {
    const isOutline = variant === 'outline';
    return (
      <TouchableOpacity
        style={[
          styles.button,
          isOutline ? [styles.outlineButton, { borderColor: colors.border }] : [styles.primaryButton, { backgroundColor: colors.primary }],
          disabled && [styles.disabledButton, { opacity: 0.6 }],
        ]}
        onPress={onPress}
        disabled={disabled}
      >
        <Text style={[
          styles.buttonText,
          { fontSize: fontSizes.buttonText },
          isOutline ? [styles.outlineButtonText, { color: colors.text }] : [styles.primaryButtonText, { color: '#ffffff' }],
          disabled && [styles.disabledText, { color: colors.textSecondary }]
        ]}>
          {children}
        </Text>
      </TouchableOpacity>
    );
  };

  const dynamicStyles = StyleSheet.create({
    modalContainer: { flex: 1, backgroundColor: colors.overlay },
    overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    dialogContainer: { backgroundColor: colors.card, borderRadius: 8, width: '100%', maxWidth: 500, maxHeight: '80%', overflow: 'hidden' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
    dialogTitle: { fontSize: fontSizes.dialogTitle, fontWeight: '600', color: '#ffffff' },
    closeButton: { padding: 4 },
    closeIcon: { fontSize: 24, color: '#ffffff', fontWeight: 'bold' },
    content: { padding: 16, maxHeight: 400 },
    datePickerContainer: { gap: 16 },
    dateInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 16, backgroundColor: colors.card },
    dateLabel: { fontSize: fontSizes.dateLabel, color: colors.textSecondary, marginBottom: 4 },
    dateValue: { fontSize: fontSizes.dateValue, color: colors.text, fontWeight: '500' },
    helperText: { fontSize: fontSizes.helperText, color: colors.textSecondary, lineHeight: 20, marginTop: 8 },
    errorText: {
      fontSize: fontSizes.helperText,
      color: colors.error || '#dc2626',
      lineHeight: 20,
      marginTop: 8,
      padding: 12,
      borderRadius: 8,
      backgroundColor: 'rgba(220, 38, 38, 0.08)',
    },
    summaryText: { fontSize: fontSizes.helperText, color: colors.text, marginTop: 8 },
    bookingInfo: { marginTop: 16, padding: 12, backgroundColor: colors.surface, borderRadius: 8 },
    bookingText: { fontSize: fontSizes.bookingText, color: colors.textSecondary, marginBottom: 4 },
    actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, padding: 16, borderTopWidth: 1, borderTopColor: colors.border },
  });

  return (
    <Modal visible={open} animationType="slide" transparent onRequestClose={onClose}>
      <SafeAreaView style={dynamicStyles.modalContainer}>
        <View style={dynamicStyles.overlay}>
          <View style={dynamicStyles.dialogContainer}>
            <LinearGradient colors={["#0b5bd3", "#4f8ff7"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={dynamicStyles.header}>
              <Text style={dynamicStyles.dialogTitle}>Schedule Holiday</Text>
              <TouchableOpacity onPress={onClose} style={dynamicStyles.closeButton}>
                <Text style={dynamicStyles.closeIcon}>×</Text>
              </TouchableOpacity>
            </LinearGradient>
            <ScrollView style={dynamicStyles.content}>
              <View style={dynamicStyles.datePickerContainer}>
                <TouchableOpacity style={dynamicStyles.dateInput} onPress={() => setShowStartPicker(true)}>
                  <Text style={dynamicStyles.dateLabel}>Start Date</Text>
                  <Text style={dynamicStyles.dateValue}>
                    {leaveStartDate ? dayjs(leaveStartDate).format('MMMM DD, YYYY') : 'Select start date'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={dynamicStyles.dateInput} onPress={() => setShowEndPicker(true)} disabled={!leaveStartDate}>
                  <Text style={dynamicStyles.dateLabel}>End Date</Text>
                  <Text style={[dynamicStyles.dateValue, !leaveStartDate && { color: colors.textTertiary || colors.textSecondary }]}>
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
                    value={leaveEndDate || earliestEndDate || leaveStartDate || new Date()}
                    mode="date"
                    display="default"
                    minimumDate={earliestEndDate || minDate}
                    maximumDate={maxDate}
                    onChange={handleEndDateChange}
                  />
                )}
                <Text style={dynamicStyles.helperText}>
                  Please select a holiday period of at least 10 consecutive days within your booking period
                  {earliestEndDate && leaveStartDate
                    ? ` (earliest end date: ${dayjs(earliestEndDate).format('DD/MM/YYYY')})`
                    : ''}
                </Text>
                {totalDays > 0 ? (
                  <Text
                    style={[
                      dynamicStyles.summaryText,
                      { color: totalDays >= MIN_VACATION_DAYS ? colors.primary : colors.error || '#dc2626' },
                    ]}
                  >
                    Total days: {totalDays}
                  </Text>
                ) : null}
                {formError ? <Text style={dynamicStyles.errorText}>{formError}</Text> : null}
                {booking && (
                  <View style={dynamicStyles.bookingInfo}>
                    <Text style={dynamicStyles.bookingText}>
                      Booked Period: {dayjs(booking.startDate).format('DD/MM/YYYY')} - {dayjs(booking.endDate).format('DD/MM/YYYY')}
                    </Text>
                    <Text style={dynamicStyles.bookingText}>Service Type: {getServiceTitle(booking.serviceType)}</Text>
                    <Text style={dynamicStyles.bookingText}>Booking Type: {booking.bookingType}</Text>
                  </View>
                )}
              </View>
            </ScrollView>
            <View style={dynamicStyles.actions}>
              <Button variant="outline" onPress={onClose} disabled={isSubmitting}>Cancel</Button>
              <Button onPress={handleSubmit} disabled={isSubmitting || !isValidVacationPeriod}>
                {isSubmitting ? 'Loading...' : 'Submit'}
              </Button>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  button: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, alignItems: 'center', justifyContent: 'center', minWidth: 100 },
  primaryButton: {},
  outlineButton: { backgroundColor: 'transparent', borderWidth: 1 },
  buttonText: { fontWeight: '500' },
  primaryButtonText: {},
  outlineButtonText: {},
  disabledButton: {},
  disabledText: {},
});

export default UserHoliday;