// src/Settings/ThemeContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { changeLanguage as changeI18nLanguage } from '../../i18n'; // Import i18n language changer

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
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', rtl: true }, // Urdu is RTL
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', rtl: false },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', rtl: false },
];

interface ThemeContextType {
  // Theme properties
  theme: ThemeType;
  isDarkMode: boolean;
  setTheme: (theme: ThemeType) => void;
  colors: typeof lightColors;
  
  // Font size properties
  fontSize: 'small' | 'medium' | 'large';
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  
  // Language properties
  language: string;
  setLanguage: (lang: string) => void;
  currentLanguageDetails: typeof SUPPORTED_LANGUAGES[0] | undefined;
  isRTL: boolean;
  
  // Notification properties
  notifications: boolean;
  setNotifications: (enabled: boolean) => void;
  
  // UI properties
  compactMode: boolean;
  setCompactMode: (enabled: boolean) => void;
  
  // Helper methods
  getFontSizeMultiplier: () => number;
  getSpacingMultiplier: () => number;
}

// Light theme colors
const lightColors = {
  primary: '#0a2a66',
  secondary: '#3b82f6',
  background: '#ffffff',
  surface: '#f5f5f5',
  text: '#111111',
  textSecondary: '#666666',
  border: '#e0e0e0',
  error: '#ef4444',
  success: '#10b981',
  warning: '#f59e0b',
  info: '#3b82f6',
  card: '#ffffff',
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
};

// Dark theme colors
const darkColors = {
  primary: '#142c6e',
  secondary: '#60a5fa',
  background: '#121212',
  surface: '#1e1e1e',
  text: '#ffffff',
  textSecondary: '#b0b0b0',
  border: '#333333',
  error: '#f87171',
  success: '#34d399',
  warning: '#fbbf24',
  info: '#60a5fa',
  card: '#1e1e1e',
  notification: '#60a5fa',
  headerBackground: '#0a2a66',
  headerText: '#ffffff',
  footerBackground: '#1e1e1e',
  footerText: '#ffffff',
  tabBar: '#1e1e1e',
  tabBarInactive: '#8e98a3',
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.7)',
  disabled: '#555555',
  placeholder: '#666666',
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
  
  // State declarations
  const [theme, setThemeState] = useState<ThemeType>('system');
  const [fontSize, setFontSizeState] = useState<'small' | 'medium' | 'large'>('medium');
  const [language, setLanguageState] = useState<string>('en');
  const [notifications, setNotificationsState] = useState<boolean>(true);
  const [compactMode, setCompactModeState] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load all saved preferences on mount
  useEffect(() => {
    loadAllPreferences();
  }, []);

  // Load all preferences from AsyncStorage
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
        // Also update i18n language
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

  // Theme setter with persistence
  const setTheme = async (newTheme: ThemeType) => {
    try {
      setThemeState(newTheme);
      await AsyncStorage.setItem('theme', newTheme);
      console.log(`✅ Theme saved: ${newTheme}`);
    } catch (error) {
      console.error('❌ Error saving theme:', error);
    }
  };

  // Font size setter with persistence
  const setFontSize = async (size: 'small' | 'medium' | 'large') => {
    try {
      setFontSizeState(size);
      await AsyncStorage.setItem('fontSize', size);
      console.log(`✅ Font size saved: ${size}`);
    } catch (error) {
      console.error('❌ Error saving font size:', error);
    }
  };

  // Language setter with persistence and i18n sync
  const setLanguage = async (lang: string) => {
    try {
      setLanguageState(lang);
      await AsyncStorage.setItem('language', lang);
      await changeI18nLanguage(lang); // Update i18n language
      console.log(`✅ Language saved and applied: ${lang}`);
    } catch (error) {
      console.error('❌ Error saving language:', error);
    }
  };

  // Notifications setter with persistence
  const setNotifications = async (enabled: boolean) => {
    try {
      setNotificationsState(enabled);
      await AsyncStorage.setItem('notifications', String(enabled));
      console.log(`✅ Notifications saved: ${enabled}`);
    } catch (error) {
      console.error('❌ Error saving notifications:', error);
    }
  };

  // Compact mode setter with persistence
  const setCompactMode = async (enabled: boolean) => {
    try {
      setCompactModeState(enabled);
      await AsyncStorage.setItem('compactMode', String(enabled));
      console.log(`✅ Compact mode saved: ${enabled}`);
    } catch (error) {
      console.error('❌ Error saving compact mode:', error);
    }
  };

  // Reset all settings to default
  const resetAllSettings = async () => {
    try {
      await Promise.all([
        AsyncStorage.multiRemove([
          'theme',
          'fontSize',
          'language',
          'notifications',
          'compactMode',
        ]),
      ]);
      
      setThemeState('system');
      setFontSizeState('medium');
      setLanguageState('en');
      await changeI18nLanguage('en');
      setNotificationsState(true);
      setCompactModeState(false);
      
      console.log('✅ All settings reset to default');
    } catch (error) {
      console.error('❌ Error resetting settings:', error);
    }
  };

  // Derived values
  const isDarkMode = theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';
  const colors = isDarkMode ? darkColors : lightColors;
  
  // Get current language details
  const currentLanguageDetails = SUPPORTED_LANGUAGES.find(l => l.code === language);
  const isRTL = currentLanguageDetails?.rtl || false;

  // Helper to get font size multiplier
  const getFontSizeMultiplier = () => FONT_SIZE_CONFIG[fontSize].multiplier;

  // Helper to get spacing multiplier based on compact mode
  const getSpacingMultiplier = () => compactMode ? 0.8 : 1;

  // Get font sizes based on current settings
  const getFontSizes = () => FONT_SIZE_CONFIG[fontSize];

  // Context value
  const contextValue: ThemeContextType = {
    // Theme
    theme,
    isDarkMode,
    setTheme,
    colors,
    
    // Font size
    fontSize,
    setFontSize,
    
    // Language
    language,
    setLanguage,
    currentLanguageDetails,
    isRTL,
    
    // Notifications
    notifications,
    setNotifications,
    
    // UI
    compactMode,
    setCompactMode,
    
    // Helpers
    getFontSizeMultiplier,
    getSpacingMultiplier,
  };

  // Show loading if needed (optional - you might want to show a splash screen)
  if (isLoading) {
    return null; // Or return a loading component
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Helper hook to get font styles based on current settings
export const useFontStyles = () => {
  const { fontSize, compactMode } = useTheme();
  
  const getFontSizeStyles = () => {
    const sizes = FONT_SIZE_CONFIG[fontSize];
    const spacingMultiplier = compactMode ? 0.8 : 1;
    
    return {
      // Font sizes
      text: { fontSize: sizes.text },
      heading: { fontSize: sizes.heading, fontWeight: 'bold' as const },
      subheading: { fontSize: sizes.subheading, fontWeight: '600' as const },
      small: { fontSize: sizes.small },
      button: { fontSize: sizes.button, fontWeight: '600' as const },
      input: { fontSize: sizes.input },
      
      // Spacing with compact mode support
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
      
      // Raw values for calculations
      rawValues: {
        ...sizes,
        spacingMultiplier,
      },
    };
  };

  return getFontSizeStyles();
};

// Helper hook to check if current language is RTL
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

// Export color schemes and font size config for use in other components
export { lightColors, darkColors, FONT_SIZE_CONFIG };