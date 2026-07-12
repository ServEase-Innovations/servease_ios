import React from "react";
import { View, Text, StyleSheet } from "react-native";

/** Prefer today's service_days.status over stale engagements.task_status. */
export function effectiveProviderTaskStatus(
  storedTaskStatus: string | undefined | null,
  todayServiceStatus?: string | null,
  localOverride?: "IN_PROGRESS" | "COMPLETED"
): string {
  if (localOverride) return localOverride;
  const sd = String(todayServiceStatus ?? "").toUpperCase();
  if (sd === "IN_PROGRESS" || sd === "STARTED") return "IN_PROGRESS";
  if (sd === "COMPLETED" || sd === "DONE") return "COMPLETED";
  if (sd === "SCHEDULED" || !sd) {
    const t = String(storedTaskStatus ?? "").toUpperCase();
    if (t === "COMPLETED") return "COMPLETED";
    return "NOT_STARTED";
  }
  const t = String(storedTaskStatus ?? "").toUpperCase();
  if (t === "STARTED") return "IN_PROGRESS";
  if (t) return t;
  return "NOT_STARTED";
}

export function getServiceTitle(serviceType: string): string {
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

function formatStatus(status: string): string {
  const key = String(status || "").toUpperCase();
  if (key === "IN_PROGRESS" || key === "STARTED") return "In Progress";
  if (key === "QUEUE_STANDBY") return "Queue Standby";
  if (key === "COMPLETED") return "Completed";
  if (key === "SCHEDULED") return "Scheduled";
  return key.replace(/_/g, " ") || "Pending";
}

export function getBookingTypeBadge(bookingType: string) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{formatBookingType(bookingType)}</Text>
    </View>
  );
}

export function getStatusBadge(status: string) {
  const key = String(status || "").toUpperCase();
  const isProgress = key === "IN_PROGRESS" || key === "STARTED";
  const isComplete = key === "COMPLETED";
  return (
    <View
      style={[
        styles.chip,
        isProgress && styles.chipProgress,
        isComplete && styles.chipComplete,
      ]}
    >
      <Text
        style={[
          styles.chipText,
          isProgress && styles.chipTextProgress,
          isComplete && styles.chipTextComplete,
        ]}
      >
        {formatStatus(status)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  chipProgress: {
    backgroundColor: "#dbeafe",
    borderColor: "#bfdbfe",
  },
  chipComplete: {
    backgroundColor: "#d1fae5",
    borderColor: "#a7f3d0",
  },
  chipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#475569",
  },
  chipTextProgress: {
    color: "#1d4ed8",
  },
  chipTextComplete: {
    color: "#047857",
  },
});
