/* eslint-disable */
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
  StatusBar,
} from 'react-native';
import { useAuth0 } from 'react-native-auth0';
import { useAppUser } from '../context/AppUserContext';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import providerInstance from '../services/providerInstance';
import { useTheme } from '../../src/Settings/ThemeContext';
import Svg, { Path, Line, Defs, Pattern, Rect, Circle } from 'react-native-svg';

// Import sections
import CustomerProfileSection from './CustomerProfileSection';
import ServiceProviderProfileSection from './ServiceProviderProfileSection';
import VendorProfileSection from './VendorProfileSection';
import MobileNumberDialog from './MobileNumberDialog';

const { width, height } = Dimensions.get('window');

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
          smallText: 10,
        };
      case 'large':
        return {
          title: 32,
          subtitle: 18,
          body: 16,
          button: 16,
          smallText: 14,
        };
      default:
        return {
          title: 28,
          subtitle: 16,
          body: 14,
          button: 14,
          smallText: 12,
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
    return undefined;
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

  // Diagonal line pattern
  const DiagonalPattern = () => (
    <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
      <Defs>
        <Pattern
          id="diagonalPattern"
          patternUnits="userSpaceOnUse"
          width={30}
          height={30}
          patternTransform="rotate(45)"
        >
          <Line
            x1="0"
            y1="15"
            x2="30"
            y2="15"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1.5"
          />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#diagonalPattern)" />
    </Svg>
  );

  // Dot pattern for texture
  const DotPattern = () => (
    <Svg height="100%" width="100%" style={StyleSheet.absoluteFillObject}>
      <Defs>
        <Pattern
          id="dotPattern"
          patternUnits="userSpaceOnUse"
          width={20}
          height={20}
        >
          <Circle cx="10" cy="10" r="1.2" fill="rgba(255,255,255,0.1)" />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#dotPattern)" />
    </Svg>
  );

  // Loading skeleton for the entire profile
  if (isLoading || auth0Loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        <LinearGradient
          colors={['#0d1935', '#1c4485', '#255697']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
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
          </View>
        </LinearGradient>
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.mainContent}>
            <View style={[styles.skeletonCard, { backgroundColor: colors.card }]}>
              {/* Skeleton content */}
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
                </View>
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
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with curved bottom edge */}
        <View style={styles.headerWrapper}>
          <LinearGradient
            colors={['#0d1935', '#1c4485', '#255697']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.header}
          >
            {/* Texture patterns */}
            <DiagonalPattern />
            <DotPattern />
            
            <View style={styles.headerContent}>
              <View style={styles.profileInfo}>
                <View style={styles.avatarRing}>
                  {appUser?.picture || auth0User?.picture ? (
                    <Image
                      source={getAvatarSource()}
                      style={styles.avatar}
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
                  <Text style={[styles.greeting, { color: '#ffffff', fontSize: fontSizes.title }]}>
                    Hello, {userName || t('profile.page.user')}
                  </Text>
                  <View style={styles.roleContainer}>
                    <Text style={[styles.roleText, { color: '#cbd5e1', fontSize: fontSizes.subtitle }]}>
                      {getRoleDisplay()}
                    </Text>
                    {userRole === 'CUSTOMER' && hasMobileNumber === false && (
                      <Text style={[styles.mobileWarning, { color: '#fde047', fontSize: fontSizes.body }]}>
                        {' '}⚠️ Mobile number required
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              {/* Add Mobile Button - Only for Customers */}
              {userRole === 'CUSTOMER' && hasMobileNumber === false && (
                <TouchableOpacity
                  style={styles.addMobileButton}
                  onPress={() => setMobileDialogOpen(true)}
                >
                  <Icon name="phone" size={16} color="#fde047" />
                  <Text style={[styles.addMobileText, { color: '#fde047', fontSize: fontSizes.button }]}>
                    Add Mobile Number
                  </Text>
                </TouchableOpacity>
              )}

              {/* Vendor ID Display */}
              {userRole === 'VENDOR' && userId && (
                <View style={styles.vendorIdBadge}>
                  <Text style={[styles.vendorIdText, { color: '#bae6fd', fontSize: fontSizes.body }]}>
                    Vendor ID: {userId}
                  </Text>
                </View>
              )}
            </View>

            {/* Curved bottom edge decoration - like the image */}
            <View style={styles.curveOverlay} />
          </LinearGradient>
          
          {/* Curved white overlay to create the rounded edge effect */}
          <View style={styles.bottomCurve} />
        </View>

        {/* Profile Section - starts with curved top */}
        <View style={styles.profileSectionContainer}>
          {userRole === 'CUSTOMER' ? (
            <CustomerProfileSection
              userId={userId}
              userEmail={userEmail}
              onBack={() => {}}
            />
          ) : userRole === 'SERVICE_PROVIDER' ? (
            <ServiceProviderProfileSection
              userId={userId}
              userEmail={userEmail}
              onBack={() => {}}
            />
          ) : userRole === 'VENDOR' ? (
            <VendorProfileSection
              userId={userId}
              userEmail={userEmail}
              onBack={() => {}}
            />
          ) : null}
        </View>

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
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  headerWrapper: {
    position: 'relative',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40 + (StatusBar.currentHeight || 0),
    paddingBottom: 50,
    position: 'relative',
  },
  curveOverlay: {
    position: 'absolute',
    bottom: -2,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: 'transparent',
  },
  bottomCurve: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
    zIndex: 10,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  avatarRing: {
    padding: 3,
    borderRadius: 40,
    backgroundColor: '#3b82f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
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
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    backgroundColor: 'rgba(253, 224, 71, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(253, 224, 71, 0.3)',
  },
  addMobileText: {
    fontWeight: '600',
  },
  vendorIdBadge: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  vendorIdText: {
    fontWeight: '600',
  },
  profileSectionContainer: {
    backgroundColor: '#f8fafc',
    paddingTop: 10,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -20,
    zIndex: 20,
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
  headerSkeleton: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 50,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
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
    width: 64,
    height: 64,
    borderRadius: 32,
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
});

export default ProfileScreen;