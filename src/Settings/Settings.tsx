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
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from './ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ContactUs from '../ContactUs/ContactUs';
import AboutUs from '../AboutUs/AboutPage';
import TnC from '../TermsAndConditions/TnC';
import PrivacyPolicy from '../TermsAndConditions/PrivacyPolicy';
import { useTranslation } from 'react-i18next';
import { changeLanguage } from '../../i18n';
import { BOOKING_HEADER_GRADIENT, BRAND } from '../theme/brandColors';
import { requestPushNotificationPermission } from '../services/pushNotifications';

const { width, height } = Dimensions.get('window');

interface SettingsProps {
  visible: boolean;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
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
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showFontSizeModal, setShowFontSizeModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showTnCModal, setShowTnCModal] = useState(false);
  const [showPrivacyPolicyModal, setShowPrivacyPolicyModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  // Animate modal entrance
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      slideAnim.setValue(300);
    }
  }, [visible]);

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
    setNotifications(granted);
    if (!granted) {
      Alert.alert(
        'Notifications disabled',
        'Enable notifications in iPhone Settings → Serveaso → Notifications to receive booking alerts.',
        [{ text: 'OK' }]
      );
    }
  };

  // Setting row
  const SettingItem = ({ icon, label, value, onPress, rightIcon = 'chevron-right', showSwitch = false, switchValue = false, onSwitchChange, isLast = false }: any) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        friction: 5,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
    };

    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[
            styles.settingItem,
            {
              borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
              borderBottomColor: colors.divider,
            },
          ]}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={showSwitch}
          activeOpacity={0.65}
        >
          <View style={styles.settingItemLeft}>
            <LinearGradient colors={iconGradient} style={styles.settingIconBg}>
              <MaterialIcon name={icon} size={20} color="#ffffff" />
            </LinearGradient>
            <Text
              style={[
                styles.settingLabel,
                { color: colors.textPrimary, fontSize: fontStyles.textSize },
              ]}
            >
              {label}
            </Text>
          </View>
          <View style={styles.settingItemRight}>
            {value && !showSwitch ? (
              <View style={[styles.valuePill, { backgroundColor: colors.accentSoft }]}>
                <Text
                  style={[
                    styles.settingValue,
                    { color: colors.primary, fontSize: fontStyles.smallText },
                  ]}
                  numberOfLines={1}
                >
                  {value}
                </Text>
              </View>
            ) : null}
            {showSwitch ? (
              <Switch
                value={switchValue}
                onValueChange={onSwitchChange}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor="#ffffff"
                ios_backgroundColor={colors.border}
              />
            ) : (
              <MaterialIcon name={rightIcon} size={22} color={colors.textTertiary} />
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const SectionHeader = ({ title, icon }: { title: string; icon?: string }) => (
    <View style={styles.sectionHeaderContainer}>
      {icon ? (
        <MaterialIcon name={icon} size={16} color={colors.primary} style={styles.sectionHeaderIcon} />
      ) : null}
      <Text
        style={[
          styles.sectionHeader,
          { color: colors.primary, fontSize: fontStyles.smallText },
        ]}
      >
        {title.toUpperCase()}
      </Text>
    </View>
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

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      transparent={false}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={[...BOOKING_HEADER_GRADIENT]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.header, { paddingTop: insets.top + 8 }]}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={onClose} style={styles.headerButton} accessibilityLabel="Go back">
              <MaterialIcon name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <View style={styles.headerTitleBlock}>
              <Text style={[styles.headerTitle, { fontSize: fontStyles.headingSize }]}>Settings</Text>
              <Text style={styles.headerSubtitle}>Customize your app experience</Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 16 }}
        >
          <SectionHeader title="Appearance" icon="palette" />
          <View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.divider,
              },
            ]}
          >
            <SettingItem
              icon="palette"
              label="Theme"
              value={themeOptions.find(t => t.value === theme)?.label}
              onPress={() => setShowThemeModal(true)}
            />
            <SettingItem
              icon="format-size"
              label="Font Size"
              value={fontSizes.find(f => f.value === fontSize)?.label}
              onPress={() => setShowFontSizeModal(true)}
            />
            <SettingItem
              icon="language"
              label="Language"
              value={languages.find(l => l.code === language)?.nativeName}
              onPress={() => setShowLanguageModal(true)}
              isLast
            />
          </View>

          <SectionHeader title="Preferences" icon="tune" />
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.divider },
            ]}
          >
            <SettingItem
              icon="notifications-active"
              label="Push Notifications"
              showSwitch={true}
              switchValue={notifications}
              onSwitchChange={handleNotificationToggle}
            />
            <SettingItem
              icon="dashboard"
              label="Compact Mode"
              showSwitch={true}
              switchValue={compactMode}
              onSwitchChange={setCompactMode}
              isLast
            />
          </View>

          <SectionHeader title="Privacy & Security" icon="lock" />
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.divider },
            ]}
          >
            <SettingItem
              icon="lock"
              label="Privacy Policy"
              onPress={() => setShowPrivacyPolicyModal(true)}
            />
            <SettingItem
              icon="security"
              label="Security"
              onPress={() => Alert.alert('Security', 'Manage your security preferences.')}
            />
            <SettingItem
              icon="gpp-good"
              label="Data Sharing"
              value="Disabled"
              onPress={() => Alert.alert('Coming Soon', 'This feature will be available soon.')}
              isLast
            />
          </View>

          <SectionHeader title="About" icon="info" />
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.divider },
            ]}
          >
            <SettingItem
              icon="info"
              label="About App"
              onPress={() => setShowAboutModal(true)}
            />
            <SettingItem
              icon="phone"
              label="Contact Us"
              onPress={() => setShowContactModal(true)}
            />
            <SettingItem
              icon="description"
              label="Terms & Conditions"
              onPress={() => setShowTnCModal(true)}
            />
            <SettingItem
              icon="star"
              label="Rate App"
              onPress={() => Alert.alert('Rate Us', 'Thank you for rating our app!')}
            />
            <SettingItem
              icon="update"
              label="App Version"
              value="1.0.0 (Build 101)"
              onPress={() => {}}
              isLast
            />
          </View>


          <TouchableOpacity
            style={[
              styles.resetButton,
              {
                borderColor: colors.error,
                backgroundColor: isDarkMode ? 'rgba(248, 113, 113, 0.12)' : colors.errorLight,
              },
            ]}
            onPress={clearAllPreferences}
          >
            <MaterialIcon name="settings-backup-restore" size={20} color={colors.error} />
            <Text style={[styles.resetButtonText, { color: colors.error, fontSize: fontStyles.textSize }]}>
              Reset All Settings
            </Text>
          </TouchableOpacity>
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
          <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? '#0f172a' : '#ffffff' }}>
            <LinearGradient
              colors={[...BOOKING_HEADER_GRADIENT]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalPageHeader}
            >
              <TouchableOpacity onPress={() => setShowTnCModal(false)} style={styles.modalPageBackBtn}>
                <MaterialIcon name="arrow-back" size={24} color="#ffffff" />
              </TouchableOpacity>
              <Text style={[styles.modalPageTitle, { color: '#ffffff', fontSize: fontStyles.headingSize }]}>
                Terms & Conditions
              </Text>
              <View style={{ width: 40 }} />
            </LinearGradient>
            <TnC />
          </SafeAreaView>
        </Modal>

        {/* Privacy Policy Modal */}
        <Modal visible={showPrivacyPolicyModal} animationType="slide" onRequestClose={() => setShowPrivacyPolicyModal(false)}>
          <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? '#0f172a' : '#ffffff' }}>
            <LinearGradient
              colors={[...BOOKING_HEADER_GRADIENT]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalPageHeader}
            >
              <TouchableOpacity onPress={() => setShowPrivacyPolicyModal(false)} style={styles.modalPageBackBtn}>
                <MaterialIcon name="arrow-back" size={24} color="#ffffff" />
              </TouchableOpacity>
              <Text style={[styles.modalPageTitle, { color: '#ffffff', fontSize: fontStyles.headingSize }]}>
                Privacy Policy
              </Text>
              <View style={{ width: 40 }} />
            </LinearGradient>
            <PrivacyPolicy />
          </SafeAreaView>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    width: '100%',
    paddingBottom: 16,
    paddingHorizontal: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleBlock: {
    flex: 1,
    marginLeft: 4,
    paddingRight: 8,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontWeight: '700',
    letterSpacing: -0.2,
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: '#ffffff',
    opacity: 0.88,
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  card: {
    borderRadius: 0,
    overflow: 'hidden',
    marginBottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 6,
    marginLeft: 16,
    paddingTop: 4,
  },
  sectionHeaderIcon: {
    marginRight: 6,
  },
  sectionHeader: {
    fontWeight: '700',
    letterSpacing: 0.8,
  },
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
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingLabel: {
    fontWeight: '600',
    flexShrink: 1,
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  valuePill: {
    maxWidth: 130,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 0,
  },
  settingValue: {
    fontWeight: '600',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    marginBottom: 8,
    marginHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderRadius: 0,
  },
  resetButtonText: {
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.85,
    maxHeight: height * 0.7,
    borderRadius: 0,
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
    borderRadius: 0,
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
    borderRadius: 0,
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
  modalPageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  modalPageBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  modalPageTitle: {
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});

export default Settings;