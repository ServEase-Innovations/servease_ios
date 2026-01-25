import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import dayjs from 'dayjs';
import PaymentInstance from '../services/paymentInstance'; // Updated import
import axiosInstance from '../services/axiosInstance';
import DateTimePicker from '@react-native-community/datetimepicker';
import VacationManagementDialog from './VacationManagement';

interface Booking {
  bookingType: string;
  id: number;
  startDate: string;
  endDate: string;
  timeSlot: string;
  service_type: string; // Updated from serviceType to service_type
  customerId?: number;
  modifiedDate: string;
  bookingDate: string;
  hasVacation?: boolean;
  vacationDetails?: {
    start_date?: string; // Updated field names
    end_date?: string;
    leave_days?: number;
  };
  modifications?: Array<{ // New field from React code
    date: string;
    action: string;
    changes?: {
      new_start_date?: string;
      new_end_date?: string;
      new_start_time?: string;
      start_date?: { from: string; to: string };
      end_date?: { from: string; to: string };
      start_time?: { from: string; to: string };
    };
    refund?: number;
    penalty?: number;
  }>;
}

interface ModifyBookingDialogProps {
  open: boolean;
  onClose: () => void;
  booking: Booking | null;
  timeSlots: string[];
  onSave: (updatedData: {
    startDate: string;
    endDate: string;
    timeSlot: string;
  }) => void;
  customerId: number | null;
  refreshBookings: () => Promise<void>; // New prop from React code
  setOpenSnackbar: React.Dispatch<React.SetStateAction<boolean>>; // New prop from React code
}

const ModifyBookingDialog: React.FC<ModifyBookingDialogProps> = ({
  open,
  onClose,
  booking,
  timeSlots,
  onSave,
  customerId,
  refreshBookings, // New prop
  setOpenSnackbar, // New prop
}) => {
  const today = dayjs();
  const maxDate90Days = dayjs().add(90, 'day');

  const [startDate, setStartDate] = useState<Date | null>(
    booking ? new Date(booking.startDate) : null
  );
  const [endDate, setEndDate] = useState<Date | null>(
    booking ? new Date(booking.endDate) : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [showVacationDialog, setShowVacationDialog] = useState(false);

  const [selectedSection, setSelectedSection] = useState<
    'OPTIONS' | 'BOOKING_DATE' | 'BOOKING_TIME' | 'VACATION'
  >('OPTIONS');

  const shouldDisableStartDate = (date: Date) => dayjs(date).isBefore(today, 'day');

  const shouldDisableEndDate = (date: Date) => {
    if (!startDate) return true;
    const min = dayjs(startDate).add(1, 'day');
    const max = dayjs(startDate).add(20, 'day');
    return dayjs(date).isBefore(min, 'day') || dayjs(date).isAfter(max, 'day');
  };

  // Extract the actual booked time from the booking
  const getBookedTime = () => {
    if (!booking) return new Date();
    
    const [time, period] = booking.timeSlot.split(' ');
    const [hoursStr, minutesStr] = time.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    const bookedDate = new Date(booking.startDate);
    bookedDate.setHours(hours, minutes, 0, 0);
    return bookedDate;
  };

  // --- NEW METHODS FROM REACT CODE ---

  const isModificationTimeAllowed = (startDate: string, timeSlot: string): boolean => {
    const now = dayjs();
    const [time, period] = timeSlot.split(' ');
    const [hoursStr, minutesStr] = time.split(':');
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    const bookingDateTime = dayjs(startDate)
      .set('hour', hours)
      .set('minute', minutes)
      .set('second', 0);
    return now.isBefore(bookingDateTime.subtract(30, 'minute'));
  };

  const isBookingAlreadyModified = (booking: Booking | null): boolean => {
    if (!booking) return false;
    const modifications = booking.modifications ?? [];
    return modifications.some((mod) =>
      ["Date Rescheduled", "Time Rescheduled", "Modified", "Rescheduled"].some(
        (kw) => mod.action?.includes(kw)
      )
    );
  };

  const getModificationStatusMessage = (booking: Booking | null): string => {
    if (!booking) return "";
    if (isBookingAlreadyModified(booking))
      return "This booking has already been modified and cannot be modified again.";
    if (!isModificationTimeAllowed(booking.startDate, booking.timeSlot))
      return "Modification is only allowed at least 30 minutes before the scheduled time.";
    return "";
  };

  const isModificationDisabled = (booking: Booking | null): boolean => {
    if (!booking) return true;
    return (
      !isModificationTimeAllowed(booking.startDate, booking.timeSlot) ||
      isBookingAlreadyModified(booking)
    );
  };

  const getTimeUntilBooking = (booking: Booking | null): string => {
    if (!booking) return "";
    const bookedTime = getBookedTime();
    const now = dayjs();
    const diffMinutes = dayjs(bookedTime).diff(now, 'minute');
    if (diffMinutes <= 0) return "Booking has already started or passed";
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return hours > 0
      ? `${hours}h ${minutes}m until booking starts`
      : `${minutes}m until booking starts`;
  };

  const getLastModificationDetails = (booking: Booking | null): string => {
    const modifications = booking?.modifications ?? [];
    if (modifications.length === 0) return "";
    const lastMod = modifications[modifications.length - 1];
    if (lastMod.changes?.start_date)
      return `Last rescheduled from ${lastMod.changes.start_date.from} to ${lastMod.changes.start_date.to}`;
    if (lastMod.changes?.start_time)
      return `Last time changed from ${lastMod.changes.start_time.from} to ${lastMod.changes.start_time.to}`;
    return `Last modified: ${lastMod.action}`;
  };

  // --- UPDATED handleSubmit METHOD ---
  const handleSubmit = async () => {
    if (!startDate || !booking) return;

    if (isModificationDisabled(booking)) {
      setError(getModificationStatusMessage(booking));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const isDateModification = selectedSection === "BOOKING_DATE";
      const isTimeModification = selectedSection === "BOOKING_TIME";

      // Base payload (common) - using React code structure
      let updatePayload: any = {
        modified_by_id: customerId,
        modified_by_role: "CUSTOMER",
      };

      if (isDateModification) {
        updatePayload = {
          ...updatePayload,
          start_date: dayjs(startDate).format("YYYY-MM-DD"),
          end_date:
            booking.bookingType === "MONTHLY"
              ? dayjs(startDate).add(1, "month").format("YYYY-MM-DD")
              : endDate
              ? dayjs(endDate).format("YYYY-MM-DD")
              : dayjs(startDate).add(1, "day").format("YYYY-MM-DD"),
        };
      }

      if (isTimeModification) {
        updatePayload = {
          ...updatePayload,
          start_time: dayjs(startDate).format("HH:mm:ss"),
          end_time: dayjs(startDate).add(1, "hour").format("HH:mm:ss"),
        };
      }

      console.log("📦 Sending Payload:", updatePayload);

      // Use PaymentInstance instead of axiosInstance
      const response = await PaymentInstance.put(
        `/api/engagements/${booking.id}`,
        updatePayload,
        { headers: { "Content-Type": "application/json" } }
      );

      if (customerId !== null) await refreshBookings();

      onSave({
        startDate: updatePayload.start_date || booking.startDate,
        endDate: updatePayload.end_date || booking.endDate,
        timeSlot: updatePayload.start_time
          ? dayjs(startDate).format("hh:mm A")
          : booking.timeSlot,
      });

      setSuccess(
        isDateModification
          ? "Booking date rescheduled successfully!"
          : "Booking time rescheduled successfully!"
      );
      setOpenSnackbar(true);
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      console.error("❌ Error modifying booking:", error);
      setError("Failed to modify booking. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVacationSuccess = async () => {
    setSuccess("Vacation operation completed successfully!");
    setShowVacationDialog(false);
    setOpenSnackbar(true);
    if (customerId !== null) {
      await refreshBookings();
    }
  };

  const handleVacationClose = () => {
    setShowVacationDialog(false);
    setSelectedSection("OPTIONS");
  };

  useEffect(() => {
    if (open && booking) {
      const bookedTime = getBookedTime();
      setStartDate(bookedTime);
      setEndDate(new Date(booking.endDate));
      setError(null);
      setSuccess(null);
      setSelectedSection("OPTIONS");
      setShowVacationDialog(false);
    }
  }, [open, booking]);

  if (!open || !booking) return null;

  const modificationDisabled = isModificationDisabled(booking);
  const statusMessage = getModificationStatusMessage(booking);
  const timeUntilBooking = getTimeUntilBooking(booking);
  const lastModificationDetails = getLastModificationDetails(booking);
  const modificationCount = booking.modifications?.length ?? 0;

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    setShowTimePicker(false);
    
    if (selectedDate) {
      if (pickerMode === 'date') {
        const currentTime = startDate ? startDate : new Date();
        const newDate = new Date(selectedDate);
        newDate.setHours(currentTime.getHours(), currentTime.getMinutes(), 0, 0);
        setStartDate(newDate);
      } else {
        const currentDate = startDate ? startDate : new Date();
        const newTime = new Date(selectedDate);
        currentDate.setHours(newTime.getHours(), newTime.getMinutes(), 0, 0);
        setStartDate(new Date(currentDate));
      }
    }
  };

  const openDatePicker = (mode: 'date' | 'time') => {
    setPickerMode(mode);
    if (mode === 'date') {
      setShowDatePicker(true);
    } else {
      setShowTimePicker(true);
    }
  };

  const CustomButton = ({ 
    title, 
    onPress, 
    disabled = false, 
    variant = 'contained' 
  }: { 
    title: string; 
    onPress: () => void; 
    disabled?: boolean;
    variant?: 'contained' | 'outlined';
  }) => {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        style={[
          styles.button,
          variant === 'contained' ? styles.containedButton : styles.outlinedButton,
          disabled && styles.disabledButton
        ]}
      >
        <Text style={[
          styles.buttonText,
          variant === 'contained' ? styles.containedButtonText : styles.outlinedButtonText,
          disabled && styles.disabledButtonText
        ]}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Modal
        visible={open}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
      >
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1}
          onPress={onClose}
        >
          <View style={styles.dialogContainer}>
            <View style={styles.dialog}>
              <View style={styles.header}>
                <Text style={styles.title}>Modify Booking</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Text style={styles.closeIcon}>×</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.content}>
                {/* Booking Info Section - NEW FROM REACT CODE */}
                <View style={styles.bookingInfoContainer}>
                  <Text style={styles.bookingInfoText}>
                    Booking #{booking.id} - {booking.service_type}
                  </Text>
                  <Text style={styles.bookingDetailText}>
                    Scheduled: {dayjs(booking.startDate).format("MMM D, YYYY")} at{" "}
                    {booking.timeSlot}
                  </Text>
                  <Text style={styles.bookingDetailText}>
                    {timeUntilBooking}
                  </Text>

                  {modificationCount > 0 && (
                    <View style={styles.modificationInfo}>
                      <Text style={styles.modificationCountText}>
                        This booking has been modified {modificationCount} time(s)
                      </Text>
                      <Text style={styles.lastModificationText}>
                        {lastModificationDetails}
                      </Text>
                    </View>
                  )}
                </View>

                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                {success && (
                  <View style={styles.successContainer}>
                    <Text style={styles.successText}>{success}</Text>
                  </View>
                )}

                {/* Options */}
                {selectedSection === "OPTIONS" && (
                  <View style={styles.optionsContainer}>
                    {/* Vacation button commented out as in React code */}
                    {/* {booking?.hasVacation && (
                      <CustomButton 
                        title="Manage Vacation" 
                        onPress={() => setShowVacationDialog(true)}
                        variant="outlined"
                      />
                    )} */}

                    <CustomButton 
                      title="Reschedule Date" 
                      onPress={() => setSelectedSection("BOOKING_DATE")} 
                      disabled={modificationDisabled || isLoading}
                    />
                    <CustomButton 
                      title="Reschedule Time" 
                      onPress={() => setSelectedSection("BOOKING_TIME")} 
                      disabled={modificationDisabled || isLoading}
                    />

                    {modificationDisabled && (
                      <View style={styles.statusMessageContainer}>
                        <Text style={styles.statusMessage}>{statusMessage}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Reschedule Date */}
                {selectedSection === "BOOKING_DATE" && (
                  <View style={styles.sectionContainer}>
                    <Text style={styles.sectionDescription}>
                      Select a new date for your booking.
                    </Text>
                    <View style={styles.pickerContainer}>
                      <Text style={styles.label}>Select New Date</Text>
                      <TouchableOpacity 
                        style={styles.dateDisplay}
                        onPress={() => openDatePicker('date')}
                      >
                        <Text>{startDate ? dayjs(startDate).format('MMMM D, YYYY') : 'Select date'}</Text>
                      </TouchableOpacity>
                      
                      {showDatePicker && (
                        <DateTimePicker
                          value={startDate || new Date()}
                          mode="date"
                          display="default"
                          onChange={handleDateChange}
                          minimumDate={new Date()}
                          maximumDate={maxDate90Days.toDate()}
                        />
                      )}
                    </View>
                  </View>
                )}

                {/* Reschedule Time */}
                {selectedSection === "BOOKING_TIME" && (
                  <View style={styles.sectionContainer}>
                    <Text style={styles.sectionDescription}>
                      Current Time: <Text style={styles.bold}>{booking.timeSlot}</Text>
                    </Text>
                    <View style={styles.pickerContainer}>
                      <Text style={styles.label}>Select New Time</Text>
                      <TouchableOpacity 
                        style={styles.dateDisplay}
                        onPress={() => openDatePicker('time')}
                      >
                        <Text>{startDate ? dayjs(startDate).format('h:mm A') : 'Select time'}</Text>
                      </TouchableOpacity>
                      
                      {showTimePicker && (
                        <DateTimePicker
                          value={startDate || new Date()}
                          mode="time"
                          display="default"
                          onChange={handleDateChange}
                          is24Hour={false}
                        />
                      )}
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Action Buttons for Date/Time Sections */}
              {(selectedSection === "BOOKING_DATE" || selectedSection === "BOOKING_TIME") && (
                <View style={styles.footer}>
                  <CustomButton 
                    title="Back" 
                    onPress={() => setSelectedSection("OPTIONS")}
                    variant="outlined"
                  />
                  <CustomButton 
                    title={isLoading ? "Saving..." : selectedSection === "BOOKING_DATE" ? "Save Date" : "Save Time"}
                    onPress={handleSubmit}
                    disabled={isLoading || modificationDisabled}
                  />
                </View>
              )}

              {isLoading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#1976d2" />
                  <Text style={styles.loadingText}>Saving...</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Vacation Management Dialog */}
      <VacationManagementDialog
        open={showVacationDialog}
        onClose={handleVacationClose}
        booking={{
          id: booking.id,
          vacationDetails: booking.vacationDetails
            ? {
                leave_start_date: booking.vacationDetails.start_date,
                leave_end_date: booking.vacationDetails.end_date,
                total_days: booking.vacationDetails.leave_days,
              }
            : undefined,
        }}
        customerId={customerId}
        onSuccess={handleVacationSuccess}
      />
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  dialog: {
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
    maxHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  closeIcon: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    maxHeight: 400,
  },
  bookingInfoContainer: {
    padding: 16,
    backgroundColor: '#e3f2fd',
    margin: 16,
    borderRadius: 8,
  },
  bookingInfoText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1976d2',
    marginBottom: 4,
  },
  bookingDetailText: {
    fontSize: 13,
    color: '#424242',
    marginBottom: 2,
  },
  modificationInfo: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#bbdefb',
  },
  modificationCountText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#ff6f00',
    marginBottom: 2,
  },
  lastModificationText: {
    fontSize: 12,
    color: '#ff6f00',
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#ffebee',
    borderBottomWidth: 1,
    borderBottomColor: '#ffcdd2',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 4,
  },
  successContainer: {
    padding: 16,
    backgroundColor: '#e8f5e9',
    borderBottomWidth: 1,
    borderBottomColor: '#c8e6c9',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 4,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  successText: {
    color: '#2e7d32',
    fontSize: 14,
  },
  optionsContainer: {
    padding: 24,
    gap: 16,
  },
  sectionContainer: {
    padding: 16,
    gap: 16,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  pickerContainer: {
    gap: 8,
    paddingHorizontal: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  bold: {
    fontWeight: 'bold',
  },
  dateDisplay: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 4,
    alignItems: 'center',
    minWidth: 100,
  },
  containedButton: {
    backgroundColor: '#1976d2',
  },
  outlinedButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#1976d2',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  containedButtonText: {
    color: 'white',
  },
  outlinedButtonText: {
    color: '#1976d2',
  },
  disabledButtonText: {
    color: '#999',
  },
  statusMessageContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#fff3e0',
    borderWidth: 1,
    borderColor: '#ffcc80',
    borderRadius: 4,
  },
  statusMessage: {
    fontSize: 14,
    color: '#e65100',
    textAlign: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#1976d2',
    fontSize: 14,
  },
});

export default ModifyBookingDialog;