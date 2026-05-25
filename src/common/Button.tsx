import React from "react";
import { ViewStyle, TextStyle, TouchableOpacityProps } from "react-native";
import { BrandButton, BrandButtonVariant, BrandButtonSize } from "../design-system/BrandButton";

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
  const brandVariant = mapVariant(variant);
  const brandSize = mapSize(size);

  const content =
    startIcon || endIcon ? (
      <>
        {startIcon}
        {children}
        {endIcon}
      </>
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
