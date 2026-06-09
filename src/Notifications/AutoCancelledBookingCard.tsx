import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import {
  notificationBookingLines,
  type NotificationBookingLine,
} from "./inAppNotificationUtils";

type Props = {
  metadata: unknown;
  engagementId?: string | number | null;
  isDarkMode?: boolean;
  variant?: "compact" | "expanded";
};

function pickLine(lines: NotificationBookingLine[], label: string): string | null {
  return lines.find((l) => l.label === label)?.value ?? null;
}

export default function AutoCancelledBookingCard({
  metadata,
  engagementId = null,
  isDarkMode = false,
  variant = "compact",
}: Props) {
  const lines = notificationBookingLines(metadata);
  const service = pickLine(lines, "Service");
  const bookingType = pickLine(lines, "Booking type");
  const scheduled = pickLine(lines, "Scheduled");
  const duration = pickLine(lines, "Duration");
  const location = pickLine(lines, "Location");
  const refund = pickLine(lines, "Refund amount");

  const headline = useMemo(() => {
    if (service && scheduled) return `${service} · ${scheduled}`;
    if (service) return service;
    if (scheduled) return scheduled;
    return "On-demand booking";
  }, [service, scheduled]);

  const bookingRef =
    engagementId != null && String(engagementId).trim() !== ""
      ? `#${String(engagementId)}`
      : null;

  const textPrimary = isDarkMode ? "#f8fafc" : "#0f172a";
  const textSecondary = isDarkMode ? "#94a3b8" : "#64748b";
  const cardBg = isDarkMode ? "#1e293b" : "#ffffff";
  const shellBg = isDarkMode ? "rgba(220,38,38,0.08)" : "rgba(254,226,226,0.45)";

  return (
    <View style={[styles.shell, { backgroundColor: shellBg, borderColor: isDarkMode ? "rgba(248,113,113,0.25)" : "rgba(248,113,113,0.35)" }]}>
      <View style={styles.headerRow}>
        <View style={styles.iconBadge}>
          <MaterialIcon name="person-off" size={18} color="#dc2626" />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: textPrimary }]}>No provider was available</Text>
          <Text style={[styles.subtitle, { color: textSecondary }]}>
            {headline}
            {bookingRef ? ` · Booking ${bookingRef}` : ""}
          </Text>
        </View>
      </View>

      <Text style={[styles.message, { color: textSecondary }]}>
        We could not assign anyone before your scheduled start time, so this booking was cancelled
        automatically. You have not been charged for an unfulfilled visit.
      </Text>

      <View style={[styles.detailsCard, { backgroundColor: cardBg, borderColor: isDarkMode ? "#334155" : "#e2e8f0" }]}>
        <View style={[styles.detailsHeader, { backgroundColor: isDarkMode ? "#0f172a" : "#f0f9ff" }]}>
          <MaterialIcon name="auto-awesome" size={14} color="#0284c7" />
          <Text style={[styles.detailsHeaderText, { color: textSecondary }]}>BOOKING DETAILS</Text>
        </View>
        <View style={styles.detailsBody}>
          {(service || bookingType) && (
            <DetailRow
              icon="home-repair-service"
              label="Service"
              value={[service, bookingType].filter(Boolean).join(" · ")}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
            />
          )}
          {scheduled && (
            <DetailRow
              icon="event"
              label="Scheduled"
              value={scheduled}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
            />
          )}
          {duration && (
            <DetailRow
              icon="schedule"
              label="Duration"
              value={duration}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
            />
          )}
          {location && (
            <DetailRow
              icon="place"
              label="Location"
              value={location}
              textPrimary={textPrimary}
              textSecondary={textSecondary}
            />
          )}
        </View>
      </View>

      {refund ? (
        <View style={[styles.refundBox, { backgroundColor: isDarkMode ? "rgba(16,185,129,0.12)" : "rgba(209,250,229,0.9)" }]}>
          <MaterialIcon name="currency-rupee" size={22} color="#047857" />
          <View style={styles.refundText}>
            <Text style={styles.refundTitle}>Full refund · {refund}</Text>
            <Text style={[styles.refundCaption, { color: textSecondary }]}>
              Returning to your original payment method
            </Text>
          </View>
          <View style={styles.refundChip}>
            <Text style={styles.refundChipText}>Refund initiated</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
  textPrimary,
  textSecondary,
}: {
  icon: string;
  label: string;
  value: string;
  textPrimary: string;
  textSecondary: string;
}) {
  return (
    <View style={styles.detailRow}>
      <MaterialIcon name={icon} size={17} color={textSecondary} />
      <View style={styles.detailRowText}>
        <Text style={[styles.detailLabel, { color: textSecondary }]}>{label}</Text>
        <Text style={[styles.detailValue, { color: textPrimary }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 10,
    width: "100%",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(220,38,38,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  title: { fontSize: 15, fontWeight: "800", lineHeight: 20 },
  subtitle: { fontSize: 12, marginTop: 2, lineHeight: 17 },
  message: { fontSize: 13, lineHeight: 19 },
  detailsCard: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  detailsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148,163,184,0.25)",
  },
  detailsHeaderText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  detailsBody: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  detailRowText: { flex: 1 },
  detailLabel: { fontSize: 11, fontWeight: "700" },
  detailValue: { fontSize: 13, lineHeight: 18, marginTop: 1 },
  refundBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.28)",
  },
  refundText: { flex: 1 },
  refundTitle: { fontSize: 14, fontWeight: "800", color: "#047857" },
  refundCaption: { fontSize: 11, marginTop: 2 },
  refundChip: {
    backgroundColor: "rgba(16,185,129,0.16)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  refundChipText: { fontSize: 10, fontWeight: "800", color: "#047857" },
});
