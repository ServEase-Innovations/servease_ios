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
import { useTranslation } from 'react-i18next';
import { useTheme } from "../../src/Settings/ThemeContext";

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
  const { t } = useTranslation();
  const { colors, isDarkMode, fontSize } = useTheme();
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

  // Get font size based on theme settings
  const getFontSizes = () => {
    switch (fontSize) {
      case 'small':
        return {
          title: 16,
          subtitle: 13,
          text: 12,
          small: 11,
          button: 13,
          sectionTitle: 15,
        };
      case 'large':
        return {
          title: 20,
          subtitle: 16,
          text: 15,
          small: 13,
          button: 16,
          sectionTitle: 18,
        };
      default:
        return {
          title: 18,
          subtitle: 14,
          text: 14,
          small: 12,
          button: 14,
          sectionTitle: 16,
        };
    }
  };

  const fontSizes = getFontSizes();

  // If user is service provider, show disabled message
  if (isServiceDisabled) {
    return (
      <Modal visible={open} transparent animationType="fade">
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.container, { backgroundColor: colors.card }]}>
            <LinearGradient
              colors={["#0a2a66ff", "#004aadff"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.headerContainer}
            >
              <View style={styles.headerContent}>
                <View style={styles.headerLeft} />
                <Text style={[styles.title, { color: "#fff", fontSize: fontSizes.title }]}>{t('booking.disabled.title')}</Text>
                <View style={styles.headerRight}>
                  <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
                    <Icon name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>

            <View style={[styles.disabledContainer, { backgroundColor: colors.card }]}>
              <Icon name="info-outline" size={60} color="#FFA500" />
              <Text style={[styles.disabledTitle, { color: colors.text, fontSize: fontSizes.title }]}>{t('booking.disabled.serviceProvider')}</Text>
              <Text style={[styles.disabledMessage, { color: colors.textSecondary, fontSize: fontSizes.text }]}>
                {t('booking.disabled.message')}
              </Text>
              <TouchableOpacity
                style={[styles.disabledCloseButton, { backgroundColor: colors.primary }]}
                onPress={onClose}
              >
                <Text style={[styles.disabledCloseButtonText, { color: '#fff', fontSize: fontSizes.button }]}>{t('common.close')}</Text>
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
        <View style={[styles.customTimePickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.customTimePickerTitle, { color: colors.text, fontSize: fontSizes.sectionTitle }]}>
            {t('booking.selectDateTime')} {showCustomTimePicker === "start" ? t('booking.startTime') : t('booking.endTime')}
          </Text>
          <View style={[styles.cutoffMessageContainer, { backgroundColor: colors.card }]}>
            <Icon name="access-time" size={40} color={colors.error} />
            <Text style={[styles.cutoffMessageTitle, { color: colors.error, fontSize: fontSizes.title }]}>
              {t('booking.cutoff.title')}
            </Text>
            <Text style={[styles.cutoffMessageText, { color: colors.textSecondary, fontSize: fontSizes.text }]}>
              {t('booking.cutoff.message', { time: `${BUSINESS_HOURS.cutoffHour}:00` })}
            </Text>
          </View>
          <View style={styles.customTimePickerActions}>
            <TouchableOpacity
              style={[styles.customTimePickerButton, { borderColor: colors.primary }]}
              onPress={handleCustomTimeCancel}
            >
              <Text style={[styles.customTimePickerButtonText, { color: colors.primary, fontSize: fontSizes.button }]}>{t('common.cancel')}</Text>
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
      <View style={[styles.customTimePickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.customTimePickerTitle, { color: colors.text, fontSize: fontSizes.sectionTitle }]}>
          {t('booking.selectDateTime')} {showCustomTimePicker === "start" ? t('booking.startTime') : t('booking.endTime')}
        </Text>

        <View style={[styles.formatToggle, { backgroundColor: colors.surface2 }]}>
          <TouchableOpacity
            style={[
              styles.formatButton,
              !use24HourFormat && [styles.formatButtonActive, { backgroundColor: colors.primary }],
            ]}
            onPress={() => setUse24HourFormat(false)}
          >
            <Text
              style={[
                styles.formatButtonText,
                { color: colors.textSecondary, fontSize: fontSizes.small },
                !use24HourFormat && { color: '#fff' },
              ]}
            >
              12H
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.formatButton,
              use24HourFormat && [styles.formatButtonActive, { backgroundColor: colors.primary }],
            ]}
            onPress={() => setUse24HourFormat(true)}
          >
            <Text
              style={[
                styles.formatButtonText,
                { color: colors.textSecondary, fontSize: fontSizes.small },
                use24HourFormat && { color: '#fff' },
              ]}
            >
              24H
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.timeRangeInfo, { color: colors.textSecondary, fontSize: fontSizes.small }]}>
          {t('booking.available')}: {BUSINESS_HOURS.openingHour}:00 AM - {BUSINESS_HOURS.cutoffHour-1}:55 PM ({BUSINESS_HOURS.openingHour.toString().padStart(2, '0')}:00 - {BUSINESS_HOURS.cutoffHour-1}:55 GMT)
          {showCustomTimePicker === "start" && isToday && !isDateDisabled(now)
            ? ` • ${t('booking.min30')}`
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
                    { backgroundColor: colors.card, borderColor: colors.border },
                    isSelected && [styles.timeOptionSelected, { backgroundColor: colors.primary, borderColor: colors.primary }],
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
                      { color: colors.text, fontSize: fontSizes.text },
                      isSelected && { color: '#fff' },
                    ]}
                  >
                    {displayText}
                  </Text>
                  {!use24HourFormat && (
                    <Text
                      style={[
                        styles.timePeriodText,
                        { color: colors.textSecondary, fontSize: fontSizes.small },
                        isSelected && { color: '#fff' },
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
                  { backgroundColor: colors.card, borderColor: colors.border },
                  customMinutes === minute && [styles.timeOptionSelected, { backgroundColor: colors.primary, borderColor: colors.primary }],
                ]}
                onPress={() => setCustomMinutes(minute)}
              >
                <Text
                  style={[
                    styles.timeOptionText,
                    { color: colors.text, fontSize: fontSizes.text },
                    customMinutes === minute && { color: '#fff' },
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
                  { backgroundColor: colors.card, borderColor: colors.border },
                  customAmPm === "AM" && [styles.timeOptionSelected, { backgroundColor: colors.primary, borderColor: colors.primary }],
                ]}
                onPress={() => setCustomAmPm("AM")}
              >
                <Text
                  style={[
                    styles.timeOptionText,
                    { color: colors.text, fontSize: fontSizes.text },
                    customAmPm === "AM" && { color: '#fff' },
                  ]}
                >
                  AM
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.timeOption,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  customAmPm === "PM" && [styles.timeOptionSelected, { backgroundColor: colors.primary, borderColor: colors.primary }],
                ]}
                onPress={() => setCustomAmPm("PM")}
              >
                <Text
                  style={[
                    styles.timeOptionText,
                    { color: colors.text, fontSize: fontSizes.text },
                    customAmPm === "PM" && { color: '#fff' },
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
            { borderColor: colors.primary, backgroundColor: colors.card },
            !isCurrentTimeValid && { borderColor: colors.error, backgroundColor: colors.errorLight },
          ]}
        >
          <Text
            style={[
              styles.selectedTimeText,
              { color: colors.primary, fontSize: fontSizes.text },
              !isCurrentTimeValid && { color: colors.error },
            ]}
          >
            {t('booking.selected')}: {getDisplayTime()}
          </Text>
          <Text style={[styles.gmtTimeText, { color: colors.textSecondary, fontSize: fontSizes.small }]}>GMT: {get24HourDisplay()}</Text>
        </View>

        <View style={styles.customTimePickerActions}>
          <TouchableOpacity
            style={[styles.customTimePickerButton, { borderColor: colors.primary }]}
            onPress={handleCustomTimeCancel}
          >
            <Text style={[styles.customTimePickerButtonText, { color: colors.primary, fontSize: fontSizes.button }]}>{t('common.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.customTimePickerButton,
              styles.customTimePickerButtonConfirm,
              { backgroundColor: colors.primary },
              !isCurrentTimeValid && [styles.disabledButton, { backgroundColor: colors.disabled }],
            ]}
            onPress={handleCustomTimeConfirm}
            disabled={!isCurrentTimeValid}
          >
            <Text
              style={[
                styles.customTimePickerButtonText,
                styles.customTimePickerButtonTextConfirm,
                { color: '#fff', fontSize: fontSizes.button },
              ]}
            >
              {t('common.confirm')}
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
      <View style={[styles.confirmationContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {/* Header */}
        <View style={styles.confirmationHeader}>
          <Text style={[styles.confirmationTitle, { color: colors.text, fontSize: fontSizes.sectionTitle }]}>{t('booking.confirmBox.title')}</Text>
        </View>

        {/* Booking Details */}
        <View style={styles.confirmationSection}>
          <Text style={[styles.confirmationSubtitle, { color: colors.primary, fontSize: fontSizes.subtitle }]}>{t('booking.bookingDetails')}</Text>
          <Text style={[styles.confirmationText, { color: colors.textSecondary, fontSize: fontSizes.text }]}>
            {t('booking.startDate')}: {startDate ? dayjs(startDate).format('MMMM D, YYYY') : t('common.notSelected')}
          </Text>
          <Text style={[styles.confirmationText, { color: colors.textSecondary, fontSize: fontSizes.text }]}>
            {t('booking.startTime')}: {startTime ? startTime.format('h:mm A') : t('common.notSelected')}
          </Text>
          <Text style={[styles.confirmationText, styles.confirmationItalic, { color: colors.primary, fontSize: fontSizes.small }]}>
            {t('booking.confirmBox.serviceStarts', { 
              date: startDate ? dayjs(startDate).format('MMMM D, YYYY') : '___', 
              time: startTime ? startTime.format('h:mm A') : '___' 
            })}
          </Text>
        </View>

        {/* Service Duration */}
        <View style={styles.confirmationSection}>
          <Text style={[styles.confirmationSubtitle, { color: colors.primary, fontSize: fontSizes.subtitle }]}>{t('booking.confirmBox.serviceDuration')}</Text>
          <Text style={[styles.confirmationText, styles.confirmationSecondary, { color: colors.textSecondary, fontSize: fontSizes.small }]}>
            {t('booking.confirmBox.adjustDuration')}
          </Text>

          {/* Duration Selector */}
          <View style={[styles.durationSelector, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.durationButton,
                { borderColor: colors.primary, backgroundColor: colors.card },
                currentDuration <= 1 && [styles.durationButtonDisabled, { borderColor: colors.disabled, backgroundColor: colors.surface }]
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
                { color: colors.primary, fontSize: fontSizes.title },
                currentDuration <= 1 && { color: colors.disabled }
              ]}>-</Text>
            </TouchableOpacity>

            <View style={styles.durationDisplay}>
              <Text style={[styles.durationDisplayText, { color: colors.text, fontSize: fontSizes.title }]}>
                {currentDuration} {t('booking.hours', { count: currentDuration })}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.durationButton,
                { borderColor: colors.primary, backgroundColor: colors.card },
                (!startTime || !endTime || (endTime && endTime.hour() >= BUSINESS_HOURS.cutoffHour - 1)) && [styles.durationButtonDisabled, { borderColor: colors.disabled, backgroundColor: colors.surface }]
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
                { color: colors.primary, fontSize: fontSizes.title },
                (!startTime || !endTime || (endTime && endTime.hour() >= BUSINESS_HOURS.cutoffHour - 1)) && { color: colors.disabled }
              ]}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Relax Message */}
        <View style={[styles.relaxMessageContainer, { backgroundColor: colors.infoLight }]}>
          <Text style={[styles.relaxMessageText, { color: colors.textSecondary, fontSize: fontSizes.small }]}>
            {t('booking.confirmBox.relaxMessage')}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={open} transparent animationType="fade">
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.container, { backgroundColor: colors.card }]}>
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
                
                <Text style={[styles.title, { color: "#fff", fontSize: fontSizes.title }]}>{t('booking.selectBookingOption')}</Text>
                
                <View style={styles.headerRight}>
                  <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
                    <Icon name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>

            {/* Radio options */}
            <View style={styles.radioRow}>
              {[t('booking.options.date'), t('booking.options.shortTerm'), t('booking.options.monthly')].map((opt, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.radioOption,
                    { borderColor: colors.border },
                    selectedOption === opt && [styles.radioOptionSelected, { backgroundColor: colors.primary + '20', borderColor: colors.primary }],
                  ]}
                  onPress={() => onOptionChange(opt)}
                >
                  <Text
                    style={[
                      styles.radioText,
                      { color: colors.text, fontSize: fontSizes.text },
                      selectedOption === opt && [styles.radioTextSelected, { color: colors.primary }],
                    ]}
                  >
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* DATE Option */}
            {selectedOption === t('booking.options.date') && (
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
            {selectedOption === t('booking.options.shortTerm') && (
              <>
                <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: fontSizes.subtitle }]}>{t('booking.selectDateTime')}</Text>

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
                  <View style={[styles.confirmBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSizes.sectionTitle }]}>{t('booking.bookingDetails')}</Text>
                    <Text style={[styles.sectionText, { color: colors.textSecondary, fontSize: fontSizes.text }]}>
                      {t('booking.from')}: {startTime.format("MMM D, YYYY HH:mm")} GMT
                    </Text>
                    <Text style={[styles.sectionText, { color: colors.textSecondary, fontSize: fontSizes.text }]}>
                      {t('booking.to')}: {endTime.format("MMM D, YYYY HH:mm")} GMT
                    </Text>
                  </View>
                )}
              </>
            )}

            {/* MONTHLY Option */}
            {selectedOption === t('booking.options.monthly') && (
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
                  <View style={[styles.confirmBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSizes.sectionTitle }]}>{t('booking.monthly')}</Text>
                    <Text style={[styles.sectionText, { color: colors.textSecondary, fontSize: fontSizes.text }]}>
                      {t('booking.start')}: {startTime.format("MMMM D, YYYY HH:mm")} GMT
                    </Text>
                    <Text style={[styles.sectionText, { color: colors.textSecondary, fontSize: fontSizes.text }]}>
                      {t('booking.end')}:{" "}
                      {startTime.add(1, "month").format("MMMM D, YYYY HH:mm")}{" "}
                      GMT
                    </Text>
                  </View>
                )}
              </>
            )}

            {/* Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity style={[styles.cancelButton, { borderColor: colors.primary }]} onPress={onClose}>
                <Text style={[styles.cancelText, { color: colors.primary, fontSize: fontSizes.button }]}>{t('common.cancel')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  { backgroundColor: colors.primary },
                  isConfirmDisabled() && [styles.disabledButton, { backgroundColor: colors.disabled }],
                ]}
                onPress={handleAccept}
                disabled={isConfirmDisabled()}
              >
                <Text style={[styles.confirmText, { color: '#fff', fontSize: fontSizes.button }]}>{t('common.confirm')}</Text>
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
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
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
    fontWeight: "700",
    textAlign: "center",
    flex: 1,
  },
  subtitle: {
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 5,
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
  },
  radioOptionSelected: {
    backgroundColor: "#007AFF20",
  },
  radioText: {
    fontSize: 14,
  },
  radioTextSelected: {
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
    borderRadius: 8,
    padding: 12,
    marginVertical: 6,
  },
  dateButtonText: {
    fontSize: 14,
    textAlign: "center",
  },
  confirmBox: {
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
    marginHorizontal: 20,
    borderWidth: 1,
  },
  sectionTitle: {
    fontWeight: "700",
    marginBottom: 4,
  },
  sectionText: {
    fontSize: 14,
    marginBottom: 3,
  },
  durationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  adjustButton: {
    padding: 10,
    borderRadius: 6,
    minWidth: 40,
    alignItems: "center",
  },
  adjustText: {
    fontSize: 20,
    fontWeight: "bold",
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
  },
  confirmButton: {
    flex: 1,
    marginLeft: 8,
    padding: 12,
    borderRadius: 8,
  },
  confirmText: {
    textAlign: "center",
    fontWeight: "600",
  },
  cancelText: {
    textAlign: "center",
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
  // Custom Time Picker Styles
  customTimePickerContainer: {
    borderRadius: 12,
    padding: 16,
    marginTop: 10,
    marginHorizontal: 20,
    borderWidth: 1,
  },
  customTimePickerTitle: {
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  formatToggle: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
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
    fontWeight: "600",
  },
  timeRangeInfo: {
    textAlign: "center",
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
    borderWidth: 1,
  },
  timeOptionSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  timeOptionText: {
    fontWeight: "500",
  },
  timePeriodText: {
    marginTop: 2,
  },
  selectedTimeDisplay: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  selectedTimeText: {
    fontWeight: "600",
  },
  gmtTimeText: {
    marginTop: 4,
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
    marginHorizontal: 4,
    alignItems: "center",
  },
  customTimePickerButtonConfirm: {
    backgroundColor: "#007AFF",
  },
  customTimePickerButtonText: {
    fontWeight: "600",
  },
  customTimePickerButtonTextConfirm: {
    color: "#fff",
  },
  // Styles for confirmation box
  confirmationContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 10,
  },
  confirmationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  confirmationTitle: {
    fontWeight: "600",
  },
  confirmationSection: {
    marginBottom: 16,
  },
  confirmationSubtitle: {
    fontWeight: "600",
    marginBottom: 8,
  },
  confirmationText: {
    marginBottom: 4,
  },
  confirmationItalic: {
    fontStyle: "italic",
    marginTop: 4,
  },
  confirmationSecondary: {
    marginBottom: 8,
  },
  durationSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  durationButton: {
    borderWidth: 1,
    borderRadius: 6,
    minWidth: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  durationButtonDisabled: {
    borderColor: "#ccc",
    backgroundColor: "#f5f5f5",
  },
  durationButtonText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  durationDisplay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  durationDisplayText: {
    fontWeight: "600",
  },
  // Relax Message Styles
  relaxMessageContainer: {
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  relaxMessageText: {
    fontStyle: "italic",
    textAlign: "center",
  },
  // Cutoff message styles
  cutoffMessageContainer: {
    alignItems: "center",
    padding: 20,
    borderRadius: 8,
    marginVertical: 10,
  },
  cutoffMessageTitle: {
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 5,
  },
  cutoffMessageText: {
    textAlign: "center",
    lineHeight: 20,
  },
  // Disabled styles for service providers
  disabledContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledTitle: {
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
  },
  disabledMessage: {
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
  },
  disabledCloseButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  disabledCloseButtonText: {
    fontWeight: "600",
  },
});