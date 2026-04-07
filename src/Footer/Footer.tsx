// Footer.tsx - Updated with ThemeContext integration
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet, Image, Modal } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import LinearGradient from 'react-native-linear-gradient';
import TnC from '../TermsAndConditions/TnC';
import { useTheme } from '../Settings/ThemeContext';
import { useTranslation } from 'react-i18next';

const Footer = () => {
  const { t } = useTranslation();
  const { colors, isDarkMode, fontSize, compactMode } = useTheme();
  const [showTnC, setShowTnC] = useState(false);

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

  // Get font size styles based on settings
  const getFontSizeStyles = () => {
    switch (fontSize) {
      case 'small':
        return { textSize: 12, headingSize: 14, smallText: 10 };
      case 'large':
        return { textSize: 16, headingSize: 18, smallText: 14 };
      default:
        return { textSize: 14, headingSize: 16, smallText: 12 };
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
        <View style={styles.footer}>
          {/* Left side - Logo and Brand Info */}
          <View style={styles.leftSection}>
            <View style={styles.logoContainer}>
              {/* Logo Image */}
              <Image 
                source={require('../../assets/images/serveasonew.png')} 
                style={[
                  styles.logoImage,
                  { 
                    backgroundColor: isDarkMode ? colors.primary : '#0a3d62',
                    shadowColor: colors.shadow 
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
                  fontSize: fontStyles.smallText 
                }
              ]}>
                Est. 2024
              </Text>
              <TouchableOpacity onPress={openTnC}>
                <Text style={[
                  styles.tncText, 
                  { 
                    color: isDarkMode ? colors.primary : '#0a3d62',
                    fontSize: fontStyles.smallText 
                  }
                ]}>
                  Terms and Conditions
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Right side - Contact Us Section */}
          <View style={styles.rightSection}>
            <Text style={[
              styles.contactTitle, 
              { 
                color: isDarkMode ? colors.text : '#0a3d62',
                fontSize: fontStyles.textSize 
              }
            ]}>
              Contact us:
            </Text>
            <View style={styles.contactButtonsContainer}>
              <TouchableOpacity 
                style={[
                  styles.contactButton,
                  { 
                    backgroundColor: isDarkMode ? colors.surface : 'rgba(255, 255, 255, 0.9)',
                    borderColor: isDarkMode ? colors.border : '#0a3d62',
                    shadowColor: colors.shadow
                  }
                ]}
                onPress={() => makePhoneCall('+918792827744')}
              >
                <FontAwesome name="phone" size={16} color={isDarkMode ? colors.primary : '#0a3d62'} style={styles.phoneIcon} />
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
                    shadowColor: colors.shadow
                  }
                ]}
                onPress={() => makePhoneCall('+918792827754')}
              >
                <FontAwesome name="phone" size={16} color={isDarkMode ? colors.primary : '#0a3d62'} style={styles.phoneIcon} />
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
            borderTopColor: isDarkMode ? colors.border : '#a0c8ff'
          }
        ]}>
          <Text style={[
            styles.followText, 
            { 
              color: isDarkMode ? colors.text : '#0a3d62',
              fontSize: fontStyles.textSize 
            }
          ]}>
            Follow us on:
          </Text>
          <View style={styles.socialMedia}>
            <TouchableOpacity 
              style={[
                styles.iconButton,
                { 
                  backgroundColor: isDarkMode ? colors.surface : 'rgba(255, 255, 255, 0.9)',
                  borderColor: isDarkMode ? colors.border : '#0a3d62',
                  shadowColor: colors.shadow
                }
              ]}
              onPress={() => openLink('https://x.com/ServEaso')}
            >
              <View style={styles.xIconContainer}>
                <Text style={[
                  styles.xIcon, 
                  { color: isDarkMode ? colors.text : '#0a3d62' }
                ]}>X</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.iconButton,
                { 
                  backgroundColor: isDarkMode ? colors.surface : 'rgba(255, 255, 255, 0.9)',
                  borderColor: isDarkMode ? colors.border : '#0a3d62',
                  shadowColor: colors.shadow
                }
              ]}
              onPress={() => openLink('https://www.instagram.com/serveaso?igsh=cHQxdmdubnZocjRn')}
            >
              <Ionicons name="logo-instagram" size={16} color={isDarkMode ? colors.text : '#0a3d62'} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.iconButton,
                { 
                  backgroundColor: isDarkMode ? colors.surface : 'rgba(255, 255, 255, 0.9)',
                  borderColor: isDarkMode ? colors.border : '#0a3d62',
                  shadowColor: colors.shadow
                }
              ]}
              onPress={() => openLink('https://www.youtube.com/@ServEaso')}
            >
              <Ionicons name="logo-youtube" size={16} color={isDarkMode ? colors.text : '#0a3d62'} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.iconButton,
                { 
                  backgroundColor: isDarkMode ? colors.surface : 'rgba(255, 255, 255, 0.9)',
                  borderColor: isDarkMode ? colors.border : '#0a3d62',
                  shadowColor: colors.shadow
                }
              ]}
              onPress={() => openLink('https://www.linkedin.com/in/serveaso-media-7b7719381/')}
            >
              <Ionicons name="logo-linkedin" size={16} color={isDarkMode ? colors.text : '#0a3d62'} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.iconButton,
                { 
                  backgroundColor: isDarkMode ? colors.surface : 'rgba(255, 255, 255, 0.9)',
                  borderColor: isDarkMode ? colors.border : '#0a3d62',
                  shadowColor: colors.shadow
                }
              ]}
              onPress={() => openLink('https://www.facebook.com/profile.php?id=61572701168852')}
            >
              <Ionicons name="logo-facebook" size={16} color={isDarkMode ? colors.text : '#0a3d62'} />
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
            style={styles.modalHeader}
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
  leftSection: {
    flex: 1,
    marginRight: 20,
  },
  rightSection: {
    alignItems: 'flex-start',
    minWidth: 200,
  },
  logoContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  logoImage: {
    width: 50,
    height: 50,
    marginBottom: 8,
    borderRadius: 12,
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
    lineHeight: 16,
    fontWeight: '500',
  },
  tncText: {
    lineHeight: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
    marginTop: 15,
  },
  contactTitle: {
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'right',
  },
  contactButtonsContainer: {
    width: '100%',
    alignItems: 'flex-end',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 10,
    width: 200,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    marginHorizontal: 15,
    paddingRight: 42,
  },
  followText: {
    fontWeight: '600',
    marginRight: 12,
  },
  socialMedia: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  iconButton: {
    padding: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    borderWidth: 1,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    minWidth: 32,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  xIconContainer: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  xIcon: {
    fontSize: 12,
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
    paddingTop: 50,
  },
  modalTitle: {
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
});

export default Footer;