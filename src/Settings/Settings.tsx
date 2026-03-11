import React, { useState, useEffect } from 'react';
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
import { changeLanguage, getSupportedLanguages } from '../../i18n';

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

  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showFontSizeModal, setShowFontSizeModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showTnCModal, setShowTnCModal] = useState(false);
  const [showPrivacyPolicyModal, setShowPrivacyPolicyModal] = useState(false);
  
  // Language search state
  const [searchQuery, setSearchQuery] = useState('');
  
  // Define languages array before using it
  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
    { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
    { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
    { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
    { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
    { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
    { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
    { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
    { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
    { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
    { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
    { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्' },
    { code: 'ne', name: 'Nepali', nativeName: 'नेपाली' },
  ];

  // Initialize filteredLanguages state after languages is defined
  const [filteredLanguages, setFilteredLanguages] = useState(languages);

  const fontSizes = [
    { value: 'small', label: t('settings.small'), icon: 'text-fields', size: 14 },
    { value: 'medium', label: t('settings.medium'), icon: 'text-fields', size: 16 },
    { value: 'large', label: t('settings.large'), icon: 'text-fields', size: 18 },
  ];

  const themeOptions = [
    { value: 'light', label: t('settings.light'), icon: 'wb-sunny' },
    { value: 'dark', label: t('settings.dark'), icon: 'nights-stay' },
    { value: 'system', label: t('settings.system'), icon: 'settings-overscan' },
  ];

  // Filter languages based on search query
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
      t('settings.resetConfirm'),
      t('settings.resetMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
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
    setSearchQuery(''); // Reset search when closing
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

  const handleCloseLanguageModal = () => {
    setShowLanguageModal(false);
    setSearchQuery(''); // Reset search when closing
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
            {t('settings.title')}
          </Text>
          <TouchableOpacity onPress={clearAllPreferences} style={styles.headerButton}>
            <MaterialIcon name="refresh" size={24} color="#ffffff" />
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Appearance Section */}
          <SectionHeader title={t('settings.appearance')} />
          
          <SettingItem
            icon="palette"
            label={t('settings.theme')}
            value={themeOptions.find(t => t.value === theme)?.label}
            onPress={() => setShowThemeModal(true)}
          />
          
          <SettingItem
            icon="format-size"
            label={t('settings.fontSize')}
            value={fontSizes.find(f => f.value === fontSize)?.label}
            onPress={() => setShowFontSizeModal(true)}
          />
          
          <SettingItem
            icon="language"
            label={t('settings.language')}
            value={languages.find(l => l.code === language)?.nativeName}
            onPress={() => setShowLanguageModal(true)}
          />

          {/* Preferences Section */}
          <SectionHeader title={t('settings.preferences')} />
          
          <SettingItem
            icon="notifications"
            label={t('settings.notifications')}
            showSwitch={true}
            switchValue={notifications}
            onSwitchChange={setNotifications}
          />
          
          <SettingItem
            icon="dashboard"
            label={t('settings.compactMode')}
            showSwitch={true}
            switchValue={compactMode}
            onSwitchChange={setCompactMode}
          />

          {/* Privacy & Security Section */}
          <SectionHeader title={t('settings.privacy')} />
          
          <SettingItem
            icon="lock"
            label={t('settings.privacyPolicy')}
            onPress={handlePrivacyPolicyPress}
          />
          
          <SettingItem
            icon="security"
            label={t('settings.security')}
            onPress={() => Alert.alert(t('settings.security'), 'Manage your security preferences.')}
          />
          
          <SettingItem
            icon="gpp-good"
            label={t('settings.dataSharing')}
            value={t('settings.disabled')}
            onPress={() => Alert.alert('Coming Soon', 'This feature will be available soon.')}
          />

          {/* About Section */}
          <SectionHeader title={t('settings.about')} />
          
          <SettingItem
            icon="info"
            label={t('settings.aboutApp')}
            onPress={handleAboutPress}
          />
          
          <SettingItem
            icon="phone"
            label={t('settings.contactUs')}
            onPress={handleContactPress}
          />
          
          <SettingItem
            icon="update"
            label={t('settings.appVersion')}
            value="1.0.0 (Build 101)"
            onPress={() => {}}
          />
          
          <SettingItem
            icon="description"
            label={t('settings.termsConditions')}
            onPress={handleTnCPress}
          />
          
          <SettingItem
            icon="star"
            label={t('settings.rateApp')}
            onPress={() => Alert.alert('Rate Us', 'Thank you for rating our app!')}
          />

          {/* Support Section */}
          <SectionHeader title={t('settings.support')} />
          
          <SettingItem
            icon="help"
            label={t('settings.helpCenter')}
            onPress={() => Alert.alert(t('settings.helpCenter'), 'How can we help you?')}
          />
          
          <SettingItem
            icon="feedback"
            label={t('settings.sendFeedback')}
            onPress={() => Alert.alert('Feedback', 'Thank you for your feedback!')}
          />
          
          <SettingItem
            icon="bug-report"
            label={t('settings.reportProblem')}
            onPress={() => Alert.alert('Report Issue', 'Please describe the issue you encountered.')}
          />

          {/* Reset Settings Button */}
          <TouchableOpacity
            style={[styles.resetButton, { borderColor: colors.error }]}
            onPress={clearAllPreferences}
          >
            <MaterialIcon name="settings-backup-restore" size={22} color={colors.error} />
            <Text style={[styles.resetButtonText, { color: colors.error, fontSize: fontStyles.textSize }]}>
              {t('settings.resetSettings')}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer} />
        </ScrollView>

        {/* Theme Selection Modal */}
        <Modal visible={showThemeModal} transparent animationType="fade">
          <TouchableWithoutFeedback onPress={() => setShowThemeModal(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                  <LinearGradient
                    colors={["#0a2a66ff", "#004aadff"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.modalHeader, { borderBottomWidth: 0 }]}
                  >
                    <Text style={[styles.modalTitle, { color: '#ffffff', fontSize: fontStyles.headingSize }]}>
                      {t('settings.selectTheme')}
                    </Text>
                    <TouchableOpacity onPress={() => setShowThemeModal(false)}>
                      <MaterialIcon name="close" size={24} color="#ffffff" />
                    </TouchableOpacity>
                  </LinearGradient>
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
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Font Size Selection Modal */}
        <Modal visible={showFontSizeModal} transparent animationType="fade">
          <TouchableWithoutFeedback onPress={() => setShowFontSizeModal(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
                  <LinearGradient
                    colors={["#0a2a66ff", "#004aadff"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.modalHeader, { borderBottomWidth: 0 }]}
                  >
                    <Text style={[styles.modalTitle, { color: '#ffffff', fontSize: fontStyles.headingSize }]}>
                      {t('settings.selectFontSize')}
                    </Text>
                    <TouchableOpacity onPress={() => setShowFontSizeModal(false)}>
                      <MaterialIcon name="close" size={24} color="#ffffff" />
                    </TouchableOpacity>
                  </LinearGradient>
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
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Language Selection Modal with Search */}
        <Modal visible={showLanguageModal} transparent animationType="fade">
          <TouchableWithoutFeedback onPress={handleCloseLanguageModal}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={[styles.modalContent, { backgroundColor: colors.surface, maxHeight: '80%' }]}>
                  <LinearGradient
                    colors={["#0a2a66ff", "#004aadff"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.modalHeader, { borderBottomWidth: 0 }]}
                  >
                    <Text style={[styles.modalTitle, { color: '#ffffff', fontSize: fontStyles.headingSize }]}>
                      {t('settings.selectLanguage')}
                    </Text>
                    <TouchableOpacity onPress={handleCloseLanguageModal}>
                      <MaterialIcon name="close" size={24} color="#ffffff" />
                    </TouchableOpacity>
                  </LinearGradient>
                  
                  {/* Search Input */}
                  <View style={[styles.searchContainer, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                    <MaterialIcon name="search" size={20} color={colors.textSecondary} />
                    <TextInput
                      style={[styles.searchInput, { color: colors.text, fontSize: fontStyles.textSize }]}
                      placeholder={t('settings.searchLanguage')}
                      placeholderTextColor={colors.textSecondary}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      autoFocus
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <MaterialIcon name="clear" size={20} color={colors.textSecondary} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <ScrollView style={{ maxHeight: 400 }}>
                    {filteredLanguages.length > 0 ? (
                      filteredLanguages.map((lang) => (
                        <TouchableOpacity
                          key={lang.code}
                          style={[
                            styles.modalItem,
                            { borderBottomColor: colors.border },
                            language === lang.code && { backgroundColor: colors.primary + '20' }
                          ]}
                          onPress={() => handleLanguageChange(lang.code)}
                        >
                          <View style={styles.modalItemLeft}>
                            <MaterialIcon name="language" size={22} color={colors.primary} />
                            <View>
                              <Text style={[styles.modalItemText, { color: colors.text, fontSize: fontStyles.textSize }]}>
                                {lang.name}
                              </Text>
                              <Text style={[styles.modalItemSubText, { color: colors.textSecondary, fontSize: fontStyles.smallText }]}>
                                {lang.nativeName}
                              </Text>
                            </View>
                          </View>
                          {language === lang.code && (
                            <MaterialIcon name="check" size={22} color={colors.primary} />
                          )}
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View style={styles.noResultsContainer}>
                        <MaterialIcon name="search-off" size={48} color={colors.textSecondary} />
                        <Text style={[styles.noResultsText, { color: colors.text, fontSize: fontStyles.textSize }]}>
                          {t('settings.noLanguagesFound')}
                        </Text>
                        <Text style={[styles.noResultsSubText, { color: colors.textSecondary, fontSize: fontStyles.smallText }]}>
                          {t('settings.tryDifferentSearch')}
                        </Text>
                      </View>
                    )}
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
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
                {t('settings.termsConditions')}
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
                {t('settings.privacyPolicy')}
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
    justifyContent: 'space-between',
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
  modalItemSubText: {
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 8,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  noResultsText: {
    marginTop: 16,
    fontWeight: '600',
  },
  noResultsSubText: {
    marginTop: 8,
    textAlign: 'center',
  },
});

export default Settings;