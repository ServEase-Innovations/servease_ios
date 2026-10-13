import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  useWindowDimensions,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useTheme } from "../Settings/ThemeContext";
import { FIRST_BOOKING_COUPON_CODES } from "../services/couponService";

interface FirstBookingOfferProps {
  onPress: () => void;
  visible?: boolean;
}

const ACCENT = {
  gold: "#F59E0B",
  goldLight: "#FEF3C7",
  red: "#DC2626",
  redSoft: "#FEE2E2",
};

const FirstBookingOffer: React.FC<FirstBookingOfferProps> = ({
  onPress,
  visible = true,
}) => {
  const { isDarkMode } = useTheme();
  const { width } = useWindowDimensions();
  const isCompactLayout = width < 480;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible, pulseAnim]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 12,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 12,
    }).start();
  };

  if (!visible) return null;

  const mutedColor = isDarkMode ? "#E5D3A8" : "#5B4A2A";

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={`First booking offer, 99 rupees with codes ${FIRST_BOOKING_COUPON_CODES.MAID} and ${FIRST_BOOKING_COUPON_CODES.COOK}`}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.cardOuter,
          { transform: [{ scale: scaleAnim }, { scale: pulseAnim }] },
        ]}
      >
        <LinearGradient
          colors={["#FBE7B8", "#F3CF86"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.topRow}>
            <Text style={styles.hotDealLabel}>EXCLUSIVE HOT DEAL</Text>
            <Text style={styles.hotDealIcon}>🔥</Text>
          </View>

          <View
            style={[styles.mainRow, isCompactLayout && styles.mainRowCompact]}
          >
            <View style={styles.offerBlock}>
              <Text
                style={[
                  styles.eyebrow,
                  isCompactLayout && styles.eyebrowCompact,
                ]}
              >
                First Booking
              </Text>
              <Text
                style={[
                  styles.priceValue,
                  isCompactLayout && styles.priceValueCompact,
                ]}
              >
                ₹99 flat
              </Text>
            </View>

            {!isCompactLayout ? (
              <View style={styles.couponChip}>
                <Text style={styles.couponCode}>
                  {FIRST_BOOKING_COUPON_CODES.MAID}
                </Text>
                <Text style={styles.couponCode}>
                  &amp; {FIRST_BOOKING_COUPON_CODES.COOK}
                </Text>
              </View>
            ) : null}

            <LinearGradient
              colors={["#FB923C", "#F97316"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.tapBtn}
            >
              <Text style={styles.tapBtnText}>Tap to Book</Text>
              <Icon name="arrow-forward" size={16} color="#FFFFFF" />
            </LinearGradient>
          </View>

          {isCompactLayout ? (
            <View style={[styles.couponChip, styles.couponChipCompact]}>
              <Text style={styles.couponCode}>
                {FIRST_BOOKING_COUPON_CODES.MAID}
              </Text>
              <Text style={styles.couponCode}>
                &amp; {FIRST_BOOKING_COUPON_CODES.COOK}
              </Text>
            </View>
          ) : null}

          <Text style={[styles.termsText, { color: mutedColor }]}>
            T&C apply • Valid on first booking only
          </Text>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingVertical: 8,
  },
  cardOuter: {
    width: "100%",
    borderRadius: 18,
    ...Platform.select({
      ios: {
        shadowColor: "#F59E0B",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: { elevation: 6, shadowColor: "#F59E0B" },
    }),
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(217, 160, 60, 0.55)",
    paddingVertical: 12,
    paddingHorizontal: 14,
    overflow: "hidden",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  hotDealIcon: { fontSize: 16 },
  hotDealLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#1F1A10",
    letterSpacing: 0.2,
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  mainRowCompact: {
    justifyContent: "space-between",
  },
  offerBlock: { flexShrink: 1 },
  eyebrow: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F1A10",
  },
  eyebrowCompact: {
    fontSize: 16,
  },
  priceValue: {
    fontSize: 30,
    fontWeight: "800",
    color: "#1F1A10",
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  priceValueCompact: {
    fontSize: 26,
    lineHeight: 32,
  },
  couponChip: {
    backgroundColor: "rgba(255, 244, 214, 0.7)",
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#C9A24E",
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: "center",
    flexShrink: 1,
  },
  couponChipCompact: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
    alignSelf: "stretch",
  },
  couponCode: {
    fontSize: 12,
    fontWeight: "800",
    color: "#1F1A10",
    letterSpacing: 0.2,
  },
  tapBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 24,
    flexShrink: 0,
    shadowColor: "#F97316",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  tapBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  termsText: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 16,
    textAlign: "center",
    fontWeight: "500",
  },
});

export default FirstBookingOffer;
