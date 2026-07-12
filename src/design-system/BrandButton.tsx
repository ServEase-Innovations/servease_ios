import React from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { BRAND } from "../theme/brandColors";
import { useTheme } from "../Settings/ThemeContext";

/** Matches servase-ui MaidBtnPrimary / MaidBtnGhost */
export const PRIMARY_BUTTON_GRADIENT = [BRAND.accent, "#2563eb"] as const;

export type BrandButtonVariant = "primary" | "ghost" | "outline";
export type BrandButtonSize = "medium" | "small";

export interface BrandButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: BrandButtonVariant;
  size?: BrandButtonSize;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  /** flex for the button container (web: primary flex 1, ghost flex 0) */
  flex?: number;
  /** stretch to parent width (stacked forms) */
  fullWidth?: boolean;
  accessibilityLabel?: string;
}

export function BrandButton({
  children,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  style,
  textStyle,
  flex,
  fullWidth = false,
  accessibilityLabel,
}: BrandButtonProps) {
  const { colors, isDarkMode } = useTheme();
  const isDisabled = disabled || loading;
  const sizeStyles = size === "small" ? styles.sizeSmall : styles.sizeMedium;
  const label =
    typeof children === "string" ? (
      <Text
        style={[
          styles.label,
          sizeStyles.label,
          variant === "primary" ? styles.labelPrimary : styles.labelGhost,
          isDarkMode && variant !== "primary" && { color: colors.text },
          isDisabled && variant === "primary" && styles.labelPrimaryDisabled,
          textStyle,
        ]}
        numberOfLines={1}
      >
        {children}
      </Text>
    ) : (
      children
    );

  const containerFlex = flex ?? (variant === "primary" ? 1 : 0);
  const minTouchStyle: ViewStyle = {
    flex: fullWidth ? undefined : containerFlex,
    alignSelf: fullWidth ? "stretch" : undefined,
    width: fullWidth ? "100%" : undefined,
    minWidth: variant === "ghost" && !fullWidth ? undefined : 0,
    opacity: isDisabled && variant !== "primary" ? 0.5 : 1,
  };

  if (variant === "outline") {
    return (
      <TouchableOpacity
        accessibilityLabel={accessibilityLabel}
        disabled={isDisabled}
        onPress={onPress}
        activeOpacity={0.7}
        style={[
          styles.ghost,
          sizeStyles.ghost,
          {
            backgroundColor: "transparent",
            borderColor: BRAND.accent,
          },
          minTouchStyle,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={BRAND.accent} size="small" />
        ) : typeof children === "string" ? (
          <Text
            style={[
              styles.label,
              sizeStyles.labelGhost,
              { color: BRAND.accent, fontWeight: "600" },
              textStyle,
            ]}
            numberOfLines={1}
          >
            {children}
          </Text>
        ) : (
          children
        )}
      </TouchableOpacity>
    );
  }

  if (variant === "primary") {
    const content = loading ? (
      <ActivityIndicator color="#fff" size="small" />
    ) : (
      label
    );

    if (isDisabled) {
      return (
        <TouchableOpacity
          accessibilityLabel={accessibilityLabel}
          disabled
          style={[styles.primaryShell, sizeStyles.primary, minTouchStyle, styles.primaryDisabled, style]}
          activeOpacity={1}
        >
          {content}
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        accessibilityLabel={accessibilityLabel}
        disabled={loading}
        onPress={onPress}
        activeOpacity={0.88}
        style={[styles.primaryShell, sizeStyles.primary, minTouchStyle, styles.primaryShadow, style]}
      >
        <LinearGradient
          colors={[...PRIMARY_BUTTON_GRADIENT]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, styles.primaryGradient]}
        />
        <View style={styles.primaryInner}>{content}</View>
      </TouchableOpacity>
    );
  }

  const ghostSurface = isDarkMode ? colors.surface : BRAND.surface;
  const ghostBorder = isDarkMode ? colors.border : BRAND.line;
  const ghostText = isDarkMode ? colors.text : BRAND.text;

  return (
    <TouchableOpacity
      accessibilityLabel={accessibilityLabel}
      disabled={isDisabled}
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.ghost,
        sizeStyles.ghost,
        {
          backgroundColor: ghostSurface,
          borderColor: ghostBorder,
        },
        minTouchStyle,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={ghostText} size="small" />
      ) : typeof children === "string" ? (
        <Text
          style={[
            styles.label,
            sizeStyles.labelGhost,
            { color: ghostText },
            textStyle,
          ]}
          numberOfLines={1}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}

const RADIUS = 12;

const styles = StyleSheet.create({
  primaryShell: {
    borderRadius: RADIUS,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
  },
  primaryGradient: {
    borderRadius: RADIUS,
  },
  primaryInner: {
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  primaryShadow: {
    ...Platform.select({
      ios: {
        shadowColor: BRAND.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 7,
      },
      android: { elevation: 4 },
    }),
  },
  primaryDisabled: {
    backgroundColor: "#cbd5e1",
  },
  ghost: {
    borderRadius: RADIUS,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    textAlign: "center",
  },
  labelPrimary: {
    color: "#ffffff",
    fontWeight: "700",
  },
  labelPrimaryDisabled: {
    color: "#64748b",
  },
  labelGhost: {
    color: BRAND.text,
    fontWeight: "600",
  },
  sizeMedium: {
    primary: {
      paddingVertical: 13,
      paddingHorizontal: 20,
      minHeight: 48,
    },
    ghost: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      minHeight: 44,
    },
    label: {
      fontSize: 15,
    },
    labelGhost: {
      fontSize: 14,
    },
  },
  sizeSmall: {
    primary: {
      paddingVertical: 10,
      paddingHorizontal: 16,
      minHeight: 40,
    },
    ghost: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      minHeight: 38,
    },
    label: {
      fontSize: 14,
    },
    labelGhost: {
      fontSize: 13,
    },
  },
});
