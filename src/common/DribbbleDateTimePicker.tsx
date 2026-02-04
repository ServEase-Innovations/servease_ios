import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
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
  const today = dayjs().startOf("day");

  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  /* ---------- Single ---------- */
  const [selectedDate, setSelectedDate] = useState<Dayjs>(
    mode === "single" && props.value instanceof Date
      ? dayjs(props.value)
      : today
  );

  /* ---------- Range ---------- */
  const rangeValue =
    mode === "range" && props.value && "startDate" in props.value
      ? (props.value as RangeValue)
      : undefined;

  const [rangeStart, setRangeStart] = useState<Dayjs | null>(
    rangeValue?.startDate ? dayjs(rangeValue.startDate) : null
  );

  const [rangeEnd, setRangeEnd] = useState<Dayjs | null>(
    rangeValue?.endDate ? dayjs(rangeValue.endDate) : null
  );

  /* -------------------- Calendar Setup -------------------- */

  const startOfMonth = currentMonth.startOf("month");
  const daysInMonth = currentMonth.daysInMonth();
  const startDay = (startOfMonth.day() + 6) % 7;

  const calendarCells = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  /* -------------------- Helpers -------------------- */

  const isDisabled = (day: number) => {
    const date = currentMonth.date(day);

    // ⛔ Past dates
    if (date.isBefore(today, "day")) return true;

    // ⛔ Range rules
    if (mode === "range" && rangeStart) {
      if (date.isBefore(rangeStart, "day")) return true;
      if (date.diff(rangeStart, "day") > 21) return true;
    }

    return false;
  };

  const isInRange = (day: number) => {
    if (!rangeStart || !rangeEnd) return false;
    const d = currentMonth.date(day);
    return d.isAfter(rangeStart, "day") && d.isBefore(rangeEnd, "day");
  };

  /* -------------------- Handlers -------------------- */

  const selectDate = (day: number) => {
    if (isDisabled(day)) return;

    const date = currentMonth.date(day);

    if (mode === "single") {
      setSelectedDate(date);
      return;
    }

    // Range logic
    if (!rangeStart || rangeEnd) {
      setRangeStart(date);
      setRangeEnd(null);
      return;
    }

    if (date.isSame(rangeStart, "day")) return;

    if (date.diff(rangeStart, "day") <= 21) {
      setRangeEnd(date);
    }
  };

  const selectTime = (time: string) => {
    if (mode === "range" && (!rangeStart || !rangeEnd)) return;

    setSelectedTime(time);

    const [t, meridian] = time.split(" ");
    let hour = Number(t.split(":")[0]);

    if (meridian === "PM" && hour !== 12) hour += 12;
    if (meridian === "AM" && hour === 12) hour = 0;

    if (mode === "single") {
      const finalDate = selectedDate.hour(hour).minute(0).toDate();
      (props as SingleProps).onChange(finalDate);
      return;
    }

    (props as RangeProps).onChange({
      startDate: rangeStart!.hour(hour).minute(0).toDate(),
      endDate: rangeEnd!.hour(hour).minute(0).toDate(),
      time,
    });
  };

  const isTimeDisabled =
    mode === "range" && (!rangeStart || !rangeEnd);

  /* -------------------- Render -------------------- */

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentMonth(m => m.subtract(1, "month"))}>
          <Text style={styles.arrow}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.month}>
          {currentMonth.format("MMMM YYYY")}
        </Text>

        <TouchableOpacity onPress={() => setCurrentMonth(m => m.add(1, "month"))}>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Weekdays */}
      <View style={styles.weekRow}>
        {WEEK_DAYS.map(d => (
          <Text key={d} style={styles.weekDay}>{d}</Text>
        ))}
      </View>

      {/* Calendar */}
      <View style={styles.grid}>
        {calendarCells.map((day, i) => {
          if (!day) return <View key={i} style={styles.emptyCell} />;

          const date = currentMonth.date(day);
          const disabled = isDisabled(day);

          const isStart = rangeStart?.isSame(date, "day");
          const isEnd = rangeEnd?.isSame(date, "day");

          return (
            <TouchableOpacity
              key={i}
              disabled={disabled}
              onPress={() => selectDate(day)}
              style={[
                styles.day,
                isStart && styles.rangeStart,
                isEnd && styles.rangeEnd,
                isInRange(day) && styles.rangeMiddle,
                disabled && styles.disabledDay,
                mode === "single" &&
                  selectedDate.isSame(date, "day") &&
                  styles.singleActive,
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  (isStart || isEnd) && styles.activeText,
                  disabled && styles.disabledText,
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Time */}
      <View style={styles.divider} />
      <Text style={styles.timeTitle}>Select Time</Text>

      <View style={styles.timeGrid}>
        {TIMES.map(time => (
          <TouchableOpacity
            key={time}
            disabled={isTimeDisabled}
            style={[
              styles.timeChip,
              selectedTime === time && styles.timeActive,
              isTimeDisabled && { opacity: 0.4 },
            ]}
            onPress={() => selectTime(time)}
          >
            <Text
              style={[
                styles.timeText,
                selectedTime === time && styles.timeTextActive,
              ]}
            >
              {time}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
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
  maxWidth: 380,   // optional, keeps Dribbble look on tablets
  alignSelf: "center",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  arrow: {
    fontSize: 22,
    color: "#3E57D0",
  },

  month: {
    fontSize: 16,
    fontWeight: "700",
  },

  weekRow: {
    flexDirection: "row",
    // justifyContent: "space-between",
    // marginTop: 12,
  },

  weekDay: {
    flex: 1,
  textAlign: "center",
  color: "#999",

  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 6,
  },

  emptyCell: {
    width: "14.28%",
    height: 36,
  },

  day: {
      flexBasis: "14.2857%", // safer than width
  height: 36,
  justifyContent: "center",
  alignItems: "center",
  },

  dayText: {
    fontSize: 14,
    color: "#222",
  },

  singleActive: {
    backgroundColor: "#3E57D0",
    borderRadius: 18,
  },

  rangeStart: {
    backgroundColor: "#3E57D0",
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },

  rangeEnd: {
    backgroundColor: "#3E57D0",
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
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

  divider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 12,
  },

  timeTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },

  timeGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
},

timeChip: {
  flexBasis: "32%",   // 3 columns with gap
  paddingVertical: 10,
  borderRadius: 20,
  backgroundColor: "#F4F6FB",
  alignItems: "center",
  marginBottom: 10,
},

  timeActive: {
    backgroundColor: "#3E57D0",
  },

  timeText: {
    fontSize: 13,
    color: "#333",
  },

  timeTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
});
