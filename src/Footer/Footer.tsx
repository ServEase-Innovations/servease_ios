// Footer.tsx — premium gradient footer aligned with customer home (HOME_M3)
// Responsive, full-width, and safe against text clipping on iOS / small Android.
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

// Safe-area bottom inset (iPhone home indicator / Android gesture bar).
// Uses react-native-safe-area-context when installed, otherwise a sensible fallback.
let useBottomInset: () => number = () => (Platform.OS === 'ios' ? 20 : 0);
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const safeArea = require('react-native-safe-area-context');
  if (safeArea?.useSafeAreaInsets) {
    useBottomInset = () => safeArea.useSafeAreaInsets().bottom;
  }
} catch {
  /* fallback already set */
}

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

const COMPANY_NAME = 'ServEase Innovation and Technology Private Limited';
const ESTD_YEAR = 2024;

// Defensive lookup: supports `socialLinks`, `social`, or flat keys on the settings object.
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
  /**
   * Extra space added under the footer (e.g. height of a floating bottom tab bar)
   * so the copyright stripe never hides behind it. Defaults to 0.
   */
  bottomOffset?: number;
};

const Footer = ({ bottomOffset = 0 }: FooterProps) => {
  const { width: screenWidth } = useWindowDimensions();
  const bottomInset = useBottomInset();
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

  // ---- Responsive scale -------------------------------------------------
  const isCompact = screenWidth < 360; // small Androids, iPhone SE / mini
  const isWide = screenWidth >= 600; // large phones landscape, tablets, iPad
  const isXWide = screenWidth >= 900;
  const maxContentWidth = 1200;
  const hPad = isCompact ? 12 : isWide ? 24 : 16;
  const iconSize = isCompact ? 16 : 18;
  const brandSize = isCompact ? 20 : isWide ? 28 : 24;
  const taglineSize = isCompact ? 12 : 13;
  const termsTitleSize = fontSize === 'large' ? 24 : fontSize === 'small' ? 18 : 20;

  // ---- Theme tokens -----------------------------------------------------
  const cardBg = isDarkMode ? colors.card : HOME_M3.surfaceContainerLowest;
  const cardBorder = isDarkMode ? colors.border : HOME_M3.outlineVariant;
  const titleColor = isDarkMode ? colors.text : HOME_M3.onSurface;
  const mutedColor = isDarkMode ? colors.textSecondary : HOME_M3.onSurfaceVariant;
  const accentColor = isDarkMode ? colors.primary : HOME_M3.secondary;
  const iconBg = isDarkMode ? colors.surface : HOME_M3.secondaryFixed;
  const iconColor = isDarkMode ? colors.primary : HOME_M3.onSecondaryFixedVariant;
  const bandBg = isDarkMode ? colors.background : HOME_M3.surfaceContainerLow;

  // Use the SAME gradient as the BookingDialog header (HOME_HERO_GRADIENT).
  const gradient = [...HOME_HERO_GRADIENT];

  const helplineLabel = formatPhoneDisplay(footerSettings.helplinePhone);
  const joinUsLabel = formatPhoneDisplay(footerSettings.joinUsPhone);
  const year = new Date().getFullYear();
  const yearsActive = Math.max(year - ESTD_YEAR, 0);

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
      return <Text style={[styles.xIcon, { color: iconColor }]}>X</Text>;
    }
    return (
      <MaterialCommunityIcon
        name={SOCIAL_ICON[key as Exclude<FooterSocialKey, 'x'>]}
        size={iconSize + 2}
        color={iconColor}
      />
    );
  };

  const highlights = [
    { icon: 'verified-user', label: 'Verified pros' },
    { icon: 'bolt', label: 'Quick booking' },
    { icon: 'support-agent', label: 'Always here to help' },
  ];

  return (
    <>
      <View
        style={[
          styles.wrap,
          {
            backgroundColor: bandBg,
            paddingHorizontal: hPad,
            paddingBottom: Math.max(bottomInset, 12) + bottomOffset,
          },
        ]}
      >
        <View style={[styles.inner, { maxWidth: maxContentWidth }]}>
          {/* ===== Card ===== */}
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
            {/* ----- Brand hero -----
                Uses the exact same gradient as the BookingDialog header.
                Layout stacks vertically on compact screens so nothing is cut off. */}
            <LinearGradient
              colors={gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.brandGradient,
                isWide && styles.brandGradientWide,
                isCompact && styles.brandGradientCompact,
              ]}
            >
              {/* decorative orbs — clipped, they never affect layout height */}
              <View pointerEvents="none" style={[styles.orb, styles.orbOne]} />
              <View pointerEvents="none" style={[styles.orb, styles.orbTwo]} />

              <View style={[styles.logoRing, isCompact && styles.logoRingCompact]}>
                <Image
                  source={require('../../assets/images/iconlogo.png')}
                  style={[styles.logo, isCompact && styles.logoCompact]}
                  resizeMode="contain"
                />
              </View>

              <View style={[styles.brandCopy, isCompact && styles.brandCopyCompact]}>
                <Text
                  style={[
                    styles.brandName,
                    {
                      fontSize: brandSize,
                      lineHeight: Platform.OS === 'ios' ? brandSize * 1.25 : undefined,
                    },
                  ]}
                  // No numberOfLines / adjustsFontSizeToFit: let it wrap fully so it is always visible.
                >
                  ServEaso
                </Text>
                <Text
                  style={[
                    styles.tagline,
                    {
                      fontSize: taglineSize,
                      lineHeight: Platform.OS === 'ios' ? taglineSize * 1.45 : undefined,
                    },
                  ]}
                >
                  Trusted home services, made easy
                </Text>
                <View style={styles.estdBadge}>
                  <MaterialIcon name="workspace-premium" size={12} color="#FFFFFF" />
                  <Text style={styles.estdText}>Est. {ESTD_YEAR}</Text>
                </View>
              </View>
            </LinearGradient>

            {/* ----- Highlight chips ----- */}
            <View style={[styles.chipRow, isWide && styles.chipRowWide]}>
              {highlights.map((h) => (
                <View
                  key={h.label}
                  style={[styles.chip, { backgroundColor: iconBg, borderColor: cardBorder }]}
                >
                  <MaterialIcon name={h.icon} size={14} color={accentColor} />
                  <Text style={[styles.chipText, { color: titleColor }]}>{h.label}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.divider, { backgroundColor: cardBorder }]} />

            {/* ----- Body: About + Contact (two columns on wide screens) ----- */}
            <View style={[styles.bodyRow, isXWide && styles.bodyRowWide]}>
              {/* About */}
              <View style={[styles.bodyCol, isXWide && styles.bodyColWide]}>
                <Text style={[styles.sectionLabel, { color: mutedColor }]}>About</Text>
                <Text style={[styles.aboutText, { color: titleColor }]}>
                  ServEaso is a product of{' '}
                  <Text style={[styles.aboutStrong, { color: accentColor }]}>{COMPANY_NAME}</Text>,
                  founded in {ESTD_YEAR}. We connect families with reliable, skilled professionals so
                  everyday home care feels effortless.
                </Text>
                <View style={styles.metaRow}>
                  <MaterialIcon name="business" size={14} color={mutedColor} />
                  <Text style={[styles.metaText, { color: mutedColor }]}>
                    {yearsActive > 0
                      ? `${yearsActive}+ year${yearsActive > 1 ? 's' : ''} of service`
                      : 'Newly launched'}{' '}
                    · Since {ESTD_YEAR}
                  </Text>
                </View>
              </View>

              {/* Contact */}
              <View style={[styles.bodyCol, isXWide && styles.bodyColWide]}>
                <Text style={[styles.sectionLabel, { color: mutedColor }]}>Contact us</Text>
                <View style={[styles.contactRow, isWide && !isXWide && styles.contactRowWide]}>
                  <TouchableOpacity
                    style={[
                      styles.contactPill,
                      isWide && !isXWide && styles.contactPillWide,
                      { backgroundColor: iconBg, borderColor: cardBorder },
                    ]}
                    onPress={() => makePhoneCall(footerSettings.helplinePhone)}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={`Call helpline ${helplineLabel}`}
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
                    <MaterialIcon name="call" size={16} color={accentColor} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.contactPill,
                      isWide && !isXWide && styles.contactPillWide,
                      { backgroundColor: iconBg, borderColor: cardBorder },
                    ]}
                    onPress={() => makePhoneCall(footerSettings.joinUsPhone)}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={`Call join us ${joinUsLabel}`}
                  >
                    <View style={[styles.contactIconWrap, { backgroundColor: cardBg }]}>
                      <MaterialIcon name="handshake" size={16} color={accentColor} />
                    </View>
                    <View style={styles.contactCopy}>
                      <Text style={[styles.contactLabel, { color: mutedColor }]}>Join us</Text>
                      <Text style={[styles.contactValue, { color: titleColor }]} numberOfLines={1}>
                        {joinUsLabel}
                      </Text>
                    </View>
                    <MaterialIcon name="call" size={16} color={accentColor} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* ----- Social ----- */}
            {socials.length > 0 && (
              <>
                <View style={[styles.divider, { backgroundColor: cardBorder }]} />
                <Text style={[styles.sectionLabel, styles.centerLabel, { color: mutedColor }]}>
                  Follow us
                </Text>
                <View style={styles.socialRow}>
                  {socials.map(({ key, url }) => (
                    <TouchableOpacity
                      key={key}
                      onPress={() => openLink(url)}
                      activeOpacity={0.8}
                      style={[styles.socialButton, { backgroundColor: iconBg, borderColor: cardBorder }]}
                      accessibilityRole="link"
                      accessibilityLabel={SOCIAL_LABEL[key]}
                    >
                      {renderSocialIcon(key)}
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* ----- Terms ----- */}
            <TouchableOpacity
              onPress={() => setShowTnC(true)}
              style={[styles.tncBtn, { backgroundColor: iconBg, borderColor: cardBorder }]}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Terms and Conditions"
            >
              <MaterialIcon name="description" size={18} color={accentColor} />
              <Text style={[styles.tncText, { color: accentColor }]}>Terms & Conditions</Text>
              <MaterialIcon name="arrow-forward" size={18} color={accentColor} />
            </TouchableOpacity>
          </View>

          {/* ===== Bottom gradient stripe ===== */}
          <View
            style={[
              styles.brandStripe,
              isXWide && styles.brandStripeWide,
              {
                backgroundColor: isDarkMode ? colors.surface : HOME_M3.surfaceContainerLow,
                borderColor: cardBorder,
              },
            ]}
          >
            <Text style={[styles.stripeText, isXWide && styles.stripeTextWide, { color: titleColor }]}>
              © {ESTD_YEAR}
              {year > ESTD_YEAR ? `–${year}` : ''}
            </Text>
            <Text
              style={[
                styles.stripeText,
                styles.stripeCompany,
                isXWide && styles.stripeCompanyWide,
                { color: mutedColor },
              ]}
            >
              {COMPANY_NAME}
            </Text>
            <View style={[styles.stripeMetaRow, isXWide && styles.stripeMetaRowWide]}>
              <Text style={[styles.stripeSub, { color: mutedColor }]}>All rights reserved</Text>
              <View style={styles.stripeDot} />
              <MaterialIcon name="favorite" size={11} color={accentColor} />
              <Text style={[styles.stripeSub, { color: mutedColor }]}>Made in India</Text>
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
  // Full-width band: stretches edge-to-edge on every device.
  wrap: {
    width: '100%',
    alignSelf: 'stretch',
    alignItems: 'stretch',
    marginTop: 12,
    paddingTop: 16,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    flexShrink: 0,
  },
  // Fills the band; only centres itself once maxWidth kicks in (tablets / iPad).
  inner: {
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    width: '100%',
    alignSelf: 'stretch',
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    flexShrink: 0,
  },

  // Brand hero — matches the BookingDialog header gradient.
  // Height is driven by content, never fixed, so nothing gets cut off.
  // overflow:'hidden' only clips the decorative orbs, not the text.
  brandGradient: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    overflow: 'hidden',
    flexShrink: 0,
    minHeight: 96,
  },
  brandGradientWide: {
    paddingVertical: 22,
    paddingHorizontal: 24,
  },
  // On compact screens, stack the logo above the copy so the title/tagline
  // get the full width and are never shrunk or clipped.
  brandGradientCompact: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 14,
    minHeight: 0,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  orbOne: { width: 140, height: 140, top: -50, right: -30 },
  orbTwo: { width: 90, height: 90, bottom: -40, left: '38%' },
  logoRing: {
    width: 68,
    height: 68,
    borderRadius: 18,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    flexShrink: 0,
  },
  logoRingCompact: {
    width: 54,
    height: 54,
    borderRadius: 15,
    marginRight: 0,
    marginBottom: 10,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 12,
  },
  logoCompact: {
    width: 42,
    height: 42,
    borderRadius: 10,
  },
  brandCopy: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    paddingRight: 12, // buffer for the iOS bold/letter-spacing clipping bug
  },
  // Compact: take full width so text wraps and is fully visible.
  brandCopyCompact: {
    flex: 0,
    width: '100%',
    paddingRight: 0,
  },
  brandName: {
    color: '#FFFFFF',
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    paddingRight: 2,
    flexShrink: 0,
  },
  tagline: {
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '500',
    marginTop: 2,
    flexShrink: 0,
    alignSelf: 'stretch',
    paddingRight: 4,
  },
  estdBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    flexShrink: 0,
  },
  estdText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },

  // Chips
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 12,
    gap: 8,
  },
  chipRowWide: {
    justifyContent: 'flex-start',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 11.5,
    fontWeight: '600',
  },

  divider: {
    height: 1,
    width: '100%',
    marginVertical: 14,
    opacity: 0.85,
  },

  // Body layout
  bodyRow: {
    width: '100%',
  },
  bodyRowWide: {
    flexDirection: 'row',
    gap: 24,
  },
  bodyCol: {
    width: '100%',
    marginBottom: 4,
  },
  bodyColWide: {
    flex: 1,
    width: undefined,
  },

  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
    marginBottom: 10,
    width: '100%',
  },
  centerLabel: {
    textAlign: 'center',
  },
  aboutText: {
    fontSize: 13.5,
    lineHeight: 20,
    fontWeight: '400',
  },
  aboutStrong: {
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    marginBottom: 6,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
    flexShrink: 1,
  },

  // Contact
  contactRow: {
    width: '100%',
  },
  contactRowWide: {
    flexDirection: 'row',
    gap: 10,
  },
  contactPill: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  contactPillWide: {
    flex: 1,
    minWidth: 0,
    width: undefined,
    marginBottom: 0,
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
    fontWeight: '700',
  },

  // Social
  socialRow: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
    marginVertical: 4,
  },
  xIcon: {
    fontSize: 14,
    fontWeight: '800',
  },

  // T&C
  tncBtn: {
    width: '100%',
    minHeight: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  tncText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },

  // A separate neutral surface distinguishes the legal footer from the brand banner.
  brandStripe: {
    alignSelf: 'stretch',
    width: '100%',
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  brandStripeWide: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  stripeText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    alignSelf: 'stretch',
    paddingHorizontal: 4,
    flexShrink: 1,
  },
  stripeTextWide: {
    alignSelf: 'auto',
  },
  stripeCompany: {
    marginTop: 2,
    lineHeight: 17,
  },
  stripeCompanyWide: {
    flex: 1,
    marginTop: 0,
    marginHorizontal: 16,
  },
  stripeMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
  },
  stripeMetaRowWide: {
    marginTop: 0,
  },
  stripeSub: {
    fontSize: 11,
    fontWeight: '500',
  },
  stripeDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#1E6FD9',
  },

  termsModalRoot: {
    flex: 1,
  },
});

export default Footer;