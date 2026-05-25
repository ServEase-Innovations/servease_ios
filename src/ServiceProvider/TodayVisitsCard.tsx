import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
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
      <LinearGradient
        colors={["#1e3a5f", "#1e40af"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <MaterialIcon name="today" size={20} color="#ffffff" />
          </View>
          <View>
            <Text style={styles.title}>Today's Visits</Text>
            <Text style={styles.subtitle}>
              {loading ? "Loading schedule..." : `${todaySchedule.length} visit${todaySchedule.length !== 1 ? 's' : ''} scheduled for today`}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Loading today's schedule...</Text>
          </View>
        ) : todaySchedule.length === 0 ? (
          <View style={styles.empty}>
            <MaterialIcon name="event-busy" size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No Visits Today</Text>
            <Text style={styles.emptyText}>
              You have no scheduled visits for today. Enjoy your day off!
            </Text>
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
                style={[styles.visitItem, index > 0 && styles.visitItemBorder]}
              >
                {/* Time Badge */}
                <View style={styles.timeBadge}>
                  <MaterialIcon name="schedule" size={14} color="#3b82f6" />
                  <Text style={styles.timeRangeText}>{timeRange}</Text>
                </View>

                {/* Client Info */}
                <View style={styles.clientInfo}>
                  <Text style={styles.clientName}>{clientName}</Text>
                  <View style={styles.detailsRow}>
                    <View style={styles.detailChip}>
                      <MaterialIcon name="receipt" size={12} color="#64748b" />
                      <Text style={styles.detailText}>#{b.engagement_id}</Text>
                    </View>
                    <View style={styles.detailChip}>
                      <MaterialIcon name="build" size={12} color="#64748b" />
                      <Text style={styles.detailText}>{getServiceTitle(b.service_type || "")}</Text>
                    </View>
                    {amountLabel && (
                      <View style={styles.detailChip}>
                        <MaterialIcon name="currency-rupee" size={12} color="#64748b" />
                        <Text style={styles.detailText}>{amountLabel}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.badgeRow}>
                    {getBookingTypeBadge(b.booking_type)}
                    {getStatusBadge(b.task_status)}
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  {b.mobileno && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => onCallCustomer(b.mobileno!, clientName)}
                    >
                      <MaterialIcon name="phone" size={16} color="#3b82f6" />
                      <Text style={styles.actionButtonText}>Call</Text>
                    </TouchableOpacity>
                  )}
                  
                  {b.address && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => onTrackAddress(b.address!)}
                    >
                      <MaterialIcon name="location-on" size={16} color="#3b82f6" />
                      <Text style={styles.actionButtonText}>Map</Text>
                    </TouchableOpacity>
                  )}
                  
                  {showStart && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.startButton]}
                      disabled={busy}
                      onPress={() => void onStartTodayVisit(b)}
                    >
                      {busy ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <>
                          <MaterialIcon name="play-arrow" size={16} color="#ffffff" />
                          <Text style={[styles.actionButtonText, styles.startButtonText]}>Start</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                  
                  {showComplete && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.completeButton]}
                      onPress={() =>
                        onStopTask(String(b.engagement_id), {
                          today_service: {
                            service_day_id: b.service_day_id,
                            status: b.service_day_status,
                          },
                        })
                      }
                    >
                      <MaterialIcon name="check-circle" size={16} color="#ffffff" />
                      <Text style={[styles.actionButtonText, styles.completeButtonText]}>Complete</Text>
                    </TouchableOpacity>
                  )}
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
    borderRadius: 20,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  body: {
    padding: 16,
  },
  centered: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748b",
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginTop: 12,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
  },
  visitItem: {
    paddingVertical: 14,
  },
  visitItemBorder: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  timeRangeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3b82f6",
  },
  clientInfo: {
    marginBottom: 12,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 6,
  },
  detailsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  detailChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  detailText: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "500",
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  actionButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#ffffff",
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  startButton: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  startButtonText: {
    color: "#ffffff",
  },
  completeButton: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
  },
  completeButtonText: {
    color: "#ffffff",
  },
});