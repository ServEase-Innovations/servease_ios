// src/components/ui/button.tsx
import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  StyleSheet,
  TouchableOpacityProps,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';

interface ButtonProps extends TouchableOpacityProps {
  className?: string;
  children: React.ReactNode;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
}

export function Button({
  className,
  children,
  startIcon,
  endIcon,
  disabled = false,
  loading = false,
  variant = 'outline',
  size = 'medium',
  style,
  ...props
}: ButtonProps) {
  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: disabled ? '#e5e7eb' : '#1d4ed8',
            borderColor: disabled ? '#d1d5db' : '#1d4ed8',
          },
          text: {
            color: disabled ? '#6b7280' : '#ffffff',
          },
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: disabled ? '#e5e7eb' : '#f3f4f6',
            borderColor: disabled ? '#d1d5db' : '#f3f4f6',
          },
          text: {
            color: disabled ? '#6b7280' : '#374151',
          },
        };
      case 'outline':
      default:
        return {
          container: {
            backgroundColor: disabled ? '#e5e7eb' : 'transparent',
            borderColor: disabled ? '#d1d5db' : '#1d4ed8',
          },
          text: {
            color: disabled ? '#6b7280' : '#1d4ed8',
          },
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { paddingHorizontal: 12, paddingVertical: 6, fontSize: 14 };
      case 'large':
        return { paddingHorizontal: 20, paddingVertical: 12, fontSize: 16 };
      case 'medium':
      default:
        return { paddingHorizontal: 16, paddingVertical: 8, fontSize: 15 };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <TouchableOpacity
      disabled={disabled || loading}
      style={[
        styles.baseContainer,
        variantStyles.container,
        {
          paddingHorizontal: sizeStyles.paddingHorizontal,
          paddingVertical: sizeStyles.paddingVertical,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variantStyles.text.color}
          size="small"
          style={styles.loader}
        />
      ) : (
        <View style={styles.content}>
          {startIcon && <View style={styles.iconStart}>{startIcon}</View>}
          <Text
            style={[
              styles.baseText,
              variantStyles.text,
              { fontSize: sizeStyles.fontSize },
            ]}
          >
            {children}
          </Text>
          {endIcon && <View style={styles.iconEnd}>{endIcon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  baseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 44,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  baseText: {
    fontWeight: '500',
    textAlign: 'center',
  },
  iconStart: {
    marginRight: 4,
  },
  iconEnd: {
    marginLeft: 4,
  },
  loader: {
    marginHorizontal: 8,
  },
});