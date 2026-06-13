/* eslint-disable */
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import dayjs, { Dayjs } from "dayjs";
import Icon from "react-native-vector-icons/MaterialIcons";
import DribbbleDateTimePicker from "../common/DribbbleDateTimePicker";
import {
  commitSchedule,
  openBookingDialog,
  setScheduleDirty,
  setScheduleDraft,
} from "../features/bookingTypeSlice";

const DURATION_OPTIONS = [1, 2, 3, 4, 5, 6];

function parseTimeOnDate(dateStr: string | undefined, timeStr: string | undefined): Dayjs | null {
  if (!dateStr || !timeStr) return null;
  const base = dayjs(dateStr.split("T")[0]);
  const [h, m] = timeStr.split(":").map(Number);
  if (!Number.isFinite(h)) return null;
  return base.hour(h).minute(Number.isFinite(m) ? m : 0);
}

const TIME_HM = /^\d{1,2}:\d{2}$/;

function resolveScheduleTimeFields(
  booking: Record<string, unknown> | null | undefined
): { startTime: string; endTime: string } {
  if (!booking) return { startTime: "", endTime: "" };

  let startTime = String(booking.startTime ?? "").trim();
  let endTime = String(booking.endTime ?? "").trim();

  const timeRange = String(booking.timeRange ?? "").trim();
  if (timeRange) {
    if (timeRange.includes("-")) {
      const [rangeStart, rangeEnd] = timeRange.split("-").map((s) => s.trim());
      if (!startTime && rangeStart) startTime = rangeStart;
      if (!endTime && rangeEnd) endTime = rangeEnd;
    } else if (!startTime) {
      startTime = timeRange;
    }
  }

  const timeSlot = String(booking.timeSlot ?? "").trim();
  if (timeSlot.includes("-")) {
    const [slotStart, slotEnd] = timeSlot.split("-").map((s) => s.trim());
    if (!startTime && slotStart) startTime = slotStart;
    if (!endTime && slotEnd) endTime = slotEnd;
  } else if (!startTime && timeSlot) {
    startTime = timeSlot;
  }

  const valid = (t: string) => TIME_HM.test(t);
  return {
    startTime: valid(startTime) ? startTime : "",
    endTime: valid(endTime) ? endTime : "",
  };
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

  const patch = {
    ...(existing ?? {}),
    startDate: startIso ? startIso.split("T")[0] : "",
    endDate: endIso ? endIso.split("T")[0] : "",
    timeRange,
    bookingPreference: preference,
    startTime: startTime?.format("HH:mm") || "",
    endTime: endTime?.format("HH:mm") || "",
    timeSlot,
  };

  if (!startTime && !endTime) {
    patch.timeRange = "";
    patch.timeSlot = "";
    patch.startTime = "";
    patch.endTime = "";
  }

  return patch;
}

function parseTimeFromString(time: string): { hour: number; minute: number } {
  const [timeStr, meridian] = time.split(" ");
  const [hourStr, minuteStr] = timeStr.split(":");
  let hour = Number(hourStr);
  const minute = Number(minuteStr);
  if (meridian === "PM" && hour !== 12) hour += 12;
  if (meridian === "AM" && hour === 12) hour = 0;
  return { hour, minute };
}

function isDurationWithinWorkHours(start: Dayjs, hours: number): boolean {
  return start.add(hours, "hour").hour() < 22;
}

function schedulePatchKey(patch: Record<string, unknown> | null): string {
  if (!patch) return "";
  return [
    String(patch.startDate ?? "").split("T")[0],
    String(patch.endDate ?? "").split("T")[0],
    String(patch.startTime ?? "").trim(),
    String(patch.endTime ?? "").trim(),
  ].join("|");
}

export type MaidBookingDetailsSectionHandle = {
  checkAvailability: () => Promise<void>;
};

interface MaidBookingDetailsSectionProps {
  active: boolean;
  providerId?: number | string | null;
  onApplyingScheduleChange?: (loading: boolean) => void;
}

const MaidBookingDetailsSection = forwardRef<
  MaidBookingDetailsSectionHandle,
  MaidBookingDetailsSectionProps
>(function MaidBookingDetailsSection(
  { active, providerId, onApplyingScheduleChange },
  ref
) {
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
  const [userTouchedSchedule, setUserTouchedSchedule] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const scheduleBaselineRef = useRef("");

  const markScheduleTouched = useCallback(() => {
    setUserTouchedSchedule(true);
  }, []);

  const hydrateFromRedux = useCallback(() => {
    const pref = String(rawBooking?.bookingPreference ?? "Date");
    const dateStr =
      rawBooking?.startDate != null
        ? String(rawBooking.startDate).split("T")[0]
        : dayjs().format("YYYY-MM-DD");

    let sd = rawBooking?.startDate ? dayjs(dateStr) : null;
    let ed = rawBooking?.endDate ? dayjs(String(rawBooking.endDate).split("T")[0]) : null;

    const { startTime: reduxStart, endTime: reduxEnd } = resolveScheduleTimeFields(
      rawBooking as Record<string, unknown> | null
    );
    let st = parseTimeOnDate(dateStr, reduxStart);
    let et = parseTimeOnDate(dateStr, reduxEnd);

    if (pref === "Short term") {
      if (!reduxStart) {
        st = null;
        et = null;
      } else if (!et && st) {
        et = st.add(1, "hour");
      }
    } else if (pref === "Monthly" && !reduxStart) {
      st = null;
      et = null;
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
      setUserTouchedSchedule(false);
      setHydrated(true);
      setScheduleOpen(false);
      return;
    }
    setHydrated(false);
    dispatch(setScheduleDirty(false));
    dispatch(setScheduleDraft(null));
  }, [active, dispatch, hydrateFromRedux]);

  const planLabel = useMemo(() => {
    const pref = preference.toLowerCase();
    if (pref === "date") return "On-demand";
    if (pref === "short term") return "Short-term";
    return "Monthly";
  }, [preference]);

  const durationHours =
    startTime && endTime ? Math.max(1, endTime.diff(startTime, "hour")) : 1;

  const localSchedulePatch = useMemo(
    () =>
      buildReduxBookingPatch(preference, startDate, endDate, startTime, endTime, null),
    [preference, startDate, endDate, startTime, endTime]
  );

  useEffect(() => {
    if (!active || !hydrated) return;
    if (!startTime || !endTime) {
      dispatch(setScheduleDirty(false));
      dispatch(setScheduleDraft(null));
      return;
    }
    const localKey = schedulePatchKey(localSchedulePatch);
    if (!userTouchedSchedule) {
      scheduleBaselineRef.current = localKey;
      dispatch(setScheduleDirty(false));
      dispatch(setScheduleDraft(null));
      return;
    }
    const dirty = localKey !== scheduleBaselineRef.current;
    dispatch(setScheduleDirty(dirty));
    dispatch(setScheduleDraft(dirty ? localSchedulePatch : null));
  }, [
    active,
    dispatch,
    endTime,
    hydrated,
    localSchedulePatch,
    startTime,
    userTouchedSchedule,
  ]);

  const applySchedule = useCallback(async () => {
    if (!startTime || !endTime) {
      setValidationMsg("Select your date and time before checking availability.");
      return;
    }
    onApplyingScheduleChange?.(true);
    try {
      const patch = buildReduxBookingPatch(
        preference,
        startDate,
        endDate,
        startTime,
        endTime,
        rawBooking
      );
      dispatch(commitSchedule(patch));
      scheduleBaselineRef.current = schedulePatchKey(patch);
      setUserTouchedSchedule(false);
      setScheduleOpen(false);
      setValidationMsg(null);
      const pid = Number(providerId);
      if (Number.isFinite(pid) && pid > 0) {
        dispatch(openBookingDialog(String(pid)));
      }
    } finally {
      onApplyingScheduleChange?.(false);
    }
  }, [
    dispatch,
    endDate,
    endTime,
    onApplyingScheduleChange,
    preference,
    providerId,
    rawBooking,
    startDate,
    startTime,
  ]);

  useImperativeHandle(
    ref,
    () => ({
      checkAvailability: () => applySchedule(),
    }),
    [applySchedule]
  );

  const setDurationHours = (hours: number) => {
    markScheduleTouched();
    if (!startTime) return;
    const newEnd = startTime.add(hours, "hour");
    if (newEnd.hour() >= 22) {
      setValidationMsg("End time must be before 10 PM");
      return;
    }
    setEndTime(newEnd);
    if (preference === "Date") setEndDate(newEnd);
    setValidationMsg("Tap Check availability to search providers for this duration.");
  };

  const applyStartDateTime = (selected: Dayjs) => {
    markScheduleTouched();
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
    setValidationMsg("Tap Check availability to search providers for this schedule.");
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

      {(preference === "Date" || preference === "Short term" || preference === "Monthly") && (
        <View style={styles.durationSection}>
          <Text style={styles.durationHint}>
            {preference === "Short term"
              ? "Hours per visit — price updates for each day in your range."
              : preference === "Monthly"
                ? "Hours per visit — price updates for your monthly service."
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

      {scheduleOpen && preference === "Date" && (
        <View style={styles.pickerShell}>
          <DribbbleDateTimePicker
            mode="single"
            value={startTime?.toDate()}
            onChange={(selectedDateTime: Date) => {
              const selected = dayjs(selectedDateTime);
              if (!validateSelection(selected)) return;
              applyStartDateTime(selected);
            }}
          />
        </View>
      )}

      {scheduleOpen && preference === "Short term" && (
        <View style={styles.pickerShell}>
          <DribbbleDateTimePicker
            mode="range"
            value={{
              startDate: startDate?.toDate(),
              endDate: endDate?.toDate(),
            }}
            onChange={(payload: { startDate: Date; endDate: Date; time: string }) => {
              if (!payload.time) return;
              markScheduleTouched();
              const start = dayjs(payload.startDate);
              let end = dayjs(payload.endDate).startOf("day");
              const { hour, minute } = parseTimeFromString(payload.time);
              const startWithTime = start.hour(hour).minute(minute);

              if (end.diff(startWithTime.startOf("day"), "day") > 14) {
                end = startWithTime.startOf("day").add(14, "day");
                setValidationMsg("Short-term bookings are limited to 15 days.");
              } else {
                setValidationMsg(null);
              }
              if (!validateSelection(startWithTime)) return;
              if (!isDurationWithinWorkHours(startWithTime, durationHours)) {
                setValidationMsg("Service hours are 5 AM – 10 PM");
                return;
              }
              const endT = startWithTime.add(durationHours, "hour");
              setStartDate(startWithTime);
              setStartTime(startWithTime);
              setEndDate(end);
              setEndTime(endT);
              setValidationMsg("Tap Check availability to search providers for this schedule.");
            }}
          />
        </View>
      )}

      {scheduleOpen && preference === "Monthly" && (
        <View style={styles.pickerShell}>
          <DribbbleDateTimePicker
            mode="single"
            value={startTime?.toDate()}
            onChange={(selectedDateTime: Date) => {
              const selected = dayjs(selectedDateTime);
              if (!validateSelection(selected)) return;
              applyStartDateTime(selected);
            }}
          />
        </View>
      )}

      {validationMsg ? (
        <Text style={styles.validation}>{validationMsg}</Text>
      ) : null}
    </View>
  );
});

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
  pickerShell: { marginTop: 8 },
  validation: { color: "#dc2626", fontSize: 13, marginTop: 8 },
  applyButton: {
    marginTop: 12,
    alignSelf: "center",
    backgroundColor: "#0b5bd3",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  applyButtonDisabled: { opacity: 0.45 },
  applyButtonText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});

export default MaidBookingDetailsSection;
