import React, { useRef, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import { useTheme } from "../Settings/ThemeContext";
import { BRAND } from "../theme/brandColors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export type MetricIcon = "rupee" | "shield" | "credit-card" | "wallet";
export type MetricVariant = "earnings" | "deposit" | "withdrawn" | "balance";

const GRID_PADDING = 12;
const GRID_GAP = 10;
export const METRIC_CARD_WIDTH =
  (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;
export const METRIC_CARD_HEIGHT = 178;

interface DashboardMetricCardProps {
  title: string;
  value: string;
  icon: MetricIcon;
  variant: MetricVariant;
  hint?: string;
  hintVariant?: "default" | "success" | "warning" | "danger";
  valueTone?: "default" | "negative" | "positive";
}

const ICON_NAME: Record<MetricIcon, string> = {
  rupee: "currency-rupee",
  shield: "verified-user",
  "credit-card": "payments",
  wallet: "account-balance-wallet",
};

type VariantAccent = {
  accent: string;
  iconBg: string;
  iconColor: string;
};

const VARIANT_ACCENT: Record<MetricVariant, VariantAccent> = {
  earnings: {
    accent: BRAND.accent,
    iconBg: BRAND.accentSoft,
    iconColor: BRAND.accent,
  },
  deposit: {
    accent: BRAND.accentDark,
    iconBg: "#dbeafe",
    iconColor: BRAND.accentDark,
  },
  withdrawn: {
    accent: BRAND.logoLight,
    iconBg: BRAND.accentSoft,
    iconColor: BRAND.logoDark,
  },
  balance: {
    accent: BRAND.bookingSky,
    iconBg: "#dbeafe",
    iconColor: BRAND.accentDark,
  },
};

function getHintIcon(variant: DashboardMetricCardProps["hintVariant"]) {
  switch (variant) {
    case "success":
      return "check-circle";
    case "warning":
      return "schedule";
    case "danger":
      return "error-outline";
    default:
      return null;
  }
}

export function DashboardMetricCard({
  title,
  value,
  icon,
  variant,
  hint = "",
  hintVariant = "default",
  valueTone = "default",
}: DashboardMetricCardProps) {
  const { colors, isDarkMode } = useTheme();
  const scaleAnim = useRef(new Animated.Value(0.97)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 9,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const variantAccent = VARIANT_ACCENT[variant];
  const isNegativeBalance = valueTone === "negative" && variant === "balance";

  const cardTheme = useMemo(() => {
    if (isNegativeBalance) {
      return {
        cardBg: isDarkMode ? "rgba(127, 29, 29, 0.35)" : colors.errorLight,
        border: isDarkMode ? "#991b1b" : "#fecaca",
        accent: colors.error,
        iconBg: isDarkMode ? "rgba(127, 29, 29, 0.5)" : "#ffe4e6",
        iconColor: colors.errorDark,
        valueColor: colors.error,
      };
    }

    return {
      cardBg: isDarkMode ? colors.surface : BRAND.accentSoft,
      border: isDarkMode ? colors.border : BRAND.line,
      accent: variantAccent.accent,
      iconBg: isDarkMode ? "rgba(25, 63, 121, 0.35)" : variantAccent.iconBg,
      iconColor: isDarkMode ? BRAND.bookingSky : variantAccent.iconColor,
      valueColor: colors.textPrimary,
    };
  }, [colors, isDarkMode, isNegativeBalance, variantAccent]);

  const hintStyle = useMemo(() => {
    switch (hintVariant) {
      case "success":
        return {
          bg: isDarkMode ? "rgba(16, 185, 129, 0.2)" : colors.successLight,
          text: isDarkMode ? colors.success : colors.successDark,
          border: isDarkMode ? colors.success : "#a7f3d0",
        };
      case "warning":
        return {
          bg: isDarkMode ? "rgba(245, 158, 11, 0.2)" : colors.warningLight,
          text: isDarkMode ? colors.warning : colors.warningDark,
          border: isDarkMode ? colors.warning : "#fde68a",
        };
      case "danger":
        return {
          bg: isDarkMode ? "rgba(239, 68, 68, 0.2)" : colors.errorLight,
          text: isDarkMode ? "#fca5a5" : colors.errorDark,
          border: isDarkMode ? colors.error : "#fecaca",
        };
      default:
        return null;
    }
  }, [colors, hintVariant, isDarkMode]);

  const hintIcon = getHintIcon(hintVariant);
  const showHintPill = hintVariant !== "default" && hint.length > 0;

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: cardTheme.cardBg,
            borderColor: cardTheme.border,
          },
        ]}
      >
        <View style={[styles.accentBar, { backgroundColor: cardTheme.accent }]} />

        <View style={styles.cardBody}>
          <View style={styles.topRow}>
            <View style={[styles.iconBadge, { backgroundColor: cardTheme.iconBg }]}>
              <MaterialIcon name={ICON_NAME[icon]} size={20} color={cardTheme.iconColor} />
            </View>
            <Text style={[styles.title, { color: colors.textSecondary }]} numberOfLines={2}>
              {title}
            </Text>
          </View>

          <Text
            style={[styles.value, { color: cardTheme.valueColor }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
          >
            {value}
          </Text>

          <View style={styles.footerSlot}>
            {showHintPill && hintStyle ? (
              <View
                style={[
                  styles.hintPill,
                  {
                    backgroundColor: hintStyle.bg,
                    borderColor: hintStyle.border,
                  },
                ]}
              >
                {hintIcon ? (
                  <MaterialIcon name={hintIcon} size={12} color={hintStyle.text} />
                ) : null}
                <Text
                  style={[styles.hintPillText, { color: hintStyle.text }]}
                  numberOfLines={1}
                >
                  {hint}
                </Text>
              </View>
            ) : (
              <Text style={[styles.hintCaption, { color: colors.textTertiary }]} numberOfLines={2}>
                {hint || "\u00A0"}
              </Text>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: METRIC_CARD_WIDTH,
    height: METRIC_CARD_HEIGHT,
  },
  card: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: BRAND.bookingNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  accentBar: {
    height: 3,
    width: "100%",
  },
  cardBody: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    justifyContent: "space-between",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 40,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  title: {
    flex: 1,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
    lineHeight: 15,
  },
  value: {
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 28,
    marginTop: 4,
    marginBottom: 4,
  },
  footerSlot: {
    minHeight: 28,
    justifyContent: "flex-end",
  },
  hintCaption: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "500",
  },
  hintPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    maxWidth: "100%",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  hintPillText: {
    flexShrink: 1,
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 13,
  },
});
