import React, { useState } from 'react';
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
} from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from './ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ContactUs from '../ContactUs/ContactUs';
import AboutUs from '../AboutUs/AboutPage';
import TnC from '../TermsAndConditions/TnC';
import PrivacyPolicy from '../TermsAndConditions/PrivacyPolicy';
// import PrivacyPolicy from '../PrivacyPolicy/PrivacyPolicy'; // Import PrivacyPolicy component

interface SettingsProps {
  visible: boolean;
  onClose: () => void;
}

const Settings: React.FC<SettingsProps> = ({ visible, onClose }) => {
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

  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showFontSizeModal, setShowFontSizeModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showTnCModal, setShowTnCModal] = useState(false);
  const [showPrivacyPolicyModal, setShowPrivacyPolicyModal] = useState(false); // Add state for Privacy Policy

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'zh', name: 'Chinese', nativeName: '中文' },
  ];

  const fontSizes = [
    { value: 'small', label: 'Small', icon: 'text-fields', size: 14 },
    { value: 'medium', label: 'Medium', icon: 'text-fields', size: 16 },
    { value: 'large', label: 'Large', icon: 'text-fields', size: 18 },
  ];

  const themeOptions = [
    { value: 'light', label: 'Light', icon: 'wb-sunny' },
    { value: 'dark', label: 'Dark', icon: 'nights-stay' },
    { value: 'system', label: 'System Default', icon: 'settings-overscan' },
  ];

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
              setTheme('system');
              setFontSize('medium');
              setLanguage('en');
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

  const handleAboutPress = () => {
    setShowAboutModal(true);
  };

  const handleContactPress = () => {
    setShowContactModal(true);
  };

  const handleTnCPress = () => {
    setShowTnCModal(true);
  };

  const handlePrivacyPolicyPress = () => {
    setShowPrivacyPolicyModal(true);
  };

  const handleCloseAbout = () => {
    setShowAboutModal(false);
  };

  const handleCloseContact = () => {
    setShowContactModal(false);
  };

  const handleCloseTnC = () => {
    setShowTnCModal(false);
  };

  const handleClosePrivacyPolicy = () => {
    setShowPrivacyPolicyModal(false);
  };

  const SettingItem = ({
    icon,
    label,
    value,
    onPress,
    rightIcon = 'chevron-right',
    showSwitch = false,
    switchValue = false,
    onSwitchChange,
  }: any) => (
    <TouchableOpacity
      style={[styles.settingItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={showSwitch}
    >
      <View style={styles.settingItemLeft}>
        <MaterialIcon name={icon} size={24} color={colors.primary} />
        <Text style={[styles.settingLabel, { color: colors.text, fontSize: fontStyles.textSize }]}>
          {label}
        </Text>
      </View>
      <View style={styles.settingItemRight}>
        {value && <Text style={[styles.settingValue, { color: colors.textSecondary, fontSize: fontStyles.smallText }]}>{value}</Text>}
        {showSwitch ? (
          <Switch
            value={switchValue}
            onValueChange={onSwitchChange}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={isDarkMode ? colors.text : '#ffffff'}
          />
        ) : (
          <MaterialIcon name={rightIcon} size={22} color={colors.textSecondary} />
        )}
      </View>
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <Text style={[styles.sectionHeader, { color: colors.primary, fontSize: fontStyles.headingSize }]}>
      {title}
    </Text>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header with LinearGradient */}
        <LinearGradient
          colors={["#0a2a66ff", "#004aadff"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.header}
        >
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <MaterialIcon name="arrow-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: '#ffffff', fontSize: fontStyles.headingSize }]}>
            Settings
          </Text>
          <TouchableOpacity onPress={clearAllPreferences} style={styles.headerButton}>
            <MaterialIcon name="refresh" size={24} color="#ffffff" />
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Appearance Section */}
          <SectionHeader title="Appearance" />
          
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
            value={languages.find(l => l.code === language)?.name}
            onPress={() => setShowLanguageModal(true)}
          />

          {/* Preferences Section */}
          <SectionHeader title="Preferences" />
          
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
          />

          {/* Privacy & Security Section */}
          <SectionHeader title="Privacy & Security" />
          
          <SettingItem
            icon="lock"
            label="Privacy Policy"
            onPress={handlePrivacyPolicyPress} // Connect to Privacy Policy
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
          />

          {/* About Section */}
          <SectionHeader title="About" />
          
          <SettingItem
            icon="info"
            label="About App"
            onPress={handleAboutPress}
          />
          
          <SettingItem
            icon="phone"
            label="Contact Us"
            onPress={handleContactPress}
          />
          
          <SettingItem
            icon="update"
            label="App Version"
            value="1.0.0 (Build 101)"
            onPress={() => {}}
          />
          
          <SettingItem
            icon="description"
            label="Terms & Conditions"
            onPress={handleTnCPress}
          />
          
          <SettingItem
            icon="star"
            label="Rate the App"
            onPress={() => Alert.alert('Rate Us', 'Thank you for rating our app!')}
          />

          {/* Support Section */}
          <SectionHeader title="Support" />
          
          <SettingItem
            icon="help"
            label="Help Center"
            onPress={() => Alert.alert('Help Center', 'How can we help you?')}
          />
          
          <SettingItem
            icon="feedback"
            label="Send Feedback"
            onPress={() => Alert.alert('Feedback', 'Thank you for your feedback!')}
          />
          
          <SettingItem
            icon="bug-report"
            label="Report a Problem"
            onPress={() => Alert.alert('Report Issue', 'Please describe the issue you encountered.')}
          />

          {/* Reset Settings Button */}
          <TouchableOpacity
            style={[styles.resetButton, { borderColor: colors.error }]}
            onPress={clearAllPreferences}
          >
            <MaterialIcon name="settings-backup-restore" size={22} color={colors.error} />
            <Text style={[styles.resetButtonText, { color: colors.error, fontSize: fontStyles.textSize }]}>
              Reset All Settings
            </Text>
          </TouchableOpacity>

          <View style={styles.footer} />
        </ScrollView>

        {/* Theme Selection Modal */}
        <Modal visible={showThemeModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text, fontSize: fontStyles.headingSize }]}>
                  Select Theme
                </Text>
                <TouchableOpacity onPress={() => setShowThemeModal(false)}>
                  <MaterialIcon name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              {themeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.modalItem,
                    { borderBottomColor: colors.border },
                    theme === option.value && { backgroundColor: colors.primary + '20' }
                  ]}
                  onPress={() => {
                    setTheme(option.value as 'light' | 'dark' | 'system');
                    setShowThemeModal(false);
                  }}
                >
                  <View style={styles.modalItemLeft}>
                    <MaterialIcon name={option.icon} size={22} color={colors.primary} />
                    <Text style={[styles.modalItemText, { color: colors.text, fontSize: fontStyles.textSize }]}>
                      {option.label}
                    </Text>
                  </View>
                  {theme === option.value && (
                    <MaterialIcon name="check" size={22} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>

        {/* Font Size Selection Modal */}
        <Modal visible={showFontSizeModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text, fontSize: fontStyles.headingSize }]}>
                  Select Font Size
                </Text>
                <TouchableOpacity onPress={() => setShowFontSizeModal(false)}>
                  <MaterialIcon name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              {fontSizes.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.modalItem,
                    { borderBottomColor: colors.border },
                    fontSize === option.value && { backgroundColor: colors.primary + '20' }
                  ]}
                  onPress={() => {
                    setFontSize(option.value as 'small' | 'medium' | 'large');
                    setShowFontSizeModal(false);
                  }}
                >
                  <View style={styles.modalItemLeft}>
                    <MaterialIcon name={option.icon} size={22} color={colors.primary} />
                    <Text style={[styles.modalItemText, { color: colors.text, fontSize: option.size }]}>
                      {option.label}
                    </Text>
                  </View>
                  {fontSize === option.value && (
                    <MaterialIcon name="check" size={22} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>

        {/* Language Selection Modal */}
        <Modal visible={showLanguageModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text, fontSize: fontStyles.headingSize }]}>
                  Select Language
                </Text>
                <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                  <MaterialIcon name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              {languages.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.modalItem,
                    { borderBottomColor: colors.border },
                    language === lang.code && { backgroundColor: colors.primary + '20' }
                  ]}
                  onPress={() => {
                    setLanguage(lang.code);
                    setShowLanguageModal(false);
                  }}
                >
                  <View style={styles.modalItemLeft}>
                    <MaterialIcon name="language" size={22} color={colors.primary} />
                    <Text style={[styles.modalItemText, { color: colors.text, fontSize: fontStyles.textSize }]}>
                      {lang.name} ({lang.nativeName})
                    </Text>
                  </View>
                  {language === lang.code && (
                    <MaterialIcon name="check" size={22} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>

        {/* About Us Modal */}
        <Modal
          visible={showAboutModal}
          animationType="slide"
          onRequestClose={handleCloseAbout}
        >
          <AboutUs onBack={handleCloseAbout} visible={showAboutModal} />
        </Modal>

        {/* Contact Us Modal */}
        <Modal
          visible={showContactModal}
          animationType="slide"
          onRequestClose={handleCloseContact}
        >
          <ContactUs onBack={handleCloseContact} />
        </Modal>

        {/* Terms & Conditions Modal */}
        <Modal
          visible={showTnCModal}
          animationType="slide"
          onRequestClose={handleCloseTnC}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <LinearGradient
              colors={["#0a2a66ff", "#004aadff"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.modalHeader, { justifyContent: 'flex-start', gap: 16 }]}
            >
              <TouchableOpacity onPress={handleCloseTnC} style={styles.headerButton}>
                <MaterialIcon name="arrow-back" size={24} color="#ffffff" />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: '#ffffff', fontSize: fontStyles.headingSize }]}>
                Terms & Conditions
              </Text>
            </LinearGradient>
            <TnC />
          </SafeAreaView>
        </Modal>

        {/* Privacy Policy Modal */}
        <Modal
          visible={showPrivacyPolicyModal}
          animationType="slide"
          onRequestClose={handleClosePrivacyPolicy}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <LinearGradient
              colors={["#0a2a66ff", "#004aadff"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.modalHeader, { justifyContent: 'flex-start', gap: 16 }]}
            >
              <TouchableOpacity onPress={handleClosePrivacyPolicy} style={styles.headerButton}>
                <MaterialIcon name="arrow-back" size={24} color="#ffffff" />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: '#ffffff', fontSize: fontStyles.headingSize }]}>
                Privacy Policy
              </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontWeight: '500',
  },
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    maxWidth: 150,
    textAlign: 'right',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 32,
    marginBottom: 24,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  resetButtonText: {
    fontWeight: '600',
  },
  footer: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxHeight: '70%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontWeight: '600',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalItemText: {
    fontWeight: '500',
  },
});

export default Settings;