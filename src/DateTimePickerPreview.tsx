import React, { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import moment from "moment";
import DribbbleDateTimePicker from "./DribbbleCalendarDateTimePicker";

const DateTimePickerPreview = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <Text style={styles.title}>Select Date & Time</Text>
        <Text style={styles.subtitle}>
          Choose when you want the service
        </Text>

        {/* Picker Card */}
        <View style={styles.card}>
          <DribbbleDateTimePicker
            onSelect={(date, time) => {
              setSelectedDate(date);
              setSelectedTime(time);
            }}
          />
        </View>

        {/* Preview */}
        <View style={styles.preview}>
          <Text style={styles.previewLabel}>Your Selection</Text>

          <Text style={styles.previewValue}>
            {selectedDate
              ? moment(selectedDate).format("dddd, DD MMM YYYY")
              : "No date selected"}
          </Text>

          <Text style={styles.previewValue}>
            {selectedTime || "No time selected"}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F4F6FB",
  },
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginBottom: 24,
  },
  preview: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
  },
  previewLabel: {
    fontSize: 13,
    color: "#888",
    marginBottom: 6,
  },
  previewValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3E57D0",
    marginTop: 4,
  },
});


export default DateTimePickerPreview;
