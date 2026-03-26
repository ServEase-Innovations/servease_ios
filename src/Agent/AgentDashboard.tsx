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
  RefreshControl,
} from 'react-native';
import providerInstance from '../services/providerInstance';
import { useTheme } from '../../src/Settings/ThemeContext';
import { useAuth0 } from "react-native-auth0";
import { useAppUser } from "../context/AppUserContext";
import { useTranslation } from 'react-i18next';

// --- Data Types ---
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

interface VendorData {
  vendorId: string;
  address: string;
  companyName: string;
  createdDate: string;
  emailid: string;
  isActive: boolean;
  phoneNo: string;
  registrationId: string;
  serviceProviders: ServiceProvider[];
  providers: ServiceProviderDetails[];
}

interface ServiceProvider {
  serviceproviderid: string;
  firstName: string;
  lastName: string;
  mobileNo: string;
  emailId: string;
  housekeepingRole: string;
  experience: number;
}

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

type ViewType = 'dashboard' | 'all-providers' | 'applications' | 'register';

const { width } = Dimensions.get('window');

const AgentDashboard: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  const { t } = useTranslation();
  const { user: auth0User } = useAuth0();
  const { appUser } = useAppUser();
  const isAuthenticated = !!auth0User;
  
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [providers, setProviders] = useState<ProviderData[]>([]);
  const [vendorData, setVendorData] = useState<VendorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  const vendorId = appUser?.vendorId ? Number(appUser.vendorId) : null;

  // Fetch vendor data on component mount
  useEffect(() => {
    fetchVendorData();
  }, [vendorId, isAuthenticated]);

  const fetchVendorData = async () => {
    if (!vendorId || !isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await providerInstance.get(`/api/vendor/${vendorId}`);
      
      if (response.data?.status === 200 && response.data?.data) {
        const vendorDataResponse = response.data.data;
        setVendorData(vendorDataResponse);
        
        // Transform service providers to the format needed for the grid
        const transformedProviders = transformProvidersData(vendorDataResponse.providers || []);
        setProviders(transformedProviders);
        setError(null);
      } else {
        setError(t('fetchFailed') || 'Failed to fetch vendor data');
      }
    } catch (err) {
      console.error("Error fetching vendor data:", err);
      setError(t('unableToLoad') || 'Unable to load provider data');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchVendorData();
  };

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
      'NANNY': t('caregiver') || 'Caregiver',
      'COOK': t('cook') || 'Cook',
      'CLEANING': t('cleaning') || 'Cleaning',
      'MAID': t('maidCleaning') || 'Maid / Cleaning'
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
    const cooks = providers.filter(p => p.type === (t('cook') || 'Cook')).length;
    const cleaning = providers.filter(p => p.type === (t('cleaning') || 'Cleaning') || p.type === (t('maidCleaning') || 'Maid / Cleaning')).length;
    const caregivers = providers.filter(p => p.type === (t('caregiver') || 'Caregiver')).length;
    
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
    if (currentView === 'applications') return t('pendingApplications') || "Pending Applications";
    if (currentView === 'all-providers') return t('allAgencyProviders') || "All Agency Providers";
    return t('recentRegistrations') || "Recent Registrations & Status";
  };

  const handleViewProfile = (provider: ProviderData) => {
    Alert.alert(
      t('providerDetails') || 'Provider Details',
      `${t('provider') || 'Provider'}: ${provider.providerName}\n${t('type') || 'Type'}: ${provider.type}\n${t('mobileNumber') || 'Mobile Number'}: ${provider.mobileNo || 'N/A'}\n${t('email') || 'Email'}: ${provider.emailId || 'N/A'}\n${t('experience') || 'Experience'}: ${provider.experience || 0} ${t('years') || 'years'}\n${t('rating') || 'Rating'}: ${provider.rating || 0}/5`
    );
  };

  const renderProviderTable = () => {
    const data = currentView === 'applications' 
      ? providers.filter(p => p.status !== 'Active') 
      : providers;

    if (data.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyStateText}>{t('noProvidersFound') || 'No providers found'}</Text>
        </View>
      );
    }

    return (
      <View style={styles.tableContainer}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableHeaderCell, { flex: 1.5 }]}>{t('providerName') || 'Provider Name'}</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>{t('type') || 'Type'}</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>{t('dateRegistered') || 'Date Registered'}</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>{t('status') || 'Status'}</Text>
          <Text style={[styles.tableHeaderCell, { flex: 1 }]}>{t('action') || 'Action'}</Text>
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
                onPress={() => handleViewProfile(item)}
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
          { label: t('cooks') || 'Cooks', count: `${stats.cooks} ${t('active') || 'Active'}`, icon: '👨‍🍳' },
          { label: t('cleaningHelp') || 'Cleaning Help', count: `${stats.cleaning} ${t('active') || 'Active'}`, icon: '🧹' },
          { label: t('caregivers') || 'Caregivers', count: `${stats.caregivers} ${t('active') || 'Active'}`, icon: '❤️' }
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

  const renderWelcomeCard = () => {
    const displayName = appUser?.name || auth0User?.name || 'User';
    return (
      <View style={styles.welcomeCard}>
        <Text style={styles.welcomeTitle}>{t('welcome') || 'Welcome'}, {displayName}</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.registerButton}
            onPress={() => setCurrentView('register')}
          >
            <Text style={styles.registerButtonText}>+ {t('registerNewProvider') || 'Register New Provider'}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.applicationsButton}
            onPress={() => setCurrentView('applications')}
          >
            <Text style={styles.applicationsButtonText}>{t('viewApplications') || 'View Applications'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSidebar = () => {
    const stats = getProviderStats();
    return (
      <View style={styles.sidebar}>
        <View style={styles.earningsCard}>
          <Text style={styles.earningsLabel}>{t('totalProviders') || 'Total Providers'}</Text>
          <Text style={styles.earningsAmount}>{providers.length}</Text>
          <Text style={styles.earningsPeriod}>
            {stats.totalActive} {t('activeProviders') || 'Active Providers'}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(stats.totalActive / (providers.length || 1)) * 100}%` }]} />
          </View>
        </View>

        <View style={styles.resourceCard}>
          <Text style={styles.resourceTitle}>{t('resourceCenter') || 'Resource Center'}</Text>
          <View style={styles.resourceItems}>
            <TouchableOpacity style={styles.resourceItem}>
              <Text style={styles.resourceItemText}>{t('verifyIds') || 'How to verify IDs'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resourceItem}>
              <Text style={styles.resourceItemText}>{t('manageExpectations') || 'Managing client expectations'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resourceItem}>
              <Text style={styles.resourceItemText}>{t('payoutCycle') || 'Earnings payout cycle'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderRegisterForm = () => (
    <View style={styles.registerForm}>
      <Text style={styles.registerFormTitle}>{t('registerNewProvider') || 'Register New Provider'}</Text>
      <Text style={styles.registerFormSubtitle}>
        {t('enterProviderDetails') || 'Enter the details of the service provider to begin onboarding.'}
      </Text>
      
      <View style={styles.formFields}>
        <TextInput 
          placeholder={t('fullName') || 'Full Name'} 
          style={styles.input}
          placeholderTextColor="#94a3b8"
        />
        <View style={styles.pickerContainer}>
          <TextInput 
            placeholder={t('selectServiceType') || 'Select Service Type'}
            style={styles.input}
            placeholderTextColor="#94a3b8"
            editable={false}
            value={t('selectServiceType') || 'Select Service Type'}
          />
        </View>
        <TextInput 
          placeholder={t('phoneNumber') || 'Phone Number'} 
          style={styles.input}
          placeholderTextColor="#94a3b8"
          keyboardType="phone-pad"
        />
        
        <View style={styles.formButtons}>
          <TouchableOpacity style={styles.submitButton}>
            <Text style={styles.submitButtonText}>{t('submitDetails') || 'Submit Details'}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => setCurrentView('dashboard')}
          >
            <Text style={styles.cancelButtonText}>{t('cancel') || 'Cancel'}</Text>
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

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
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
          <Text style={styles.errorText}>⚠️ {t('error') || 'Error'}: {error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setIsLoading(true);
              setError(null);
              fetchVendorData();
            }}
          >
            <Text style={styles.retryButtonText}>{t('tryAgain') || 'Try Again'}</Text>
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
            <Text style={[styles.navLink, currentView === 'dashboard' && styles.navLinkActive]}>
              {t('dashboard') || 'Dashboard'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setCurrentView('all-providers')}>
            <Text style={[styles.navLink, currentView === 'all-providers' && styles.navLinkActive]}>
              {t('myProviders') || 'My Providers'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.navLink}>{t('recruitmentFeed') || 'Recruitment Feed'}</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.navLink}>{t('earnings') || 'Earnings'}</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.navRight}>
          <View style={styles.locationBadge}>
            <Text style={styles.locationText}>
              📍 {vendorData?.address || (t('locationNotSet') || 'Location not set')}
            </Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.notificationIcon}>🔔</Text>
          </TouchableOpacity>
          <View style={styles.agentBadge}>
            <Text style={styles.agentText}>👤 {t('agent') || 'Agent'}</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.pageTitle}>
          {currentView === 'dashboard' 
            ? (t('providerManagementDashboard') || "Provider Management Dashboard") 
            : (currentView.replace('-', ' ').toUpperCase())}
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
                    <Text style={styles.viewAllLink}>{t('viewFullList') || 'View Full List'} →</Text>
                  </TouchableOpacity>
                )}
                {currentView !== 'dashboard' && (
                  <TouchableOpacity onPress={() => setCurrentView('dashboard')}>
                    <Text style={styles.backLink}>← {t('backToDashboard') || 'Back to Dashboard'}</Text>
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