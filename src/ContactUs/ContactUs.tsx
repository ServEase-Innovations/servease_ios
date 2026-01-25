import React, { useState } from 'react';
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
} from 'react-native';
import { X } from 'lucide-react-native';
import Icon from 'react-native-vector-icons/FontAwesome6';
import TnC from '../TermsAndConditions/TnC';
// import TnC from './TnC'; // Adjust the import path as needed

interface ContactUsProps {
  onBack?: () => void;
}

const ContactUs: React.FC<ContactUsProps> = ({ onBack }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);
  const [showTnC, setShowTnC] = useState(false);

  const handleSubmit = () => {
    if (!isAgreed) {
      Alert.alert("Error", "Please agree to the Terms and Conditions");
      return;
    }
    
    Alert.alert("Success", "Your request has been submitted!");
    
    // Clear the form
    setName('');
    setEmail('');
    setMessage('');
    setIsAgreed(false);
  };

  const goHome = () => {
    if (onBack) {
      onBack();
    } else {
      // Fallback navigation if needed
      console.log("Navigate home");
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header with close button */}
      <View style={styles.header}>
        <Text style={styles.appName}>ServEaso</Text>
        {/* <TouchableOpacity 
          style={styles.closeButton}
          onPress={goHome}
        >
          <X size={Platform.OS === 'ios' ? 28 : 24} color="#374151" />
        </TouchableOpacity> */}
      </View>

      <View style={styles.contentWrapper}>
        {/* Left: Form */}
        <View style={styles.formContainer}>
          <Text style={styles.mainHeading}>Get in touch with us</Text>
          <Text style={styles.description}>
            Fill out the form below or schedule a meeting with us at your
            convenience.
          </Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter Your Email"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Message</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter Your Message"
                placeholderTextColor="#9CA3AF"
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
                {isAgreed && <Icon name="check" size={14} color="white" />}
              </TouchableOpacity>
              <Text style={styles.termsText}>
                I agree with{' '}
                <Text style={styles.termsLink} onPress={() => setShowTnC(true)}>
                  Terms and Conditions
                </Text>
              </Text>
            </View>

            <TouchableOpacity 
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>Send Your Request</Text>
            </TouchableOpacity>
          </View>

          {/* Contact info */}
          <View style={styles.contactInfo}>
            <Text style={styles.contactInfoText}>You can also Contact Us via</Text>
            <View style={styles.contactMethods}>
              <TouchableOpacity 
                style={styles.contactMethod} 
                onPress={handlePhonePress}
              >
                <Icon name="phone" size={16} color="#4f46e5" />
                <Text style={styles.contactText}>+91-8792827744</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.contactMethod} 
                onPress={handleEmailPress}
              >
                <Icon name="envelope" size={16} color="#4f46e5" />
                <Text style={styles.contactText}>support@serveaso.com</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.contactMethod} 
                onPress={handleWhatsAppPress}
              >
                <Icon name="whatsapp" size={16} color="#25D366" />
                <Text style={styles.contactText}>+91-8792827744</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Right: Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.infoHeading}>With our services you can</Text>
          <View style={styles.benefitsList}>
            {[
              'Improve usability of your product',
              'Engage users at a higher level and outperform competition',
              'Reduce onboarding time and improve sales',
              'Balance user needs with your business goal',
            ].map((item, index) => (
              <View key={index} style={styles.benefitItem}>
                <Text style={styles.benefitNumber}>{index + 1}.</Text>
                <Text style={styles.benefitText}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Social Links */}
          <View style={styles.socialContainer}>
            <Text style={styles.socialHeading}>Follow us</Text>
            <View style={styles.socialIcons}>
              <TouchableOpacity 
                style={styles.socialIcon}
                onPress={() => openSocialLink('https://www.linkedin.com/in/serveaso-media-7b7719381/')}
              >
                <Icon name="linkedin" size={24} color="#374151" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.socialIcon}
                onPress={() => openSocialLink('https://www.facebook.com/profile.php?id=61572701168852')}
              >
                <Icon name="facebook" size={24} color="#374151" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.socialIcon}
                onPress={() => openSocialLink('https://www.instagram.com/serveaso?igsh=cHQxdmdubnZocjRn')}
              >
                <Icon name="instagram" size={24} color="#374151" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.socialIcon}
                onPress={() => openSocialLink('https://www.youtube.com/@ServEaso')}
              >
                <Icon name="youtube" size={24} color="#374151" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.socialIcon}
                onPress={() => openSocialLink('https://x.com/ServEaso')}
              >
                <Icon name="x-twitter" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Store Links */}
          <View style={styles.storeContainer}>
            <Text style={styles.storeHeading}>Download Our App</Text>
            <View style={styles.storeIcons}>
              <TouchableOpacity 
                style={styles.storeIcon}
                onPress={openPlayStore}
              >
                <Icon name="google-play" size={28} color="#374151" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.storeIcon}
                onPress={openAppStore}
              >
                <Icon name="app-store-ios" size={28} color="#374151" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Terms and Conditions Modal */}
      <Modal
        visible={showTnC}
        animationType="slide"
        onRequestClose={() => setShowTnC(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Terms and Conditions</Text>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => setShowTnC(false)}
            >
              <X size={24} color="#374151" />
            </TouchableOpacity>
          </View>
          <TnC />
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  contentContainer: {
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  contentWrapper: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  formContainer: {
    marginBottom: 30,
  },
  mainHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  form: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  termsText: {
    fontSize: 12,
    color: '#4B5563',
  },
  termsLink: {
    color: '#4f46e5',
    textDecorationLine: 'underline',
  },
  submitButton: {
    backgroundColor: '#000',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  contactInfo: {
    alignItems: 'flex-start',
  },
  contactInfoText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 12,
  },
  contactMethods: {
    width: '100%',
  },
  contactMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  contactText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 8,
  },
  infoContainer: {
    marginBottom: 20,
  },
  infoHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  benefitsList: {
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  benefitNumber: {
    fontSize: 14,
    color: '#374151',
    marginRight: 8,
    fontWeight: '500',
  },
  benefitText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  socialContainer: {
    marginBottom: 24,
  },
  socialHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  socialIcons: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  socialIcon: {
    marginRight: 16,
    padding: 8,
  },
  storeContainer: {
    marginBottom: 10,
  },
  storeHeading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  storeIcons: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  storeIcon: {
    marginRight: 16,
    padding: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: 4,
  },
});

export default ContactUs;