// src/i18n/index.ts - Complete safe version without requiring RNLocalize
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules, I18nManager } from 'react-native';

// Import all translations
import en from '../translations/en.json';
import hi from '../translations/hi.json';
import bn from '../translations/bn.json';
import te from '../translations/te.json';
import ta from '../translations/ta.json';
import kn from '../translations/kn.json';
import ml from '../translations/ml.json';
import mr from '../translations/mr.json';
import gu from '../translations/gu.json';
import pa from '../translations/pa.json';
import or from '../translations/or.json';
import as from '../translations/as.json';
import ur from '../translations/ur.json';
import sa from '../translations/sa.json';
import ne from '../translations/ne.json';

const LANGUAGE_KEY = 'user-language';

// Resources object with all translations
const resources = {
  en: { translation: en },
  hi: { translation: hi },
  bn: { translation: bn },
  te: { translation: te },
  ta: { translation: ta },
  kn: { translation: kn },
  ml: { translation: ml },
  mr: { translation: mr },
  gu: { translation: gu },
  pa: { translation: pa },
  or: { translation: or },
  as: { translation: as },
  ur: { translation: ur },
  sa: { translation: sa },
  ne: { translation: ne },
};

// List of RTL languages (Urdu is RTL)
const RTL_LANGUAGES = ['ur'];

// Check if a language is RTL
export const isRTL = (languageCode: string): boolean => {
  return RTL_LANGUAGES.includes(languageCode);
};

// Safe platform-specific locale detection (doesn't require RNLocalize)
const getPlatformLanguage = (): string | null => {
  try {
    if (Platform.OS === 'ios') {
      // iOS locale detection
      const settingsManager = NativeModules.SettingsManager;
      if (settingsManager) {
        const locale = settingsManager.settings.AppleLocale || 
                      settingsManager.settings.AppleLanguages?.[0];
        if (locale) {
          return locale.substring(0, 2);
        }
      }
    } else if (Platform.OS === 'android') {
      // Android locale detection
      const i18nManager = NativeModules.I18nManager;
      if (i18nManager) {
        const locale = i18nManager.localeIdentifier;
        if (locale) {
          return locale.replace('_', '-').substring(0, 2);
        }
      }
    }
  } catch (error) {
    console.log('⚠️ Platform locale detection failed:', error);
  }
  return null;
};

// Safe function to get device language without requiring RNLocalize
const getDeviceLanguage = (): string => {
  // First try to use react-native-localize if it's available (but don't crash if it's not)
  try {
    // Use require instead of import to avoid compile-time dependency
    const RNLocalize = require('react-native-localize');
    if (RNLocalize && RNLocalize.getLocales) {
      const locales = RNLocalize.getLocales();
      if (locales && locales.length > 0) {
        const deviceLanguage = locales[0]?.languageCode;
        const supportedLanguages = Object.keys(resources);
        
        if (deviceLanguage && supportedLanguages.includes(deviceLanguage)) {
          console.log(`📱 Device language detected via RNLocalize: ${deviceLanguage}`);
          return deviceLanguage;
        }
      }
    }
  } catch (error) {
    // RNLocalize is not available, this is expected
    console.log('ℹ️ react-native-localize not installed, using platform detection');
  }

  // Fallback to platform-specific detection
  const platformLanguage = getPlatformLanguage();
  const supportedLanguages = Object.keys(resources);
  
  if (platformLanguage && supportedLanguages.includes(platformLanguage)) {
    console.log(`📱 Device language detected via platform: ${platformLanguage}`);
    return platformLanguage;
  }
  
  // Ultimate fallback
  console.log('🌐 Using English as fallback language');
  return 'en';
};

// Initialize i18n with comprehensive error handling
export const initI18n = async (): Promise<typeof i18n> => {
  try {
    console.log('🔄 Initializing i18n...');
    
    // Check if user has saved a language preference
    let savedLanguage = null;
    try {
      savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      console.log(`📦 Saved language from storage: ${savedLanguage || 'none'}`);
    } catch (storageError) {
      console.warn('⚠️ Failed to read from AsyncStorage:', storageError);
    }

    const deviceLanguage = getDeviceLanguage();
    const initialLanguage = savedLanguage || deviceLanguage;
    
    console.log(`🎯 Initial language set to: ${initialLanguage}`);

    // Configure i18n
    await i18n
      .use(initReactI18next)
      .init({
        resources,
        lng: initialLanguage,
        fallbackLng: 'en',
        interpolation: {
          escapeValue: false, // React already safes from XSS
        },
        compatibilityJSON: 'v4',
        react: {
          useSuspense: false, // Disable suspense for better compatibility
        },
        initImmediate: false,
      });

    console.log('✅ i18n initialized successfully');
    return i18n;
  } catch (error) {
    console.error('❌ Failed to initialize i18n:', error);
    
    // Ultimate fallback initialization
    console.log('⚠️ Using fallback i18n initialization');
    await i18n.use(initReactI18next).init({
      resources,
      lng: 'en',
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      compatibilityJSON: 'v4',
      react: {
        useSuspense: false,
      },
      initImmediate: false,
    });
    
    return i18n;
  }
};

// Function to change language with RTL handling
export const changeLanguage = async (languageCode: string): Promise<boolean> => {
  try {
    console.log(`🔄 Changing language to: ${languageCode}`);
    
    // Check if RTL status needs to change
    const needsRTLChange = isRTL(languageCode) !== I18nManager.isRTL;
    
    // Change language in i18n
    await i18n.changeLanguage(languageCode);
    
    // Save to storage
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, languageCode);
      console.log(`💾 Language saved to storage: ${languageCode}`);
    } catch (storageError) {
      console.warn('⚠️ Failed to save language to AsyncStorage:', storageError);
    }
    
    // Return whether RTL needs to change
    return needsRTLChange;
  } catch (error) {
    console.error('❌ Failed to change language:', error);
    return false;
  }
};

// Get current language
export const getCurrentLanguage = (): string => {
  return i18n.language || 'en';
};

// Get language display name in native script
export const getLanguageNativeName = (languageCode: string): string => {
  const languageMap: Record<string, string> = {
    en: 'English',
    hi: 'हिन्दी',
    bn: 'বাংলা',
    te: 'తెలుగు',
    ta: 'தமிழ்',
    kn: 'ಕನ್ನಡ',
    ml: 'മലയാളം',
    mr: 'मराठी',
    gu: 'ગુજરાતી',
    pa: 'ਪੰਜਾਬੀ',
    or: 'ଓଡ଼ିଆ',
    as: 'অসমীয়া',
    ur: 'اردو',
    sa: 'संस्कृतम्',
    ne: 'नेपाली',
  };
  
  return languageMap[languageCode] || languageCode;
};

// Get language name in English
export const getLanguageEnglishName = (languageCode: string): string => {
  const languageMap: Record<string, string> = {
    en: 'English',
    hi: 'Hindi',
    bn: 'Bengali',
    te: 'Telugu',
    ta: 'Tamil',
    kn: 'Kannada',
    ml: 'Malayalam',
    mr: 'Marathi',
    gu: 'Gujarati',
    pa: 'Punjabi',
    or: 'Odia',
    as: 'Assamese',
    ur: 'Urdu',
    sa: 'Sanskrit',
    ne: 'Nepali',
  };
  
  return languageMap[languageCode] || languageCode;
};

// Get all supported languages with details
export const getSupportedLanguages = () => {
  return Object.keys(resources).map(code => ({
    code,
    name: getLanguageEnglishName(code),
    nativeName: getLanguageNativeName(code),
    isRTL: isRTL(code),
  }));
};

// Check if a translation key exists
export const hasTranslation = (key: string, languageCode?: string): boolean => {
  const lang = languageCode || i18n.language;
  return i18n.exists(key, { lng: lang });
};

// Format date according to current locale
export const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(i18n.language, options);
  } catch (error) {
    console.warn('⚠️ Date formatting failed:', error);
    return String(date);
  }
};

// Format number according to current locale
export const formatNumber = (number: number, options?: Intl.NumberFormatOptions): string => {
  try {
    return number.toLocaleString(i18n.language, options);
  } catch (error) {
    console.warn('⚠️ Number formatting failed:', error);
    return String(number);
  }
};

// Format currency according to current locale
export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  try {
    return amount.toLocaleString(i18n.language, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  } catch (error) {
    console.warn('⚠️ Currency formatting failed:', error);
    return `₹${amount}`;
  }
};

// Get direction for a language
export const getLanguageDirection = (languageCode: string): 'ltr' | 'rtl' => {
  return isRTL(languageCode) ? 'rtl' : 'ltr';
};

// Debug function to check translations
export const debugTranslations = (languageCode?: string) => {
  const lang = languageCode || i18n.language;
  console.log(`🔍 Debugging translations for: ${lang}`);
  console.log('Resources available:', Object.keys(resources));
  console.log('Current language:', i18n.language);
  console.log('Is initialized:', i18n.isInitialized);
  console.log('RTL:', isRTL(lang));
  
  // Check a few common keys
  const testKeys = ['common.settings', 'common.cancel', 'common.save'];
  testKeys.forEach(key => {
    console.log(`  ${key}: ${i18n.t(key, { lng: lang })}`);
  });
};

// Alternative: Simple version that doesn't try to use RNLocalize at all
// Use this if you want to completely avoid the RNLocalize dependency
export const initI18nSimple = async (): Promise<typeof i18n> => {
  try {
    console.log('🔄 Initializing i18n (simple mode)...');
    
    // Check if user has saved a language preference
    let savedLanguage = null;
    try {
      savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
    } catch (storageError) {
      console.warn('⚠️ Failed to read from AsyncStorage:', storageError);
    }

    // Just use saved language or default to English
    const initialLanguage = savedLanguage || 'en';
    
    console.log(`🎯 Initial language set to: ${initialLanguage}`);

    await i18n
      .use(initReactI18next)
      .init({
        resources,
        lng: initialLanguage,
        fallbackLng: 'en',
        interpolation: {
          escapeValue: false,
        },
        compatibilityJSON: 'v4',
        react: {
          useSuspense: false,
        },
        initImmediate: false,
      });

    console.log('✅ i18n initialized successfully');
    return i18n;
  } catch (error) {
    console.error('❌ Failed to initialize i18n:', error);
    throw error;
  }
};

// Export the i18n instance as default
export default i18n;