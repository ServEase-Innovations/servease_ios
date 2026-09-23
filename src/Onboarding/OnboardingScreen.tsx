import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Animated,
  Image,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { HOME_M3, HOME_HERO_GRADIENT } from '../theme/brandColors';
import { useTheme } from '../Settings/ThemeContext';
import { useTranslation } from 'react-i18next';
import { usePermissions } from '../context/PermissionsContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  icon: string;
  title: string;
  description: string;
  color: string;
  isPermissionSlide?: boolean;
  isAuthSlide?: boolean;
  permissions?: {
    type: 'location' | 'notifications';
    icon: string;
    title: string;
    description: string;
  }[];
}

interface OnboardingScreenProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onSkip: () => void;
  onRegisterUser: () => void;
  onRegisterProvider: () => void;
  onLoginAsProvider: () => void;
}

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onGetStarted,
  onLogin,
  onSkip,
  onRegisterUser,
  onRegisterProvider,
  onLoginAsProvider,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  
  const {
    locationPermission,
    notificationPermission,
    requestLocationPermission,
    requestNotificationPermission,
  } = usePermissions();

  const slides: OnboardingSlide[] = [
    {
      id: '1',
      icon: 'account-group',
      title: 'Trusted Home Services',
      description: 'Connect with verified and experienced service professionals for your home',
      color: HOME_M3.primary,
    },
    {
      id: '2',
      icon: 'calendar-check',
      title: 'Easy Booking',
      description: 'Book services in minutes with flexible scheduling and instant confirmation',
      color: HOME_M3.primaryContainer,
    },
    {
      id: '3',
      icon: 'shield-check',
      title: 'Safe & Secure',
      description: 'All professionals are background-checked and insured for your peace of mind',
      color: HOME_M3.secondary,
    },
    {
      id: '4',
      icon: 'lock-open-check',
      title: 'Permissions',
      description: 'To provide you with the best experience, we need a few permissions',
      color: HOME_M3.primary,
      isPermissionSlide: true,
      permissions: [
        {
          type: 'location',
          icon: 'map-marker',
          title: 'Location Access',
          description: 'Find nearby providers',
        },
        {
          type: 'notifications',
          icon: 'bell',
          title: 'Notifications',
          description: 'Get booking updates',
        },
      ],
    },
    {
      id: '5',
      icon: 'account-circle',
      title: 'Get Started',
      description: 'Login or register to start booking services',
      color: HOME_M3.primary,
      isAuthSlide: true,
    },
  ];

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event: any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const index = Math.round(offsetX / SCREEN_WIDTH);
        setCurrentIndex(index);
      },
    }
  );

  const scrollToIndex = (index: number) => {
    scrollViewRef.current?.scrollTo({
      x: index * SCREEN_WIDTH,
      animated: true,
    });
    setCurrentIndex(index);
  };

  const getPermissionIcon = (permissionState: string) => {
    switch (permissionState) {
      case 'granted':
        return { name: 'check-circle', color: '#10B981' };
      case 'denied':
      case 'blocked':
        return { name: 'close-circle', color: '#EF4444' };
      default:
        return { name: 'help-circle', color: '#FFFFFF' };
    }
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      scrollToIndex(currentIndex + 1);
    } else {
      onGetStarted();
    }
  };

  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[HOME_HERO_GRADIENT[0], HOME_HERO_GRADIENT[1]]}
        style={styles.gradientBackground}
      >
        {/* Skip Button */}
        <TouchableOpacity 
          style={styles.skipButton} 
          onPress={onSkip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>

        {/* Slides */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          style={styles.scrollView}
        >
          {slides.map((slide) => (
            <View key={slide.id} style={styles.slide}>
              {slide.isPermissionSlide ? (
                // Permissions Slide - New Toggle Design
                <View style={styles.permissionsContainer}>
                  <View style={[styles.iconContainer, { marginBottom: 20 }]}>
                    <View style={[styles.iconCircle, { backgroundColor: 'rgba(0, 191, 255, 0.2)', width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: 'rgba(0, 191, 255, 0.3)' }]}>
                      <Icon name="shield-check" size={45} color="#00BFFF" />
                    </View>
                  </View>
                  <Text style={[styles.title, { fontSize: 22, marginBottom: 10 }]}>Permissions & Access</Text>
                  <Text style={[styles.description, { fontSize: 13, marginBottom: 28, paddingHorizontal: 40, opacity: 0.75 }]}>
                    To provide you with the best experience, find nearby providers, and deliver booking updates, we need your consent.
                  </Text>
                  
                  <View style={styles.permissionsList}>
                    {slide.permissions?.map((perm, index) => {
                      const permState = perm.type === 'location' ? locationPermission : notificationPermission;
                      const isGranted = permState === 'granted';
                      
                      return (
                        <TouchableOpacity
                          key={index}
                          style={styles.permissionToggleItem}
                          onPress={() => 
                            perm.type === 'location' 
                              ? requestLocationPermission() 
                              : requestNotificationPermission()
                          }
                          activeOpacity={0.7}
                        >
                          <View style={styles.permissionIconContainer}>
                            <Icon name={perm.icon} size={24} color="#00BFFF" />
                          </View>
                          <View style={styles.permissionToggleText}>
                            <Text style={styles.permissionToggleTitle} numberOfLines={1}>
                              {perm.title}
                            </Text>
                            <Text style={styles.permissionToggleDescription} numberOfLines={2}>
                              {perm.description}
                            </Text>
                          </View>
                          <View style={[styles.toggleSwitch, isGranted && styles.toggleSwitchActive]}>
                            <View style={[styles.toggleThumb, isGranted && styles.toggleThumbActive]} />
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  
                  <View style={styles.permissionFooter}>
                    <Icon name="lock" size={12} color="rgba(255,255,255,0.5)" />
                    <Text style={styles.permissionFooterText}>
                      You can adjust or revoke permissions anytime in iOS Settings.
                    </Text>
                  </View>
                </View>
              ) : slide.isAuthSlide ? (
                // Auth Slide - Login/Register Options
                <View style={styles.authContainer}>
                  <View style={[styles.iconContainer, { marginBottom: 20 }]}>
                    <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 255, 255, 0.2)', width: 100, height: 100, borderRadius: 50 }]}>
                      <Icon name="account-circle" size={60} color="#FFFFFF" />
                    </View>
                  </View>
                  <Text style={[styles.title, { fontSize: 24, marginBottom: 10 }]}>Welcome to ServEase</Text>
                  <Text style={[styles.description, { fontSize: 14, marginBottom: 40, paddingHorizontal: 30 }]}>
                    Choose how you'd like to get started
                  </Text>
                  
                  <View style={styles.authOptionsContainer}>
                    {/* Login Section */}
                    <View style={styles.authSection}>
                      <Text style={styles.authSectionTitle}>Login</Text>
                      <View style={styles.authButtonsRow}>
                        <TouchableOpacity
                          style={styles.authOptionButton}
                          onPress={onLogin}
                          activeOpacity={0.8}
                        >
                          <Icon name="account" size={28} color="#00BFFF" />
                          <Text style={styles.authOptionButtonText}>As User</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={styles.authOptionButton}
                          onPress={onLoginAsProvider}
                          activeOpacity={0.8}
                        >
                          <Icon name="briefcase" size={28} color="#00BFFF" />
                          <Text style={styles.authOptionButtonText}>As Provider</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Divider */}
                    <View style={styles.authDivider}>
                      <View style={styles.authDividerLine} />
                      <Text style={styles.authDividerText}>OR</Text>
                      <View style={styles.authDividerLine} />
                    </View>

                    {/* Register Section */}
                    <View style={styles.authSection}>
                      <Text style={styles.authSectionTitle}>Register</Text>
                      <View style={styles.authButtonsRow}>
                        <TouchableOpacity
                          style={styles.authOptionButton}
                          onPress={onRegisterUser}
                          activeOpacity={0.8}
                        >
                          <Icon name="account-plus" size={28} color="#00BFFF" />
                          <Text style={styles.authOptionButtonText}>As User</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={styles.authOptionButton}
                          onPress={onRegisterProvider}
                          activeOpacity={0.8}
                        >
                          <Icon name="briefcase-plus" size={28} color="#00BFFF" />
                          <Text style={styles.authOptionButtonText}>As Provider</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.guestButton}
                    onPress={onSkip}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.guestButtonText}>Continue as Guest</Text>
                    <Icon name="arrow-right" size={18} color="rgba(255,255,255,0.7)" />
                  </TouchableOpacity>
                </View>
              ) : (
                // Regular Feature Slide
                <>
                  <View style={styles.iconContainer}>
                    <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                      <Icon name={slide.icon} size={70} color="#FFFFFF" />
                    </View>
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.title}>{slide.title}</Text>
                    <Text style={styles.description}>{slide.description}</Text>
                  </View>
                </>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Pagination Dots */}
        <View style={styles.pagination}>
          {slides.map((_, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dot,
                index === currentIndex && styles.activeDot,
              ]}
              onPress={() => scrollToIndex(index)}
              activeOpacity={0.7}
            />
          ))}
        </View>

        {/* Action Buttons */}
        {!slides[currentIndex]?.isAuthSlide && (
          <View style={styles.actionsContainer}>
            {isLastSlide ? (
              <>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={onGetStarted}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryButtonText}>Get Started</Text>
                  <Icon name="arrow-right" size={20} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={onLogin}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryButtonText}>Already have an account? Login</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.nextButton}
                onPress={handleNext}
                activeOpacity={0.8}
              >
                <Text style={styles.nextButtonText}>Next</Text>
                <Icon name="arrow-right" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 40,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.9,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 6,
  },
  activeDot: {
    width: 24,
    backgroundColor: '#FFFFFF',
  },
  actionsContainer: {
    paddingHorizontal: 40,
    paddingBottom: 50,
    gap: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: HOME_M3.primary,
    fontSize: 18,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  permissionsContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 100,
  },
  permissionsList: {
    width: '100%',
    paddingHorizontal: 0,
    gap: 12,
  },
  permissionToggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 40, 60, 0.5)',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 14,
  },
  permissionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 191, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionToggleText: {
    flex: 1,
    paddingRight: 8,
  },
  permissionToggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  permissionToggleDescription: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.85,
    lineHeight: 17,
  },
  toggleSwitch: {
    width: 50,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 3,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: '#00BFFF',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  permissionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 24,
    paddingHorizontal: 20,
  },
  permissionFooterText: {
    fontSize: 11,
    color: '#FFFFFF',
    opacity: 0.5,
    flex: 1,
    lineHeight: 15,
  },
  authContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 80,
  },
  authOptionsContainer: {
    width: '100%',
    paddingHorizontal: 10,
    gap: 20,
  },
  authSection: {
    width: '100%',
  },
  authSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  authButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  authOptionButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    maxWidth: 160,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  authOptionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: HOME_M3.primary,
    textAlign: 'center',
  },
  authDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginVertical: 8,
  },
  authDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  authDividerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.7,
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 30,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  guestButtonText: {
    fontSize: 15,
    color: '#FFFFFF',
    opacity: 0.7,
    textDecorationLine: 'underline',
  },
});

export default OnboardingScreen;
