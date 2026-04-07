// FirstBookingOffer.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../Settings/ThemeContext';

const { width } = Dimensions.get('window');

interface FirstBookingOfferProps {
  onPress: () => void;
  visible?: boolean;
}

const FirstBookingOffer: React.FC<FirstBookingOfferProps> = ({ onPress, visible = true }) => {
  const { colors, isDarkMode } = useTheme();
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;
  const hotDealRotate = useRef(new Animated.Value(0)).current;
  const hotDealScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;

    // Continuous pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Glow animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowOpacity, {
          toValue: 0.8,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(glowOpacity, {
          toValue: 0.3,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    ).start();

    // Hot deal animation - continuous rotation and scale
    Animated.loop(
      Animated.sequence([
        Animated.timing(hotDealRotate, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(hotDealRotate, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(hotDealScale, {
          toValue: 1.1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(hotDealScale, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ])
    ).start();

    return () => {};
  }, [visible]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      useNativeDriver: true,
      tension: 150,
      friction: 3,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 150,
      friction: 3,
    }).start();
  };

  const hotDealRotateInterpolate = hotDealRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-5deg', '5deg'],
  });

  if (!visible) return null;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.cardWrapper,
          {
            transform: [{ scale: scaleAnim }, { scale: pulseAnim }],
          },
        ]}
      >
        <LinearGradient
          colors={['#FFD700', '#FFA500', '#FF8C00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBorder}
        >
          <Animated.View
            style={[
              styles.card,
              {
                backgroundColor: isDarkMode ? colors.surface : '#fff',
                shadowOpacity: glowOpacity,
                shadowRadius: 15,
              },
            ]}
          >
            <View style={styles.content}>
              {/* Left side - Offer Text */}
              <View style={styles.leftContent}>
                {/* Hot Deal Badge with animation */}
                <Animated.View
                  style={[
                    styles.hotDealBadge,
                    {
                      transform: [
                        { rotate: hotDealRotateInterpolate },
                        { scale: hotDealScale },
                      ],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['#FF4444', '#CC0000', '#FF0000']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.hotDealGradient}
                  >
                    <Text style={styles.hotDealEmoji}>🔥</Text>
                    <Text style={styles.hotDealText}>HOT DEAL</Text>
                    <Text style={styles.hotDealEmoji}>⚡</Text>
                  </LinearGradient>
                </Animated.View>
                
                <View>
                  <Text style={styles.mainTitle}>First Booking</Text>
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceValue}>₹99</Text>
                    <Text style={styles.priceLabel}>only!</Text>
                  </View>
                </View>
              </View>

              {/* Right side - Coupon Code */}
              <View style={styles.rightContent}>
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.couponBadge}
                >
                  <Text style={styles.couponCode}>NEWUSER</Text>
                </LinearGradient>
                <View style={styles.arrowContainer}>
                  <Icon name="arrow-forward" size={20} color="#FFA500" />
                </View>
              </View>
            </View>
            
            {/* Terms and Conditions Text */}
            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                *T&C applied. Valid for first booking only.
              </Text>
            </View>
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    alignItems: 'center',
    zIndex: 10,
  },
  cardWrapper: {
    width: '100%',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  gradientBorder: {
    borderRadius: 12,
    padding: 2,
  },
  card: {
    borderRadius: 10,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  hotDealBadge: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  hotDealGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  hotDealEmoji: {
    fontSize: 12,
  },
  hotDealText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  mainTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  priceValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF4444',
    marginRight: 4,
  },
  priceLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  couponBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  couponCode: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  arrowContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#E0E0E0',
    marginTop: 0,
  },
  termsText: {
    fontSize: 9,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default FirstBookingOffer;