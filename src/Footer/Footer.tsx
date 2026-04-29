// Footer.tsx - Updated with Gradient Background, White Text, and Improved Responsiveness
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet, Image, Modal, useWindowDimensions, Platform, SafeAreaView } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import LinearGradient from 'react-native-linear-gradient';
import TnC from '../TermsAndConditions/TnC';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();
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

  // Get font size styles based on screen size
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
    
    return { textSize: baseSize, headingSize: headingSize, smallText: smallText };
  };

  const fontStyles = getFontSizeStyles();

  // Fixed gradient colors for consistent professional look
  const getGradientColors = () => {
    return ['#081a38', '#143b76', '#1f5699'];
  };

  // Responsive logo size
  const getLogoSize = () => {
    if (isSmallScreen) return 34;
    if (isMediumScreen) return 42;
    return 48;
  };

  // Responsive button width
  const getContactButtonWidth = () => {
    if (isSmallScreen) return 162;
    if (isMediumScreen) return 178;
    return 192;
  };

  // Responsive icon size
  const getIconSize = () => {
    if (isSmallScreen) return 13;
    if (isMediumScreen) return 16;
    return 18;
  };

  // Use stacked layout on compact phones for better readability
  const shouldUseColumnLayout = screenWidth < 360;

  return (
    <>
      <LinearGradient
        colors={getGradientColors()}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 0}}
        style={styles.gradientContainer}
      >
        <SafeAreaView>
          <View style={[
            styles.footer,
            shouldUseColumnLayout && styles.footerColumn
          ]}>
            {/* Left side - Logo and Brand Info */}
            <View style={[
              styles.leftSection,
              shouldUseColumnLayout && styles.leftSectionColumn,
              {
                marginRight: shouldUseColumnLayout ? 0 : 16,
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderColor: 'rgba(255,255,255,0.18)',
                borderWidth: 1,
              }
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
                      shadowColor: '#000',
                      borderRadius: isSmallScreen ? 8 : 12,
                    }
                  ]}
                  resizeMode="contain"
                />
                <Text style={[
                  styles.brandSubtitle, 
                  { 
                    color: '#FFFFFF',
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
                    color: '#FFFFFFCC',
                    fontSize: fontStyles.smallText,
                    lineHeight: fontStyles.smallText + 4
                  }
                ]}>
                  Trusted home services
                </Text>
                <TouchableOpacity onPress={openTnC}>
                  <Text style={[
                    styles.tncText, 
                    { 
                      color: '#FFFFFF',
                      fontSize: fontStyles.smallText,
                      lineHeight: fontStyles.smallText + 4,
                      marginTop: isSmallScreen ? 8 : 15,
                      opacity: 0.9,
                    }
                  ]}>
                    Terms & Conditions
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Right side - Contact Us Section */}
            <View style={[
              styles.rightSection,
              shouldUseColumnLayout && styles.rightSectionColumn,
              {
                alignItems: 'flex-start',
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderColor: 'rgba(255,255,255,0.18)',
                borderWidth: 1,
              }
            ]}>
              <Text style={[
                styles.contactTitle, 
                { 
                  color: '#FFFFFF',
                  fontSize: fontStyles.textSize,
                  marginBottom: isSmallScreen ? 8 : 12,
                  textAlign: shouldUseColumnLayout ? 'left' : 'right',
                  fontWeight: '600',
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
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      shadowColor: '#000',
                      width: getContactButtonWidth(),
                      paddingVertical: isSmallScreen ? 7 : 8,
                      paddingHorizontal: isSmallScreen ? 9 : 10,
                      marginBottom: 8,
                    }
                  ]}
                  onPress={() => makePhoneCall('+918792827744')}
                >
                  <FontAwesome name="phone" size={getIconSize()} color="#FFFFFF" style={styles.phoneIcon} />
                  <Text style={[
                    styles.contactText, 
                    { 
                      color: '#FFFFFF',
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
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      shadowColor: '#000',
                      width: getContactButtonWidth(),
                      paddingVertical: isSmallScreen ? 7 : 8,
                      paddingHorizontal: isSmallScreen ? 9 : 10,
                    }
                  ]}
                  onPress={() => makePhoneCall('+918792827754')}
                >
                  <FontAwesome name="phone" size={getIconSize()} color="#FFFFFF" style={styles.phoneIcon} />
                  <Text style={[
                    styles.contactText, 
                    { 
                      color: '#FFFFFF',
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
              borderTopColor: 'rgba(255, 255, 255, 0.2)',
              paddingHorizontal: isSmallScreen ? 10 : 15,
              paddingVertical: isSmallScreen ? 12 : 15,
              marginHorizontal: isSmallScreen ? 10 : 15,
              paddingRight: isSmallScreen ? 12 : 20,
              flexDirection: isSmallScreen ? 'column' : 'row',
              alignItems: isSmallScreen ? 'center' : 'center',
            }
          ]}>
            <Text style={[
              styles.followText, 
              { 
                color: '#FFFFFF',
                fontSize: fontStyles.textSize,
                marginRight: isSmallScreen ? 0 : 12,
                marginBottom: isSmallScreen ? 8 : 0,
                fontWeight: '600',
              }
            ]}>
              Follow us:
            </Text>
            <View style={[
              styles.socialMedia,
              { flexWrap: isSmallScreen ? 'wrap' : 'nowrap' }
            ]}>
              <TouchableOpacity 
                style={[
                  styles.iconButton,
                  { 
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    shadowColor: '#000',
                    padding: isSmallScreen ? 6 : 8,
                    marginHorizontal: 3,
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
                      color: '#FFFFFF',
                      fontSize: isSmallScreen ? 10 : 12,
                    }
                  ]}>X</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.iconButton,
                  { 
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    shadowColor: '#000',
                    padding: isSmallScreen ? 6 : 8,
                    marginHorizontal: 3,
                    minWidth: isSmallScreen ? 28 : 32,
                    minHeight: isSmallScreen ? 28 : 32,
                    borderRadius: isSmallScreen ? 18 : 20,
                  }
                ]}
                onPress={() => openLink('https://www.instagram.com/serveaso?igsh=cHQxdmdubnZocjRn')}
              >
                <Ionicons name="logo-instagram" size={getIconSize()} color="#FFFFFF" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.iconButton,
                  { 
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    shadowColor: '#000',
                    padding: isSmallScreen ? 6 : 8,
                    marginHorizontal: 3,
                    minWidth: isSmallScreen ? 28 : 32,
                    minHeight: isSmallScreen ? 28 : 32,
                    borderRadius: isSmallScreen ? 18 : 20,
                  }
                ]}
                onPress={() => openLink('https://www.youtube.com/@ServEaso')}
              >
                <Ionicons name="logo-youtube" size={getIconSize()} color="#FFFFFF" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.iconButton,
                  { 
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    shadowColor: '#000',
                    padding: isSmallScreen ? 6 : 8,
                    marginHorizontal: 3,
                    minWidth: isSmallScreen ? 28 : 32,
                    minHeight: isSmallScreen ? 28 : 32,
                    borderRadius: isSmallScreen ? 18 : 20,
                  }
                ]}
                onPress={() => openLink('https://www.linkedin.com/in/serveaso-media-7b7719381/')}
              >
                <Ionicons name="logo-linkedin" size={getIconSize()} color="#FFFFFF" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.iconButton,
                  { 
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    shadowColor: '#000',
                    padding: isSmallScreen ? 6 : 8,
                    marginHorizontal: 3,
                    minWidth: isSmallScreen ? 28 : 32,
                    minHeight: isSmallScreen ? 28 : 32,
                    borderRadius: isSmallScreen ? 18 : 20,
                  }
                ]}
                onPress={() => openLink('https://www.facebook.com/profile.php?id=61572701168852')}
              >
                <Ionicons name="logo-facebook" size={getIconSize()} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Terms and Conditions Modal */}
      <Modal
        visible={showTnC}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeTnC}
      >
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#0d1935', '#1c4485', '#255697']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.modalHeader,
              { paddingTop: Platform.OS === 'ios' ? 50 : 16 }
            ]}
          >
            <Text style={[styles.modalTitle, { color: '#FFFFFF', fontSize: fontStyles.headingSize }]}>
              Terms and Conditions
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={closeTnC}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  },
  leftSectionColumn: {
    marginRight: 0,
    marginBottom: 8,
    width: '100%',
  },
  rightSection: {
    alignItems: 'flex-start',
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
    alignItems: 'flex-start',
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
    marginLeft: 0,
    textAlign: 'left',
    letterSpacing: 0.25,
  },
  companyInfo: {
    alignItems: 'flex-start',
  },
  infoText: {
    fontWeight: '500',
    opacity: 0.86,
  },
  tncText: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  contactTitle: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  contactButtonsContainer: {
    width: '100%',
    alignItems: 'flex-start',
  },
  contactButtonsContainerColumn: {
    alignItems: 'flex-start',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    justifyContent: 'flex-start',
  },
  phoneIcon: {
    marginRight: 7,
  },
  contactText: {
    fontWeight: '500',
    flex: 1,
    textAlign: 'left',
  },
  followSection: {
    borderTopWidth: 1,
    justifyContent: 'center',
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
    gap: 0,
  },
  iconButton: {
    borderWidth: 1,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
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