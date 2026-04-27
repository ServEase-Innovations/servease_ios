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
    return ['#0d1935', '#1c4485', '#255697'];
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
                  Est. 2024
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
                      padding: isSmallScreen ? 8 : 12,
                      marginBottom: isSmallScreen ? 6 : 10,
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
                      padding: isSmallScreen ? 8 : 12,
                      marginBottom: isSmallScreen ? 0 : 0,
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
              paddingRight: isSmallScreen ? 20 : 42,
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
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    shadowColor: '#000',
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
                    marginHorizontal: isSmallScreen ? 3 : 4,
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
                    marginHorizontal: isSmallScreen ? 3 : 4,
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
                    marginHorizontal: isSmallScreen ? 3 : 4,
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
                    marginHorizontal: isSmallScreen ? 3 : 4,
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
    paddingBottom: Platform.OS === 'ios' ? 34 : 24, // Extra padding for bottom safe area
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingTop: 25,
    paddingBottom: 25,
    minHeight: 180,
  },
  footerColumn: {
    flexDirection: 'column',
    minHeight: 'auto',
    paddingBottom: 15,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  brandSubtitle: {
    fontWeight: '700',
    marginLeft: 0,
    textAlign: 'left',
    letterSpacing: 0.5,
  },
  companyInfo: {
    alignItems: 'flex-start',
  },
  infoText: {
    fontWeight: '500',
    opacity: 0.8,
  },
  tncText: {
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  contactTitle: {
    fontWeight: '600',
    letterSpacing: 0.3,
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
    borderRadius: 10,
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
    letterSpacing: 0.3,
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