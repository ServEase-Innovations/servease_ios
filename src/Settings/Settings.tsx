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
  SafeAreaView,
  Alert,
  TextInput,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
} from 'react-native';
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
import { BOOKING_HEADER_GRADIENT } from '../theme/brandColors';

const { width, height } = Dimensions.get('window');

interface SettingsProps {
  visible: boolean;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ visible, onClose }) => {
  const { t } = useTranslation();
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
    { value: 'light', label: 'Light Mode', icon: 'wb-sunny', description: 'Bright and清新' },
    { value: 'dark', label: 'Dark Mode', icon: 'nights-stay', description: 'Easy on eyes' },
    { value: 'system', label: 'System Default', icon: 'settings-overscan', description: 'Follow device' },
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

  // Modern Animated Setting Item
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
              borderBottomWidth: isLast ? 0 : 1,
              borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
              backgroundColor: isDarkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.7)',
            }
          ]}
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={showSwitch}
          activeOpacity={0.7}
        >
          <View style={styles.settingItemLeft}>
            <LinearGradient
              colors={isDarkMode ? ['#38bdf8', '#818cf8'] : ['#3b82f6', '#1e3a8a']}
              style={styles.settingIconBg}
            >
              <MaterialIcon name={icon} size={22} color="#ffffff" />
            </LinearGradient>
            <Text style={[styles.settingLabel, { color: isDarkMode ? '#f8fafc' : '#1e293b', fontSize: fontStyles.textSize }]}>
              {label}
            </Text>
          </View>
          <View style={styles.settingItemRight}>
            {value && !showSwitch && (
              <Text style={[styles.settingValue, { color: isDarkMode ? '#94a3b8' : '#64748b', fontSize: fontStyles.smallText }]}>
                {value}
              </Text>
            )}
            {showSwitch ? (
              <Switch
                value={switchValue}
                onValueChange={onSwitchChange}
                trackColor={{ false: isDarkMode ? '#334155' : '#e2e8f0', true: '#3b82f6' }}
                thumbColor={switchValue ? '#ffffff' : isDarkMode ? '#94a3b8' : '#ffffff'}
                ios_backgroundColor={isDarkMode ? '#334155' : '#e2e8f0'}
              />
            ) : (
              <MaterialIcon name={rightIcon} size={20} color={isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.3)'} />
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const SectionHeader = ({ title, icon }: { title: string; icon?: string }) => (
    <View style={styles.sectionHeaderContainer}>
      {icon && (
        <LinearGradient
          colors={isDarkMode ? ['#38bdf8', '#818cf8'] : ['#3b82f6', '#1e3a8a']}
          style={styles.sectionIconBg}
        >
          <MaterialIcon name={icon} size={16} color="#ffffff" />
        </LinearGradient>
      )}
      <Text style={[styles.sectionHeader, { color: isDarkMode ? '#38bdf8' : '#1e3a8a', fontSize: fontStyles.headingSize }]}>
        {title}
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
      <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#0f172a' : '#f1f5f9' }]}>
        {/* Header with BOOKING_HEADER_GRADIENT */}
        <LinearGradient
          colors={[...BOOKING_HEADER_GRADIENT]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <MaterialIcon name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: '#ffffff', fontSize: fontStyles.headingSize }]}>
              Settings
            </Text>
            <TouchableOpacity onPress={clearAllPreferences} style={styles.headerButton}>
              <MaterialIcon name="refresh" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.headerSubtitle}>Customize your app experience</Text>
        </LinearGradient>

        <Animated.ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Appearance Section */}
          <SectionHeader title="Appearance" icon="palette" />
          <View style={styles.card}>
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

          {/* Preferences Section */}
          <SectionHeader title="Preferences" icon="tune" />
          <View style={styles.card}>
            <SettingItem
              icon="notifications"
              label="Push Notifications"
              showSwitch={true}
              switchValue={notifications}
              onSwitchChange={setNotifications}
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

          {/* Privacy & Security Section */}
          <SectionHeader title="Privacy & Security" icon="lock" />
          <View style={styles.card}>
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

          {/* About Section */}
          <SectionHeader title="About" icon="info" />
          <View style={styles.card}>
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


          {/* Reset Button */}
          <TouchableOpacity
            style={[styles.resetButton, { borderColor: '#ef4444' }]}
            onPress={clearAllPreferences}
          >
            <MaterialIcon name="settings-backup-restore" size={22} color="#ef4444" />
            <Text style={[styles.resetButtonText, { color: '#ef4444', fontSize: fontStyles.textSize }]}>
              Reset All Settings
            </Text>
          </TouchableOpacity>
        </Animated.ScrollView>

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
                <LinearGradient
                  colors={isDarkMode ? ['#38bdf8', '#818cf8'] : ['#3b82f6', '#1e3a8a']}
                  style={styles.modalIconBg}
                >
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
                <MaterialIcon name="check-circle" size={22} color="#3b82f6" />
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
                <LinearGradient
                  colors={isDarkMode ? ['#38bdf8', '#818cf8'] : ['#3b82f6', '#1e3a8a']}
                  style={styles.modalIconBg}
                >
                  <Text style={[styles.previewText, { fontSize: option.size }]}>{option.preview}</Text>
                </LinearGradient>
                <Text style={[styles.modalItemText, { color: isDarkMode ? '#f8fafc' : '#1e293b', fontSize: option.size }]}>
                  {option.label}
                </Text>
              </View>
              {fontSize === option.value && (
                <MaterialIcon name="check-circle" size={22} color="#3b82f6" />
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
                    <LinearGradient
                      colors={isDarkMode ? ['#38bdf8', '#818cf8'] : ['#3b82f6', '#1e3a8a']}
                      style={styles.modalIconBg}
                    >
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
                    <MaterialIcon name="check-circle" size={22} color="#3b82f6" />
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
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  headerTitle: {
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
    marginLeft: 100,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  sectionHeader: {
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  settingIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabel: {
    fontWeight: '600',
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontWeight: '500',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 16,
    marginBottom: 24,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderRadius: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
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
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
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
    borderRadius: 12,
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
    borderRadius: 20,
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