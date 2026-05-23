/* eslint-disable */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import dayjs, { Dayjs } from "dayjs";
import DateTimePicker from "@react-native-community/datetimepicker";
import Icon from "react-native-vector-icons/MaterialIcons";
import { update } from "../features/bookingTypeSlice";

const DURATION_OPTIONS = [1, 2, 3, 4, 5, 6];

function parseTimeOnDate(dateStr: string | undefined, timeStr: string | undefined): Dayjs | null {
  if (!dateStr || !timeStr) return null;
  const base = dayjs(dateStr.split("T")[0]);
  const [h, m] = timeStr.split(":").map(Number);
  if (!Number.isFinite(h)) return null;
  return base.hour(h).minute(Number.isFinite(m) ? m : 0);
}

function defaultOnDemandStart(): Dayjs {
  const now = dayjs();
  let adjusted = now.add(30, "minute");
  if (adjusted.hour() < 5) adjusted = adjusted.hour(5).minute(0);
  else if (adjusted.hour() >= 22) adjusted = adjusted.hour(21).minute(55);
  return adjusted;
}

function buildReduxBookingPatch(
  preference: string,
  startDate: Dayjs | null,
  endDate: Dayjs | null,
  startTime: Dayjs | null,
  endTime: Dayjs | null,
  existing: Record<string, unknown> | null
) {
  const startIso = startDate?.toISOString() ?? startTime?.toISOString() ?? "";
  const endIso =
    endDate?.toISOString() ??
    (preference === "Monthly" && startDate
      ? startDate.add(1, "month").toISOString()
      : startIso);

  let timeRange = "";
  let timeSlot = "";
  if (preference === "Date") {
    timeRange = `${startTime?.format("HH:mm") || ""}-${endTime?.format("HH:mm") || ""}`;
    timeSlot = timeRange;
  } else if (preference === "Short term") {
    timeRange = startTime?.format("HH:mm") || "";
    timeSlot = `${startTime?.format("HH:mm") || ""}-${endTime?.format("HH:mm") || ""}`;
  } else {
    timeRange = startTime?.format("HH:mm") || "";
    timeSlot = startTime?.format("HH:mm") || "";
  }

  return {
    ...(existing ?? {}),
    startDate: startIso ? startIso.split("T")[0] : "",
    endDate: endIso ? endIso.split("T")[0] : "",
    timeRange,
    bookingPreference: preference,
    startTime: startTime?.format("HH:mm") || "",
    endTime: endTime?.format("HH:mm") || "",
    timeSlot,
  };
}

interface MaidBookingDetailsSectionProps {
  active: boolean;
}

const MaidBookingDetailsSection: React.FC<MaidBookingDetailsSectionProps> = ({ active }) => {
  const dispatch = useDispatch();
  const rawBooking = useSelector(
    (state: { bookingType?: { value?: Record<string, unknown> } }) =>
      state.bookingType?.value ?? null
  );

  const preference = String(rawBooking?.bookingPreference ?? "Date");
  const today = dayjs();
  const maxDate21Days = today.add(21, "day");
  const maxDate90Days = today.add(89, "day");

  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const [startTime, setStartTime] = useState<Dayjs | null>(null);
  const [endTime, setEndTime] = useState<Dayjs | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [validationMsg, setValidationMsg] = useState<string | null>(null);
  const [pickerMode, setPickerMode] = useState<"date" | "time" | null>(null);

  const hydrateFromRedux = useCallback(() => {
    const pref = String(rawBooking?.bookingPreference ?? "Date");
    const dateStr =
      rawBooking?.startDate != null
        ? String(rawBooking.startDate).split("T")[0]
        : dayjs().format("YYYY-MM-DD");

    let sd = rawBooking?.startDate ? dayjs(dateStr) : null;
    let ed = rawBooking?.endDate ? dayjs(String(rawBooking.endDate).split("T")[0]) : null;

    let st =
      parseTimeOnDate(dateStr, String(rawBooking?.startTime ?? "")) ??
      (sd ? sd.hour(9).minute(0) : null);
    let et =
      parseTimeOnDate(dateStr, String(rawBooking?.endTime ?? "")) ??
      (st ? st.add(1, "hour") : null);

    const timeRange = String(rawBooking?.timeRange ?? "");
    if ((!st || !et) && timeRange.includes("-")) {
      const [startPart, endPart] = timeRange.split("-").map((s) => s.trim());
      st = st ?? parseTimeOnDate(dateStr, startPart);
      et = et ?? parseTimeOnDate(dateStr, endPart);
    }

    if (pref === "Date" && (!st || !et)) {
      const adjusted = defaultOnDemandStart();
      st = adjusted;
      et = adjusted.add(1, "hour");
      sd = adjusted;
      ed = et;
    }

    setStartDate(sd);
    setEndDate(ed ?? sd);
    setStartTime(st);
    setEndTime(et);
    setValidationMsg(null);
  }, [rawBooking]);

  useEffect(() => {
    if (active) {
      hydrateFromRedux();
      setScheduleOpen(false);
      setPickerMode(null);
    }
  }, [active, hydrateFromRedux]);

  const persist = useCallback(
    (
      nextStartDate: Dayjs | null,
      nextEndDate: Dayjs | null,
      nextStartTime: Dayjs | null,
      nextEndTime: Dayjs | null
    ) => {
      dispatch(
        update(
          buildReduxBookingPatch(
            preference,
            nextStartDate,
            nextEndDate,
            nextStartTime,
            nextEndTime,
            rawBooking
          )
        )
      );
      setValidationMsg(null);
    },
    [rawBooking, dispatch, preference]
  );

  useEffect(() => {
    if (!active || !startTime || !endTime) return;
    const reduxStart = String(rawBooking?.startTime ?? "");
    const reduxEnd = String(rawBooking?.endTime ?? "");
    if (reduxStart && reduxEnd) return;
    persist(startDate, endDate, startTime, endTime);
  }, [active, rawBooking, startDate, endDate, startTime, endTime, persist]);

  const planLabel = useMemo(() => {
    const pref = preference.toLowerCase();
    if (pref === "date") return "On-demand";
    if (pref === "short term") return "Short-term";
    return "Monthly";
  }, [preference]);

  const durationHours =
    startTime && endTime ? Math.max(1, endTime.diff(startTime, "hour")) : 1;

  const setDurationHours = (hours: number) => {
    if (!startTime) return;
    const newEnd = startTime.add(hours, "hour");
    if (newEnd.hour() >= 22) {
      setValidationMsg("End time must be before 10 PM");
      return;
    }
    setEndTime(newEnd);
    if (preference === "Date") setEndDate(newEnd);
    persist(startDate, preference === "Date" ? newEnd : endDate, startTime, newEnd);
  };

  const applyStartDateTime = (selected: Dayjs) => {
    const now = dayjs();
    let adjusted = selected;
    if (selected.isSame(now, "day")) {
      const nowPlus30 = now.add(30, "minute");
      if (adjusted.isBefore(nowPlus30)) adjusted = nowPlus30;
      if (adjusted.hour() < 5) adjusted = adjusted.hour(5).minute(0);
      else if (adjusted.hour() >= 22) adjusted = adjusted.hour(21).minute(55);
    } else if (adjusted.hour() === 0 && adjusted.minute() === 0) {
      adjusted = adjusted.hour(5).minute(0);
    }

    const nextEnd = adjusted.add(durationHours, "hour");
    const monthlyEnd = adjusted.add(1, "month");
    setStartDate(adjusted);
    setStartTime(adjusted);
    setEndTime(nextEnd);
    if (preference === "Date") setEndDate(nextEnd);
    if (preference === "Monthly") setEndDate(monthlyEnd);
    persist(
      adjusted,
      preference === "Monthly" ? monthlyEnd : preference === "Date" ? nextEnd : endDate,
      adjusted,
      nextEnd
    );
  };

  const validateSelection = (selected: Dayjs): boolean => {
    const now = dayjs();
    if (selected.isBefore(now.add(30, "minute"))) {
      setValidationMsg("Please pick a time at least 30 minutes from now");
      return false;
    }
    if (selected.hour() < 5 || selected.hour() > 21) {
      setValidationMsg("Service hours are 5 AM – 10 PM");
      return false;
    }
    if (preference === "Date" && selected.isAfter(maxDate21Days)) {
      setValidationMsg("On-demand bookings can be up to 21 days ahead");
      return false;
    }
    if (preference === "Monthly" && selected.isAfter(maxDate90Days, "day")) {
      setValidationMsg("Monthly start date can be up to 90 days ahead");
      return false;
    }
    return true;
  };

  const dateSummary = useMemo(() => {
    if (preference === "Short term" && startDate && endDate) {
      return `${startDate.format("MMM D")} – ${endDate.format("MMM D")}`;
    }
    if (startDate) return startDate.format("ddd, MMM D");
    return "—";
  }, [preference, startDate, endDate]);

  const timeSummary = useMemo(() => {
    if (!startTime) return "—";
    if (endTime && preference !== "Monthly") {
      return `${startTime.format("h:mm A")} – ${endTime.format("h:mm A")}`;
    }
    return startTime.format("h:mm A");
  }, [startTime, endTime, preference]);

  const onPickerChange = (_: unknown, date?: Date) => {
    if (Platform.OS === "android") setPickerMode(null);
    if (!date) return;
    const selected = dayjs(date);
    if (pickerMode === "date") {
      const day = selected.startOf("day");
      const monthlyEnd = day.add(1, "month");
      setStartDate(day);
      setStartTime(null);
      setEndTime(null);
      setEndDate(preference === "Monthly" ? monthlyEnd : preference === "Date" ? null : endDate);
      persist(
        day,
        preference === "Monthly" ? monthlyEnd : preference === "Date" ? null : endDate,
        null,
        null
      );
      if (preference !== "Short term") {
        setPickerMode("time");
      }
    } else if (pickerMode === "time") {
      if (!validateSelection(selected)) return;
      applyStartDateTime(selected);
    }
  };

  const pickerValue =
    pickerMode === "date"
      ? (startDate ?? dayjs()).toDate()
      : (startTime ?? defaultOnDemandStart()).toDate();

  const maxPickerDate =
    preference === "Monthly" ? maxDate90Days.toDate() : maxDate21Days.toDate();

  return (
    <View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{planLabel}</Text>
      </View>
      <Text style={styles.cardTitle}>Booking details</Text>
      <Text style={styles.cardSub}>
        {preference === "Short term"
          ? "Daily visits across your selected date range."
          : preference === "Monthly"
            ? "Recurring monthly service from your start date."
            : "One visit on the day and time you choose."}
      </Text>

      <View style={styles.summaryGrid}>
        <View style={styles.summaryTile}>
          <Icon name="event" size={18} color="#0b5bd3" />
          <Text style={styles.summaryLabel}>Date</Text>
          <Text style={styles.summaryValue}>{dateSummary}</Text>
        </View>
        <View style={styles.summaryTile}>
          <Icon name="schedule" size={18} color="#0b5bd3" />
          <Text style={styles.summaryLabel}>Start time</Text>
          <Text style={styles.summaryValue}>{timeSummary}</Text>
        </View>
        <View style={styles.summaryTile}>
          <Icon name="timelapse" size={18} color="#0b5bd3" />
          <Text style={styles.summaryLabel}>Duration</Text>
          <Text style={styles.summaryValue}>
            {durationHours} hour{durationHours > 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      {(preference === "Date" || preference === "Short term") && (
        <View style={styles.durationSection}>
          <Text style={styles.durationHint}>
            {preference === "Short term"
              ? "Hours per visit — price updates for each day in your range."
              : "Tap a duration to update your visit length."}
          </Text>
          <View style={styles.durationChips}>
            {DURATION_OPTIONS.map((h) => {
              const disabled = !startTime || startTime.add(h, "hour").hour() >= 22;
              return (
                <TouchableOpacity
                  key={h}
                  style={[
                    styles.durationChip,
                    durationHours === h && styles.durationChipActive,
                    disabled && styles.durationChipDisabled,
                  ]}
                  disabled={disabled}
                  onPress={() => setDurationHours(h)}
                >
                  <Text
                    style={[
                      styles.durationChipText,
                      durationHours === h && styles.durationChipTextActive,
                    ]}
                  >
                    {h}h
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>
          {preference === "Short term" ? "Date range & time" : "Schedule"}
        </Text>
        <TouchableOpacity onPress={() => setScheduleOpen((o) => !o)}>
          <Text style={styles.editToggle}>{scheduleOpen ? "Hide" : "Change"}</Text>
        </TouchableOpacity>
      </View>

      {scheduleOpen && (
        <View style={styles.pickerPanel}>
          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={() => setPickerMode("date")}
          >
            <Icon name="event" size={20} color="#0b5bd3" />
            <Text style={styles.pickerBtnText}>Pick date</Text>
          </TouchableOpacity>
          {preference !== "Short term" && (
            <TouchableOpacity
              style={styles.pickerBtn}
              onPress={() => setPickerMode("time")}
            >
              <Icon name="access-time" size={20} color="#0b5bd3" />
              <Text style={styles.pickerBtnText}>Pick time</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {pickerMode && (
        <DateTimePicker
          value={pickerValue}
          mode={pickerMode}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          minimumDate={today.toDate()}
          maximumDate={maxPickerDate}
          onChange={onPickerChange}
        />
      )}

      {validationMsg ? (
        <Text style={styles.validation}>{validationMsg}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#e8f0fe",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  badgeText: { color: "#0b5bd3", fontSize: 12, fontWeight: "600" },
  cardTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a2e" },
  cardSub: { fontSize: 13, color: "#64748b", marginTop: 4, marginBottom: 8 },
  summaryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  summaryTile: {
    flex: 1,
    minWidth: "30%",
    backgroundColor: "#f8fafc",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  summaryLabel: { fontSize: 11, color: "#64748b", marginTop: 4 },
  summaryValue: { fontSize: 13, fontWeight: "600", color: "#1e293b", marginTop: 2 },
  durationSection: { marginBottom: 8 },
  durationHint: { fontSize: 12, color: "#64748b", marginBottom: 8 },
  durationChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  durationChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
  },
  durationChipActive: { backgroundColor: "#0b5bd3", borderColor: "#0b5bd3" },
  durationChipDisabled: { opacity: 0.4 },
  durationChipText: { fontSize: 14, color: "#334155", fontWeight: "600" },
  durationChipTextActive: { color: "#fff" },
  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  sectionTitle: { fontSize: 15, fontWeight: "600", color: "#1e293b" },
  editToggle: { fontSize: 14, color: "#0b5bd3", fontWeight: "600" },
  pickerPanel: { marginTop: 8, gap: 8 },
  pickerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    backgroundColor: "#f1f5f9",
    borderRadius: 10,
  },
  pickerBtnText: { fontSize: 15, color: "#0b5bd3", fontWeight: "500" },
  validation: { color: "#dc2626", fontSize: 13, marginTop: 8 },
});

export default MaidBookingDetailsSection;
