import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
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
  const { colors, isDarkMode } = useTheme();
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
          })
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

  const surfaceBg = isDarkMode ? colors.surface : "#FFFFFF";
  const mutedColor = isDarkMode ? colors.textSecondary : "#64748B";
  const dividerColor = isDarkMode ? colors.border : "#E2E8F0";

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
      <Animated.View style={[styles.cardOuter, { transform: [{ scale: scaleAnim }, { scale: pulseAnim }] }]}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: surfaceBg,
              borderColor: isDarkMode ? "rgba(253, 230, 138, 0.2)" : "rgba(253, 230, 138, 0.6)",
            },
          ]}
        >
          <LinearGradient
            colors={["#F59E0B", "#EA580C"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.accentBar}
          />

          <View style={styles.cardBody}>
            <View style={styles.topRow}>
              <View style={styles.hotDealPill}>
                <Text style={styles.hotDealIcon}>🔥</Text>
                <Text style={styles.hotDealLabel}>HOT DEAL</Text>
              </View>
              <Text style={[styles.tapHint, { color: mutedColor }]}>Tap to book</Text>
            </View>

            <View style={styles.mainRow}>
              <View style={styles.offerBlock}>
                <Text style={[styles.eyebrow, { color: mutedColor }]}>First booking</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.priceValue}>₹99</Text>
                  <Text style={[styles.priceSuffix, { color: mutedColor }]}>flat</Text>
                </View>
              </View>

              <View style={styles.actionBlock}>
                <View style={styles.couponChip}>
                  <Text style={[styles.couponLabel, { color: mutedColor }]}>CODES</Text>
                  <Text style={styles.couponCode}>{FIRST_BOOKING_COUPON_CODES.MAID}</Text>
                  <Text style={[styles.couponCode, styles.couponCodeSecondary]}>
                    {FIRST_BOOKING_COUPON_CODES.COOK}
                  </Text>
                </View>
                <View style={styles.chevronBtn}>
                  <Icon name="arrow-forward" size={20} color="#EA580C" />
                </View>
              </View>
            </View>

            <View style={[styles.termsRow, { borderTopColor: dividerColor }]}>
              <Text style={[styles.termsText, { color: mutedColor }]}>
                T&C apply · Valid on first booking only
              </Text>
            </View>
          </View>
        </View>
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
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#F59E0B",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: { elevation: 8, shadowColor: "#F59E0B" },
    }),
  },
  card: {
    flexDirection: "row",
    borderRadius: 20,
    borderWidth: 1.5,
    overflow: "hidden",
  },
  accentBar: {
    width: 6,
  },
  cardBody: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  hotDealPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ACCENT.red,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  hotDealIcon: {
    fontSize: 12,
  },
  hotDealLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.8,
  },
  tapHint: {
    fontSize: 12,
    fontWeight: "600",
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  offerBlock: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "capitalize",
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  priceValue: {
    fontSize: 34,
    fontWeight: "800",
    color: ACCENT.red,
    lineHeight: 38,
    letterSpacing: -1,
  },
  priceSuffix: {
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 6,
    marginBottom: 4,
  },
  actionBlock: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
  },
  couponChip: {
    backgroundColor: ACCENT.goldLight,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
    minWidth: 76,
  },
  couponLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 2,
  },
  couponCode: {
    fontSize: 12,
    fontWeight: "800",
    color: "#92400E",
    letterSpacing: 0.8,
  },
  couponCodeSecondary: {
    marginTop: 2,
  },
  chevronBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFEDD5",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 12,
  },
  termsRow: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  termsText: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: "left",
    fontWeight: "500",
  },
});

export default FirstBookingOffer;
