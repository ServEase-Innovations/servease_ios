import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import { BRAND } from "../theme/brandColors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const GRID_PADDING = 20;
const GRID_GAP = 12;
export const METRIC_CARD_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;
export const METRIC_CARD_HEIGHT = 132;

export type MetricIcon = "rupee" | "shield" | "credit-card" | "wallet";
export type MetricVariant = "earnings" | "deposit" | "withdrawn" | "balance";

interface DashboardMetricCardProps {
  title: string;
  value: string;
  icon: MetricIcon;
  variant: MetricVariant;
  hint?: string;
  hintVariant?: "default" | "success" | "warning" | "danger";
  highlighted?: boolean;
  onPress?: () => void;
}

const ICON_NAME: Record<MetricIcon, string> = {
  rupee: "payments",
  shield: "lock-outline",
  "credit-card": "account-balance-wallet",
  wallet: "savings",
};

const ICON_COLORS: Record<MetricVariant, { bg: string; color: string }> = {
  earnings: { bg: "#e8f1ff", color: BRAND.accent },
  deposit: { bg: "#fee2e2", color: "#dc2626" },
  withdrawn: { bg: "#f1f5f9", color: "#64748b" },
  balance: { bg: "rgba(255,255,255,0.15)", color: "#ffffff" },
};

export function DashboardMetricCard({
  title,
  value,
  icon,
  variant,
  hint = "",
  hintVariant = "default",
  highlighted = false,
  onPress,
}: DashboardMetricCardProps) {
  const iconTheme = ICON_COLORS[variant];
  const isPending = hintVariant === "warning" && hint.toUpperCase() === "PENDING";

  const content = (
    <View
      style={[
        styles.card,
        highlighted ? styles.cardHighlighted : styles.cardDefault,
      ]}
    >
      <View
        style={[
          styles.iconBadge,
          { backgroundColor: highlighted ? iconTheme.bg : iconTheme.bg },
        ]}
      >
        <MaterialIcon
          name={ICON_NAME[icon]}
          size={22}
          color={highlighted ? iconTheme.color : iconTheme.color}
        />
      </View>
      <Text
        style={[styles.title, highlighted && styles.titleHighlighted]}
        numberOfLines={1}
      >
        {title}
      </Text>
      <Text
        style={[styles.value, highlighted && styles.valueHighlighted]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
      >
        {value}
      </Text>
      {hint ? (
        <Text
          style={[
            styles.hint,
            highlighted && styles.hintHighlighted,
            isPending && styles.hintPending,
            hintVariant === "success" && styles.hintSuccess,
          ]}
          numberOfLines={1}
        >
          {hint.toUpperCase()}
        </Text>
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        activeOpacity={0.88}
        accessibilityRole="button"
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.container}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    width: METRIC_CARD_WIDTH,
    height: METRIC_CARD_HEIGHT,
  },
  card: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    justifyContent: "space-between",
  },
  cardDefault: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e8edf4",
    shadowColor: "#0c1e3d",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHighlighted: {
    backgroundColor: BRAND.bookingNavy,
    shadowColor: BRAND.bookingNavy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: "600",
    color: BRAND.textMuted,
    marginBottom: 2,
  },
  titleHighlighted: {
    color: "rgba(255,255,255,0.75)",
  },
  value: {
    fontSize: 20,
    fontWeight: "800",
    color: BRAND.text,
    letterSpacing: -0.4,
  },
  valueHighlighted: {
    color: "#ffffff",
  },
  hint: {
    fontSize: 10,
    fontWeight: "700",
    color: BRAND.textMuted,
    letterSpacing: 0.4,
    marginTop: 2,
  },
  hintHighlighted: {
    color: "rgba(255,255,255,0.65)",
  },
  hintPending: {
    color: "#fca5a5",
  },
  hintSuccess: {
    color: "#6ee7b7",
  },
});
