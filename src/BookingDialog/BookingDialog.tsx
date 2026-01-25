/* eslint-disable */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
  Dimensions,
  ScrollView,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs, { Dayjs } from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import customParseFormat from "dayjs/plugin/customParseFormat";
import LinearGradient from "react-native-linear-gradient";
import DateTimePickerPreview from "../DateTimePickerPreview";

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
  const [showDatePicker, setShowDatePicker] = useState<"start" | "end" | null>(null);
  const [showCustomTimePicker, setShowCustomTimePicker] = useState<"start" | "end" | null>(null);
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [customHours, setCustomHours] = useState<number>(12);
  const [customMinutes, setCustomMinutes] = useState<number>(0);
  const [customAmPm, setCustomAmPm] = useState<"AM" | "PM">("AM");
  const [use24HourFormat, setUse24HourFormat] = useState<boolean>(false);

  const today = dayjs();
  const maxDate21Days = today.add(21, "day");
  const maxDate90Days = today.add(89, "day");

  // Reset picker state when modal closes
  useEffect(() => {
    if (!open) {
      setShowDatePicker(null);
      setShowCustomTimePicker(null);
      setTempDate(null);
    }
  }, [open]);

  // Initialize custom time picker with current time
  useEffect(() => {
    if (showCustomTimePicker) {
      const currentTime = showCustomTimePicker === "start" ? startTime : endTime;
      const now = dayjs();
      let defaultTime = now.add(30, 'minute'); // Default to 30 minutes from now

      if (currentTime) {
        defaultTime = currentTime;
      }

      // Adjust to valid time range if needed
      if (defaultTime.hour() < 5) {
        defaultTime = defaultTime.hour(5).minute(0);
      } else if (defaultTime.hour() >= 22) {
        defaultTime = defaultTime.hour(21).minute(55);
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
    if (Platform.OS === 'android') {
      setShowDatePicker(null);
    }

    if (selectedDate && showDatePicker) {
      setTempDate(selectedDate);
      
      // Auto-show time picker after date selection on Android
      if (Platform.OS === 'android') {
        setTimeout(() => {
          setShowCustomTimePicker(showDatePicker);
        }, 100);
      }
    }
  };

  const isTimeValid = (hours24: number, minutes: number, type: "start" | "end"): boolean => {
    const now = dayjs();
    const selectedDateTime = tempDate 
      ? dayjs(tempDate).hour(hours24).minute(minutes)
      : dayjs().hour(hours24).minute(minutes);

    // For start time, check 30-minute minimum gap
    if (type === "start") {
      if (selectedDateTime.isSame(now, 'day') && selectedDateTime.isBefore(now.add(30, 'minute'))) {
        return false;
      }
    }

    // Check 5 AM - 10 PM range (5 to 21:59)
    if (hours24 < 5 || hours24 >= 22) {
      return false;
    }

    return true;
  };

  const getValidTimeOptions = (type: "start" | "end") => {
    const now = dayjs();
    const isToday = tempDate ? dayjs(tempDate).isSame(now, 'day') : true;
    
    // For 24-hour format: 5 to 21 (5 AM to 9 PM)
    const hours24 = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
    const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
    
    const validHours = hours24.filter(hour24 => {
      // For start times on today, check 30-minute minimum
      if (type === "start" && isToday) {
        const testTime = tempDate 
          ? dayjs(tempDate).hour(hour24).minute(0)
          : dayjs().hour(hour24).minute(0);
        
        if (testTime.isBefore(now.add(30, 'minute'))) {
          return false;
        }
      }
      
      return hour24 >= 5 && hour24 < 22;
    });

    return { validHours, validMinutes: minutes };
  };

  const handleCustomTimeConfirm = () => {
    if (showCustomTimePicker) {
      console.log("🕒 handleCustomTimeConfirm called for:", showCustomTimePicker);
      
      // Convert to 24-hour format for storage
      let hours24 = customHours;
      if (!use24HourFormat) {
        console.log("🔄 Converting from 12-hour to 24-hour format");
        console.log("📊 Before conversion:", { customHours, customAmPm });
        
        // Convert from 12-hour to 24-hour format
        if (customAmPm === "PM" && customHours !== 12) {
          hours24 = customHours + 12;
        } else if (customAmPm === "AM" && customHours === 12) {
          hours24 = 0;
        }
        // If AM and not 12, hours24 remains the same
        // If PM and 12, hours24 remains 12
        
        console.log("📊 After conversion:", { hours24 });
      }

      // Store as clean 24-hour format string
      const timeString = `${hours24.toString().padStart(2, '0')}:${customMinutes.toString().padStart(2, '0')}`;
      console.log("✅ Final time string (24h):", timeString);

      // Validate time
      if (!isTimeValid(hours24, customMinutes, showCustomTimePicker)) {
        const now = dayjs();
        const selectedDateTime = tempDate 
          ? dayjs(tempDate).hour(hours24).minute(customMinutes)
          : dayjs().hour(hours24).minute(customMinutes);

        if (selectedDateTime.isBefore(now.add(30, 'minute')) && showCustomTimePicker === "start") {
          Alert.alert(
            "Invalid Time",
            "Please select a time at least 30 minutes from now"
          );
          return;
        } else if (hours24 < 5 || hours24 >= 22) {
          Alert.alert(
            "Invalid Time",
            "Please select a time between 5 AM (05:00) and 10 PM (22:00)"
          );
          return;
        }
      }

      let selectedDateTime: Dayjs;

      if (tempDate) {
        selectedDateTime = dayjs(tempDate)
          .hour(hours24)
          .minute(customMinutes)
          .second(0)
          .millisecond(0);
        console.log("📅 Using tempDate with time:", selectedDateTime.format());
        setTempDate(null);
      } else {
        const currentDateTime = showCustomTimePicker === "start" ? startTime : endTime;
        if (currentDateTime) {
          selectedDateTime = currentDateTime
            .hour(hours24)
            .minute(customMinutes)
            .second(0)
            .millisecond(0);
          console.log("📅 Using existing datetime with new time:", selectedDateTime.format());
        } else {
          // Create new datetime with today's date and selected time
          selectedDateTime = dayjs()
            .hour(hours24)
            .minute(customMinutes)
            .second(0)
            .millisecond(0);
          console.log("📅 Creating new datetime:", selectedDateTime.format());
        }
      }

      // Apply final validation and adjustments
      if (showCustomTimePicker === "start") {
        console.log("🚀 Updating start date/time");
        updateStartDateTime(selectedDateTime);
      } else {
        console.log("🏁 Updating end date/time");
        updateEndDateTime(selectedDateTime);
      }

      // Log the final state
      console.log("🎯 Time selection completed:");
      console.log("   - Selected time (24h):", timeString);
      console.log("   - Selected datetime:", selectedDateTime.format());
      console.log("   - For:", showCustomTimePicker);
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

    console.log("🔄 updateStartDateTime called:", newDateTime.format());

    // Ensure start time is at least 30 minutes from now if it's today
    if (newDateTime.isSame(now, 'day') && newDateTime.isBefore(now.add(30, 'minute'))) {
      adjustedDateTime = now.add(30, 'minute');
      console.log("⏰ Adjusted to 30 mins from now:", adjustedDateTime.format());
    }

    // Ensure time is within 5 AM - 10 PM
    const hour = adjustedDateTime.hour();
    if (hour < 5) {
      adjustedDateTime = adjustedDateTime.hour(5).minute(0);
      console.log("🌅 Adjusted to 5 AM:", adjustedDateTime.format());
    } else if (hour >= 22) {
      adjustedDateTime = adjustedDateTime.hour(21).minute(55);
      console.log("🌙 Adjusted to 9:55 PM:", adjustedDateTime.format());
    }

    // Store dates and times in clean formats
    setStartDate(adjustedDateTime.format("YYYY-MM-DD")); // Clean date format
    setStartTime(adjustedDateTime); // Store as dayjs object

    console.log("💾 Stored start data:");
    console.log("   - Date:", adjustedDateTime.format("YYYY-MM-DD"));
    console.log("   - Time (24h):", adjustedDateTime.format("HH:mm"));
    console.log("   - Full datetime:", adjustedDateTime.format());

    // Set default end time based on booking option
    if (selectedOption === "Date") {
      const defaultEnd = adjustedDateTime.add(1, "hour");
      // Ensure end time doesn't go beyond 10 PM
      let finalEnd = defaultEnd;
      if (defaultEnd.hour() >= 22) {
        finalEnd = adjustedDateTime.hour(21).minute(55);
      }
      setEndDate(finalEnd.format("YYYY-MM-DD"));
      setEndTime(finalEnd);
      console.log("⏱️ Set default end time:", finalEnd.format("HH:mm"));
    } else if (selectedOption === "Monthly") {
      const endDateValue = adjustedDateTime.add(1, "month");
      setEndDate(endDateValue.format("YYYY-MM-DD"));
      setEndTime(endDateValue);
      console.log("📅 Set monthly end date:", endDateValue.format("YYYY-MM-DD"));
    }
  };

  const updateEndDateTime = (newDateTime: Dayjs) => {
    let adjustedDateTime = newDateTime;

    console.log("🔄 updateEndDateTime called:", newDateTime.format());

    // Ensure end time is after start time
    if (startTime && newDateTime.isBefore(startTime)) {
      adjustedDateTime = startTime.add(1, 'hour');
      console.log("⏩ Adjusted end time to be after start:", adjustedDateTime.format());
    }

    // Ensure time is within 5 AM - 10 PM
    const hour = adjustedDateTime.hour();
    if (hour < 5) {
      adjustedDateTime = adjustedDateTime.hour(5).minute(0);
      console.log("🌅 Adjusted to 5 AM:", adjustedDateTime.format());
    } else if (hour >= 22) {
      adjustedDateTime = adjustedDateTime.hour(21).minute(55);
      console.log("🌙 Adjusted to 9:55 PM:", adjustedDateTime.format());
    }

    // Store in clean formats
    setEndDate(adjustedDateTime.format("YYYY-MM-DD"));
    setEndTime(adjustedDateTime);

    console.log("💾 Stored end data:");
    console.log("   - Date:", adjustedDateTime.format("YYYY-MM-DD"));
    console.log("   - Time (24h):", adjustedDateTime.format("HH:mm"));
    console.log("   - Full datetime:", adjustedDateTime.format());
  };

  const isConfirmDisabled = () => {
    if (selectedOption === "Date") {
      return !startDate || !startTime;
    } else if (selectedOption === "Short term") {
      if (!startDate || !endDate || !startTime || !endTime) return true;
      return dayjs(endDate).isBefore(dayjs(startDate));
    } else if (selectedOption === "Monthly") {
      return !startDate || !startTime;
    }
    return true;
  };

  const handleAccept = () => {
    // Final validation before saving
    if (startTime) {
      const now = dayjs();
      if (startTime.isSame(now, 'day') && startTime.isBefore(now.add(30, 'minute'))) {
        Alert.alert(
          "Invalid Time",
          "Please select a start time at least 30 minutes from now"
        );
        return;
      }

      const hour = startTime.hour();
      if (hour < 5 || hour >= 22) {
        Alert.alert(
          "Invalid Time",
          "Please select a time between 5 AM (05:00) and 10 PM (22:00)"
        );
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

  // Custom Time Picker Component
  const renderCustomTimePicker = () => {
    const { validHours, validMinutes } = getValidTimeOptions(showCustomTimePicker!);
    const now = dayjs();
    const isToday = tempDate ? dayjs(tempDate).isSame(now, 'day') : true;

    // Convert current selection to 24-hour format for validation
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
        return `${currentHours24.toString().padStart(2, '0')}:${customMinutes.toString().padStart(2, '0')}`;
      } else {
        return `${customHours}:${customMinutes.toString().padStart(2, '0')} ${customAmPm}`;
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
      return `${hours24.toString().padStart(2, '0')}:${customMinutes.toString().padStart(2, '0')}`;
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
              !use24HourFormat && styles.formatButtonActive
            ]}
            onPress={() => setUse24HourFormat(false)}
          >
            <Text style={[
              styles.formatButtonText,
              !use24HourFormat && styles.formatButtonTextActive
            ]}>
              12H
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.formatButton,
              use24HourFormat && styles.formatButtonActive
            ]}
            onPress={() => setUse24HourFormat(true)}
          >
            <Text style={[
              styles.formatButtonText,
              use24HourFormat && styles.formatButtonTextActive
            ]}>
              24H
            </Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.timeRangeInfo}>
          Available: 5 AM - 10 PM (05:00 - 22:00 GMT){showCustomTimePicker === "start" && isToday ? " • Min. 30 mins from now" : ""}
        </Text>
        
        <View style={styles.customTimePicker}>
          {/* Hours Column */}
          <ScrollView style={styles.timeColumn} showsVerticalScrollIndicator={false}>
            {validHours.map((hour) => {
              let displayHour, displayText;
              
              if (use24HourFormat) {
                displayHour = hour;
                displayText = hour.toString().padStart(2, '0');
              } else {
                // Convert to 12-hour format for display
                if (hour === 0) {
                  displayHour = 12;
                  displayText = '12';
                } else if (hour < 12) {
                  displayHour = hour;
                  displayText = hour.toString();
                } else if (hour === 12) {
                  displayHour = 12;
                  displayText = '12';
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
                  <Text style={[
                    styles.timeOptionText,
                    isSelected && styles.timeOptionTextSelected,
                  ]}>
                    {displayText}
                  </Text>
                  {!use24HourFormat && (
                    <Text style={[
                      styles.timePeriodText,
                      isSelected && styles.timePeriodTextSelected,
                    ]}>
                      {hour < 12 ? 'AM' : 'PM'}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Minutes Column */}
          <ScrollView style={styles.timeColumn} showsVerticalScrollIndicator={false}>
            {validMinutes.map((minute) => (
              <TouchableOpacity
                key={minute}
                style={[
                  styles.timeOption,
                  customMinutes === minute && styles.timeOptionSelected,
                ]}
                onPress={() => setCustomMinutes(minute)}
              >
                <Text style={[
                  styles.timeOptionText,
                  customMinutes === minute && styles.timeOptionTextSelected,
                ]}>
                  {minute.toString().padStart(2, '0')}
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
                <Text style={[
                  styles.timeOptionText,
                  customAmPm === "AM" && styles.timeOptionTextSelected,
                ]}>
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
                <Text style={[
                  styles.timeOptionText,
                  customAmPm === "PM" && styles.timeOptionTextSelected,
                ]}>
                  PM
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={[
          styles.selectedTimeDisplay,
          !isCurrentTimeValid && styles.selectedTimeDisplayInvalid
        ]}>
          <Text style={[
            styles.selectedTimeText,
            !isCurrentTimeValid && styles.selectedTimeTextInvalid
          ]}>
            Selected: {getDisplayTime()}
          </Text>
          <Text style={styles.gmtTimeText}>
            GMT: {get24HourDisplay()}
          </Text>
          {!isCurrentTimeValid && (
            <Text style={styles.validationText}>
              {showCustomTimePicker === "start" && isToday ? 
                "Must be at least 30 minutes from now" : 
                "Must be between 05:00 and 22:00 GMT"}
            </Text>
          )}
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
              !isCurrentTimeValid && styles.disabledButton
            ]} 
            onPress={handleCustomTimeConfirm}
            disabled={!isCurrentTimeValid}
          >
            <Text style={[
              styles.customTimePickerButtonText, 
              styles.customTimePickerButtonTextConfirm
            ]}>
              Confirm
            </Text>
          </TouchableOpacity>
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
              <Text style={styles.title}>Select your Booking Option</Text>
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
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => handleDateSelect("start")}
                  >
                    <Text style={styles.dateButtonText}>
                      {startDate
                        ? `Date: ${dayjs(startDate).format("MMM D, YYYY")}`
                        : "Select Date"}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => handleTimeSelect("start")}
                  >
                    <Text style={styles.dateButtonText}>
                      {startTime
                        ? `Time: ${startTime.format("HH:mm")} GMT`
                        : "Select Time"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Date Picker */}
                {showDatePicker === "start" && (
//                   <DateTimePicker
//                     value={
//   tempDate
//     ? tempDate
//     : startTime
//     ? new Date(startTime.toISOString())
//     : new Date()
// }
//                     mode="date"
//                     display={Platform.OS === "ios" ? "inline" : "default"}
//                     minimumDate={new Date()}
//                     maximumDate={getMaximumDate()}
//                     onChange={handleDateChange}
//                   />
<DateTimePickerPreview />
                )}

                {/* Custom Time Picker */}
                {showCustomTimePicker === "start" && renderCustomTimePicker()}

                {startDate && (
                  <View style={styles.confirmBox}>
                    <Text style={styles.sectionTitle}>Booking Details</Text>
                    <Text style={styles.sectionText}>
                      Start: {dayjs(startDate).format("MMMM D, YYYY [at] HH:mm")} GMT
                    </Text>
                    <Text style={styles.sectionText}>
                      Duration: {duration} hour{duration > 1 ? "s" : ""}
                    </Text>

                    <View style={styles.durationRow}>
                      <TouchableOpacity
                        style={styles.adjustButton}
                        onPress={() => {
                          if (startTime && endTime && duration > 1) {
                            const newEnd = startTime.add(duration - 1, "hour");
                            setEndTime(newEnd);
                            setEndDate(newEnd.toISOString());
                          }
                        }}
                      >
                        <Text style={styles.adjustText}>-</Text>
                      </TouchableOpacity>

                      <Text style={styles.durationText}>
                        {duration} hour{duration > 1 ? "s" : ""}
                      </Text>

                      <TouchableOpacity
                        style={styles.adjustButton}
                        onPress={() => {
                          if (startTime && endTime) {
                            const newEnd = startTime.add(duration + 1, "hour");
                            if (newEnd.hour() < 22) {
                              setEndTime(newEnd);
                              setEndDate(newEnd.toISOString());
                            }
                          }
                        }}
                      >
                        <Text style={styles.adjustText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </>
            )}

            {/* SHORT TERM Option */}
            {selectedOption === "Short term" && (
              <>
                <Text style={styles.subtitle}>Start Date & Time</Text>
                <View style={styles.dateTimeContainer}>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => handleDateSelect("start")}
                  >
                    <Text style={styles.dateButtonText}>
                      {startDate
                        ? `Date: ${dayjs(startDate).format("MMM D, YYYY")}`
                        : "Select Start Date"}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => handleTimeSelect("start")}
                  >
                    <Text style={styles.dateButtonText}>
                      {startTime
                        ? `Time: ${startTime.format("HH:mm")} GMT`
                        : "Select Start Time"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.subtitle}>End Date & Time</Text>
                <View style={styles.dateTimeContainer}>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => handleDateSelect("end")}
                  >
                    <Text style={styles.dateButtonText}>
                      {endDate
                        ? `Date: ${dayjs(endDate).format("MMM D, YYYY")}`
                        : "Select End Date"}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => handleTimeSelect("end")}
                  >
                    <Text style={styles.dateButtonText}>
                      {endTime
                        ? `Time: ${endTime.format("HH:mm")} GMT`
                        : "Select End Time"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Date Pickers */}
                {showDatePicker && (
                  <DateTimePicker
                    value={
  tempDate
    ? tempDate
    : startTime
    ? new Date(startTime.toISOString())
    : new Date()
}
                    mode="date"
                    display={Platform.OS === "ios" ? "inline" : "default"}
                    minimumDate={
                      showDatePicker === "start"
                        ? new Date()
                        : startDate
                        ? new Date(dayjs(startDate).toISOString())
                        : new Date()
                    }
                    maximumDate={getMaximumDate()}
                    onChange={handleDateChange}
                  />
                )}

                {/* Custom Time Picker */}
                {showCustomTimePicker && renderCustomTimePicker()}
              </>
            )}

            {/* MONTHLY Option */}
            {selectedOption === "Monthly" && (
              <>
                <View style={styles.dateTimeContainer}>
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => handleDateSelect("start")}
                  >
                    <Text style={styles.dateButtonText}>
                      {startDate
                        ? `Date: ${dayjs(startDate).format("MMM D, YYYY")}`
                        : "Select Start Date"}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.dateButton}
                    onPress={() => handleTimeSelect("start")}
                  >
                    <Text style={styles.dateButtonText}>
                      {startTime
                        ? `Time: ${startTime.format("HH:mm")} GMT`
                        : "Select Start Time"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Date Picker */}
                {showDatePicker === "start" && (
//                   <DateTimePicker
//                     value={
//   tempDate
//     ? tempDate
//     : startTime
//     ? new Date(startTime.toISOString())
//     : new Date()
// }
//                     mode="date"
//                     display={Platform.OS === "ios" ? "inline" : "default"}
//                     minimumDate={new Date()}
//                     maximumDate={getMaximumDate()}
//                     onChange={handleDateChange}
//                   />

<DateTimePickerPreview />
                )}

                {/* Custom Time Picker */}
                {showCustomTimePicker === "start" && renderCustomTimePicker()}

                {startDate && (
                  <View style={styles.confirmBox}>
                    <Text style={styles.sectionTitle}>Monthly Booking Details</Text>
                    <Text style={styles.sectionText}>
                      Start: {dayjs(startDate).format("MMMM D, YYYY [at] HH:mm")} GMT
                    </Text>
                    <Text style={styles.sectionText}>
                      End: {dayjs(startDate).add(1, 'month').format("MMMM D, YYYY [at] HH:mm")} GMT
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
    overflow: 'hidden', // Important for gradient corners
  },
  headerContainer: {
    height: 60,
    justifyContent: "center",
    // padding: 10,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
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
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
  },
  formatButton: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  formatButtonActive: {
    backgroundColor: '#007AFF',
  },
  formatButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  formatButtonTextActive: {
    color: '#fff',
  },
  timeRangeInfo: {
    fontSize: 12,
    textAlign: "center",
    color: "#666",
    marginBottom: 16,
    fontStyle: 'italic',
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
    textAlign: 'center',
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
});