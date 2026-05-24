import React from "react";
import { View, Text, StyleSheet } from "react-native";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import Icon from "react-native-vector-icons/FontAwesome";

export type MetricIcon =
  | "rupee"
  | "shield"
  | "credit-card"
  | "wallet"
  | "calendar"
  | "star"
  | "trending-up"
  | "users"
  | "clock"
  | "home"
  | "bell";

interface DashboardMetricCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: MetricIcon;
  description?: string;
}

export function DashboardMetricCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon,
  description,
}: DashboardMetricCardProps) {
  const changeBadgeStyle =
    changeType === "positive"
      ? styles.changePositive
      : changeType === "negative"
        ? styles.changeNegative
        : styles.changeNeutral;
  const changeTextColor =
    changeType === "positive"
      ? "#065f46"
      : changeType === "negative"
        ? "#9f1239"
        : "#475569";

  const renderIcon = () => {
    const color = "#0369a1";
    const size = 22;
    switch (icon) {
      case "rupee":
        return <MaterialIcon name="currency-rupee" size={size} color={color} />;
      case "shield":
        return <MaterialIcon name="security" size={size} color={color} />;
      case "credit-card":
        return <MaterialIcon name="credit-card" size={size} color={color} />;
      case "wallet":
        return <MaterialIcon name="account-balance-wallet" size={size} color={color} />;
      case "calendar":
        return <Icon name="calendar" size={size} color={color} />;
      case "star":
        return <Icon name="star" size={size} color={color} />;
      case "trending-up":
        return <MaterialIcon name="trending-up" size={size} color={color} />;
      case "users":
        return <Icon name="users" size={size} color={color} />;
      case "clock":
        return <Icon name="clock-o" size={size} color={color} />;
      case "home":
        return <Icon name="home" size={size} color={color} />;
      default:
        return <MaterialIcon name="info" size={size} color={color} />;
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.textBlock}>
          <Text style={styles.title}>{title.toUpperCase()}</Text>
          <View style={styles.valueRow}>
            <Text style={styles.value} numberOfLines={1}>
              {value}
            </Text>
            {change ? (
              <View style={[styles.changeBadge, changeBadgeStyle]}>
                <Text style={[styles.changeText, { color: changeTextColor }]}>{change}</Text>
              </View>
            ) : null}
          </View>
          {description ? <Text style={styles.description}>{description}</Text> : null}
        </View>
        <View style={styles.iconWrap}>{renderIcon()}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "48%",
    marginBottom: 12,
    backgroundColor: "#ffffff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.95)",
    padding: 14,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  textBlock: { flex: 1, paddingRight: 8 },
  title: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "#64748b",
    marginBottom: 6,
  },
  valueRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6 },
  value: { fontSize: 20, fontWeight: "700", color: "#0f172a" },
  changeBadge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
  },
  changePositive: { backgroundColor: "#d1fae5", borderColor: "#a7f3d0" },
  changeNegative: { backgroundColor: "#ffe4e6", borderColor: "#fecdd3" },
  changeNeutral: { backgroundColor: "#f1f5f9", borderColor: "#e2e8f0" },
  changeText: { fontSize: 10, fontWeight: "600" },
  description: { fontSize: 11, color: "#64748b", marginTop: 6 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(224, 242, 254, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(186, 230, 253, 0.8)",
  },
});
