import React, { useRef } from "react";
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

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 200,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 8,
    }).start();
  };

  if (!visible) return null;

  const surfaceBg = isDarkMode ? colors.surface : "#FFFFFF";
  const titleColor = isDarkMode ? colors.textPrimary : "#1E293B";
  const mutedColor = isDarkMode ? colors.textSecondary : "#64748B";
  const dividerColor = isDarkMode ? colors.border : "#E2E8F0";

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel="First booking offer, 99 rupees with code NEWUSER"
      style={styles.container}
    >
      <Animated.View style={[styles.cardOuter, { transform: [{ scale: scaleAnim }] }]}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: surfaceBg,
              borderColor: isDarkMode ? colors.border : "#FDE68A",
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
                  <Text style={[styles.couponLabel, { color: mutedColor }]}>CODE</Text>
                  <Text style={styles.couponCode}>NEWUSER</Text>
                </View>
                <View style={styles.chevronBtn}>
                  <Icon name="arrow-forward" size={18} color="#EA580C" />
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
  },
  cardOuter: {
    width: "100%",
    borderRadius: 14,
    ...Platform.select({
      ios: {
        shadowColor: "#0f172a",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  card: {
    flexDirection: "row",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  accentBar: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  hotDealPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ACCENT.red,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  hotDealIcon: {
    fontSize: 10,
  },
  hotDealLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.6,
  },
  tapHint: {
    fontSize: 11,
    fontWeight: "500",
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
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
    marginBottom: 2,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  priceValue: {
    fontSize: 28,
    fontWeight: "800",
    color: ACCENT.red,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  priceSuffix: {
    fontSize: 14,
    fontWeight: "600",
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
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
    minWidth: 72,
  },
  couponLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  couponCode: {
    fontSize: 13,
    fontWeight: "800",
    color: "#92400E",
    letterSpacing: 1.2,
  },
  chevronBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFEDD5",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  termsRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  termsText: {
    fontSize: 10,
    lineHeight: 14,
    textAlign: "left",
  },
});

export default FirstBookingOffer;
