/* eslint-disable */
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Platform,
  Dimensions,
  ScrollView,
  Animated,
  PanResponder,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
import { HOME_HERO_GRADIENT, HOME_M3, BRAND } from "../theme/brandColors";


dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

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

// Check if a time is within allowed booking hours
const isBookingValid = (time: Dayjs | null) => {
  if (!time) return false;
  const now = dayjs();
  if (time.isBefore(now.add(30, "minute").subtract(1, 'second'))) return false;
  const hour = time.hour();
  return hour >= 5 && hour < 22;
};

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
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === "android" ? StatusBar.currentHeight ?? 0 : 0
  );
  const sheetMaxHeight = SCREEN_HEIGHT - topInset;
  const sheetMinHeight = Math.min(SCREEN_HEIGHT * 0.8, sheetMaxHeight * 0.92);
  const sheetInsetsStyle = {
    maxHeight: sheetMaxHeight,
    minHeight: sheetMinHeight,
  };
  const [role, setRole] = useState<string | null>(null);
  const [isServiceDisabled, setIsServiceDisabled] = useState(false);
  const [lastSelectedDate, setLastSelectedDate] = useState<Dayjs | null>(null);
  const [localStartDate, setLocalStartDate] = useState<string | null>(null);
  const [localEndDate, setLocalEndDate] = useState<string | null>(null);
  const [localStartTime, setLocalStartTime] = useState<Dayjs | null>(null);
  const [localEndTime, setLocalEndTime] = useState<Dayjs | null>(null);
  const [serviceDurationHours, setServiceDurationHours] = useState(1);
  const [tempSelectedTime, setTempSelectedTime] = useState<string | null>(null);
  const [genderPreference, setGenderPreference] = useState<string>("No Preference");
  const scrollViewRef = useRef<ScrollView>(null);
  const openSessionInitializedRef = useRef(false);
  const [showDatePicker, setShowDatePicker] = useState<"start" | "end" | null>(null);
  const [showCustomTimePicker, setShowCustomTimePicker] = useState<"start" | "end" | null>(null);
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [customHours, setCustomHours] = useState<number>(12);
  const [customMinutes, setCustomMinutes] = useState<number>(0);
  const [customAmPm, setCustomAmPm] = useState<"AM" | "PM">("AM");
  const [use24HourFormat, setUse24HourFormat] = useState<boolean>(false);
  const [isDateChanged, setIsDateChanged] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [localOption, setLocalOption] = useState<string>("Date");
  const sheetTranslateY = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 4,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          sheetTranslateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 1.2) {
          Animated.timing(sheetTranslateY, {
            toValue: 500,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            handleSheetClose();
            sheetTranslateY.setValue(0);
          });
          return;
        }

        Animated.spring(sheetTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          speed: 18,
          bounciness: 0,
        }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(sheetTranslateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  // Business hours configuration
  const BUSINESS_HOURS = {
    openingHour: 5,
    openingMinute: 0,
    cutoffHour: 22,
    cutoffMinute: 0,
  };

  const today = dayjs();
  const maxDate21Days = today.add(21, "day");
  const maxDate90Days = today.add(89, "day");
  const MAX_SERVICE_DURATION_HOURS = BUSINESS_HOURS.cutoffHour - BUSINESS_HOURS.openingHour;

  const applyEndFromStartAndDuration = (start: Dayjs, hours: number) => {
    let end = start.add(hours, "hour");
    if (end.hour() >= BUSINESS_HOURS.cutoffHour) {
      end = start.hour(BUSINESS_HOURS.cutoffHour - 1).minute(55);
    }
    return end;
  };

  const commitEndTimeForOption = (start: Dayjs, end: Dayjs) => {
    setLocalEndTime(end);
    setEndTime(end);

    if (localOption === "Date") {
      setLocalEndDate(end.format("YYYY-MM-DD"));
      setEndDate(end.format("YYYY-MM-DD"));
    } else if (localOption === "Monthly") {
      const endDateValue = start.add(1, "month");
      setLocalEndDate(endDateValue.format("YYYY-MM-DD"));
      setEndDate(endDateValue.format("YYYY-MM-DD"));
    } else if (localOption === "Short term") {
      if (!localEndDate) {
        const endDateValue = start.add(1, "day");
        setLocalEndDate(endDateValue.format("YYYY-MM-DD"));
        setEndDate(endDateValue.format("YYYY-MM-DD"));
      }
    }
  };

  useEffect(() => {
    if (appUser) {
      const userRole = appUser.role || "CUSTOMER";
      setRole(userRole);
      setIsServiceDisabled(userRole === "SERVICE_PROVIDER");
    }
  }, [appUser]);

  // Sync local state with props and reset scroll only when the sheet opens — not on every parent date/time update.
  useEffect(() => {
    if (!open) {
      openSessionInitializedRef.current = false;
      return;
    }

    if (openSessionInitializedRef.current) {
      return;
    }
    openSessionInitializedRef.current = true;

    setLocalOption("Date");
    onOptionChange("Date");
    setLocalStartDate(startDate);
    setLocalEndDate(endDate);
    setLocalStartTime(startTime);
    setLocalEndTime(endTime);
    if (startTime && endTime) {
      const hours = Math.max(1, Math.round(endTime.diff(startTime, "hour", true)));
      setServiceDurationHours(hours);
    } else {
      setServiceDurationHours(1);
    }
    // Soft snap-in animation for modern drawer feel
    sheetTranslateY.setValue(28);
    Animated.spring(sheetTranslateY, {
      toValue: 0,
      useNativeDriver: true,
      speed: 18,
      bounciness: 0,
    }).start();
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    });
  }, [open, startDate, endDate, startTime, endTime, sheetTranslateY]);

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
      setCurrentStep(1);
      setGenderPreference("No Preference");
    }
  }, [open]);

  // Reset time selection when date changes
  useEffect(() => {
    if (isDateChanged) {
      setLocalStartTime(null);
      setLocalEndTime(null);
      setServiceDurationHours(1);
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
      const currentTime = showCustomTimePicker === "start" ? localStartTime : localEndTime;
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

  const isDateDisabled = (date: Dayjs): boolean => {
    const now = dayjs();
    if (date.isBefore(now, 'day')) return true;
    if (date.isSame(now, 'day')) {
      const currentTotalMinutes = now.hour() * 60 + now.minute();
      const cutoffTotalMinutes = BUSINESS_HOURS.cutoffHour * 60 + BUSINESS_HOURS.cutoffMinute;
      if (currentTotalMinutes >= cutoffTotalMinutes) return true;
    }
    return false;
  };

  const isTimeValid = (hours24: number, minutes: number, type: "start" | "end"): boolean => {
    const now = dayjs();
    const selectedDateTime = tempDate
      ? dayjs(tempDate).hour(hours24).minute(minutes)
      : dayjs().hour(hours24).minute(minutes);

    if (isDateDisabled(selectedDateTime)) {
      return false;
    }

    if (type === "start") {
      if (selectedDateTime.isSame(now, "day") && selectedDateTime.isBefore(now.add(30, "minute"))) {
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

    const hours24 = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
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
        selectedDateTime = dayjs(tempDate).hour(hours24).minute(customMinutes).second(0).millisecond(0);
        setTempDate(null);
      } else {
        const currentDateTime = showCustomTimePicker === "start" ? localStartTime : localEndTime;
        if (currentDateTime) {
          selectedDateTime = currentDateTime.hour(hours24).minute(customMinutes).second(0).millisecond(0);
        } else {
          selectedDateTime = dayjs().hour(hours24).minute(customMinutes).second(0).millisecond(0);
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

    const finalEndTime = applyEndFromStartAndDuration(adjustedDateTime, serviceDurationHours);
    commitEndTimeForOption(adjustedDateTime, finalEndTime);
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

  const updateStartDate = (newDateTime: Dayjs) => {
    if (!newDateTime) return;
    
    let adjustedTime = newDateTime;
    const now = dayjs();
    
    const isDateOnlyChanged = lastSelectedDate && 
      !newDateTime.isSame(lastSelectedDate, 'day') && 
      newDateTime.hour() === 0 && 
      newDateTime.minute() === 0;
    
    if (newDateTime.isSame(today, 'day')) {
      const nowPlus30 = today.add(30, 'minute');
      if (newDateTime.isBefore(nowPlus30)) adjustedTime = nowPlus30;
      if (adjustedTime.hour() < BUSINESS_HOURS.openingHour) {
        adjustedTime = adjustedTime.hour(BUSINESS_HOURS.openingHour).minute(0);
      } else if (adjustedTime.hour() >= BUSINESS_HOURS.cutoffHour) {
        adjustedTime = adjustedTime.hour(BUSINESS_HOURS.cutoffHour - 1).minute(55);
      }
    } else {
      if (isDateOnlyChanged || (newDateTime.hour() === 0 && newDateTime.minute() === 0)) {
        adjustedTime = newDateTime.hour(BUSINESS_HOURS.openingHour).minute(0);
      }
    }
    
    setLocalStartDate(adjustedTime.format("YYYY-MM-DD"));
    setLocalStartTime(adjustedTime);
    setLastSelectedDate(adjustedTime);
    setStartDate(adjustedTime.format("YYYY-MM-DD"));
    setStartTime(adjustedTime);

    const finalEndTime = applyEndFromStartAndDuration(adjustedTime, serviceDurationHours);
    commitEndTimeForOption(adjustedTime, finalEndTime);
  };

  const handleDateTimeChange = (date: Date, time?: string, isRange?: boolean, startDateObj?: Date, endDateObj?: Date) => {
    if (isRange && startDateObj && endDateObj) {
      const start = dayjs(startDateObj);
      const end = dayjs(endDateObj);
      
      if (time) {
        const [timeStr, meridian] = time.split(" ");
        const [hourStr, minuteStr] = timeStr.split(":");
        let hour = Number(hourStr);
        const minute = Number(minuteStr);
        if (meridian === "PM" && hour !== 12) hour += 12;
        if (meridian === "AM" && hour === 12) hour = 0;
        
        const startWithTime = start.hour(hour).minute(minute);
        const endWithTime = end.hour(hour).minute(minute);
        
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
      const selected = dayjs(date);
      if (!isDateDisabled(selected)) {
        updateStartDateTime(selected);
      }
    }
  };

  const handleTimeSelection = (time: string, dateObj?: Date) => {
    const [timeStr, meridian] = time.split(" ");
    const [hourStr, minuteStr] = timeStr.split(":");
    let hour = Number(hourStr);
    const minute = Number(minuteStr);
    if (meridian === "PM" && hour !== 12) hour += 12;
    if (meridian === "AM" && hour === 12) hour = 0;
    
    let selectedDateTime: Dayjs;
    
    if (dateObj) {
      selectedDateTime = dayjs(dateObj).hour(hour).minute(minute);
    } else if (localStartDate) {
      selectedDateTime = dayjs(localStartDate).hour(hour).minute(minute);
    } else {
      selectedDateTime = dayjs().hour(hour).minute(minute);
    }
    
    if (!isDateDisabled(selectedDateTime)) {
      updateStartDateTime(selectedDateTime);
      setTempSelectedTime(time);
    }
  };

  const parseTimeFromString = (time: string): { hour: number; minute: number } => {
    const [timeStr, meridian] = time.split(" ");
    const [hourStr, minuteStr] = timeStr.split(":");
    let hour = Number(hourStr);
    const minute = Number(minuteStr);
    if (meridian === "PM" && hour !== 12) hour += 12;
    if (meridian === "AM" && hour === 12) hour = 0;
    return { hour, minute };
  };

  const handleOptionChange = (val: string) => {
    setLocalStartDate(null);
    setLocalEndDate(null);
    setLocalStartTime(null);
    setLocalEndTime(null);
    setLastSelectedDate(null);
    setStartDate(null);
    setEndDate(null);
    setStartTime(null);
    setEndTime(null);
    setTempSelectedTime(null);
    setLocalOption(val);
    onOptionChange(val);
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }, 100);
  };

  const isConfirmDisabled = () => {
    if (isServiceDisabled) return true;
    
    switch (localOption) {
      case "Date":
        return !localStartDate || !localStartTime;
      case "Short term":
        if (!localStartDate || !localEndDate || !localStartTime || !localEndTime) return true;
        return dayjs(localEndDate).isBefore(dayjs(localStartDate));
      case "Monthly":
        return !localStartDate || !localStartTime;
      default:
        return true;
    }
  };

  const duration = serviceDurationHours;

  const canIncreaseDuration = () => {
    if (localStartTime) {
      const newEndTime = localStartTime.add(serviceDurationHours + 1, "hour");
      return newEndTime.hour() < BUSINESS_HOURS.cutoffHour;
    }
    return serviceDurationHours < MAX_SERVICE_DURATION_HOURS;
  };

  const canDecreaseDuration = () => serviceDurationHours > 1;

  const handleIncreaseDuration = () => {
    if (!canIncreaseDuration()) return;
    const nextDuration = serviceDurationHours + 1;
    setServiceDurationHours(nextDuration);
    if (localStartTime) {
      const newEndTime = applyEndFromStartAndDuration(localStartTime, nextDuration);
      commitEndTimeForOption(localStartTime, newEndTime);
    }
  };

  const handleDecreaseDuration = () => {
    if (!canDecreaseDuration()) return;
    const nextDuration = serviceDurationHours - 1;
    setServiceDurationHours(nextDuration);
    if (localStartTime) {
      const newEndTime = applyEndFromStartAndDuration(localStartTime, nextDuration);
      commitEndTimeForOption(localStartTime, newEndTime);
    }
  };

  const handleAccept = () => {
    if (isServiceDisabled) return;
    
    if (localStartTime && !isBookingValid(localStartTime)) {
      alert("Booking time must be at least 30 minutes from now and between 5 AM and 10 PM");
      return;
    }
    
    onSave({
      option: localOption,
      startDate: localStartDate,
      endDate: localEndDate,
      startTime: localStartTime,
      endTime: localEndTime,
      genderPreference: genderPreference,
    });
  };

  const handleResetProgress = () => {
    setLocalStartDate(null);
    setLocalEndDate(null);
    setLocalStartTime(null);
    setLocalEndTime(null);
    setServiceDurationHours(1);
    setLastSelectedDate(null);
    setTempSelectedTime(null);
    setShowDatePicker(null);
    setShowCustomTimePicker(null);
    setTempDate(null);
    setCustomHours(12);
    setCustomMinutes(0);
    setCustomAmPm("AM");
    setStartDate(null);
    setEndDate(null);
    setStartTime(null);
    setEndTime(null);
    onOptionChange("");
  };

  const handleSheetClose = () => {
    setCurrentStep(1);
    sheetTranslateY.setValue(0);
    scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    setStartDate(null);
    setEndDate(null);
    setStartTime(null);
    setEndTime(null);
    onOptionChange("Date");
    onClose();
  };

  const getTotalSteps = () => 3;

  const isStepValid = (step: number) => {
    if (step === 1) {
      return ["Date", "Short term", "Monthly"].includes(localOption);
    }
    if (step === 2) {
      return !isConfirmDisabled();
    }
    return true;
  };

  const handleNextStep = () => {
    if (currentStep < getTotalSteps() && isStepValid(currentStep)) {
      setCurrentStep((prev) => prev + 1);
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }, 50);
    }
  };

  const handleBackStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      }, 50);
    }
  };

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
  const hasValidOption = ["Date", "Short term", "Monthly"].includes(localOption);
  const hasScheduleInputs =
    (localOption === "Date" && !!localStartDate && !!localStartTime) ||
    (localOption === "Monthly" && !!localStartDate && !!localStartTime) ||
    (localOption === "Short term" && !!localStartDate && !!localEndDate && !!localStartTime && !!localEndTime);
  const progressStep = !hasValidOption ? 1 : !hasScheduleInputs ? 2 : 3;

  // Render Gender Preference Selector
  const renderGenderPreference = () => {
    const genderOptions = [
      { value: "Male", label: "Male", icon: "male" },
      { value: "Female", label: "Female", icon: "female" },
      { value: "No Preference", label: "No Preference", icon: "people" },
    ];

    return (
      <View style={[styles.genderPreferenceContainer, { borderColor: colors.border, backgroundColor: isDarkMode ? colors.surface2 : "#f8fafc" }]}>
        <View style={styles.genderPreferenceHeader}>
          <Icon name="person" size={18} color={colors.primary} />
          <Text style={[styles.genderPreferenceTitle, { color: colors.text, fontSize: fontSizes.sectionTitle }]}>
            Provider Gender Preference
          </Text>
        </View>
        
        <Text style={[styles.genderPreferenceMessage, { color: colors.textSecondary, fontSize: fontSizes.small }]}>
          Select your preferred provider gender (optional)
        </Text>

        <View style={styles.genderOptionsContainer}>
          {genderOptions.map((option) => {
            const isSelected = genderPreference === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.genderOptionButton,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  isSelected && [styles.genderOptionSelected, { backgroundColor: colors.primary + "16", borderColor: colors.primary }]
                ]}
                onPress={() => setGenderPreference(option.value)}
                activeOpacity={0.7}
              >
                <Icon 
                  name={option.icon} 
                  size={22} 
                  color={isSelected ? colors.primary : colors.textSecondary} 
                />
                <Text style={[
                  styles.genderOptionText,
                  { color: colors.text, fontSize: fontSizes.text },
                  isSelected && { color: colors.primary, fontWeight: "700" }
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  // Render Duration Control (appears first in the dialog)
  const renderDurationControl = () => {
    const hasStartTime = !!localStartTime;
    
    const getDurationMessage = () => {
      if (localOption === "Short term") {
        return "Applies to each day of service";
      } else if (localOption === "Monthly") {
        return "Applies to each day of subscription";
      }
      return "Adjust the duration of your service";
    };

    return (
      <View style={[styles.durationContainer, { borderColor: colors.border }]}>
        <Text style={[styles.durationTitle, { color: colors.text, fontSize: fontSizes.sectionTitle }]}>
          Service Duration
        </Text>

        <Text style={[styles.durationMessage, { color: colors.textSecondary, fontSize: fontSizes.small }]}>
          {getDurationMessage()}
        </Text>

        <View style={[styles.durationControl, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
            ]}>−</Text>
          </TouchableOpacity>

          <View style={styles.durationDisplay}>
            <Text style={[styles.durationDisplayText, { color: colors.text, fontSize: fontSizes.title }]}>
              {duration} hour{duration > 1 ? "s" : ""}
            </Text>
            {hasStartTime && localEndTime && (
              <Text style={[styles.durationEndTime, { color: colors.textSecondary, fontSize: fontSizes.small }]}>
                until {localEndTime.format('h:mm A')}
              </Text>
            )}
            {!hasStartTime && (
              <Text style={[styles.selectTimeHint, { color: colors.textSecondary, fontSize: fontSizes.small }]}>
                Applies when you pick a start time below
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
    );
  };

  // Render Booking Details Section (appears after calendar)
  const renderBookingDetails = () => {
    if (!localStartTime) return null;

    return (
      <View style={[styles.bookingDetailsContainer, { 
        backgroundColor: isDarkMode ? colors.surface2 : "#ffffff",
        borderColor: colors.border,
      }]}>
        <View style={styles.bookingDetailsHeader}>
          <View style={styles.bookingDetailsHeadingWrap}>
            <Icon name="fact-check" size={18} color={colors.primary} />
            <Text style={[styles.bookingDetailsTitle, { color: colors.text, fontSize: fontSizes.sectionTitle }]}>
              Booking Details
            </Text>
          </View>
          <View style={[styles.bookingTypeBadge, { backgroundColor: colors.primary + "16", borderColor: colors.primary + "3a" }]}>
            <Text style={[styles.bookingTypeBadgeText, { color: colors.primary, fontSize: fontSizes.small }]}>
              {localOption}
            </Text>
          </View>
        </View>

        <View style={styles.bookingDetailsContent}>
          <View style={[styles.detailRow, { backgroundColor: isDarkMode ? colors.card : "#f8fafc", borderColor: colors.border }]}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary, fontSize: fontSizes.text }]}>
              Start Date:
            </Text>
            <Text style={[styles.detailValue, { color: colors.text, fontSize: fontSizes.text }]}>
              {localStartDate ? dayjs(localStartDate).format('MMMM D, YYYY') : "Not selected"}
            </Text>
          </View>

          {localOption === "Monthly" && localEndDate && (
            <View style={[styles.detailRow, { backgroundColor: isDarkMode ? colors.card : "#f8fafc", borderColor: colors.border }]}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary, fontSize: fontSizes.text }]}>
                End Date:
              </Text>
              <Text style={[styles.detailValue, { color: colors.text, fontSize: fontSizes.text }]}>
                {dayjs(localEndDate).format('MMMM D, YYYY')} (1 month later)
              </Text>
            </View>
          )}

          {localOption === "Short term" && localEndDate && (
            <View style={[styles.detailRow, { backgroundColor: isDarkMode ? colors.card : "#f8fafc", borderColor: colors.border }]}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary, fontSize: fontSizes.text }]}>
                End Date:
              </Text>
              <Text style={[styles.detailValue, { color: colors.text, fontSize: fontSizes.text }]}>
                {dayjs(localEndDate).format('MMMM D, YYYY')}
              </Text>
            </View>
          )}

          <View style={[styles.detailRow, { backgroundColor: isDarkMode ? colors.card : "#f8fafc", borderColor: colors.border }]}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary, fontSize: fontSizes.text }]}>
              Start Time:
            </Text>
            <Text style={[styles.detailValue, { color: colors.text, fontSize: fontSizes.text }]}>
              {localStartTime ? localStartTime.format('h:mm A') : "Not selected"}
            </Text>
          </View>

          {localEndTime && (
            <View style={[styles.detailRow, { backgroundColor: isDarkMode ? colors.card : "#f8fafc", borderColor: colors.border }]}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary, fontSize: fontSizes.text }]}>
                End Time:
              </Text>
              <Text style={[styles.detailValue, { color: colors.text, fontSize: fontSizes.text }]}>
                {localEndTime.format('h:mm A')}
              </Text>
            </View>
          )}

          <View style={[styles.detailRow, { backgroundColor: isDarkMode ? colors.card : "#f8fafc", borderColor: colors.border }]}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary, fontSize: fontSizes.text }]}>
              Duration:
            </Text>
            <Text style={[styles.detailValue, { color: colors.text, fontSize: fontSizes.text }]}>
              {duration} {duration > 1 ? "hours" : "hour"}
            </Text>
          </View>

          {localOption === "Short term" && localEndDate && localStartTime && localEndTime && (
            <Text style={[styles.infoMessage, { color: colors.primary, fontSize: fontSizes.small, backgroundColor: colors.primary + "10" }]}>
              Service will run from {dayjs(localStartDate).format('MMMM D')} to {dayjs(localEndDate).format('MMMM D, YYYY')}, 
              daily from {localStartTime.format('h:mm A')} to {localEndTime.format('h:mm A')}
            </Text>
          )}

          {localOption === "Monthly" && localEndDate && (
            <Text style={[styles.infoMessage, { color: colors.primary, fontSize: fontSizes.small, backgroundColor: colors.primary + "10" }]}>
              Monthly subscription from {dayjs(localStartDate).format('MMMM D, YYYY')} to {dayjs(localEndDate).format('MMMM D, YYYY')}
            </Text>
          )}

          {localOption === "Date" && localStartDate && localStartTime && (
            <Text style={[styles.infoMessage, { color: colors.primary, fontSize: fontSizes.small, backgroundColor: colors.primary + "10" }]}>
              Service will start on {dayjs(localStartDate).format('MMMM D, YYYY')} at {localStartTime.format('h:mm A')}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderCustomTimePicker = () => {
    const { validHours, validMinutes } = getValidTimeOptions(showCustomTimePicker!);
    const now = dayjs();
    const isToday = tempDate ? dayjs(tempDate).isSame(now, "day") : true;

    if (isToday && isDateDisabled(now)) {
      return (
        <View style={[styles.customTimePickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.customTimePickerTitle, { color: colors.text, fontSize: fontSizes.sectionTitle }]}>
            Select {showCustomTimePicker === "start" ? "Start" : "End"} Time
          </Text>
          <View style={[styles.cutoffMessageContainer, { backgroundColor: colors.card }]}>
            <Icon name="access-time" size={40} color={colors.error} />
            <Text style={[styles.cutoffMessageTitle, { color: colors.error, fontSize: fontSizes.title }]}>
              Service Unavailable
            </Text>
            <Text style={[styles.cutoffMessageText, { color: colors.textSecondary, fontSize: fontSizes.text }]}>
              Bookings are only available between 5:00 AM and 10:00 PM
            </Text>
          </View>
          <View style={styles.customTimePickerActions}>
            <TouchableOpacity
              style={[styles.customTimePickerButton, { borderColor: colors.primary }]}
              onPress={handleCustomTimeCancel}
            >
              <Text style={[styles.customTimePickerButtonText, { color: colors.primary, fontSize: fontSizes.button }]}>Cancel</Text>
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

    const isCurrentTimeValid = isTimeValid(currentHours24, customMinutes, showCustomTimePicker!);

    const getDisplayTime = () => {
      if (use24HourFormat) {
        return `${currentHours24.toString().padStart(2, "0")}:${customMinutes.toString().padStart(2, "0")}`;
      } else {
        return `${customHours}:${customMinutes.toString().padStart(2, "0")} ${customAmPm}`;
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
      return `${hours24.toString().padStart(2, "0")}:${customMinutes.toString().padStart(2, "0")}`;
    };

    return (
      <View style={[styles.customTimePickerContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.customTimePickerTitle, { color: colors.text, fontSize: fontSizes.sectionTitle }]}>
          Select {showCustomTimePicker === "start" ? "Start" : "End"} Time
        </Text>

        <View style={[styles.formatToggle, { backgroundColor: colors.surface2 }]}>
          <TouchableOpacity
            style={[styles.formatButton, !use24HourFormat && [styles.formatButtonActive, { backgroundColor: colors.primary }]]}
            onPress={() => setUse24HourFormat(false)}
          >
            <Text style={[styles.formatButtonText, { color: colors.textSecondary, fontSize: fontSizes.small }, !use24HourFormat && { color: '#fff' }]}>
              12H
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.formatButton, use24HourFormat && [styles.formatButtonActive, { backgroundColor: colors.primary }]]}
            onPress={() => setUse24HourFormat(true)}
          >
            <Text style={[styles.formatButtonText, { color: colors.textSecondary, fontSize: fontSizes.small }, use24HourFormat && { color: '#fff' }]}>
              24H
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.timeRangeInfo, { color: colors.textSecondary, fontSize: fontSizes.small }]}>
          Available: 5:00 AM - 9:55 PM (05:00 - 21:55 GMT)
          {showCustomTimePicker === "start" && isToday && !isDateDisabled(now) ? " • Requires 30 min advance notice" : ""}
        </Text>

        <View style={styles.customTimePicker}>
          <ScrollView style={styles.timeColumn} showsVerticalScrollIndicator={false}>
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
                : customHours === displayHour && ((hour < 12 && customAmPm === "AM") || (hour >= 12 && customAmPm === "PM"));

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
                  <Text style={[styles.timeOptionText, { color: colors.text, fontSize: fontSizes.text }, isSelected && { color: '#fff' }]}>
                    {displayText}
                  </Text>
                  {!use24HourFormat && (
                    <Text style={[styles.timePeriodText, { color: colors.textSecondary, fontSize: fontSizes.small }, isSelected && { color: '#fff' }]}>
                      {hour < 12 ? "AM" : "PM"}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ScrollView style={styles.timeColumn} showsVerticalScrollIndicator={false}>
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
                <Text style={[styles.timeOptionText, { color: colors.text, fontSize: fontSizes.text }, customMinutes === minute && { color: '#fff' }]}>
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
                <Text style={[styles.timeOptionText, { color: colors.text, fontSize: fontSizes.text }, customAmPm === "AM" && { color: '#fff' }]}>
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
                <Text style={[styles.timeOptionText, { color: colors.text, fontSize: fontSizes.text }, customAmPm === "PM" && { color: '#fff' }]}>
                  PM
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={[styles.selectedTimeDisplay, { borderColor: colors.primary, backgroundColor: colors.card }, !isCurrentTimeValid && { borderColor: colors.error, backgroundColor: colors.errorLight }]}>
          <Text style={[styles.selectedTimeText, { color: colors.primary, fontSize: fontSizes.text }, !isCurrentTimeValid && { color: colors.error }]}>
            Selected: {getDisplayTime()}
          </Text>
          <Text style={[styles.gmtTimeText, { color: colors.textSecondary, fontSize: fontSizes.small }]}>GMT: {get24HourDisplay()}</Text>
        </View>

        <View style={styles.customTimePickerActions}>
          <TouchableOpacity style={[styles.customTimePickerButton, { borderColor: colors.primary }]} onPress={handleCustomTimeCancel}>
            <Text style={[styles.customTimePickerButtonText, { color: colors.primary, fontSize: fontSizes.button }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.customTimePickerButton, styles.customTimePickerButtonConfirm, { backgroundColor: colors.primary }, !isCurrentTimeValid && [styles.disabledButton, { backgroundColor: colors.disabled }]]}
            onPress={handleCustomTimeConfirm}
            disabled={!isCurrentTimeValid}
          >
            <Text style={[styles.customTimePickerButtonText, styles.customTimePickerButtonTextConfirm, { color: '#fff', fontSize: fontSizes.button }]}>
              Confirm
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isServiceDisabled) {
    return (
      <Modal visible={open} transparent animationType="fade" onRequestClose={handleSheetClose}>
        <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
          <TouchableWithoutFeedback onPress={handleSheetClose}>
            <View style={styles.backdropTapArea} />
          </TouchableWithoutFeedback>
          <View style={[styles.container, sheetInsetsStyle, { backgroundColor: isDarkMode ? colors.card : "#f8fafc" }]}>
            <View style={styles.sheetHandleWrap}>
              <View style={[styles.sheetHandleBar, { backgroundColor: colors.border }]} />
            </View>
            <View style={styles.headerShell}>
              <LinearGradient
                colors={[...HOME_HERO_GRADIENT]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <View style={styles.headerToolbar}>
                <View style={styles.headerSideBtn} />
                <Text
                  style={[
                    styles.headerTitleCenter,
                    { fontSize: fontSizes.title },
                    Platform.OS === "android" ? { includeFontPadding: false } : null,
                  ]}
                  numberOfLines={1}
                >
                  Service Unavailable
                </Text>
                <View style={styles.headerSideBtn} />
              </View>
            </View>

            <View style={[styles.disabledContainer, { backgroundColor: isDarkMode ? colors.card : "#ffffff" }]}>
              <Icon name="info-outline" size={60} color="#FFA500" />
              <Text style={[styles.disabledTitle, { color: colors.text, fontSize: fontSizes.title }]}>Service Provider View</Text>
              <Text style={[styles.disabledMessage, { color: colors.textSecondary, fontSize: fontSizes.text }]}>
                As a service provider, you cannot book services. Please switch to customer mode.
              </Text>
              <TouchableOpacity style={[styles.disabledCloseButton, { backgroundColor: colors.primary }]} onPress={handleSheetClose}>
                <Text style={[styles.disabledCloseButtonText, { color: '#fff', fontSize: fontSizes.button }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  const bookingTypeOptions = [
    { value: "Date", label: "One-time" },
    { value: "Short term", label: "Short-term" },
    { value: "Monthly", label: "Monthly" },
  ];

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={handleSheetClose}>
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <TouchableWithoutFeedback onPress={handleSheetClose}>
          <View style={styles.backdropTapArea} />
        </TouchableWithoutFeedback>
        <Animated.View
          style={[
            styles.container,
            sheetInsetsStyle,
            { backgroundColor: isDarkMode ? colors.card : "#f8fafc", transform: [{ translateY: sheetTranslateY }] },
          ]}
        >
          <View style={styles.headerShell} {...panResponder.panHandlers}>
            <LinearGradient
              colors={[...HOME_HERO_GRADIENT]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <View style={styles.headerToolbar}>
              <TouchableOpacity
                style={styles.headerSideBtn}
                onPress={handleSheetClose}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Icon name="arrow-back" size={22} color={HOME_M3.onPrimary} />
              </TouchableOpacity>
              <Text
                style={[
                  styles.headerTitleCenter,
                  Platform.OS === "android" ? { includeFontPadding: false } : null,
                ]}
                numberOfLines={1}
              >
                Book Service
              </Text>
              <View style={styles.headerSideBtn} />
            </View>
          </View>
          <ScrollView
            ref={scrollViewRef}
            style={styles.wizardScroll}
            contentContainerStyle={styles.wizardScrollContent}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            <View style={styles.bookingPlanSection}>
              <Text style={[styles.sectionHeading, { color: colors.text, fontSize: fontSizes.sectionTitle }]}>
                Booking Plan
              </Text>

              <View style={[styles.segmentedControl, { backgroundColor: isDarkMode ? colors.surface2 : "#e8ecf1" }]}>
                {bookingTypeOptions.map((opt) => {
                  const selected = localOption === opt.value;
                  return (
                    <TouchableOpacity
                      key={opt.value}
                      style={[
                        styles.segment,
                        selected && [
                          styles.segmentSelected,
                          {
                            backgroundColor: isDarkMode ? colors.card : "#ffffff",
                            shadowColor: BRAND.bookingNavy,
                          },
                        ],
                      ]}
                      onPress={() => handleOptionChange(opt.value)}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.segmentText,
                          { color: colors.textSecondary, fontSize: fontSizes.small },
                          selected && { color: colors.text, fontWeight: "700" },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {localOption === "Date" && (
              <>
                <View style={styles.dateTimeContainer}>
                  <DribbbleDateTimePicker
                    mode="single"
                    value={localStartTime?.toDate()}
                    maxDate={maxDate21Days.toDate()}
                    onChange={(date: Date) => {
                      if (date) {
                        const selected = dayjs(date);
                        const now = dayjs();
                        if (selected.isBefore(now.add(30, "minute"))) {
                          alert("Please select a time at least 30 minutes from now");
                          return;
                        }
                        if (selected.hour() < 6 || selected.hour() > 19) {
                          alert("Please select a time between 6 AM and 7 PM");
                          return;
                        }
                        if (selected.isAfter(maxDate21Days)) {
                          alert("Date cannot exceed 21 days from today");
                          return;
                        }
                        updateStartDate(selected);
                      }
                    }}
                  />
                </View>
                {renderDurationControl()}
                {renderGenderPreference()}
              </>
            )}

            {selectedOption === "Short term" && (
              <>
                <View style={styles.dateTimeContainer}>
                  <DribbbleDateTimePicker
                    mode="range"
                    maxRangeDays={14}
                    value={{
                      startDate: localStartTime?.toDate(),
                      endDate: localEndDate ? dayjs(localEndDate).toDate() : undefined,
                    }}
                    onChange={(payload: { startDate: Date; endDate: Date; time?: string }) => {
                      if (!payload.time) return;
                      const start = dayjs(payload.startDate);
                      const end = dayjs(payload.endDate);
                      const { hour, minute } = parseTimeFromString(payload.time);
                      const startWithTime = start.hour(hour).minute(minute);

                      if (!isDateDisabled(startWithTime)) {
                        setLocalStartDate(startWithTime.format("YYYY-MM-DD"));
                        setLocalStartTime(startWithTime);
                        setStartDate(startWithTime.format("YYYY-MM-DD"));
                        setStartTime(startWithTime);

                        setLocalEndDate(end.format("YYYY-MM-DD"));
                        setEndDate(end.format("YYYY-MM-DD"));

                        const defaultEndTime = applyEndFromStartAndDuration(
                          startWithTime,
                          serviceDurationHours
                        );
                        setLocalEndTime(defaultEndTime);
                        setEndTime(defaultEndTime);
                      }
                    }}
                  />
                </View>
                {renderDurationControl()}
              </>
            )}

            {selectedOption === "Monthly" && (
              <>
                <View style={styles.dateTimeContainer}>
                  <DribbbleDateTimePicker
                    mode="single"
                    value={localStartTime?.toDate()}
                    maxDate={maxDate90Days.toDate()}
                    onChange={(date: Date) => {
                      if (date) {
                        const selected = dayjs(date);
                        const now = dayjs();
                        if (selected.isBefore(now.add(30, "minute"))) {
                          alert("Please select a time at least 30 minutes from now");
                          return;
                        }
                        if (selected.hour() < 6 || selected.hour() > 19) {
                          alert("Please select a time between 6 AM and 7 PM");
                          return;
                        }
                        if (selected.isAfter(maxDate90Days, "day")) {
                          alert("Date cannot exceed 90 days from today for monthly bookings");
                          return;
                        }
                        if (selected.isBefore(today, "day")) {
                          alert("Please select a future date");
                          return;
                        }
                        updateStartDate(selected);
                      }
                    }}
                  />
                </View>
                {renderDurationControl()}
                {localStartDate && localEndDate && (
                  <View style={[styles.endDateInfo, { backgroundColor: colors.primary + "10" }]}>
                    <Text style={[styles.endDateInfoText, { color: colors.primary, fontSize: fontSizes.small }]}>
                      Monthly subscription: {dayjs(localStartDate).format("MMMM D, YYYY")} - {dayjs(localEndDate).format("MMMM D, YYYY")}
                    </Text>
                  </View>
                )}
              </>
            )}
          </ScrollView>
          <View
            style={[
              styles.actions,
              {
                borderTopColor: BRAND.bookingNavy,
                backgroundColor: isDarkMode ? colors.card : "#f8fafc",
                paddingBottom: Math.max(insets.bottom, 14),
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: colors.border, backgroundColor: isDarkMode ? colors.card : "#ffffff" }]}
              onPress={handleSheetClose}
            >
              <Text style={[styles.cancelText, { color: colors.text, fontSize: fontSizes.button }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmButton, { backgroundColor: BRAND.bookingNavy }, isConfirmDisabled() && [styles.disabledButton, { backgroundColor: colors.disabled }]]}
              onPress={handleAccept}
              disabled={isConfirmDisabled()}
            >
              <Text style={[styles.confirmText, { color: '#fff', fontSize: fontSizes.button }]}>Confirm Booking</Text>
              <Icon name="arrow-forward" size={18} color="#fff" style={styles.confirmArrow} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default BookingDialog;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "rgba(2, 6, 23, 0.18)",
  },
  backdropTapArea: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    width: "100%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    borderColor: "rgba(148, 163, 184, 0.25)",
  },
  sheetHandleWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 4,
    paddingBottom: 4,
  },
  sheetHandleBar: {
    width: 44,
    height: 5,
    borderRadius: 999,
    opacity: 0.9,
  },
  sheetHandleBarLight: {
    width: 48,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.62)",
  },
  headerShell: {
    position: "relative",
    backgroundColor: HOME_M3.primary,
    height: 60,
    justifyContent: "center",
    overflow: "hidden",
  },
  headerToolbar: {
    flexDirection: "row",
    alignItems: "center",
    height: 30,
    paddingHorizontal: 8,
  },
  headerSideBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  headerTitleCenter: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: HOME_M3.onPrimary,
    letterSpacing: -0.2,
    lineHeight: 22,
    paddingHorizontal: 4,
  },
  closeIcon: {
    width: 30,
    height: 30,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginRight: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 4,
    letterSpacing: 0.2,
    includeFontPadding: false,
  },
  stepMetaRow: {
    marginTop: 6,
    alignItems: "center",
  },
  stepMetaText: {
    fontWeight: "600",
  },
  progressTrack: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    gap: 6,
  },
  progressDot: {
    height: 6,
    borderRadius: 999,
  },
  progressDotActive: {
    width: 22,
    backgroundColor: "#ffffff",
  },
  progressDotInactive: {
    width: 12,
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  wizardScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  wizardScrollContent: {
    paddingBottom: 12,
  },
  bookingPlanSection: {
    marginTop: 16,
    marginHorizontal: 20,
    marginBottom: 4,
  },
  segmentedControl: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    marginTop: 12,
    gap: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentSelected: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentText: {
    fontWeight: "600",
    textAlign: "center",
  },
  sectionHeading: {
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  dateTimeContainer: {
    paddingHorizontal: 20,
    marginVertical: 10,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 0,
    marginBottom: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    gap: 12,
    borderTopWidth: 3,
  },
  reviewSection: {
    marginTop: 14,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingTop: 14,
    paddingBottom: 14,
    paddingHorizontal: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
  },
  confirmButton: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  confirmArrow: {
    marginLeft: 2,
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
  durationContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: "#f1f5f9",
  },
  durationTitle: {
    fontWeight: "700",
    marginBottom: 4,
  },
  durationMessage: {
    marginBottom: 12,
    lineHeight: 18,
  },
  durationControl: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
  },
  durationButton: {
    borderWidth: 1,
    borderRadius: 22,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  durationButtonDisabled: {
    opacity: 0.5,
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
    fontWeight: "700",
  },
  durationEndTime: {
    marginTop: 4,
  },
  selectTimeHint: {
    marginTop: 4,
    fontStyle: "italic",
  },
  bookingDetailsContainer: {
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    borderWidth: 1,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  bookingDetailsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  bookingDetailsHeadingWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bookingTypeBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  bookingTypeBadgeText: {
    fontWeight: "700",
  },
  bookingDetailsTitle: {
    fontWeight: "700",
  },
  bookingDetailsContent: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  detailLabel: {
    fontWeight: "600",
    flex: 0.95,
  },
  detailValue: {
    fontWeight: "600",
    flex: 1.05,
    textAlign: "right",
  },
  infoMessage: {
    fontStyle: "normal",
    marginTop: 6,
    textAlign: "center",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  relaxMessageContainer: {
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  relaxMessageText: {
    fontStyle: "italic",
    textAlign: "center",
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
    textAlign: "center",
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 10,
  },
  endDateInfoText: {
    textAlign: "center",
  },
  genderPreferenceContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
  },
  genderPreferenceHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  genderPreferenceTitle: {
    fontWeight: "700",
  },
  genderPreferenceMessage: {
    marginBottom: 12,
    lineHeight: 18,
  },
  genderOptionsContainer: {
    flexDirection: "row",
    gap: 10,
  },
  genderOptionButton: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 6,
  },
  genderOptionSelected: {
    borderWidth: 2,
  },
  genderOptionText: {
    fontWeight: "600",
    textAlign: "center",
  },
});