// SkeletonLoader.tsx
import React from 'react';
import { 
  View, 
  StyleSheet, 
  ViewStyle, 
  DimensionValue,
  StyleProp
} from 'react-native';

interface SkeletonLoaderProps {
  width?: DimensionValue;
  height?: DimensionValue;
  style?: StyleProp<ViewStyle>;
  variant?: 'rectangular' | 'circular' | 'text';
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 16,
  style,
  variant = 'rectangular'
}) => {
  const baseStyle: StyleProp<ViewStyle> = [
    styles.base,
    {
      width,
      height,
      borderRadius: variant === 'circular' ? 9999 : 4,
    },
    style
  ];

  return <View style={baseStyle} />;
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#e5e7eb',
    display: 'flex',
  },
});
