import React, { useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../Settings/ThemeContext';
import { HOME_M3 } from '../theme/brandColors';

type PrivacyPolicyProps = {
  /** Hide in-content title when a parent screen already shows the header. */
  embedded?: boolean;
};

const PrivacyPolicy = ({ embedded = false }: PrivacyPolicyProps) => {
  const { isDarkMode, colors } = useTheme();

  const palette = useMemo(
    () => ({
      canvas: isDarkMode ? colors.background : HOME_M3.surface,
      card: isDarkMode ? colors.card : HOME_M3.surfaceContainerLowest,
      cardBorder: isDarkMode ? colors.border : HOME_M3.outlineVariant,
      title: isDarkMode ? colors.text : HOME_M3.primary,
      text: isDarkMode ? colors.text : HOME_M3.onSurface,
      muted: isDarkMode ? colors.textSecondary : HOME_M3.onSurfaceVariant,
      section: isDarkMode ? colors.text : HOME_M3.primary,
      accent: HOME_M3.secondary,
      chipBg: isDarkMode ? HOME_M3.primaryContainer : HOME_M3.primaryContainer,
      chipText: HOME_M3.onPrimaryContainer,
      contactBg: isDarkMode ? colors.surface : HOME_M3.surfaceContainerLow,
      noticeBg: isDarkMode ? 'rgba(51, 91, 175, 0.18)' : HOME_M3.secondaryFixed,
      noticeTitle: isDarkMode ? colors.text : HOME_M3.onSecondaryFixedVariant,
      divider: isDarkMode ? colors.border : HOME_M3.outlineVariant,
      bullet: HOME_M3.secondary,
    }),
    [colors, isDarkMode],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: palette.canvas,
        },
        content: {
          paddingHorizontal: 16,
          paddingTop: embedded ? 12 : 16,
          paddingBottom: 32,
        },
        paper: {
          backgroundColor: palette.card,
          borderRadius: 16,
          padding: 20,
          borderWidth: 1,
          borderColor: palette.cardBorder,
        },
        headerRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 12,
        },
        titleBlock: {
          flex: 1,
        },
        title: {
          fontSize: 24,
          fontWeight: '800',
          color: palette.title,
          marginBottom: 4,
        },
        chip: {
          alignSelf: 'flex-start',
          backgroundColor: palette.chipBg,
          borderRadius: 999,
          paddingHorizontal: 12,
          paddingVertical: 6,
        },
        chipText: {
          color: palette.chipText,
          fontSize: 12,
          fontWeight: '600',
        },
        subtitle: {
          fontSize: 15,
          color: palette.muted,
          lineHeight: 22,
          marginBottom: 16,
        },
        introIconRow: {
          flexDirection: 'row',
          alignItems: 'flex-start',
          backgroundColor: palette.contactBg,
          borderRadius: 12,
          padding: 14,
          marginBottom: 8,
          borderWidth: 1,
          borderColor: palette.cardBorder,
        },
        introIcon: {
          marginRight: 10,
          marginTop: 1,
        },
        introText: {
          flex: 1,
          fontSize: 14,
          lineHeight: 21,
          color: palette.text,
        },
        divider: {
          height: 1,
          backgroundColor: palette.divider,
          marginVertical: 20,
        },
        sectionTitle: {
          fontSize: 18,
          fontWeight: '700',
          color: palette.section,
          marginTop: 20,
          marginBottom: 10,
        },
        subsectionTitle: {
          fontSize: 15,
          fontWeight: '700',
          color: palette.text,
          marginTop: 12,
          marginBottom: 8,
        },
        paragraph: {
          fontSize: 14,
          lineHeight: 22,
          color: palette.text,
          marginBottom: 12,
        },
        list: {
          marginLeft: 4,
        },
        listItem: {
          flexDirection: 'row',
          marginBottom: 10,
        },
        bullet: {
          marginRight: 10,
          color: palette.bullet,
          fontSize: 14,
          lineHeight: 22,
          fontWeight: '700',
        },
        listText: {
          flex: 1,
          fontSize: 14,
          lineHeight: 22,
          color: palette.text,
        },
        contactBox: {
          backgroundColor: palette.contactBg,
          borderRadius: 12,
          padding: 16,
          marginTop: 8,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: palette.cardBorder,
        },
        importantBox: {
          backgroundColor: palette.noticeBg,
          borderRadius: 12,
          padding: 16,
          marginTop: 8,
          borderWidth: 1,
          borderColor: palette.cardBorder,
        },
        importantTitle: {
          fontSize: 15,
          fontWeight: '700',
          color: palette.noticeTitle,
          marginBottom: 12,
        },
        noteText: {
          fontSize: 12,
          fontStyle: 'italic',
          marginTop: 8,
          color: palette.muted,
          lineHeight: 18,
        },
        bold: {
          fontWeight: '700',
          color: palette.text,
        },
        link: {
          color: palette.accent,
          fontWeight: '600',
        },
      }),
    [embedded, palette],
  );

  const openEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`).catch((err) =>
      console.error("Couldn't load email client", err),
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.paper}>
        {!embedded ? (
          <View style={styles.headerRow}>
            <View style={styles.titleBlock}>
              <Text style={styles.title}>Privacy Policy</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>Effective: June 22, 2025</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.chip, { marginBottom: 14 }]}>
            <Text style={styles.chipText}>Effective: June 22, 2025</Text>
          </View>
        )}

        <Text style={styles.subtitle}>
          For ServEaso App — Unit of ServEase Innovation Talent Tap Pvt Ltd.
        </Text>

        <View style={styles.introIconRow}>
          <Icon name="shield" size={20} color={palette.accent} style={styles.introIcon} />
          <Text style={styles.introText}>
            At ServEase Innovation Talent Tap, we are committed to protecting the privacy and
            personal data of our clients and service providers. This Privacy Policy explains how
            we collect, use, disclose, and protect your personal information when you use our
            maid, nanny, and cook services.
          </Text>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>1. Who We Are</Text>
        <Text style={styles.paragraph}>
          ServEase Innovation Talent Tap is a service provider based in Karnataka, India,
          specializing in connecting clients with qualified household service professionals.
        </Text>

        <Text style={styles.sectionTitle}>2. Information We Collect</Text>
        <Text style={styles.paragraph}>
          We collect various types of information to provide and improve our services to you.
          This may include:
        </Text>

        <Text style={styles.subsectionTitle}>a. Information You Provide Directly:</Text>
        <View style={styles.list}>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>
              Contact Information: Name, address, email address, phone number and KYC document.
            </Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>
              Service Preferences: Details about the type of service required (maid, nanny, cook), frequency, schedule, specific tasks, special instructions.
            </Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>
              Household Information: Number of children, pets, size of residence, specific areas to be serviced.
            </Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>
              Payment Information: Billing address, UPI, credit/debit card details (processed securely via third-party payment processors).
            </Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>
              Identification (for Service Providers): Aadhar Card, passport details, work permits, educational qualifications, previous employment history.
            </Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>
              Communication Content: Information you provide when communicating with us via phone, email, or messaging apps.
            </Text>
          </View>
        </View>

        <Text style={styles.subsectionTitle}>b. Information We Collect Automatically:</Text>
        <View style={styles.list}>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>
              Usage Data: Information about how you interact with our website or mobile application.
            </Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>
              Technical Data: IP address, browser type, operating system, device identifiers.
            </Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>
              Cookies and Tracking Technologies: We may use cookies and similar technologies to enhance your experience.
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>10. Contact Us</Text>
        <View style={styles.contactBox}>
          <Text style={styles.paragraph}>
            If you have any questions or concerns about this Privacy Policy or our data
            practices, please contact us at:
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>ServEase Innovation Talent Tap</Text>
            {'\n'}
            #58 Sir MV Nagar, Ramamurthy Nagar{'\n'}
            Bengaluru, Karnataka{'\n'}
            Email —{' '}
            <Text style={styles.link} onPress={() => openEmail('support@serveasinnovation.com')}>
              support@serveasinnovation.com
            </Text>{' '}
            or{' '}
            <Text style={styles.link} onPress={() => openEmail('support@serveaso.com')}>
              support@serveaso.com
            </Text>
          </Text>
        </View>

        <View style={styles.importantBox}>
          <Text style={styles.importantTitle}>Crucial Considerations for Your Legal Review:</Text>
          <View style={styles.list}>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>
                Federal Decree-Law No. 45 of 2021 on Personal Data Protection (PDPL): Your privacy statement must align with its principles.
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>
                Consent: Ensure your consent mechanisms are clear and verifiable.
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>
                Sensitive Personal Data: Specify the lawful basis for processing sensitive data.
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>
                Children's Data: Ensure compliance with specific provisions regarding children's data.
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>
                Data Breach Notification: Familiarize yourself with the requirements for notifying authorities.
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>
                Data Protection Officer (DPO): Depending on the scale of processing, you might need to appoint a DPO.
              </Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>
                Cross-Border Transfers: Ensure adequate protection mechanisms for data transferred outside India.
              </Text>
            </View>
          </View>
          <Text style={styles.noteText}>
            Important Note: This should be reviewed and customized by a legal professional
            to ensure full compliance with India's data protection laws.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default PrivacyPolicy;
