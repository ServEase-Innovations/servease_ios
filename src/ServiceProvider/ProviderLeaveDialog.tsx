import React, { useEffect, useState } from "react";
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import dayjs from "dayjs";
import LinearGradient from "react-native-linear-gradient";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import { Text } from "../theme/BrandTypography";
import { BRAND, HOME_HERO_GRADIENT } from "../theme/brandColors";

interface ProviderLeaveDialogProps {
  visible: boolean;
  onClose: () => void;
}

const startOfDay = (date: Date) => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

const formatDate = (date: Date | null) =>
  date ? dayjs(date).format("ddd, D MMM YYYY") : "Select date";

export default function ProviderLeaveDialog({
  visible,
  onClose,
}: ProviderLeaveDialogProps) {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setStartDate(null);
      setEndDate(null);
      setShowStartPicker(false);
      setShowEndPicker(false);
    }
  }, [visible]);

  const today = startOfDay(new Date());
  const leaveDays =
    startDate && endDate
      ? dayjs(startOfDay(endDate)).diff(dayjs(startOfDay(startDate)), "day") + 1
      : 0;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient
          colors={[...HOME_HERO_GRADIENT]}
          style={styles.headerGradient}
        >
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <MaterialIcon
                name="event-busy"
                size={22}
                color={BRAND.accentDark}
              />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Apply for leave</Text>
              <Text style={styles.headerSubtitle}>
                Choose the dates you’ll be unavailable
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close leave form"
            >
              <MaterialIcon name="close" size={22} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.introCard}>
            <View style={styles.introIcon}>
              <MaterialIcon
                name="date-range"
                size={20}
                color={BRAND.accentDark}
              />
            </View>
            <View style={styles.introCopy}>
              <Text style={styles.introTitle}>Plan your time off</Text>
              <Text style={styles.introDescription}>
                Select a start and end date to preview your leave period.
              </Text>
            </View>
          </View>

          <Text style={styles.sectionLabel}>LEAVE DATES</Text>
          <TouchableOpacity
            style={styles.dateField}
            onPress={() => setShowStartPicker(true)}
            activeOpacity={0.75}
          >
            <View style={styles.dateFieldIcon}>
              <MaterialIcon name="login" size={20} color={BRAND.accentDark} />
            </View>
            <View style={styles.dateFieldCopy}>
              <Text style={styles.dateFieldLabel}>First day of leave</Text>
              <Text
                style={[
                  styles.dateFieldValue,
                  !startDate && styles.datePlaceholder,
                ]}
              >
                {formatDate(startDate)}
              </Text>
            </View>
            <MaterialIcon
              name="calendar-today"
              size={20}
              color={BRAND.textMuted}
            />
          </TouchableOpacity>
          {showStartPicker ? (
            <DateTimePicker
              value={startDate ?? today}
              mode="date"
              display="default"
              minimumDate={today}
              maximumDate={endDate ?? undefined}
              onChange={(_, selectedDate) => {
                setShowStartPicker(false);
                if (selectedDate) {
                  const nextStartDate = startOfDay(selectedDate);
                  setStartDate(nextStartDate);
                  if (endDate && startOfDay(endDate) < nextStartDate)
                    setEndDate(null);
                }
              }}
            />
          ) : null}

          <TouchableOpacity
            style={[styles.dateField, !startDate && styles.dateFieldDisabled]}
            onPress={() => startDate && setShowEndPicker(true)}
            activeOpacity={startDate ? 0.75 : 1}
            disabled={!startDate}
          >
            <View style={styles.dateFieldIcon}>
              <MaterialIcon
                name="logout"
                size={20}
                color={startDate ? BRAND.accentDark : BRAND.textMuted}
              />
            </View>
            <View style={styles.dateFieldCopy}>
              <Text style={styles.dateFieldLabel}>Last day of leave</Text>
              <Text
                style={[
                  styles.dateFieldValue,
                  !endDate && styles.datePlaceholder,
                ]}
              >
                {formatDate(endDate)}
              </Text>
            </View>
            <MaterialIcon
              name="calendar-today"
              size={20}
              color={BRAND.textMuted}
            />
          </TouchableOpacity>
          {showEndPicker && startDate ? (
            <DateTimePicker
              value={endDate ?? startDate}
              mode="date"
              display="default"
              minimumDate={startDate}
              onChange={(_, selectedDate) => {
                setShowEndPicker(false);
                if (selectedDate) setEndDate(startOfDay(selectedDate));
              }}
            />
          ) : null}

          {leaveDays > 0 ? (
            <View style={styles.durationCard}>
              <MaterialIcon
                name="schedule"
                size={18}
                color={BRAND.accentDark}
              />
              <Text style={styles.durationText}>
                Selected period:{" "}
                <Text style={styles.durationValue}>
                  {leaveDays} {leaveDays === 1 ? "day" : "days"}
                </Text>
              </Text>
            </View>
          ) : null}

          <View style={styles.notice}>
            <MaterialIcon
              name="info-outline"
              size={20}
              color={BRAND.accentDark}
            />
            <Text style={styles.noticeText}>
              Leave requests aren’t available in the app yet. These dates are
              only a preview and won’t be submitted.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.doneButton}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: BRAND.canvas,
  },
  headerGradient: {
    paddingBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.84)",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 18,
    paddingBottom: 32,
    gap: 12,
  },
  introCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.line,
    marginBottom: 8,
  },
  introIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: BRAND.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  introCopy: {
    flex: 1,
  },
  introTitle: {
    color: BRAND.text,
    fontSize: 15,
    fontWeight: "700",
  },
  introDescription: {
    color: BRAND.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
  sectionLabel: {
    color: BRAND.textMuted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.7,
    marginTop: 4,
  },
  dateField: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.line,
  },
  dateFieldDisabled: {
    opacity: 0.55,
  },
  dateFieldIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: BRAND.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  dateFieldCopy: {
    flex: 1,
  },
  dateFieldLabel: {
    color: BRAND.textMuted,
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  dateFieldValue: {
    color: BRAND.text,
    fontSize: 14,
    fontWeight: "700",
  },
  datePlaceholder: {
    color: BRAND.accentDark,
  },
  durationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: BRAND.accentSoft,
  },
  durationText: {
    color: BRAND.textMuted,
    fontSize: 13,
  },
  durationValue: {
    color: BRAND.accentDark,
    fontWeight: "700",
  },
  notice: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    marginTop: 8,
  },
  noticeText: {
    flex: 1,
    color: "#1e40af",
    fontSize: 12,
    lineHeight: 18,
  },
  doneButton: {
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: BRAND.accentDark,
    marginTop: 4,
  },
  doneButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
