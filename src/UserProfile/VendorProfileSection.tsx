// VendorProfileSection.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth0 } from 'react-native-auth0';
import { useAppUser } from '../context/AppUserContext';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import providerInstance from '../services/providerInstance';
import { useTheme } from '../../src/Settings/ThemeContext';

const { width } = Dimensions.get('window');

interface VendorProfileSectionProps {
  userId: number | null;
  userEmail: string | null;
  onBack?: () => void;
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
  providers: any[];
}

const VendorProfileSection: React.FC<VendorProfileSectionProps> = ({
  userId,
  userEmail,
  onBack,
}) => {
  const { t } = useTranslation();
  const { user: auth0User } = useAuth0();
  const { appUser } = useAppUser();
  const { colors, fontSize, isDarkMode } = useTheme();

  const [vendorData, setVendorData] = useState<VendorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getFontSizes = () => {
    switch (fontSize) {
      case 'small':
        return {
          title: 24,
          heading: 18,
          subheading: 16,
          body: 14,
          caption: 12,
          button: 14,
        };
      case 'large':
        return {
          title: 30,
          heading: 22,
          subheading: 20,
          body: 18,
          caption: 16,
          button: 18,
        };
      default:
        return {
          title: 26,
          heading: 20,
          subheading: 18,
          body: 16,
          caption: 14,
          button: 16,
        };
    }
  };

  const fontSizes = getFontSizes();

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
          setVendorData(response.data.data);
          setError(null);
        } else {
          setError(t('profile.page.fetchFailed'));
        }
      } catch (err) {
        console.error('Error fetching vendor data:', err);
        setError(t('profile.page.unableToLoad'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchVendorData();
  }, [userId, t]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleManageProviders = () => {
    Alert.alert(t('common.info'), t('profile.page.manageProvidersComingSoon'));
  };

  const handleViewAnalytics = () => {
    Alert.alert(t('common.info'), t('profile.page.analyticsComingSoon'));
  };

  const handleEditProfile = () => {
    Alert.alert(t('common.info'), t('profile.page.editProfileComingSoon'));
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.mainContent}>
            <View style={[styles.skeletonCard, { backgroundColor: colors.card }]}>
              <View style={styles.skeletonHeader}>
                <View style={[styles.skeletonTitle, { backgroundColor: colors.surface }]} />
              </View>
              <View style={styles.skeletonGrid}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <View key={i} style={styles.skeletonItem}>
                    <View style={[styles.skeletonLabel, { backgroundColor: colors.surface }]} />
                    <View style={[styles.skeletonValue, { backgroundColor: colors.surface }]} />
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  if (error || !vendorData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.mainContent}>
            <View style={[styles.errorCard, { backgroundColor: colors.card }]}>
              <MaterialCommunityIcons
                name="office-building"
                size={64}
                color={colors.textSecondary}
              />
              <Text style={[styles.errorTitle, { color: colors.text, fontSize: fontSizes.heading }]}>
                {t('profile.page.vendorInfoUnavailable')}
              </Text>
              <Text style={[styles.errorMessage, { color: colors.textSecondary, fontSize: fontSizes.body }]}>
                {error || t('profile.page.unableToLoadVendorDetails')}
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.mainContent}>
          {/* Header Card - Company Header with Registration ID */}
          <LinearGradient
            colors={[colors.primary, colors.secondary || '#1e3a8a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerCard}
          >
            <View style={styles.headerContent}>
              <View style={[styles.iconContainer, { backgroundColor: colors.infoLight + '40' }]}>
                <MaterialCommunityIcons name="office-building" size={40} color="#fff" />
              </View>
              <View style={styles.headerTextContainer}>
                <Text style={[styles.companyName, { color: '#fff', fontSize: fontSizes.title }]}>
                  {vendorData.companyName}
                </Text>
                <View style={styles.registrationContainer}>
                  <Text style={[styles.registrationLabel, { color: colors.text, fontSize: fontSizes.caption }]}>
                    {t('profile.page.registrationId')}:
                  </Text>
                  <View style={[styles.registrationBadge, { backgroundColor: colors.secondary + '80' }]}>
                    <Text style={[styles.registrationValue, { color: '#fff', fontSize: fontSizes.caption }]}>
                      {vendorData.registrationId}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: vendorData.isActive
                        ? colors.success + '20'
                        : colors.error + '20',
                    },
                  ]}
                >
                  {vendorData.isActive ? (
                    <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
                  ) : (
                    <MaterialCommunityIcons name="close-circle" size={16} color={colors.error} />
                  )}
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: vendorData.isActive ? colors.success : colors.error,
                        fontSize: fontSizes.caption,
                      },
                    ]}
                  >
                    {vendorData.isActive ? t('profile.page.active') : t('profile.page.inactive')}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Main Content Grid */}
          <View style={styles.contentGrid}>
            {/* Left Column - Company Details */}
            <View style={styles.leftColumn}>
              {/* Contact Information */}
              <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="office-building" size={20} color={colors.primary} />
                  <Text style={[styles.cardTitle, { color: colors.text, fontSize: fontSizes.heading }]}>
                    {t('profile.page.contactInformation')}
                  </Text>
                </View>
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <View style={styles.infoLabelContainer}>
                      <MaterialCommunityIcons name="email" size={16} color={colors.textSecondary} />
                      <Text style={[styles.infoLabel, { color: colors.textSecondary, fontSize: fontSizes.caption }]}>
                        {t('profile.page.emailAddress')}
                      </Text>
                    </View>
                    <Text style={[styles.infoValue, { color: colors.text, fontSize: fontSizes.body }]}>
                      {vendorData.emailid}
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <View style={styles.infoLabelContainer}>
                      <MaterialCommunityIcons name="phone" size={16} color={colors.textSecondary} />
                      <Text style={[styles.infoLabel, { color: colors.textSecondary, fontSize: fontSizes.caption }]}>
                        {t('profile.page.phoneNumber')}
                      </Text>
                    </View>
                    <Text style={[styles.infoValue, { color: colors.text, fontSize: fontSizes.body }]}>
                      {vendorData.phoneNo || t('profile.page.notProvided')}
                    </Text>
                  </View>
                  <View style={[styles.infoItem, styles.fullWidth]}>
                    <View style={styles.infoLabelContainer}>
                      <MaterialCommunityIcons name="map-marker" size={16} color={colors.textSecondary} />
                      <Text style={[styles.infoLabel, { color: colors.textSecondary, fontSize: fontSizes.caption }]}>
                        {t('profile.page.businessAddress')}
                      </Text>
                    </View>
                    <Text style={[styles.infoValue, { color: colors.text, fontSize: fontSizes.body }]}>
                      {vendorData.address || t('profile.page.notProvided')}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Business Details */}
              <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                  <MaterialCommunityIcons name="office-building" size={20} color={colors.primary} />
                  <Text style={[styles.cardTitle, { color: colors.text, fontSize: fontSizes.heading }]}>
                    {t('profile.page.businessDetails')}
                  </Text>
                </View>
                <View style={styles.infoGrid}>
                  <View style={styles.infoItem}>
                    <View style={styles.infoLabelContainer}>
                      <MaterialCommunityIcons name="hash" size={16} color={colors.textSecondary} />
                      <Text style={[styles.infoLabel, { color: colors.textSecondary, fontSize: fontSizes.caption }]}>
                        {t('profile.page.vendorId')}
                      </Text>
                    </View>
                    <Text style={[styles.infoValue, { color: colors.text, fontSize: fontSizes.body, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>
                      {vendorData.vendorId}
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <View style={styles.infoLabelContainer}>
                      <MaterialCommunityIcons name="calendar" size={16} color={colors.textSecondary} />
                      <Text style={[styles.infoLabel, { color: colors.textSecondary, fontSize: fontSizes.caption }]}>
                        {t('profile.page.registeredSince')}
                      </Text>
                    </View>
                    <Text style={[styles.infoValue, { color: colors.text, fontSize: fontSizes.body }]}>
                      {formatDate(vendorData.createdDate)}
                    </Text>
                  </View>
                  <View style={styles.infoItem}>
                    <View style={styles.infoLabelContainer}>
                      <MaterialCommunityIcons name="account-group" size={16} color={colors.textSecondary} />
                      <Text style={[styles.infoLabel, { color: colors.textSecondary, fontSize: fontSizes.caption }]}>
                        {t('profile.page.associatedProviders')}
                      </Text>
                    </View>
                    <Text style={[styles.infoValue, { color: colors.text, fontSize: fontSizes.body }]}>
                      {vendorData.providers?.length || 0} {t('profile.page.providers')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Right Column - Sidebar */}
            <View style={styles.rightColumn}>
              {/* Quick Actions */}
              <View style={[styles.sidebarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.sidebarTitle, { color: colors.text, fontSize: fontSizes.subheading }]}>
                  {t('profile.page.quickActions')}
                </Text>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.primaryButton, { backgroundColor: colors.primary }]}
                    onPress={handleManageProviders}
                  >
                    <MaterialCommunityIcons name="account-group" size={18} color="#fff" />
                    <Text style={[styles.actionButtonText, { color: '#fff', fontSize: fontSizes.button }]}>
                      {t('profile.page.manageProviders')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.secondaryButton, { borderColor: colors.primary }]}
                    onPress={handleViewAnalytics}
                  >
                    <MaterialCommunityIcons name="chart-bar" size={18} color={colors.primary} />
                    <Text style={[styles.actionButtonText, { color: colors.primary, fontSize: fontSizes.button }]}>
                      {t('profile.page.viewAnalytics')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.outlineButton, { borderColor: colors.border }]}
                    onPress={handleEditProfile}
                  >
                    <MaterialCommunityIcons name="pencil" size={18} color={colors.textSecondary} />
                    <Text style={[styles.actionButtonText, { color: colors.textSecondary, fontSize: fontSizes.button }]}>
                      {t('profile.page.editProfile')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Status Summary */}
              <View style={[styles.sidebarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.sidebarTitle, { color: colors.text, fontSize: fontSizes.subheading }]}>
                  {t('profile.page.summary')}
                </Text>
                <View style={styles.summaryItems}>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary, fontSize: fontSizes.body }]}>
                      {t('profile.page.accountStatus')}
                    </Text>
                    <View
                      style={[
                        styles.summaryStatusBadge,
                        {
                          backgroundColor: vendorData.isActive
                            ? colors.success + '20'
                            : colors.error + '20',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.summaryStatusText,
                          {
                            color: vendorData.isActive ? colors.success : colors.error,
                            fontSize: fontSizes.caption,
                          },
                        ]}
                      >
                        {vendorData.isActive ? t('profile.page.active') : t('profile.page.inactive')}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary, fontSize: fontSizes.body }]}>
                      {t('profile.page.totalProviders')}
                    </Text>
                    <Text style={[styles.summaryValue, { color: colors.text, fontSize: fontSizes.body, fontWeight: 'bold' }]}>
                      {vendorData.providers?.length || 0}
                    </Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary, fontSize: fontSizes.body }]}>
                      {t('profile.page.registrationId')}
                    </Text>
                    <Text style={[styles.summaryValue, { color: colors.text, fontSize: fontSizes.caption, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]}>
                      {vendorData.registrationId}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    padding: 16,
  },
  headerCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
  },
  companyName: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  registrationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  registrationLabel: {
    fontWeight: '500',
  },
  registrationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  registrationValue: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '500',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    fontWeight: '500',
  },
  contentGrid: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    flexWrap: 'wrap',
    gap: 20,
  },
  leftColumn: {
    flex: Platform.OS === 'web' ? 2 : 1,
    gap: 20,
  },
  rightColumn: {
    flex: Platform.OS === 'web' ? 1 : 1,
    gap: 20,
  },
  infoCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: '600',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  infoItem: {
    flex: 1,
    minWidth: 200,
    gap: 4,
  },
  fullWidth: {
    minWidth: '100%',
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  infoLabel: {
    fontWeight: '500',
  },
  infoValue: {
    fontWeight: '500',
    marginLeft: 22,
  },
  sidebarCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sidebarTitle: {
    fontWeight: '600',
    marginBottom: 16,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: '#2563eb',
  },
  secondaryButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  outlineButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  actionButtonText: {
    fontWeight: '600',
  },
  summaryItems: {
    gap: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  summaryLabel: {
    fontWeight: '500',
  },
  summaryValue: {
    fontWeight: '600',
  },
  summaryStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  summaryStatusText: {
    fontWeight: '500',
  },
  errorCard: {
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  errorTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorMessage: {
    textAlign: 'center',
  },
  // Skeleton styles
  skeletonCard: {
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  skeletonHeader: {
    marginBottom: 20,
  },
  skeletonTitle: {
    width: 200,
    height: 28,
    borderRadius: 4,
  },
  skeletonGrid: {
    gap: 16,
  },
  skeletonItem: {
    gap: 8,
  },
  skeletonLabel: {
    width: 100,
    height: 16,
    borderRadius: 4,
  },
  skeletonValue: {
    width: '100%',
    height: 20,
    borderRadius: 4,
  },
});

export default VendorProfileSection;