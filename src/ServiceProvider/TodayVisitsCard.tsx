import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import { BRAND } from "../theme/brandColors";
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
  const visitCount = todaySchedule.length;
  const subtitle = loading
    ? "Loading schedule..."
    : visitCount === 0
      ? "No visits scheduled today"
      : visitCount === 1
        ? "1 visit scheduled today"
        : `${visitCount} visits scheduled today`;

  return (
    <View style={styles.card}>
      <View style={styles.accentBar} />

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerIcon}>
            <MaterialIcon name="event-available" size={20} color={BRAND.accent} />
          </View>

          <View style={styles.headerTextCol}>
            <Text style={styles.title}>Today's Visits</Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          </View>

          {!loading ? (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{visitCount}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.body}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={BRAND.bookingSky} />
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
                <View style={styles.visitTopRow}>
                  <View style={styles.timeBadge}>
                    <MaterialIcon name="schedule" size={14} color="#3b82f6" />
                    <Text style={styles.timeRangeText}>{timeRange}</Text>
                  </View>
                  {amountLabel ? (
                    <View style={styles.amountPill}>
                      <Text style={styles.amountText}>{amountLabel}</Text>
                    </View>
                  ) : null}
                </View>

                <Text style={styles.clientName}>{clientName}</Text>

                <View style={styles.detailsRow}>
                  <View style={styles.detailChip}>
                    <MaterialIcon name="receipt" size={12} color="#64748b" />
                    <Text style={styles.detailText}>#{b.engagement_id}</Text>
                  </View>
                  <View style={styles.detailChip}>
                    <MaterialIcon name="build" size={12} color="#64748b" />
                    <Text style={styles.detailText} numberOfLines={1}>
                      {getServiceTitle(b.service_type || "")}
                    </Text>
                  </View>
                </View>

                <View style={styles.badgeRow}>
                  {getBookingTypeBadge(b.booking_type)}
                  {getStatusBadge(b.task_status)}
                </View>

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
    width: "100%",
    alignSelf: "stretch",
    backgroundColor: BRAND.surface,
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: BRAND.bookingNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: BRAND.line,
  },
  accentBar: {
    height: 3,
    width: "100%",
    backgroundColor: BRAND.accent,
  },
  header: {
    backgroundColor: BRAND.accentSoft,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.line,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    backgroundColor: BRAND.surface,
    borderWidth: 1,
    borderColor: BRAND.line,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  headerTextCol: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
    marginRight: 10,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: BRAND.text,
    letterSpacing: -0.2,
    lineHeight: 21,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    color: BRAND.textMuted,
    marginTop: 2,
    fontWeight: "500",
  },
  countBadge: {
    minWidth: 32,
    height: 32,
    paddingHorizontal: 8,
    borderRadius: 16,
    backgroundColor: BRAND.accent,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  countText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
  },
  body: {
    paddingHorizontal: 16,
    paddingVertical: 14,
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
    paddingVertical: 12,
  },
  visitItemBorder: {
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    marginTop: 4,
    paddingTop: 16,
  },
  visitTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 10,
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#eff6ff",
    borderRadius: 999,
    flexShrink: 1,
  },
  timeRangeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563eb",
  },
  amountPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#ecfdf5",
    borderRadius: 999,
  },
  amountText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f766e",
  },
  clientName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  detailChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f8fafc",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    maxWidth: "100%",
  },
  detailText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "500",
    flexShrink: 1,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#dbeafe",
    backgroundColor: "#f8fafc",
    minWidth: 72,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475569",
  },
  startButton: {
    backgroundColor: BRAND.accent,
    borderColor: BRAND.accent,
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