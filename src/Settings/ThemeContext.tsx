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

// Light theme colors - Keep as is, they look good
const lightColors = {
  primary: '#0a2a66',
  secondary: '#3b82f6',
  accent: '#6366f1',
  background: '#ffffff',
  surface: '#f5f5f5',
  surface2: '#eaeef5',
  text: '#111111',
  textSecondary: '#4b5563',
  textTertiary: '#6b7280',
  border: '#e0e0e0',
  borderLight: '#eef2f6',
  error: '#ef4444',
  errorLight: '#fee2e2',
  success: '#10b981',
  successLight: '#d1fae5',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  info: '#3b82f6',
  infoLight: '#dbeafe',
  card: '#ffffff',
  cardElevated: '#fafafa',
  notification: '#3b82f6',
  headerBackground: '#0a2a66',
  headerText: '#ffffff',
  footerBackground: '#0a2a66',
  footerText: '#ffffff',
  tabBar: '#0a2a66',
  tabBarInactive: '#8e98a3',
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.5)',
  disabled: '#cccccc',
  placeholder: '#999999',
  rating: '#fbbf24',
  veg: '#22c55e',
  nonVeg: '#ef4444',
  available: '#10b981',
  partiallyAvailable: '#f59e0b',
  limited: '#f97316',
  unavailable: '#ef4444',
};

// Enhanced Dark theme colors - More vibrant and eye-catching
const darkColors = {
  // Primary brand colors - brighter for better visibility
  primary: '#063792', // Brighter blue
  secondary: '#0c4daf', // Purple accent
  accent: '#f43f5e', // Pink accent for highlights
  
  // Backgrounds - deep but with character
  background: '#0f172a', // Deep slate blue
  surface: '#1e293b', // Lighter slate
  surface2: '#334155', // Medium slate for contrast
  
  // Text - improved contrast
  text: '#f8fafc', // Almost white
  textSecondary: '#cbd5e1', // Light slate
  textTertiary: '#94a3b8', // Muted slate
  
  // Borders - subtle but visible
  border: '#334155',
  borderLight: '#475569',
  
  // Status colors - vibrant and visible
  error: '#f87171', // Bright red
  errorLight: '#7f1d1d',
  success: '#4ade80', // Bright green
  successLight: '#14532d',
  warning: '#fbbf24', // Amber
  warningLight: '#78350f',
  info: '#60a5fa',
  infoLight: '#1e3a8a',
  
  // Cards - elevated surfaces
  card: '#1e293b',
  cardElevated: '#2d3a4f',
  
  // UI Elements
  notification: '#60a5fa',
  headerBackground: '#0f172a',
  headerText: '#f8fafc',
  footerBackground: '#0f172a',
  footerText: '#f8fafc',
  tabBar: '#0f172a',
  tabBarInactive: '#64748b',
  
  // Effects
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.8)',
  disabled: '#475569',
  placeholder: '#64748b',
  
  // Semantic colors
  rating: '#fbbf24', // Gold for stars
  veg: '#4ade80', // Bright green
  nonVeg: '#449b0a', // Bright red
  available: '#4ade80',
  partiallyAvailable: '#fbbf24',
  limited: '#fb923c',
  unavailable: '#f87171',
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
  
  const [theme, setThemeState] = useState<ThemeType>('system');
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

      if (savedTheme) setThemeState(savedTheme as ThemeType);
      if (savedFontSize) setFontSizeState(savedFontSize as 'small' | 'medium' | 'large');
      if (savedLanguage) {
        setLanguageState(savedLanguage);
        await changeI18nLanguage(savedLanguage);
      }
      if (savedNotifications) setNotificationsState(savedNotifications === 'true');
      if (savedCompactMode) setCompactModeState(savedCompactMode === 'true');
      
      console.log('✅ All preferences loaded successfully');
    } catch (error) {
      console.error('❌ Error loading preferences:', error);
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