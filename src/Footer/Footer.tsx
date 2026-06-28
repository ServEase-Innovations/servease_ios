// Footer.tsx — light surface footer aligned with customer home (HOME_M3)
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  StyleSheet,
  Image,
  Modal,
  useWindowDimensions,
} from 'react-native';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { HOME_M3, HOME_HERO_GRADIENT } from '../theme/brandColors';
import { useTheme } from '../Settings/ThemeContext';
import TnC from '../TermsAndConditions/TnC';
import { HomeHeroPageHeader } from '../common/HomeHeroPageHeader';
import {
  DEFAULT_FOOTER_SETTINGS,
  FOOTER_SOCIAL_ORDER,
  FooterSettings,
  FooterSocialKey,
  fetchPublicFooterSettings,
  formatPhoneDisplay,
} from '../services/footerSettings';

const SOCIAL_ICON: Record<Exclude<FooterSocialKey, 'x'>, { name: string }> = {
  instagram: { name: 'instagram' },
  youtube: { name: 'youtube' },
  linkedin: { name: 'linkedin' },
  facebook: { name: 'facebook' },
};

const SOCIAL_LABEL: Record<FooterSocialKey, string> = {
  x: 'X (Twitter)',
  instagram: 'Instagram',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
};

const Footer = () => {
  const { width: screenWidth } = useWindowDimensions();
  const { colors, isDarkMode, fontSize } = useTheme();
  const [showTnC, setShowTnC] = useState(false);
  const [footerSettings, setFooterSettings] = useState<FooterSettings>(DEFAULT_FOOTER_SETTINGS);

  useEffect(() => {
    let active = true;
    fetchPublicFooterSettings().then((settings) => {
      if (active) setFooterSettings(settings);
    });
    return () => {
      active = false;
    };
  }, []);

  const cardBg = isDarkMode ? colors.card : HOME_M3.surfaceContainerLowest;
  const cardBorder = isDarkMode ? colors.border : HOME_M3.outlineVariant;
  const titleColor = isDarkMode ? colors.text : HOME_M3.onSurface;
  const mutedColor = isDarkMode ? colors.textSecondary : HOME_M3.onSurfaceVariant;
  const accentColor = isDarkMode ? colors.primary : HOME_M3.secondary;
  const iconBg = isDarkMode ? colors.surface : HOME_M3.secondaryFixed;
  const iconColor = isDarkMode ? colors.primary : HOME_M3.onSecondaryFixedVariant;
  const bandBg = isDarkMode ? colors.background : HOME_M3.surfaceContainerLow;

  const openLink = (url: string) => {
    if (!url) return;
    Linking.openURL(url).catch((err) => console.error("Couldn't load page", err));
  };

  const makePhoneCall = (phoneNumber: string) => {
    if (!phoneNumber) return;
    Linking.openURL(`tel:${phoneNumber}`).catch((err) => console.error("Couldn't make phone call", err));
  };

  const helplineLabel = formatPhoneDisplay(footerSettings.helplinePhone);
  const joinUsLabel = formatPhoneDisplay(footerSettings.joinUsPhone);
  const iconSize = screenWidth < 360 ? 16 : 18;
  const termsTitleSize = fontSize === 'large' ? 24 : fontSize === 'small' ? 18 : 20;

  const renderSocialIcon = (key: FooterSocialKey) => {
    if (key === 'x') {
      return <Text style={[styles.xIcon, { color: iconColor }]}>X</Text>;
    }
    const meta = SOCIAL_ICON[key as Exclude<FooterSocialKey, 'x'>];
    return <MaterialCommunityIcon name={meta.name} size={iconSize} color={iconColor} />;
  };

  return (
    <>
      <View style={[styles.wrap, { backgroundColor: bandBg }]}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: cardBg,
              borderColor: cardBorder,
              shadowColor: isDarkMode ? '#000' : '#0f172a',
            },
          ]}
        >
          <View style={styles.brandBlock}>
            <View style={[styles.logoRing, { backgroundColor: iconBg, borderColor: cardBorder }]}>
              <Image
                source={require('../../assets/images/serveasonew.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={[styles.brandName, { color: titleColor }]}>ServEaso</Text>
            <Text style={[styles.tagline, { color: mutedColor }]}>Trusted home services</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: cardBorder }]} />

          <Text style={[styles.sectionLabel, { color: mutedColor }]}>Contact us</Text>
          <View style={styles.contactRow}>
            <TouchableOpacity
              style={[styles.contactPill, { backgroundColor: iconBg, borderColor: cardBorder }]}
              onPress={() => makePhoneCall(footerSettings.helplinePhone)}
              activeOpacity={0.88}
            >
              <View style={[styles.contactIconWrap, { backgroundColor: cardBg }]}>
                <MaterialIcon name="phone-in-talk" size={16} color={accentColor} />
              </View>
              <View style={styles.contactCopy}>
                <Text style={[styles.contactLabel, { color: mutedColor }]}>Helpline</Text>
                <Text style={[styles.contactValue, { color: titleColor }]} numberOfLines={1}>
                  {helplineLabel}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.contactPill, { backgroundColor: iconBg, borderColor: cardBorder }]}
              onPress={() => makePhoneCall(footerSettings.joinUsPhone)}
              activeOpacity={0.88}
            >
              <View style={[styles.contactIconWrap, { backgroundColor: cardBg }]}>
                <MaterialIcon name="support-agent" size={16} color={accentColor} />
              </View>
              <View style={styles.contactCopy}>
                <Text style={[styles.contactLabel, { color: mutedColor }]}>Join us</Text>
                <Text style={[styles.contactValue, { color: titleColor }]} numberOfLines={1}>
                  {joinUsLabel}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={[styles.divider, { backgroundColor: cardBorder }]} />

          <Text style={[styles.sectionLabel, { color: mutedColor }]}>Follow us</Text>
          <View style={styles.socialRow}>
            {FOOTER_SOCIAL_ORDER.map((key) => {
              const href = footerSettings.social[key];
              if (!href) return null;
              return (
                <TouchableOpacity
                  key={key}
                  accessibilityLabel={SOCIAL_LABEL[key]}
                  style={[styles.socialButton, { backgroundColor: iconBg, borderColor: cardBorder }]}
                  onPress={() => openLink(href)}
                  activeOpacity={0.88}
                >
                  {renderSocialIcon(key)}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity onPress={() => setShowTnC(true)} hitSlop={8} style={styles.tncBtn}>
            <Text style={[styles.tncText, { color: accentColor }]}>Terms & Conditions</Text>
          </TouchableOpacity>
        </View>

        <LinearGradient
          colors={[...HOME_HERO_GRADIENT]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.brandStripe}
        >
          <Text style={styles.stripeText}>ServEaso — home help you can trust</Text>
        </LinearGradient>
      </View>

      <Modal visible={showTnC} animationType="slide" onRequestClose={() => setShowTnC(false)}>
        <View style={[styles.termsModalRoot, { backgroundColor: isDarkMode ? colors.background : HOME_M3.surface }]}>
          <HomeHeroPageHeader
            title="Terms & Conditions"
            onBack={() => setShowTnC(false)}
            titleFontSize={termsTitleSize}
          />
          <TnC />
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignSelf: 'stretch',
    marginTop: 12,
    paddingTop: 16,
    paddingBottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  card: {
    width: '100%',
    alignSelf: 'stretch',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  brandBlock: {
    width: '100%',
    alignItems: 'center',
  },
  logoRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  brandName: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 4,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 16,
    opacity: 0.85,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 10,
    width: '100%',
  },
  contactRow: {
    width: '100%',
  },
  contactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  contactIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactCopy: {
    flex: 1,
    minWidth: 0,
  },
  contactLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  socialRow: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  socialButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    marginVertical: 4,
  },
  xIcon: {
    fontSize: 13,
    fontWeight: '800',
  },
  tncBtn: {
    alignSelf: 'center',
    marginTop: 12,
    paddingVertical: 4,
  },
  tncText: {
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  brandStripe: {
    width: '100%',
    alignSelf: 'stretch',
    marginTop: 10,
    marginBottom: 0,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stripeText: {
    color: HOME_M3.onPrimaryContainer,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  modalTitle: {
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontSize: 18,
  },
  closeButton: {
    padding: 4,
  },
});

export default Footer;
