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
        setError(t('errors.fetchFailed') || t('errors.generic'));
      }
    } catch (err) {
      console.error("Error fetching vendor data:", err);
      setError(t('errors.unableToLoad'));
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
      status: provider.isactive ? t('common.active') : t('common.inactive'),
      action: t('profile.page.viewProfile'),
      mobileNo: provider.mobileNo,
      emailId: provider.emailId,
      experience: provider.experience,
      rating: provider.rating
    }));
  };

  // Format provider type for display
  const formatProviderType = (role: string): string => {
    const typeMap: { [key: string]: string } = {
      'NANNY': t('profile.page.caregiver'),
      'COOK': t('profile.page.cook'),
      'CLEANING': t('common.cleaning'),
      'MAID': t('profile.page.maid')
    };
    return typeMap[role] || role;
  };

  // Format date for display
  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return t('common.na');
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate stats based on actual data
  const getProviderStats = () => {
    const activeProviders = providers.filter(p => p.status === t('common.active'));
    const cooks = providers.filter(p => p.type === t('profile.page.cook')).length;
    const cleaning = providers.filter(p => p.type === t('common.cleaning') || p.type === t('profile.page.maid')).length;
    const caregivers = providers.filter(p => p.type === t('profile.page.caregiver')).length;
    
    return {
      totalActive: activeProviders.length,
      cooks,
      cleaning,
      caregivers
    };
  };

  const getStatusColor = (status: string): string => {
    if (status === t('common.active')) return '#16a34a';
    if (status === t('common.inactive')) return '#dc2626';
    return '#ca8a04';
  };

  const getTableTitle = (): string => {
    if (currentView === 'applications') return t('agent.pendingApplications');
    if (currentView === 'all-providers') return t('agent.allAgencyProviders');
    return t('agent.recentRegistrations');
  };

  const handleViewProfile = (provider: ProviderData) => {
    Alert.alert(
      t('agent.providerDetails'),
      `${t('agent.provider')}: ${provider.providerName}\n${t('agent.type')}: ${provider.type}\n${t('common.mobileNumber')}: ${provider.mobileNo || t('common.na')}\n${t('common.email')}: ${provider.emailId || t('common.na')}\n${t('common.experience')}: ${provider.experience || 0} ${t('common.years')}\n${t('common.rating')}: ${provider.rating || 0}/5`
    );
  };

  const renderProviderTable = () => {
    const data = currentView === 'applications' 
      ? providers.filter(p => p.status !== t('common.active')) 
      : providers;

    if (data.length === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
            {t('agent.noProvidersFound')}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.tableContainer}>
        <View style={[styles.tableHeader, { backgroundColor: colors.surface }]}>
          <Text style={[styles.tableHeaderCell, { color: colors.text, flex: 1.5 }]}>
            {t('agent.providerName')}
          </Text>
          <Text style={[styles.tableHeaderCell, { color: colors.text, flex: 1 }]}>
            {t('agent.type')}
          </Text>
          <Text style={[styles.tableHeaderCell, { color: colors.text, flex: 1.2 }]}>
            {t('agent.dateRegistered')}
          </Text>
          <Text style={[styles.tableHeaderCell, { color: colors.text, flex: 1.2 }]}>
            {t('common.status')}
          </Text>
          <Text style={[styles.tableHeaderCell, { color: colors.text, flex: 1 }]}>
            {t('agent.action')}
          </Text>
        </View>
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={[styles.tableRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.tableCell, { color: colors.text, flex: 1.5 }]} numberOfLines={1}>
                {item.providerName}
              </Text>
              <Text style={[styles.tableCell, { color: colors.text, flex: 1 }]} numberOfLines={1}>
                {item.type}
              </Text>
              <Text style={[styles.tableCell, { color: colors.text, flex: 1.2 }]} numberOfLines={1}>
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
                <Text style={[styles.tableCell, styles.actionText, { color: colors.primary }]}>
                  {item.action}
                </Text>
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
          { label: t('agent.cooks'), count: `${stats.cooks} ${t('common.active')}`, icon: '👨‍🍳' },
          { label: t('common.cleaning'), count: `${stats.cleaning} ${t('common.active')}`, icon: '🧹' },
          { label: t('agent.caregivers'), count: `${stats.caregivers} ${t('common.active')}`, icon: '❤️' }
        ].map((card, i) => (
          <View key={i} style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <Text style={styles.statIcon}>{card.icon}</Text>
            <View>
              <Text style={[styles.statLabel, { color: colors.text }]}>{card.label}</Text>
              <Text style={[styles.statCount, { color: colors.textSecondary }]}>{card.count}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderWelcomeCard = () => {
    const displayName = appUser?.name || auth0User?.name || t('common.user');
    const stats = getProviderStats();
    return (
      <View style={[styles.welcomeCard, { backgroundColor: colors.card }]}>
        <Text style={[styles.welcomeTitle, { color: colors.text }]}>
          {t('common.welcome')}, {displayName}
        </Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.registerButton, { backgroundColor: colors.primary }]}
            onPress={() => setCurrentView('register')}
          >
            <Text style={[styles.registerButtonText, { color: '#fff' }]}>
              + {t('agent.registerNewProvider')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.applicationsButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setCurrentView('applications')}
          >
            <Text style={[styles.applicationsButtonText, { color: colors.text }]}>
              {t('agent.viewApplications')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSidebar = () => {
    const stats = getProviderStats();
    return (
      <View style={styles.sidebar}>
        <View style={[styles.earningsCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.earningsLabel, { color: colors.textSecondary }]}>
            {t('agent.totalProviders')}
          </Text>
          <Text style={[styles.earningsAmount, { color: colors.text }]}>{providers.length}</Text>
          <Text style={[styles.earningsPeriod, { color: colors.textSecondary }]}>
            {stats.totalActive} {t('agent.activeProviders')}
          </Text>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${(stats.totalActive / (providers.length || 1)) * 100}%` }]} />
          </View>
        </View>

        <View style={[styles.resourceCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.resourceTitle, { color: colors.text }]}>
            {t('agent.resourceCenter')}
          </Text>
          <View style={styles.resourceItems}>
            <TouchableOpacity style={[styles.resourceItem, { backgroundColor: colors.surface, borderLeftColor: colors.primary }]}>
              <Text style={[styles.resourceItemText, { color: colors.primary }]}>
                {t('agent.verifyIds')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.resourceItem, { backgroundColor: colors.surface, borderLeftColor: colors.primary }]}>
              <Text style={[styles.resourceItemText, { color: colors.primary }]}>
                {t('agent.manageExpectations')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.resourceItem, { backgroundColor: colors.surface, borderLeftColor: colors.primary }]}>
              <Text style={[styles.resourceItemText, { color: colors.primary }]}>
                {t('agent.payoutCycle')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderRegisterForm = () => (
    <View style={[styles.registerForm, { backgroundColor: colors.card }]}>
      <Text style={[styles.registerFormTitle, { color: colors.text }]}>
        {t('agent.registerNewProvider')}
      </Text>
      <Text style={[styles.registerFormSubtitle, { color: colors.textSecondary }]}>
        {t('agent.enterProviderDetails')}
      </Text>
      
      <View style={styles.formFields}>
        <TextInput 
          placeholder={t('common.fullName')} 
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          placeholderTextColor={colors.placeholder}
        />
        <View style={styles.pickerContainer}>
          <TextInput 
            placeholder={t('agent.selectServiceType')}
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            placeholderTextColor={colors.placeholder}
            editable={false}
            value={t('agent.selectServiceType')}
          />
        </View>
        <TextInput 
          placeholder={t('common.phoneNumber')} 
          style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
          placeholderTextColor={colors.placeholder}
          keyboardType="phone-pad"
        />
        
        <View style={styles.formButtons}>
          <TouchableOpacity style={[styles.submitButton, { backgroundColor: colors.primary }]}>
            <Text style={[styles.submitButtonText, { color: '#fff' }]}>
              {t('agent.submitDetails')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.cancelButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setCurrentView('dashboard')}
          >
            <Text style={[styles.cancelButtonText, { color: colors.text }]}>
              {t('common.cancel')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Show loading state with skeleton loaders
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar backgroundColor="#001F3F" barStyle="light-content" />
        
        {/* Navbar Skeleton */}
        <View style={[styles.navbar, { backgroundColor: colors.primary }]}>
          <View style={[styles.skeletonLogo, { backgroundColor: colors.surface }]} />
          <View style={styles.skeletonNavLinks}>
            <View style={[styles.skeletonNavLink, { backgroundColor: colors.surface }]} />
            <View style={[styles.skeletonNavLink, { backgroundColor: colors.surface }]} />
            <View style={[styles.skeletonNavLink, { backgroundColor: colors.surface }]} />
            <View style={[styles.skeletonNavLink, { backgroundColor: colors.surface }]} />
          </View>
          <View style={styles.navRight}>
            <View style={[styles.skeletonLocationBadge, { backgroundColor: colors.surface }]} />
            <View style={[styles.skeletonNotification, { backgroundColor: colors.surface }]} />
            <View style={[styles.skeletonAgentBadge, { backgroundColor: colors.surface }]} />
          </View>
        </View>

        <ScrollView 
          style={[styles.content, { backgroundColor: colors.background }]} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Title Skeleton */}
          <View style={[styles.skeletonTitle, { backgroundColor: colors.surface }]} />
          
          {/* Welcome Card Skeleton */}
          <View style={[styles.skeletonWelcomeCard, { backgroundColor: colors.card }]}>
            <View style={[styles.skeletonWelcomeTitle, { backgroundColor: colors.surface }]} />
            <View style={styles.skeletonButtonGroup}>
              <View style={[styles.skeletonButton, { backgroundColor: colors.surface }]} />
              <View style={[styles.skeletonButtonSecondary, { backgroundColor: colors.surface }]} />
            </View>
          </View>

          {/* Stats Grid Skeleton */}
          <View style={styles.statsContainer}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={[styles.skeletonStatCard, { backgroundColor: colors.surface }]}>
                <View style={[styles.skeletonStatIcon, { backgroundColor: colors.border }]} />
                <View>
                  <View style={[styles.skeletonStatLabel, { backgroundColor: colors.border }]} />
                  <View style={[styles.skeletonStatCount, { backgroundColor: colors.border }]} />
                </View>
              </View>
            ))}
          </View>

          {/* Main Content Skeleton */}
          <View style={styles.mainContent}>
            <View style={[styles.skeletonTableWrapper, { backgroundColor: colors.card }]}>
              <View style={styles.skeletonTableHeader}>
                <View style={[styles.skeletonTableTitle, { backgroundColor: colors.surface }]} />
                <View style={[styles.skeletonViewAllLink, { backgroundColor: colors.surface }]} />
              </View>
              <View style={styles.tableContainer}>
                <View style={[styles.tableHeader, { backgroundColor: colors.surface }]}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <View key={i} style={[styles.skeletonTableCell, { backgroundColor: colors.border, flex: i === 0 ? 1.5 : i === 1 ? 1 : i === 2 ? 1.2 : i === 3 ? 1.2 : 1 }]} />
                  ))}
                </View>
                {[1, 2, 3, 4].map((i) => (
                  <View key={i} style={[styles.skeletonTableRow, { borderBottomColor: colors.border }]}>
                    {[1, 2, 3, 4, 5].map((j) => (
                      <View key={j} style={[styles.skeletonTableRowCell, { backgroundColor: colors.border, flex: j === 0 ? 1.5 : j === 1 ? 1 : j === 2 ? 1.2 : j === 3 ? 1.2 : 1 }]} />
                    ))}
                  </View>
                ))}
              </View>
            </View>

            {/* Sidebar Skeleton */}
            <View style={styles.sidebar}>
              <View style={[styles.skeletonEarningsCard, { backgroundColor: colors.surface }]}>
                <View style={[styles.skeletonEarningsLabel, { backgroundColor: colors.border }]} />
                <View style={[styles.skeletonEarningsAmount, { backgroundColor: colors.border }]} />
                <View style={[styles.skeletonEarningsPeriod, { backgroundColor: colors.border }]} />
                <View style={[styles.skeletonProgressBar, { backgroundColor: colors.border }]} />
              </View>
              <View style={[styles.skeletonResourceCard, { backgroundColor: colors.surface }]}>
                <View style={[styles.skeletonResourceTitle, { backgroundColor: colors.border }]} />
                {[1, 2, 3].map((i) => (
                  <View key={i} style={[styles.skeletonResourceItem, { backgroundColor: colors.border }]} />
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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error }]}>⚠️ {t('common.error')}: {error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={() => {
              setIsLoading(true);
              setError(null);
              fetchVendorData();
            }}
          >
            <Text style={[styles.retryButtonText, { color: '#fff' }]}>{t('common.retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const stats = getProviderStats();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar backgroundColor="#001F3F" barStyle="light-content" />
      
      {/* Navbar */}
      <View style={[styles.navbar, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => setCurrentView('dashboard')}>
          <Text style={[styles.logo, { color: '#fff' }]}>{vendorData?.companyName || 'SERVEASO'}</Text>
        </TouchableOpacity>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.navLinks}>
          <TouchableOpacity onPress={() => setCurrentView('dashboard')}>
            <Text style={[styles.navLink, { color: '#fff' }, currentView === 'dashboard' && styles.navLinkActive]}>
              {t('common.dashboard')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setCurrentView('all-providers')}>
            <Text style={[styles.navLink, { color: '#fff' }, currentView === 'all-providers' && styles.navLinkActive]}>
              {t('agent.myProviders')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={[styles.navLink, { color: '#fff' }]}>
              {t('agent.recruitmentFeed')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={[styles.navLink, { color: '#fff' }]}>
              {t('common.earnings')}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.navRight}>
          <View style={[styles.locationBadge, { backgroundColor: '#fff' }]}>
            <Text style={[styles.locationText, { color: colors.textSecondary }]}>
              📍 {vendorData?.address || t('common.locationNotSet')}
            </Text>
          </View>
          <TouchableOpacity>
            <Text style={styles.notificationIcon}>🔔</Text>
          </TouchableOpacity>
          <View style={[styles.agentBadge, { backgroundColor: '#fff' }]}>
            <Text style={[styles.agentText, { color: colors.primary }]}>👤 {t('common.agent')}</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={[styles.content, { backgroundColor: colors.background }]} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Text style={[styles.pageTitle, { color: colors.text }]}>
          {currentView === 'dashboard' 
            ? t('agent.providerManagementDashboard')
            : currentView.replace('-', ' ').toUpperCase()}
        </Text>

        {currentView !== 'register' && renderWelcomeCard()}

        {currentView === 'dashboard' && renderStatsCards()}

        {currentView === 'register' ? (
          renderRegisterForm()
        ) : (
          <View style={styles.mainContent}>
            <View style={[styles.tableWrapper, currentView !== 'dashboard' && styles.fullWidth, { backgroundColor: colors.card }]}>
              <View style={styles.tableHeaderContainer}>
                <Text style={[styles.tableTitle, { color: colors.text }]}>{getTableTitle()}</Text>
                {currentView === 'dashboard' && (
                  <TouchableOpacity onPress={() => setCurrentView('all-providers')}>
                    <Text style={[styles.viewAllLink, { color: colors.primary }]}>{t('agent.viewFullList')} →</Text>
                  </TouchableOpacity>
                )}
                {currentView !== 'dashboard' && (
                  <TouchableOpacity onPress={() => setCurrentView('dashboard')}>
                    <Text style={[styles.backLink, { color: colors.textSecondary }]}>← {t('agent.backToDashboard')}</Text>
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
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  locationText: {
    fontSize: 11,
  },
  notificationIcon: {
    fontSize: 18,
    color: 'white',
  },
  agentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  agentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 20,
    textTransform: 'capitalize',
  },
  welcomeCard: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  welcomeTitle: {
    fontSize: 22,
    marginBottom: 15,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  registerButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  registerButtonText: {
    fontWeight: '600',
    fontSize: 14,
  },
  applicationsButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
  },
  applicationsButtonText: {
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
  },
  statCount: {
    fontSize: 13,
  },
  mainContent: {
    flexDirection: 'row',
    gap: 20,
    flexWrap: 'wrap',
  },
  tableWrapper: {
    flex: 2,
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
  },
  viewAllLink: {
    fontWeight: '600',
    fontSize: 13,
  },
  backLink: {
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
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 2,
  },
  tableHeaderCell: {
    fontWeight: '700',
    fontSize: 13,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
  },
  tableCell: {
    fontSize: 13,
  },
  actionText: {
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
    borderRadius: 15,
    padding: 20,
    borderWidth: 1,
    borderColor: 'white',
  },
  earningsLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  earningsAmount: {
    fontSize: 28,
    fontWeight: '800',
  },
  earningsPeriod: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 4,
  },
  progressBar: {
    height: 6,
    borderRadius: 10,
    marginTop: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 10,
  },
  resourceCard: {
    borderRadius: 15,
    padding: 20,
  },
  resourceTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  resourceItems: {
    gap: 10,
  },
  resourceItem: {
    padding: 10,
    borderRadius: 6,
    borderLeftWidth: 4,
  },
  resourceItemText: {
    fontSize: 13,
  },
  registerForm: {
    padding: 25,
    borderRadius: 15,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  registerFormTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  registerFormSubtitle: {
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
    fontSize: 14,
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
    alignItems: 'center',
  },
  submitButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
  },
  emptyStateContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
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
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontWeight: '600',
  },
  // Skeleton styles
  skeletonLogo: {
    width: 100,
    height: 24,
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
    borderRadius: 4,
  },
  skeletonLocationBadge: {
    width: 120,
    height: 28,
    borderRadius: 20,
  },
  skeletonNotification: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  skeletonAgentBadge: {
    width: 60,
    height: 28,
    borderRadius: 20,
  },
  skeletonTitle: {
    width: 250,
    height: 32,
    borderRadius: 6,
    marginBottom: 20,
  },
  skeletonWelcomeCard: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  skeletonWelcomeTitle: {
    width: 200,
    height: 28,
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
    borderRadius: 30,
  },
  skeletonButtonSecondary: {
    width: 140,
    height: 40,
    borderRadius: 30,
  },
  skeletonStatCard: {
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
    borderRadius: 20,
  },
  skeletonStatLabel: {
    width: 100,
    height: 18,
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonStatCount: {
    width: 80,
    height: 16,
    borderRadius: 4,
  },
  skeletonTableWrapper: {
    flex: 2,
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
    borderRadius: 4,
  },
  skeletonViewAllLink: {
    width: 100,
    height: 20,
    borderRadius: 4,
  },
  skeletonTableCell: {
    height: 16,
    borderRadius: 4,
    marginHorizontal: 8,
  },
  skeletonTableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  skeletonTableRowCell: {
    height: 16,
    borderRadius: 4,
    marginHorizontal: 8,
  },
  skeletonEarningsCard: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
  },
  skeletonEarningsLabel: {
    width: 100,
    height: 14,
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonEarningsAmount: {
    width: 120,
    height: 32,
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonEarningsPeriod: {
    width: 150,
    height: 16,
    borderRadius: 4,
  },
  skeletonProgressBar: {
    height: 6,
    borderRadius: 10,
    marginTop: 12,
  },
  skeletonResourceCard: {
    borderRadius: 15,
    padding: 20,
  },
  skeletonResourceTitle: {
    width: 120,
    height: 20,
    borderRadius: 4,
    marginBottom: 12,
  },
  skeletonResourceItem: {
    height: 40,
    borderRadius: 6,
    marginBottom: 8,
  },
});

export default AgentDashboard;