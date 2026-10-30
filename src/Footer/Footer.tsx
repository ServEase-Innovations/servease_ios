// Footer.tsx — sleek, compact, modern footer aligned with customer home (HOME_M3)
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  TouchableOpacity,
  Linking,
  StyleSheet,
  Image,
  Modal,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Text } from '../theme/BrandTypography';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { HOME_M3, HOME_PAGE_GRADIENT } from '../theme/brandColors';
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

const SOCIAL_ICON: Record<Exclude<FooterSocialKey, 'x'>, string> = {
  instagram: 'instagram',
  youtube: 'youtube',
  linkedin: 'linkedin',
  facebook: 'facebook',
};

const SOCIAL_LABEL: Record<FooterSocialKey, string> = {
  x: 'X (Twitter)',
  instagram: 'Instagram',
  youtube: 'YouTube',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
};

const COMPANY_NAME = 'ServEase Innovation and Technology Pvt. Ltd.';
const ESTD_YEAR = 2024;

const getSocialUrl = (settings: FooterSettings, key: FooterSocialKey): string => {
  const s = settings as any;
  return (
    s?.socialLinks?.[key] ??
    s?.social?.[key] ??
    s?.[`${key}Url`] ??
    s?.[key] ??
    ''
  );
};

type FooterProps = {
  bottomOffset?: number;
};

const Footer = ({ bottomOffset = 0 }: FooterProps) => {
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

  const isCompact = screenWidth < 360;
  const isWide = screenWidth >= 600;
  const maxContentWidth = 1200;
  const hPad = isCompact ? 12 : isWide ? 24 : 16;
  const termsTitleSize = fontSize === 'large' ? 24 : fontSize === 'small' ? 18 : 20;

  const cardBg = isDarkMode ? colors.card : '#FFFFFF';
  const cardBorder = isDarkMode ? colors.border : 'rgba(226, 232, 240, 0.9)';
  const titleColor = isDarkMode ? colors.text : '#0F172A';
  const mutedColor = isDarkMode ? colors.textSecondary : '#64748B';
  const accentColor = isDarkMode ? colors.primary : '#0284C7';
  const pillBg = isDarkMode ? colors.surface : '#F0F9FF';
  const pillBorder = isDarkMode ? colors.border : '#BAE6FD';

  const helplineLabel = formatPhoneDisplay(footerSettings.helplinePhone);
  const joinUsLabel = formatPhoneDisplay(footerSettings.joinUsPhone);
  const year = new Date().getFullYear();

  const socials = useMemo(
    () =>
      FOOTER_SOCIAL_ORDER.map((key) => ({ key, url: getSocialUrl(footerSettings, key) })).filter(
        (s) => !!s.url,
      ),
    [footerSettings],
  );

  const openLink = (url: string) => {
    if (!url) return;
    Linking.openURL(url).catch((err) => console.error("Couldn't load page", err));
  };

  const makePhoneCall = (phoneNumber: string) => {
    if (!phoneNumber) return;
    Linking.openURL(`tel:${phoneNumber}`).catch((err) =>
      console.error("Couldn't make phone call", err),
    );
  };

  const renderSocialIcon = (key: FooterSocialKey) => {
    if (key === 'x') {
      return <Text style={[styles.xIcon, { color: accentColor }]} allowFontScaling={false}>X</Text>;
    }
    return (
      <MaterialCommunityIcon
        name={SOCIAL_ICON[key as Exclude<FooterSocialKey, 'x'>]}
        size={18}
        color={accentColor}
      />
    );
  };

  return (
    <>
      <View
        style={[
          styles.wrap,
          {
            paddingHorizontal: hPad,
            paddingBottom: 14 + bottomOffset,
          },
        ]}
      >
        <View style={[styles.inner, { maxWidth: maxContentWidth }]}>
          <View
            style={[
              styles.card,
              {
                backgroundColor: cardBg,
                borderColor: cardBorder,
                shadowColor: isDarkMode ? '#000' : '#0284C7',
              },
            ]}
          >
            {/* ----- Brand Banner ----- */}
            <View style={styles.brandBanner}>
              <LinearGradient
                colors={[...HOME_PAGE_GRADIENT]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View pointerEvents="none" style={[styles.orb, styles.orbOne]} />
              <View pointerEvents="none" style={[styles.orb, styles.orbTwo]} />

              <View style={styles.logoRing}>
                <Image
                  source={require('../../assets/images/iconlogo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              <View style={styles.brandCopy}>
                <View style={styles.brandTitleRow}>
                  <Text style={styles.brandName} allowFontScaling={false}>
                    ServEaso
                  </Text>
                  <View style={styles.estdBadge}>
                    <MaterialIcon name="verified" size={11} color="#FFFFFF" />
                    <Text style={styles.estdText} allowFontScaling={false}>
                      Since {ESTD_YEAR}
                    </Text>
                  </View>
                </View>
                <Text style={styles.tagline} allowFontScaling={false}>
                  Trusted home services, made easy
                </Text>
              </View>
            </View>

            {/* ----- Short About Statement ----- */}
            <Text style={[styles.aboutText, { color: mutedColor }]}>
              Connecting families with verified, skilled professionals so everyday home care feels effortless.
            </Text>

            {/* ----- Side-by-side Contact Cards ----- */}
            <View style={[styles.contactGrid, isCompact && styles.contactGridStack]}>
              <TouchableOpacity
                style={[
                  styles.contactCard,
                  { backgroundColor: pillBg, borderColor: pillBorder },
                ]}
                onPress={() => makePhoneCall(footerSettings.helplinePhone)}
                activeOpacity={0.82}
                accessibilityRole="button"
                accessibilityLabel={`Call helpline ${helplineLabel}`}
              >
                <View style={[styles.contactIconWrap, { backgroundColor: cardBg }]}>
                  <MaterialIcon name="support-agent" size={18} color={accentColor} />
                </View>
                <View style={styles.contactCopy}>
                  <Text style={[styles.contactLabel, { color: mutedColor }]} allowFontScaling={false}>
                    Helpline
                  </Text>
                  <Text
                    style={[styles.contactValue, { color: titleColor }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    allowFontScaling={false}
                  >
                    {helplineLabel}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.contactCard,
                  { backgroundColor: pillBg, borderColor: pillBorder },
                ]}
                onPress={() => makePhoneCall(footerSettings.joinUsPhone)}
                activeOpacity={0.82}
                accessibilityRole="button"
                accessibilityLabel={`Call join us ${joinUsLabel}`}
              >
                <View style={[styles.contactIconWrap, { backgroundColor: cardBg }]}>
                  <MaterialIcon name="handshake" size={18} color={accentColor} />
                </View>
                <View style={styles.contactCopy}>
                  <Text style={[styles.contactLabel, { color: mutedColor }]} allowFontScaling={false}>
                    Join as Partner
                  </Text>
                  <Text
                    style={[styles.contactValue, { color: titleColor }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    allowFontScaling={false}
                  >
                    {joinUsLabel}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={[styles.divider, { backgroundColor: cardBorder }]} />

            {/* ----- Socials + Terms Row ----- */}
            <View style={styles.footerActionsRow}>
              {socials.length > 0 && (
                <View style={styles.socialRow}>
                  {socials.map(({ key, url }) => (
                    <TouchableOpacity
                      key={key}
                      onPress={() => openLink(url)}
                      activeOpacity={0.8}
                      style={[
                        styles.socialButton,
                        { backgroundColor: pillBg, borderColor: pillBorder },
                      ]}
                      accessibilityRole="link"
                      accessibilityLabel={SOCIAL_LABEL[key]}
                    >
                      {renderSocialIcon(key)}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              <TouchableOpacity
                onPress={() => setShowTnC(true)}
                style={[styles.tncBtn, { backgroundColor: pillBg, borderColor: pillBorder }]}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityLabel="Terms and Conditions"
              >
                <MaterialIcon name="description" size={15} color={accentColor} />
                <Text style={[styles.tncText, { color: accentColor }]} allowFontScaling={false}>
                  Terms & Conditions
                </Text>
                <MaterialIcon name="chevron-right" size={16} color={accentColor} />
              </TouchableOpacity>
            </View>

            {/* ----- Integrated Copyright Footer ----- */}
            <View style={styles.copyrightWrap}>
              <Text style={[styles.copyrightCompany, { color: mutedColor }]} allowFontScaling={false}>
                © {ESTD_YEAR}{year > ESTD_YEAR ? `–${year}` : ''} {COMPANY_NAME}
              </Text>
              <View style={styles.madeInRow}>
                <Text style={[styles.madeInText, { color: mutedColor }]} allowFontScaling={false}>
                  All rights reserved • Made with
                </Text>
                <MaterialIcon name="favorite" size={11} color="#EF4444" />
                <Text style={[styles.madeInText, { color: mutedColor }]} allowFontScaling={false}>
                  in India
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <Modal
        visible={showTnC}
        animationType="slide"
        onRequestClose={() => setShowTnC(false)}
        presentationStyle={Platform.OS === 'ios' ? 'fullScreen' : undefined}
      >
        <View
          style={[
            styles.termsModalRoot,
            { backgroundColor: isDarkMode ? colors.background : HOME_M3.surface },
          ]}
        >
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
    marginTop: 8,
    paddingTop: 8,
    flexShrink: 0,
  },
  inner: {
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    width: '100%',
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  brandBanner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  orbOne: { width: 120, height: 120, top: -45, right: -25 },
  orbTwo: { width: 80, height: 80, bottom: -35, left: '42%' },
  logoRing: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  brandCopy: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  brandName: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  estdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.38)',
  },
  estdText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  tagline: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 12.5,
    fontWeight: '500',
    marginTop: 3,
  },
  aboutText: {
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  contactGrid: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  contactGridStack: {
    flexDirection: 'column',
  },
  contactCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
    minWidth: 0,
  },
  contactIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    flexShrink: 0,
  },
  contactCopy: {
    flex: 1,
    minWidth: 0,
  },
  contactLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 1,
  },
  contactValue: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 14,
  },
  footerActionsRow: {
    width: '100%',
    alignItems: 'center',
    gap: 10,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  socialButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  xIcon: {
    fontSize: 14,
    fontWeight: '800',
  },
  tncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  tncText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  copyrightWrap: {
    marginTop: 12,
    alignItems: 'center',
    paddingHorizontal: 36,
    gap: 2,
  },
  copyrightCompany: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
  madeInRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  madeInText: {
    fontSize: 10.5,
    fontWeight: '500',
  },
  termsModalRoot: {
    flex: 1,
  },
});

export default Footer;