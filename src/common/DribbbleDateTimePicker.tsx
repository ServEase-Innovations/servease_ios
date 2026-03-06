import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import dayjs, { Dayjs } from "dayjs";

/* -------------------- Constants -------------------- */

const WEEK_DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const generateTimeSlots = () => {
  const slots: string[] = [];
  for (let h = 5; h <= 20; h++) {
    const hour12 = h % 12 || 12;
    const ampm = h < 12 ? "AM" : "PM";
    slots.push(`${hour12}:00 ${ampm}`);
  }
  return slots;
};

const TIMES = generateTimeSlots();
const MAX_RANGE_DAYS = 21;

/* -------------------- Types -------------------- */

type RangeValue = {
  startDate?: Date;
  endDate?: Date;
};

type SingleProps = {
  mode?: "single";
  value?: Date;
  onChange: (date: Date) => void;
};

type RangeProps = {
  mode: "range";
  value?: RangeValue;
  onChange: (payload: {
    startDate: Date;
    endDate: Date;
    time: string;
  }) => void;
};

type Props = SingleProps | RangeProps;

/* -------------------- Component -------------------- */

export default function DribbbleDateTimePicker(props: Props) {
  const mode = props.mode ?? "single";
  const value = props.value;

  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showTimeHint, setShowTimeHint] = useState(false);

  /* ---------- Single Date ---------- */
  const [selectedDate, setSelectedDate] = useState<Dayjs>(
    mode === "single" && value instanceof Date ? dayjs(value) : dayjs()
  );

  /* ---------- Range ---------- */
  const rangeValue =
    mode === "range" && value && typeof value === "object" && "startDate" in value
      ? value
      : undefined;

  const [rangeStart, setRangeStart] = useState<Dayjs | null>(
    rangeValue?.startDate ? dayjs(rangeValue.startDate) : null
  );

  const [rangeEnd, setRangeEnd] = useState<Dayjs | null>(
    rangeValue?.endDate ? dayjs(rangeValue.endDate) : null
  );

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

  // Check if a date is today
  const isToday = (date: Dayjs): boolean => {
    return date.isSame(now, "day");
  };

  // Check if a date is in the past (before today)
  const isPastDate = (date: Dayjs): boolean => {
    return date.isBefore(today, "day");
  };

  // Check if a month is in the past
  const isPastMonth = (month: Dayjs): boolean => {
    return month.isBefore(today, "month");
  };

  // Check if a time slot should be disabled based on selected date
  const isTimeSlotDisabled = (time: string): boolean => {
    // For range mode, if no dates selected, disable all times
    if (mode === "range" && (!rangeStart || !rangeEnd)) {
      return true;
    }

    // Get the selected date(s) to check
    let selectedDateToCheck: Dayjs | null = null;
    
    if (mode === "single") {
      selectedDateToCheck = selectedDate;
    } else if (mode === "range" && rangeStart) {
      selectedDateToCheck = rangeStart;
    }

    // If no date selected, disable in range mode
    if (!selectedDateToCheck) {
      return mode === "range";
    }

    // If the selected date is in the past, disable ALL time slots
    if (isPastDate(selectedDateToCheck)) {
      return true;
    }

    // Only apply time restrictions if the selected date is today
    if (!isToday(selectedDateToCheck)) {
      return false; // Future dates can select any time
    }

    // Parse the time string
    const [t, meridian] = time.split(" ");
    let hour = Number(t.split(":")[0]);

    // Convert to 24-hour format
    if (meridian === "PM" && hour !== 12) hour += 12;
    if (meridian === "AM" && hour === 12) hour = 0;

    // Create a datetime object for today with the selected time
    const timeDateTime = now.hour(hour).minute(0).second(0).millisecond(0);

    // For start times, require at least 30 minutes buffer
    if (mode === "single" || (mode === "range" && rangeStart === selectedDateToCheck)) {
      return timeDateTime.isBefore(now.add(30, "minute"));
    } else {
      return timeDateTime.isBefore(now);
    }
  };

  const isRangeStart = (day: number) =>
    rangeStart && currentMonth.date(day).isSame(rangeStart, "day");

  const isRangeEnd = (day: number) =>
    rangeEnd && currentMonth.date(day).isSame(rangeEnd, "day");

  const isInRange = (day: number) => {
    if (!rangeStart || !rangeEnd) return false;
    const d = currentMonth.date(day);
    return d.isAfter(rangeStart, "day") && d.isBefore(rangeEnd, "day");
  };

  const isDisabledInRangeMode = (day: number) => {
    const date = currentMonth.date(day);

    // ❌ Disable ALL past dates (including previous months)
    if (isPastDate(date)) {
      return true;
    }

    // ❌ Range mode: disable dates beyond +21 days from start
    if (mode === "range" && rangeStart && !rangeEnd) {
      if (date.isAfter(rangeStart.add(MAX_RANGE_DAYS, "day"), "day")) {
        return true;
      }
    }

    return false;
  };

  // Get the appropriate message for disabled times
  const getDisabledTimeMessage = () => {
    if (mode === "range" && (!rangeStart || !rangeEnd)) {
      return "Select start and end dates first";
    }
    
    const selectedDateToCheck = mode === "single" ? selectedDate : rangeStart;
    
    if (selectedDateToCheck) {
      if (isPastDate(selectedDateToCheck)) {
        return "Past dates cannot be booked";
      }
      if (isToday(selectedDateToCheck)) {
        return "Past times are disabled for today";
      }
    }
    
    return null;
  };

  // Determine if time selection should be disabled overall
  const isTimeSelectionDisabled = mode === "range" && (!rangeStart || !rangeEnd);

  /* -------------------- Handlers -------------------- */

  const selectDate = (day: number) => {
    const date = currentMonth.date(day);

    // Don't allow selecting disabled dates
    if (isDisabledInRangeMode(day)) return;

    if (mode === "single") {
      setSelectedDate(date);
      setSelectedTime(null); // Clear selected time when date changes
      return;
    }

    // RANGE MODE
    if (!rangeStart || rangeEnd) {
      setRangeStart(date);
      setRangeEnd(null);
      setSelectedTime(null); // Clear selected time when date changes
      return;
    }

    // Prevent selecting same day as range start
    if (date.isSame(rangeStart, "day")) {
      return;
    }

    // ⛔ Prevent selecting more than 21 days
    if (date.diff(rangeStart, "day") > MAX_RANGE_DAYS) {
      setShowTimeHint(true);
      setTimeout(() => setShowTimeHint(false), 3000);
      return;
    }

    if (date.isBefore(rangeStart, "day")) {
      setRangeStart(date);
    } else {
      setRangeEnd(date);
    }
    setSelectedTime(null); // Clear selected time when date changes
  };

  const selectTime = (time: string) => {
    // Don't allow selecting disabled times
    if (isTimeSlotDisabled(time)) return;

    // For range mode, require both dates selected
    if (mode === "range" && (!rangeStart || !rangeEnd)) return;

    setSelectedTime(time);

    const [t, meridian] = time.split(" ");
    let hour = Number(t.split(":")[0]);

    if (meridian === "PM" && hour !== 12) hour += 12;
    if (meridian === "AM" && hour === 12) hour = 0;

    if (mode === "single") {
      const finalDate = selectedDate
        .hour(hour)
        .minute(0)
        .second(0)
        .toDate();

      const singleProps = props as SingleProps;
      singleProps.onChange(finalDate);
      return;
    }

    if (!rangeStart || !rangeEnd) return;

    const rangeProps = props as RangeProps;
    rangeProps.onChange({
      startDate: rangeStart.hour(hour).minute(0).toDate(),
      endDate: rangeEnd.hour(hour).minute(0).toDate(),
      time,
    });
  };

  /* -------------------- Render -------------------- */

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => setCurrentMonth(m => m.subtract(1, "month"))}
          disabled={isPastMonth(currentMonth.subtract(1, "month"))}
          style={[
            styles.arrowButton,
            isPastMonth(currentMonth.subtract(1, "month")) && styles.disabledArrow
          ]}
        >
          <Text style={styles.arrow}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.month}>
          {currentMonth.format("MMMM YYYY")}
        </Text>

        <TouchableOpacity 
          onPress={() => setCurrentMonth(m => m.add(1, "month"))}
          style={styles.arrowButton}
        >
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Week Days */}
      <View style={styles.weekRow}>
        {WEEK_DAYS.map(d => (
          <Text key={d} style={styles.weekDay}>{d}</Text>
        ))}
      </View>

      {/* Calendar */}
      <View style={styles.grid}>
        {calendarCells.map((day, i) => {
          const disabled = day ? isDisabledInRangeMode(day) : true;

          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.day,
                disabled && styles.disabledDay,
                day && mode === "single" &&
                selectedDate.isSame(currentMonth.date(day), "day")
                  ? styles.singleActive
                  : {},
                day && mode === "range" && isRangeStart(day) ? styles.rangeStart : {},
                day && mode === "range" && isRangeEnd(day) ? styles.rangeEnd : {},
                day && mode === "range" && isInRange(day) ? styles.rangeMiddle : {},
                !day ? styles.emptyCell : {},
              ]}
              onPress={() => !disabled && day && selectDate(day)}
              disabled={disabled}
            >
              {day && (
                <Text
                  style={[
                    styles.dayText,
                    (isRangeStart(day) || isRangeEnd(day) || 
                     (mode === "single" && selectedDate.isSame(currentMonth.date(day), "day"))) 
                     && styles.activeText,
                    disabled && styles.disabledText,
                  ]}
                >
                  {day}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Range hint */}
      {showTimeHint && (
        <View style={styles.rangeHint}>
          <Text style={styles.rangeHintText}>
            Maximum range is {MAX_RANGE_DAYS} days
          </Text>
        </View>
      )}

      {/* Time */}
      <View style={styles.divider} />
      <View style={styles.timeHeader}>
        <Text style={styles.timeTitle}>Select Time</Text>
        {getDisabledTimeMessage() && (
          <Text style={styles.timeHint}>{getDisabledTimeMessage()}</Text>
        )}
      </View>

      <ScrollView 
        horizontal={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.timeGrid}
      >
        {TIMES.map(time => {
          const isDisabled = isTimeSlotDisabled(time);
          const isSelected = selectedTime === time;

          return (
            <TouchableOpacity
              key={time}
              style={[
                styles.timeChip,
                isSelected && styles.timeActive,
                (isDisabled || isTimeSelectionDisabled) && styles.timeDisabled,
              ]}
              onPress={() => selectTime(time)}
              disabled={isDisabled || isTimeSelectionDisabled}
            >
              <Text
                style={[
                  styles.timeText,
                  isSelected && styles.timeTextActive,
                  (isDisabled || isTimeSelectionDisabled) && styles.timeTextDisabled,
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

/* -------------------- Styles -------------------- */

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 16,
    width: "100%",
    maxWidth: 380,
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  arrowButton: {
    padding: 8,
  },
  disabledArrow: {
    opacity: 0.3,
  },
  arrow: {
    fontSize: 22,
    color: "#3E57D0",
  },
  month: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  weekDay: {
    flex: 1,
    textAlign: "center",
    color: "#999",
    fontSize: 12,
    fontWeight: "500",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  day: {
    width: "14.28%",
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  dayText: {
    fontSize: 14,
    color: "#222",
  },
  emptyCell: {
    width: "14.28%",
    height: 40,
  },
  singleActive: {
    backgroundColor: "#3E57D0",
    borderRadius: 20,
  },
  rangeStart: {
    backgroundColor: "#3E57D0",
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  rangeEnd: {
    backgroundColor: "#3E57D0",
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  rangeMiddle: {
    backgroundColor: "#3E57D022",
  },
  activeText: {
    color: "#fff",
    fontWeight: "700",
  },
  disabledDay: {
    opacity: 0.3,
  },
  disabledText: {
    color: "#999",
  },
  rangeHint: {
    backgroundColor: "#FFE5E5",
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    alignItems: "center",
  },
  rangeHintText: {
    color: "#FF3B30",
    fontSize: 12,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 16,
  },
  timeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  timeTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222",
  },
  timeHint: {
    fontSize: 11,
    color: "#FF3B30",
    fontStyle: "italic",
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingBottom: 8,
  },
  timeChip: {
    width: "31%",
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: "#F4F6FB",
    alignItems: "center",
    marginBottom: 10,
  },
  timeActive: {
    backgroundColor: "#3E57D0",
  },
  timeDisabled: {
    backgroundColor: "#f0f0f0",
    opacity: 0.5,
  },
  timeText: {
    fontSize: 13,
    color: "#333",
    fontWeight: "500",
  },
  timeTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  timeTextDisabled: {
    color: "#999",
  },
});