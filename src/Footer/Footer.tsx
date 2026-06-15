// Footer.tsx - Fetches contact + social links from admin platform settings
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
  Platform,
  SafeAreaView,
} from 'react-native';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import LinearGradient from 'react-native-linear-gradient';
import { GRADIENTS } from '../theme/brandColors';
import TnC from '../TermsAndConditions/TnC';
import {
  DEFAULT_FOOTER_SETTINGS,
  FOOTER_SOCIAL_ORDER,
  FooterSettings,
  FooterSocialKey,
  fetchPublicFooterSettings,
  formatPhoneDisplay,
} from '../services/footerSettings';

const SOCIAL_ICON: Record<
  FooterSocialKey,
  { type: 'text' } | { type: 'icon'; name: string }
> = {
  x: { type: 'text' },
  instagram: { type: 'icon', name: 'instagram' },
  youtube: { type: 'icon', name: 'youtube' },
  linkedin: { type: 'icon', name: 'linkedin' },
  facebook: { type: 'icon', name: 'facebook' },
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

  const isSmallScreen = screenWidth < 375;
  const isMediumScreen = screenWidth >= 375 && screenWidth < 768;
  const isLargeScreen = screenWidth >= 768;
  const shouldUseColumnLayout = screenWidth < 360;

  const openLink = (url: string) => {
    if (!url) return;
    Linking.openURL(url).catch((err) => console.error("Couldn't load page", err));
  };

  const makePhoneCall = (phoneNumber: string) => {
    if (!phoneNumber) return;
    Linking.openURL(`tel:${phoneNumber}`).catch((err) => console.error("Couldn't make phone call", err));
  };

  const getFontSizeStyles = () => {
    if (isSmallScreen) return { textSize: 12, headingSize: 14, smallText: 10 };
    if (isMediumScreen) return { textSize: 14, headingSize: 16, smallText: 12 };
    if (isLargeScreen) return { textSize: 16, headingSize: 18, smallText: 14 };
    return { textSize: 14, headingSize: 16, smallText: 12 };
  };

  const fontStyles = getFontSizeStyles();
  const getLogoSize = () => (isSmallScreen ? 34 : isMediumScreen ? 42 : 48);
  const getContactButtonWidth = () => (isSmallScreen ? 162 : isMediumScreen ? 178 : 192);
  const getIconSize = () => (isSmallScreen ? 13 : isMediumScreen ? 16 : 18);

  const helplineLabel = formatPhoneDisplay(footerSettings.helplinePhone);
  const joinUsLabel = formatPhoneDisplay(footerSettings.joinUsPhone);

  const renderSocialIcon = (key: FooterSocialKey) => {
    const meta = SOCIAL_ICON[key];
    if (meta.type === 'text') {
      return (
        <Text style={[styles.xIcon, { color: '#FFFFFF', fontSize: isSmallScreen ? 10 : 12 }]}>
          X
        </Text>
      );
    }
    return (
      <MaterialCommunityIcon name={meta.name} size={getIconSize()} color="#FFFFFF" />
    );
  };

  return (
    <>
      <LinearGradient
        colors={[...GRADIENTS.chrome]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientContainer}
      >
        <SafeAreaView>
          <View style={[styles.footer, shouldUseColumnLayout && styles.footerColumn]}>
            <View
              style={[
                styles.leftSection,
                shouldUseColumnLayout && styles.leftSectionColumn,
                {
                  marginRight: shouldUseColumnLayout ? 0 : 16,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  borderColor: 'rgba(255,255,255,0.18)',
                  borderWidth: 1,
                },
              ]}
            >
              <View style={styles.logoContainer}>
                <Image
                  source={require('../../assets/images/serveasonew.png')}
                  style={[
                    styles.logoImage,
                    {
                      width: getLogoSize(),
                      height: getLogoSize(),
                      shadowColor: '#000',
                      borderRadius: isSmallScreen ? 8 : 12,
                    },
                  ]}
                  resizeMode="contain"
                />
                <Text style={[styles.brandSubtitle, { color: '#FFFFFF', fontSize: fontStyles.headingSize }]}>
                  ServEaso
                </Text>
              </View>

              <View style={styles.companyInfo}>
                <Text
                  style={[
                    styles.infoText,
                    { color: '#FFFFFFCC', fontSize: fontStyles.smallText, lineHeight: fontStyles.smallText + 4 },
                  ]}
                >
                  Trusted home services
                </Text>
                <TouchableOpacity onPress={() => setShowTnC(true)}>
                  <Text
                    style={[
                      styles.tncText,
                      {
                        color: '#FFFFFF',
                        fontSize: fontStyles.smallText,
                        lineHeight: fontStyles.smallText + 4,
                        marginTop: isSmallScreen ? 8 : 15,
                        opacity: 0.9,
                      },
                    ]}
                  >
                    Terms & Conditions
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View
              style={[
                styles.rightSection,
                shouldUseColumnLayout && styles.rightSectionColumn,
                {
                  alignItems: 'center',
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  borderColor: 'rgba(255,255,255,0.18)',
                  borderWidth: 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.contactTitle,
                  {
                    color: '#FFFFFF',
                    fontSize: fontStyles.textSize,
                    marginBottom: isSmallScreen ? 8 : 12,
                  },
                ]}
              >
                Contact us:
              </Text>
              <View
                style={[
                  styles.contactButtonsContainer,
                  shouldUseColumnLayout && styles.contactButtonsContainerColumn,
                  { alignItems: 'center' },
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.contactButton,
                    {
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      width: getContactButtonWidth(),
                      paddingVertical: isSmallScreen ? 7 : 8,
                      marginBottom: 8,
                    },
                  ]}
                  onPress={() => makePhoneCall(footerSettings.helplinePhone)}
                >
                  <FontAwesome name="phone" size={getIconSize()} color="#FFFFFF" style={styles.phoneIcon} />
                  <Text style={[styles.contactText, { color: '#FFFFFF', fontSize: fontStyles.smallText }]}>
                    Helpline: {helplineLabel}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.contactButton,
                    {
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      width: getContactButtonWidth(),
                      paddingVertical: isSmallScreen ? 7 : 8,
                    },
                  ]}
                  onPress={() => makePhoneCall(footerSettings.joinUsPhone)}
                >
                  <FontAwesome name="phone" size={getIconSize()} color="#FFFFFF" style={styles.phoneIcon} />
                  <Text style={[styles.contactText, { color: '#FFFFFF', fontSize: fontStyles.smallText }]}>
                    Join Us: {joinUsLabel}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View
            style={[
              styles.followSection,
              {
                borderTopColor: 'rgba(255, 255, 255, 0.2)',
                paddingHorizontal: isSmallScreen ? 10 : 15,
                paddingVertical: isSmallScreen ? 12 : 15,
                marginHorizontal: isSmallScreen ? 10 : 15,
                flexDirection: isSmallScreen ? 'column' : 'row',
              },
            ]}
          >
            <Text
              style={[
                styles.followText,
                {
                  color: '#FFFFFF',
                  fontSize: fontStyles.textSize,
                  marginRight: isSmallScreen ? 0 : 12,
                  marginBottom: isSmallScreen ? 8 : 0,
                },
              ]}
            >
              Follow us:
            </Text>
            <View style={[styles.socialMedia, { flexWrap: isSmallScreen ? 'wrap' : 'nowrap' }]}>
              {FOOTER_SOCIAL_ORDER.map((key) => {
                const href = footerSettings.social[key];
                if (!href) return null;
                return (
                  <TouchableOpacity
                    key={key}
                    accessibilityLabel={SOCIAL_LABEL[key]}
                    style={[
                      styles.iconButton,
                      {
                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        padding: isSmallScreen ? 6 : 8,
                        marginHorizontal: 3,
                        minWidth: isSmallScreen ? 28 : 32,
                        minHeight: isSmallScreen ? 28 : 32,
                        borderRadius: isSmallScreen ? 18 : 20,
                      },
                    ]}
                    onPress={() => openLink(href)}
                  >
                    {renderSocialIcon(key)}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <Modal visible={showTnC} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowTnC(false)}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={[...GRADIENTS.chrome]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.modalHeader, { paddingTop: Platform.OS === 'ios' ? 50 : 16 }]}
          >
            <Text style={[styles.modalTitle, { color: '#FFFFFF', fontSize: fontStyles.headingSize }]}>
              Terms and Conditions
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowTnC(false)}>
              <MaterialCommunityIcon name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </LinearGradient>
          <TnC />
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingBottom: Platform.OS === 'ios' ? 18 : 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    minHeight: 126,
  },
  footerColumn: {
    flexDirection: 'column',
    minHeight: 'auto',
    paddingBottom: 10,
  },
  leftSection: {
    flex: 1,
    marginRight: 10,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  leftSectionColumn: {
    marginRight: 0,
    marginBottom: 8,
    width: '100%',
  },
  rightSection: {
    alignItems: 'center',
    minWidth: 172,
    borderRadius: 12,
    padding: 10,
  },
  rightSectionColumn: {
    width: '100%',
    minWidth: 'auto',
  },
  logoContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: 6,
  },
  logoImage: {
    marginBottom: 6,
    padding: 6,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  brandSubtitle: {
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.25,
  },
  companyInfo: {
    alignItems: 'center',
  },
  infoText: {
    fontWeight: '500',
    opacity: 0.86,
    textAlign: 'center',
  },
  tncText: {
    fontWeight: '600',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  contactTitle: {
    fontWeight: '600',
    letterSpacing: 0.2,
    textAlign: 'center',
    width: '100%',
  },
  contactButtonsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  contactButtonsContainerColumn: {
    alignItems: 'center',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    justifyContent: 'center',
  },
  phoneIcon: {
    marginRight: 7,
  },
  contactText: {
    fontWeight: '500',
    flex: 1,
    textAlign: 'center',
  },
  followSection: {
    borderTopWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  followText: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  socialMedia: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  xIcon: {
    fontWeight: 'bold',
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
  },
  closeButton: {
    padding: 4,
  },
});

export default Footer;
