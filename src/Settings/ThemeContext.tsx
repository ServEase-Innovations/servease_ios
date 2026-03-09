import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeType = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: ThemeType;
  isDarkMode: boolean;
  setTheme: (theme: ThemeType) => void;
  colors: typeof lightColors;
  fontSize: 'small' | 'medium' | 'large';
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  language: string;
  setLanguage: (lang: string) => void;
  notifications: boolean;
  setNotifications: (enabled: boolean) => void;
  compactMode: boolean;
  setCompactMode: (enabled: boolean) => void;
}

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
  card: '#ffffff',
  notification: '#3b82f6',
  headerBackground: '#0a2a66',
  headerText: '#ffffff',
  footerBackground: '#0a2a66',
  footerText: '#ffffff',
};

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
  card: '#1e1e1e',
  notification: '#60a5fa',
  headerBackground: '#f5f2f2',
  headerText: '#ffffff',
  footerBackground: '#1e1e1e',
  footerText: '#ffffff',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeType>('system');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [language, setLanguage] = useState('en');
  const [notifications, setNotifications] = useState(true);
  const [compactMode, setCompactMode] = useState(false);

  // Load saved preferences
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('theme');
      const savedFontSize = await AsyncStorage.getItem('fontSize');
      const savedLanguage = await AsyncStorage.getItem('language');
      const savedNotifications = await AsyncStorage.getItem('notifications');
      const savedCompactMode = await AsyncStorage.getItem('compactMode');

      if (savedTheme) setThemeState(savedTheme as ThemeType);
      if (savedFontSize) setFontSize(savedFontSize as 'small' | 'medium' | 'large');
      if (savedLanguage) setLanguage(savedLanguage);
      if (savedNotifications) setNotifications(savedNotifications === 'true');
      if (savedCompactMode) setCompactMode(savedCompactMode === 'true');
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    await AsyncStorage.setItem('theme', newTheme);
  };

  const handleSetFontSize = async (size: 'small' | 'medium' | 'large') => {
    setFontSize(size);
    await AsyncStorage.setItem('fontSize', size);
  };

  const handleSetLanguage = async (lang: string) => {
    setLanguage(lang);
    await AsyncStorage.setItem('language', lang);
  };

  const handleSetNotifications = async (enabled: boolean) => {
    setNotifications(enabled);
    await AsyncStorage.setItem('notifications', String(enabled));
  };

  const handleSetCompactMode = async (enabled: boolean) => {
    setCompactMode(enabled);
    await AsyncStorage.setItem('compactMode', String(enabled));
  };

  const isDarkMode = theme === 'system' ? systemColorScheme === 'dark' : theme === 'dark';
  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDarkMode,
        setTheme,
        colors,
        fontSize,
        setFontSize: handleSetFontSize,
        language,
        setLanguage: handleSetLanguage,
        notifications,
        setNotifications: handleSetNotifications,
        compactMode,
        setCompactMode: handleSetCompactMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};