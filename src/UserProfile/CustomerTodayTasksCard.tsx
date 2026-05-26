import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { getBookingTypeBadge, getServiceTitle } from "../common/BookingUtils";

export interface CustomerTodayBookingSlot {
  availability_id: number;
  engagement_id: number;
  start_time_ist: string | null;
  end_time_ist: string | null;
  booking_type: string;
  service_type: string;
  task_status: string;
  address: string | null;
  provider_firstname: string | null;
  provider_lastname: string | null;
  provider_mobileno: string | null;
  service_day_id: number | null;
  service_day_status: string | null;
  today_service?: {
    service_day_id: number;
    status: string;
    can_generate_otp?: boolean;
    otp_active?: boolean;
  } | null;
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

const visitStatusLabel = (sd: string | null | undefined): string => {
  const u = String(sd ?? "").toUpperCase();
  if (u === "IN_PROGRESS" || u === "STARTED") return "In progress";
  if (u === "COMPLETED" || u === "DONE") return "Completed";
  if (u === "SCHEDULED") return "Scheduled";
  return "Scheduled";
};

type Props = {
  loading: boolean;
  todaySchedule: CustomerTodayBookingSlot[];
  otpLoadingId: number | null;
  generatedOTPs: Record<number, string>;
  colors: {
    primary: string;
    text: string;
    textSecondary: string;
    card: string;
    border: string;
    success: string;
    info: string;
  };
  onGenerateOtp: (slot: CustomerTodayBookingSlot) => void;
  onOpenBooking: (engagementId: number) => void;
};

export default function CustomerTodayTasksCard({
  loading,
  todaySchedule,
  otpLoadingId,
  generatedOTPs,
  colors,
  onGenerateOtp,
  onOpenBooking,
}: Props) {
  return (
    <View style={[styles.card, { borderColor: colors.border + "40", backgroundColor: colors.card }]}>
      <LinearGradient
        colors={["#e0f2fe", "#f8fafc"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerIcon}>
          <MaterialIcon name="today" size={22} color="#0369a1" />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.text }]}>Today&apos;s service</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {loading
              ? "Loading…"
              : `${todaySchedule.length} visit${todaySchedule.length !== 1 ? "s" : ""} today (IST)`}
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : todaySchedule.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No service scheduled for today.
          </Text>
        ) : (
          todaySchedule.map((b, index) => {
            const providerName =
              [b.provider_firstname, b.provider_lastname].filter(Boolean).join(" ").trim() ||
              "Provider";
            const sd = String(b.service_day_status ?? b.today_service?.status ?? "").toUpperCase();
            const timeRange =
              b.start_time_ist && b.end_time_ist
                ? `${formatTimeToAMPM(b.start_time_ist)} – ${formatTimeToAMPM(b.end_time_ist)}`
                : b.start_time_ist
                  ? formatTimeToAMPM(b.start_time_ist)
                  : "Time TBD";
            const engId = b.engagement_id;
            const otp = generatedOTPs[engId];
            const canOtp = b.today_service?.can_generate_otp;
            const otpActive = b.today_service?.otp_active;

            return (
              <View
                key={`${b.availability_id}-${b.engagement_id}`}
                style={[
                  styles.row,
                  index < todaySchedule.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: colors.border + "50",
                  },
                ]}
              >
                <Text style={[styles.timeText, { color: colors.text }]}>{timeRange}</Text>
                <Text style={[styles.serviceText, { color: colors.text }]}>
                  {getServiceTitle(b.service_type || "")}
                </Text>
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  #{b.engagement_id} · {providerName}
                </Text>
                <View style={styles.badgeRow}>
                  {getBookingTypeBadge(b.booking_type)}
                  <View style={[styles.statusPill, { backgroundColor: colors.info + "18" }]}>
                    <Text style={[styles.statusPillText, { color: colors.info }]}>
                      {visitStatusLabel(sd)}
                    </Text>
                  </View>
                </View>

                {sd === "SCHEDULED" && (
                  <Text style={[styles.hint, { color: colors.textSecondary }]}>
                    Waiting for your provider to start the visit.
                  </Text>
                )}
                {sd === "IN_PROGRESS" && (
                  <Text style={[styles.hint, { color: colors.textSecondary }]}>
                    Generate an OTP when the provider is ready to complete the visit.
                  </Text>
                )}

                <View style={styles.actions}>
                  {b.provider_mobileno ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, { borderColor: colors.border }]}
                      onPress={() => Linking.openURL(`tel:${b.provider_mobileno}`)}
                    >
                      <Icon name="phone" size={16} color={colors.primary} />
                      <Text style={[styles.actionBtnText, { color: colors.primary }]}>Call</Text>
                    </TouchableOpacity>
                  ) : null}
                  {b.address ? (
                    <TouchableOpacity
                      style={[styles.actionBtn, { borderColor: colors.border }]}
                      onPress={() =>
                        Linking.openURL(
                          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address!)}`
                        )
                      }
                    >
                      <Icon name="map-marker" size={16} color={colors.primary} />
                      <Text style={[styles.actionBtnText, { color: colors.primary }]}>Map</Text>
                    </TouchableOpacity>
                  ) : null}
                  <TouchableOpacity
                    style={[styles.actionBtn, { borderColor: colors.border }]}
                    onPress={() => onOpenBooking(engId)}
                  >
                    <Icon name="eye-outline" size={16} color={colors.primary} />
                    <Text style={[styles.actionBtnText, { color: colors.primary }]}>View</Text>
                  </TouchableOpacity>
                </View>

                {sd === "IN_PROGRESS" && (
                  <View style={[styles.otpBox, { borderColor: colors.success + "40", backgroundColor: colors.success + "10" }]}>
                    <TouchableOpacity
                      style={[styles.otpBtn, { backgroundColor: colors.primary }]}
                      disabled={otpLoadingId === engId || !canOtp}
                      onPress={() => onGenerateOtp(b)}
                    >
                      {otpLoadingId === engId ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <Icon name="shield-key" size={18} color="#fff" />
                          <Text style={styles.otpBtnText}>Generate OTP</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    {otpActive && otp ? (
                      <View style={styles.otpDisplay}>
                        <Text style={[styles.otpLabel, { color: colors.textSecondary }]}>
                          Share with provider:
                        </Text>
                        <Text style={[styles.otpCode, { color: colors.text }]}>{otp}</Text>
                      </View>
                    ) : null}
                  </View>
                )}
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
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  title: { fontSize: 16, fontWeight: "700" },
  subtitle: { fontSize: 12, marginTop: 2 },
  body: { padding: 14, paddingTop: 8 },
  centered: { paddingVertical: 20, alignItems: "center" },
  emptyText: { textAlign: "center", fontSize: 14, paddingVertical: 16 },
  row: { paddingVertical: 12 },
  timeText: { fontSize: 14, fontWeight: "700" },
  serviceText: { fontSize: 14, fontWeight: "600", marginTop: 4 },
  metaText: { fontSize: 12, marginTop: 2 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8, alignItems: "center" },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  statusPillText: { fontSize: 11, fontWeight: "600" },
  hint: { fontSize: 12, marginTop: 8, lineHeight: 18 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 12, fontWeight: "600" },
  otpBox: { marginTop: 10, padding: 10, borderRadius: 10, borderWidth: 1 },
  otpBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
  },
  otpBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  otpDisplay: { marginTop: 10 },
  otpLabel: { fontSize: 12 },
  otpCode: { fontSize: 22, fontWeight: "800", letterSpacing: 4, marginTop: 4 },
});
