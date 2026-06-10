import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
  Alert,
  Modal,
  BackHandler,
  Image,
} from 'react-native';
import { X } from 'lucide-react-native';
import Icon from 'react-native-vector-icons/FontAwesome6';
import LinearGradient from 'react-native-linear-gradient';
import TnC from '../TermsAndConditions/TnC';
import { useTheme } from '../../src/Settings/ThemeContext';
import { BOOKING_HEADER_GRADIENT } from '../theme/brandColors';
import utilsInstance from '../services/utilsInstance';

interface ContactUsProps {
  onBack?: () => void;
}

const ContactUs: React.FC<ContactUsProps> = ({ onBack }) => {
  const { colors, isDarkMode, fontSize } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);
  const [showTnC, setShowTnC] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const getFontSizes = () => {
    switch (fontSize) {
      case 'small':
        return {
          headerTitle: 18,
          heading: 22,
          subheading: 13,
          bodyText: 12,
          labelText: 12,
          inputText: 13,
          buttonText: 13,
          benefitText: 12,
          contactText: 12,
        };
      case 'large':
        return {
          headerTitle: 22,
          heading: 28,
          subheading: 16,
          bodyText: 15,
          labelText: 15,
          inputText: 16,
          buttonText: 16,
          benefitText: 15,
          contactText: 15,
        };
      default:
        return {
          headerTitle: 20,
          heading: 24,
          subheading: 14,
          bodyText: 14,
          labelText: 14,
          inputText: 14,
          buttonText: 14,
          benefitText: 14,
          contactText: 14,
        };
    }
  };

  const fontSizes = getFontSizes();

  // Handle back button press
  const handleBackPress = () => {
    if (onBack) {
      onBack();
      return true;
    }
    return false;
  };

  // Set up back handler when component mounts
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [onBack]);

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    if (!isAgreed) {
      Alert.alert("Error", "Please agree to the Terms and Conditions");
      return;
    }

    setSubmitting(true);
    try {
      await utilsInstance.post("/api/contact-us", {
        name: trimmedName,
        email: trimmedEmail,
        message: trimmedMessage,
        source: "ios",
      });
      Alert.alert("Success", "Your request has been submitted!");
      setName("");
      setEmail("");
      setMessage("");
      setIsAgreed(false);
    } catch (err: unknown) {
      const apiMessage =
        err &&
        typeof err === "object" &&
        "response" in err &&
        err.response &&
        typeof err.response === "object" &&
        "data" in err.response &&
        err.response.data &&
        typeof err.response.data === "object" &&
        "error" in err.response.data &&
        typeof err.response.data.error === "string"
          ? err.response.data.error
          : "We could not send your message. Please try again or email support@serveaso.com directly.";
      Alert.alert("Error", apiMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const goHome = () => {
    if (onBack) {
      onBack();
    }
  };

  const handleEmailPress = () => {
    Linking.openURL('mailto:support@serveaso.com');
  };

  const handlePhonePress = () => {
    Linking.openURL('tel:+918792827744');
  };

  const handleWhatsAppPress = () => {
    Linking.openURL('https://wa.me/918792827744');
  };

  const openSocialLink = (url: string) => {
    Linking.openURL(url);
  };

  const openAppStore = () => {
    Linking.openURL('https://apps.apple.com');
  };

  const openPlayStore = () => {
    Linking.openURL('https://play.google.com');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with Gradient and Logo */}
      <LinearGradient
        colors={[...BOOKING_HEADER_GRADIENT]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: Platform.OS === 'ios' ? 50 : 30 }]}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={goHome}
            accessibilityLabel="Go back"
          >
            <Icon name="arrow-left" size={22} color="#ffffff" />
          </TouchableOpacity>
          
          <View style={styles.logoContainer}>
            <Image
              source={require("../../assets/images/serveasologo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          
          {/* <TouchableOpacity 
            style={styles.closeButton}
            onPress={goHome}
          >
            <X size={Platform.OS === 'ios' ? 24 : 22} color="#ffffff" />
          </TouchableOpacity> */}
        </View>
        <Text style={[styles.headerSubtitle, { fontSize: fontSizes.subheading }]}>
          We're here to help and answer any questions you might have
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrapper}>
          {/* Form Section */}
          <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border + '30' }]}>
            <Text style={[styles.mainHeading, { color: colors.text, fontSize: fontSizes.heading }]}>
              Get in touch with us
            </Text>
            <Text style={[styles.description, { color: colors.textSecondary, fontSize: fontSizes.bodyText }]}>
              Fill out the form below and we'll get back to you as soon as possible.
            </Text>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text, fontSize: fontSizes.labelText }]}>Full Name</Text>
                <TextInput
                  style={[
                    styles.input, 
                    { 
                      backgroundColor: colors.surface, 
                      borderColor: colors.border,
                      color: colors.text,
                      fontSize: fontSizes.inputText
                    }
                  ]}
                  placeholder="Your name"
                  placeholderTextColor={colors.textSecondary + '80'}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text, fontSize: fontSizes.labelText }]}>Email Address</Text>
                <TextInput
                  style={[
                    styles.input, 
                    { 
                      backgroundColor: colors.surface, 
                      borderColor: colors.border,
                      color: colors.text,
                      fontSize: fontSizes.inputText
                    }
                  ]}
                  placeholder="Enter Your Email"
                  placeholderTextColor={colors.textSecondary + '80'}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.text, fontSize: fontSizes.labelText }]}>Message</Text>
                <TextInput
                  style={[
                    styles.input, 
                    styles.textArea, 
                    { 
                      backgroundColor: colors.surface, 
                      borderColor: colors.border,
                      color: colors.text,
                      fontSize: fontSizes.inputText
                    }
                  ]}
                  placeholder="Enter Your Message"
                  placeholderTextColor={colors.textSecondary + '80'}
                  multiline={true}
                  numberOfLines={4}
                  value={message}
                  onChangeText={setMessage}
                />
              </View>

              <View style={styles.checkboxContainer}>
                <TouchableOpacity 
                  style={[styles.checkbox, isAgreed && styles.checkboxChecked]} 
                  onPress={() => setIsAgreed(!isAgreed)}
                >
                  {isAgreed && <Icon name="check" size={12} color="white" />}
                </TouchableOpacity>
                <Text style={[styles.termsText, { color: colors.textSecondary, fontSize: fontSizes.bodyText }]}>
                  I agree with{' '}
                  <Text style={[styles.termsLink, { color: colors.primary }]} onPress={() => setShowTnC(true)}>
                    Terms and Conditions
                  </Text>
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: colors.primary, opacity: submitting ? 0.65 : 1 },
                ]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                <Text style={[styles.submitButtonText, { color: '#fff', fontSize: fontSizes.buttonText }]}>
                  {submitting ? "Sending…" : "Send Your Request"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Contact Methods */}
          <View style={[styles.contactCard, { backgroundColor: colors.card, borderColor: colors.border + '30' }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSizes.heading - 4 }]}>
              Contact Methods
            </Text>
            <View style={styles.contactMethods}>
              <TouchableOpacity 
                style={[styles.contactMethod, { backgroundColor: colors.surface }]} 
                onPress={handlePhonePress}
              >
                <View style={[styles.contactIcon, { backgroundColor: colors.primary + '15' }]}>
                  <Icon name="phone" size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.contactLabel, { color: colors.textSecondary, fontSize: fontSizes.bodyText - 2 }]}>
                    Call Us
                  </Text>
                  <Text style={[styles.contactText, { color: colors.text, fontSize: fontSizes.contactText }]}>
                    +91-8792827744
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.contactMethod, { backgroundColor: colors.surface }]} 
                onPress={handleEmailPress}
              >
                <View style={[styles.contactIcon, { backgroundColor: colors.primary + '15' }]}>
                  <Icon name="envelope" size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.contactLabel, { color: colors.textSecondary, fontSize: fontSizes.bodyText - 2 }]}>
                    Email Us
                  </Text>
                  <Text style={[styles.contactText, { color: colors.text, fontSize: fontSizes.contactText }]}>
                    support@serveaso.com
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.contactMethod, { backgroundColor: colors.surface }]} 
                onPress={handleWhatsAppPress}
              >
                <View style={[styles.contactIcon, { backgroundColor: '#25D366' + '15' }]}>
                  <Icon name="whatsapp" size={18} color="#25D366" />
                </View>
                <View>
                  <Text style={[styles.contactLabel, { color: colors.textSecondary, fontSize: fontSizes.bodyText - 2 }]}>
                    WhatsApp
                  </Text>
                  <Text style={[styles.contactText, { color: colors.text, fontSize: fontSizes.contactText }]}>
                    +91-8792827744
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Benefits Section */}
          <View style={[styles.benefitsCard, { backgroundColor: colors.card, borderColor: colors.border + '30' }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSizes.heading - 4 }]}>
              Why Choose Serveaso?
            </Text>
            <View style={styles.benefitsList}>
              {[
                'Professional and verified service providers',
                'Flexible booking options to suit your schedule',
                'Transparent pricing with no hidden costs',
                '24/7 customer support for your convenience',
                'Secure and hassle-free payment system',
              ].map((item, index) => (
                <View key={index} style={styles.benefitItem}>
                  <View style={[styles.benefitNumber, { backgroundColor: colors.primary + '15' }]}>
                    <Text style={[styles.benefitNumberText, { color: colors.primary, fontSize: fontSizes.benefitText - 2 }]}>
                      {index + 1}
                    </Text>
                  </View>
                  <Text style={[styles.benefitText, { color: colors.textSecondary, fontSize: fontSizes.benefitText }]}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Social Links */}
          <View style={[styles.socialCard, { backgroundColor: colors.card, borderColor: colors.border + '30' }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSizes.heading - 4 }]}>
              Follow Us
            </Text>
            <View style={styles.socialIcons}>
              <TouchableOpacity 
                style={[styles.socialIcon, { backgroundColor: colors.surface }]}
                onPress={() => openSocialLink('https://www.linkedin.com/in/serveaso-media-7b7719381/')}
              >
                <Icon name="linkedin" size={22} color="#0077B5" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.socialIcon, { backgroundColor: colors.surface }]}
                onPress={() => openSocialLink('https://www.facebook.com/profile.php?id=61572701168852')}
              >
                <Icon name="facebook" size={22} color="#1877F2" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.socialIcon, { backgroundColor: colors.surface }]}
                onPress={() => openSocialLink('https://www.instagram.com/serveaso?igsh=cHQxdmdubnZocjRn')}
              >
                <Icon name="instagram" size={22} color="#E4405F" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.socialIcon, { backgroundColor: colors.surface }]}
                onPress={() => openSocialLink('https://www.youtube.com/@ServEaso')}
              >
                <Icon name="youtube" size={22} color="#FF0000" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.socialIcon, { backgroundColor: colors.surface }]}
                onPress={() => openSocialLink('https://x.com/ServEaso')}
              >
                <Icon name="x-twitter" size={22} color="#000000" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Store Links */}
          <View style={[styles.storeCard, { backgroundColor: colors.card, borderColor: colors.border + '30' }]}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSizes.heading - 4 }]}>
              Download Our App
            </Text>
            <View style={styles.storeIcons}>
              <TouchableOpacity 
                style={[styles.storeIcon, { backgroundColor: colors.surface }]}
                onPress={openPlayStore}
              >
                <Icon name="google-play" size={28} color="#3DDC84" />
                <Text style={[styles.storeText, { color: colors.text, fontSize: fontSizes.bodyText }]}>Google Play</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.storeIcon, { backgroundColor: colors.surface }]}
                onPress={openAppStore}
              >
                <Icon name="app-store-ios" size={28} color="#000000" />
                <Text style={[styles.storeText, { color: colors.text, fontSize: fontSizes.bodyText }]}>App Store</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Terms and Conditions Modal */}
      <Modal
        visible={showTnC}
        animationType="slide"
        onRequestClose={() => setShowTnC(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <LinearGradient
            colors={[...BOOKING_HEADER_GRADIENT]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalHeader}
          >
            <Text style={[styles.modalTitle, { fontSize: fontSizes.heading - 4 }]}>Terms and Conditions</Text>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowTnC(false)}
            >
              <X size={24} color="#ffffff" />
            </TouchableOpacity>
          </LinearGradient>
          <TnC />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    width: '100%',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
logoContainer: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
},
logo: {
  width: 200,
  height: 100,
  resizeMode: 'contain',
  transform: [{ scale: 1.7 }], // 30% zoom
},
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500',
    paddingHorizontal: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  contentWrapper: {
    gap: 16,
  },
  formCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  mainHeading: {
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    marginBottom: 20,
    lineHeight: 20,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  termsText: {
    flex: 1,
  },
  termsLink: {
    textDecorationLine: 'underline',
  },
  submitButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    fontWeight: '700',
  },
  contactCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontWeight: '700',
    marginBottom: 16,
  },
  contactMethods: {
    gap: 12,
  },
  contactMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 14,
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: {
    marginBottom: 2,
  },
  contactText: {
    fontWeight: '500',
  },
  benefitsCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitNumberText: {
    fontWeight: '700',
  },
  benefitText: {
    flex: 1,
    lineHeight: 20,
  },
  socialCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  socialIcons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  socialIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  storeIcons: {
    flexDirection: 'row',
    gap: 12,
  },
  storeIcon: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  storeText: {
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  modalTitle: {
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  modalCloseButton: {
    padding: 4,
  },
});

export default ContactUs;