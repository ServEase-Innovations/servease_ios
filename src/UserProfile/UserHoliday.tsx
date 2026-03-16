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
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../src/Settings/ThemeContext';
import { useTranslation } from 'react-i18next';

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
  const { colors, fontSize, isDarkMode } = useTheme();
  const { t } = useTranslation();
  const [leaveStartDate, setLeaveStartDate] = useState<Date | null>(null);
  const [leaveEndDate, setLeaveEndDate] = useState<Date | null>(null);
  const [minDate, setMinDate] = useState<Date | undefined>();
  const [maxDate, setMaxDate] = useState<Date | undefined>();
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Get font sizes based on theme
  const getFontSizes = () => {
    switch (fontSize) {
      case 'small':
        return {
          dialogTitle: 16,
          dateLabel: 13,
          dateValue: 14,
          helperText: 12,
          bookingText: 12,
          buttonText: 13,
          snackbarText: 13,
        };
      case 'large':
        return {
          dialogTitle: 20,
          dateLabel: 16,
          dateValue: 18,
          helperText: 15,
          bookingText: 15,
          buttonText: 16,
          snackbarText: 16,
        };
      default:
        return {
          dialogTitle: 18,
          dateLabel: 14,
          dateValue: 16,
          helperText: 14,
          bookingText: 14,
          buttonText: 14,
          snackbarText: 14,
        };
    }
  };

  const fontSizes = getFontSizes();

  const getServiceTitle = (serviceType: string) => {
    const serviceMap: { [key: string]: string } = {
      'homeCook': t('booking.cards.homeCook'),
      'maid': t('booking.cards.maidService'),
      'careGiver': t('booking.cards.caregiver'),
      'nanny': t('booking.cards.caregiver')
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
      Alert.alert(t('common.error'), t('userHoliday.error.withinBookingPeriod'));
      return;
    }

    const diffInDays = Math.floor((leaveEndDate.getTime() - leaveStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (diffInDays < 10) {
      Alert.alert(t('common.error'), t('userHoliday.error.minimumDays'));
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
      Alert.alert(t('common.error'), t('userHoliday.error.submitFailed'));
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
    modalContainer: {
      flex: 1,
      backgroundColor: colors.overlay,
    },
    overlay: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    dialogContainer: {
      backgroundColor: colors.card,
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
      borderBottomColor: colors.border,
    },
    dialogTitle: {
      fontSize: fontSizes.dialogTitle,
      fontWeight: '600',
      color: '#ffffff',
    },
    closeButton: {
      padding: 4,
    },
    closeIcon: {
      fontSize: 24,
      color: '#ffffff',
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
      borderColor: colors.border,
      borderRadius: 8,
      padding: 16,
      backgroundColor: colors.card,
    },
    dateLabel: {
      fontSize: fontSizes.dateLabel,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    dateValue: {
      fontSize: fontSizes.dateValue,
      color: colors.text,
      fontWeight: '500',
    },
    helperText: {
      fontSize: fontSizes.helperText,
      color: colors.textSecondary,
      lineHeight: 20,
      marginTop: 8,
    },
    bookingInfo: {
      marginTop: 16,
      padding: 12,
      backgroundColor: colors.surface,
      borderRadius: 8,
    },
    bookingText: {
      fontSize: fontSizes.bookingText,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.border,
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
      backgroundColor: colors.primary,
    },
    outlineButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
    },
    buttonText: {
      fontWeight: '500',
    },
    primaryButtonText: {
      color: '#ffffff',
    },
    outlineButtonText: {
      color: colors.text,
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
      backgroundColor: colors.success,
      padding: 16,
      borderRadius: 8,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    snackbarText: {
      color: '#ffffff',
      fontWeight: '500',
      fontSize: fontSizes.snackbarText,
    },
    snackbarClose: {
      color: '#ffffff',
      fontSize: 20,
      fontWeight: 'bold',
    },
  });

  return (
    <>
      <Modal
        visible={open}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <SafeAreaView style={dynamicStyles.modalContainer}>
          <View style={dynamicStyles.overlay}>
            <View style={dynamicStyles.dialogContainer}>
              {/* Header */}
              <LinearGradient
                colors={["#0a2a66ff", "#004aadff"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={dynamicStyles.header}
              >
                <Text style={dynamicStyles.dialogTitle}>{t('userHoliday.title')}</Text>
                <TouchableOpacity onPress={onClose} style={dynamicStyles.closeButton}>
                  <Text style={dynamicStyles.closeIcon}>×</Text>
                </TouchableOpacity>
              </LinearGradient>

              {/* Content */}
              <ScrollView style={dynamicStyles.content}>
                <View style={dynamicStyles.datePickerContainer}>
                  {/* Start Date Picker */}
                  <TouchableOpacity 
                    style={dynamicStyles.dateInput}
                    onPress={() => setShowStartPicker(true)}
                  >
                    <Text style={dynamicStyles.dateLabel}>{t('userHoliday.startDate')}</Text>
                    <Text style={dynamicStyles.dateValue}>
                      {leaveStartDate ? dayjs(leaveStartDate).format('MMMM DD, YYYY') : t('userHoliday.selectStartDate')}
                    </Text>
                  </TouchableOpacity>

                  {/* End Date Picker */}
                  <TouchableOpacity 
                    style={dynamicStyles.dateInput}
                    onPress={() => setShowEndPicker(true)}
                    disabled={!leaveStartDate}
                  >
                    <Text style={dynamicStyles.dateLabel}>{t('userHoliday.endDate')}</Text>
                    <Text style={[
                      dynamicStyles.dateValue,
                      !leaveStartDate && { color: colors.textTertiary || colors.textSecondary }
                    ]}>
                      {leaveEndDate ? dayjs(leaveEndDate).format('MMMM DD, YYYY') : t('userHoliday.selectEndDate')}
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
                  <Text style={dynamicStyles.helperText}>
                    {t('userHoliday.helperText')}
                  </Text>

                  {booking && (
                    <View style={dynamicStyles.bookingInfo}>
                      <Text style={dynamicStyles.bookingText}>
                        {t('userHoliday.bookedPeriod', { 
                          startDate: dayjs(booking.startDate).format('DD/MM/YYYY'), 
                          endDate: dayjs(booking.endDate).format('DD/MM/YYYY') 
                        })}
                      </Text>
                      <Text style={dynamicStyles.bookingText}>
                        {t('userHoliday.serviceType')}: {getServiceTitle(booking.serviceType)}
                      </Text>
                      <Text style={dynamicStyles.bookingText}>
                        {t('userHoliday.bookingType')}: {booking.bookingType}
                      </Text>
                    </View>
                  )}
                </View>
              </ScrollView>

              {/* Actions */}
              <View style={dynamicStyles.actions}>
                <Button
                  variant="outline"
                  onPress={onClose}
                  disabled={isSubmitting}
                >
                  {t('userHoliday.cancel')}
                </Button>
                <Button
                  onPress={handleSubmit}
                  disabled={isSubmitting || !leaveStartDate || !leaveEndDate}
                >
                  {t('userHoliday.submit')}
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
        title={t('userHoliday.confirmation.title')}
        message={t('userHoliday.confirmation.message', { 
          startDate: leaveStartDate ? dayjs(leaveStartDate).format('MMMM DD, YYYY') : '',
          endDate: leaveEndDate ? dayjs(leaveEndDate).format('MMMM DD, YYYY') : '',
          service: getServiceTitle(booking?.serviceType || '')
        })}
        confirmText={t('userHoliday.confirmation.confirm')}
        cancelText={t('userHoliday.confirmation.cancel')}
        loading={isSubmitting}
        severity="info"
      />

      {/* Snackbar equivalent */}
      {snackbarOpen && (
        <View style={dynamicStyles.snackbar}>
          <Text style={dynamicStyles.snackbarText}>{t('userHoliday.success')}</Text>
          <TouchableOpacity onPress={() => setSnackbarOpen(false)}>
            <Text style={dynamicStyles.snackbarClose}>×</Text>
          </TouchableOpacity>
        </View>
      )}
    </>
  );
};

// Base styles without theme colors
const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  primaryButton: {},
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  buttonText: {
    fontWeight: '500',
  },
  primaryButtonText: {},
  outlineButtonText: {},
  disabledButton: {},
  disabledText: {},
});

export default UserHoliday;