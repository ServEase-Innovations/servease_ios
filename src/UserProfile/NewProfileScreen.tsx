// ProfileScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
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
import LinearGradient from 'react-native-linear-gradient';
import providerInstance from '../services/providerInstance';
import { useTheme } from '../../src/Settings/ThemeContext';

// Import sections
import CustomerProfileSection from './CustomerProfileSection';
import ServiceProviderProfileSection from './ServiceProviderProfileSection';
import VendorProfileSection from './VendorProfileSection';
import MobileNumberDialog from './MobileNumberDialog';

const { width } = Dimensions.get('window');

interface AppUser {
  name?: string;
  email?: string;
  picture?: string;
  role?: 'CUSTOMER' | 'SERVICE_PROVIDER' | 'VENDOR';
  customerid?: number;
  serviceProviderId?: number;
  vendorId?: number;
}

const ProfileScreen: React.FC = () => {
  const { t } = useTranslation();
  const { user: auth0User, isLoading: auth0Loading } = useAuth0();
  const { appUser } = useAppUser();
  const { colors, fontSize, isDarkMode } = useTheme();

  const [mobileDialogOpen, setMobileDialogOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [userRole, setUserRole] = useState<'CUSTOMER' | 'SERVICE_PROVIDER' | 'VENDOR'>('CUSTOMER');
  const [isLoading, setIsLoading] = useState(true);
  const [dialogShownInSession, setDialogShownInSession] = useState(false);
  const [hasMobileNumber, setHasMobileNumber] = useState<boolean | null>(null);

  // Get font sizes based on theme
  const getFontSizes = () => {
    switch (fontSize) {
      case 'small':
        return {
          title: 24,
          subtitle: 14,
          body: 12,
          button: 12,
        };
      case 'large':
        return {
          title: 32,
          subtitle: 18,
          body: 16,
          button: 16,
        };
      default:
        return {
          title: 28,
          subtitle: 16,
          body: 14,
          button: 14,
        };
    }
  };

  const fontSizes = getFontSizes();

  // Check mobile number for customers
  const checkMobileNumber = useCallback(async (customerId: number) => {
    try {
      const response = await providerInstance.get(`/api/customer/${customerId}`);
      const mobileExists = !!response.data?.data?.mobileno;
      setHasMobileNumber(mobileExists);

      if (!mobileExists && !dialogShownInSession) {
        setTimeout(() => {
          setMobileDialogOpen(true);
          setDialogShownInSession(true);
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to fetch customer data:', error);
    }
  }, [dialogShownInSession]);

  useEffect(() => {
    const initializeProfile = async () => {
      setIsLoading(true);

      if (appUser) {
        const name = appUser.name || null;
        const email = appUser.email || auth0User?.email || null;
        const role = appUser.role || 'CUSTOMER';

        setUserRole(role);
        setUserName(name);
        setUserEmail(email);

        let id = null;
        if (role === 'SERVICE_PROVIDER') {
          id = appUser.serviceProviderId;
        } else if (role === 'CUSTOMER') {
          id = appUser.customerid;
        } else if (role === 'VENDOR') {
          id = appUser.vendorId;
        }

        const numericId = id ? Number(id) : null;
        setUserId(numericId);

        if (role === 'CUSTOMER' && numericId) {
          await checkMobileNumber(numericId);
        } else if (role === 'SERVICE_PROVIDER' || role === 'VENDOR') {
          setHasMobileNumber(true);
        }
      }

      setIsLoading(false);
    };

    initializeProfile();
  }, [appUser, auth0User?.email, checkMobileNumber]);

  const getRoleDisplay = () => {
    switch (userRole) {
      case 'CUSTOMER':
        return t('profile.page.customer');
      case 'SERVICE_PROVIDER':
        return t('profile.page.serviceProvider');
      case 'VENDOR':
        return t('profile.page.vendor');
      default:
        return t('profile.page.user');
    }
  };

  const getAvatarSource = () => {
    const pictureUri = appUser?.picture || auth0User?.picture;
    if (pictureUri) {
      return { uri: pictureUri };
    }
    // Default avatar - you can use a local image or a placeholder
    // return require('../assets/default-avatar.png');
  };

  const getUserInitial = () => {
    const name = userName || t('profile.page.user');
    return name.charAt(0).toUpperCase();
  };

  const getAvatarBackgroundColor = (initial: string) => {
    const colorsList = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'];
    const charCode = initial.charCodeAt(0);
    return colorsList[charCode % colorsList.length];
  };

  // Loading skeleton for the entire profile
  if (isLoading || auth0Loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header Skeleton */}
          <LinearGradient
            colors={[colors.primary || '#dbeafe', colors.background]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.headerSkeleton}
          >
            <View style={styles.headerContentSkeleton}>
              <View style={styles.profileInfoSkeleton}>
                <View style={[styles.avatarSkeleton, { backgroundColor: colors.surface }]} />
                <View style={styles.textInfoSkeleton}>
                  <View style={[styles.nameSkeleton, { backgroundColor: colors.surface }]} />
                  <View style={[styles.roleSkeleton, { backgroundColor: colors.surface }]} />
                </View>
              </View>
              <View style={[styles.buttonSkeleton, { backgroundColor: colors.surface }]} />
            </View>
          </LinearGradient>

          {/* Content Skeleton */}
          <View style={styles.mainContent}>
            <View style={[styles.skeletonCard, { backgroundColor: colors.card }]}>
              <View style={styles.skeletonHeader}>
                <View style={[styles.skeletonTitle, { backgroundColor: colors.surface }]} />
                <View style={[styles.skeletonEditButton, { backgroundColor: colors.surface }]} />
              </View>

              <View style={styles.skeletonSection}>
                <View style={[styles.skeletonSectionTitle, { backgroundColor: colors.surface }]} />
                <View style={styles.skeletonRow}>
                  <View style={styles.skeletonInputGroup}>
                    <View style={[styles.skeletonLabel, { backgroundColor: colors.surface }]} />
                    <View style={[styles.skeletonInput, { backgroundColor: colors.surface }]} />
                  </View>
                  <View style={styles.skeletonInputGroup}>
                    <View style={[styles.skeletonLabel, { backgroundColor: colors.surface }]} />
                    <View style={[styles.skeletonInput, { backgroundColor: colors.surface }]} />
                  </View>
                </View>
                <View style={styles.skeletonRow}>
                  <View style={styles.skeletonInputGroup}>
                    <View style={[styles.skeletonLabel, { backgroundColor: colors.surface }]} />
                    <View style={[styles.skeletonInput, { backgroundColor: colors.surface }]} />
                  </View>
                  <View style={styles.skeletonInputGroup}>
                    <View style={[styles.skeletonLabel, { backgroundColor: colors.surface }]} />
                    <View style={[styles.skeletonInput, { backgroundColor: colors.surface }]} />
                  </View>
                </View>
              </View>

              <View style={[styles.skeletonDivider, { backgroundColor: colors.border }]} />

              <View style={styles.skeletonSection}>
                <View style={[styles.skeletonSectionTitle, { backgroundColor: colors.surface }]} />
                <View style={styles.skeletonRow}>
                  <View style={styles.skeletonInputGroup}>
                    <View style={[styles.skeletonLabel, { backgroundColor: colors.surface }]} />
                    <View style={[styles.skeletonInput, { backgroundColor: colors.surface }]} />
                  </View>
                  <View style={styles.skeletonInputGroup}>
                    <View style={[styles.skeletonLabel, { backgroundColor: colors.surface }]} />
                    <View style={[styles.skeletonInput, { backgroundColor: colors.surface }]} />
                  </View>
                </View>
              </View>

              <View style={[styles.skeletonDivider, { backgroundColor: colors.border }]} />

              <View style={styles.skeletonSection}>
                <View style={styles.skeletonAddressHeader}>
                  <View style={[styles.skeletonLabel, { backgroundColor: colors.surface }]} />
                  <View style={[styles.skeletonAddButton, { backgroundColor: colors.surface }]} />
                </View>
                {[1, 2].map((item) => (
                  <View key={item} style={[styles.skeletonAddressCard, { backgroundColor: colors.surface }]}>
                    <View style={styles.skeletonAddressHeader}>
                      <View style={[styles.skeletonAddressTitle, { backgroundColor: colors.surface }]} />
                      <View style={[styles.skeletonAddressIcon, { backgroundColor: colors.surface }]} />
                    </View>
                    <View style={[styles.skeletonAddressLine, { backgroundColor: colors.surface }]} />
                    <View style={[styles.skeletonAddressLineShort, { backgroundColor: colors.surface }]} />
                  </View>
                ))}
              </View>

              <View style={[styles.skeletonFooter, { backgroundColor: colors.surface }]}>
                <View style={[styles.skeletonFooterText, { backgroundColor: colors.surface }]} />
              </View>
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
        {/* Mobile Dialog */}
        {mobileDialogOpen && userId && userRole === 'CUSTOMER' && (
          <MobileNumberDialog
            visible={mobileDialogOpen}
            onClose={() => setMobileDialogOpen(false)}
            customerId={userId}
            onSuccess={() => {
              setHasMobileNumber(true);
              setMobileDialogOpen(false);
            }}
          />
        )}

        {/* Header */}
        <LinearGradient
          colors={[colors.primary || '#dbeafe', colors.background]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <View style={styles.profileInfo}>
              <View style={styles.avatarContainer}>
                {appUser?.picture || auth0User?.picture ? (
                  <Image
                    source={getAvatarSource()}
                    style={styles.avatar}
                    // defaultSource={require('../assets/default-avatar.png')}
                  />
                ) : (
                  <View
                    style={[
                      styles.avatarFallback,
                      { backgroundColor: getAvatarBackgroundColor(getUserInitial()) },
                    ]}
                  >
                    <Text style={[styles.avatarText, { fontSize: fontSizes.title, color: '#fff' }]}>
                      {getUserInitial()}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.userInfo}>
                <Text style={[styles.greeting, { color: colors.text, fontSize: fontSizes.title }]}>
                  {t('profile.page.hello')}, {userName || t('profile.page.user')}
                </Text>
                <View style={styles.roleContainer}>
                  <Text style={[styles.roleText, { color: colors.textSecondary, fontSize: fontSizes.subtitle }]}>
                    {getRoleDisplay()}
                  </Text>
                  {userRole === 'CUSTOMER' && hasMobileNumber === false && (
                    <Text style={[styles.mobileWarning, { color: colors.error, fontSize: fontSizes.body }]}>
                      {' '}⚠️ {t('profile.page.mobileNumberRequired')}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Add Mobile Button - Only for Customers */}
            {userRole === 'CUSTOMER' && hasMobileNumber === false && (
              <TouchableOpacity
                style={[styles.addMobileButton, { backgroundColor: colors.errorLight }]}
                onPress={() => setMobileDialogOpen(true)}
              >
                <Icon name="phone" size={16} color={colors.error} />
                <Text style={[styles.addMobileText, { color: colors.error, fontSize: fontSizes.button }]}>
                  {t('profile.page.addMobileNumber')}
                </Text>
              </TouchableOpacity>
            )}

            {/* Vendor ID Display */}
            {userRole === 'VENDOR' && userId && (
              <View style={[styles.vendorIdBadge, { backgroundColor: colors.infoLight }]}>
                <Text style={[styles.vendorIdText, { color: colors.info, fontSize: fontSizes.body }]}>
                  {t('profile.page.vendorId')}: {userId}
                </Text>
              </View>
            )}
          </View>
        </LinearGradient>

        {/* Profile Section */}
        <View style={styles.profileSectionContainer}>
          {userRole === 'CUSTOMER' ? (
            <CustomerProfileSection
              userId={userId}
              userEmail={userEmail}
              onBack={() => {
                // Handle back navigation if needed
              }}
            />
          ) : userRole === 'SERVICE_PROVIDER' ? (
            <ServiceProviderProfileSection
              userId={userId}
              userEmail={userEmail}
              onBack={() => {
                // Handle back navigation if needed
              }}
            />
          ) : userRole === 'VENDOR' ? (
            <VendorProfileSection
              userId={userId}
              userEmail={userEmail}
              onBack={() => {
                // Handle back navigation if needed
              }}
            />
          ) : null}
        </View>

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.footerText, { color: colors.textTertiary, fontSize: fontSizes.body }]}>
            © 2025 MyApp. {t('profile.page.allRightsReserved')}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  avatarText: {
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  roleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  roleText: {
    fontWeight: '500',
  },
  mobileWarning: {
    fontWeight: '500',
  },
  addMobileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  addMobileText: {
    fontWeight: '600',
  },
  vendorIdBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  vendorIdText: {
    fontWeight: '600',
  },
  profileSectionContainer: {
    marginTop: -20,
  },
  footer: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    textAlign: 'center',
  },
  // Skeleton styles
  headerSkeleton: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContentSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  profileInfoSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarSkeleton: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  textInfoSkeleton: {
    gap: 8,
  },
  nameSkeleton: {
    width: 160,
    height: 28,
    borderRadius: 4,
  },
  roleSkeleton: {
    width: 96,
    height: 16,
    borderRadius: 4,
  },
  buttonSkeleton: {
    width: 128,
    height: 40,
    borderRadius: 20,
  },
  mainContent: {
    alignItems: 'center',
    padding: 16,
  },
  skeletonCard: {
    width: width - 32,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 16,
  },
  skeletonTitle: {
    width: 120,
    height: 24,
    borderRadius: 4,
  },
  skeletonEditButton: {
    width: 80,
    height: 36,
    borderRadius: 20,
  },
  skeletonSection: {
    marginBottom: 20,
  },
  skeletonSectionTitle: {
    width: 150,
    height: 20,
    borderRadius: 4,
    marginBottom: 16,
  },
  skeletonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  skeletonInputGroup: {
    flex: 1,
    minWidth: 200,
  },
  skeletonLabel: {
    width: 80,
    height: 16,
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonInput: {
    width: '100%',
    height: 40,
    borderRadius: 8,
  },
  skeletonDivider: {
    height: 1,
    marginVertical: 20,
  },
  skeletonAddressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  skeletonAddButton: {
    width: 120,
    height: 32,
    borderRadius: 6,
  },
  skeletonAddressCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  skeletonAddressTitle: {
    width: 80,
    height: 20,
    borderRadius: 4,
  },
  skeletonAddressIcon: {
    width: 60,
    height: 20,
    borderRadius: 4,
  },
  skeletonAddressLine: {
    width: '100%',
    height: 20,
    borderRadius: 4,
    marginTop: 8,
    marginBottom: 4,
  },
  skeletonAddressLineShort: {
    width: '80%',
    height: 20,
    borderRadius: 4,
  },
  skeletonFooter: {
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  skeletonFooterText: {
    width: 200,
    height: 16,
    borderRadius: 4,
  },
});

export default ProfileScreen;