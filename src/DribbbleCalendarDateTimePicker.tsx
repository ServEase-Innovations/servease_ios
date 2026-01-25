import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import moment from "moment";



const generateTimeSlots = (
  startHour = 5,
  endHour = 20,
  intervalMinutes = 60
) => {
  const slots: string[] = [];

  for (let hour = startHour; hour <= endHour; hour++) {
    for (let min = 0; min < 60; min += intervalMinutes) {
      const h = hour % 12 || 12;
      const period = hour < 12 ? "AM" : "PM";

      slots.push(
        `${h.toString().padStart(2, "0")}:${min
          .toString()
          .padStart(2, "0")} ${period}`
      );
    }
  }

  return slots;
};

const WEEK_DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
const TIMES = generateTimeSlots(5, 20); // 5 AM → 8 PM





const DribbbleCalendarDateTimePicker = ({ onChange }) => {
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [selectedDate, setSelectedDate] = useState(moment());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const startOfMonth = currentMonth.clone().startOf("month");
  const endOfMonth = currentMonth.clone().endOf("month");

  const startDay = startOfMonth.isoWeekday(); // 1–7
  const daysInMonth = currentMonth.daysInMonth();

  const calendarCells = [];
  for (let i = 1; i < startDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  const changeMonth = (dir: number) =>
    setCurrentMonth(currentMonth.clone().add(dir, "month"));

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => changeMonth(-1)}>
          <Text style={styles.navArrow}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.monthTitle}>
          {currentMonth.format("MMMM YYYY")}
        </Text>

        <TouchableOpacity onPress={() => changeMonth(1)}>
          <Text style={styles.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Week Days */}
      <View style={styles.weekRow}>
        {WEEK_DAYS.map((d) => (
          <Text key={d} style={styles.weekDay}>
            {d}
          </Text>
        ))}
      </View>

      {/* Calendar Grid */}
      <View style={styles.grid}>
        {calendarCells.map((day, index) => {
          const isSelected =
            day &&
            selectedDate.isSame(
              currentMonth.clone().date(day),
              "day"
            );

          return (
            <TouchableOpacity
              key={index}
              disabled={!day}
              onPress={() =>
                setSelectedDate(currentMonth.clone().date(day))
              }
              style={[
                styles.dayCell,
                isSelected && styles.daySelected,
              ]}
            >
              <Text
                style={[
                  styles.dayText,
                  isSelected && styles.dayTextSelected,
                ]}
              >
                {day || ""}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Time Selector */}
      <Text style={styles.timeTitle}>Select Time</Text>

      <View style={styles.timeGrid}>
        {TIMES.map((time) => {
          const active = time === selectedTime;
          return (
            <TouchableOpacity
              key={time}
              onPress={() => {
                setSelectedTime(time);
                onChange?.(
                  selectedDate.toDate(),
                  time
                );
              }}
              style={[
                styles.timeChip,
                active && styles.timeChipActive,
              ]}
            >
              <Text
                style={[
                  styles.timeText,
                  active && styles.timeTextActive,
                ]}
              >
                {time}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  monthTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
  },

  navArrow: {
    fontSize: 22,
    color: "#3E57D0",
    paddingHorizontal: 8,
  },

  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  weekDay: {
    width: "14.28%",
    textAlign: "center",
    fontSize: 12,
    color: "#888",
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  dayCell: {
    width: "14.28%",
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 4,
  },

  daySelected: {
    backgroundColor: "#3E57D0",
    borderRadius: 30,
  },

  dayText: {
    fontSize: 14,
    color: "#222",
  },

  dayTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },

  divider: {
    height: 1,
    backgroundColor: "#EEE",
    marginVertical: 12,
  },

  timeTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#333",
  },

  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  timeChip: {
    width: "30%",
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F4F6FB",
    alignItems: "center",
    marginBottom: 10,
  },

  timeChipActive: {
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


export default DribbbleCalendarDateTimePicker;
