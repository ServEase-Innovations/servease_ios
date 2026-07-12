import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Animated,
  ViewStyle,
  DimensionValue,
  StyleProp,
} from "react-native";
import { useTheme } from "../Settings/ThemeContext";

interface SkeletonLoaderProps {
  width?: DimensionValue;
  height?: DimensionValue;
  style?: StyleProp<ViewStyle>;
  variant?: "rectangular" | "circular" | "text";
  /** Lighter bones for dark/colored backgrounds (e.g. profile header gradient). */
  tone?: "default" | "onDark";
}

const PULSE_MIN = 0.38;
const PULSE_MAX = 1;
const PULSE_DURATION = 680;

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = "100%",
  height = 16,
  style,
  variant = "rectangular",
  tone = "default",
}) => {
  const { isDarkMode } = useTheme();
  const pulse = useRef(new Animated.Value(PULSE_MIN)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: PULSE_MAX,
          duration: PULSE_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: PULSE_MIN,
          duration: PULSE_DURATION,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const borderRadius =
    variant === "circular" ? 9999 : variant === "text" ? 6 : 8;
  const boneColor =
    tone === "onDark"
      ? "rgba(255, 255, 255, 0.35)"
      : isDarkMode
        ? "#334155"
        : "#e2e8f0";

  return (
    <View
      style={[
        styles.shell,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.bone,
          {
            backgroundColor: boneColor,
            borderRadius,
            opacity: pulse,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  shell: {
    overflow: "hidden",
  },
  bone: {
    flex: 1,
  },
});
