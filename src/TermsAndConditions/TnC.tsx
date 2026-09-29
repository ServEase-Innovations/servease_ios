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
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      nestedScrollEnabled={true}
      showsVerticalScrollIndicator={true}
    >
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
        
        <Text style={styles.sectionTitle}>4. Payment Terms</Text>
        
        <View style={styles.list}>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>a.</Text>
            <Text style={styles.listText}>Fees: Payment terms, including rates and billing cycles, will be agreed upon before the start of services.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>b.</Text>
            <Text style={styles.listText}>Payment Method: Payment must be made through the agreed methods specified by the Company.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>c.</Text>
            <Text style={styles.listText}>Late Payments: Late payments may result in service suspension or termination, and may incur additional charges.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>d.</Text>
            <Text style={styles.listText}>Advance Payment: The Company may require advance payment or a deposit before commencing services.</Text>
          </View>
        </View>
        
        <Text style={styles.sectionTitle}>5. Cancellation and Refund Policy</Text>
        
        <View style={styles.list}>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>a.</Text>
            <Text style={styles.listText}>Cancellation Notice: Cancellations must be made in writing with at least 24 hours notice.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>b.</Text>
            <Text style={styles.listText}>Refunds: Refunds will be processed according to our refund policy, available upon request.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>c.</Text>
            <Text style={styles.listText}>Company Cancellation: We reserve the right to cancel or suspend services due to non-payment, unsafe conditions, or breach of these Terms.</Text>
          </View>
        </View>
        
        <Text style={styles.sectionTitle}>6. Service Provider Conduct</Text>
        
        <View style={styles.list}>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>a.</Text>
            <Text style={styles.listText}>Professionalism: Our Service Providers are trained to maintain high standards of professionalism and conduct.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>b.</Text>
            <Text style={styles.listText}>Replacement: If you are dissatisfied with a Service Provider's performance, please notify us immediately. We will investigate and provide a replacement if necessary.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>c.</Text>
            <Text style={styles.listText}>Complaints: All complaints regarding Service Provider conduct should be reported to us in writing within 24 hours.</Text>
          </View>
        </View>
        
        <Text style={styles.sectionTitle}>7. Liability and Insurance</Text>
        
        <View style={styles.list}>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>a.</Text>
            <Text style={styles.listText}>Reasonable Care: The Company and its Service Providers will exercise reasonable care while performing services.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>b.</Text>
            <Text style={styles.listText}>Limitation of Liability: To the extent permitted by law, the Company's liability is limited to the amount paid for the services in question.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>c.</Text>
            <Text style={styles.listText}>Insurance: The Company maintains appropriate insurance coverage. Details can be provided upon request.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>d.</Text>
            <Text style={styles.listText}>Damages: Claims for damages must be reported within 24 hours of occurrence with supporting evidence.</Text>
          </View>
        </View>
        
        <Text style={styles.sectionTitle}>8. Confidentiality and Data Privacy</Text>
        
        <View style={styles.list}>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>a.</Text>
            <Text style={styles.listText}>Confidentiality: We respect your privacy and will maintain the confidentiality of your personal information.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>b.</Text>
            <Text style={styles.listText}>Data Protection: Your personal data will be processed in accordance with applicable data protection laws and our Privacy Policy.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>c.</Text>
            <Text style={styles.listText}>Third Parties: We will not share your personal information with third parties without your consent, except as required by law.</Text>
          </View>
        </View>
        
        <Text style={styles.sectionTitle}>9. Health and Safety</Text>
        
        <View style={styles.list}>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>a.</Text>
            <Text style={styles.listText}>Health Standards: Service Providers will adhere to health and safety standards as per applicable regulations.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>b.</Text>
            <Text style={styles.listText}>Illness: If a Service Provider is unwell, we will inform you and provide a replacement where possible.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>c.</Text>
            <Text style={styles.listText}>Client Health: You must inform us of any contagious illnesses at your premises. We may suspend services for health and safety reasons.</Text>
          </View>
        </View>
        
        <Text style={styles.sectionTitle}>10. Intellectual Property</Text>
        
        <View style={styles.section}>
          <Text style={styles.paragraph}>
            All intellectual property rights related to the Company's brand, website, app, and materials remain the property of ServEase Innovation Talent Tap.
          </Text>
        </View>
        
        <Text style={styles.sectionTitle}>11. Termination</Text>
        
        <View style={styles.list}>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>a.</Text>
            <Text style={styles.listText}>Termination by Client: You may terminate services by providing written notice as per the agreed notice period.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>b.</Text>
            <Text style={styles.listText}>Termination by Company: We reserve the right to terminate services immediately for breach of these Terms, non-payment, or if continuing service poses a risk to our staff.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>c.</Text>
            <Text style={styles.listText}>Final Settlement: Upon termination, all outstanding payments must be settled.</Text>
          </View>
        </View>
        
        <Text style={styles.sectionTitle}>12. Governing Law and Dispute Resolution</Text>
        
        <View style={styles.list}>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>a.</Text>
            <Text style={styles.listText}>Governing Law: These Terms shall be governed by the laws of India.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>b.</Text>
            <Text style={styles.listText}>Jurisdiction: The courts of Bengaluru, Karnataka shall have exclusive jurisdiction over any disputes arising from these Terms.</Text>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>c.</Text>
            <Text style={styles.listText}>Dispute Resolution: We encourage amicable resolution of disputes. If disputes cannot be resolved informally, mediation or arbitration may be pursued before legal action.</Text>
          </View>
        </View>
        
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
    backgroundColor: '#f5f5f5',
  },
  contentContainer: {
    padding: 16,
    flexGrow: 1,
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
