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

      <View style={styles.weekHeader}>
        {WEEK_DAYS.map((d) => (
          <Text key={d} style={styles.weekDayText}>{d}</Text>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {calendarCells.map((day, i) => {
          const disabled = day ? isDisabledInRangeMode(day) : true;
          const isActive = day &&
            mode === "single" &&
            selectedDate.isSame(currentMonth.date(day), "day");
          const isRangeStartDay = day && mode === "range" && isRangeStart(day);
          const isRangeEndDay = day && mode === "range" && isRangeEnd(day);
          const isInRangeDay = day && mode === "range" && isInRange(day);

          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.calendarDay,
                !day && styles.emptyDay,
                disabled && styles.disabledDay,
                isActive && styles.activeDay,
                isRangeStartDay && styles.rangeStartDay,
                isRangeEndDay && styles.rangeEndDay,
                isInRangeDay && styles.rangeMiddleDay,
              ]}
              onPress={() => !disabled && day && selectDate(day)}
              disabled={disabled}
            >
              <Text style={[
                styles.calendarDayText,
                isActive && styles.activeDayText,
                (isRangeStartDay || isRangeEndDay) && styles.rangeEdgeText,
              ]}>
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {showTimeHint && (
        <View style={styles.hintContainer}>
          <Text style={styles.hintText}>Maximum range is {MAX_RANGE_DAYS} days</Text>
        </View>
      )}

      <View style={styles.divider} />

      <View style={styles.timeHeader}>
        <Text style={styles.timeTitle}>Select Time</Text>
        {getDisabledTimeMessage() && (
          <Text style={styles.timeHint}>{getDisabledTimeMessage()}</Text>
        )}
      </View>

      <ScrollView 
        style={styles.timeGrid}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.timeGridContent}
        nestedScrollEnabled={true}
      >
        {TIMES.map((time) => {
          const isDisabled = isTimeSlotDisabled(time);
          const isSelected = selectedTime === time;
          const isSelectionDisabled = isDisabled || isTimeSelectionDisabled;

          return (
            <TouchableOpacity
              key={time}
              style={[
                styles.timeSlot,
                isSelected && styles.activeTimeSlot,
                isSelectionDisabled && styles.disabledTimeSlot,
              ]}
              onPress={() => selectTime(time)}
              disabled={isSelectionDisabled}
            >
              <Text style={[
                styles.timeSlotText,
                isSelected && styles.activeTimeSlotText,
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
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
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
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  weekHeader: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
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
    borderWidth: 1,
    borderColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  emptyDay: {
    backgroundColor: "#fafafa",
  },
  disabledDay: {
    backgroundColor: "#f5f5f5",
    opacity: 0.5,
  },
  activeDay: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  rangeStartDay: {
    backgroundColor: "#007AFF",
    borderTopLeftRadius: 20,
    borderBottomLeftRadius: 20,
  },
  rangeEndDay: {
    backgroundColor: "#007AFF",
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
  },
  rangeMiddleDay: {
    backgroundColor: "#E3F2FD",
  },
  calendarDayText: {
    fontSize: 16,
    color: "#333",
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
    backgroundColor: "#e0e0e0",
    marginVertical: 16,
  },
  timeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  timeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  timeHint: {
    fontSize: 12,
    color: "#FF9800",
  },
  timeGrid: {
    maxHeight: 200,
  },
  timeGridContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingBottom: 8,
  },
  timeSlot: {
    width: "30%",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 4,
    marginHorizontal: "1.5%",
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  activeTimeSlot: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  disabledTimeSlot: {
    backgroundColor: "#fafafa",
    opacity: 0.5,
  },
  timeSlotText: {
    fontSize: 14,
    color: "#333",
  },
  activeTimeSlotText: {
    color: "#fff",
    fontWeight: "600",
  },
  disabledTimeSlotText: {
    color: "#999",
  },
});