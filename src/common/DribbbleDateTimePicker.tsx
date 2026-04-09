import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from "react-native";
import dayjs, { Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

// ✅ Enable customParseFormat plugin for proper time parsing
dayjs.extend(customParseFormat);

/* -------------------- Constants -------------------- */

const WEEK_DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const generateTimeSlots = () => {
  const slots: string[] = [];
  // Generate from 5:00 AM to 8:00 PM
  for (let h = 5; h <= 20; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour12 = h % 12 || 12;
      // ✅ FIXED: Always use 2-digit minutes with padStart
      const minute = String(m).padStart(2, "0");
      const ampm = h < 12 ? "AM" : "PM";
      slots.push(`${hour12}:${minute} ${ampm}`);
    }
  }
  return slots;
};

const TIMES = generateTimeSlots();

/* -------------------- Types -------------------- */

type RangeValue = {
  startDate?: Date;
  endDate?: Date;
};

type SingleModeProps = {
  mode?: "single";
  value?: Date;
  onChange: (date: Date, time?: string) => void;
};

type RangeModeProps = {
  mode: "range";
  value?: RangeValue;
  onChange: (range: { startDate: Date; endDate: Date; time: string }) => void;
};

type Props = SingleModeProps | RangeModeProps;

/* -------------------- Component -------------------- */

export default function DribbbleDateTimePicker(props: Props) {
  const mode = props.mode ?? "single";
  
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showTimeHint, setShowTimeHint] = useState(false);

  /* ---------- Single Date Only ---------- */
  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => {
    if (mode === "single" && props.value instanceof Date) {
      return dayjs(props.value);
    }
    return dayjs();
  });

  /* ---------- Range Date ---------- */
  const [rangeStart, setRangeStart] = useState<Dayjs | null>(() => {
    if (mode === "range" && props.value && 'startDate' in props.value && props.value.startDate) {
      return dayjs(props.value.startDate);
    }
    return null;
  });
  
  const [rangeEnd, setRangeEnd] = useState<Dayjs | null>(() => {
    if (mode === "range" && props.value && 'endDate' in props.value && props.value.endDate) {
      return dayjs(props.value.endDate);
    }
    return null;
  });

  const [isSelectingEnd, setIsSelectingEnd] = useState(false);

  /* -------------------- Calendar Setup -------------------- */

  const today = dayjs().startOf("day");
  const now = dayjs();

  const startOfMonth = currentMonth.startOf("month");
  const daysInMonth = currentMonth.daysInMonth();
  const startDay = (startOfMonth.day() + 6) % 7;

  const calendarCells = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  /* -------------------- Helper Functions -------------------- */

  const isToday = (date: Dayjs): boolean => date.isSame(now, "day");
  const isPastDate = (date: Dayjs): boolean => date.isBefore(today, "day");
  const isPastMonth = (month: Dayjs): boolean => month.isBefore(today, "month");

  const isTimeSlotDisabled = (time: string): boolean => {
    const effectiveDate = mode === "range" ? rangeStart : selectedDate;
    if (!effectiveDate) return true;
    if (isPastDate(effectiveDate)) return true;
    if (!isToday(effectiveDate)) return false;

    // ✅ Strict parsing with validation
    const parsedTime = dayjs(time, "h:mm A", true);
    if (!parsedTime.isValid()) {
      console.log("Invalid time format:", time);
      return true;
    }

    // ✅ Build time using effectiveDate
    const timeDateTime = effectiveDate
      .hour(parsedTime.hour())
      .minute(parsedTime.minute())
      .second(0)
      .millisecond(0);

    const isDisabled = timeDateTime.isBefore(now.add(30, "minute"));
    
    // Debug log
    console.log(`Time: ${time}, Hour: ${parsedTime.hour()}, Minute: ${parsedTime.minute()}, Disabled: ${isDisabled}`);
    
    return isDisabled;
  };

  const isDisabledDate = (day: number) => {
    const date = currentMonth.date(day);
    return isPastDate(date);
  };

  const isInRange = (day: number) => {
    if (mode !== "range") return false;
    if (!rangeStart || !rangeEnd) return false;
    
    const date = currentMonth.date(day);
    return date.isAfter(rangeStart) && date.isBefore(rangeEnd);
  };

  const isRangeStart = (day: number) => {
    if (mode !== "range") return false;
    if (!rangeStart) return false;
    return currentMonth.date(day).isSame(rangeStart, "day");
  };

  const isRangeEnd = (day: number) => {
    if (mode !== "range") return false;
    if (!rangeEnd) return false;
    return currentMonth.date(day).isSame(rangeEnd, "day");
  };

  const getDisabledTimeMessage = () => {
    const effectiveDate = mode === "range" ? rangeStart : selectedDate;
    if (!effectiveDate) return "Select a date first";
    if (isPastDate(effectiveDate)) return "Past dates cannot be booked";
    if (isToday(effectiveDate)) return "Past times are disabled for today";
    return null;
  };

  /* -------------------- Handlers -------------------- */

  const selectDate = (day: number) => {
    const date = currentMonth.date(day);
    if (isDisabledDate(day)) return;

    if (mode === "single") {
      setSelectedDate(date);
      setSelectedTime(null);
    } else if (mode === "range") {
      if (!isSelectingEnd || !rangeStart) {
        // Start selecting range
        setRangeStart(date);
        setRangeEnd(null);
        setIsSelectingEnd(true);
        setSelectedTime(null);
      } else {
        // Complete the range
        let start = rangeStart;
        let end = date;
        
        if (date.isBefore(rangeStart)) {
          start = date;
          end = rangeStart;
        }
        
        setRangeStart(start);
        setRangeEnd(end);
        setIsSelectingEnd(false);
        setSelectedTime(null);
        
        // For range mode, if we have a time selected, trigger onChange with range object
        if (start && end && selectedTime) {
          const parsedTime = dayjs(selectedTime, "h:mm A", true);
          if (parsedTime.isValid()) {
            const startDate = start
              .hour(parsedTime.hour())
              .minute(parsedTime.minute())
              .second(0)
              .millisecond(0)
              .toDate();
            
            const endDate = end
              .hour(parsedTime.hour())
              .minute(parsedTime.minute())
              .second(0)
              .millisecond(0)
              .toDate();
            
            // Type-safe call for range mode
            (props as RangeModeProps).onChange({ startDate, endDate, time: selectedTime });
          }
        }
      }
    }
  };

  const selectTime = (time: string) => {
    if (isTimeSlotDisabled(time)) return;
    
    const effectiveDate = mode === "range" ? rangeStart : selectedDate;
    if (!effectiveDate) return;

    setSelectedTime(time);

    // ✅ Strict parsing with validation
    const parsedTime = dayjs(time, "h:mm A", true);
    if (!parsedTime.isValid()) {
      console.error("Failed to parse time:", time);
      return;
    }

    // Debug log to verify parsing
    console.log(`Selected time: ${time}`);
    console.log(`Parsed - Hour: ${parsedTime.hour()}, Minute: ${parsedTime.minute()}`);
    
    // ✅ Build final date
    const finalDate = effectiveDate
      .hour(parsedTime.hour())
      .minute(parsedTime.minute())
      .second(0)
      .millisecond(0)
      .toDate();

    // Debug log to verify final date
    console.log(`Final date: ${finalDate}`);
    console.log(`Formatted time: ${dayjs(finalDate).format("h:mm A")}`);

    if (mode === "range") {
      if (rangeStart && rangeEnd) {
        // Both dates selected, trigger onChange with range object
        (props as RangeModeProps).onChange({ 
          startDate: rangeStart.toDate(), 
          endDate: rangeEnd.toDate(), 
          time 
        });
      } else if (rangeStart && !rangeEnd) {
        // Only start date selected, store time but don't trigger onChange yet
        // Wait for end date selection
        return;
      }
    } else {
      // Single mode
      (props as SingleModeProps).onChange(finalDate, time);
    }
  };

  const changeMonth = (increment: number) => {
    const newMonth = currentMonth.add(increment, "month");
    if (increment === -1 && isPastMonth(newMonth)) return;
    setCurrentMonth(newMonth);
  };

  /* -------------------- Render -------------------- */

  return (
    <View style={styles.card}>
      {/* Book by - Header Section */}
      <View style={styles.bookByContainer}>
        <Text style={styles.bookByTitle}>Book by</Text>
      </View>

      {/* Month and Year Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => changeMonth(-1)}
          disabled={isPastMonth(currentMonth.subtract(1, "month"))}
          style={[
            styles.monthButton,
            isPastMonth(currentMonth.subtract(1, "month")) &&
              styles.monthButtonDisabled,
          ]}
        >
          <Text
            style={[
              styles.monthButtonText,
              isPastMonth(currentMonth.subtract(1, "month")) &&
                styles.monthButtonTextDisabled,
            ]}
          >
            ‹
          </Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{currentMonth.format("MMMM YYYY")}</Text>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthButton}>
          <Text style={styles.monthButtonText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Range Selection Hint */}
      {mode === "range" && (
        <View style={styles.rangeHint}>
          <Text style={styles.rangeHintText}>
            {!rangeStart 
              ? "Select start date" 
              : !rangeEnd 
              ? "Select end date" 
              : "Range selected"}
          </Text>
        </View>
      )}

      {/* Week Header */}
      <View style={styles.weekHeader}>
        {WEEK_DAYS.map((d) => (
          <Text key={d} style={styles.weekDayText}>
            {d}
          </Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {calendarCells.map((day, i) => {
          const disabled = day ? isDisabledDate(day) : true;
          const isSelected = mode === "single" 
            ? day && selectedDate.isSame(currentMonth.date(day), "day")
            : false;
          
          const isInRangeValue = day ? isInRange(day) : false;
          const isStart = day ? isRangeStart(day) : false;
          const isEnd = day ? isRangeEnd(day) : false;

          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.calendarDay,
                !day && styles.emptyDay,
                disabled && styles.disabledDay,
                isSelected && styles.selectedDay,
                isInRangeValue && styles.inRangeDay,
                isStart && styles.rangeStartDay,
                isEnd && styles.rangeEndDay,
              ]}
              onPress={() => !disabled && day && selectDate(day)}
              disabled={disabled}
            >
              <Text
                style={[
                  styles.calendarDayText,
                  (isSelected || isStart || isEnd) && styles.selectedDayText,
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Select Time Header */}
      <View style={styles.timeHeader}>
        <Text style={styles.timeTitle}>Select Time</Text>
        {getDisabledTimeMessage() && (
          <Text style={styles.timeHint}>{getDisabledTimeMessage()}</Text>
        )}
      </View>

      {/* Time Grid */}
      <ScrollView
        style={styles.timeGrid}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.timeGridContent}
        nestedScrollEnabled={true}
      >
        {TIMES.map((time) => {
          const isDisabled = isTimeSlotDisabled(time);
          const isSelected = selectedTime === time;

          return (
            <TouchableOpacity
              key={time}
              style={[
                styles.timeSlot,
                isSelected && styles.activeTimeSlot,
                isDisabled && styles.disabledTimeSlot,
              ]}
              onPress={() => selectTime(time)}
              disabled={isDisabled}
            >
              <Text
                style={[
                  styles.timeSlotText,
                  isSelected && styles.activeTimeSlotText,
                  isDisabled && styles.disabledTimeSlotText,
                ]}
              >
                {time}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  bookByContainer: {
    marginBottom: 0,
  },
  bookByTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  monthButton: {
    padding: 8,
    minWidth: 40,
    alignItems: "center",
  },
  monthButtonDisabled: {
    opacity: 0.3,
  },
  monthButtonText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#007AFF",
  },
  monthButtonTextDisabled: {
    color: "#ccc",
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  rangeHint: {
    backgroundColor: "#E3F2FD",
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: "center",
  },
  rangeHintText: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "500",
  },
  weekHeader: {
    flexDirection: "row",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  weekDayText: {
    flex: 1,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "500",
    color: "#999",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  calendarDay: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 30,
    marginVertical: 2,
  },
  emptyDay: {
    backgroundColor: "transparent",
  },
  disabledDay: {
    opacity: 0.3,
  },
  selectedDay: {
    backgroundColor: "#007AFF",
  },
  inRangeDay: {
    backgroundColor: "#E3F2FD",
  },
  rangeStartDay: {
    backgroundColor: "#007AFF",
    borderTopLeftRadius: 30,
    borderBottomLeftRadius: 30,
  },
  rangeEndDay: {
    backgroundColor: "#007AFF",
    borderTopRightRadius: 30,
    borderBottomRightRadius: 30,
  },
  calendarDayText: {
    fontSize: 15,
    color: "#000",
    fontWeight: "500",
  },
  selectedDayText: {
    color: "#fff",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginVertical: 20,
  },
  timeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  timeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  timeHint: {
    fontSize: 12,
    color: "#FF9800",
  },
  timeGrid: {
    maxHeight: 220,
  },
  timeGridContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 8,
  },
  timeSlot: {
    width: "30%",
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 30,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F5F5F5",
  },
  activeTimeSlot: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  disabledTimeSlot: {
    backgroundColor: "#FAFAFA",
    opacity: 0.5,
  },
  timeSlotText: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
  },
  activeTimeSlotText: {
    color: "#fff",
    fontWeight: "600",
  },
  disabledTimeSlotText: {
    color: "#999",
  },
});