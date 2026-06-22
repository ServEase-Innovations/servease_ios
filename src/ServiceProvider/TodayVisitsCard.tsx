import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import { effectiveProviderTaskStatus } from "../common/BookingUtils";
import { BRAND, HOME_M3 } from "../theme/brandColors";

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

const AVATAR_COLORS = ["#3b82f6", "#6366f1", "#0ea5e9", "#8b5cf6"];

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

function getInitials(first: string | null, last: string | null): string {
  const f = (first || "").trim();
  const l = (last || "").trim();
  if (f && l) return `${f[0]}${l[0]}`.toUpperCase();
  if (f) return f.slice(0, 2).toUpperCase();
  return "CU";
}

function getServiceTitle(serviceType: string): string {
  const key = String(serviceType || "").toUpperCase();
  if (key === "COOK" || key.includes("COOK")) return "Home Cook";
  if (key === "MAID" || key.includes("MAID") || key.includes("CLEAN")) return "Cleaning Help";
  if (key === "NANNY" || key.includes("NANNY") || key.includes("CARE")) return "Caregiver";
  return serviceType || "Service";
}

function formatBookingType(bookingType: string): string {
  const key = String(bookingType || "").toUpperCase();
  if (key === "MONTHLY") return "Monthly";
  if (key === "SHORT_TERM") return "Short Term";
  if (key === "ON_DEMAND") return "On Demand";
  return bookingType.replace(/_/g, " ");
}

function formatTodayDate(): string {
  return new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function resolveStatusLabel(slot: TodayBookingSlot): {
  label: string;
  variant: "progress" | "pending" | "complete";
} {
  const displayStatus = effectiveProviderTaskStatus(
    slot.task_status,
    slot.service_day_status
  ).toUpperCase();
  if (displayStatus === "IN_PROGRESS" || displayStatus === "STARTED") {
    return { label: "IN PROGRESS", variant: "progress" };
  }
  if (displayStatus === "COMPLETED") {
    return { label: "COMPLETED", variant: "complete" };
  }
  return { label: "NOT STARTED", variant: "pending" };
}

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
  const sorted = [...todaySchedule].sort((a, b) =>
    (a.start_time_ist || "").localeCompare(b.start_time_ist || "")
  );

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today's Visits</Text>
        <Text style={styles.sectionDate}>{formatTodayDate()}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={HOME_M3.secondary} />
          <Text style={styles.loadingText}>Loading today's schedule...</Text>
        </View>
      ) : sorted.length === 0 ? (
        <View style={styles.emptyCard}>
          <MaterialIcon name="event-busy" size={40} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No visits today</Text>
          <Text style={styles.emptyText}>You have no scheduled visits for today.</Text>
        </View>
      ) : (
        sorted.map((slot, index) => {
          const clientName =
            [slot.customer_firstname, slot.customer_lastname].filter(Boolean).join(" ").trim() ||
            "Customer";
          const timeRange =
            slot.start_time_ist && slot.end_time_ist
              ? `${formatTimeToAMPM(slot.start_time_ist)} - ${formatTimeToAMPM(slot.end_time_ist)}`
              : slot.start_time_ist
                ? formatTimeToAMPM(slot.start_time_ist)
                : "Time TBD";
          const amountLabel =
            slot.base_amount != null
              ? `₹${Number(slot.base_amount).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`
              : null;
          const status = resolveStatusLabel(slot);
          const sd = String(slot.service_day_status ?? "").toUpperCase();
          const displayStatus = effectiveProviderTaskStatus(
            slot.task_status,
            slot.service_day_status
          ).toUpperCase();
          const recurring = slot.booking_type === "MONTHLY" || slot.booking_type === "SHORT_TERM";
          const isOnDemand = String(slot.booking_type || "").toUpperCase() === "ON_DEMAND";
          const showComplete = slot.service_day_id != null && sd === "IN_PROGRESS";
          const showStart =
            !showComplete &&
            displayStatus !== "COMPLETED" &&
            displayStatus !== "IN_PROGRESS" &&
            displayStatus !== "STARTED" &&
            (sd === "SCHEDULED" ||
              (isOnDemand && (slot.service_day_id == null || !sd)) ||
              (recurring && (slot.service_day_id == null || sd === "")));
          const busy = !!taskStatusUpdating[String(slot.engagement_id)];
          const inProgress = showComplete;

          return (
            <View key={`${slot.engagement_id}-${index}`} style={styles.visitCard}>
              <View style={styles.visitTopRow}>
                <View style={styles.clientRow}>
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] },
                    ]}
                  >
                    <Text style={styles.avatarText}>
                      {getInitials(slot.customer_firstname, slot.customer_lastname)}
                    </Text>
                  </View>
                  <Text style={styles.clientName} numberOfLines={1}>
                    {clientName.toUpperCase()}
                  </Text>
                </View>
                {amountLabel ? <Text style={styles.amount}>{amountLabel}</Text> : null}
              </View>

              <View style={styles.timeStatusRow}>
                <View style={styles.timeRow}>
                  <MaterialIcon name="schedule" size={16} color={HOME_M3.onSurfaceVariant} />
                  <Text style={styles.timeText}>{timeRange}</Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    status.variant === "progress" && styles.statusPillProgress,
                    status.variant === "pending" && styles.statusPillPending,
                    status.variant === "complete" && styles.statusPillComplete,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      status.variant === "progress" && styles.statusPillTextProgress,
                      status.variant === "pending" && styles.statusPillTextPending,
                    ]}
                  >
                    {status.label}
                  </Text>
                </View>
              </View>

              <View style={styles.chipRow}>
                <View style={styles.chip}>
                  <Text style={styles.chipText}>#{slot.engagement_id}</Text>
                </View>
                <View style={styles.chip}>
                  <Text style={styles.chipText}>{getServiceTitle(slot.service_type)}</Text>
                </View>
                <View style={styles.chip}>
                  <Text style={styles.chipText}>{formatBookingType(slot.booking_type)}</Text>
                </View>
              </View>

              {inProgress ? (
                <View style={styles.dualActionRow}>
                  {slot.mobileno ? (
                    <TouchableOpacity
                      style={styles.wideActionBtn}
                      onPress={() => onCallCustomer(slot.mobileno!, clientName)}
                    >
                      <MaterialIcon name="phone" size={18} color={BRAND.accent} />
                      <Text style={styles.wideActionText}>Call</Text>
                    </TouchableOpacity>
                  ) : null}
                  {slot.address ? (
                    <TouchableOpacity
                      style={styles.wideActionBtn}
                      onPress={() => onTrackAddress(slot.address!)}
                    >
                      <MaterialIcon name="near-me" size={18} color={BRAND.accent} />
                      <Text style={styles.wideActionText}>Map</Text>
                    </TouchableOpacity>
                  ) : null}
                  {showComplete ? (
                    <TouchableOpacity
                      style={[styles.wideActionBtn, styles.completeBtn]}
                      onPress={() =>
                        onStopTask(String(slot.engagement_id), {
                          today_service: {
                            service_day_id: slot.service_day_id,
                            status: slot.service_day_status,
                          },
                        })
                      }
                    >
                      <MaterialIcon name="check-circle" size={18} color="#ffffff" />
                      <Text style={styles.completeBtnText}>Complete</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : (
                <View style={styles.actionRow}>
                  {slot.mobileno ? (
                    <TouchableOpacity
                      style={styles.iconActionBtn}
                      onPress={() => onCallCustomer(slot.mobileno!, clientName)}
                    >
                      <MaterialIcon name="phone" size={20} color={BRAND.accent} />
                    </TouchableOpacity>
                  ) : null}
                  {slot.address ? (
                    <TouchableOpacity
                      style={styles.iconActionBtn}
                      onPress={() => onTrackAddress(slot.address!)}
                    >
                      <MaterialIcon name="near-me" size={20} color={BRAND.accent} />
                    </TouchableOpacity>
                  ) : null}
                  {showStart ? (
                    <TouchableOpacity
                      style={styles.startVisitBtn}
                      disabled={busy}
                      onPress={() => void onStartTodayVisit(slot)}
                    >
                      {busy ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <>
                          <Text style={styles.startVisitText}>Start Visit</Text>
                          <MaterialIcon name="chevron-right" size={20} color="#ffffff" />
                        </>
                      )}
                    </TouchableOpacity>
                  ) : null}
                </View>
              )}
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: HOME_M3.onSurface,
    letterSpacing: -0.3,
  },
  sectionDate: {
    fontSize: 13,
    fontWeight: "600",
    color: HOME_M3.secondary,
  },
  loadingWrap: {
    paddingVertical: 40,
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: HOME_M3.onSurfaceVariant,
  },
  emptyCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e8edf4",
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: HOME_M3.onSurface,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: HOME_M3.onSurfaceVariant,
    marginTop: 4,
    textAlign: "center",
  },
  visitCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e8edf4",
    shadowColor: "#0c1e3d",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  visitTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 8,
  },
  clientRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  clientName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: HOME_M3.onSurface,
    letterSpacing: 0.3,
  },
  amount: {
    fontSize: 16,
    fontWeight: "800",
    color: HOME_M3.onSurface,
  },
  timeStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 8,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  timeText: {
    fontSize: 13,
    fontWeight: "600",
    color: HOME_M3.onSurfaceVariant,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statusPillProgress: {
    backgroundColor: "#dbeafe",
  },
  statusPillPending: {
    backgroundColor: "#f1f5f9",
  },
  statusPillComplete: {
    backgroundColor: "#d1fae5",
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  statusPillTextProgress: {
    color: "#1d4ed8",
  },
  statusPillTextPending: {
    color: "#64748b",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  chip: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
  },
  dualActionRow: {
    flexDirection: "row",
    gap: 10,
  },
  wideActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: BRAND.accentSoft,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  wideActionText: {
    fontSize: 14,
    fontWeight: "700",
    color: BRAND.accent,
  },
  completeBtn: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
  },
  completeBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BRAND.accentSoft,
    borderWidth: 1,
    borderColor: "#dbeafe",
  },
  startVisitBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    backgroundColor: BRAND.bookingNavy,
    borderRadius: 12,
    paddingVertical: 12,
    minHeight: 44,
  },
  startVisitText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
