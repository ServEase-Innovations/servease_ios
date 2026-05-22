import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { SkeletonLoader } from "./SkeletonLoader";
import { useTheme } from "../Settings/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export const ProfileContentSkeleton: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={styles.wrap}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.cardHeader}>
          <SkeletonLoader width={140} height={24} variant="text" />
          <SkeletonLoader width={80} height={36} style={{ borderRadius: 20 }} />
        </View>

        <SkeletonLoader width={150} height={18} variant="text" style={styles.sectionTitle} />

        <View style={styles.fieldRow}>
          <View style={styles.fieldCol}>
            <SkeletonLoader width={72} height={14} variant="text" style={styles.fieldLabel} />
            <SkeletonLoader width="100%" height={44} style={{ borderRadius: 10 }} />
          </View>
          <View style={styles.fieldCol}>
            <SkeletonLoader width={72} height={14} variant="text" style={styles.fieldLabel} />
            <SkeletonLoader width="100%" height={44} style={{ borderRadius: 10 }} />
          </View>
        </View>

        <View style={styles.fieldRow}>
          <View style={styles.fieldCol}>
            <SkeletonLoader width={96} height={14} variant="text" style={styles.fieldLabel} />
            <SkeletonLoader width="100%" height={44} style={{ borderRadius: 10 }} />
          </View>
          <View style={styles.fieldCol}>
            <SkeletonLoader width={110} height={14} variant="text" style={styles.fieldLabel} />
            <SkeletonLoader width="100%" height={44} style={{ borderRadius: 10 }} />
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.addressHeader}>
          <SkeletonLoader width={120} height={18} variant="text" />
          <SkeletonLoader width={100} height={32} style={{ borderRadius: 8 }} />
        </View>

        <View style={[styles.addressCard, { borderColor: colors.border }]}>
          <SkeletonLoader width={80} height={18} variant="text" />
          <SkeletonLoader width="100%" height={16} style={{ marginTop: 12 }} />
          <SkeletonLoader width="85%" height={16} style={{ marginTop: 8 }} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    width: SCREEN_WIDTH,
  },
  card: {
    width: SCREEN_WIDTH - 32,
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "transparent",
  },
  sectionTitle: {
    marginBottom: 16,
  },
  fieldRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  fieldCol: {
    flex: 1,
    minWidth: 140,
  },
  fieldLabel: {
    marginBottom: 8,
  },
  divider: {
    height: 1,
    marginVertical: 20,
  },
  addressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  addressCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 16,
  },
});
