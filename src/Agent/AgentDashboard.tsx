import React, { useState, useEffect } from 'react';
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
  FlatList,
  ActivityIndicator,
} from 'react-native';
import providerInstance from '../services/providerInstance';
import { useTheme } from '../../src/Settings/ThemeContext';

// --- Data Types ---
interface ServiceProviderDetails {
  serviceproviderid: string;
  vendorId: string;
  firstName: string;
  lastName: string;
  mobileNo: string;
  emailId: string;
  housekeepingRole: string;
  experience: number;
  dob: string;
  currentLocation: string;
  rating: number;
  isactive: boolean;
  enrolleddate: string;
}

interface VendorData {
  vendorId: string;
  address: string;
  companyName: string;
  createdDate: string;
  emailid: string;
  isActive: boolean;
  phoneNo: string;
  registrationId: string;
  serviceProviders: ServiceProviderDetails[];
  providers: ServiceProviderDetails[];
}

interface ProviderData {
  id: string;
  providerName: string;
  type: string;
  dateRegistered: string;
  status: string;
  action: string;
  mobileNo?: string;
  emailId?: string;
  experience?: number;
  rating?: number;
}

type ViewType = 'dashboard' | 'all-providers' | 'applications' | 'register';

const { width } = Dimensions.get('window');

const AgentDashboard: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [providers, setProviders] = useState<ProviderData[]>([]);
  const [vendorData, setVendorData] = useState<VendorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // User ID - you can get this from auth context or props
  const userId = 17; // Example vendor ID

  // Fetch vendor data on component mount
  useEffect(() => {
    const fetchVendorData = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await providerInstance.get(`/api/vendor/${userId}`);
        
        if (response.data?.status === 200 && response.data?.data) {
          const vendorDataResponse = response.data.data;
          setVendorData(vendorDataResponse);
          
          // Transform service providers to the format needed for the grid
          const transformedProviders = transformProvidersData(vendorDataResponse.providers || []);
          setProviders(transformedProviders);
          setError(null);
        } else {
          setError('Failed to fetch vendor data');
        }
      } catch (err) {
        console.error("Error fetching vendor data:", err);
        setError('Unable to load provider data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVendorData();
  }, [userId]);

  // Transform API data to grid format
  const transformProvidersData = (apiProviders: ServiceProviderDetails[]): ProviderData[] => {
    return apiProviders.map(provider => ({
      id: provider.serviceproviderid,
      providerName: `${provider.firstName} ${provider.lastName}`,
      type: formatProviderType(provider.housekeepingRole),
      dateRegistered: formatDateForDisplay(provider.enrolleddate),
      status: provider.isactive ? 'Active' : 'Inactive',
      action: 'View Profile',
      mobileNo: provider.mobileNo,
      emailId: provider.emailId,
      experience: provider.experience,
      rating: provider.rating
    }));
  };

  // Format provider type for display
  const formatProviderType = (role: string): string => {
    const typeMap: { [key: string]: string } = {
      'NANNY': 'Caregiver',
      'COOK': 'Cook',
      'CLEANING': 'Cleaning',
      'MAID': 'Maid / Cleaning'
    };
    return typeMap[role] || role;
  };

  // Format date for display
  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate stats based on actual data
  const getProviderStats = () => {
    const activeProviders = providers.filter(p => p.status === 'Active');
    const cooks = providers.filter(p => p.type === 'Cook').length;
    const cleaning = providers.filter(p => p.type === 'Cleaning').length;
    const caregivers = providers.filter(p => p.type === 'Caregiver').length;
    
    return {
      totalActive: activeProviders.length,
      cooks,
      cleaning,
      caregivers
    };
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Active':
        return '#16a34a';
      case 'Inactive':
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
    Alert.alert(
      'Provider Details',
      `Provider: ${provider.providerName}\nType: ${provider.type}\nMobile: ${provider.mobileNo || 'N/A'}\nEmail: ${provider.emailId || 'N/A'}\nExperience: ${provider.experience || 0} years\nRating: ${provider.rating || 0}/5`
    );
  };

  const renderProviderTable = () => {
    const data = currentView === 'applications' 
      ? providers.filter(p => p.status !== 'Active') 
      : providers;

    if (data.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>No providers found</Text>
        </View>
      );
    }

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
          scrollEnabled={false}
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
        />
      </View>
    );
  };

  const renderStatsCards = () => {
    const stats = getProviderStats();
    return (
      <View style={styles.statsContainer}>
        {[
          { label: 'Cooks', count: `${stats.cooks} Active`, icon: '👨‍🍳' },
          { label: 'Cleaning Help', count: `${stats.cleaning} Active`, icon: '🧹' },
          { label: 'Caregivers', count: `${stats.caregivers} Active`, icon: '❤️' }
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
  };

  const renderWelcomeCard = () => (
    <View style={styles.welcomeCard}>
      <Text style={styles.welcomeTitle}>Welcome, {vendorData?.companyName ? `${vendorData.companyName} Admin` : 'Rahul Sharma'}</Text>
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

  const renderSidebar = () => {
    const stats = getProviderStats();
    return (
      <View style={styles.sidebar}>
        <View style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>Total Providers</Text>
          <Text style={styles.earningsAmount}>{providers.length}</Text>
          <Text style={styles.earningsPeriod}>{stats.totalActive} Active Providers</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(stats.totalActive / (providers.length || 1)) * 100}%` }]} />
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
  };

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

  // Show loading state with skeleton loaders
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#D6E6F7' }]}>
        <StatusBar backgroundColor="#001F3F" barStyle="light-content" />
        
        {/* Navbar Skeleton */}
        <View style={styles.navbar}>
          <View style={styles.skeletonLogo} />
          <View style={styles.skeletonNavLinks}>
            <View style={styles.skeletonNavLink} />
            <View style={styles.skeletonNavLink} />
            <View style={styles.skeletonNavLink} />
            <View style={styles.skeletonNavLink} />
          </View>
          <View style={styles.navRight}>
            <View style={styles.skeletonLocationBadge} />
            <View style={styles.skeletonNotification} />
            <View style={styles.skeletonAgentBadge} />
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Title Skeleton */}
          <View style={styles.skeletonTitle} />
          
          {/* Welcome Card Skeleton */}
          <View style={styles.skeletonWelcomeCard}>
            <View style={styles.skeletonWelcomeTitle} />
            <View style={styles.skeletonButtonGroup}>
              <View style={styles.skeletonButton} />
              <View style={styles.skeletonButtonSecondary} />
            </View>
          </View>

          {/* Stats Grid Skeleton */}
          <View style={styles.statsContainer}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.skeletonStatCard}>
                <View style={styles.skeletonStatIcon} />
                <View>
                  <View style={styles.skeletonStatLabel} />
                  <View style={styles.skeletonStatCount} />
                </View>
              </View>
            ))}
          </View>

          {/* Main Content Skeleton */}
          <View style={styles.mainContent}>
            <View style={styles.skeletonTableWrapper}>
              <View style={styles.skeletonTableHeader}>
                <View style={styles.skeletonTableTitle} />
                <View style={styles.skeletonViewAllLink} />
              </View>
              <View style={styles.tableContainer}>
                <View style={styles.tableHeader}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <View key={i} style={[styles.skeletonTableCell, { flex: i === 0 ? 1.5 : i === 1 ? 1 : i === 2 ? 1.2 : i === 3 ? 1.2 : 1 }]} />
                  ))}
                </View>
                {[1, 2, 3, 4].map((i) => (
                  <View key={i} style={styles.skeletonTableRow}>
                    {[1, 2, 3, 4, 5].map((j) => (
                      <View key={j} style={[styles.skeletonTableRowCell, { flex: j === 0 ? 1.5 : j === 1 ? 1 : j === 2 ? 1.2 : j === 3 ? 1.2 : 1 }]} />
                    ))}
                  </View>
                ))}
              </View>
            </View>

            {/* Sidebar Skeleton */}
            <View style={styles.sidebar}>
              <View style={styles.skeletonEarningsCard}>
                <View style={styles.skeletonEarningsLabel} />
                <View style={styles.skeletonEarningsAmount} />
                <View style={styles.skeletonEarningsPeriod} />
                <View style={styles.skeletonProgressBar} />
              </View>
              <View style={styles.skeletonResourceCard}>
                <View style={styles.skeletonResourceTitle} />
                {[1, 2, 3].map((i) => (
                  <View key={i} style={styles.skeletonResourceItem} />
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Show error state
  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: '#D6E6F7' }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ Error: {error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setIsLoading(true);
              setError(null);
              // Re-fetch data logic would go here
            }}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const stats = getProviderStats();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#D6E6F7' }]}>
      <StatusBar backgroundColor="#001F3F" barStyle="light-content" />
      
      {/* Navbar */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => setCurrentView('dashboard')}>
          <Text style={styles.logo}>{vendorData?.companyName || 'SERVEASO'}</Text>
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
            <Text style={styles.locationText}>📍 {vendorData?.address || 'Location not set'}</Text>
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
  },
  navbar: {
    backgroundColor: '#001F3F',
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingTop: 30,
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
    opacity: 0.7,
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
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
  },
  earningsPeriod: {
    fontSize: 13,
    fontWeight: '400',
    color: '#64748b',
    marginTop: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    marginTop: 12,
  },
  progressFill: {
    height: '100%',
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
  emptyStateContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    color: '#64748b',
    fontSize: 14,
    fontStyle: 'italic',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  // Skeleton styles
  skeletonLogo: {
    width: 100,
    height: 24,
    backgroundColor: '#2c5282',
    borderRadius: 4,
  },
  skeletonNavLinks: {
    flexDirection: 'row',
    marginLeft: 20,
    gap: 20,
  },
  skeletonNavLink: {
    width: 80,
    height: 16,
    backgroundColor: '#2c5282',
    borderRadius: 4,
  },
  skeletonLocationBadge: {
    width: 120,
    height: 28,
    backgroundColor: '#2c5282',
    borderRadius: 20,
  },
  skeletonNotification: {
    width: 28,
    height: 28,
    backgroundColor: '#2c5282',
    borderRadius: 14,
  },
  skeletonAgentBadge: {
    width: 60,
    height: 28,
    backgroundColor: '#2c5282',
    borderRadius: 20,
  },
  skeletonTitle: {
    width: 250,
    height: 32,
    backgroundColor: '#cbd5e1',
    borderRadius: 6,
    marginBottom: 20,
  },
  skeletonWelcomeCard: {
    backgroundColor: 'rgba(203, 213, 225, 0.4)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  skeletonWelcomeTitle: {
    width: 200,
    height: 28,
    backgroundColor: '#cbd5e1',
    borderRadius: 4,
    marginBottom: 15,
  },
  skeletonButtonGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  skeletonButton: {
    width: 180,
    height: 40,
    backgroundColor: '#cbd5e1',
    borderRadius: 30,
  },
  skeletonButtonSecondary: {
    width: 140,
    height: 40,
    backgroundColor: '#cbd5e1',
    borderRadius: 30,
  },
  skeletonStatCard: {
    backgroundColor: 'rgba(203, 213, 225, 0.5)',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  skeletonStatIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#cbd5e1',
    borderRadius: 20,
  },
  skeletonStatLabel: {
    width: 100,
    height: 18,
    backgroundColor: '#cbd5e1',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonStatCount: {
    width: 80,
    height: 16,
    backgroundColor: '#cbd5e1',
    borderRadius: 4,
  },
  skeletonTableWrapper: {
    flex: 2,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
  },
  skeletonTableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  skeletonTableTitle: {
    width: 150,
    height: 24,
    backgroundColor: '#cbd5e1',
    borderRadius: 4,
  },
  skeletonViewAllLink: {
    width: 100,
    height: 20,
    backgroundColor: '#cbd5e1',
    borderRadius: 4,
  },
  skeletonTableCell: {
    height: 16,
    backgroundColor: '#cbd5e1',
    borderRadius: 4,
    marginHorizontal: 8,
  },
  skeletonTableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  skeletonTableRowCell: {
    height: 16,
    backgroundColor: '#cbd5e1',
    borderRadius: 4,
    marginHorizontal: 8,
  },
  skeletonEarningsCard: {
    backgroundColor: 'rgba(203, 213, 225, 0.4)',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  skeletonEarningsLabel: {
    width: 100,
    height: 14,
    backgroundColor: '#cbd5e1',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonEarningsAmount: {
    width: 120,
    height: 32,
    backgroundColor: '#cbd5e1',
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonEarningsPeriod: {
    width: 150,
    height: 16,
    backgroundColor: '#cbd5e1',
    borderRadius: 4,
  },
  skeletonProgressBar: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    marginTop: 12,
  },
  skeletonResourceCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
  },
  skeletonResourceTitle: {
    width: 120,
    height: 20,
    backgroundColor: '#cbd5e1',
    borderRadius: 4,
    marginBottom: 12,
  },
  skeletonResourceItem: {
    height: 40,
    backgroundColor: '#cbd5e1',
    borderRadius: 6,
    marginBottom: 8,
  },
});

export default AgentDashboard;