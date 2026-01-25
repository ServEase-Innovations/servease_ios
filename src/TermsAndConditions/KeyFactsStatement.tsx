/* eslint-disable */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Linking,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const KeyFactsStatement = () => {
  const openLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.paper}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Key Facts Statement</Text>
          <View style={styles.chip}>
            <Text style={styles.chipText}>Effective: June 22, 2025</Text>
          </View>
        </View>

        <Text style={styles.subtitle}>
          For ServEaso App - Unit of ServEase Innovation Talent Tap Pvt Ltd.
        </Text>

        <View style={styles.infoBox}>
          <View style={styles.infoContent}>
            <Icon name="info" size={20} color="#1976d2" style={styles.infoIcon} />
            <Text style={styles.infoText}>
              This document provides a summary of the most important terms of our service. Please read our full{' '}
              <Text style={styles.link} onPress={() => openLink('/tnc')}>Terms and Conditions</Text> and{' '}
              <Text style={styles.link} onPress={() => openLink('/privacy')}>Privacy Statement</Text> for complete details.
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>1. Our Role as an Aggregator</Text>
        <View style={styles.listContainer}>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>What we do:</Text>
              <Text style={styles.listItemText}>
                ServEase Innovation acts as an agency/online platform connecting you with qualified and vetted Maid, Nanny, and Cook Service Providers. We manage the matching, scheduling, and administrative aspects.
              </Text>
            </View>
          </View>
          <View style={styles.listItem}>
            <Text style={styles.bullet}>•</Text>
            <View style={styles.listItemContent}>
              <Text style={styles.listItemTitle}>Employment Status:</Text>
              <Text style={styles.listItemText}>
                The Service Providers are either employed by Us or contracted as independent professionals under our supervision and management. You are not the direct employer of the Service Provider.
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>2. Services Offered & Scope</Text>
        <Text style={styles.subsectionTitle}>Service Types:</Text>
        
        <View style={styles.indentedContent}>
          <Text style={styles.serviceType}>• Maid Services:</Text>
          <Text style={styles.serviceDescription}>
            General cleaning, tidying, laundry, ironing, dishwashing
          </Text>

          <Text style={styles.serviceType}>• Caregiver Services:</Text>
          <Text style={styles.serviceDescription}>
            Childcare, Old Age Care, supervision, age-appropriate activities, meal preparation for children
          </Text>

          <Text style={styles.serviceType}>• Cook Services:</Text>
          <Text style={styles.serviceDescription}>
            Meal preparation (based on agreed menus/dietary needs), grocery shopping (if agreed)
          </Text>
        </View>

        <Text style={styles.subsectionTitle}>Exclusions:</Text>
        <Text style={styles.serviceDescription}>
          Services typically NOT included (unless specifically agreed and charged for): deep cleaning beyond standard, heavy lifting, specialized repairs, pet care, or personal care for adults.
        </Text>

        <Text style={styles.sectionTitle}>3. Pricing & Fees</Text>
        <View style={styles.pricingBox}>
          <Text style={styles.pricingTitle}>Standard Rates:</Text>
          
          <Text style={styles.rateType}>Demand Services:</Text>
          <View style={styles.rateList}>
            <View style={styles.rateItem}>
              <Text style={styles.bullet}>•</Text>
              <View>
                <Text style={styles.rateText}>Maid service: INR 250 - 700/hour</Text>
                <Text style={styles.rateSubtext}>Based on premium service and property size</Text>
              </View>
            </View>
            <View style={styles.rateItem}>
              <Text style={styles.bullet}>•</Text>
              <View>
                <Text style={styles.rateText}>Cook service: INR 250 - 700/hour</Text>
                <Text style={styles.rateSubtext}>Based on premium service and number of persons</Text>
              </View>
            </View>
            <View style={styles.rateItem}>
              <Text style={styles.bullet}>•</Text>
              <View>
                <Text style={styles.rateText}>Caregiver service: INR 1,000 - 3,000/day</Text>
                <Text style={styles.rateSubtext}>Based on premium service and care requirements</Text>
              </View>
            </View>
          </View>

          <Text style={styles.rateType}>Monthly/Regular Services:</Text>
          <View style={styles.rateList}>
            <View style={styles.rateItem}>
              <Text style={styles.bullet}>•</Text>
              <View>
                <Text style={styles.rateText}>Monthly Maid service: INR 4,000 - 16,000/month</Text>
              </View>
            </View>
            <View style={styles.rateItem}>
              <Text style={styles.bullet}>•</Text>
              <View>
                <Text style={styles.rateText}>Monthly Nanny service: INR 5,000 - 30,000/month</Text>
                <Text style={styles.rateSubtext}>3 hours to 24-hour live-in service</Text>
              </View>
            </View>
          </View>

          <Text style={styles.pricingTitle}>Additional Charges:</Text>
          <View style={styles.rateList}>
            <View style={styles.rateItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.rateText}>Overtime: 1.5x standard rate (6:00 AM – 8:00 PM)</Text>
            </View>
            <View style={styles.rateItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.rateText}>Public Holidays: 1.5x standard rate</Text>
            </View>
            <View style={styles.rateItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.rateText}>Special Requests: 1.5x standard rate</Text>
            </View>
            <View style={styles.rateItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.rateText}>Cancellation Fee: 50% if within 24 hours</Text>
            </View>
          </View>
        </View>

        {/* Continue with all other sections following the same pattern */}

        <Text style={styles.sectionTitle}>9. Governing Law</Text>
        <Text style={styles.regularText}>
          This service agreement is governed by the laws of India and the federal laws of the Indian States if applicable.
        </Text>

        <View style={styles.benefitsBox}>
          <View style={styles.benefitsHeader}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#4caf50" />
            <Text style={styles.benefitsTitle}>Key Benefits of This Statement</Text>
          </View>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.benefitText}>Transparency: Builds trust with clients by clearly outlining essential information upfront.</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.benefitText}>Clarity: Simplifies complex terms into an easily digestible format.</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.benefitText}>Reduces Disputes: By setting clear expectations, it can minimize misunderstandings.</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.benefitText}>Professionalism: Demonstrates your commitment to clear communication.</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            For complete details of your agreement, please refer to our full Terms and Conditions and Privacy Statement available at:
          </Text>
          <TouchableOpacity onPress={() => openLink('www.serveaso.com/tnc')}>
            <Text style={styles.footerLink}>www.serveaso.com/tnc</Text>
          </TouchableOpacity>
          
          <Text style={[styles.footerText, styles.companyInfo]}>
            <Text style={styles.bold}>ServEase Innovation Talent Tap</Text>{'\n'}
            #58 Sir MV Nagar, Ramamurthy Nagar,{'\n'}
            Bengaluru, Karnataka{'\n'}
            Email: <Text style={styles.link} onPress={() => openLink('mailto:support@serveasinnovation.com')}>support@serveasinnovation.com</Text> or{' '}
            <Text style={styles.link} onPress={() => openLink('mailto:support@serveaso.com')}>support@serveaso.com</Text>
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
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    flex: 1,
  },
  chip: {
    backgroundColor: '#1976d2',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    color: 'white',
    fontSize: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    borderRadius: 4,
    padding: 12,
    marginBottom: 20,
  },
  infoContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
  },
  link: {
    color: '#1976d2',
    textDecorationLine: 'underline',
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
  listContainer: {
    marginLeft: 8,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  bullet: {
    marginRight: 8,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  listItemText: {
    fontSize: 14,
    color: '#444',
  },
  indentedContent: {
    marginLeft: 16,
  },
  serviceType: {
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 8,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#444',
    marginLeft: 16,
    marginBottom: 8,
  },
  pricingBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    padding: 12,
    marginBottom: 20,
  },
  pricingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  rateType: {
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: 12,
    marginBottom: 4,
  },
  rateList: {
    marginLeft: 8,
  },
  rateItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  rateText: {
    fontSize: 14,
  },
  rateSubtext: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  regularText: {
    fontSize: 14,
    marginBottom: 12,
  },
  benefitsBox: {
    backgroundColor: '#e8f5e9',
    borderRadius: 4,
    padding: 16,
    marginTop: 24,
    marginBottom: 20,
  },
  benefitsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  benefitsList: {
    marginLeft: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    flex: 1,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 16,
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    marginBottom: 12,
  },
  footerLink: {
    color: '#1976d2',
    textDecorationLine: 'underline',
    marginBottom: 12,
  },
  companyInfo: {
    marginTop: 12,
  },
  bold: {
    fontWeight: 'bold',
  },
});

export default KeyFactsStatement;