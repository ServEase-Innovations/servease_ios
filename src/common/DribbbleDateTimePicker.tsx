import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import dayjs, { Dayjs } from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

/* -------------------- Constants -------------------- */

const WEEK_DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

/** Bookable start times: 6:00 AM – 7:00 PM (service must end by 8:00 PM). */
const generateTimeSlots = () => {
  const slots: string[] = [];
  for (let h = 6; h <= 19; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 19 && m > 0) continue;
      const hour12 = h % 12 || 12;
      const minute = String(m).padStart(2, "0");
      const ampm = h < 12 ? "AM" : "PM";
      slots.push(`${hour12}:${minute} ${ampm}`);
    }
  }
  return slots;
};

const ALL_TIMES = generateTimeSlots();
const DEFAULT_MAX_RANGE_DAYS = 21;

function calendarDayFromDate(d: Date): Dayjs {
  return dayjs(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0, 0));
}

function parseTimeLabel(time: string): { hour: number; minute: number } {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return { hour: 0, minute: 0 };
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const ampm = match[3].toUpperCase();
  if (ampm === "PM" && hour !== 12) hour += 12;
  if (ampm === "AM" && hour === 12) hour = 0;
  return { hour, minute };
}

function timeLabelToMinutes(time: string): number {
  const { hour, minute } = parseTimeLabel(time);
  return hour * 60 + minute;
}

const getAvailableTimes = (date: Dayjs | null): string[] => {
  if (!date) return [];
  const now = dayjs();
  const isToday = date.isSame(now, "day");

  if (!isToday) {
    return ALL_TIMES;
  }

  const cutoffMinutes = now.hour() * 60 + now.minute() + 30;
  return ALL_TIMES.filter((time) => timeLabelToMinutes(time) > cutoffMinutes);
};

const getTimesUpToNoon = (times: string[]): string[] =>
  times.filter((time) => timeLabelToMinutes(time) <= 12 * 60);

/* -------------------- Types -------------------- */

type RangeValue = {
  startDate?: Date;
  endDate?: Date;
  time?: string;
};

type SingleModeProps = {
  mode?: "single";
  value?: Date;
  maxDate?: Date;
  hideTimeSelection?: boolean;
  onDateChange?: (date: Date) => void;
  onChange: (date: Date, time?: string) => void;
};

type RangeModeProps = {
  mode: "range";
  value?: RangeValue;
  maxRangeDays?: number;
  minRangeDays?: number;
  minDate?: Date;
  maxDate?: Date;
  hideTimeSelection?: boolean;
  onDateChange?: (payload: { startDate: Date; endDate?: Date }) => void;
  onChange: (range: { startDate: Date; endDate: Date; time?: string }) => void;
};

type Props = (SingleModeProps | RangeModeProps) & {
  compact?: boolean;
};

/* -------------------- Component -------------------- */

export default function DribbbleDateTimePicker(props: Props) {
  const compact = props.compact ?? false;
  const mode = props.mode ?? "single";
  const value = props.value;
  const singleMaxDate = props.mode === "single" ? props.maxDate : undefined;
  const rangeProps = props.mode === "range" ? (props as RangeModeProps) : null;
  const singleProps = props.mode !== "range" ? (props as SingleModeProps) : null;
  const hideTimeSelection =
    rangeProps?.hideTimeSelection ?? singleProps?.hideTimeSelection ?? false;

  const today = useMemo(() => dayjs().startOf("day"), []);
  const rangeMinDate = rangeProps?.minDate
    ? calendarDayFromDate(rangeProps.minDate).startOf("day")
    : null;
  const rangeMaxDate = rangeProps?.maxDate
    ? calendarDayFromDate(rangeProps.maxDate).startOf("day")
    : null;
  const effectiveRangeMin =
    rangeMinDate ?? (mode === "range" && hideTimeSelection ? today : null);
  const minRangeDays = Math.max(1, rangeProps?.minRangeDays ?? 1);
  const minRangeDaysInclusive = minRangeDays;
  const maxRangeDays =
    rangeProps?.maxRangeDays != null
      ? Math.max(1, rangeProps.maxRangeDays)
      : hideTimeSelection
        ? undefined
        : DEFAULT_MAX_RANGE_DAYS;
  const maxRangeDaysInclusive = maxRangeDays != null ? maxRangeDays + 1 : undefined;

  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [showTimeHint, setShowTimeHint] = useState(false);
  const [showAllTimes, setShowAllTimes] = useState(false);
  const [, setSlotRefreshTick] = useState(0);

  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => {
    if (mode === "single" && value instanceof Date) {
      return calendarDayFromDate(value);
    }
    return dayjs();
  });

  const rangeValue =
    mode === "range" && value && typeof value === "object" && "startDate" in value
      ? value
      : undefined;

  const [rangeStart, setRangeStart] = useState<Dayjs | null>(() =>
    rangeValue?.startDate ? calendarDayFromDate(rangeValue.startDate) : null
  );
  const [rangeEnd, setRangeEnd] = useState<Dayjs | null>(() =>
    rangeValue?.endDate ? calendarDayFromDate(rangeValue.endDate) : null
  );

  const formatTimeSlot = useCallback((d: Dayjs): string | null => {
    const hour = d.hour();
    const minute = d.minute();
    return (
      ALL_TIMES.find((slot) => {
        const parsed = parseTimeLabel(slot);
        return parsed.hour === hour && parsed.minute === minute;
      }) ?? null
    );
  }, []);

  const valueRef = useRef(value);
  valueRef.current = value;

  const singleValueTs =
    mode === "single" && value instanceof Date ? value.getTime() : null;
  const rangeStartTs =
    mode === "range" && value && typeof value === "object" && "startDate" in value
      ? (value as RangeValue).startDate?.getTime() ?? null
      : null;
  const rangeEndTs =
    mode === "range" && value && typeof value === "object" && "startDate" in value
      ? (value as RangeValue).endDate?.getTime() ?? null
      : null;
  const rangeTimeLabel =
    mode === "range" && value && typeof value === "object" && "startDate" in value
      ? String((value as RangeValue).time ?? "").trim()
      : "";

  const externalValueKey = useMemo(() => {
    if (mode === "single") {
      return singleValueTs != null ? `single:${singleValueTs}` : "single:";
    }
    if (mode === "range") {
      return `range:${rangeStartTs ?? "none"}|${rangeEndTs ?? "none"}|${rangeTimeLabel}`;
    }
    return `${mode}:empty`;
  }, [mode, singleValueTs, rangeStartTs, rangeEndTs, rangeTimeLabel]);

  useEffect(() => {
    const currentValue = valueRef.current;

    if (mode === "single" && currentValue instanceof Date) {
      const full = dayjs(currentValue);
      const dayAnchor = calendarDayFromDate(currentValue);
      setSelectedDate((prev) => (prev.isSame(dayAnchor, "day") ? prev : dayAnchor));
      const nextTime = formatTimeSlot(full);
      if (nextTime) {
        setSelectedTime((prev) => (prev === nextTime ? prev : nextTime));
      }
      return;
    }

    if (
      mode === "range" &&
      currentValue &&
      typeof currentValue === "object" &&
      "startDate" in currentValue
    ) {
      const rv = currentValue as RangeValue;
      if (rv.startDate) {
        const nextStart = calendarDayFromDate(rv.startDate).startOf("day");
        setRangeStart((prev) => (prev?.isSame(nextStart, "day") ? prev : nextStart));
      } else {
        setRangeStart((prev) => (prev === null ? prev : null));
      }
      if (rv.endDate) {
        const nextEnd = calendarDayFromDate(rv.endDate).startOf("day");
        setRangeEnd((prev) => (prev?.isSame(nextEnd, "day") ? prev : nextEnd));
      } else {
        setRangeEnd((prev) => (prev === null ? prev : null));
      }
      if (rv.startDate && rv.endDate) {
        const explicitTime = String(rv.time ?? "").trim();
        const nextTime =
          (explicitTime && ALL_TIMES.includes(explicitTime) ? explicitTime : null) ??
          formatTimeSlot(dayjs(rv.startDate));
        setSelectedTime((prev) => (prev === nextTime ? prev : nextTime));
      }
    }
  }, [mode, externalValueKey, formatTimeSlot]);

  useEffect(() => {
    const id = setInterval(() => setSlotRefreshTick((tick) => tick + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const startOfMonth = currentMonth.startOf("month");
  const daysInMonth = currentMonth.daysInMonth();
  const startDay = (startOfMonth.day() + 6) % 7;

  const calendarCells = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const activeDate = useMemo(() => {
    if (mode === "single") return selectedDate;
    if (mode === "range" && rangeStart) return rangeStart;
    return null;
  }, [mode, selectedDate, rangeStart]);

  const isActiveDateToday = activeDate ? activeDate.isSame(dayjs(), "day") : false;
  const availableTimes = getAvailableTimes(activeDate);
  const hasAvailableTimes = availableTimes.length > 0;
  const todayHasNoSlots = getAvailableTimes(today).length === 0;

  const sortTimeLabels = (times: string[]) =>
    [...times].sort((a, b) => timeLabelToMinutes(a) - timeLabelToMinutes(b));

  const displayedTimes = useMemo(() => {
    if (!hasAvailableTimes) return [];
    let times: string[];
    if (showAllTimes) {
      times = availableTimes;
    } else if (isActiveDateToday) {
      times = availableTimes.slice(0, 6);
    } else {
      times = getTimesUpToNoon(availableTimes);
    }

    if (
      selectedTime &&
      availableTimes.includes(selectedTime) &&
      !times.includes(selectedTime)
    ) {
      times = sortTimeLabels([...times, selectedTime]);
    }

    return times;
  }, [availableTimes, showAllTimes, hasAvailableTimes, isActiveDateToday, selectedTime]);

  const canExpand = useMemo(() => {
    if (!hasAvailableTimes) return false;
    if (isActiveDateToday) {
      return availableTimes.length > 6;
    }
    const timesUpToNoon = getTimesUpToNoon(availableTimes);
    return availableTimes.length > timesUpToNoon.length;
  }, [availableTimes, hasAvailableTimes, isActiveDateToday]);

  const isTodayDate = (date: Dayjs | null): boolean =>
    date ? date.isSame(dayjs(), "day") : false;

  const isPastDate = (date: Dayjs): boolean => date.isBefore(today, "day");
  const isPastMonth = (month: Dayjs): boolean => month.isBefore(today, "month");

  const isTimeSlotDisabled = (time: string): boolean => {
    if (mode === "range" && (!rangeStart || !rangeEnd)) return true;
    return !availableTimes.includes(time);
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
    const date = currentMonth.date(day).startOf("day");
    if (mode === "single" && isPastDate(date)) return true;
    if (mode === "range" && !hideTimeSelection && isPastDate(date)) return true;
    if (mode === "range" && !hideTimeSelection && date.isSame(today, "day") && todayHasNoSlots) {
      return true;
    }

    if (effectiveRangeMin && date.isBefore(effectiveRangeMin, "day")) return true;
    if (hideTimeSelection && rangeMaxDate && date.isAfter(rangeMaxDate, "day")) return true;

    if (mode === "single" && singleMaxDate) {
      if (date.isAfter(calendarDayFromDate(singleMaxDate), "day")) return true;
    }

    if (mode === "range" && !rangeStart) {
      if (rangeMaxDate && date.isAfter(rangeMaxDate, "day")) return true;
    }

    if (mode === "range" && rangeStart && !rangeEnd) {
      const earliestEnd = rangeStart.add(minRangeDays - 1, "day");
      if (date.isBefore(earliestEnd, "day")) return true;
      if (rangeMaxDate && date.isAfter(rangeMaxDate, "day")) return true;
      if (maxRangeDays != null && date.isAfter(rangeStart.add(maxRangeDays, "day"), "day")) {
        return true;
      }
    }
    return false;
  };

  const getTimeSectionMessage = () => {
    if (mode === "range") {
      if (hideTimeSelection) {
        if (!rangeStart) {
          return `Step 1: Tap your first vacation day (minimum ${minRangeDaysInclusive} days)`;
        }
        if (!rangeEnd) {
          const earliest = rangeStart.add(minRangeDays - 1, "day");
          return `Step 2: Tap your last day — earliest valid end is ${earliest.format("MMM D")}`;
        }
        return null;
      }
      if (!rangeStart) return "Step 1: Tap your first service day on the calendar";
      if (!rangeEnd) {
        return `Step 2: Tap your last day (up to ${maxRangeDaysInclusive} days from the first)`;
      }
      if (!selectedTime) {
        return "Step 3: Choose the daily start time (same time applies on each day)";
      }
      return null;
    }
    if (!activeDate) return "Select a date first";
    if (isPastDate(activeDate)) return "Past dates cannot be booked";
    if (!hasAvailableTimes) return "No time slots available for today. Please select another date.";
    if (isTodayDate(activeDate)) return "Only upcoming time slots are available today";
    return null;
  };

  const isTimeSelectionDisabled = mode === "range" && (!rangeStart || !rangeEnd);

  const flashRangeHint = () => {
    setShowTimeHint(true);
    setTimeout(() => setShowTimeHint(false), 3000);
  };

  const selectDate = (day: number) => {
    const date = currentMonth.date(day).startOf("day");
    if (isDisabledInRangeMode(day)) return;
    if (!hideTimeSelection && date.isSame(today, "day") && todayHasNoSlots) return;

    if (mode === "single") {
      if (singleMaxDate && date.isAfter(dayjs(singleMaxDate), "day")) {
        flashRangeHint();
        return;
      }
      setSelectedDate(date);
      setSelectedTime(null);
      setShowAllTimes(false);
      (props as SingleModeProps).onDateChange?.(date.toDate());
      return;
    }

    const activeRangeProps = props as RangeModeProps;
    if (!rangeStart || rangeEnd) {
      setRangeStart(date);
      setRangeEnd(null);
      setSelectedTime(null);
      setShowAllTimes(false);
      activeRangeProps.onDateChange?.({ startDate: date.toDate() });
      return;
    }

    if (date.isSame(rangeStart, "day")) return;

    const spanDays = date.diff(rangeStart, "day") + 1;
    if (spanDays < minRangeDays) {
      flashRangeHint();
      return;
    }

    if (maxRangeDays != null && date.diff(rangeStart, "day") > maxRangeDays) {
      flashRangeHint();
      return;
    }

    if (date.isBefore(rangeStart, "day")) {
      setRangeStart(date);
      setRangeEnd(null);
      activeRangeProps.onDateChange?.({ startDate: date.toDate() });
    } else {
      setRangeEnd(date);
      const payload = {
        startDate: rangeStart.toDate(),
        endDate: date.toDate(),
      };
      activeRangeProps.onDateChange?.(payload);
      if (hideTimeSelection) {
        activeRangeProps.onChange(payload);
      }
    }
    setSelectedTime(null);
    setShowAllTimes(false);
  };

  const selectTime = (time: string) => {
    if (isTimeSlotDisabled(time)) return;
    if (mode === "range" && (!rangeStart || !rangeEnd)) return;

    setSelectedTime(time);
    const { hour, minute } = parseTimeLabel(time);

    if (mode === "single") {
      const finalDate = selectedDate
        .hour(hour)
        .minute(minute)
        .second(0)
        .millisecond(0)
        .toDate();
      (props as SingleModeProps).onChange(finalDate, time);
      return;
    }

    if (!rangeStart || !rangeEnd) return;
    (props as RangeModeProps).onChange({
      startDate: rangeStart.hour(hour).minute(minute).second(0).millisecond(0).toDate(),
      endDate: rangeEnd.hour(hour).minute(minute).second(0).millisecond(0).toDate(),
      time,
    });
  };

  const changeMonth = (increment: number) => {
    const newMonth = currentMonth.add(increment, "month");
    if (increment === -1 && isPastMonth(newMonth)) return;
    setCurrentMonth(newMonth);
  };

  const renderTimeChip = (time: string, isDisabled: boolean) => {
    const isSelected = selectedTime === time;

    return (
      <TouchableOpacity
        key={time}
        style={[
          styles.timeSlot,
          isSelected && styles.activeTimeSlot,
          (isDisabled || isTimeSelectionDisabled) && styles.disabledTimeSlot,
        ]}
        onPress={() => selectTime(time)}
        disabled={isDisabled || isTimeSelectionDisabled}
        activeOpacity={isDisabled || isTimeSelectionDisabled ? 1 : 0.7}
      >
        <Text
          style={[
            styles.timeSlotText,
            isSelected && styles.activeTimeSlotText,
            (isDisabled || isTimeSelectionDisabled) && styles.disabledTimeSlotText,
          ]}
        >
          {time}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <View style={styles.bookByContainer}>
        <Text style={styles.bookByTitle}>Book by</Text>
      </View>

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => changeMonth(-1)}
          disabled={isPastMonth(currentMonth.subtract(1, "month"))}
          style={[
            styles.monthButton,
            isPastMonth(currentMonth.subtract(1, "month")) && styles.monthButtonDisabled,
          ]}
        >
          <Text
            style={[
              styles.monthButtonText,
              isPastMonth(currentMonth.subtract(1, "month")) && styles.monthButtonTextDisabled,
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

      <View style={styles.weekHeader}>
        {WEEK_DAYS.map((d) => (
          <Text key={d} style={styles.weekDayText}>
            {d}
          </Text>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {calendarCells.map((day, i) => {
          const disabled = day ? isDisabledInRangeMode(day) : true;
          const isSelected =
            mode === "single" && day && selectedDate.isSame(currentMonth.date(day), "day");
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

      {!hideTimeSelection && todayHasNoSlots && currentMonth.isSame(today, "month") && (
        <View style={styles.dayUnavailableHint}>
          <Text style={styles.dayUnavailableHintText}>
            Today has no remaining time slots. Please select a future date.
          </Text>
        </View>
      )}

      {showTimeHint && (
        <View style={styles.rangeHint}>
          <Text style={styles.rangeHintText}>
            {hideTimeSelection
              ? `Vacation must be at least ${minRangeDaysInclusive} days. Pick a later end date.`
              : `Short-term bookings are limited to ${maxRangeDaysInclusive} days. Pick an end date within that window.`}
          </Text>
        </View>
      )}

      {mode === "range" && rangeStart && rangeEnd && (
        <View style={styles.rangeSummary}>
          <Text style={styles.rangeSummaryText}>
            {rangeStart.format("MMM D")} – {rangeEnd.format("MMM D, YYYY")} ·{" "}
            {rangeEnd.diff(rangeStart, "day") + 1} day
            {rangeEnd.diff(rangeStart, "day") + 1 === 1 ? "" : "s"}
          </Text>
        </View>
      )}

      {!hideTimeSelection && (
        <>
          <View style={styles.divider} />

          <View style={styles.timeHeader}>
            <View style={styles.timeHeaderTextWrap}>
              <Text style={styles.timeTitle}>
                {mode === "range" && (!rangeStart || !rangeEnd) ? "Time (after dates)" : "Select Time"}
              </Text>
              {getTimeSectionMessage() && (
                <Text style={styles.timeHint}>{getTimeSectionMessage()}</Text>
              )}
            </View>
            {hasAvailableTimes && !isTimeSelectionDisabled && (
              <View style={styles.availableCountPill}>
                <Text style={styles.availableCountText}>{availableTimes.length} available</Text>
              </View>
            )}
          </View>

          {hasAvailableTimes ? (
            <>
              <View style={styles.timeGridContent}>
                {displayedTimes.map((time) => renderTimeChip(time, isTimeSlotDisabled(time)))}
              </View>

              {canExpand && (
                <TouchableOpacity
                  style={styles.expandButton}
                  onPress={() => setShowAllTimes((prev) => !prev)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.expandButtonText}>
                    {showAllTimes ? "Less time ▲" : "More time ▼"}
                  </Text>
                </TouchableOpacity>
              )}

              {activeDate && isTodayDate(activeDate) && (
                <Text style={styles.helperNote}>Past times are hidden. Showing available slots.</Text>
              )}
            </>
          ) : (
            <View style={styles.emptyTimesBox}>
              <Text style={styles.emptyTimesTitle}>
                {getTimeSectionMessage() || "No time slots available"}
              </Text>
            </View>
          )}
        </>
      )}
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
  cardCompact: {
    padding: 14,
    borderRadius: 16,
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
  dayUnavailableHint: {
    backgroundColor: "#FFF8E8",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  dayUnavailableHintText: {
    fontSize: 12,
    color: "#9A6700",
    textAlign: "center",
  },
  rangeHint: {
    backgroundColor: "#E3F2FD",
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  rangeHintText: {
    fontSize: 12,
    color: "#007AFF",
    fontWeight: "500",
    textAlign: "center",
  },
  rangeSummary: {
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
    marginBottom: 4,
  },
  rangeSummaryText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "600",
    textAlign: "center",
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
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 8,
  },
  timeHeaderTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  timeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
  timeHint: {
    fontSize: 12,
    color: "#FF9800",
    marginTop: 4,
  },
  availableCountPill: {
    backgroundColor: "#E8F1FF",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  availableCountText: {
    fontSize: 11,
    color: "#007AFF",
    fontWeight: "600",
  },
  emptyTimesBox: {
    backgroundColor: "#FFF8E8",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFE2A8",
    padding: 12,
    marginBottom: 8,
  },
  emptyTimesTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#9A6700",
    textAlign: "center",
  },
  helperNote: {
    marginTop: 8,
    fontSize: 11,
    color: "#64748B",
    textAlign: "center",
  },
  timeGridContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 8,
  },
  expandButton: {
    marginTop: 10,
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#E8F1FF",
    borderWidth: 1,
    borderColor: "#B9D6FF",
  },
  expandButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#007AFF",
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
    minHeight: 40,
    justifyContent: "center",
  },
  activeTimeSlot: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  disabledTimeSlot: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
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
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },
});
