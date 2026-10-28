import React from "react";
import {
  Text as NativeText,
  TextInput as NativeTextInput,
} from "react-native";
import type { TextInputProps, TextProps } from "react-native";

export const FONT_FAMILY = "Inter";

export const Text = React.forwardRef<
  React.ElementRef<typeof NativeText>,
  TextProps
>(({ style, ...props }, ref) => (
  <NativeText
    {...props}
    ref={ref}
    allowFontScaling={false}
    style={[{ fontFamily: FONT_FAMILY }, style]}
  />
));

export const TextInput = React.forwardRef<
  React.ElementRef<typeof NativeTextInput>,
  TextInputProps
>(({ style, ...props }, ref) => (
  <NativeTextInput
    {...props}
    ref={ref}
    allowFontScaling={false}
    style={[{ fontFamily: FONT_FAMILY }, style]}
  />
));

Text.displayName = "BrandText";
TextInput.displayName = "BrandTextInput";
