import React from "react";
import { View, Text, ViewStyle, TextStyle, TouchableOpacityProps, StyleSheet } from "react-native";
import { BrandButton, BrandButtonVariant, BrandButtonSize } from "../design-system/BrandButton";
import { BRAND } from "../theme/brandColors";
import { useTheme } from "../Settings/ThemeContext";

interface ButtonProps extends TouchableOpacityProps {
  className?: string;
  children: React.ReactNode;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "outline";
  size?: "small" | "medium" | "large";
}

function mapVariant(variant: ButtonProps["variant"]): BrandButtonVariant {
  if (variant === "primary") return "primary";
  if (variant === "outline") return "outline";
  return "ghost";
}

function mapSize(size: ButtonProps["size"]): BrandButtonSize {
  return size === "small" ? "small" : "medium";
}

/** Shared app button — uses web-aligned BrandButton styles */
export function Button({
  children,
  disabled = false,
  loading = false,
  variant = "outline",
  size = "medium",
  style,
  startIcon,
  endIcon,
  ...props
}: ButtonProps) {
  const { colors, isDarkMode } = useTheme();
  const brandVariant = mapVariant(variant);
  const brandSize = mapSize(size);

  const labelTextStyle: TextStyle =
    variant === "primary"
      ? { color: "#fff", fontWeight: "700", fontSize: brandSize === "small" ? 14 : 15 }
      : variant === "outline"
        ? { color: BRAND.accent, fontWeight: "600", fontSize: brandSize === "small" ? 13 : 14 }
        : { color: isDarkMode ? colors.text : BRAND.text, fontWeight: "600", fontSize: brandSize === "small" ? 13 : 14 };

  const content =
    startIcon || endIcon ? (
      <View style={styles.iconRow}>
        {startIcon}
        {typeof children === "string" || typeof children === "number" ? (
          <Text style={labelTextStyle} numberOfLines={1}>
            {children}
          </Text>
        ) : (
          children
        )}
        {endIcon}
      </View>
    ) : (
      children
    );

  return (
    <BrandButton
      variant={brandVariant}
      size={brandSize}
      disabled={disabled}
      loading={loading}
      onPress={props.onPress}
      style={style as ViewStyle}
      textStyle={undefined as TextStyle | undefined}
      flex={variant === "primary" ? 1 : undefined}
      accessibilityLabel={props.accessibilityLabel}
    >
      {content}
    </BrandButton>
  );
}

const styles = StyleSheet.create({
  iconRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
});
