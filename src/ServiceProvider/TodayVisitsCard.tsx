import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Clock, MapPin, Phone, Play } from "lucide-react-native";
import { getBookingTypeBadge, getServiceTitle, getStatusBadge } from "../common/BookingUtils";

export interface TodayBookingSlot {
  availability_id: number;
  engagement_id: number;
  visit_date: string;
  slot_start_epoch: number | null;
  slot_end_epoch: number | null;
  start_time_ist: string | null;
  end_time_ist: string | null;
  booking_type: string;
  service_type: string;
  task_status: string;
  engagement_status: string;
  address: string | null;
  base_amount: number | null;
  customer_firstname: string | null;
  customer_lastname: string | null;
  mobileno: string | null;
  service_day_id: number | null;
  service_day_status: string | null;
}

const formatTimeToAMPM = (timeString: string): string => {
  if (!timeString) return "";
  try {
    const [hours, minutes] = timeString.split(":");
    const hour = parseInt(hours, 10);
    const minute = parseInt(minutes, 10);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    const displayMinute = minute.toString().padStart(2, "0");
    return `${displayHour}:${displayMinute} ${period}`;
  } catch {
    return timeString;
  }
};

type Props = {
  loading: boolean;
  todaySchedule: TodayBookingSlot[];
  taskStatusUpdating: Record<string, boolean>;
  onCallCustomer: (phone: string, name: string) => void;
  onTrackAddress: (address: string) => void;
  onStartTodayVisit: (slot: TodayBookingSlot) => void | Promise<void>;
  onStopTask: (engagementId: string, bookingData: Record<string, unknown>) => void;
};

export default function TodayVisitsCard({
  loading,
  todaySchedule,
  taskStatusUpdating,
  onCallCustomer,
  onTrackAddress,
  onStartTodayVisit,
  onStopTask,
}: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Today&apos;s visits</Text>
          <Text style={styles.subtitle}>
            Booked slots for today (India time), ordered by start time.
          </Text>
        </View>
        <View style={styles.headerIcon}>
          <Clock size={20} color="#0369a1" />
        </View>
      </View>

      <View style={styles.body}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="small" color="#0284c7" />
          </View>
        ) : todaySchedule.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No visits on your calendar for today.</Text>
          </View>
        ) : (
          todaySchedule.map((b, index) => {
            const clientName =
              [b.customer_firstname, b.customer_lastname].filter(Boolean).join(" ").trim() ||
              "Customer";
            const sd = String(b.service_day_status ?? "").toUpperCase();
            const taskU = String(b.task_status ?? "").toUpperCase();
            const recurring = b.booking_type === "MONTHLY" || b.booking_type === "SHORT_TERM";
            const isOnDemand = String(b.booking_type || "").toUpperCase() === "ON_DEMAND";
            const showComplete = b.service_day_id != null && sd === "IN_PROGRESS";
            const showStart =
              !showComplete &&
              taskU !== "COMPLETED" &&
              taskU !== "IN_PROGRESS" &&
              taskU !== "STARTED" &&
              (sd === "SCHEDULED" ||
                (isOnDemand && (b.service_day_id == null || !sd)) ||
                (recurring && (b.service_day_id == null || sd === "")));
            const timeRange =
              b.start_time_ist && b.end_time_ist
                ? `${formatTimeToAMPM(b.start_time_ist)} – ${formatTimeToAMPM(b.end_time_ist)}`
                : b.start_time_ist
                  ? formatTimeToAMPM(b.start_time_ist)
                  : "Time TBD";
            const amountLabel =
              b.base_amount != null
                ? `₹${Number(b.base_amount).toLocaleString("en-IN", {
                    maximumFractionDigits: 0,
                  })}`
                : null;
            const busy = !!taskStatusUpdating[String(b.engagement_id)];

            return (
              <View
                key={`${b.availability_id}-${b.engagement_id}`}
                style={[styles.row, index > 0 && styles.rowBorder]}
              >
                <View style={styles.rowMain}>
                  <Text style={styles.timeRange}>{timeRange}</Text>
                  <Text style={styles.clientName} numberOfLines={1}>
                    {clientName}
                  </Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    #{b.engagement_id} · {getServiceTitle(b.service_type || "")}
                    {amountLabel ? ` · ${amountLabel}` : ""}
                  </Text>
                  <View style={styles.badgeRow}>
                    {getBookingTypeBadge(b.booking_type)}
                    {getStatusBadge(b.task_status)}
                  </View>
                </View>

                <View style={styles.actions}>
                  {b.mobileno ? (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => onCallCustomer(b.mobileno!, clientName)}
                    >
                      <Phone size={14} color="#334155" />
                      <Text style={styles.actionBtnText}>Call</Text>
                    </TouchableOpacity>
                  ) : null}
                  {b.address ? (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => onTrackAddress(b.address!)}
                    >
                      <MapPin size={14} color="#334155" />
                      <Text style={styles.actionBtnText}>Map</Text>
                    </TouchableOpacity>
                  ) : null}
                  {showStart ? (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      disabled={busy}
                      onPress={() => void onStartTodayVisit(b)}
                    >
                      {busy ? (
                        <ActivityIndicator size="small" color="#334155" />
                      ) : (
                        <>
                          <Play size={14} color="#334155" />
                          <Text style={styles.actionBtnText}>Start</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : null}
                  {showComplete ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.completeBtn]}
                      onPress={() =>
                        onStopTask(String(b.engagement_id), {
                          today_service: {
                            service_day_id: b.service_day_id,
                            status: b.service_day_status,
                          },
                        })
                      }
                    >
                      <Text style={styles.completeBtnText}>Complete</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.9)",
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    backgroundColor: "rgba(240, 249, 255, 0.6)",
  },
  headerText: { flex: 1, paddingRight: 12 },
  title: { fontSize: 17, fontWeight: "700", color: "#0f172a" },
  subtitle: { fontSize: 12, color: "#64748b", marginTop: 4, lineHeight: 17 },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#e0f2fe",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#bae6fd",
  },
  body: { padding: 16 },
  centered: { minHeight: 72, alignItems: "center", justifyContent: "center" },
  empty: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingVertical: 28,
    paddingHorizontal: 16,
    backgroundColor: "rgba(248, 250, 252, 0.5)",
  },
  emptyText: { textAlign: "center", fontSize: 14, color: "#64748b" },
  row: { paddingVertical: 14 },
  rowBorder: { borderTopWidth: 1, borderTopColor: "#f1f5f9" },
  rowMain: { marginBottom: 10 },
  timeRange: { fontSize: 14, fontWeight: "700", color: "#0f172a", marginBottom: 4 },
  clientName: { fontSize: 14, fontWeight: "600", color: "#1e293b" },
  meta: { fontSize: 12, color: "#64748b", marginTop: 2 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
  },
  actionBtnText: { fontSize: 12, fontWeight: "600", color: "#334155" },
  completeBtn: { backgroundColor: "#ef4444", borderColor: "#ef4444" },
  completeBtnText: { fontSize: 12, fontWeight: "600", color: "#fff" },
});
