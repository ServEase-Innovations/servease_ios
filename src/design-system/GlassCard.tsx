import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

type GlassCardProps = {
  children: React.ReactNode;
  isDarkMode: boolean;
  borderColor: string;
  style?: StyleProp<ViewStyle>;
};

const GlassCard: React.FC<GlassCardProps> = ({ children, isDarkMode, borderColor, style }) => {
  return (
    <LinearGradient
      colors={isDarkMode ? ['rgba(30, 41, 59, 0.92)', 'rgba(15, 23, 42, 0.88)'] : ['#ffffff', '#f8fafc']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { borderColor }, style]}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 5,
  },
});

export default GlassCard;
