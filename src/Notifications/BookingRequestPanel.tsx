import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { BrandButton } from "../design-system/BrandButton";
import { BRAND } from "../theme/brandColors";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import {
  BookingRequestPayload,
  isBookingToastInfoOnly,
} from "./inAppNotificationUtils";
import { parseEngagementId } from "../services/engagementService";

export type BookingRequestPanelProps = {
  engagement: BookingRequestPayload;
  onAccept: (engagementId: number) => void | Promise<void>;
  onReject: (engagementId: number) => void;
  actionBusy?: boolean;
  errorText?: string | null;
  headerCaption?: string;
};

export default function BookingRequestPanel({
  engagement,
  onAccept,
  onReject,
  actionBusy = false,
  errorText = null,
  headerCaption,
}: BookingRequestPanelProps) {
  const schedule = useMemo(() => {
    const dateLine = engagement.end_date
      ? `${engagement.start_date} → ${engagement.end_date}`
      : engagement.start_date;
    const timeLine =
      engagement.end_time && engagement.start_time
        ? `${engagement.start_time} – ${engagement.end_time}`
        : engagement.start_time || "—";
    return { dateLine, timeLine };
  }, [engagement]);

  const distanceLine = useMemo(() => {
    if (engagement.distance_meters == null) return null;
    const km = engagement.distance_meters / 1000;
    return km < 1 ? `${Math.round(engagement.distance_meters)} m away` : `~${km.toFixed(1)} km away`;
  }, [engagement.distance_meters]);

  const isOnDemand = String(engagement.booking_type || "").toUpperCase() === "ON_DEMAND";
  const isInfoOnly = isBookingToastInfoOnly(engagement);
  const resolvedEngagementId = parseEngagementId(engagement.engagement_id);
  const canAccept = resolvedEngagementId != null && !isInfoOnly;

  const headerTitle = engagement.payment_pending
    ? isOnDemand
      ? "Awaiting customer payment"
      : "New booking"
    : engagement.payment_completed && !isOnDemand
      ? "Booking confirmed"
      : "New booking request";

  const typeLabel = (engagement.service_type || "Service").replace(/_/g, " ");
  const bookLabel = (engagement.booking_type || "Booking").replace(/_/g, " ");

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
        {headerCaption ? <Text style={styles.headerCaption}>{headerCaption}</Text> : null}
      </View>

      <View style={styles.body}>
        {errorText ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorText}</Text>
          </View>
        ) : null}

        <View style={styles.chipRow}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{bookLabel}</Text>
          </View>
          <View style={[styles.chip, styles.chipGreen]}>
            <Text style={[styles.chipText, styles.chipGreenText]}>{typeLabel}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <MaterialIcon name="schedule" size={18} color="#64748b" />
            <View style={styles.rowText}>
              <Text style={styles.label}>Schedule</Text>
              <Text style={styles.value}>{schedule.dateLine}</Text>
              <Text style={styles.subValue}>{schedule.timeLine}</Text>
            </View>
          </View>

          {distanceLine ? (
            <View style={styles.row}>
              <MaterialIcon name="place" size={18} color="#64748b" />
              <View style={styles.rowText}>
                <Text style={styles.label}>Distance</Text>
                <Text style={styles.value}>{distanceLine}</Text>
                {engagement.address ? (
                  <Text style={styles.subValue}>{engagement.address}</Text>
                ) : null}
              </View>
            </View>
          ) : engagement.address ? (
            <View style={styles.row}>
              <MaterialIcon name="place" size={18} color="#64748b" />
              <View style={styles.rowText}>
                <Text style={styles.label}>Location</Text>
                <Text style={styles.subValue}>{engagement.address}</Text>
              </View>
            </View>
          ) : null}

          <View style={styles.amountRow}>
            <Text style={styles.label}>Est. service amount</Text>
            <Text style={styles.amount}>
              ₹{Number(engagement.base_amount).toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        {isInfoOnly ? (
          <BrandButton
            variant="primary"
            disabled={actionBusy}
            onPress={() => {
              if (resolvedEngagementId != null) onReject(resolvedEngagementId);
            }}
          >
            Dismiss
          </BrandButton>
        ) : (
          <View style={styles.btnRow}>
            <BrandButton
              variant="ghost"
              flex={1}
              disabled={actionBusy || resolvedEngagementId == null}
              onPress={() => {
                if (resolvedEngagementId != null) onReject(resolvedEngagementId);
              }}
              style={styles.btnDecline}
              textStyle={styles.btnDeclineText}
            >
              Decline
            </BrandButton>
            <BrandButton
              variant="primary"
              flex={1}
              disabled={actionBusy || !canAccept}
              loading={actionBusy}
              onPress={() => {
                if (resolvedEngagementId != null) void onAccept(resolvedEngagementId);
              }}
            >
              Accept
            </BrandButton>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
  },
  header: {
    backgroundColor: "#0c4a6e",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700", textAlign: "center" },
  headerCaption: { color: "rgba(255,255,255,0.9)", fontSize: 12, textAlign: "center", marginTop: 4 },
  body: { padding: 16 },
  errorBox: {
    backgroundColor: "rgba(239,68,68,0.1)",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorText: { color: "#b91c1c", fontSize: 14 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12, justifyContent: "center" },
  chip: {
    backgroundColor: "rgba(14,165,233,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  chipGreen: { backgroundColor: "rgba(5,150,105,0.12)" },
  chipText: { fontSize: 12, fontWeight: "600", color: "#0369a1", textTransform: "capitalize" },
  chipGreenText: { color: "#047857" },
  card: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 14,
    backgroundColor: "rgba(15,23,42,0.03)",
  },
  row: { flexDirection: "row", gap: 10, marginBottom: 14 },
  rowText: { flex: 1 },
  label: { fontSize: 11, fontWeight: "600", color: "#64748b", marginBottom: 2 },
  value: { fontSize: 15, fontWeight: "600", color: "#0f172a" },
  subValue: { fontSize: 13, color: "#64748b", marginTop: 2 },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 10,
    marginTop: 4,
  },
  amount: { fontSize: 18, fontWeight: "700", color: BRAND.accent },
  footer: { padding: 16, paddingTop: 0, borderTopWidth: 1, borderTopColor: "#e2e8f0" },
  btnRow: { flexDirection: "row", gap: 8 },
  btnDecline: { borderColor: "#f87171" },
  btnDeclineText: { color: "#dc2626", fontWeight: "700" },
});
