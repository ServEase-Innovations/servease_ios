/* eslint-disable */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  StyleSheet,
  SafeAreaView,
  StatusBar
} from 'react-native';

interface AboutUsProps {
  onBack: () => void;
  visible?: boolean;
}

const AboutUs = ({ onBack, visible = true }: AboutUsProps) => { // Set default to true for testing
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f3f4f6" />
      
      {/* Back Button */}
      <View style={styles.backButtonContainer}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonArrow}>←</Text>
          <Text style={styles.backButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <ImageBackground
          source={{
            uri: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?fit=crop&w=1600&q=80'
          }}
          style={styles.heroSection}
          resizeMode="cover"
        >
          <View style={styles.heroOverlay}>
            <Text style={styles.heroTitle}>About Us</Text>
            <Text style={styles.heroText}>
              We are <Text style={styles.bold}>ServEaso</Text> – a house helps service provider.
              "ServEaso" collectively means "Service Made Easy" or "Easy Services."
              We simplify the process of connecting customers who need home
              services with reliable and verified professionals.
            </Text>
          </View>
        </ImageBackground>

        {/* Our Story */}
        <View style={styles.ourStorySection}>
          <Text style={styles.sectionTitle}>Our Story</Text>
          <View style={styles.storyContent}>
            <Text style={styles.paragraph}>
              ServEaso provides trained and verified house helps to simplify the
              lives of individuals and families who struggle to balance their
              professional commitments with household responsibilities.
            </Text>
            <Text style={styles.paragraph}>
              ServEaso offers a convenient and reliable solution for those in need
              of house care services, ensuring peace of mind and quality care for
              customers.
            </Text>
            <Text style={styles.subtitle}>
              Challenges We Solve
            </Text>
            <View style={styles.listContainer}>
              {[
                {
                  title: "High Turnover:",
                  description: "Difficulty in retaining house helps due to factors like demanding work conditions, low wages, or lack of work-life balance."
                },
                {
                  title: "Skills Gap:",
                  description: "Lack of necessary skills or training for specific tasks, leading to subpar performance or safety concerns."
                },
                {
                  title: "Communication Barriers:",
                  description: "Language or cultural differences hindering effective communication."
                },
                {
                  title: "Trust and Security:",
                  description: "Concerns about theft, privacy violations, or family safety."
                },
                {
                  title: "Dependence and Entitlement:",
                  description: "Overreliance on employers, reducing household independence."
                },
                {
                  title: "Lack of Legal Protection:",
                  description: "Exploitation due to unclear legal frameworks or poor enforcement."
                },
                {
                  title: "Social Isolation:",
                  description: "Loneliness from living away from families and communities."
                },
                {
                  title: "Employer-Maid Relationship Dynamics:",
                  description: "Difficulty in building respectful, trust-based relationships."
                },
                {
                  title: "Limited Access to Healthcare:",
                  description: "Lack of affordable healthcare or insurance coverage."
                },
                {
                  title: "Lack of Standardized Practices:",
                  description: "No clear guidelines for hiring, training, and managing domestic workers."
                }
              ].map((item, index) => (
                <View key={index} style={styles.listItem}>
                  <Text style={styles.bullet}>•</Text>
                  <View style={styles.listTextContainer}>
                    <Text style={styles.listItemTitle}>{item.title}</Text>
                    <Text style={styles.listItemDescription}>{item.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  backButtonContainer: {
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonArrow: {
    color: '#2563eb',
    fontWeight: '500',
    marginRight: 8,
    fontSize: 18,
  },
  backButtonText: {
    color: '#2563eb',
    fontWeight: '500',
    fontSize: 16,
  },
  heroSection: {
    height: 300,
    width: '100%',
    justifyContent: 'center',
  },
  heroOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 24,
    flex: 1,
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  heroText: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 24,
    maxWidth: '100%',
  },
  bold: {
    fontWeight: 'bold',
  },
  ourStorySection: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: '#f9fafb',
  },
  sectionTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#111827',
  },
  storyContent: {
    maxWidth: '100%',
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#374151',
    marginBottom: 20,
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 16,
    textAlign: 'left',
    color: '#111827',
  },
  listContainer: {
    marginTop: 8,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  bullet: {
    fontSize: 16,
    color: '#374151',
    marginRight: 8,
    lineHeight: 24,
  },
  listTextContainer: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    lineHeight: 24,
  },
  listItemDescription: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 22,
    marginTop: 2,
  },
});

export default AboutUs;