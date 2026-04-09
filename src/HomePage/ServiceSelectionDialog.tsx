// ServiceSelectionDialog.tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
  ScrollView,
  BackHandler,
  Clipboard,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Snackbar from 'react-native-snackbar';
import { useTheme } from '../Settings/ThemeContext';

const { width, height } = Dimensions.get('window');

// Fixed dialog dimensions - consistent across all devices
const DIALOG_WIDTH = Math.min(width * 0.9, 400);
const DIALOG_MAX_HEIGHT = Math.min(height * 0.85, 600);

interface ServiceSelectionDialogProps {
  visible: boolean;
  onClose: () => void;
  onSelectService: (serviceType: string) => void;
}

const ServiceSelectionDialog: React.FC<ServiceSelectionDialogProps> = ({
  visible,
  onClose,
  onSelectService,
}) => {
  const { colors, isDarkMode } = useTheme();

  // Animation values
  const pricePulse = useRef(new Animated.Value(1)).current;

  // Handle back button press
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (visible) {
        onClose();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [visible, onClose]);

  useEffect(() => {
    if (visible) {
      // Pulse animation for price badge only
      Animated.loop(
        Animated.sequence([
          Animated.timing(pricePulse, {
            toValue: 1.08,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pricePulse, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pricePulse.setValue(1);
    }

    return () => {
      pricePulse.stopAnimation();
    };
  }, [visible, pricePulse]);

  const services = [
    {
      id: 'COOK',
      title: 'Home Cook',
      icon: '👩‍🍳',
      description: 'Professional chefs for delicious home-cooked meals',
      gradient: ['#0f2027', '#203a43', '#2c5364'] as const,
    },
    {
      id: 'MAID',
      title: 'Cleaning Help',
      icon: '🧹',
      description: 'Professional cleaning services for your home',
      gradient: ['#0b3b5c', '#1c5985', '#2a7a9e'] as const,
    },
    {
      id: 'NANNY',
      title: 'Caregiver',
      icon: '👶',
      description: 'Experienced caregivers for your loved ones',
      gradient: ['#42275a', '#734b6d', '#b4869f'] as const,
    },
  ];

  const handleSelectService = (serviceId: string) => {
    onSelectService(serviceId);
    onClose();
  };

  const copyCouponToClipboard = async (couponCode: string) => {
    try {
      await Clipboard.setString(couponCode);
      
      Snackbar.show({
        text: `🎉 Coupon "${couponCode}" copied! Get your first service at just ₹99`,
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: '#4caf50',
        textColor: '#ffffff',
        action: {
          text: 'USE NOW',
          textColor: '#FFD700',
          onPress: () => {},
        },
      });
    } catch (error) {
      Snackbar.show({
        text: '❌ Failed to copy coupon. Please try again!',
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: '#f44336',
        textColor: '#ffffff',
      });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay || 'rgba(0,0,0,0.6)' }]}>
        <View style={[
          styles.container, 
          { 
            backgroundColor: isDarkMode ? colors.surface : '#fff',
            width: DIALOG_WIDTH,
            maxHeight: DIALOG_MAX_HEIGHT,
          }
        ]}>
          {/* Header with Linear Gradient */}
          <LinearGradient
            colors={["#0a2a66ff", "#004aadff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerContainer}
          >
            <View style={styles.headerContent}>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Select Service</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Icon name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.content}>
              {/* SIMPLE OFFER TEXT - Compact */}
              <View style={styles.offerWrapper}>
                <Text style={[styles.offerText, { color: isDarkMode ? colors.textPrimary : '#333' }]}>
                  Book any service at just 
                  <Animated.Text style={[styles.priceText, { transform: [{ scale: pricePulse }] }]}>
                    {' '}₹99{' '}
                  </Animated.Text>
                  only!
                </Text>
                
                <View style={styles.couponRow}>
                  <Text style={[styles.useCouponText, { color: isDarkMode ? colors.textSecondary : '#666' }]}>
                    Use coupon
                  </Text>
                  <TouchableOpacity 
                    onPress={() => copyCouponToClipboard('NEWUSER')}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#FFD700', '#FFA500']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.couponButton}
                    >
                      <Text style={styles.couponCodeText}>NEWUSER</Text>
                      <Icon name="content-copy" size={14} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>

              {/* CHOOSE YOUR SERVICE SECTION */}
              <View style={styles.servicesSection}>
                <View style={styles.sectionHeader}>
                  <Icon name="handyman" size={18} color="#0a2a66ff" />
                  <Text style={styles.sectionTitle}>Choose your service</Text>
                </View>
                
                {services.map((service) => (
                  <TouchableOpacity
                    key={service.id}
                    style={[styles.serviceCard, { backgroundColor: isDarkMode ? colors.card : '#f8f9fa' }]}
                    onPress={() => handleSelectService(service.id)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={[...service.gradient]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.serviceGradient}
                    >
                      <View style={styles.serviceIconContainer}>
                        <Text style={styles.serviceIcon}>{service.icon}</Text>
                      </View>
                      <View style={styles.serviceInfo}>
                        <Text style={styles.serviceTitle}>{service.title}</Text>
                        <Text style={styles.serviceDescription}>{service.description}</Text>
                      </View>
                      <View style={styles.arrowContainer}>
                        <Icon name="chevron-right" size={24} color="#fff" />
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>

              {/* HOW TO BOOK SECTION - Compact */}
              <View style={styles.howToBookContainer}>
                <View style={styles.howToBookHeader}>
                  <Icon name="help-outline" size={18} color="#0a2a66ff" />
                  <Text style={styles.howToBookTitle}>How to book your service?</Text>
                </View>
                
                <View style={styles.stepsList}>
                  <View style={styles.stepItem}>
                    <View style={styles.stepDot} />
                    <Text style={styles.stepText}>Tap on NEWUSER coupon to copy</Text>
                  </View>
                  
                  <View style={styles.stepItem}>
                    <View style={styles.stepDot} />
                    <Text style={styles.stepText}>Select your preferred service below</Text>
                  </View>
                  
                  <View style={styles.stepItem}>
                    <View style={styles.stepDot} />
                    <Text style={styles.stepText}>Proceed to booking & apply coupon</Text>
                  </View>
                </View>
              </View>

              {/* POPULAR SERVICES SECTION */}
              <View style={styles.popularSection}>
                <View style={styles.sectionHeader}>
                  <Icon name="stars" size={18} color="#FFA500" />
                  <Text style={styles.popularTitle}>Popular Services</Text>
                </View>
                <Text style={[styles.popularDescription, { color: isDarkMode ? colors.textSecondary : '#666' }]}>
                  Choose from our trusted professional services.
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  headerContainer: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 20,
  },
  // Simple Offer Wrapper - Compact
  offerWrapper: {
    marginBottom: 24,
    alignItems: 'center',
  },
  offerText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  priceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF4444',
  },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  useCouponText: {
    fontSize: 14,
  },
  couponButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  couponCodeText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  // Services Section
  servicesSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0a2a66ff',
  },
  serviceCard: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  serviceIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceIcon: {
    fontSize: 24,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  serviceDescription: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  arrowContainer: {
    width: 30,
    alignItems: 'flex-end',
  },
  // How to Book - Compact
  howToBookContainer: {
    marginBottom: 24,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  howToBookHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  howToBookTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0a2a66ff',
  },
  stepsList: {
    gap: 8,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFA500',
    marginRight: 10,
  },
  stepText: {
    fontSize: 12,
    color: '#555',
    flex: 1,
  },
  // Popular Services Section
  popularSection: {
    marginBottom: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  popularTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFA500',
  },
  popularDescription: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default ServiceSelectionDialog;