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
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../Settings/ThemeContext';

const { width, height } = Dimensions.get('window');

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
  const shimmerAnim = useRef(new Animated.Value(0)).current;

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

      // Shimmer animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pricePulse.setValue(1);
      shimmerAnim.setValue(0);
    }

    return () => {
      pricePulse.stopAnimation();
      shimmerAnim.stopAnimation();
    };
  }, [visible, pricePulse, shimmerAnim]);

  const services = [
    {
      id: 'COOK',
      title: 'Home Cook',
      icon: '👩‍🍳',
      description: 'Professional chefs for delicious home-cooked meals',
      gradient: ['#0f2027', '#203a43', '#2c5364'],
    },
    {
      id: 'MAID',
      title: 'Cleaning Help',
      icon: '🧹',
      description: 'Professional cleaning services for your home',
      gradient: ['#0b3b5c', '#1c5985', '#2a7a9e'],
    },
    {
      id: 'NANNY',
      title: 'Caregiver',
      icon: '👶',
      description: 'Experienced caregivers for your loved ones',
      gradient: ['#42275a', '#734b6d', '#b4869f'],
    },
  ];

  const handleSelectService = (serviceId: string) => {
    onSelectService(serviceId);
    onClose();
  };

  // Shimmer transform
  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.9, width * 0.9],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.container, { backgroundColor: isDarkMode ? colors.surface : '#fff' }]}>
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
              <View style={styles.placeholder} />
            </View>
          </LinearGradient>

          <View style={styles.content}>
            {/* HIGHLIGHTED PRICE SECTION WITH ANIMATIONS */}
            <View style={styles.priceHighlightContainer}>
              <LinearGradient
                colors={['#FFD700', '#FFA500', '#FF8C00']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.priceGradientBorder}
              >
                <View style={styles.priceHighlightInner}>
                  {/* Shimmer effect overlay */}
                  <Animated.View
                    style={[
                      styles.shimmerOverlay,
                      {
                        transform: [{ translateX: shimmerTranslate }],
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.shimmerGradient}
                    />
                  </Animated.View>

                  <Text style={styles.highlightLabel}>⚡ LIMITED TIME OFFER ⚡</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.pricePrefix}>Book any service at just</Text>
                    <Animated.View
                      style={[
                        styles.priceBadge,
                        {
                          transform: [{ scale: pricePulse }],
                        },
                      ]}
                    >
                      <LinearGradient
                        colors={['#FF4444', '#CC0000']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.priceBadgeGradient}
                      >
                        <Text style={styles.rupeeSymbol}>₹</Text>
                        <Text style={styles.priceAmount}>99</Text>
                      </LinearGradient>
                    </Animated.View>
                    <Text style={styles.priceSuffix}>only!</Text>
                  </View>
                  <View style={styles.couponRow}>
                    <Text style={styles.couponLabel}>Use coupon:</Text>
                    <LinearGradient
                      colors={['#FFD700', '#FFA500']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.couponCodeBadge}
                    >
                      <Text style={styles.couponCodeText}>NEWUSER</Text>
                    </LinearGradient>
                  </View>
                </View>
              </LinearGradient>
            </View>

            {services.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={[styles.serviceCard, { backgroundColor: isDarkMode ? colors.card : '#f8f9fa' }]}
                onPress={() => handleSelectService(service.id)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={service.gradient}
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

            <View style={styles.promoInfoContainer}>
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.promoBadge}
              >
                <Text style={styles.promoText}>✨ First Booking Special ✨</Text>
              </LinearGradient>
              <Text style={[styles.promoTerms, { color: colors.textSecondary }]}>
                Get your first service at just ₹99. T&C applied.
              </Text>
            </View>
          </View>
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
    width: width * 0.9,
    maxHeight: height * 0.85,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  headerContainer: {
    padding: 20,
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
  placeholder: {
    width: 34,
  },
  content: {
    padding: 20,
  },
  // HIGHLIGHTED PRICE SECTION STYLES
  priceHighlightContainer: {
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#FFA500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  priceGradientBorder: {
    borderRadius: 16,
    padding: 2,
  },
  priceHighlightInner: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  shimmerGradient: {
    width: '100%',
    height: '100%',
  },
  highlightLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFA500',
    marginBottom: 8,
    letterSpacing: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 12,
  },
  pricePrefix: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  priceBadge: {
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 4,
  },
  priceBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  rupeeSymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 2,
  },
  priceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  priceSuffix: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF4444',
    marginLeft: 4,
  },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  couponLabel: {
    fontSize: 12,
    color: '#999',
    marginRight: 8,
  },
  couponCodeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  couponCodeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
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
    padding: 16,
  },
  serviceIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  serviceIcon: {
    fontSize: 28,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  arrowContainer: {
    width: 30,
    alignItems: 'flex-end',
  },
  promoInfoContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  promoBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 10,
  },
  promoText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  promoTerms: {
    fontSize: 11,
    textAlign: 'center',
  },
});

export default ServiceSelectionDialog;