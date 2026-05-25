import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet, Animated, Dimensions } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";
import Icon from "react-native-vector-icons/FontAwesome";

const { width } = Dimensions.get("window");

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
  // Animation values
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getChangeBadgeStyle = () => {
    switch (changeType) {
      case "positive":
        return styles.changePositive;
      case "negative":
        return styles.changeNegative;
      default:
        return styles.changeNeutral;
    }
  };

  const getChangeTextColor = () => {
    switch (changeType) {
      case "positive":
        return "#065f46";
      case "negative":
        return "#9f1239";
      default:
        return "#475569";
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case "positive":
        return <MaterialIcon name="arrow-upward" size={10} color="#065f46" />;
      case "negative":
        return <MaterialIcon name="arrow-downward" size={10} color="#9f1239" />;
      default:
        return null;
    }
  };

  const renderIcon = () => {
    const size = 22;
    const iconMap: Record<MetricIcon, React.ReactNode> = {
      rupee: <MaterialIcon name="currency-rupee" size={size} color="#ffffff" />,
      shield: <MaterialIcon name="security" size={size} color="#ffffff" />,
      "credit-card": <MaterialIcon name="credit-card" size={size} color="#ffffff" />,
      wallet: <MaterialIcon name="account-balance-wallet" size={size} color="#ffffff" />,
      calendar: <Icon name="calendar" size={size} color="#ffffff" />,
      star: <Icon name="star" size={size} color="#ffffff" />,
      "trending-up": <MaterialIcon name="trending-up" size={size} color="#ffffff" />,
      users: <Icon name="users" size={size} color="#ffffff" />,
      clock: <Icon name="clock-o" size={size} color="#ffffff" />,
      home: <Icon name="home" size={size} color="#ffffff" />,
      bell: <MaterialIcon name="notifications" size={size} color="#ffffff" />,
    };
    return iconMap[icon] || <MaterialIcon name="info" size={size} color="#ffffff" />;
  };

  // Determine gradient based on title for subtle variation
  const getGradientColors = () => {
    if (title === "Total Earnings") {
      return ["#1e3a5f", "#1e40af"];
    }
    if (title === "Security Deposit") {
      return ["#1e3a5f", "#1e40af"];
    }
    if (title === "Total Withdrawn") {
      return ["#1e3a5f", "#1e40af"];
    }
    if (title === "Available Balance") {
      return ["#1e3a5f", "#1e40af"];
    }
    return ["#1e3a5f", "#1e40af"];
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.topRow}>
          <Text style={styles.title}>{title.toUpperCase()}</Text>
          <View style={styles.iconWrapper}>{renderIcon()}</View>
        </View>

        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>

        <View style={styles.bottomRow}>
          {change && (
            <View style={[styles.changeBadge, getChangeBadgeStyle()]}>
              {getChangeIcon()}
              <Text style={[styles.changeText, { color: getChangeTextColor() }]}>
                {change}
              </Text>
            </View>
          )}
          {description && <Text style={styles.description}>{description}</Text>}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "48%",
    marginBottom: 12,
  },
  card: {
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "rgba(255,255,255,0.7)",
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    fontSize: 22,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  changeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  changePositive: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  changeNegative: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  changeNeutral: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  changeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  description: {
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
    flex: 1,
    textAlign: "right",
  },
});