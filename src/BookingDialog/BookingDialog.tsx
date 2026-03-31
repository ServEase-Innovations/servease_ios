/* eslint-disable */
import React, { useState, useEffect, useRef } from "react";
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
  const [lastSelectedDate, setLastSelectedDate] = useState<Dayjs | null>(null);
  const [localStartDate, setLocalStartDate] = useState<string | null>(null);
  const [localEndDate, setLocalEndDate] = useState<string | null>(null);
  const [localStartTime, setLocalStartTime] = useState<Dayjs | null>(null);
  const [localEndTime, setLocalEndTime] = useState<Dayjs | null>(null);
  const [tempSelectedTime, setTempSelectedTime] = useState<string | null>(null);

  useEffect(() => {
    if (appUser) {
      const userRole = appUser.role || "CUSTOMER";
      setRole(userRole);
      setIsServiceDisabled(userRole === "SERVICE_PROVIDER");
    }
  }, [appUser]);

  // Sync local state with props
  useEffect(() => {
    if (open) {
      setLocalStartDate(startDate);
      setLocalEndDate(endDate);
      setLocalStartTime(startTime);
      setLocalEndTime(endTime);
    }
  }, [open, startDate, endDate, startTime, endTime]);

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
  const [isDateChanged, setIsDateChanged] = useState<boolean>(false);

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
    
    if (date.isBefore(now, 'day')) return true;
    
    if (date.isSame(now, 'day')) {
      const currentTotalMinutes = now.hour() * 60 + now.minute();
      const cutoffTotalMinutes = BUSINESS_HOURS.cutoffHour * 60 + BUSINESS_HOURS.cutoffMinute;
      
      // Disable today if current time is at or after cutoff
      if (currentTotalMinutes >= cutoffTotalMinutes) {
        return true;
      }
    }
    
    return false;
  };

  // Reset all booking state when modal closes
  useEffect(() => {
    if (!open) {
      setShowDatePicker(null);
      setShowCustomTimePicker(null);
      setTempDate(null);
      setLocalStartDate(null);
      setLocalEndDate(null);
      setLocalStartTime(null);
      setLocalEndTime(null);
      setLastSelectedDate(null);
      setCustomHours(12);
      setCustomMinutes(0);
      setCustomAmPm("AM");
      setUse24HourFormat(false);
      setIsDateChanged(false);
      setTempSelectedTime(null);
    }
  }, [open]);

  // Reset time selection when date changes
  useEffect(() => {
    if (isDateChanged) {
      // Reset times when date changes
      setLocalStartTime(null);
      setLocalEndTime(null);
      setCustomHours(12);
      setCustomMinutes(0);
      setCustomAmPm("AM");
      setIsDateChanged(false);
      setTempSelectedTime(null);
    }
  }, [isDateChanged]);

  // Initialize custom time picker with current time
  useEffect(() => {
    if (showCustomTimePicker) {
      const currentTime =
        showCustomTimePicker === "start" ? localStartTime : localEndTime;
      const now = dayjs();
      let defaultTime = now.add(30, "minute");

      if (currentTime) {
        defaultTime = currentTime;
      }

      if (defaultTime.hour() < BUSINESS_HOURS.openingHour) {
        defaultTime = defaultTime.hour(BUSINESS_HOURS.openingHour).minute(0);
      } else if (defaultTime.hour() >= BUSINESS_HOURS.cutoffHour) {
        defaultTime = defaultTime.hour(BUSINESS_HOURS.cutoffHour - 1).minute(55);
      }

      const hours = defaultTime.hour();
      const minutes = defaultTime.minute();

      if (use24HourFormat) {
        setCustomHours(hours);
      } else {
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
  }, [showCustomTimePicker, localStartTime, localEndTime, use24HourFormat]);

  const isTimeValid = (
    hours24: number,
    minutes: number,
    type: "start" | "end",
  ): boolean => {
    const now = dayjs();
    const selectedDateTime = tempDate
      ? dayjs(tempDate).hour(hours24).minute(minutes)
      : dayjs().hour(hours24).minute(minutes);

    if (isDateDisabled(selectedDateTime)) {
      return false;
    }

    if (type === "start") {
      if (
        selectedDateTime.isSame(now, "day") &&
        selectedDateTime.isBefore(now.add(30, "minute"))
      ) {
        return false;
      }
    }

    if (hours24 < BUSINESS_HOURS.openingHour || hours24 >= BUSINESS_HOURS.cutoffHour) {
      return false;
    }

    return true;
  };

  const getValidTimeOptions = (type: "start" | "end") => {
    const now = dayjs();
    const isToday = tempDate ? dayjs(tempDate).isSame(now, "day") : true;

    if (isToday && isDateDisabled(now)) {
      return { validHours: [], validMinutes: [] };
    }

    const hours24 = [
      5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
    ];
    const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

    const validHours = hours24.filter((hour24) => {
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
      let hours24 = customHours;
      if (!use24HourFormat) {
        if (customAmPm === "PM" && customHours !== 12) {
          hours24 = customHours + 12;
        } else if (customAmPm === "AM" && customHours === 12) {
          hours24 = 0;
        }
      }

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
          showCustomTimePicker === "start" ? localStartTime : localEndTime;
        if (currentDateTime) {
          selectedDateTime = currentDateTime
            .hour(hours24)
            .minute(customMinutes)
            .second(0)
            .millisecond(0);
        } else {
          selectedDateTime = dayjs()
            .hour(hours24)
            .minute(customMinutes)
            .second(0)
            .millisecond(0);
        }
      }

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
    
    if (isDateDisabled(adjustedDateTime)) {
      return;
    }

    if (adjustedDateTime.isSame(today, 'day')) {
      const nowPlus30 = today.add(30, 'minute');
      
      if (adjustedDateTime.isBefore(nowPlus30)) {
        adjustedDateTime = nowPlus30;
      }
      
      if (adjustedDateTime.hour() < BUSINESS_HOURS.openingHour) {
        adjustedDateTime = adjustedDateTime.hour(BUSINESS_HOURS.openingHour).minute(0);
      } else if (adjustedDateTime.hour() >= BUSINESS_HOURS.cutoffHour) {
        adjustedDateTime = adjustedDateTime.hour(BUSINESS_HOURS.cutoffHour - 1).minute(55);
      }
    } else {
      if (adjustedDateTime.hour() === 0 && adjustedDateTime.minute() === 0) {
        adjustedDateTime = adjustedDateTime.hour(BUSINESS_HOURS.openingHour).minute(0);
      }
    }

    setLocalStartDate(adjustedDateTime.format("YYYY-MM-DD"));
    setLocalStartTime(adjustedDateTime);
    setLastSelectedDate(adjustedDateTime);
    setStartDate(adjustedDateTime.format("YYYY-MM-DD"));
    setStartTime(adjustedDateTime);

    const defaultEndTime = adjustedDateTime.add(1, "hour");
    
    if (selectedOption === t('booking.options.date')) {
      let finalEnd = defaultEndTime;
      if (defaultEndTime.hour() >= BUSINESS_HOURS.cutoffHour) {
        finalEnd = adjustedDateTime.hour(BUSINESS_HOURS.cutoffHour - 1).minute(55);
      }
      setLocalEndDate(finalEnd.format("YYYY-MM-DD"));
      setLocalEndTime(finalEnd);
      setEndDate(finalEnd.format("YYYY-MM-DD"));
      setEndTime(finalEnd);
    } else if (selectedOption === t('booking.options.monthly')) {
      const endDateValue = adjustedDateTime.add(1, "month");
      setLocalEndDate(endDateValue.format("YYYY-MM-DD"));
      setLocalEndTime(defaultEndTime);
      setEndDate(endDateValue.format("YYYY-MM-DD"));
      setEndTime(defaultEndTime);
    } else if (selectedOption === t('booking.options.shortTerm')) {
      // For short term, only set end date if it's a range selection
      if (localEndDate) {
        setLocalEndTime(defaultEndTime);
        setEndTime(defaultEndTime);
      }
    }
  };

  const updateEndDateTime = (newDateTime: Dayjs) => {
    let adjustedDateTime = newDateTime;

    if (localStartTime && newDateTime.isBefore(localStartTime)) {
      adjustedDateTime = localStartTime.add(1, "hour");
    }

    const hour = adjustedDateTime.hour();
    if (hour < BUSINESS_HOURS.openingHour) {
      adjustedDateTime = adjustedDateTime.hour(BUSINESS_HOURS.openingHour).minute(0);
    } else if (hour >= BUSINESS_HOURS.cutoffHour) {
      adjustedDateTime = adjustedDateTime.hour(BUSINESS_HOURS.cutoffHour - 1).minute(55);
    }

    setLocalEndDate(adjustedDateTime.format("YYYY-MM-DD"));
    setLocalEndTime(adjustedDateTime);
    setEndDate(adjustedDateTime.format("YYYY-MM-DD"));
    setEndTime(adjustedDateTime);
  };

  const handleDateTimeChange = (date: Date, time?: string, isRange?: boolean, startDateObj?: Date, endDateObj?: Date) => {
    if (isRange && startDateObj && endDateObj) {
      // Handle range selection from DribbbleDateTimePicker
      const start = dayjs(startDateObj);
      const end = dayjs(endDateObj);
      
      // Parse time if provided
      if (time) {
        const [t, meridian] = time.split(" ");
        let hour = Number(t.split(":")[0]);
        
        if (meridian === "PM" && hour !== 12) hour += 12;
        if (meridian === "AM" && hour === 12) hour = 0;
        
        const startWithTime = start.hour(hour).minute(0);
        const endWithTime = end.hour(hour).minute(0);
        
        if (!isDateDisabled(startWithTime)) {
          setLocalStartDate(startWithTime.format("YYYY-MM-DD"));
          setLocalStartTime(startWithTime);
          setStartDate(startWithTime.format("YYYY-MM-DD"));
          setStartTime(startWithTime);
          
          setLocalEndDate(endWithTime.format("YYYY-MM-DD"));
          setLocalEndTime(endWithTime);
          setEndDate(endWithTime.format("YYYY-MM-DD"));
          setEndTime(endWithTime);
        }
      }
    } else if (date) {
      // Handle single date selection
      const selected = dayjs(date);
      
      if (!isDateDisabled(selected)) {
        updateStartDateTime(selected);
      }
    }
  };

  const handleTimeSelection = (time: string, dateObj?: Date) => {
    const [t, meridian] = time.split(" ");
    let hour = Number(t.split(":")[0]);
    
    if (meridian === "PM" && hour !== 12) hour += 12;
    if (meridian === "AM" && hour === 12) hour = 0;
    
    let selectedDateTime: Dayjs;
    
    if (dateObj) {
      selectedDateTime = dayjs(dateObj).hour(hour).minute(0);
    } else if (localStartDate) {
      selectedDateTime = dayjs(localStartDate).hour(hour).minute(0);
    } else {
      selectedDateTime = dayjs().hour(hour).minute(0);
    }
    
    if (!isDateDisabled(selectedDateTime)) {
      updateStartDateTime(selectedDateTime);
      setTempSelectedTime(time);
    }
  };

  const isConfirmDisabled = () => {
    if (isServiceDisabled) {
      return true;
    }

    if (selectedOption === t('booking.options.date')) {
      if (!localStartDate || !localStartTime) return true;
      
      // Check if start time is valid
      if (isDateDisabled(localStartTime)) {
        return true;
      }
      
      const now = dayjs();
      if (localStartTime.isSame(now, "day") && localStartTime.isBefore(now.add(30, "minute"))) {
        return true;
      }
      
      const hour = localStartTime.hour();
      if (hour < BUSINESS_HOURS.openingHour || hour >= BUSINESS_HOURS.cutoffHour) {
        return true;
      }
      
      return false;
    } else if (selectedOption === t('booking.options.shortTerm')) {
      if (!localStartDate || !localEndDate || !localStartTime || !localEndTime) return true;
      
      if (isDateDisabled(localStartTime)) {
        return true;
      }
      
      const now = dayjs();
      if (localStartTime.isSame(now, "day") && localStartTime.isBefore(now.add(30, "minute"))) {
        return true;
      }
      
      const startHour = localStartTime.hour();
      if (startHour < BUSINESS_HOURS.openingHour || startHour >= BUSINESS_HOURS.cutoffHour) {
        return true;
      }
      
      if (localEndTime.isBefore(localStartTime)) return true;
      
      const endHour = localEndTime.hour();
      if (endHour < BUSINESS_HOURS.openingHour || endHour >= BUSINESS_HOURS.cutoffHour) {
        return true;
      }
      
      return false;
    } else if (selectedOption === t('booking.options.monthly')) {
      if (!localStartDate || !localStartTime) return true;
      
      if (isDateDisabled(localStartTime)) {
        return true;
      }
      
      const now = dayjs();
      if (localStartTime.isSame(now, "day") && localStartTime.isBefore(now.add(30, "minute"))) {
        return true;
      }
      
      const startHour = localStartTime.hour();
      if (startHour < BUSINESS_HOURS.openingHour || startHour >= BUSINESS_HOURS.cutoffHour) {
        return true;
      }
      
      return false;
    }
    
    return false;
  };

  const handleAccept = () => {
    if (isServiceDisabled) {
      return;
    }

    if (!isConfirmDisabled()) {
      onSave({
        option: selectedOption,
        startDate: localStartDate,
        endDate: localEndDate,
        startTime: localStartTime,
        endTime: localEndTime,
      });
    }
  };

  const getDuration = () => {
    if (!localStartTime || !localEndTime) return 1;
    const durationHours = localEndTime.diff(localStartTime, "hour", true);
    return Math.max(1, Math.round(durationHours));
  };

  const duration = getDuration();

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

  const renderDurationSelector = () => {
    if (!localStartTime) return null;

    if (selectedOption === t('booking.options.monthly') && !localEndTime) return null;
    
    if (selectedOption === t('booking.options.shortTerm') && (!localStartDate || !localEndDate)) return null;

    const currentDuration = localEndTime ? localEndTime.diff(localStartTime, 'hour') : 1;
    
    const canIncreaseDuration = () => {
      if (!localStartTime) return false;
      const newEndTime = localStartTime.add(currentDuration + 1, 'hour');
      return newEndTime.hour() < BUSINESS_HOURS.cutoffHour;
    };

    const canDecreaseDuration = () => {
      return currentDuration > 1;
    };

    const handleIncreaseDuration = () => {
      if (!localStartTime) return;
      
      const newEndTime = localStartTime.add(currentDuration + 1, 'hour');
      
      if (newEndTime.hour() >= BUSINESS_HOURS.cutoffHour) {
        return;
      }
      
      setLocalEndTime(newEndTime);
      setEndTime(newEndTime);
      if (selectedOption === t('booking.options.date')) {
        setLocalEndDate(newEndTime.format("YYYY-MM-DD"));
        setEndDate(newEndTime.format("YYYY-MM-DD"));
      }
    };

    const handleDecreaseDuration = () => {
      if (!localStartTime) return;
      
      if (currentDuration > 1) {
        const newEndTime = localStartTime.add(currentDuration - 1, 'hour');
        setLocalEndTime(newEndTime);
        setEndTime(newEndTime);
        if (selectedOption === t('booking.options.date')) {
          setLocalEndDate(newEndTime.format("YYYY-MM-DD"));
          setEndDate(newEndTime.format("YYYY-MM-DD"));
        }
      }
    };

    // Format the duration message based on booking type
    const getDurationMessage = () => {
      if (selectedOption === t('booking.options.shortTerm')) {
        return t('booking.confirmBox.durationAppliesShortTerm');
      } else if (selectedOption === t('booking.options.monthly')) {
        return t('booking.confirmBox.durationAppliesMonthly');
      }
      return t('booking.confirmBox.adjustDuration');
    };

    return (
      <View style={[styles.confirmationContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.confirmationHeader}>
          <Text style={[styles.confirmationTitle, { color: colors.text, fontSize: fontSizes.sectionTitle }]}>
            {t('booking.confirmBox.title')}
          </Text>
        </View>

        <View style={styles.confirmationSection}>
          <Text style={[styles.confirmationSubtitle, { color: colors.primary, fontSize: fontSizes.subtitle }]}>
            {t('booking.confirmBox.bookingDetails')}
          </Text>
          <Text style={[styles.confirmationText, { color: colors.textSecondary, fontSize: fontSizes.text }]}>
            {t('booking.startDate')}: {localStartDate ? dayjs(localStartDate).format('MMMM D, YYYY') : t('common.notSelected')}
          </Text>
          {selectedOption === t('booking.options.monthly') && localEndDate && (
            <Text style={[styles.confirmationText, { color: colors.textSecondary, fontSize: fontSizes.text }]}>
              {t('booking.endDate')}: {dayjs(localEndDate).format('MMMM D, YYYY')} (1 month later)
            </Text>
          )}
          {selectedOption === t('booking.options.shortTerm') && localEndDate && (
            <Text style={[styles.confirmationText, { color: colors.textSecondary, fontSize: fontSizes.text }]}>
              {t('booking.endDate')}: {dayjs(localEndDate).format('MMMM D, YYYY')}
            </Text>
          )}
          <Text style={[styles.confirmationText, { color: colors.textSecondary, fontSize: fontSizes.text }]}>
            {t('booking.startTime')}: {localStartTime ? localStartTime.format('h:mm A') : t('common.notSelected')}
          </Text>
          {localEndTime && (
            <Text style={[styles.confirmationText, { color: colors.textSecondary, fontSize: fontSizes.text }]}>
              {t('booking.endTime')}: {localEndTime.format('h:mm A')}
            </Text>
          )}
          
          {selectedOption === t('booking.options.shortTerm') && localEndDate && localStartTime && localEndTime && (
            <Text style={[styles.confirmationText, styles.confirmationItalic, { color: colors.primary, fontSize: fontSizes.small }]}>
              {t('booking.confirmBox.durationAppliesShortTermDetail', { 
                startDate: dayjs(localStartDate).format('MMMM D'),
                endDate: dayjs(localEndDate).format('MMMM D, YYYY'),
                startTime: localStartTime.format('h:mm A'),
                endTime: localEndTime.format('h:mm A')
              })}
            </Text>
          )}
          
          {selectedOption === t('booking.options.monthly') && localEndDate && (
            <Text style={[styles.confirmationText, styles.confirmationItalic, { color: colors.primary, fontSize: fontSizes.small }]}>
              {t('booking.confirmBox.monthlySubscription', { 
                startDate: dayjs(localStartDate).format('MMMM D, YYYY'),
                endDate: dayjs(localEndDate).format('MMMM D, YYYY')
              })}
            </Text>
          )}
          
          {selectedOption === t('booking.options.date') && localStartDate && localStartTime && (
            <Text style={[styles.confirmationText, styles.confirmationItalic, { color: colors.primary, fontSize: fontSizes.small }]}>
              {t('booking.confirmBox.serviceStarts', { 
                date: localStartDate ? dayjs(localStartDate).format('MMMM D, YYYY') : '___', 
                time: localStartTime ? localStartTime.format('h:mm A') : '___' 
              })}
            </Text>
          )}
        </View>

        <View style={styles.confirmationSection}>
          <Text style={[styles.confirmationSubtitle, { color: colors.primary, fontSize: fontSizes.subtitle }]}>
            {t('booking.confirmBox.serviceDuration')}
          </Text>
          <Text style={[styles.confirmationText, styles.confirmationSecondary, { color: colors.textSecondary, fontSize: fontSizes.small }]}>
            {getDurationMessage()}
          </Text>

          <View style={[styles.durationSelector, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.durationButton,
                { borderColor: colors.primary, backgroundColor: colors.card },
                !canDecreaseDuration() && [styles.durationButtonDisabled, { borderColor: colors.disabled, backgroundColor: colors.surface }]
              ]}
              onPress={handleDecreaseDuration}
              disabled={!canDecreaseDuration()}
            >
              <Text style={[
                styles.durationButtonText,
                { color: colors.primary, fontSize: fontSizes.title },
                !canDecreaseDuration() && { color: colors.disabled }
              ]}>-</Text>
            </TouchableOpacity>

            <View style={styles.durationDisplay}>
              <Text style={[styles.durationDisplayText, { color: colors.text, fontSize: fontSizes.title }]}>
                {currentDuration} {t('booking.hours', { count: currentDuration })}
              </Text>
              {localEndTime && (
                <Text style={[styles.durationEndTime, { color: colors.textSecondary, fontSize: fontSizes.small }]}>
                  {t('booking.until')} {localEndTime.format('h:mm A')}
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.durationButton,
                { borderColor: colors.primary, backgroundColor: colors.card },
                !canIncreaseDuration() && [styles.durationButtonDisabled, { borderColor: colors.disabled, backgroundColor: colors.surface }]
              ]}
              onPress={handleIncreaseDuration}
              disabled={!canIncreaseDuration()}
            >
              <Text style={[
                styles.durationButtonText,
                { color: colors.primary, fontSize: fontSizes.title },
                !canIncreaseDuration() && { color: colors.disabled }
              ]}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.relaxMessageContainer, { backgroundColor: colors.infoLight }]}>
          <Text style={[styles.relaxMessageText, { color: colors.textSecondary, fontSize: fontSizes.small }]}>
            {t('booking.confirmBox.relaxMessage')}
          </Text>
        </View>
      </View>
    );
  };

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

  const renderCustomTimePicker = () => {
    const { validHours, validMinutes } = getValidTimeOptions(
      showCustomTimePicker!,
    );
    const now = dayjs();
    const isToday = tempDate ? dayjs(tempDate).isSame(now, "day") : true;

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
            // disabled={!isCurrentTimeValid}
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

  return (
    <Modal visible={open} transparent animationType="fade">
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.container, { backgroundColor: colors.card }]}>
          <ScrollView
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          >
            <LinearGradient
              colors={["#0a2a66ff", "#004aadff"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.headerContainer}
            >
              <View style={styles.headerContent}>
                <View style={styles.headerLeft} />
                
                <Text style={[styles.title, { color: "#fff", fontSize: fontSizes.title }]}>{t('booking.selectBookingOption')}</Text>
                
                <View style={styles.headerRight}>
                  <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
                    <Icon name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>

            <View style={styles.radioRow}>
              {[t('booking.options.date'), t('booking.options.shortTerm'), t('booking.options.monthly')].map((opt, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.radioOption,
                    { borderColor: colors.border },
                    selectedOption === opt && [styles.radioOptionSelected, { backgroundColor: colors.primary + '20', borderColor: colors.primary }],
                  ]}
                  onPress={() => {
                    onOptionChange(opt);
                    // Reset local state when switching options
                    setLocalStartDate(null);
                    setLocalEndDate(null);
                    setLocalStartTime(null);
                    setLocalEndTime(null);
                    setStartDate(null);
                    setEndDate(null);
                    setStartTime(null);
                    setEndTime(null);
                    setTempSelectedTime(null);
                  }}
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

            {selectedOption === t('booking.options.date') && (
              <>
                <View style={styles.dateTimeContainer}>
                  <DribbbleDateTimePicker
                    mode="single"
                    value={localStartTime?.toDate()}
                    onChange={(date: Date, time?: string) => {
                      if (time) {
                        // Time was selected in the picker
                        handleTimeSelection(time, date);
                      } else if (date) {
                        // Only date was selected
                        const selected = dayjs(date);
                        
                        if (selected.isBefore(dayjs(), "day")) return;
                        
                        if (isDateDisabled(selected)) {
                          return;
                        }
                        
                        if (selected.isAfter(maxDate21Days, "day")) return;
                        
                        if (
                          selected.isSame(dayjs(), "day") &&
                          selected.isBefore(dayjs().add(30, "minute"))
                        ) {
                          return;
                        }
                        
                        // Mark that date has changed to reset times
                        setIsDateChanged(true);
                        updateStartDateTime(selected);
                      }
                    }}
                  />
                </View>

                {localStartTime && renderDurationSelector()}
              </>
            )}

            {selectedOption === t('booking.options.shortTerm') && (
              <>
                <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: fontSizes.subtitle }]}>{t('booking.selectDateTime')}</Text>

                <View style={styles.dateTimeContainer}>
                  <DribbbleDateTimePicker
                    mode="range"
                    value={{
                      startDate: localStartTime?.toDate(),
                      endDate: localEndTime?.toDate(),
                    }}
                    onChange={(payload: { startDate: Date; endDate: Date; time: string }) => {
                      const start = dayjs(payload.startDate);
                      const end = dayjs(payload.endDate);
                      const time = payload.time;
                      
                      // Parse time
                      const [t, meridian] = time.split(" ");
                      let hour = Number(t.split(":")[0]);
                      
                      if (meridian === "PM" && hour !== 12) hour += 12;
                      if (meridian === "AM" && hour === 12) hour = 0;
                      
                      const startWithTime = start.hour(hour).minute(0);
                      const endWithTime = end.hour(hour).minute(0);
                      
                      if (start.isBefore(dayjs(), "day")) return;
                      
                      if (isDateDisabled(startWithTime)) {
                        return;
                      }
                      
                      if (end.diff(start, "day") > 21) {
                        return;
                      }
                      
                      // Mark that date has changed to reset times
                      setIsDateChanged(true);
                      
                      setLocalStartDate(startWithTime.format("YYYY-MM-DD"));
                      setLocalStartTime(startWithTime);
                      setStartDate(startWithTime.format("YYYY-MM-DD"));
                      setStartTime(startWithTime);
                      
                      setLocalEndDate(end.format('YYYY-MM-DD'));
                      setEndDate(end.format('YYYY-MM-DD'));
                      
                      const defaultEndTime = startWithTime.add(1, 'hour');
                      setLocalEndTime(defaultEndTime);
                      setEndTime(defaultEndTime);
                    }}
                  />
                </View>

                {localStartDate && localStartTime && localEndTime && renderDurationSelector()}
              </>
            )}

            {selectedOption === t('booking.options.monthly') && (
              <>
                <View style={styles.dateTimeContainer}>
                  <DribbbleDateTimePicker
                    mode="single"
                    value={localStartTime?.toDate()}
                    onChange={(date: Date, time?: string) => {
                      if (time) {
                        // Time was selected in the picker
                        handleTimeSelection(time, date);
                      } else if (date) {
                        // Only date was selected
                        const selected = dayjs(date);
                        const now = dayjs();
                        
                        if (selected.isBefore(now, "day")) return;
                        
                        if (isDateDisabled(selected)) {
                          return;
                        }
                        
                        if (selected.isAfter(maxDate90Days, "day")) return;
                        
                        // Mark that date has changed to reset times
                        setIsDateChanged(true);
                        updateStartDateTime(selected);
                      }
                    }}
                  />
                </View>

                {localStartDate && localEndDate && (
                  <View style={[styles.endDateInfo, { backgroundColor: colors.infoLight }]}>
                    <Text style={[styles.endDateInfoText, { color: colors.primary, fontSize: fontSizes.small }]}>
                      📅 {t('booking.confirmBox.monthlySubscription', { 
                        startDate: dayjs(localStartDate).format('MMMM D, YYYY'),
                        endDate: dayjs(localEndDate).format('MMMM D, YYYY')
                      })}
                    </Text>
                  </View>
                )}
                
                {localStartDate && localStartTime && localEndTime && renderDurationSelector()}
              </>
            )}

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
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 10,
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
  durationEndTime: {
    marginTop: 4,
  },
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
  endDateInfo: {
    textAlign: 'center',
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 8,
  },
  endDateInfoText: {
    textAlign: 'center',
  },
});