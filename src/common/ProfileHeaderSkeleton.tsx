import React from "react";
import { View, StyleSheet, Platform, StatusBar } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { SkeletonLoader } from "./SkeletonLoader";

export const ProfileHeaderSkeleton: React.FC = () => {
  return (
    <LinearGradient
      colors={["#0d1935", "#1c4485", "#255697"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.header}
    >
      <View style={styles.profileRow}>
        <SkeletonLoader width={64} height={64} variant="circular" tone="onDark" />
        <View style={styles.textCol}>
          <SkeletonLoader width={180} height={28} variant="text" tone="onDark" />
          <SkeletonLoader
            width={110}
            height={16}
            variant="text"
            tone="onDark"
            style={{ marginTop: 10 }}
          />
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40 + (StatusBar.currentHeight || 0),
    paddingBottom: 50,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    paddingHorizontal: 20,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  textCol: {
    flex: 1,
    gap: 4,
  },
});
