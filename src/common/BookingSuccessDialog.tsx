// BookingSuccessDialog.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

interface BookingSuccessDialogProps {
  visible: boolean;
  onClose: () => void;
  bookingDetails?: {
    providerName?: string;
    serviceType?: string;
    totalAmount?: number;
    bookingDate?: string;
    persons?: number;
  };
  message?: string;
  onRedirectToBookings?: () => void;
  onNavigateToBookings?: () => void;
}

const BookingSuccessDialog: React.FC<BookingSuccessDialogProps> = ({
  visible,
  onClose,
  bookingDetails,
  message = "Payment verified and completed successfully",
  onRedirectToBookings,
  onNavigateToBookings,
}) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Start entrance animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      // Bounce animation for icon
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -8,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: -4,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();

      // Show confetti
      setShowConfetti(true);

      // Start countdown animation
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: 6500,
        useNativeDriver: false,
      }).start();

      // Set timer to hide confetti and auto close
      const confettiTimer = setTimeout(() => {
        setShowConfetti(false);
      }, 6500);

      const closeTimer = setTimeout(() => {
        handleAutoClose();
      }, 6500);

      return () => {
        clearTimeout(confettiTimer);
        clearTimeout(closeTimer);
        progressAnim.stopAnimation();
      };
    } else {
      // Reset animations when dialog closes
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
      progressAnim.setValue(1);
    }
  }, [visible]);

  const handleAutoClose = () => {
    // First navigate to bookings, then close dialog
    if (onNavigateToBookings) {
      onNavigateToBookings();
    } else if (onRedirectToBookings) {
      onRedirectToBookings();
    }
    onClose();
  };

  const handleViewBookings = () => {
    setShowConfetti(false);
    
    // Navigate to bookings page
    if (onNavigateToBookings) {
      onNavigateToBookings();
    } else if (onRedirectToBookings) {
      onRedirectToBookings();
    }
    
    // Close the dialog
    onClose();
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Custom confetti component (simplified version)
  const ConfettiComponent = () => {
    const particles = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      left: Math.random() * width,
      top: Math.random() * height,
      color: ['#667eea', '#764ba2', '#FFD700', '#4CAF50', '#FF6B6B', '#4ECDC4'][Math.floor(Math.random() * 6)],
      delay: Math.random() * 2000,
    }));

    return (
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        {particles.map((particle) => (
          <Animated.View
            key={particle.id}
            style={[
              styles.confettiPiece,
              {
                left: particle.left,
                top: particle.top,
                backgroundColor: particle.color,
                opacity: showConfetti ? 1 : 0,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  // Celebration Icon Component
  const CelebrationIcon = ({ top, right, left, bottom, color, delay }: any) => {
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      
      setTimeout(() => pulse.start(), delay);
      
      return () => pulse.stop();
    }, [delay]);

    return (
      <Animated.View
        style={[
          styles.celebrationIcon,
          {
            top,
            right,
            left,
            bottom,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <Icon name="celebration" size={24} color={color} />
      </Animated.View>
    );
  };

  // Countdown Bar Component
  const CountdownBar = () => {
    const widthInterpolate = progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });

    return (
      <Animated.View
        style={[
          styles.countdownBar,
          {
            width: widthInterpolate,
          },
        ]}
      />
    );
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleViewBookings}
    >
      <View style={styles.overlay}>
        {showConfetti && <ConfettiComponent />}
        
        <Animated.View
          style={[
            styles.dialogContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={['#0a2a66', '#575aff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBackground}
          >
            <CountdownBar />
            
            <CelebrationIcon top={12} left={12} color="#FFD700" delay={0} />
            <CelebrationIcon top={12} right={12} color="#FF6B6B" delay={300} />
            <CelebrationIcon bottom={12} left={12} color="#4ECDC4" delay={600} />
            <CelebrationIcon bottom={12} right={12} color="#FFA500" delay={900} />
            
            {/* Success Icon */}
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  transform: [{ translateY: bounceAnim }],
                },
              ]}
            >
              <View style={styles.successIconBackground}>
                <Icon name="check-circle" size={60} color="#4CAF50" />
              </View>
            </Animated.View>
            
            {/* Title */}
            <Text style={styles.title}>
              Booking Confirmed! 🎉
            </Text>
            
            {/* Message */}
            <Text style={styles.message}>
              {message}
            </Text>
            
            {/* Booking Details */}
            {bookingDetails && (
              <View style={styles.detailBox}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Service Provider:</Text>
                  <Text style={styles.detailValue}>
                    {bookingDetails.providerName || 'N/A'}
                  </Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Service Type:</Text>
                  <Text style={styles.detailValue}>
                    {bookingDetails.serviceType}
                  </Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Persons:</Text>
                  <Text style={styles.detailValue}>
                    {bookingDetails.persons}
                  </Text>
                </View>
                
                {bookingDetails.bookingDate && (
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Booking Date:</Text>
                    <Text style={styles.detailValue}>
                      {formatDate(bookingDetails.bookingDate)}
                    </Text>
                  </View>
                )}
                
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Total Amount:</Text>
                  <Text style={styles.amountValue}>
                    ₹{bookingDetails.totalAmount?.toFixed(2)}
                  </Text>
                </View>
              </View>
            )}
            
            {/* Email Note */}
            <Text style={styles.emailNote}>
              You will receive a confirmation email shortly
            </Text>
            
            {/* Redirect Message */}
            <Text style={styles.redirectMessage}>
              Redirecting to bookings page in a few seconds...
            </Text>
            
            {/* Manual Close Button */}
            <TouchableOpacity
              style={styles.continueButton}
              onPress={handleViewBookings}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FFFFFF', '#F8F9FA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  View My Bookings
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContainer: {
    width: width * 0.9,
    maxWidth: 420,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 15,
    },
    shadowOpacity: 0.15,
    shadowRadius: 35,
    elevation: 10,
  },
  gradientBackground: {
    padding: 24,
    alignItems: 'center',
    position: 'relative',
    minHeight: 'auto',
  },
  countdownBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 4,
    backgroundColor: '#FFD700',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  celebrationIcon: {
    position: 'absolute',
    opacity: 0.7,
  },
  iconContainer: {
    marginBottom: 12,
  },
  successIconBackground: {
    backgroundColor: 'white',
    borderRadius: 30,
    padding: 8,
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: 'white',
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    marginBottom: 16,
    opacity: 0.95,
    fontWeight: '500',
    lineHeight: 21,
    color: 'white',
    textAlign: 'center',
  },
  detailBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    padding: 16,
    marginVertical: 12,
    width: '100%',
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailLabel: {
    fontSize: 13,
    opacity: 0.9,
    fontWeight: '500',
    color: 'white',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'right',
    flex: 1,
  },
  amountValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'right',
    flex: 1,
  },
  emailNote: {
    fontSize: 12,
    opacity: 0.8,
    marginTop: 8,
    color: 'white',
  },
  redirectMessage: {
    fontSize: 12,
    opacity: 0.8,
    marginTop: 8,
    fontStyle: 'italic',
    color: 'white',
  },
  continueButton: {
    marginTop: 12,
    width: '100%',
    borderRadius: 25,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: 'white',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  buttonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  buttonText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: 'bold',
  },
  confettiPiece: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

export default BookingSuccessDialog;