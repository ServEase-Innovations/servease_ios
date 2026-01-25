import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet, Image, Modal } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import LinearGradient from 'react-native-linear-gradient';
import TnC from '../TermsAndConditions/TnC';
// import TnC from './TnC'; // Adjust the import path as needed

const Footer = () => {
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

  return (
    <>
      <LinearGradient
        colors={[
          'rgba(255, 255, 255, 1)',       // White at the top
          'rgba(213, 229, 233, 0.8)',     // Lighter blue
          'rgba(139, 187, 221, 0.8)',     // Blue tone at the bottom
        ]}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={styles.gradientContainer}
      >
        <View style={styles.footer}>
          {/* Left side - Logo and Brand Info */}
          <View style={styles.leftSection}>
            <View style={styles.logoContainer}>
              {/* Logo Image */}
              <Image 
                source={require('../../assets/images/serveasonew.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
              <Text style={styles.brandSubtitle}>ServEaso</Text>
            </View>
            
            <View style={styles.companyInfo}>
              <Text style={styles.infoText}>Est. 2024</Text>
              <TouchableOpacity onPress={openTnC}>
                <Text style={styles.tncText}>Terms and Conditions</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Right side - Contact Us Section */}
          <View style={styles.rightSection}>
            <Text style={styles.contactTitle}>Contact us:</Text>
            <View style={styles.contactButtonsContainer}>
              <TouchableOpacity 
                style={styles.contactButton}
                onPress={() => makePhoneCall('+918792827744')}
              >
                <FontAwesome name="phone" size={16} color="#0a3d62" style={styles.phoneIcon} />
                <Text style={styles.contactText}>Helpline: +91 87928 27744</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.contactButton}
                onPress={() => makePhoneCall('+918792827754')}
              >
                <FontAwesome name="phone" size={16} color="#0a3d62" style={styles.phoneIcon} />
                <Text style={styles.contactText}>Join Us: +91 87928 27754</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Follow Us Section - Single line at bottom */}
        <View style={styles.followSection}>
          <Text style={styles.followText}>Follow us on:</Text>
          <View style={styles.socialMedia}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => openLink('https://x.com/ServEaso')}
            >
              <View style={styles.xIconContainer}>
                <Text style={styles.xIcon}>X</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => openLink('https://www.instagram.com/serveaso?igsh=cHQxdmdubnZocjRn')}
            >
              <Ionicons name="logo-instagram" size={16} color="#0a3d62" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => openLink('https://www.youtube.com/@ServEaso')}
            >
              <Ionicons name="logo-youtube" size={16} color="#0a3d62" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => openLink('https://www.linkedin.com/in/serveaso-media-7b7719381/')}
            >
              <Ionicons name="logo-linkedin" size={16} color="#0a3d62" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => openLink('https://www.facebook.com/profile.php?id=61572701168852')}
            >
              <Ionicons name="logo-facebook" size={16} color="#0a3d62" />
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
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Terms and Conditions</Text>
            <TouchableOpacity style={styles.closeButton} onPress={closeTnC}>
              <Ionicons name="close" size={24} color="#0a3d62" />
            </TouchableOpacity>
          </View>
          <TnC />
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    borderTopWidth: 1,
    borderTopColor: '#a0c8ff',
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
    backgroundColor: '#0a3d62',
    borderRadius: 12,
    padding: 10,
  },
  brandSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0a3d62',
    marginLeft: 0,
    textAlign: 'left',
  },
  companyInfo: {
    // marginTop: 5,
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 12,
    color: '#0a3d62',
    lineHeight: 16,
    fontWeight: '500',
  },
  tncText: {
    fontSize: 12,
    color: '#0a3d62',
    lineHeight: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
    marginTop: 15,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0a3d62',
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0a3d62',
    shadowColor: '#000',
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
    fontSize: 12,
    fontWeight: '500',
    color: '#0a3d62',
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
    borderTopColor: '#a0c8ff',
    marginHorizontal: 15,
    paddingRight:42,
  },
  followText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0a3d62',
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
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#0a3d62',
    shadowColor: '#000',
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
    color: '#0a3d62',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0a3d62',
  },
  closeButton: {
    padding: 4,
  },
});

export default Footer;