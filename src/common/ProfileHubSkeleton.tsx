import React from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SkeletonLoader } from "./SkeletonLoader";
import { useTheme } from "../Settings/ThemeContext";

export const ProfileHubSkeleton: React.FC = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 8) }]}>
        <SkeletonLoader width={36} height={36} variant="circular" />
        <SkeletonLoader width={80} height={20} variant="text" />
        <View style={styles.topBarSpacer} />
      </View>

      <View style={styles.identity}>
        <SkeletonLoader width={108} height={108} variant="circular" />
        <SkeletonLoader width={180} height={22} variant="text" style={{ marginTop: 12 }} />
        <SkeletonLoader width={120} height={16} variant="text" style={{ marginTop: 8 }} />
        <SkeletonLoader width={160} height={44} style={{ marginTop: 14, borderRadius: 12 }} />
      </View>

      <View style={[styles.menuBlock, { borderTopColor: colors.border }]}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.menuRow, { borderBottomColor: colors.border }]}>
            <SkeletonLoader width={22} height={22} variant="circular" />
            <SkeletonLoader width={140} height={16} variant="text" style={{ marginLeft: 14 }} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  topBarSpacer: {
    width: 36,
  },
  identity: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
  },
  menuBlock: {
    marginTop: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
