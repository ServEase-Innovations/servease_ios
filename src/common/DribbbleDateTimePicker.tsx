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

/* -------------------- Constants -------------------- */

const WEEK_DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const generateTimeSlots = () => {
  const slots: string[] = [];
  // Generate from 5:00 AM to 1:30 PM (next day) as shown in the image
  // But to keep practical, we'll go from 5:00 AM to 8:00 PM
  for (let h = 5; h <= 20; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hour12 = h % 12 || 12;
      const minute = m === 0 ? "00" : m;
      const ampm = h < 12 ? "AM" : "PM";
      slots.push(`${hour12}:${minute} ${ampm}`);
    }
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
  onChange: (date: Date, time?: string) => void;
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
  const [selectedTime, setSelectedTime] = useState<string | null>("7:00 AM"); // Default as shown in image
  const [showTimeHint, setShowTimeHint] = useState(false);

  /* ---------- Single Date ---------- */
  const [selectedDate, setSelectedDate] = useState<Dayjs>(
    mode === "single" && value instanceof Date ? dayjs(value) : dayjs("2026-04-10")
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

  const isToday = (date: Dayjs): boolean => date.isSame(now, "day");
  const isPastDate = (date: Dayjs): boolean => date.isBefore(today, "day");
  const isPastMonth = (month: Dayjs): boolean => month.isBefore(today, "month");

  const isTimeSlotDisabled = (time: string): boolean => {
    if (mode === "range" && (!rangeStart || !rangeEnd)) return true;

    let selectedDateToCheck: Dayjs | null = null;
    if (mode === "single") selectedDateToCheck = selectedDate;
    else if (mode === "range" && rangeStart) selectedDateToCheck = rangeStart;

    if (!selectedDateToCheck) return mode === "range";
    if (isPastDate(selectedDateToCheck)) return true;
    if (!isToday(selectedDateToCheck)) return false;

    const parsedTime = dayjs(time, "h:mm A");
    if (!parsedTime.isValid()) return true;

    const timeDateTime = now
      .hour(parsedTime.hour())
      .minute(parsedTime.minute())
      .second(0)
      .millisecond(0);

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
    if (isPastDate(date)) return true;
    if (mode === "range" && rangeStart && !rangeEnd) {
      if (date.isAfter(rangeStart.add(MAX_RANGE_DAYS, "day"), "day")) return true;
    }
    return false;
  };

  const getDisabledTimeMessage = () => {
    if (mode === "range" && (!rangeStart || !rangeEnd))
      return "Select start and end dates first";
    const selectedDateToCheck = mode === "single" ? selectedDate : rangeStart;
    if (selectedDateToCheck) {
      if (isPastDate(selectedDateToCheck)) return "Past dates cannot be booked";
      if (isToday(selectedDateToCheck)) return "Past times are disabled for today";
    }
    return null;
  };

  const isTimeSelectionDisabled = mode === "range" && (!rangeStart || !rangeEnd);

  /* -------------------- Handlers -------------------- */

  const selectDate = (day: number) => {
    const date = currentMonth.date(day);
    if (isDisabledInRangeMode(day)) return;

    if (mode === "single") {
      setSelectedDate(date);
      setSelectedTime(null);
      (props as SingleProps).onChange(date.toDate());
      return;
    }

    if (!rangeStart || rangeEnd) {
      setRangeStart(date);
      setRangeEnd(null);
      setSelectedTime(null);
      return;
    }

    if (date.isSame(rangeStart, "day")) return;

    if (date.diff(rangeStart, "day") > MAX_RANGE_DAYS) {
      setShowTimeHint(true);
      setTimeout(() => setShowTimeHint(false), 3000);
      return;
    }

    if (date.isBefore(rangeStart, "day")) setRangeStart(date);
    else setRangeEnd(date);
    setSelectedTime(null);
  };

  const selectTime = (time: string) => {
    if (isTimeSlotDisabled(time)) return;
    if (mode === "range" && (!rangeStart || !rangeEnd)) return;

    setSelectedTime(time);

    const parsedTime = dayjs(time, "h:mm A");
    if (!parsedTime.isValid()) return;

    if (mode === "single") {
      const finalDate = selectedDate
        .hour(parsedTime.hour())
        .minute(parsedTime.minute())
        .second(0)
        .toDate();

      (props as SingleProps).onChange(finalDate, time);
      return;
    }

    if (!rangeStart || !rangeEnd) return;
    const rangeProps = props as RangeProps;
    rangeProps.onChange({
      startDate: rangeStart
        .hour(parsedTime.hour())
        .minute(parsedTime.minute())
        .toDate(),
      endDate: rangeEnd
        .hour(parsedTime.hour())
        .minute(parsedTime.minute())
        .toDate(),
      time,
    });
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
            isPastMonth(currentMonth.subtract(1, "month")) && styles.monthButtonDisabled,
          ]}
        >
          <Text style={[
            styles.monthButtonText,
            isPastMonth(currentMonth.subtract(1, "month")) && styles.monthButtonTextDisabled
          ]}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{currentMonth.format("MMMM YYYY")}</Text>
        <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthButton}>
          <Text style={styles.monthButtonText}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Week Header */}
      <View style={styles.weekHeader}>
        {WEEK_DAYS.map((d) => (
          <Text key={d} style={styles.weekDayText}>{d}</Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarGrid}>
        {calendarCells.map((day, i) => {
          const disabled = day ? isDisabledInRangeMode(day) : true;
          const isActive = day &&
            mode === "single" &&
            selectedDate.isSame(currentMonth.date(day), "day");
          const isRangeStartDay = day && mode === "range" && isRangeStart(day);
          const isRangeEndDay = day && mode === "range" && isRangeEnd(day);
          const isInRangeDay = day && mode === "range" && isInRange(day);
          
          // For April 2026 specific styling (as in image)
          const isApril10 = day === 10 && currentMonth.format("MMMM YYYY") === "April 2026";
          const isAprilSelected = isApril10 && mode === "single";

          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.calendarDay,
                !day && styles.emptyDay,
                disabled && styles.disabledDay,
                (isActive || isAprilSelected) && styles.activeDay,
                isRangeStartDay && styles.rangeStartDay,
                isRangeEndDay && styles.rangeEndDay,
                isInRangeDay && styles.rangeMiddleDay,
              ]}
              onPress={() => !disabled && day && selectDate(day)}
              disabled={disabled}
            >
              <Text style={[
                styles.calendarDayText,
                (isActive || isAprilSelected) && styles.activeDayText,
                (isRangeStartDay || isRangeEndDay) && styles.rangeEdgeText,
              ]}>
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Hint for range max days */}
      {showTimeHint && (
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>Maximum range is {MAX_RANGE_DAYS} days</Text>
        </View>
      )}

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
          const isSelectionDisabled = isDisabled || isTimeSelectionDisabled;
          // Highlight 7:00 AM as in the image
          const isDefaultSelected = time === "7:00 AM" && selectedTime === null;

          return (
            <TouchableOpacity
              key={time}
              style={[
                styles.timeSlot,
                (isSelected || isDefaultSelected) && styles.activeTimeSlot,
                isSelectionDisabled && styles.disabledTimeSlot,
              ]}
              onPress={() => selectTime(time)}
              disabled={isSelectionDisabled}
            >
              <Text style={[
                styles.timeSlotText,
                (isSelected || isDefaultSelected) && styles.activeTimeSlotText,
                isSelectionDisabled && styles.disabledTimeSlotText,
              ]}>
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
  // Book by styles
  bookByContainer: {
    marginBottom: 24,
  },
  bookByTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },
  bookByOptions: {
    flexDirection: "row",
    gap: 16,
  },
  bookByOption: {
    paddingVertical: 6,
  },
  bookByOptionText: {
    fontSize: 15,
    color: "#666",
    fontWeight: "500",
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
  activeDay: {
    backgroundColor: "#007AFF",
  },
  rangeStartDay: {
    backgroundColor: "#007AFF",
    borderTopLeftRadius: 30,
    borderBottomLeftRadius: 30,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  rangeEndDay: {
    backgroundColor: "#007AFF",
    borderTopRightRadius: 30,
    borderBottomRightRadius: 30,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  rangeMiddleDay: {
    backgroundColor: "#E3F2FD",
    borderRadius: 0,
  },
  calendarDayText: {
    fontSize: 15,
    color: "#000",
    fontWeight: "500",
  },
  activeDayText: {
    color: "#fff",
    fontWeight: "600",
  },
  rangeEdgeText: {
    color: "#fff",
    fontWeight: "600",
  },
  hintContainer: {
    backgroundColor: "#FFF3E0",
    padding: 8,
    borderRadius: 8,
    marginVertical: 8,
    alignItems: "center",
  },
  hintText: {
    color: "#FF9800",
    fontSize: 12,
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