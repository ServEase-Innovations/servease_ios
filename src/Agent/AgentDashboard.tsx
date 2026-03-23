import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Alert,
  FlatList
} from 'react-native';

// --- Data Types ---
interface ProviderData {
  id: string;
  providerName: string;
  type: string;
  dateRegistered: string;
  status: string;
  action: string;
}

type ViewType = 'dashboard' | 'all-providers' | 'applications' | 'register';

const { width } = Dimensions.get('window');

const AgentDashboard: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');

  const [providers] = useState<ProviderData[]>([
    { id: '1', providerName: 'Anita R.', type: 'Caregiver', dateRegistered: '2024-05-15', status: 'Verifying', action: 'Review' },
    { id: '2', providerName: 'Rajesh S.', type: 'Cook', dateRegistered: '2024-05-14', status: 'Active', action: 'View Profile' },
    { id: '3', providerName: 'Priya K.', type: 'Cleaning', dateRegistered: '2024-05-14', status: 'Docs Required', action: 'Contact' },
    { id: '4', providerName: 'Sunil V.', type: 'Cook', dateRegistered: '2024-04-10', status: 'Active', action: 'View Profile' },
  ]);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Active':
        return '#16a34a';
      case 'Docs Required':
        return '#dc2626';
      default:
        return '#ca8a04';
    }
  };

  const getTableTitle = (): string => {
    if (currentView === 'applications') return "Pending Applications";
    if (currentView === 'all-providers') return "All Agency Providers";
    return "Recent Registrations & Status";
  };

  const handleActionPress = (provider: ProviderData) => {
    Alert.alert('Action', `Opening details for ${provider.providerName}`);
  };

  const renderProviderTable = () => {
    const data = currentView === 'applications' 
      ? providers.filter(p => p.status !== 'Active') 
      : providers;

    return (
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>Provider Name</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Type</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Date</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Status</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Action</Text>
        </View>
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 1.5 }]} numberOfLines={1}>
                {item.providerName}
              </Text>
              <Text style={[styles.tableCell, { flex: 1 }]} numberOfLines={1}>
                {item.type}
              </Text>
              <Text style={[styles.tableCell, { flex: 1.2 }]} numberOfLines={1}>
                {item.dateRegistered}
              </Text>
              <Text 
                style={[
                  styles.tableCell, 
                  { 
                    flex: 1.2,
                    color: getStatusColor(item.status),
                    fontWeight: 'bold' as const
                  }
                ]} 
                numberOfLines={1}
              >
                {item.status}
              </Text>
              <TouchableOpacity 
                style={[{ flex: 1, justifyContent: 'center' }]}
                onPress={() => handleActionPress(item)}
              >
                <Text style={[styles.tableCell, styles.actionText]}>{item.action}</Text>
              </TouchableOpacity>
            </View>
          )}
          scrollEnabled={false}
        />
      </View>
    );
  };

  const renderStatsCards = () => (
    <View style={styles.statsContainer}>
      {[
        { label: 'Cooks', count: '34 Active', icon: '👨‍🍳' },
        { label: 'Cleaning Help', count: '56 Active', icon: '🧹' },
        { label: 'Caregivers', count: '22 Active', icon: '❤️' }
      ].map((card, i) => (
        <View key={i} style={styles.statCard}>
          <Text style={styles.statIcon}>{card.icon}</Text>
          <View>
            <Text style={styles.statLabel}>{card.label}</Text>
            <Text style={styles.statCount}>{card.count}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderWelcomeCard = () => (
    <View style={styles.welcomeCard}>
      <Text style={styles.welcomeTitle}>Welcome, Rahul Sharma</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.registerButton}
          onPress={() => setCurrentView('register')}
        >
          <Text style={styles.registerButtonText}>+ Register New Provider</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.applicationsButton}
          onPress={() => setCurrentView('applications')}
        >
          <Text style={styles.applicationsButtonText}>View Applications</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSidebar = () => (
    <View style={styles.sidebar}>
      <View style={styles.earningsCard}>
        <Text style={styles.earningsLabel}>Monthly Earnings</Text>
        <Text style={styles.earningsAmount}>
          ₹25,000 <Text style={styles.earningsPeriod}>/ month</Text>
        </Text>
        <View style={styles.progressBar}>
          <View style={styles.progressFill} />
        </View>
      </View>

      <View style={styles.resourceCard}>
        <Text style={styles.resourceTitle}>Resource Center</Text>
        <View style={styles.resourceItems}>
          <TouchableOpacity style={styles.resourceItem}>
            <Text style={styles.resourceItemText}>How to verify IDs</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resourceItem}>
            <Text style={styles.resourceItemText}>Managing client expectations</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.resourceItem}>
            <Text style={styles.resourceItemText}>Earnings payout cycle</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderRegisterForm = () => (
    <View style={styles.registerForm}>
      <Text style={styles.registerFormTitle}>Register New Provider</Text>
      <Text style={styles.registerFormSubtitle}>
        Enter the details of the service provider to begin onboarding.
      </Text>
      
      <View style={styles.formFields}>
        <TextInput 
          placeholder="Full Name" 
          style={styles.input}
          placeholderTextColor="#94a3b8"
        />
        <View style={styles.pickerContainer}>
          <TextInput 
            placeholder="Select Service Type"
            style={styles.input}
            placeholderTextColor="#94a3b8"
            editable={false}
            value="Select Service Type"
          />
          {/* Note: For actual dropdown, you'd want to use a proper picker component */}
        </View>
        <TextInput 
          placeholder="Phone Number" 
          style={styles.input}
          placeholderTextColor="#94a3b8"
          keyboardType="phone-pad"
        />
        
        <View style={styles.formButtons}>
          <TouchableOpacity style={styles.submitButton}>
            <Text style={styles.submitButtonText}>Submit Details</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => setCurrentView('dashboard')}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#001F3F" barStyle="light-content" />
      
      {/* Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => setCurrentView('dashboard')}>
          <Text style={styles.logo}>SERVEASO</Text>
        </TouchableOpacity>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.navLinks}>
          <TouchableOpacity onPress={() => setCurrentView('dashboard')}>
            <Text style={[styles.navLink, currentView === 'dashboard' && styles.navLinkActive]}>Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setCurrentView('all-providers')}>
            <Text style={[styles.navLink, currentView === 'all-providers' && styles.navLinkActive]}>My Providers</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.navLink}>Recruitment Feed</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.navLink}>Earnings</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.navRight}>
          <View style={styles.locationBadge}>
            <Text style={styles.locationText}>📍 V495+4JM, West Bengal</Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.notificationIcon}>🔔</Text>
          </TouchableOpacity>
          <View style={styles.agentBadge}>
            <Text style={styles.agentText}>👤 Agent</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>
          {currentView === 'dashboard' ? "Provider Management Dashboard" : currentView.replace('-', ' ').toUpperCase()}
        </Text>

        {currentView !== 'register' && renderWelcomeCard()}

        {currentView === 'dashboard' && renderStatsCards()}

        {currentView === 'register' ? (
          renderRegisterForm()
        ) : (
          <View style={styles.mainContent}>
            <View style={[styles.tableWrapper, currentView !== 'dashboard' && styles.fullWidth]}>
              <View style={styles.tableHeaderContainer}>
                <Text style={styles.tableTitle}>{getTableTitle()}</Text>
                {currentView === 'dashboard' && (
                  <TouchableOpacity onPress={() => setCurrentView('all-providers')}>
                    <Text style={styles.viewAllLink}>View Full List →</Text>
                  </TouchableOpacity>
                )}
                {currentView !== 'dashboard' && (
                  <TouchableOpacity onPress={() => setCurrentView('dashboard')}>
                    <Text style={styles.backLink}>← Back to Dashboard</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View style={styles.tableScrollView}>
                  {renderProviderTable()}
                </View>
              </ScrollView>
            </View>

            {currentView === 'dashboard' && renderSidebar()}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#D6E6F7',
  },
  navbar: {
    backgroundColor: '#001F3F',
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#004080',
  },
  logo: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  navLinks: {
    flexDirection: 'row',
    flex: 1,
    marginLeft: 20,
  },
  navLink: {
    color: 'white',
    fontSize: 13,
    marginRight: 20,
    paddingVertical: 5,
  },
  navLinkActive: {
    opacity: 1,
    fontWeight: '600',
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  locationBadge: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  locationText: {
    color: '#666',
    fontSize: 11,
  },
  notificationIcon: {
    fontSize: 18,
    color: 'white',
  },
  agentBadge: {
    backgroundColor: 'white',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  agentText: {
    color: '#004080',
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  pageTitle: {
    color: '#1e293b',
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 20,
    textTransform: 'capitalize',
  },
  welcomeCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  welcomeTitle: {
    fontSize: 22,
    color: '#001f3f',
    marginBottom: 15,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  registerButton: {
    backgroundColor: '#002D62',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  registerButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  applicationsButton: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  applicationsButtonText: {
    color: '#1e293b',
    fontWeight: '500',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: width > 600 ? '30%' : '100%',
    borderWidth: 1,
    borderColor: 'white',
  },
  statIcon: {
    fontSize: 28,
  },
  statLabel: {
    fontWeight: '700',
    fontSize: 15,
    color: '#334155',
  },
  statCount: {
    fontSize: 13,
    color: '#64748b',
  },
  mainContent: {
    flexDirection: 'row',
    gap: 20,
    flexWrap: 'wrap',
  },
  tableWrapper: {
    flex: 2,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    minWidth: width > 800 ? 0 : '100%',
  },
  fullWidth: {
    flex: 1,
    width: '100%',
  },
  tableHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  viewAllLink: {
    color: '#2563eb',
    fontWeight: '600',
    fontSize: 13,
  },
  backLink: {
    color: '#64748b',
    fontWeight: '600',
    fontSize: 13,
  },
  tableScrollView: {
    minWidth: width - 100,
  },
  tableContainer: {
    width: '100%',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#e2e8f0',
  },
  tableHeaderCell: {
    fontWeight: '700',
    fontSize: 13,
    color: '#475569',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableCell: {
    fontSize: 13,
    color: '#334155',
  },
  actionText: {
    color: '#2563eb',
    fontWeight: '600',
    textDecorationLine: 'underline',
    fontSize: 13,
  },
  sidebar: {
    flex: 1,
    gap: 15,
    minWidth: width > 800 ? 250 : '100%',
  },
  earningsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'white',
  },
  earningsLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  earningsAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  earningsPeriod: {
    fontSize: 13,
    fontWeight: '400',
    color: '#64748b',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    marginTop: 12,
  },
  progressFill: {
    height: '100%',
    width: '75%',
    backgroundColor: '#2563eb',
    borderRadius: 10,
  },
  resourceCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1e293b',
  },
  resourceItems: {
    gap: 10,
  },
  resourceItem: {
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    borderLeftWidth: 4,
    borderLeftColor: '#2563eb',
  },
  resourceItemText: {
    fontSize: 13,
    color: '#2563eb',
  },
  registerForm: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 15,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  registerFormTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  registerFormSubtitle: {
    color: '#64748b',
    fontSize: 14,
    marginBottom: 20,
  },
  formFields: {
    gap: 12,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    fontSize: 14,
    backgroundColor: 'white',
  },
  pickerContainer: {
    width: '100%',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  submitButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#002D62',
    alignItems: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: 'white',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#1e293b',
    fontSize: 14,
  },
});

export default AgentDashboard;