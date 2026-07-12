import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
  Modal,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import TnC from '../TermsAndConditions/TnC';
import { useTheme } from '../../src/Settings/ThemeContext';
import { HOME_M3 } from '../theme/brandColors';
import { HomeHeroPageHeader } from '../common/HomeHeroPageHeader';
import utilsInstance from '../services/utilsInstance';
import {
  RegistrationKeyboardAccessory,
  RegistrationAndroidKeyboardBar,
  registrationKeyboardInputProps,
} from '../common/RegistrationKeyboardAccessory';

interface ContactUsProps {
  onBack?: () => void;
}

type SocialLink = {
  id: string;
  icon: string;
  color: string;
  darkColor?: string;
  url: string;
  label: string;
};

const SOCIAL_LINKS: SocialLink[] = [
  {
    id: 'linkedin',
    icon: 'linkedin',
    color: '#0077B5',
    url: 'https://www.linkedin.com/in/serveaso-media-7b7719381/',
    label: 'LinkedIn',
  },
  {
    id: 'facebook',
    icon: 'facebook',
    color: '#1877F2',
    url: 'https://www.facebook.com/profile.php?id=61572701168852',
    label: 'Facebook',
  },
  {
    id: 'instagram',
    icon: 'instagram',
    color: '#E4405F',
    url: 'https://www.instagram.com/serveaso?igsh=cHQxdmdubnZocjRn',
    label: 'Instagram',
  },
  {
    id: 'youtube',
    icon: 'youtube',
    color: '#FF0000',
    url: 'https://www.youtube.com/@ServEaso',
    label: 'YouTube',
  },
  {
    id: 'twitter',
    icon: 'twitter',
    color: '#1DA1F2',
    url: 'https://x.com/ServEaso',
    label: 'X',
  },
];

const HORIZONTAL_GUTTER = 16;

const ContactUs: React.FC<ContactUsProps> = ({ onBack }) => {
  const { colors, isDarkMode, fontSize } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);
  const [showTnC, setShowTnC] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const getFontSizes = () => {
    switch (fontSize) {
      case 'small':
        return {
          heading: 20,
          subheading: 13,
          bodyText: 12,
          labelText: 12,
          inputText: 13,
          buttonText: 13,
          benefitText: 12,
          contactText: 12,
        };
      case 'large':
        return {
          heading: 26,
          subheading: 16,
          bodyText: 15,
          labelText: 15,
          inputText: 16,
          buttonText: 16,
          benefitText: 15,
          contactText: 15,
        };
      default:
        return {
          heading: 22,
          subheading: 14,
          bodyText: 14,
          labelText: 14,
          inputText: 14,
          buttonText: 14,
          benefitText: 14,
          contactText: 14,
        };
    }
  };

  const fontSizes = getFontSizes();

  const palette = useMemo(
    () => ({
      canvas: isDarkMode ? colors.background : HOME_M3.surface,
      card: isDarkMode ? colors.card : HOME_M3.surfaceContainerLowest,
      cardBorder: isDarkMode ? colors.border : HOME_M3.outlineVariant,
      text: isDarkMode ? colors.text : HOME_M3.onSurface,
      muted: isDarkMode ? colors.textSecondary : HOME_M3.onSurfaceVariant,
      accent: isDarkMode ? colors.primary : HOME_M3.secondary,
      accentSoft: isDarkMode ? colors.infoLight : HOME_M3.secondaryFixed,
      accentOnSoft: isDarkMode ? colors.primary : HOME_M3.onSecondaryFixedVariant,
      inputBg: isDarkMode ? colors.surface : HOME_M3.surfaceContainerLow,
      placeholder: isDarkMode ? colors.placeholder : HOME_M3.outline,
      primaryBtn: isDarkMode ? colors.primary : HOME_M3.primary,
      success: colors.success,
      successSoft: colors.successLight,
    }),
    [colors, isDarkMode],
  );

  const benefitItems = [
    t('contact.benefit1'),
    t('contact.benefit2'),
    t('contact.benefit3'),
    t('contact.benefit4'),
    t('contact.benefit5'),
  ];

  const handleBackPress = () => {
    if (onBack) {
      onBack();
      return true;
    }
    return false;
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [onBack]);

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      Alert.alert(t('common.error', { defaultValue: 'Error' }), t('contact.fillRequired'));
      return;
    }

    if (!isAgreed) {
      Alert.alert(t('common.error', { defaultValue: 'Error' }), t('contact.agreeRequired'));
      return;
    }

    setSubmitting(true);
    try {
      await utilsInstance.post('/api/contact-us', {
        name: trimmedName,
        email: trimmedEmail,
        message: trimmedMessage,
        source: 'ios',
      });
      Alert.alert(t('contact.success'), t('contact.successMsg'));
      setName('');
      setEmail('');
      setMessage('');
      setIsAgreed(false);
    } catch (err: unknown) {
      const apiMessage =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        err.response &&
        typeof err.response === 'object' &&
        'data' in err.response &&
        err.response.data &&
        typeof err.response.data === 'object' &&
        'error' in err.response.data &&
        typeof err.response.data.error === 'string'
          ? err.response.data.error
          : t('contact.failedMsg');
      Alert.alert(t('contact.failed'), apiMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const goHome = () => {
    onBack?.();
  };

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  const renderContactAction = (
    iconName: string,
    iconFamily: 'material' | 'community',
    iconColor: string,
    iconBg: string,
    label: string,
    value: string,
    onPress: () => void,
  ) => (
    <TouchableOpacity
      style={[styles.actionRow, { borderColor: palette.cardBorder, backgroundColor: palette.inputBg }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.actionIconWrap, { backgroundColor: iconBg }]}>
        {iconFamily === 'community' ? (
          <MaterialCommunityIcon name={iconName} size={22} color={iconColor} />
        ) : (
          <MaterialIcon name={iconName} size={22} color={iconColor} />
        )}
      </View>
      <View style={styles.actionTextWrap}>
        <Text style={[styles.actionLabel, { color: palette.muted, fontSize: fontSizes.bodyText - 1 }]}>
          {label}
        </Text>
        <Text style={[styles.actionValue, { color: palette.text, fontSize: fontSizes.contactText }]} numberOfLines={1}>
          {value}
        </Text>
      </View>
      <MaterialIcon name="chevron-right" size={22} color={palette.muted} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: palette.canvas }]}>
      <HomeHeroPageHeader
        title={t('contact.title', { defaultValue: 'Contact Us' })}
        subtitle={t('contact.subtitle', { defaultValue: "We're here to help! Reach out to us anytime." })}
        onBack={goHome}
        titleFontSize={fontSizes.heading}
        subtitleFontSize={fontSizes.subheading}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={styles.contentWrapper}>
          <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.cardBorder }]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardIconWrap, { backgroundColor: palette.accentSoft }]}>
                <MaterialIcon name="mail-outline" size={20} color={palette.accentOnSoft} />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={[styles.cardTitle, { color: palette.text, fontSize: fontSizes.heading - 2 }]}>
                  {t('contact.formTitle')}
                </Text>
                <Text style={[styles.cardHint, { color: palette.muted, fontSize: fontSizes.bodyText }]}>
                  {t('contact.formDescription')}
                </Text>
              </View>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: palette.text, fontSize: fontSizes.labelText }]}>
                  {t('contact.fullName')}
                </Text>
                <TextInput
                  {...registrationKeyboardInputProps}
                  style={[
                    styles.input,
                    {
                      backgroundColor: palette.inputBg,
                      borderColor: palette.cardBorder,
                      color: palette.text,
                      fontSize: fontSizes.inputText,
                    },
                  ]}
                  placeholder={t('contact.namePlaceholder')}
                  placeholderTextColor={palette.placeholder}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: palette.text, fontSize: fontSizes.labelText }]}>
                  {t('contact.emailAddress')}
                </Text>
                <TextInput
                  {...registrationKeyboardInputProps}
                  style={[
                    styles.input,
                    {
                      backgroundColor: palette.inputBg,
                      borderColor: palette.cardBorder,
                      color: palette.text,
                      fontSize: fontSizes.inputText,
                    },
                  ]}
                  placeholder={t('contact.emailPlaceholder')}
                  placeholderTextColor={palette.placeholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: palette.text, fontSize: fontSizes.labelText }]}>
                  {t('contact.message')}
                </Text>
                <TextInput
                  {...registrationKeyboardInputProps}
                  style={[
                    styles.input,
                    styles.textArea,
                    {
                      backgroundColor: palette.inputBg,
                      borderColor: palette.cardBorder,
                      color: palette.text,
                      fontSize: fontSizes.inputText,
                    },
                  ]}
                  placeholder={t('contact.messagePlaceholder')}
                  placeholderTextColor={palette.placeholder}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={message}
                  onChangeText={setMessage}
                />
              </View>

              <TouchableOpacity
                style={styles.termsRow}
                onPress={() => setIsAgreed(!isAgreed)}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.checkbox,
                    { borderColor: palette.accent },
                    isAgreed && { backgroundColor: palette.accent },
                  ]}
                >
                  {isAgreed ? <MaterialIcon name="check" size={14} color="#fff" /> : null}
                </View>
                <Text style={[styles.termsText, { color: palette.muted, fontSize: fontSizes.bodyText }]}>
                  {t('contact.agreeTerms')}{' '}
                  <Text style={{ color: palette.accent }} onPress={() => setShowTnC(true)}>
                    {t('contact.termsLink')}
                  </Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: palette.primaryBtn, opacity: submitting ? 0.65 : 1 },
                ]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={[styles.submitButtonText, { fontSize: fontSizes.buttonText }]}>
                    {t('contact.send')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: palette.text, fontSize: fontSizes.heading - 4 }]}>
              {t('contact.contactMethods')}
            </Text>
            <View style={styles.actionList}>
              {renderContactAction(
                'phone',
                'material',
                palette.accentOnSoft,
                palette.accentSoft,
                t('contact.callUs'),
                '+91-8792827744',
                () => openLink('tel:+918792827744'),
              )}
              {renderContactAction(
                'email',
                'material',
                palette.accentOnSoft,
                palette.accentSoft,
                t('contact.emailUs'),
                'support@serveaso.com',
                () => openLink('mailto:support@serveaso.com'),
              )}
              {renderContactAction(
                'whatsapp',
                'community',
                '#25D366',
                '#25D36622',
                t('contact.whatsapp'),
                '+91-8792827744',
                () => openLink('https://wa.me/918792827744'),
              )}
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.cardBorder }]}>
            <View style={styles.officeHeader}>
              <MaterialIcon name="schedule" size={20} color={palette.accent} />
              <Text style={[styles.sectionTitle, { color: palette.text, fontSize: fontSizes.heading - 4, marginBottom: 0 }]}>
                {t('contact.officeHours')}
              </Text>
            </View>
            <View style={[styles.hoursBox, { backgroundColor: palette.inputBg, borderColor: palette.cardBorder }]}>
              <Text style={[styles.hoursLine, { color: palette.text, fontSize: fontSizes.bodyText }]}>
                {t('contact.weekdays')}
              </Text>
              <Text style={[styles.hoursLine, { color: palette.text, fontSize: fontSizes.bodyText }]}>
                {t('contact.weekend')}
              </Text>
              <Text style={[styles.hoursLine, { color: palette.muted, fontSize: fontSizes.bodyText }]}>
                {t('contact.sunday')}
              </Text>
              <View style={[styles.emergencyBadge, { backgroundColor: palette.successSoft }]}>
                <MaterialIcon name="support-agent" size={16} color={palette.success} />
                <Text style={[styles.emergencyText, { color: palette.success, fontSize: fontSizes.bodyText - 1 }]}>
                  {t('contact.emergency')}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: palette.text, fontSize: fontSizes.heading - 4 }]}>
              {t('contact.whyChoose')}
            </Text>
            <View style={styles.benefitsList}>
              {benefitItems.map((item, index) => (
                <View key={index} style={styles.benefitItem}>
                  <MaterialIcon name="check-circle" size={18} color={palette.accent} />
                  <Text style={[styles.benefitText, { color: palette.muted, fontSize: fontSizes.benefitText }]}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.cardBorder }]}>
            <Text style={[styles.sectionTitle, { color: palette.text, fontSize: fontSizes.heading - 4 }]}>
              {t('contact.followUs')}
            </Text>
            <View style={styles.socialGrid}>
              {SOCIAL_LINKS.map((social) => (
                <TouchableOpacity
                  key={social.id}
                  style={[styles.socialButton, { backgroundColor: palette.inputBg, borderColor: palette.cardBorder }]}
                  onPress={() => openLink(social.url)}
                  accessibilityLabel={social.label}
                >
                  <MaterialCommunityIcon
                    name={social.icon}
                    size={24}
                    color={isDarkMode && social.darkColor ? social.darkColor : social.color}
                  />
                  <Text style={[styles.socialLabel, { color: palette.muted, fontSize: fontSizes.bodyText - 2 }]}>
                    {social.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <RegistrationKeyboardAccessory />
      <RegistrationAndroidKeyboardBar />

      <Modal visible={showTnC} animationType="slide" onRequestClose={() => setShowTnC(false)}>
        <View style={[styles.modalContainer, { backgroundColor: palette.canvas }]}>
          <HomeHeroPageHeader
            title={t('contact.termsLink', { defaultValue: 'Terms and Conditions' })}
            onBack={() => setShowTnC(false)}
            titleFontSize={fontSizes.heading - 2}
          />
          <TnC />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: HORIZONTAL_GUTTER,
    paddingTop: 12,
  },
  contentWrapper: {
    gap: 14,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  cardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontWeight: '700',
  },
  cardHint: {
    marginTop: 4,
    lineHeight: 20,
  },
  form: {
    gap: 14,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 110,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  termsText: {
    flex: 1,
    lineHeight: 20,
  },
  submitButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    marginTop: 4,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 14,
  },
  actionList: {
    gap: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTextWrap: {
    flex: 1,
  },
  actionLabel: {
    marginBottom: 2,
  },
  actionValue: {
    fontWeight: '600',
  },
  officeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  hoursBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    gap: 6,
  },
  hoursLine: {
    lineHeight: 20,
  },
  emergencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  emergencyText: {
    fontWeight: '600',
  },
  benefitsList: {
    gap: 10,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  benefitText: {
    flex: 1,
    lineHeight: 20,
  },
  socialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  socialButton: {
    width: '30%',
    minWidth: 96,
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  socialLabel: {
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
  },
});

export default ContactUs;
