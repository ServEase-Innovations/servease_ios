/* eslint-disable */
import React from 'react';
import {
  ScrollView,
  View,
  
  Text,
  StyleSheet,
  Linking,
  TouchableOpacity
} from 'react-native';

const TnC = () => {
  const openEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`).catch(err => console.error("Couldn't load email client", err));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.paper}>
        <Text style={styles.title}>Terms and Conditions</Text>
        
        <Text style={styles.subtitle}>
          For ServEaso App - Unit of ServEase Innovation Talent Tap Pvt Ltd.
        </Text>
        
        <View style={styles.section}>
          <Text style={styles.paragraph}>
            Welcome to ServEaso App! We are delighted to provide you with professional 
            household services, including maid, nanny, and cook services. By engaging our 
            services, you agree to the following terms and conditions:
          </Text>
        </View>
        
        <View style={styles.divider} />
        
        <Text style={styles.sectionTitle}>1. Definitions</Text>
        
        <View style={styles.list}>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>'Company', 'We', 'Us', 'Our': ServEaso App – a unit of ServEase Innovation Talent Tap.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>'Client', 'You', 'Your': Refers to the individual or entity engaging our services.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>'Service Provider(s)': Refers to the maid(s), nanny(ies), or cook(s) provided by the Company.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>'Services': Refers to the household services provided by the Company.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.listText}>'Agreement': Refers to these Terms and Conditions.</Text>
          </View>
        </View>
        
        <Text style={styles.sectionTitle}>2. Service Agreement</Text>
        
        <View style={styles.list}>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>a.</Text>
            <Text style={styles.listText}>Engagement: By requesting and accepting our services, you enter into a service agreement with ServEase Innovation subject to these Terms and Conditions.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>b.</Text>
            <Text style={styles.listText}>Scope of Work: The specific services to be provided, the schedule, and any special instructions will be agreed upon in writing prior to the commencement of services.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>c.</Text>
            <Text style={styles.listText}>Changes to Services: Any changes to the agreed-upon services must be communicated to and approved by the Company in advance. Additional charges may apply.</Text>
          </View>
        </View>
        
        <Text style={styles.sectionTitle}>3. Client Responsibilities</Text>
        
        <View style={styles.list}>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>a.</Text>
            <Text style={styles.listText}>Safe Environment: You agree to provide a safe, secure, and appropriate working environment for the Service Provider(s).</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>b.</Text>
            <Text style={styles.listText}>Access: You must provide timely and unobstructed access to your premises at the agreed-upon service times.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>c.</Text>
            <Text style={styles.listText}>Information Accuracy: You are responsible for providing accurate and complete information regarding your needs.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>d.</Text>
            <Text style={styles.listText}>Supervision (for Nannies): While our nannies are experienced professionals, the Client retains overall responsibility for the safety and well-being of their children.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>e.</Text>
            <Text style={styles.listText}>Equipment & Supplies: Unless otherwise agreed, you are responsible for providing necessary cleaning supplies, equipment, and cooking ingredients.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>f.</Text>
            <Text style={styles.listText}>Direct Engagement Prohibition: You agree not to directly hire any Service Provider introduced to you by ServEaso for a period of 12 months from the last date of service.</Text>
          </View>
        </View>
        
        {/* Continue with the rest of your sections in the same pattern */}
        
        <Text style={styles.sectionTitle}>13. Contact Information</Text>
        
        <View style={styles.contactBox}>
          <Text style={styles.paragraph}>
            For any questions or concerns regarding these Terms and Conditions or our services, please contact us at:
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
          <Text style={styles.importantTitle}>Important Considerations:</Text>
          <View style={styles.list}>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>Local Labor Laws: Extremely critical for employment status, working hours, rest breaks, and termination procedures.</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>Consumer Protection Laws: Ensure fairness and transparency.</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>Data Privacy Laws: If you collect any personal data, you'll need a privacy policy.</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>Specific Service Nuances for different types of service providers.</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>Insurance Coverage: Ensure your insurance policies align with your liability clauses.</Text>
            </View>
            <View style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.listText}>Dispute Resolution: Consider arbitration or mediation as alternatives to court.</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

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
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  bold: {
    fontWeight: 'bold',
  },
  link: {
    color: '#1976d2',
    textDecorationLine: 'underline',
  },
});

export default TnC;