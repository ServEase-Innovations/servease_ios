/* eslint-disable */
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Platform,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import LinearGradient from "react-native-linear-gradient";
import { BRAND } from "../theme/brandColors";
import { GRADIENTS } from "../theme/brandColors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DIALOG_WIDTH = Math.min(SCREEN_WIDTH * 0.9, 400);

interface BookingSuccessDialogProps {
  visible: boolean;
  onClose: () => void;
  bookingDetails?: {
    providerName?: string;
    serviceType?: string;
    totalAmount?: number;
    bookingDate?: string;
    persons?: number;
  };
  message?: string;
  onRedirectToBookings?: () => void;
  onNavigateToBookings?: () => void;
}

function formatCompactDate(dateString?: string): string {
  if (!dateString) return "—";
  try {
    const d = new Date(dateString.includes("T") ? dateString : `${dateString}T12:00:00`);
    if (Number.isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

function formatInrAmount(amount?: number): string {
  if (amount == null || !Number.isFinite(amount)) return "—";
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

function DetailRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text
        style={[styles.detailValue, highlight && styles.detailValueHighlight]}
        numberOfLines={3}
      >
        {value}
      </Text>
    </View>
  );
}

const BookingSuccessDialog: React.FC<BookingSuccessDialogProps> = ({
  visible,
  onClose,
  bookingDetails,
  message = "Your booking is confirmed. Payment was successful.",
  onRedirectToBookings,
  onNavigateToBookings,
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;

  const goToBookings = useCallback(() => {
    setShowConfetti(false);
    if (onNavigateToBookings) {
      onNavigateToBookings();
      return;
    }
    if (onRedirectToBookings) {
      onRedirectToBookings();
      return;
    }
    onClose();
  }, [onNavigateToBookings, onRedirectToBookings, onClose]);

  useEffect(() => {
    if (!visible) {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.92);
      progressAnim.setValue(1);
      return;
    }

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 50, useNativeDriver: true }),
    ]).start();

    Animated.sequence([
      Animated.timing(bounceAnim, { toValue: -6, duration: 180, useNativeDriver: true }),
      Animated.timing(bounceAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();

    setShowConfetti(true);
    Animated.timing(progressAnim, { toValue: 0, duration: 6500, useNativeDriver: false }).start();

    const confettiOff = setTimeout(() => setShowConfetti(false), 5500);
    const autoNav = setTimeout(() => goToBookings(), 6500);

    return () => {
      clearTimeout(confettiOff);
      clearTimeout(autoNav);
      progressAnim.stopAnimation();
    };
  }, [visible, fadeAnim, scaleAnim, bounceAnim, progressAnim, goToBookings]);

  if (!visible) return null;

  const providerDisplay =
    bookingDetails?.providerName?.trim() ||
    "Provider will be assigned after payment";
  const showPersons =
    bookingDetails?.persons != null && Number(bookingDetails.persons) > 1;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={goToBookings}>
      <View style={styles.overlay}>
        {showConfetti && (
          <View style={styles.confettiLayer} pointerEvents="none">
            {Array.from({ length: 36 }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.confettiDot,
                  {
                    left: ((i * 41) % 320) + 24,
                    top: ((i * 67) % 500) + 40,
                    backgroundColor:
                      ["#FFD700", "#4CAF50", "#60a5fa", "#f472b6", "#a78bfa"][i % 5],
                  },
                ]}
              />
            ))}
          </View>
        )}

        <Animated.View
          style={[
            styles.dialogCard,
            { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
          ]}
        >
          <LinearGradient
            colors={[...GRADIENTS.success]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            <View style={styles.countdownWrap}>
              <Animated.View
                style={[
                  styles.countdownFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, DIALOG_WIDTH],
                    }),
                  },
                ]}
              />
            </View>

            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <Animated.View style={[styles.iconWrap, { transform: [{ translateY: bounceAnim }] }]}>
                <View style={styles.iconCircle}>
                  <Icon name="check-circle" size={52} color="#22c55e" />
                </View>
              </Animated.View>

              <Text style={styles.title}>Booking confirmed</Text>
              <Text style={styles.subtitle}>{message}</Text>

              {bookingDetails ? (
                <View style={styles.detailBox}>
                  <DetailRow label="Service" value={bookingDetails.serviceType || "—"} />
                  <DetailRow label="Provider" value={providerDisplay} />
                  {bookingDetails.bookingDate ? (
                    <DetailRow
                      label="Date"
                      value={formatCompactDate(bookingDetails.bookingDate)}
                    />
                  ) : null}
                  {showPersons ? (
                    <DetailRow
                      label="Persons"
                      value={String(bookingDetails.persons)}
                    />
                  ) : null}
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total paid</Text>
                    <Text style={styles.totalValue}>
                      {formatInrAmount(bookingDetails.totalAmount)}
                    </Text>
                  </View>
                </View>
              ) : null}

              <Text style={styles.hint}>A confirmation email will be sent shortly.</Text>
              <Text style={styles.redirectHint}>
                Opening My Bookings in a few seconds…
              </Text>

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={goToBookings}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="View my bookings"
              >
                <Text style={styles.primaryBtnText}>View My Bookings</Text>
                <Icon name="arrow-forward" size={18} color="#1d4ed8" />
              </TouchableOpacity>
            </ScrollView>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.78)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  confettiLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  confettiDot: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 3,
    opacity: 0.35,
  },
  dialogCard: {
    width: DIALOG_WIDTH,
    maxHeight: "88%",
    borderRadius: 20,
    overflow: "hidden",
    zIndex: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 24,
      },
      android: { elevation: 16 },
    }),
  },
  gradient: {
    position: "relative",
    overflow: "hidden",
  },
  countdownWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  countdownFill: {
    height: 4,
    backgroundColor: "#fbbf24",
    borderBottomLeftRadius: 20,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: "center",
  },
  iconWrap: {
    marginBottom: 14,
  },
  iconCircle: {
    backgroundColor: "#fff",
    borderRadius: 40,
    padding: 6,
    ...Platform.select({
      ios: {
        shadowColor: "#22c55e",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }),
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.92)",
    textAlign: "center",
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  detailBox: {
    alignSelf: "stretch",
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    marginBottom: 14,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
    lineHeight: 21,
  },
  detailValueHighlight: {
    color: "#fde68a",
  },
  totalRow: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.22)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fde047",
  },
  hint: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    marginBottom: 4,
  },
  redirectHint: {
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
    fontStyle: "italic",
    textAlign: "center",
    marginBottom: 14,
  },
  primaryBtn: {
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: BRAND.accent,
  },
});

export default BookingSuccessDialog;
