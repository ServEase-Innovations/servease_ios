/* eslint-disable */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
  ScrollView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs, { Dayjs } from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import customParseFormat from "dayjs/plugin/customParseFormat";
import LinearGradient from "react-native-linear-gradient";
import DribbbleDateTimePicker from "../common/DribbbleDateTimePicker";
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAppUser } from '../context/AppUserContext';

dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);

interface BookingDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (bookingDetails: any) => void;
  selectedOption: string;
  onOptionChange: (val: string) => void;
  startDate: string | null;
  endDate: string | null;
  startTime: Dayjs | null;
  endTime: Dayjs | null;
  setStartDate: (val: string | null) => void;
  setEndDate: (val: string | null) => void;
  setStartTime: (val: Dayjs | null) => void;
  setEndTime: (val: Dayjs | null) => void;
}

const BookingDialog: React.FC<BookingDialogProps> = ({
  open,
  onClose,
  onSave,
  selectedOption,
  onOptionChange,
  startDate,
  endDate,
  startTime,
  endTime,
  setStartDate,
  setEndDate,
  setStartTime,
  setEndTime,
}) => {
  const { appUser } = useAppUser();
  const [role, setRole] = useState<string | null>(null);
  const [isServiceDisabled, setIsServiceDisabled] = useState(false);

  useEffect(() => {
    if (appUser) {
      const userRole = appUser.role || "CUSTOMER";
      setRole(userRole);
      setIsServiceDisabled(userRole === "SERVICE_PROVIDER");
      console.log("BookingDialog - User role:", userRole);
    }
  }, [appUser]);

  const [showDatePicker, setShowDatePicker] = useState<"start" | "end" | null>(
    null,
  );
  const [showCustomTimePicker, setShowCustomTimePicker] = useState<
    "start" | "end" | null
  >(null);
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [customHours, setCustomHours] = useState<number>(12);
  const [customMinutes, setCustomMinutes] = useState<number>(0);
  const [customAmPm, setCustomAmPm] = useState<"AM" | "PM">("AM");
  const [use24HourFormat, setUse24HourFormat] = useState<boolean>(false);

  // Business hours and cutoff configuration
  const BUSINESS_HOURS = {
    openingHour: 5,      // 5 AM
    openingMinute: 0,
    cutoffHour: 22,      // 10 PM
    cutoffMinute: 0,
  };

  const today = dayjs();
  const maxDate21Days = today.add(21, "day");
  const maxDate90Days = today.add(89, "day");

  // Function to check if a date should be disabled based on cutoff time
  const isDateDisabled = (date: Dayjs): boolean => {
    const now = dayjs();
    
    // If it's a past date, it's disabled
    if (date.isBefore(now, 'day')) return true;
    
    // If it's today, check if current time is past cutoff
    if (date.isSame(now, 'day')) {
      const currentTotalMinutes = now.hour() * 60 + now.minute();
      const cutoffTotalMinutes = BUSINESS_HOURS.cutoffHour * 60 + BUSINESS_HOURS.cutoffMinute;
      
      // If current time is past cutoff (10 PM), disable today
      if (currentTotalMinutes >= cutoffTotalMinutes) {
        return true;
      }
    }
    
    return false;
  };

  // Check if current time is past cutoff
  const isPastCutoff = (): boolean => {
    const now = dayjs();
    const currentTotalMinutes = now.hour() * 60 + now.minute();
    const cutoffTotalMinutes = BUSINESS_HOURS.cutoffHour * 60 + BUSINESS_HOURS.cutoffMinute;
    return currentTotalMinutes >= cutoffTotalMinutes;
  };

  // Reset all booking state when modal closes
  useEffect(() => {
    if (!open) {
      // Reset picker states
      setShowDatePicker(null);
      setShowCustomTimePicker(null);
      setTempDate(null);
      
      // Reset booking data
      setStartDate(null);
      setEndDate(null);
      setStartTime(null);
      setEndTime(null);
      
      // Reset custom time picker values to defaults
      setCustomHours(12);
      setCustomMinutes(0);
      setCustomAmPm("AM");
      setUse24HourFormat(false);
    }
  }, [open]);

  // Initialize custom time picker with current time
  useEffect(() => {
    if (showCustomTimePicker) {
      const currentTime =
        showCustomTimePicker === "start" ? startTime : endTime;
      const now = dayjs();
      let defaultTime = now.add(30, "minute"); // Default to 30 minutes from now

      if (currentTime) {
        defaultTime = currentTime;
      }

      // Adjust to valid time range if needed
      if (defaultTime.hour() < BUSINESS_HOURS.openingHour) {
        defaultTime = defaultTime.hour(BUSINESS_HOURS.openingHour).minute(0);
      } else if (defaultTime.hour() >= BUSINESS_HOURS.cutoffHour) {
        defaultTime = defaultTime.hour(BUSINESS_HOURS.cutoffHour - 1).minute(55);
      }

      const hours = defaultTime.hour();
      const minutes = defaultTime.minute();

      if (use24HourFormat) {
        // 24-hour format
        setCustomHours(hours);
      } else {
        // 12-hour format
        if (hours === 0) {
          setCustomHours(12);
          setCustomAmPm("AM");
        } else if (hours < 12) {
          setCustomHours(hours);
          setCustomAmPm("AM");
        } else if (hours === 12) {
          setCustomHours(12);
          setCustomAmPm("PM");
        } else {
          setCustomHours(hours - 12);
          setCustomAmPm("PM");
        }
      }
      setCustomMinutes(minutes);
    }
  }, [showCustomTimePicker, startTime, endTime, use24HourFormat]);

  const handleDateSelect = (type: "start" | "end") => {
    setShowDatePicker(type);
    setShowCustomTimePicker(null);
  };

  const handleTimeSelect = (type: "start" | "end") => {
    setShowCustomTimePicker(type);
    setShowDatePicker(null);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(null);
    }

    if (selectedDate && showDatePicker) {
      setTempDate(selectedDate);

      // Auto-show time picker after date selection on Android
      if (Platform.OS === "android") {
        setTimeout(() => {
          setShowCustomTimePicker(showDatePicker);
        }, 100);
      }
    }
  };

  const isTimeValid = (
    hours24: number,
    minutes: number,
    type: "start" | "end",
  ): boolean => {
    const now = dayjs();
    const selectedDateTime = tempDate
      ? dayjs(tempDate).hour(hours24).minute(minutes)
      : dayjs().hour(hours24).minute(minutes);

    // Check if the date itself is disabled
    if (isDateDisabled(selectedDateTime)) {
      return false;
    }

    // For start time, check 30-minute minimum gap
    if (type === "start") {
      if (
        selectedDateTime.isSame(now, "day") &&
        selectedDateTime.isBefore(now.add(30, "minute"))
      ) {
        return false;
      }
    }

    // Check business hours range (5 AM - 10 PM)
    if (hours24 < BUSINESS_HOURS.openingHour || hours24 >= BUSINESS_HOURS.cutoffHour) {
      return false;
    }

    return true;
  };

  const getValidTimeOptions = (type: "start" | "end") => {
    const now = dayjs();
    const isToday = tempDate ? dayjs(tempDate).isSame(now, "day") : true;

    // If today is disabled by cutoff, return empty hours
    if (isToday && isDateDisabled(now)) {
      return { validHours: [], validMinutes: [] };
    }

    // For 24-hour format: 5 to 21 (5 AM to 9 PM)
    const hours24 = [
      5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
    ];
    const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

    const validHours = hours24.filter((hour24) => {
      // For start times on today, check 30-minute minimum
      if (type === "start" && isToday) {
        const testTime = tempDate
          ? dayjs(tempDate).hour(hour24).minute(0)
          : dayjs().hour(hour24).minute(0);

        if (testTime.isBefore(now.add(30, "minute"))) {
          return false;
        }
      }

      return hour24 >= BUSINESS_HOURS.openingHour && hour24 < BUSINESS_HOURS.cutoffHour;
    });

    return { validHours, validMinutes: minutes };
  };

  const handleCustomTimeConfirm = () => {
    if (showCustomTimePicker) {
      // Convert to 24-hour format for storage
      let hours24 = customHours;
      if (!use24HourFormat) {
        // Convert from 12-hour to 24-hour format
        if (customAmPm === "PM" && customHours !== 12) {
          hours24 = customHours + 12;
        } else if (customAmPm === "AM" && customHours === 12) {
          hours24 = 0;
        }
      }

      // Validate time
      if (!isTimeValid(hours24, customMinutes, showCustomTimePicker)) {
        return;
      }

      let selectedDateTime: Dayjs;

      if (tempDate) {
        selectedDateTime = dayjs(tempDate)
          .hour(hours24)
          .minute(customMinutes)
          .second(0)
          .millisecond(0);
        setTempDate(null);
      } else {
        const currentDateTime =
          showCustomTimePicker === "start" ? startTime : endTime;
        if (currentDateTime) {
          selectedDateTime = currentDateTime
            .hour(hours24)
            .minute(customMinutes)
            .second(0)
            .millisecond(0);
        } else {
          // Create new datetime with today's date and selected time
          selectedDateTime = dayjs()
            .hour(hours24)
            .minute(customMinutes)
            .second(0)
            .millisecond(0);
        }
      }

      // Apply final validation and adjustments
      if (showCustomTimePicker === "start") {
        updateStartDateTime(selectedDateTime);
      } else {
        updateEndDateTime(selectedDateTime);
      }
    }

    setShowCustomTimePicker(null);
  };

  const handleCustomTimeCancel = () => {
    setShowCustomTimePicker(null);
    setTempDate(null);
  };

  const updateStartDateTime = (newDateTime: Dayjs) => {
    const now = dayjs();
    let adjustedDateTime = newDateTime;

    // Check if date is disabled by cutoff
    if (isDateDisabled(adjustedDateTime)) {
      return;
    }

    // Ensure start time is at least 30 minutes from now if it's today
    if (
      newDateTime.isSame(now, "day") &&
      newDateTime.isBefore(now.add(30, "minute"))
    ) {
      adjustedDateTime = now.add(30, "minute");
    }

    // Ensure time is within business hours
    const hour = adjustedDateTime.hour();
    if (hour < BUSINESS_HOURS.openingHour) {
      adjustedDateTime = adjustedDateTime.hour(BUSINESS_HOURS.openingHour).minute(0);
    } else if (hour >= BUSINESS_HOURS.cutoffHour) {
      adjustedDateTime = adjustedDateTime.hour(BUSINESS_HOURS.cutoffHour - 1).minute(55);
    }

    // Store dates and times in clean formats
    setStartDate(adjustedDateTime.format("YYYY-MM-DD"));
    setStartTime(adjustedDateTime);

    // Set default end time based on booking option
    if (selectedOption === "Date") {
      const defaultEnd = adjustedDateTime.add(1, "hour");
      // Ensure end time doesn't go beyond cutoff
      let finalEnd = defaultEnd;
      if (defaultEnd.hour() >= BUSINESS_HOURS.cutoffHour) {
        finalEnd = adjustedDateTime.hour(BUSINESS_HOURS.cutoffHour - 1).minute(55);
      }
      setEndDate(finalEnd.format("YYYY-MM-DD"));
      setEndTime(finalEnd);
    } else if (selectedOption === "Monthly") {
      const endDateValue = adjustedDateTime.add(1, "month");
      setEndDate(endDateValue.format("YYYY-MM-DD"));
      setEndTime(endDateValue);
    }
  };

  const updateEndDateTime = (newDateTime: Dayjs) => {
    let adjustedDateTime = newDateTime;

    // Ensure end time is after start time
    if (startTime && newDateTime.isBefore(startTime)) {
      adjustedDateTime = startTime.add(1, "hour");
    }

    // Ensure time is within business hours
    const hour = adjustedDateTime.hour();
    if (hour < BUSINESS_HOURS.openingHour) {
      adjustedDateTime = adjustedDateTime.hour(BUSINESS_HOURS.openingHour).minute(0);
    } else if (hour >= BUSINESS_HOURS.cutoffHour) {
      adjustedDateTime = adjustedDateTime.hour(BUSINESS_HOURS.cutoffHour - 1).minute(55);
    }

    // Store in clean formats
    setEndDate(adjustedDateTime.format("YYYY-MM-DD"));
    setEndTime(adjustedDateTime);
  };

  const isConfirmDisabled = () => {
    // If user is service provider, always disable confirm
    if (isServiceDisabled) {
      return true;
    }

    // If past cutoff, disable confirm button
    if (isPastCutoff()) {
      return true;
    }

    if (selectedOption === "Date") {
      if (!startDate || !startTime) return true;
      
      // Check if the selected start time is disabled
      if (isDateDisabled(startTime)) {
        return true;
      }
      
      const now = dayjs();
      if (startTime.isSame(now, "day") && startTime.isBefore(now.add(30, "minute"))) {
        return true;
      }
      
      const hour = startTime.hour();
      if (hour < BUSINESS_HOURS.openingHour || hour >= BUSINESS_HOURS.cutoffHour) {
        return true;
      }
      
    } else if (selectedOption === "Short term") {
      if (!startDate || !endDate || !startTime || !endTime) return true;
      
      // Check if start time is disabled
      if (isDateDisabled(startTime)) {
        return true;
      }
      
      const now = dayjs();
      if (startTime.isSame(now, "day") && startTime.isBefore(now.add(30, "minute"))) {
        return true;
      }
      
      const startHour = startTime.hour();
      if (startHour < BUSINESS_HOURS.openingHour || startHour >= BUSINESS_HOURS.cutoffHour) {
        return true;
      }
      
      // Check if end time is after start time
      if (endTime.isBefore(startTime)) return true;
      
      // Check if end time is within business hours
      const endHour = endTime.hour();
      if (endHour < BUSINESS_HOURS.openingHour || endHour >= BUSINESS_HOURS.cutoffHour) {
        return true;
      }
      
    } else if (selectedOption === "Monthly") {
      if (!startDate || !startTime) return true;
      
      // Check if start time is disabled
      if (isDateDisabled(startTime)) {
        return true;
      }
      
      const now = dayjs();
      if (startTime.isSame(now, "day") && startTime.isBefore(now.add(30, "minute"))) {
        return true;
      }
      
      const startHour = startTime.hour();
      if (startHour < BUSINESS_HOURS.openingHour || startHour >= BUSINESS_HOURS.cutoffHour) {
        return true;
      }
    }
    
    return false;
  };

  const handleAccept = () => {
    // Don't allow service providers to confirm booking
    if (isServiceDisabled) {
      return;
    }

    // Final validation before saving
    if (startTime) {
      const now = dayjs();
      
      // Check cutoff for start date
      if (isDateDisabled(startTime)) {
        return;
      }
      
      if (
        startTime.isSame(now, "day") &&
        startTime.isBefore(now.add(30, "minute"))
      ) {
        return;
      }

      const hour = startTime.hour();
      if (hour < BUSINESS_HOURS.openingHour || hour >= BUSINESS_HOURS.cutoffHour) {
        return;
      }
    }

    onSave({
      option: selectedOption,
      startDate,
      endDate,
      startTime,
      endTime,
    });
  };

  const getDuration = () => {
    if (!startTime || !endTime) return 1;
    const durationHours = endTime.diff(startTime, "hour", true);
    return Math.max(1, Math.round(durationHours));
  };

  const duration = getDuration();

  // Helper function to get maximum date based on selected option
  const getMaximumDate = () => {
    if (selectedOption === "Monthly") {
      return new Date(maxDate90Days.toISOString());
    }
    return new Date(maxDate21Days.toISOString());
  };

  // If user is service provider, show disabled message
  if (isServiceDisabled) {
    return (
      <Modal visible={open} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.container}>
            <LinearGradient
              colors={["#0a2a66ff", "#004aadff"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.headerContainer}
            >
              <View style={styles.headerContent}>
                <View style={styles.headerLeft} />
                <Text style={styles.title}>Booking Not Available</Text>
                <View style={styles.headerRight}>
                  <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
                    <Icon name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>

            <View style={styles.disabledContainer}>
              <Icon name="info-outline" size={60} color="#FFA500" />
              <Text style={styles.disabledTitle}>Service Provider Account</Text>
              <Text style={styles.disabledMessage}>
                As a service provider, you cannot book services. Please use a customer account to book services.
              </Text>
              <TouchableOpacity
                style={styles.disabledCloseButton}
                onPress={onClose}
              >
                <Text style={styles.disabledCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Custom Time Picker Component
  const renderCustomTimePicker = () => {
    const { validHours, validMinutes } = getValidTimeOptions(
      showCustomTimePicker!,
    );
    const now = dayjs();
    const isToday = tempDate ? dayjs(tempDate).isSame(now, "day") : true;

    // If today is disabled, show message instead of time picker
    if (isToday && isDateDisabled(now)) {
      return (
        <View style={styles.customTimePickerContainer}>
          <Text style={styles.customTimePickerTitle}>
            Select {showCustomTimePicker === "start" ? "Start" : "End"} Time
          </Text>
          <View style={styles.cutoffMessageContainer}>
            <Icon name="access-time" size={40} color="#FF3B30" />
            <Text style={styles.cutoffMessageTitle}>
              Booking Cutoff Reached
            </Text>
            <Text style={styles.cutoffMessageText}>
              Bookings for today are no longer accepted after {BUSINESS_HOURS.cutoffHour}:00 PM.
              Please select a future date.
            </Text>
          </View>
          <View style={styles.customTimePickerActions}>
            <TouchableOpacity
              style={styles.customTimePickerButton}
              onPress={handleCustomTimeCancel}
            >
              <Text style={styles.customTimePickerButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Convert current selection to 24-hour format for validation
    let currentHours24 = customHours;
    if (!use24HourFormat) {
      if (customAmPm === "PM" && customHours !== 12) {
        currentHours24 = customHours + 12;
      } else if (customAmPm === "AM" && customHours === 12) {
        currentHours24 = 0;
      }
    }

    const isCurrentTimeValid = isTimeValid(
      currentHours24,
      customMinutes,
      showCustomTimePicker!,
    );

    const getDisplayTime = () => {
      if (use24HourFormat) {
        return `${currentHours24.toString().padStart(2, "0")}:${customMinutes
          .toString()
          .padStart(2, "0")}`;
      } else {
        return `${customHours}:${customMinutes
          .toString()
          .padStart(2, "0")} ${customAmPm}`;
      }
    };

    const get24HourDisplay = () => {
      let hours24 = customHours;
      if (!use24HourFormat) {
        if (customAmPm === "PM" && customHours !== 12) {
          hours24 = customHours + 12;
        } else if (customAmPm === "AM" && customHours === 12) {
          hours24 = 0;
        }
      }
      return `${hours24.toString().padStart(2, "0")}:${customMinutes
        .toString()
        .padStart(2, "0")}`;
    };

    return (
      <View style={styles.customTimePickerContainer}>
        <Text style={styles.customTimePickerTitle}>
          Select {showCustomTimePicker === "start" ? "Start" : "End"} Time
        </Text>

        <View style={styles.formatToggle}>
          <TouchableOpacity
            style={[
              styles.formatButton,
              !use24HourFormat && styles.formatButtonActive,
            ]}
            onPress={() => setUse24HourFormat(false)}
          >
            <Text
              style={[
                styles.formatButtonText,
                !use24HourFormat && styles.formatButtonTextActive,
              ]}
            >
              12H
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.formatButton,
              use24HourFormat && styles.formatButtonActive,
            ]}
            onPress={() => setUse24HourFormat(true)}
          >
            <Text
              style={[
                styles.formatButtonText,
                use24HourFormat && styles.formatButtonTextActive,
              ]}
            >
              24H
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.timeRangeInfo}>
          Available: {BUSINESS_HOURS.openingHour}:00 AM - {BUSINESS_HOURS.cutoffHour-1}:55 PM ({BUSINESS_HOURS.openingHour.toString().padStart(2, '0')}:00 - {BUSINESS_HOURS.cutoffHour-1}:55 GMT)
          {showCustomTimePicker === "start" && isToday && !isDateDisabled(now)
            ? " • Min. 30 mins from now"
            : ""}
        </Text>

        <View style={styles.customTimePicker}>
          {/* Hours Column */}
          <ScrollView
            style={styles.timeColumn}
            showsVerticalScrollIndicator={false}
          >
            {validHours.map((hour) => {
              let displayHour, displayText;

              if (use24HourFormat) {
                displayHour = hour;
                displayText = hour.toString().padStart(2, "0");
              } else {
                // Convert to 12-hour format for display
                if (hour === 0) {
                  displayHour = 12;
                  displayText = "12";
                } else if (hour < 12) {
                  displayHour = hour;
                  displayText = hour.toString();
                } else if (hour === 12) {
                  displayHour = 12;
                  displayText = "12";
                } else {
                  displayHour = hour - 12;
                  displayText = (hour - 12).toString();
                }
              }

              const isSelected = use24HourFormat
                ? customHours === hour
                : customHours === displayHour &&
                  ((hour < 12 && customAmPm === "AM") ||
                    (hour >= 12 && customAmPm === "PM"));

              return (
                <TouchableOpacity
                  key={hour}
                  style={[
                    styles.timeOption,
                    isSelected && styles.timeOptionSelected,
                  ]}
                  onPress={() => {
                    if (use24HourFormat) {
                      setCustomHours(hour);
                    } else {
                      setCustomHours(displayHour);
                      setCustomAmPm(hour < 12 ? "AM" : "PM");
                    }
                  }}
                >
                  <Text
                    style={[
                      styles.timeOptionText,
                      isSelected && styles.timeOptionTextSelected,
                    ]}
                  >
                    {displayText}
                  </Text>
                  {!use24HourFormat && (
                    <Text
                      style={[
                        styles.timePeriodText,
                        isSelected && styles.timePeriodTextSelected,
                      ]}
                    >
                      {hour < 12 ? "AM" : "PM"}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Minutes Column */}
          <ScrollView
            style={styles.timeColumn}
            showsVerticalScrollIndicator={false}
          >
            {validMinutes.map((minute) => (
              <TouchableOpacity
                key={minute}
                style={[
                  styles.timeOption,
                  customMinutes === minute && styles.timeOptionSelected,
                ]}
                onPress={() => setCustomMinutes(minute)}
              >
                <Text
                  style={[
                    styles.timeOptionText,
                    customMinutes === minute && styles.timeOptionTextSelected,
                  ]}
                >
                  {minute.toString().padStart(2, "0")}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* AM/PM Column - Only show in 12-hour mode */}
          {!use24HourFormat && (
            <View style={styles.timeColumn}>
              <TouchableOpacity
                style={[
                  styles.timeOption,
                  customAmPm === "AM" && styles.timeOptionSelected,
                ]}
                onPress={() => setCustomAmPm("AM")}
              >
                <Text
                  style={[
                    styles.timeOptionText,
                    customAmPm === "AM" && styles.timeOptionTextSelected,
                  ]}
                >
                  AM
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.timeOption,
                  customAmPm === "PM" && styles.timeOptionSelected,
                ]}
                onPress={() => setCustomAmPm("PM")}
              >
                <Text
                  style={[
                    styles.timeOptionText,
                    customAmPm === "PM" && styles.timeOptionTextSelected,
                  ]}
                >
                  PM
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View
          style={[
            styles.selectedTimeDisplay,
            !isCurrentTimeValid && styles.selectedTimeDisplayInvalid,
          ]}
        >
          <Text
            style={[
              styles.selectedTimeText,
              !isCurrentTimeValid && styles.selectedTimeTextInvalid,
            ]}
          >
            Selected: {getDisplayTime()}
          </Text>
          <Text style={styles.gmtTimeText}>GMT: {get24HourDisplay()}</Text>
        </View>

        <View style={styles.customTimePickerActions}>
          <TouchableOpacity
            style={styles.customTimePickerButton}
            onPress={handleCustomTimeCancel}
          >
            <Text style={styles.customTimePickerButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.customTimePickerButton,
              styles.customTimePickerButtonConfirm,
              !isCurrentTimeValid && styles.disabledButton,
            ]}
            onPress={handleCustomTimeConfirm}
            disabled={!isCurrentTimeValid}
          >
            <Text
              style={[
                styles.customTimePickerButtonText,
                styles.customTimePickerButtonTextConfirm,
              ]}
            >
              Confirm
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Confirmation Box Component with Duration Selector and Relax Message
  const renderConfirmationBox = () => {
    if (!startDate || !startTime) return null;

    const currentDuration = startTime && endTime ? endTime.diff(startTime, 'hour') : 1;

    return (
      <View style={styles.confirmationContainer}>
        {/* Header */}
        <View style={styles.confirmationHeader}>
          <Text style={styles.confirmationTitle}>Confirm Your Booking</Text>
        </View>

        {/* Booking Details */}
        <View style={styles.confirmationSection}>
          <Text style={styles.confirmationSubtitle}>Booking Details</Text>
          <Text style={styles.confirmationText}>
            Start Date: {startDate ? dayjs(startDate).format('MMMM D, YYYY') : 'Not selected'}
          </Text>
          <Text style={styles.confirmationText}>
            Start Time: {startTime ? startTime.format('h:mm A') : 'Not selected'}
          </Text>
          <Text style={[styles.confirmationText, styles.confirmationItalic]}>
            Your service is set to start on {startDate ? dayjs(startDate).format('MMMM D, YYYY') : '___'} at {startTime ? startTime.format('h:mm A') : '___'}.
          </Text>
        </View>

        {/* Service Duration */}
        <View style={styles.confirmationSection}>
          <Text style={styles.confirmationSubtitle}>Service Duration</Text>
          <Text style={[styles.confirmationText, styles.confirmationSecondary]}>
            If you need more time, adjust your service duration below.
          </Text>

          {/* Duration Selector */}
          <View style={styles.durationSelector}>
            <TouchableOpacity
              style={[
                styles.durationButton,
                currentDuration <= 1 && styles.durationButtonDisabled
              ]}
              onPress={() => {
                if (startTime && endTime) {
                  const currentDuration = endTime.diff(startTime, 'hour');
                  if (currentDuration > 1) {
                    const newEnd = startTime.add(currentDuration - 1, 'hour');
                    setEndTime(newEnd);
                    setEndDate(newEnd.format("YYYY-MM-DD"));
                  }
                }
              }}
              disabled={!startTime || !endTime || currentDuration <= 1}
            >
              <Text style={[
                styles.durationButtonText,
                currentDuration <= 1 && styles.durationButtonTextDisabled
              ]}>-</Text>
            </TouchableOpacity>

            <View style={styles.durationDisplay}>
              <Text style={styles.durationDisplayText}>
                {currentDuration} hour{currentDuration > 1 ? 's' : ''}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.durationButton,
                (!startTime || !endTime || (endTime && endTime.hour() >= BUSINESS_HOURS.cutoffHour - 1)) && styles.durationButtonDisabled
              ]}
              onPress={() => {
                if (startTime && endTime) {
                  const currentDuration = endTime.diff(startTime, 'hour');
                  const newEnd = startTime.add(currentDuration + 1, 'hour');
                  if (newEnd.hour() < BUSINESS_HOURS.cutoffHour) {
                    setEndTime(newEnd);
                    setEndDate(newEnd.format("YYYY-MM-DD"));
                  }
                }
              }}
              disabled={!startTime || !endTime || (endTime && endTime.hour() >= BUSINESS_HOURS.cutoffHour - 1)}
            >
              <Text style={[
                styles.durationButtonText,
                (!startTime || !endTime || (endTime && endTime.hour() >= BUSINESS_HOURS.cutoffHour - 1)) && styles.durationButtonTextDisabled
              ]}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Relax Message */}
        <View style={styles.relaxMessageContainer}>
          <Text style={styles.relaxMessageText}>
            Relax, we'll handle the rest. Our verified professionals ensure your peace of mind.
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={open} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <ScrollView
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Header with Linear Gradient */}
            <LinearGradient
              colors={["#0a2a66ff", "#004aadff"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.headerContainer}
            >
              <View style={styles.headerContent}>
                <View style={styles.headerLeft}>
                  {/* Empty view for balance */}
                </View>
                
                <Text style={styles.title}>Select your Booking Option</Text>
                
                <View style={styles.headerRight}>
                  <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
                    <Icon name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>

            {/* Radio options */}
            <View style={styles.radioRow}>
              {["Date", "Short term", "Monthly"].map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.radioOption,
                    selectedOption === opt && styles.radioOptionSelected,
                  ]}
                  onPress={() => onOptionChange(opt)}
                >
                  <Text
                    style={[
                      styles.radioText,
                      selectedOption === opt && styles.radioTextSelected,
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* DATE Option */}
            {selectedOption === "Date" && (
              <>
                <View style={styles.dateTimeContainer}>
                  <DribbbleDateTimePicker
                    mode="single"
                    value={startTime?.toDate()}
                    onChange={(date: Date) => {
                      const selected = dayjs(date);
                      const now = dayjs();

                      // ⛔ past dates
                      if (selected.isBefore(now, "day")) return;

                      // ⛔ cutoff time check - disable if today and past cutoff
                      if (isDateDisabled(selected)) {
                        return;
                      }

                      // ⛔ max 21 days
                      if (selected.isAfter(maxDate21Days, "day")) return;

                      // ⛔ 30 min rule
                      if (
                        selected.isSame(now, "day") &&
                        selected.isBefore(now.add(30, "minute"))
                      ) {
                        return;
                      }

                      updateStartDateTime(selected);
                    }}
                  />
                </View>

                {/* Confirmation Box with Relax Message */}
                {renderConfirmationBox()}
              </>
            )}

            {/* SHORT TERM Option */}
            {selectedOption === "Short term" && (
              <>
                <Text style={styles.subtitle}>Select Date Range & Time</Text>

                <View style={styles.dateTimeContainer}>
                  <DribbbleDateTimePicker
                    mode="range"
                    value={{
                      startDate: startTime?.toDate(),
                      endDate: endTime?.toDate(),
                    }}
                    onChange={({ startDate, endDate }) => {
                      const start = dayjs(startDate);
                      const end = dayjs(endDate);

                      // ⛔ past dates
                      if (start.isBefore(dayjs(), "day")) return;

                      // ⛔ cutoff time check for start date
                      if (isDateDisabled(start)) {
                        return;
                      }

                      // ⛔ max 21 days
                      if (end.diff(start, "day") > 21) {
                        return;
                      }

                      setStartDate(start.format("YYYY-MM-DD"));
                      setEndDate(end.format("YYYY-MM-DD"));
                      setStartTime(start);
                      setEndTime(end);
                    }}
                  />
                </View>

                {startTime && endTime && (
                  <View style={styles.confirmBox}>
                    <Text style={styles.sectionTitle}>Booking Details</Text>
                    <Text style={styles.sectionText}>
                      From: {startTime.format("MMM D, YYYY HH:mm")} GMT
                    </Text>
                    <Text style={styles.sectionText}>
                      To: {endTime.format("MMM D, YYYY HH:mm")} GMT
                    </Text>
                  </View>
                )}
              </>
            )}

            {/* MONTHLY Option */}
            {selectedOption === "Monthly" && (
              <>
                <View style={styles.dateTimeContainer}>
                  <DribbbleDateTimePicker
                    mode="single"
                    value={startTime?.toDate()}
                    onChange={(date: Date) => {
                      const start = dayjs(date);

                      if (start.isBefore(dayjs(), "day")) return;
                      
                      // ⛔ cutoff time check
                      if (isDateDisabled(start)) {
                        return;
                      }
                      
                      if (start.isAfter(maxDate90Days, "day")) return;

                      const end = start.add(1, "month");

                      setStartDate(start.format("YYYY-MM-DD"));
                      setStartTime(start);
                      setEndDate(end.format("YYYY-MM-DD"));
                      setEndTime(end);
                    }}
                  />
                </View>

                {startTime && (
                  <View style={styles.confirmBox}>
                    <Text style={styles.sectionTitle}>Monthly Booking</Text>
                    <Text style={styles.sectionText}>
                      Start: {startTime.format("MMMM D, YYYY HH:mm")} GMT
                    </Text>
                    <Text style={styles.sectionText}>
                      End:{" "}
                      {startTime.add(1, "month").format("MMMM D, YYYY HH:mm")}{" "}
                      GMT
                    </Text>
                  </View>
                )}
              </>
            )}

            {/* Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  isConfirmDisabled() && styles.disabledButton,
                ]}
                onPress={handleAccept}
                disabled={isConfirmDisabled()}
              >
                <Text style={styles.confirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default BookingDialog;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "#fff",
    width: Dimensions.get("window").width * 0.9,
    maxHeight: Dimensions.get("window").height * 0.85,
    borderRadius: 12,
    overflow: "hidden",
  },
  headerContainer: {
    padding: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  headerLeft: {
    width: 40,
  },
  headerRight: {
    width: 40,
    alignItems: "flex-end",
  },
  closeIcon: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 5,
    color: "#333",
    paddingHorizontal: 20,
  },
  radioRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  radioOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  radioOptionSelected: {
    backgroundColor: "#007AFF20",
    borderColor: "#007AFF",
  },
  radioText: {
    fontSize: 14,
    color: "#333",
  },
  radioTextSelected: {
    color: "#007AFF",
    fontWeight: "600",
  },
  dateTimeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    paddingHorizontal: 20,
  },
  dateButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginVertical: 6,
  },
  dateButtonText: {
    fontSize: 14,
    color: "#333",
    textAlign: "center",
  },
  confirmBox: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  sectionText: {
    fontSize: 14,
    color: "#444",
    marginBottom: 3,
  },
  durationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  adjustButton: {
    backgroundColor: "#007AFF20",
    padding: 10,
    borderRadius: 6,
    minWidth: 40,
    alignItems: "center",
  },
  adjustText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007AFF",
  },
  durationText: {
    fontSize: 16,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    paddingHorizontal: 20,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007AFF",
  },
  confirmButton: {
    flex: 1,
    marginLeft: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#007AFF",
  },
  confirmText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "600",
  },
  cancelText: {
    color: "#007AFF",
    textAlign: "center",
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: "#ccc",
    opacity: 0.6,
  },
  // Custom Time Picker Styles
  customTimePickerContainer: {
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
    marginHorizontal: 20,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  customTimePickerTitle: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
    color: "#333",
  },
  formatToggle: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 4,
  },
  formatButton: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  formatButtonActive: {
    backgroundColor: "#007AFF",
  },
  formatButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
  },
  formatButtonTextActive: {
    color: "#fff",
  },
  timeRangeInfo: {
    fontSize: 12,
    textAlign: "center",
    color: "#666",
    marginBottom: 16,
    fontStyle: "italic",
  },
  customTimePicker: {
    flexDirection: "row",
    justifyContent: "space-between",
    height: 200,
  },
  timeColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  timeOption: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 2,
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  timeOptionSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  timeOptionText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  timeOptionTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  timePeriodText: {
    fontSize: 10,
    color: "#666",
    marginTop: 2,
  },
  timePeriodTextSelected: {
    color: "#fff",
  },
  selectedTimeDisplay: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007AFF",
    alignItems: "center",
  },
  selectedTimeDisplayInvalid: {
    borderColor: "#FF3B30",
    backgroundColor: "#FF3B3010",
  },
  selectedTimeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
  },
  selectedTimeTextInvalid: {
    color: "#FF3B30",
  },
  gmtTimeText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  validationText: {
    fontSize: 12,
    color: "#FF3B30",
    marginTop: 4,
    textAlign: "center",
  },
  customTimePickerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  customTimePickerButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#007AFF",
    marginHorizontal: 4,
    alignItems: "center",
  },
  customTimePickerButtonConfirm: {
    backgroundColor: "#007AFF",
  },
  customTimePickerButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },
  customTimePickerButtonTextConfirm: {
    color: "#fff",
  },
  // Styles for confirmation box
  confirmationContainer: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: "#fafafa",
  },
  confirmationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  confirmationTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  confirmationSection: {
    marginBottom: 16,
  },
  confirmationSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  confirmationText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  confirmationItalic: {
    fontStyle: "italic",
    color: "#007AFF",
    marginTop: 4,
  },
  confirmationSecondary: {
    color: "#666",
    marginBottom: 8,
  },
  durationSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
  },
  durationButton: {
    borderWidth: 1,
    borderColor: "#007AFF",
    borderRadius: 6,
    minWidth: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  durationButtonDisabled: {
    borderColor: "#ccc",
    backgroundColor: "#f5f5f5",
  },
  durationButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007AFF",
  },
  durationButtonTextDisabled: {
    color: "#999",
  },
  durationDisplay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  durationDisplayText: {
    fontSize: 18,
    fontWeight: "600",
  },
  // Relax Message Styles
  relaxMessageContainer: {
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f0f8ff",
    borderRadius: 8,
    marginTop: 8,
  },
  relaxMessageText: {
    fontSize: 12,
    fontStyle: "italic",
    color: "#666",
    textAlign: "center",
  },
  // Cutoff message styles
  cutoffMessageContainer: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 8,
    marginVertical: 10,
  },
  cutoffMessageTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FF3B30",
    marginTop: 10,
    marginBottom: 5,
  },
  cutoffMessageText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  // Disabled styles for service providers
  disabledContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  disabledTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFA500",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
  },
  disabledMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
  },
  disabledCloseButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  disabledCloseButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});