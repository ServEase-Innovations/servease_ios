// src/Settings/ThemeContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { changeLanguage as changeI18nLanguage } from '../../i18n';

type ThemeType = 'light' | 'dark' | 'system';

// Define all supported languages with their details
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', rtl: false },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', rtl: false },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', rtl: false },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', rtl: false },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', rtl: false },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', rtl: false },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', rtl: false },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', rtl: false },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', rtl: false },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', rtl: false },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', rtl: false },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', rtl: false },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', rtl: true },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', rtl: false },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', rtl: false },
];

interface ThemeContextType {
  theme: ThemeType;
  isDarkMode: boolean;
  setTheme: (theme: ThemeType) => void;
  colors: typeof lightColors;
  fontSize: 'small' | 'medium' | 'large';
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  language: string;
  setLanguage: (lang: string) => void;
  currentLanguageDetails: typeof SUPPORTED_LANGUAGES[0] | undefined;
  isRTL: boolean;
  notifications: boolean;
  setNotifications: (enabled: boolean) => void;
  compactMode: boolean;
  setCompactMode: (enabled: boolean) => void;
  getFontSizeMultiplier: () => number;
  getSpacingMultiplier: () => number;
}

// Enhanced Light theme colors - Deeper and more vibrant
const lightColors = {
  // Primary brand colors - richer and more professional
  primary: '#0a2a66', // Deep navy blue
  primaryLight: '#1a3a7a',
  primaryDark: '#051a4a',
  secondary: '#3b82f6', // Vibrant blue
  secondaryLight: '#60a5fa',
  secondaryDark: '#2563eb',
  accent: '#6366f1', // Indigo accent
  accentLight: '#818cf8',
  accentDark: '#4f46e5',
  
  // Backgrounds - clean and sophisticated
  background: '#f8fafc', // Very light slate
  backgroundAlt: '#f1f5f9', // Slightly darker alt background
  surface: '#ffffff', // Pure white for surfaces
  surface2: '#f8fafc', // Light slate for cards
  surface3: '#f1f5f9', // Even lighter for elevated surfaces
  surfaceElevated: '#ffffff', // White for elevated cards
  
  // Text colors - improved contrast and hierarchy
  text: '#0f172a', // Deep slate for primary text
  textPrimary: '#0f172a',
  textSecondary: '#475569', // Medium slate for secondary text
  textTertiary: '#64748b', // Light slate for tertiary text
  textDisabled: '#94a3b8',
  textHint: '#94a3b8',
  textInverse: '#ffffff', // White text for dark backgrounds
  
  // Borders - subtle but distinct
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  borderDark: '#cbd5e1',
  
  // Status colors - vibrant and clear
  error: '#dc2626',
  errorLight: '#fee2e2',
  errorDark: '#b91c1c',
  success: '#10b981',
  successLight: '#d1fae5',
  successDark: '#059669',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  warningDark: '#d97706',
  info: '#3b82f6',
  infoLight: '#dbeafe',
  infoDark: '#2563eb',
  
  // Cards and UI Elements
  card: '#ffffff',
  cardBackground: '#ffffff',
  cardElevated: '#ffffff',
  cardBorder: '#e2e8f0',
  
  // Navigation and Header
  headerBackground: '#0a2a66',
  headerText: '#ffffff',
  headerBorder: 'rgba(255,255,255,0.1)',
  footerBackground: '#0a2a66',
  footerText: '#ffffff',
  tabBar: '#0a2a66',
  tabBarActive: '#ffffff',
  tabBarInactive: '#94a3b8',
  
  // Effects
  shadow: '#000000',
  shadowLight: 'rgba(0,0,0,0.05)',
  shadowMedium: 'rgba(0,0,0,0.1)',
  shadowHeavy: 'rgba(0,0,0,0.2)',
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.3)',
  
  // Form elements
  inputBackground: '#ffffff',
  inputBorder: '#e2e8f0',
  inputFocus: '#0a2a66',
  inputError: '#dc2626',
  disabled: '#e2e8f0',
  placeholder: '#94a3b8',
  
  // Semantic colors
  rating: '#fbbf24',
  veg: '#22c55e',
  nonVeg: '#ef4444',
  available: '#10b981',
  partiallyAvailable: '#f59e0b',
  limited: '#f97316',
  unavailable: '#ef4444',
  
  // Additional UI colors
  divider: '#e2e8f0',
  icon: '#475569',
  iconActive: '#0a2a66',
  badge: '#ef4444',
  badgeText: '#ffffff',
  chip: '#f1f5f9',
  chipText: '#475569',
  chipActive: '#0a2a66',
  chipActiveText: '#ffffff',
};

// Enhanced Dark theme colors - Deeper, richer, and more vibrant
const darkColors = {
  // Primary brand colors - brighter for better visibility
  primary: '#3b82f6', // Bright blue
  primaryLight: '#60a5fa',
  primaryDark: '#2563eb',
  secondary: '#8b5cf6', // Purple accent
  secondaryLight: '#a78bfa',
  secondaryDark: '#7c3aed',
  accent: '#f43f5e', // Pink accent for highlights
  accentLight: '#fb7185',
  accentDark: '#e11d48',
  
  // Backgrounds - deep and rich
  background: '#0f172a', // Deep slate blue
  backgroundAlt: '#1e293b', // Slightly lighter slate
  surface: '#1e293b', // Card background
  surface2: '#334155', // Elevated surface
  surface3: '#475569', // Higher elevation
  surfaceElevated: '#2d3a4f', // Elevated card background
  
  // Text colors - excellent contrast
  text: '#f8fafc', // Almost white
  textPrimary: '#f8fafc',
  textSecondary: '#cbd5e1', // Light slate
  textTertiary: '#94a3b8', // Muted slate
  textDisabled: '#64748b',
  textHint: '#64748b',
  textInverse: '#0f172a', // Dark text for light backgrounds
  
  // Borders - subtle but visible
  border: '#334155',
  borderLight: '#475569',
  borderDark: '#1e293b',
  
  // Status colors - vibrant and visible
  error: '#f87171', // Bright red
  errorLight: '#7f1d1d',
  errorDark: '#ef4444',
  success: '#4ade80', // Bright green
  successLight: '#14532d',
  successDark: '#22c55e',
  warning: '#fbbf24', // Amber
  warningLight: '#78350f',
  warningDark: '#f59e0b',
  info: '#60a5fa',
  infoLight: '#1e3a8a',
  infoDark: '#3b82f6',
  
  // Cards and UI Elements
  card: '#1e293b',
  cardBackground: '#1e293b',
  cardElevated: '#2d3a4f',
  cardBorder: '#334155',
  
  // Navigation and Header
  headerBackground: '#0f172a',
  headerText: '#f8fafc',
  headerBorder: 'rgba(255,255,255,0.1)',
  footerBackground: '#0f172a',
  footerText: '#f8fafc',
  tabBar: '#0f172a',
  tabBarActive: '#3b82f6',
  tabBarInactive: '#64748b',
  
  // Effects
  shadow: '#000000',
  shadowLight: 'rgba(0,0,0,0.2)',
  shadowMedium: 'rgba(0,0,0,0.4)',
  shadowHeavy: 'rgba(0,0,0,0.6)',
  overlay: 'rgba(0,0,0,0.8)',
  overlayLight: 'rgba(0,0,0,0.6)',
  
  // Form elements
  inputBackground: '#1e293b',
  inputBorder: '#334155',
  inputFocus: '#3b82f6',
  inputError: '#f87171',
  disabled: '#334155',
  placeholder: '#64748b',
  
  // Semantic colors
  rating: '#fbbf24',
  veg: '#4ade80',
  nonVeg: '#f87171',
  available: '#4ade80',
  partiallyAvailable: '#fbbf24',
  limited: '#fb923c',
  unavailable: '#f87171',
  
  // Additional UI colors
  divider: '#334155',
  icon: '#94a3b8',
  iconActive: '#3b82f6',
  badge: '#ef4444',
  badgeText: '#ffffff',
  chip: '#334155',
  chipText: '#cbd5e1',
  chipActive: '#3b82f6',
  chipActiveText: '#ffffff',
};

// Font size configurations
const FONT_SIZE_CONFIG = {
  small: {
    multiplier: 0.85,
    text: 14,
    heading: 18,
    subheading: 16,
    small: 12,
    button: 14,
    input: 14,
  },
  medium: {
    multiplier: 1,
    text: 16,
    heading: 20,
    subheading: 18,
    small: 14,
    button: 16,
    input: 16,
  },
  large: {
    multiplier: 1.15,
    text: 18,
    heading: 24,
    subheading: 20,
    small: 16,
    button: 18,
    input: 18,
  },
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  
  // IMPORTANT: Default theme is now 'light' instead of 'system'
  const [theme, setThemeState] = useState<ThemeType>('light');
  const [fontSize, setFontSizeState] = useState<'small' | 'medium' | 'large'>('medium');
  const [language, setLanguageState] = useState<string>('en');
  const [notifications, setNotificationsState] = useState<boolean>(true);
  const [compactMode, setCompactModeState] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadAllPreferences();
  }, []);

  const loadAllPreferences = async () => {
    try {
      setIsLoading(true);
      
      const [
        savedTheme,
        savedFontSize,
        savedLanguage,
        savedNotifications,
        savedCompactMode,
      ] = await Promise.all([
        AsyncStorage.getItem('theme'),
        AsyncStorage.getItem('fontSize'),
        AsyncStorage.getItem('language'),
        AsyncStorage.getItem('notifications'),
        AsyncStorage.getItem('compactMode'),
      ]);

      // Only apply saved theme if it exists, otherwise keep default 'light'
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system')) {
        setThemeState(savedTheme as ThemeType);
      } else {
        // Ensure default is 'light' even if no saved preference
        setThemeState('light');
        await AsyncStorage.setItem('theme', 'light');
      }
      
      if (savedFontSize) setFontSizeState(savedFontSize as 'small' | 'medium' | 'large');
      if (savedLanguage) {
        setLanguageState(savedLanguage);
        await changeI18nLanguage(savedLanguage);
      }
      if (savedNotifications) setNotificationsState(savedNotifications === 'true');
      if (savedCompactMode) setCompactModeState(savedCompactMode === 'true');
      
      console.log('✅ All preferences loaded successfully - Default theme: LIGHT');
    } catch (error) {
      console.error('❌ Error loading preferences:', error);
      // Ensure fallback to light theme
      setThemeState('light');
    } finally {
      setIsLoading(false);
    }
  };

  const setTheme = async (newTheme: ThemeType) => {
    try {
      setThemeState(newTheme);
      await AsyncStorage.setItem('theme', newTheme);
      console.log(`✅ Theme saved: ${newTheme}`);
    } catch (error) {
      console.error('❌ Error saving theme:', error);
    }
  };

  const setFontSize = async (size: 'small' | 'medium' | 'large') => {
    try {
      setFontSizeState(size);
      await AsyncStorage.setItem('fontSize', size);
      console.log(`✅ Font size saved: ${size}`);
    } catch (error) {
      console.error('❌ Error saving font size:', error);
    }
  };

  const setLanguage = async (lang: string) => {
    try {
      setLanguageState(lang);
      await AsyncStorage.setItem('language', lang);
      await changeI18nLanguage(lang);
      console.log(`✅ Language saved and applied: ${lang}`);
    } catch (error) {
      console.error('❌ Error saving language:', error);
    }
  };

  const setNotifications = async (enabled: boolean) => {
    try {
      setNotificationsState(enabled);
      await AsyncStorage.setItem('notifications', String(enabled));
      console.log(`✅ Notifications saved: ${enabled}`);
    } catch (error) {
      console.error('❌ Error saving notifications:', error);
    }
  };

  const setCompactMode = async (enabled: boolean) => {
    try {
      setCompactModeState(enabled);
      await AsyncStorage.setItem('compactMode', String(enabled));
      console.log(`✅ Compact mode saved: ${enabled}`);
    } catch (error) {
      console.error('❌ Error saving compact mode:', error);
    }
  };

  // Calculate isDarkMode based on theme preference
  // Default is now light, so isDarkMode will be false by default
  const isDarkMode = theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';
  const colors = isDarkMode ? darkColors : lightColors;
  
  const currentLanguageDetails = SUPPORTED_LANGUAGES.find(l => l.code === language);
  const isRTL = currentLanguageDetails?.rtl || false;

  const getFontSizeMultiplier = () => FONT_SIZE_CONFIG[fontSize].multiplier;
  const getSpacingMultiplier = () => compactMode ? 0.8 : 1;

  const contextValue: ThemeContextType = {
    theme,
    isDarkMode,
    setTheme,
    colors,
    fontSize,
    setFontSize,
    language,
    setLanguage,
    currentLanguageDetails,
    isRTL,
    notifications,
    setNotifications,
    compactMode,
    setCompactMode,
    getFontSizeMultiplier,
    getSpacingMultiplier,
  };

  if (isLoading) {
    return null;
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const useFontStyles = () => {
  const { fontSize, compactMode } = useTheme();
  
  const getFontSizeStyles = () => {
    const sizes = FONT_SIZE_CONFIG[fontSize];
    const spacingMultiplier = compactMode ? 0.8 : 1;
    
    return {
      text: { fontSize: sizes.text },
      heading: { fontSize: sizes.heading, fontWeight: 'bold' as const },
      subheading: { fontSize: sizes.subheading, fontWeight: '600' as const },
      small: { fontSize: sizes.small },
      button: { fontSize: sizes.button, fontWeight: '600' as const },
      input: { fontSize: sizes.input },
      padding: {
        small: { padding: 8 * spacingMultiplier },
        medium: { padding: 16 * spacingMultiplier },
        large: { padding: 24 * spacingMultiplier },
      },
      margin: {
        small: { margin: 8 * spacingMultiplier },
        medium: { margin: 16 * spacingMultiplier },
        large: { margin: 24 * spacingMultiplier },
      },
      gap: {
        small: { gap: 8 * spacingMultiplier },
        medium: { gap: 16 * spacingMultiplier },
        large: { gap: 24 * spacingMultiplier },
      },
      rawValues: {
        ...sizes,
        spacingMultiplier,
      },
    };
  };

  return getFontSizeStyles();
};

export const useRTL = () => {
  const { isRTL } = useTheme();
  
  const getRTLStyle = <T,>(ltrValue: T, rtlValue: T): T => {
    return isRTL ? rtlValue : ltrValue;
  };
  
  const getTextAlign = () => getRTLStyle('left' as const, 'right' as const);
  const getFlexDirection = () => getRTLStyle('row' as const, 'row-reverse' as const);
  
  return {
    isRTL,
    getRTLStyle,
    getTextAlign,
    getFlexDirection,
  };
};

export { lightColors, darkColors, FONT_SIZE_CONFIG };