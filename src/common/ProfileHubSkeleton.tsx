import React from "react";
import { View, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SkeletonLoader } from "./SkeletonLoader";
import { HOME_M3 } from "../theme/brandColors";

export const ProfileHubSkeleton: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navTop = Math.max(insets.top, 8);

  return (
    <View style={[styles.wrap, { backgroundColor: HOME_M3.surface }]}>
      <View style={[styles.navBar, { paddingTop: navTop }]}>
        <SkeletonLoader width={36} height={36} variant="circular" />
        <SkeletonLoader width={80} height={22} variant="text" />
        <View style={styles.topBarSpacer} />
      </View>

      <View style={styles.hero}>
        <SkeletonLoader width={128} height={128} variant="circular" />
        <SkeletonLoader width={200} height={28} variant="text" style={{ marginTop: 16 }} />
        <SkeletonLoader width={120} height={16} variant="text" style={{ marginTop: 8 }} />
        <SkeletonLoader width={280} height={72} style={{ marginTop: 24, borderRadius: 12 }} />
        <SkeletonLoader width={160} height={44} style={{ marginTop: 24, borderRadius: 12 }} />
      </View>

      <View style={styles.sheet}>
        <SkeletonLoader width="100%" height={56} style={{ borderRadius: 12, marginBottom: 12 }} />
        <SkeletonLoader width="100%" height={56} style={{ borderRadius: 12, marginBottom: 12 }} />
        <SkeletonLoader width="100%" height={88} style={{ borderRadius: 12, marginBottom: 12 }} />
        <SkeletonLoader width="100%" height={120} style={{ borderRadius: 12 }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 4,
    backgroundColor: HOME_M3.primary,
  },
  topBarSpacer: {
    width: 36,
  },
  hero: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 48,
    paddingHorizontal: 16,
    backgroundColor: HOME_M3.primaryContainer,
  },
  sheet: {
    marginTop: -24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: HOME_M3.surfaceContainerLowest,
    paddingTop: 32,
    paddingHorizontal: 16,
    flex: 1,
  },
});
