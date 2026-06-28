// Settings.tsx - Modern Redesign with Gradient Navy Blue Theme
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  Alert,
  TextInput,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  BackHandler,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from './ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ContactUs from '../ContactUs/ContactUs';
import AboutUs from '../AboutUs/AboutPage';
import TnC from '../TermsAndConditions/TnC';
import PrivacyPolicy from '../TermsAndConditions/PrivacyPolicy';
import { HomeHeroPageHeader } from '../common/HomeHeroPageHeader';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../../i18n';
import { BOOKING_HEADER_GRADIENT, BRAND, HOME_M3, HOME_HERO_GRADIENT } from '../theme/brandColors';
import { requestPushNotificationPermission } from '../services/pushNotifications';
import { refreshPushRegistration } from '../services/pushApi';
import { useAppUser } from '../context/AppUserContext';
import { useAuth0 } from 'react-native-auth0';
import { getMobileTabBarHeight } from '../Constants/mobileLayout';
import DeviceInfo from 'react-native-device-info';

const { width, height } = Dimensions.get('window');
const HORIZONTAL_GUTTER = 10;

interface SettingsProps {
  onBack: () => void;
}

const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { appUser } = useAppUser();
  const { user: auth0User } = useAuth0();
  const iconGradient = [BRAND.accent, BRAND.bookingSky];
  const {
    theme,
    isDarkMode,
    setTheme,
    colors,
    fontSize,
    setFontSize,
    language,
    setLanguage,
    notifications,
    setNotifications,
    compactMode,
    setCompactMode,
  } = useTheme();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const footerClearance = getMobileTabBarHeight(insets.bottom) + 28;
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showFontSizeModal, setShowFontSizeModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showTnCModal, setShowTnCModal] = useState(false);
  const [showPrivacyPolicyModal, setShowPrivacyPolicyModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [appVersionLabel, setAppVersionLabel] = useState('');

  useEffect(() => {
    const version = DeviceInfo.getVersion();
    const build = DeviceInfo.getBuildNumber();
    const versionIncludesBuild =
      version === build || version.endsWith(`.${build}`);
    setAppVersionLabel(
      versionIncludesBuild ? `ServEaso ${version}` : `ServEaso ${version} (${build})`
    );
  }, []);

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  ];

  const [filteredLanguages, setFilteredLanguages] = useState(languages);

  const fontSizes = [
    { value: 'small', label: 'Small', icon: 'format-size', size: 14, preview: 'Aa' },
    { value: 'medium', label: 'Medium', icon: 'format-size', size: 16, preview: 'Aa' },
    { value: 'large', label: 'Large', icon: 'format-size', size: 18, preview: 'Aa' },
  ];

  const themeOptions = [
    { value: 'light', label: 'Light Mode', icon: 'wb-sunny', description: 'Bright and clean interface' },
    { value: 'dark', label: 'Dark Mode', icon: 'nights-stay', description: 'Easy on the eyes at night' },
    { value: 'system', label: 'System Default', icon: 'settings-overscan', description: 'Match your device' },
  ];

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => backHandler.remove();
  }, [onBack]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredLanguages(languages);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = languages.filter(
        lang => 
          lang.name.toLowerCase().includes(query) || 
          lang.nativeName.toLowerCase().includes(query)
      );
      setFilteredLanguages(filtered);
    }
  }, [searchQuery]);

  const getFontSizeStyles = () => {
    switch (fontSize) {
      case 'small':
        return { textSize: 14, headingSize: 18, smallText: 12 };
      case 'large':
        return { textSize: 18, headingSize: 24, smallText: 16 };
      default:
        return { textSize: 16, headingSize: 20, smallText: 14 };
    }
  };

  const fontStyles = getFontSizeStyles();

  const clearAllPreferences = async () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                'theme',
                'fontSize',
                'language',
                'notifications',
                'compactMode',
              ]);
              setTheme('light');
              setFontSize('medium');
              setLanguage('en');
              await changeLanguage('en');
              setNotifications(true);
              setCompactMode(false);
            } catch (error) {
              console.error('Error resetting preferences:', error);
            }
          },
        },
      ]
    );
  };

  const handleLanguageChange = async (code: string) => {
    setLanguage(code);
    await changeLanguage(code);
    setShowLanguageModal(false);
    setSearchQuery('');
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (!enabled) {
      setNotifications(false);
      return;
    }
    const granted = await requestPushNotificationPermission();
    if (!granted) {
      setNotifications(false);
      Alert.alert(
        'Notifications disabled',
        'Enable notifications in iPhone Settings → Serveaso → Notifications to receive booking alerts.',
        [{ text: 'OK' }]
      );
      return;
    }

    const registered = await refreshPushRegistration({
      email: appUser?.email || auth0User?.email,
      role: appUser?.role,
      userId: appUser?.id || appUser?.userId,
      serviceProviderId: appUser?.serviceProviderId,
      customerId: appUser?.customerid || appUser?.customerId,
    });
    setNotifications(registered);
    if (!registered) {
      Alert.alert(
        'Registration failed',
        'Notification permission was granted but device registration failed. Try again after signing in, or reinstall the app.',
        [{ text: 'OK' }]
      );
    }
  };

  // Setting row
  const SettingItem = ({ icon, label, value, onPress, rightIcon = 'chevron-right', showSwitch = false, switchValue = false, onSwitchChange, isLast = false, iconBg, valueDanger = false }: any) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(scaleAnim, { toValue: 0.98, friction: 5, useNativeDriver: true }).start();
    };
    const handlePressOut = () => {
      Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
    };

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[
            styles.settingItem,
            {
              borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
              borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
            },
          ]}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={showSwitch}
          activeOpacity={0.65}
        >
          <View style={styles.settingItemLeft}>
            <View style={[styles.settingIconBg, { backgroundColor: iconBg || (isDarkMode ? '#334155' : '#e8eef8') }]}>
              <MaterialIcon name={icon} size={20} color={isDarkMode ? '#e2e8f0' : '#3b5bdb'} />
            </View>
            <Text style={[styles.settingLabel, { color: colors.textPrimary, fontSize: fontStyles.textSize }]}>
              {label}
            </Text>
          </View>
          <View style={styles.settingItemRight}>
            {value && !showSwitch ? (
              <View style={[
                styles.valuePill,
                valueDanger
                  ? { backgroundColor: '#fee2e2' }
                  : { backgroundColor: isDarkMode ? colors.accentSoft : '#e8eef8' },
              ]}>
                <Text style={[
                  styles.settingValue,
                  { color: valueDanger ? '#ef4444' : (isDarkMode ? colors.primary : '#3b5bdb'), fontSize: fontStyles.smallText },
                ]} numberOfLines={1}>
                  {value}
                </Text>
              </View>
            ) : null}
            {showSwitch ? (
              <Switch
                value={switchValue}
                onValueChange={onSwitchChange}
                trackColor={{ false: isDarkMode ? '#475569' : '#cbd5e1', true: '#3b5bdb' }}
                thumbColor="#ffffff"
                ios_backgroundColor={isDarkMode ? '#475569' : '#cbd5e1'}
              />
            ) : (
              <MaterialIcon name={rightIcon} size={20} color={isDarkMode ? '#475569' : '#94a3b8'} />
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const SectionHeader = ({ title }: { title: string; icon?: string }) => (
    <Text style={[styles.sectionHeader, { color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: fontStyles.smallText }]}>
      {title.toUpperCase()}
    </Text>
  );

  // Modal Component
  const CustomModal = ({ visible, onClose, title, children }: any) => (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <Animated.View 
              style={[
                styles.modalContent, 
                { 
                  backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
                  transform: [{ scale: fadeAnim }],
                }
              ]}
            >
              <LinearGradient
                colors={[...BOOKING_HEADER_GRADIENT]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalHeader}
              >
                <Text style={[styles.modalTitle, { color: '#ffffff', fontSize: fontStyles.headingSize }]}>
                  {title}
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
                  <MaterialIcon name="close" size={22} color="#ffffff" />
                </TouchableOpacity>
              </LinearGradient>
              {children}
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  const renderSettingsHeader = () => (
    <View style={[styles.headerShell, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[...HOME_HERO_GRADIENT]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={styles.headerTopRow}>
        <TouchableOpacity
          style={styles.headerIconBtn}
          onPress={onBack}
          accessibilityLabel="Go back"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icon name="arrow-left" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { fontSize: fontStyles.headingSize }]} numberOfLines={1}>
          Settings
        </Text>
        <View style={styles.headerSideSlot} />
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: HOME_M3.primary }]}>
      {renderSettingsHeader()}

      <ScrollView
        style={[styles.mainScrollView, { backgroundColor: isDarkMode ? colors.background : '#f1f5f9' }]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: footerClearance, paddingTop: 8 }}
      >
        {/* APPEARANCE */}
        <View style={styles.section}>
          <SectionHeader title="Appearance" />
          <View style={[styles.card, { backgroundColor: isDarkMode ? colors.card : '#ffffff' }]}>
            <SettingItem
              icon="palette"
              label="Theme"
              iconBg={isDarkMode ? '#1e3a5f' : '#dbeafe'}
              value={themeOptions.find(t => t.value === theme)?.label}
              onPress={() => setShowThemeModal(true)}
            />
            <SettingItem
              icon="format-size"
              label="Font Size"
              iconBg={isDarkMode ? '#1e3a5f' : '#dbeafe'}
              value={fontSizes.find(f => f.value === fontSize)?.label}
              onPress={() => setShowFontSizeModal(true)}
            />
            <SettingItem
              icon="language"
              label="Language"
              iconBg={isDarkMode ? '#1e3a5f' : '#dbeafe'}
              value={languages.find(l => l.code === language)?.name}
              onPress={() => setShowLanguageModal(true)}
              isLast
            />
          </View>
        </View>

        {/* PREFERENCES */}
        <View style={styles.section}>
          <SectionHeader title="Preferences" />
          <View style={[styles.card, { backgroundColor: isDarkMode ? colors.card : '#ffffff' }]}>
            <SettingItem
              icon="notifications-active"
              label="Push Notifications"
              iconBg={isDarkMode ? '#1e3a5f' : '#dbeafe'}
              showSwitch
              switchValue={notifications}
              onSwitchChange={handleNotificationToggle}
            />
            <SettingItem
              icon="dashboard"
              label="Compact Mode"
              iconBg={isDarkMode ? '#1e3a5f' : '#dbeafe'}
              showSwitch
              switchValue={compactMode}
              onSwitchChange={setCompactMode}
              isLast
            />
          </View>
        </View>

        {/* PRIVACY & SECURITY */}
        <View style={styles.section}>
          <SectionHeader title="Privacy & Security" />
          <View style={[styles.card, { backgroundColor: isDarkMode ? colors.card : '#ffffff' }]}>
            <SettingItem
              icon="lock"
              label="Privacy Policy"
              iconBg={isDarkMode ? '#3b2800' : '#fef3c7'}
              onPress={() => setShowPrivacyPolicyModal(true)}
            />
            <SettingItem
              icon="security"
              label="Security"
              iconBg={isDarkMode ? '#3b2800' : '#fef3c7'}
              onPress={() => Alert.alert('Security', 'Manage your security preferences.')}
            />
            <SettingItem
              icon="gpp-good"
              label="Data Sharing"
              iconBg={isDarkMode ? '#3b2800' : '#fef3c7'}
              value="Disabled"
              valueDanger
              onPress={() => Alert.alert('Coming Soon', 'This feature will be available soon.')}
              isLast
            />
          </View>
        </View>

        {/* ABOUT */}
        <View style={styles.section}>
          <SectionHeader title="About" />
          <View style={[styles.card, { backgroundColor: isDarkMode ? colors.card : '#ffffff' }]}>
            <View style={[styles.aboutRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }]}>
              <Text style={[styles.aboutLabel, { color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: fontStyles.textSize }]}>Version</Text>
              <Text style={[styles.aboutValue, { color: isDarkMode ? '#f8fafc' : '#1e293b', fontSize: fontStyles.textSize }]}>{appVersionLabel || '2.4.0 (Enterprise)'}</Text>
            </View>
            <View style={[styles.aboutRow, { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }]}>
              <Text style={[styles.aboutLabel, { color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: fontStyles.textSize }]}>Last Updated</Text>
              <Text style={[styles.aboutValue, { color: isDarkMode ? '#f8fafc' : '#1e293b', fontSize: fontStyles.textSize }]}>Oct 12, 2023</Text>
            </View>
            <TouchableOpacity
              style={styles.termsLinkRow}
              onPress={() => setShowTnCModal(true)}
              activeOpacity={0.7}
            >
              <Text style={[styles.termsLink, { fontSize: fontStyles.textSize }]}>Terms of Service</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

        {/* Theme Selection Modal */}
        <CustomModal visible={showThemeModal} onClose={() => setShowThemeModal(false)} title="Select Theme">
          {themeOptions.map((option, idx) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.modalItem,
                { borderBottomWidth: idx === themeOptions.length - 1 ? 0 : 1, borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
                theme === option.value && { backgroundColor: isDarkMode ? 'rgba(56,189,248,0.15)' : 'rgba(59,130,246,0.1)' }
              ]}
              onPress={() => {
                setTheme(option.value as 'light' | 'dark' | 'system');
                setShowThemeModal(false);
              }}
            >
              <View style={styles.modalItemLeft}>
                <LinearGradient colors={iconGradient} style={styles.modalIconBg}>
                  <MaterialIcon name={option.icon} size={20} color="#ffffff" />
                </LinearGradient>
                <View>
                  <Text style={[styles.modalItemText, { color: isDarkMode ? '#f8fafc' : '#1e293b', fontSize: fontStyles.textSize }]}>
                    {option.label}
                  </Text>
                  <Text style={[styles.modalItemSubText, { color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: fontStyles.smallText }]}>
                    {option.description}
                  </Text>
                </View>
              </View>
              {theme === option.value && (
                <MaterialIcon name="check-circle" size={22} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </CustomModal>

        {/* Font Size Selection Modal */}
        <CustomModal visible={showFontSizeModal} onClose={() => setShowFontSizeModal(false)} title="Font Size">
          {fontSizes.map((option, idx) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.modalItem,
                { borderBottomWidth: idx === fontSizes.length - 1 ? 0 : 1, borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
                fontSize === option.value && { backgroundColor: isDarkMode ? 'rgba(56,189,248,0.15)' : 'rgba(59,130,246,0.1)' }
              ]}
              onPress={() => {
                setFontSize(option.value as 'small' | 'medium' | 'large');
                setShowFontSizeModal(false);
              }}
            >
              <View style={styles.modalItemLeft}>
                <LinearGradient colors={iconGradient} style={styles.modalIconBg}>
                  <Text style={[styles.previewText, { fontSize: option.size }]}>{option.preview}</Text>
                </LinearGradient>
                <Text style={[styles.modalItemText, { color: isDarkMode ? '#f8fafc' : '#1e293b', fontSize: option.size }]}>
                  {option.label}
                </Text>
              </View>
              {fontSize === option.value && (
                <MaterialIcon name="check-circle" size={22} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </CustomModal>

        {/* Language Selection Modal */}
        <CustomModal visible={showLanguageModal} onClose={() => { setShowLanguageModal(false); setSearchQuery(''); }} title="Select Language">
          <View style={[styles.searchContainer, { backgroundColor: isDarkMode ? '#0f172a' : '#f8fafc', borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
            <MaterialIcon name="search" size={20} color={isDarkMode ? '#94a3b8' : '#64748b'} />
            <TextInput
              style={[styles.searchInput, { color: isDarkMode ? '#f8fafc' : '#1e293b', fontSize: fontStyles.textSize }]}
              placeholder="Search language..."
              placeholderTextColor={isDarkMode ? '#94a3b8' : '#64748b'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialIcon name="clear" size={20} color={isDarkMode ? '#94a3b8' : '#64748b'} />
              </TouchableOpacity>
            )}
          </View>
          <ScrollView style={{ maxHeight: 400 }}>
            {filteredLanguages.length > 0 ? (
              filteredLanguages.map((lang, idx) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.modalItem,
                    { borderBottomWidth: idx === filteredLanguages.length - 1 ? 0 : 1, borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
                    language === lang.code && { backgroundColor: isDarkMode ? 'rgba(56,189,248,0.15)' : 'rgba(59,130,246,0.1)' }
                  ]}
                  onPress={() => handleLanguageChange(lang.code)}
                >
                  <View style={styles.modalItemLeft}>
                    <LinearGradient colors={iconGradient} style={styles.modalIconBg}>
                      <MaterialIcon name="language" size={20} color="#ffffff" />
                    </LinearGradient>
                    <View>
                      <Text style={[styles.modalItemText, { color: isDarkMode ? '#f8fafc' : '#1e293b', fontSize: fontStyles.textSize }]}>
                        {lang.name}
                      </Text>
                      <Text style={[styles.modalItemSubText, { color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: fontStyles.smallText }]}>
                        {lang.nativeName}
                      </Text>
                    </View>
                  </View>
                  {language === lang.code && (
                    <MaterialIcon name="check-circle" size={22} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.noResultsContainer}>
                <MaterialIcon name="search-off" size={48} color={isDarkMode ? '#94a3b8' : '#64748b'} />
                <Text style={[styles.noResultsText, { color: isDarkMode ? '#f8fafc' : '#1e293b', fontSize: fontStyles.textSize }]}>
                  No languages found
                </Text>
              </View>
            )}
          </ScrollView>
        </CustomModal>

        {/* About Us Modal */}
        <Modal visible={showAboutModal} animationType="slide" onRequestClose={() => setShowAboutModal(false)}>
          <AboutUs onBack={() => setShowAboutModal(false)} visible={showAboutModal} />
        </Modal>

        {/* Contact Us Modal */}
        <Modal visible={showContactModal} animationType="slide" onRequestClose={() => setShowContactModal(false)}>
          <ContactUs onBack={() => setShowContactModal(false)} />
        </Modal>

        {/* Terms & Conditions Modal */}
        <Modal visible={showTnCModal} animationType="slide" onRequestClose={() => setShowTnCModal(false)}>
          <View style={{ flex: 1, backgroundColor: isDarkMode ? colors.background : HOME_M3.surface }}>
            <HomeHeroPageHeader
              title="Terms & Conditions"
              onBack={() => setShowTnCModal(false)}
              titleFontSize={fontStyles.headingSize}
            />
            <TnC />
          </View>
        </Modal>

        {/* Privacy Policy Modal */}
        <Modal visible={showPrivacyPolicyModal} animationType="slide" onRequestClose={() => setShowPrivacyPolicyModal(false)}>
          <View style={{ flex: 1, backgroundColor: isDarkMode ? colors.background : HOME_M3.surface }}>
            <HomeHeroPageHeader
              title="Privacy Policy"
              onBack={() => setShowPrivacyPolicyModal(false)}
              titleFontSize={fontStyles.headingSize}
            />
            <PrivacyPolicy embedded />
          </View>
        </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // ── Header ──────────────────────────────────────────────────────
  headerShell: {
    width: '100%',
    backgroundColor: HOME_M3.primary,
    paddingBottom: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 44,
    paddingHorizontal: 12,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  headerTitle: {
    flex: 1,
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'left',
    lineHeight: 24,
    marginLeft: 2,
  },
  headerSideSlot: {
    width: 40,
    height: 40,
    flexShrink: 0,
  },
  // ── Scroll / Sections ───────────────────────────────────────────
  mainScrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 2,
  },
  sectionHeader: {
    fontWeight: '700',
    letterSpacing: 0.7,
    marginBottom: 8,
  },
  // ── Card ────────────────────────────────────────────────────────
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  // ── Setting row ─────────────────────────────────────────────────
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
    minHeight: 56,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  settingIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingLabel: {
    fontWeight: '500',
    flexShrink: 1,
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  valuePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  settingValue: {
    fontWeight: '600',
  },
  // ── About section rows ──────────────────────────────────────────
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  aboutLabel: {
    fontWeight: '400',
  },
  aboutValue: {
    fontWeight: '700',
  },
  termsLinkRow: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  termsLink: {
    color: '#3b5bdb',
    fontWeight: '600',
  },
  // ── Modals ──────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.85,
    maxHeight: height * 0.7,
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: {
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  modalItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  modalIconBg: {
    width: 40,
    height: 40,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalItemText: {
    fontWeight: '600',
  },
  modalItemSubText: {
    marginTop: 2,
  },
  previewText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 8,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noResultsText: {
    marginTop: 16,
    fontWeight: '600',
  },
  // kept for legacy modal usage
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
    marginHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderRadius: 12,
  },
  resetButtonText: {
    fontWeight: '700',
  },
  sectionHeaderContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  sectionHeaderIcon: { marginRight: 6 },
});

export default Settings;
