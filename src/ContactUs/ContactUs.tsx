import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
  Alert,
  Modal,
  BackHandler,
  ActivityIndicator,
} from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import TnC from '../TermsAndConditions/TnC';
import { useTheme } from '../../src/Settings/ThemeContext';
import { BOOKING_HEADER_GRADIENT } from '../theme/brandColors';
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

const HORIZONTAL_GUTTER = 10;

const ContactUs: React.FC<ContactUsProps> = ({ onBack }) => {
  const { colors, isDarkMode, fontSize } = useTheme();
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
    onPress: () => void
  ) => (
    <TouchableOpacity
      style={[styles.actionRow, { borderColor: colors.border, backgroundColor: colors.surface }]}
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
        <Text style={[styles.actionLabel, { color: colors.textSecondary, fontSize: fontSizes.bodyText - 1 }]}>
          {label}
        </Text>
        <Text style={[styles.actionValue, { color: colors.text, fontSize: fontSizes.contactText }]} numberOfLines={1}>
          {value}
        </Text>
      </View>
      <MaterialIcon name="chevron-right" size={22} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <LinearGradient
        colors={[...BOOKING_HEADER_GRADIENT]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={[styles.headerSideSlot, styles.headerBackBtn]}
            onPress={goHome}
            accessibilityLabel="Go back"
          >
            <MaterialCommunityIcon name="arrow-left" size={24} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.headerTitleBlock} pointerEvents="none">
            <Text
              style={[styles.headerTitle, { fontSize: fontSizes.heading }]}
              numberOfLines={1}
            >
              {t('contact.title', { defaultValue: 'Contact Us' })}
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={2}>
              {t('contact.subtitle', { defaultValue: "We're here to help! Reach out to us anytime." })}
            </Text>
          </View>

          <View style={styles.headerSideSlot} />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <View style={styles.contentWrapper}>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.cardIconWrap, { backgroundColor: colors.infoLight }]}>
                <MaterialIcon name="mail-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={[styles.cardTitle, { color: colors.text, fontSize: fontSizes.heading - 2 }]}>
                  {t('contact.formTitle')}
                </Text>
                <Text style={[styles.cardHint, { color: colors.textSecondary, fontSize: fontSizes.bodyText }]}>
                  {t('contact.formDescription')}
                </Text>
              </View>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text, fontSize: fontSizes.labelText }]}>
                  {t('contact.fullName')}
                </Text>
                <TextInput
                  {...registrationKeyboardInputProps}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.text,
                      fontSize: fontSizes.inputText,
                    },
                  ]}
                  placeholder={t('contact.namePlaceholder')}
                  placeholderTextColor={colors.placeholder}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text, fontSize: fontSizes.labelText }]}>
                  {t('contact.emailAddress')}
                </Text>
                <TextInput
                  {...registrationKeyboardInputProps}
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.text,
                      fontSize: fontSizes.inputText,
                    },
                  ]}
                  placeholder={t('contact.emailPlaceholder')}
                  placeholderTextColor={colors.placeholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text, fontSize: fontSizes.labelText }]}>
                  {t('contact.message')}
                </Text>
                <TextInput
                  {...registrationKeyboardInputProps}
                  style={[
                    styles.input,
                    styles.textArea,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.text,
                      fontSize: fontSizes.inputText,
                    },
                  ]}
                  placeholder={t('contact.messagePlaceholder')}
                  placeholderTextColor={colors.placeholder}
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
                    { borderColor: colors.primary },
                    isAgreed && { backgroundColor: colors.primary },
                  ]}
                >
                  {isAgreed ? <MaterialIcon name="check" size={14} color="#fff" /> : null}
                </View>
                <Text style={[styles.termsText, { color: colors.textSecondary, fontSize: fontSizes.bodyText }]}>
                  {t('contact.agreeTerms')}{' '}
                  <Text style={{ color: colors.primary }} onPress={() => setShowTnC(true)}>
                    {t('contact.termsLink')}
                  </Text>
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: colors.primary, opacity: submitting ? 0.65 : 1 },
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

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSizes.heading - 4 }]}>
              {t('contact.contactMethods')}
            </Text>
            <View style={styles.actionList}>
              {renderContactAction(
                'phone',
                'material',
                colors.primary,
                colors.infoLight,
                t('contact.callUs'),
                '+91-8792827744',
                () => openLink('tel:+918792827744')
              )}
              {renderContactAction(
                'email',
                'material',
                colors.primary,
                colors.infoLight,
                t('contact.emailUs'),
                'support@serveaso.com',
                () => openLink('mailto:support@serveaso.com')
              )}
              {renderContactAction(
                'whatsapp',
                'community',
                '#25D366',
                '#25D36622',
                t('contact.whatsapp'),
                '+91-8792827744',
                () => openLink('https://wa.me/918792827744')
              )}
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.officeHeader}>
              <MaterialIcon name="schedule" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSizes.heading - 4, marginBottom: 0 }]}>
                {t('contact.officeHours')}
              </Text>
            </View>
            <View style={[styles.hoursBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.hoursLine, { color: colors.text, fontSize: fontSizes.bodyText }]}>
                {t('contact.weekdays')}
              </Text>
              <Text style={[styles.hoursLine, { color: colors.text, fontSize: fontSizes.bodyText }]}>
                {t('contact.weekend')}
              </Text>
              <Text style={[styles.hoursLine, { color: colors.textSecondary, fontSize: fontSizes.bodyText }]}>
                {t('contact.sunday')}
              </Text>
              <View style={[styles.emergencyBadge, { backgroundColor: colors.successLight }]}>
                <MaterialIcon name="support-agent" size={16} color={colors.success} />
                <Text style={[styles.emergencyText, { color: colors.success, fontSize: fontSizes.bodyText - 1 }]}>
                  {t('contact.emergency')}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSizes.heading - 4 }]}>
              {t('contact.whyChoose')}
            </Text>
            <View style={styles.benefitsList}>
              {benefitItems.map((item, index) => (
                <View key={index} style={styles.benefitItem}>
                  <MaterialIcon name="check-circle" size={18} color={colors.success} />
                  <Text style={[styles.benefitText, { color: colors.textSecondary, fontSize: fontSizes.benefitText }]}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSizes.heading - 4 }]}>
              {t('contact.followUs')}
            </Text>
            <View style={styles.socialGrid}>
              {SOCIAL_LINKS.map((social) => (
                <TouchableOpacity
                  key={social.id}
                  style={[styles.socialButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={() => openLink(social.url)}
                  accessibilityLabel={social.label}
                >
                  <MaterialCommunityIcon
                    name={social.icon}
                    size={24}
                    color={isDarkMode && social.darkColor ? social.darkColor : social.color}
                  />
                  <Text style={[styles.socialLabel, { color: colors.textSecondary, fontSize: fontSizes.bodyText - 2 }]}>
                    {social.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSizes.heading - 4 }]}>
              {t('contact.downloadApp')}
            </Text>
            <View style={styles.storeRow}>
              <TouchableOpacity
                style={[styles.storeButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => openLink('https://play.google.com')}
              >
                <MaterialCommunityIcon name="google-play" size={28} color="#3DDC84" />
                <Text style={[styles.storeText, { color: colors.text, fontSize: fontSizes.bodyText }]}>
                  {t('contact.googlePlay')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.storeButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => openLink('https://apps.apple.com')}
              >
                <MaterialCommunityIcon name="apple" size={28} color={colors.text} />
                <Text style={[styles.storeText, { color: colors.text, fontSize: fontSizes.bodyText }]}>
                  {t('contact.appStore')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <RegistrationKeyboardAccessory />
      <RegistrationAndroidKeyboardBar />

      <Modal visible={showTnC} animationType="slide" onRequestClose={() => setShowTnC(false)}>
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
          <LinearGradient
            colors={[...BOOKING_HEADER_GRADIENT]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.modalHeader}
          >
            <TouchableOpacity
              style={[styles.headerSideSlot, styles.headerBackBtn]}
              onPress={() => setShowTnC(false)}
              accessibilityLabel="Close"
            >
              <MaterialCommunityIcon name="arrow-left" size={24} color="#ffffff" />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { fontSize: fontSizes.heading - 2 }]}>
              {t('contact.termsLink', { defaultValue: 'Terms and Conditions' })}
            </Text>
            <View style={styles.headerSideSlot} />
          </LinearGradient>
          <TnC />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    width: '100%',
    alignSelf: 'stretch',
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    minHeight: 68,
    paddingHorizontal: HORIZONTAL_GUTTER,
    position: 'relative',
  },
  headerSideSlot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  headerBackBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  headerTitleBlock: {
    position: 'absolute',
    left: 52,
    right: 52,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  headerTitle: {
    color: '#ffffff',
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  headerSubtitle: {
    color: 'rgba(219, 234, 254, 0.95)',
    textAlign: 'center',
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
    lineHeight: 18,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: HORIZONTAL_GUTTER,
    paddingTop: 12,
    paddingBottom: 40,
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
  storeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  storeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  storeText: {
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: HORIZONTAL_GUTTER,
    paddingBottom: 12,
    minHeight: 68,
  },
  modalTitle: {
    flex: 1,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
});

export default ContactUs;
