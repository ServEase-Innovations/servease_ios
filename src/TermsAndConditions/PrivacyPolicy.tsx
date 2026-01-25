import React from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Linking,
  TouchableOpacity
} from 'react-native';

const PrivacyPolicy = () => {
  const openEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`).catch(err => console.error("Couldn't load email client", err));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.paper}>
        <Text style={styles.title}>Privacy Statement</Text>
        
        <Text style={styles.subtitle}>
          For ServEaso App - Unit of ServEase Innovation Talent Tap Pvt Ltd.
        </Text>
        
        <Text style={styles.effectiveDate}>
          Effective Date: June 22, 2025
        </Text>
        
        <View style={styles.section}>
          <Text style={styles.paragraph}>
            At ServEase Innovation Talent Tap, we are committed to protecting the privacy and 
            personal data of our clients and service providers. This Privacy Statement explains how 
            we collect, use, disclose, and protect your personal information when you use our 
            maid, nanny, and cook services.
          </Text>
        </View>
        
        <View style={styles.divider} />
        
        <Text style={styles.sectionTitle}>1. Who We Are</Text>
        <Text style={styles.paragraph}>
          ServEase Innovation Talent Tap is a service provider based in Karnataka, India, 
          specializing in connecting clients with qualified household service professionals.
        </Text>
        
        <Text style={styles.sectionTitle}>2. Information We Collect</Text>
        <Text style={styles.paragraph}>
          We collect various types of information to provide and improve our services to you. 
          This may include:
        </Text>
        
        <Text style={styles.subsectionTitle}>a. Information You Provide Directly:</Text>
        <View style={styles.list}>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Contact Information: Name, address, email address, phone number and KYC document.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Service Preferences: Details about the type of service required (maid, nanny, cook), frequency, schedule, specific tasks, special instructions.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Household Information: Number of children, pets, size of residence, specific areas to be serviced.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Payment Information: Billing address, UPI, credit/debit card details (processed securely via third-party payment processors).</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Identification (for Service Providers): Aadhar Card, passport details, work permits, educational qualifications, previous employment history.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Communication Content: Information you provide when communicating with us via phone, email, or messaging apps.</Text>
          </View>
        </View>
        
        <Text style={styles.subsectionTitle}>b. Information We Collect Automatically:</Text>
        <View style={styles.list}>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Usage Data: Information about how you interact with our website or mobile application.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Technical Data: IP address, browser type, operating system, device identifiers.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>Cookies and Tracking Technologies: We may use cookies and similar technologies to enhance your experience.</Text>
          </View>
        </View>
        
        {/* Continue with all other sections following the same pattern */}
        
        <Text style={styles.sectionTitle}>10. Contact Us</Text>
        <View style={styles.contactBox}>
          <Text style={styles.paragraph}>
            If you have any questions or concerns about this Privacy Statement or our data 
            practices, please contact us at:
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>ServEase Innovation Talent Tap</Text>{'\n'}
            #58 Sir MV Nagar, Ramamurthy Nagar{'\n'}
            Bengaluru, Karnataka{'\n'}
            Email - <Text style={styles.link} onPress={() => openEmail('support@serveasinnovation.com')}>support@serveasinnovation.com</Text> or{' '}
            <Text style={styles.link} onPress={() => openEmail('support@serveaso.com')}>support@serveaso.com</Text>
          </Text>
        </View>
        
        <View style={styles.importantBox}>
          <Text style={styles.importantTitle}>Crucial Considerations for Your Legal Review:</Text>
          <View style={styles.list}>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>Federal Decree-Law No. 45 of 2021 on Personal Data Protection (PDPL): Your privacy statement must align with its principles.</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>Consent: Ensure your consent mechanisms are clear and verifiable.</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>Sensitive Personal Data: Specify the lawful basis for processing sensitive data.</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>Children's Data: Ensure compliance with specific provisions regarding children's data.</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>Data Breach Notification: Familiarize yourself with the requirements for notifying authorities.</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>Data Protection Officer (DPO): Depending on the scale of processing, you might need to appoint a DPO.</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>Cross-Border Transfers: Ensure adequate protection mechanisms for data transferred outside India.</Text>
            </View>
          </View>
          <Text style={styles.noteText}>
            Important Note: This should be reviewed and customized by a legal professional
            to ensure full compliance with India's data protection laws.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  paper: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  effectiveDate: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  section: {
    marginVertical: 12,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  list: {
    marginLeft: 8,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    marginRight: 8,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  contactBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    marginBottom: 20,
  },
  importantBox: {
    backgroundColor: '#fff8e1',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
  },
  importantTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  noteText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 8,
  },
  bold: {
    fontWeight: 'bold',
  },
  link: {
    color: '#1976d2',
    textDecorationLine: 'underline',
  },
});

export default PrivacyPolicy;