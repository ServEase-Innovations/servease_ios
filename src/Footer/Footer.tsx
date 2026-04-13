// Footer.tsx - Updated with ThemeContext integration and Full Responsiveness
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet, Image, Modal, useWindowDimensions, Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import LinearGradient from 'react-native-linear-gradient';
import TnC from '../TermsAndConditions/TnC';
import { useTheme } from '../Settings/ThemeContext';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();
  const { colors, isDarkMode, fontSize, compactMode } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const [showTnC, setShowTnC] = useState(false);

  // Responsive breakpoints
  const isSmallScreen = screenWidth < 375;
  const isMediumScreen = screenWidth >= 375 && screenWidth < 768;
  const isLargeScreen = screenWidth >= 768;

  const openLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  const makePhoneCall = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`).catch(err => console.error("Couldn't make phone call", err));
  };

  const openTnC = () => {
    setShowTnC(true);
  };

  const closeTnC = () => {
    setShowTnC(false);
  };

  // Get font size styles based on settings and screen size
  const getFontSizeStyles = () => {
    let baseSize = 14;
    let headingSize = 16;
    let smallText = 12;
    
    if (isSmallScreen) {
      baseSize = 12;
      headingSize = 14;
      smallText = 10;
    } else if (isMediumScreen) {
      baseSize = 14;
      headingSize = 16;
      smallText = 12;
    } else if (isLargeScreen) {
      baseSize = 16;
      headingSize = 18;
      smallText = 14;
    }
    
    switch (fontSize) {
      case 'small':
        return { textSize: baseSize - 2, headingSize: headingSize - 2, smallText: smallText - 2 };
      case 'large':
        return { textSize: baseSize + 2, headingSize: headingSize + 2, smallText: smallText + 2 };
      default:
        return { textSize: baseSize, headingSize: headingSize, smallText: smallText };
    }
  };

  const fontStyles = getFontSizeStyles();

  // Get gradient colors based on theme
  const getGradientColors = () => {
    if (isDarkMode) {
      return [
        colors.surface2,           // Darker top
        colors.surface,            // Middle
        colors.surface,            // Bottom
      ];
    } else {
      return [
        'rgba(255, 255, 255, 1)',       // White at the top
        'rgba(213, 229, 233, 0.8)',     // Lighter blue
        'rgba(139, 187, 221, 0.8)',     // Blue tone at the bottom
      ];
    }
  };

  // Responsive logo size
  const getLogoSize = () => {
    if (isSmallScreen) return 40;
    if (isMediumScreen) return 50;
    return 60;
  };

  // Responsive button width
  const getContactButtonWidth = () => {
    if (isSmallScreen) return 180;
    if (isMediumScreen) return 200;
    return 220;
  };

  // Responsive icon size
  const getIconSize = () => {
    if (isSmallScreen) return 14;
    if (isMediumScreen) return 16;
    return 18;
  };

  // Check if layout should be column on very small screens
  const shouldUseColumnLayout = isSmallScreen;

  return (
    <>
      <LinearGradient
        colors={getGradientColors()}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={[
          styles.gradientContainer,
          { borderTopColor: isDarkMode ? colors.border : '#a0c8ff' }
        ]}
      >
        <View style={[
          styles.footer,
          shouldUseColumnLayout && styles.footerColumn
        ]}>
          {/* Left side - Logo and Brand Info */}
          <View style={[
            styles.leftSection,
            shouldUseColumnLayout && styles.leftSectionColumn,
            { marginRight: shouldUseColumnLayout ? 0 : 20 }
          ]}>
            <View style={styles.logoContainer}>
              {/* Logo Image */}
              <Image 
                source={require('../../assets/images/serveasonew.png')} 
                style={[
                  styles.logoImage,
                  { 
                    width: getLogoSize(),
                    height: getLogoSize(),
                    backgroundColor: isDarkMode ? colors.primary : '#0a3d62',
                    shadowColor: colors.shadow,
                    borderRadius: isSmallScreen ? 8 : 12,
                  }
                ]}
                resizeMode="contain"
              />
              <Text style={[
                styles.brandSubtitle, 
                { 
                  color: isDarkMode ? colors.text : '#0a3d62',
                  fontSize: fontStyles.headingSize 
                }
              ]}>
                ServEaso
              </Text>
            </View>
            
            <View style={styles.companyInfo}>
              <Text style={[
                styles.infoText, 
                { 
                  color: isDarkMode ? colors.textSecondary : '#0a3d62',
                  fontSize: fontStyles.smallText,
                  lineHeight: fontStyles.smallText + 4
                }
              ]}>
                Est. 2024
              </Text>
              <TouchableOpacity onPress={openTnC}>
                <Text style={[
                  styles.tncText, 
                  { 
                    color: isDarkMode ? colors.primary : '#0a3d62',
                    fontSize: fontStyles.smallText,
                    lineHeight: fontStyles.smallText + 4,
                    marginTop: isSmallScreen ? 8 : 15
                  }
                ]}>
                  Terms and Conditions
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Right side - Contact Us Section */}
          <View style={[
            styles.rightSection,
            shouldUseColumnLayout && styles.rightSectionColumn,
            { alignItems: shouldUseColumnLayout ? 'flex-start' : 'flex-start' }
          ]}>
            <Text style={[
              styles.contactTitle, 
              { 
                color: isDarkMode ? colors.text : '#0a3d62',
                fontSize: fontStyles.textSize,
                marginBottom: isSmallScreen ? 8 : 12,
                textAlign: shouldUseColumnLayout ? 'left' : 'right'
              }
            ]}>
              Contact us:
            </Text>
            <View style={[
              styles.contactButtonsContainer,
              shouldUseColumnLayout && styles.contactButtonsContainerColumn,
              { alignItems: shouldUseColumnLayout ? 'flex-start' : 'flex-end' }
            ]}>
              <TouchableOpacity 
                style={[
                  styles.contactButton,
                  { 
                    backgroundColor: isDarkMode ? colors.surface : 'rgba(255, 255, 255, 0.9)',
                    borderColor: isDarkMode ? colors.border : '#0a3d62',
                    shadowColor: colors.shadow,
                    width: getContactButtonWidth(),
                    padding: isSmallScreen ? 8 : 12,
                    marginBottom: isSmallScreen ? 6 : 10,
                  }
                ]}
                onPress={() => makePhoneCall('+918792827744')}
              >
                <FontAwesome name="phone" size={getIconSize()} color={isDarkMode ? colors.primary : '#0a3d62'} style={styles.phoneIcon} />
                <Text style={[
                  styles.contactText, 
                  { 
                    color: isDarkMode ? colors.text : '#0a3d62',
                    fontSize: fontStyles.smallText 
                  }
                ]}>
                  Helpline: +91 87928 27744
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.contactButton,
                  { 
                    backgroundColor: isDarkMode ? colors.surface : 'rgba(255, 255, 255, 0.9)',
                    borderColor: isDarkMode ? colors.border : '#0a3d62',
                    shadowColor: colors.shadow,
                    width: getContactButtonWidth(),
                    padding: isSmallScreen ? 8 : 12,
                    marginBottom: isSmallScreen ? 0 : 0,
                  }
                ]}
                onPress={() => makePhoneCall('+918792827754')}
              >
                <FontAwesome name="phone" size={getIconSize()} color={isDarkMode ? colors.primary : '#0a3d62'} style={styles.phoneIcon} />
                <Text style={[
                  styles.contactText, 
                  { 
                    color: isDarkMode ? colors.text : '#0a3d62',
                    fontSize: fontStyles.smallText 
                  }
                ]}>
                  Join Us: +91 87928 27754
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Follow Us Section - Single line at bottom */}
        <View style={[
          styles.followSection,
          { 
            borderTopColor: isDarkMode ? colors.border : '#a0c8ff',
            paddingHorizontal: isSmallScreen ? 10 : 15,
            paddingVertical: isSmallScreen ? 8 : 10,
            marginHorizontal: isSmallScreen ? 10 : 15,
            paddingRight: isSmallScreen ? 20 : 42,
            flexDirection: isSmallScreen ? 'column' : 'row',
            alignItems: isSmallScreen ? 'center' : 'center',
          }
        ]}>
          <Text style={[
            styles.followText, 
            { 
              color: isDarkMode ? colors.text : '#0a3d62',
              fontSize: fontStyles.textSize,
              marginRight: isSmallScreen ? 0 : 12,
              marginBottom: isSmallScreen ? 8 : 0,
            }
          ]}>
            Follow us on:
          </Text>
          <View style={[
            styles.socialMedia,
            { flexWrap: isSmallScreen ? 'wrap' : 'nowrap' }
          ]}>
            <TouchableOpacity 
              style={[
                styles.iconButton,
                { 
                  backgroundColor: isDarkMode ? colors.surface : 'rgba(255, 255, 255, 0.9)',
                  borderColor: isDarkMode ? colors.border : '#0a3d62',
                  shadowColor: colors.shadow,
                  padding: isSmallScreen ? 6 : 8,
                  marginHorizontal: isSmallScreen ? 3 : 4,
                  minWidth: isSmallScreen ? 28 : 32,
                  minHeight: isSmallScreen ? 28 : 32,
                  borderRadius: isSmallScreen ? 18 : 20,
                }
              ]}
              onPress={() => openLink('https://x.com/ServEaso')}
            >
              <View style={styles.xIconContainer}>
                <Text style={[
                  styles.xIcon, 
                  { 
                    color: isDarkMode ? colors.text : '#0a3d62',
                    fontSize: isSmallScreen ? 10 : 12,
                  }
                ]}>X</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.iconButton,
                { 
                  backgroundColor: isDarkMode ? colors.surface : 'rgba(255, 255, 255, 0.9)',
                  borderColor: isDarkMode ? colors.border : '#0a3d62',
                  shadowColor: colors.shadow,
                  padding: isSmallScreen ? 6 : 8,
                  marginHorizontal: isSmallScreen ? 3 : 4,
                  minWidth: isSmallScreen ? 28 : 32,
                  minHeight: isSmallScreen ? 28 : 32,
                  borderRadius: isSmallScreen ? 18 : 20,
                }
              ]}
              onPress={() => openLink('https://www.instagram.com/serveaso?igsh=cHQxdmdubnZocjRn')}
            >
              <Ionicons name="logo-instagram" size={getIconSize()} color={isDarkMode ? colors.text : '#0a3d62'} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.iconButton,
                { 
                  backgroundColor: isDarkMode ? colors.surface : 'rgba(255, 255, 255, 0.9)',
                  borderColor: isDarkMode ? colors.border : '#0a3d62',
                  shadowColor: colors.shadow,
                  padding: isSmallScreen ? 6 : 8,
                  marginHorizontal: isSmallScreen ? 3 : 4,
                  minWidth: isSmallScreen ? 28 : 32,
                  minHeight: isSmallScreen ? 28 : 32,
                  borderRadius: isSmallScreen ? 18 : 20,
                }
              ]}
              onPress={() => openLink('https://www.youtube.com/@ServEaso')}
            >
              <Ionicons name="logo-youtube" size={getIconSize()} color={isDarkMode ? colors.text : '#0a3d62'} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.iconButton,
                { 
                  backgroundColor: isDarkMode ? colors.surface : 'rgba(255, 255, 255, 0.9)',
                  borderColor: isDarkMode ? colors.border : '#0a3d62',
                  shadowColor: colors.shadow,
                  padding: isSmallScreen ? 6 : 8,
                  marginHorizontal: isSmallScreen ? 3 : 4,
                  minWidth: isSmallScreen ? 28 : 32,
                  minHeight: isSmallScreen ? 28 : 32,
                  borderRadius: isSmallScreen ? 18 : 20,
                }
              ]}
              onPress={() => openLink('https://www.linkedin.com/in/serveaso-media-7b7719381/')}
            >
              <Ionicons name="logo-linkedin" size={getIconSize()} color={isDarkMode ? colors.text : '#0a3d62'} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.iconButton,
                { 
                  backgroundColor: isDarkMode ? colors.surface : 'rgba(255, 255, 255, 0.9)',
                  borderColor: isDarkMode ? colors.border : '#0a3d62',
                  shadowColor: colors.shadow,
                  padding: isSmallScreen ? 6 : 8,
                  marginHorizontal: isSmallScreen ? 3 : 4,
                  minWidth: isSmallScreen ? 28 : 32,
                  minHeight: isSmallScreen ? 28 : 32,
                  borderRadius: isSmallScreen ? 18 : 20,
                }
              ]}
              onPress={() => openLink('https://www.facebook.com/profile.php?id=61572701168852')}
            >
              <Ionicons name="logo-facebook" size={getIconSize()} color={isDarkMode ? colors.text : '#0a3d62'} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Terms and Conditions Modal */}
      <Modal
        visible={showTnC}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeTnC}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <LinearGradient
            colors={isDarkMode ? [colors.primaryDark, colors.primary] : ["#0a2a66ff", "#004aadff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.modalHeader,
              { paddingTop: Platform.OS === 'ios' ? 50 : 16 }
            ]}
          >
            <Text style={[styles.modalTitle, { color: '#ffffff', fontSize: fontStyles.headingSize }]}>
              Terms and Conditions
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={closeTnC}>
              <Ionicons name="close" size={24} color="#ffffff" />
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
    paddingBottom: 15,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 15,
    paddingBottom: 20,
    minHeight: 180,
  },
  footerColumn: {
    flexDirection: 'column',
    minHeight: 'auto',
    paddingBottom: 10,
  },
  leftSection: {
    flex: 1,
    marginRight: 20,
  },
  leftSectionColumn: {
    marginRight: 0,
    marginBottom: 20,
    width: '100%',
  },
  rightSection: {
    alignItems: 'flex-start',
    minWidth: 200,
  },
  rightSectionColumn: {
    width: '100%',
    minWidth: 'auto',
  },
  logoContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  logoImage: {
    marginBottom: 8,
    padding: 10,
  },
  brandSubtitle: {
    fontWeight: '600',
    marginLeft: 0,
    textAlign: 'left',
  },
  companyInfo: {
    alignItems: 'flex-start',
  },
  infoText: {
    fontWeight: '500',
  },
  tncText: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  contactTitle: {
    fontWeight: '600',
  },
  contactButtonsContainer: {
    width: '100%',
    alignItems: 'flex-end',
  },
  contactButtonsContainerColumn: {
    alignItems: 'flex-start',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    justifyContent: 'flex-start',
  },
  phoneIcon: {
    marginRight: 8,
  },
  contactText: {
    fontWeight: '500',
    flex: 1,
    textAlign: 'left',
  },
  followSection: {
    borderTopWidth: 1,
    justifyContent: 'center',
  },
  followText: {
    fontWeight: '600',
  },
  socialMedia: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    borderWidth: 1,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  xIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  xIcon: {
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
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