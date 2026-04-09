// BroadcastMessage.tsx - With Modern Switch at Top and Snackbar
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Clipboard,
  Animated,
  Dimensions,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Snackbar from 'react-native-snackbar';

const { width, height } = Dimensions.get('window');

interface Coupon {
  id: string;
  code: string;
  discount: number;
  minAmount: number;
  validUntil: Date;
  description: string;
}

const coupons: Coupon[] = [
  {
    id: '1',
    code: 'SAVE10',
    discount: 10,
    minAmount: 1000,
    validUntil: new Date('2025-12-31'),
    description: 'Get 10% off on your first booking',
  },
  {
    id: '2',
    code: 'SAVE20',
    discount: 20,
    minAmount: 2000,
    validUntil: new Date('2025-12-31'),
    description: 'Get 20% off on bookings above ₹2000',
  },
];

interface BroadcastMessageProps {
  onCouponApplied?: (couponCode: string) => void;
}

const BroadcastMessage: React.FC<BroadcastMessageProps> = ({ onCouponApplied }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const slideAnim = useRef(new Animated.Value(height)).current;
  const switchAnim = useRef(new Animated.Value(0)).current;
  
  // Animation values for banner
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const bannerSlideAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shineAnim = useRef(new Animated.Value(0)).current;

  // Rotate through messages every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(bannerSlideAnim, {
          toValue: -50,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentIndex((prev) => (prev + 1) % coupons.length);
        bannerSlideAnim.setValue(50);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(bannerSlideAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [fadeAnim, bannerSlideAnim]);

  // Pulse animation for attention
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
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
    pulse.start();

    const shine = Animated.loop(
      Animated.sequence([
        Animated.timing(shineAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(shineAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    shine.start();

    return () => {
      pulse.stop();
      shine.stop();
    };
  }, [pulseAnim, shineAnim]);

  const openModal = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setModalVisible(true);
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 65,
      friction: 11,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setSelectedCoupon(null);
    });
  };

  const copyToClipboard = async (couponCode: string) => {
    try {
      await Clipboard.setString(couponCode);
      
      // Show snackbar instead of alert
      Snackbar.show({
        text: `🎉 Coupon "${couponCode}" copied! Get ${selectedCoupon?.discount}% OFF`,
        duration: Snackbar.LENGTH_LONG,
        backgroundColor: '#4caf50',
        textColor: '#ffffff',
        action: {
          text: 'USE NOW',
          textColor: '#FFD700',
          onPress: () => {
            if (onCouponApplied) {
              onCouponApplied(couponCode);
            }
          },
        },
      });
      
      if (onCouponApplied) {
        onCouponApplied(couponCode);
      }
      closeModal();
    } catch (error) {
      Snackbar.show({
        text: '❌ Failed to copy coupon. Please try again!',
        duration: Snackbar.LENGTH_SHORT,
        backgroundColor: '#f44336',
        textColor: '#ffffff',
      });
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const translateX = bannerSlideAnim.interpolate({
    inputRange: [-50, 0, 50],
    outputRange: [-20, 0, 20],
  });

  const shineTranslate = shineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  // Switch between coupons
  const switchToCoupon = (coupon: Coupon) => {
    // Animate switch
    Animated.sequence([
      Animated.timing(switchAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(switchAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    
    setSelectedCoupon(coupon);
    
    // Show snackbar on switch
    Snackbar.show({
      text: `Switched to ${coupon.discount}% OFF coupon`,
      duration: Snackbar.LENGTH_SHORT,
      backgroundColor: '#0a2a66ff',
      textColor: '#ffffff',
    });
  };

  const switchScale = switchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.95],
  });

  return (
    <>
      {/* Banner */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => openModal(coupons[currentIndex])}
      >
        <Animated.View style={[styles.bannerContainer, { transform: [{ scale: pulseAnim }] }]}>
          <LinearGradient
            colors={["#0a2a66ff", "#004aadff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.bannerGradient}
          >
            <Animated.View
              style={[
                styles.bannerContent,
                {
                  opacity: fadeAnim,
                  transform: [{ translateX: translateX }],
                },
              ]}
            >
              <View style={styles.iconContainer}>
                <Icon name="local-offer" size={20} color="#FFD700" />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.discountText}>
                  {coupons[currentIndex].discount}% OFF
                </Text>
                <Text style={styles.messageText}>
                  Use code {coupons[currentIndex].code}
                </Text>
              </View>
              <View style={styles.claimButton}>
                <Text style={styles.claimText}>Claim →</Text>
              </View>
            </Animated.View>
            <Animated.View
              style={[
                styles.shineEffect,
                { transform: [{ translateX: shineTranslate }] },
              ]}
            />
          </LinearGradient>
        </Animated.View>
      </TouchableOpacity>

      {/* Bottom Sheet Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeModal}
        statusBarTranslucent={true}
      >
        <TouchableWithoutFeedback onPress={closeModal}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View 
                style={[
                  styles.bottomSheet,
                  { transform: [{ translateY: slideAnim }] }
                ]}
              >
                {/* Drag Handle */}
                <View style={styles.dragHandle}>
                  <View style={styles.dragHandleBar} />
                </View>

                {/* Modern Switch at Top */}
                <View style={styles.switchContainer}>
                  <Text style={styles.switchLabel}>Select Coupon</Text>
                  <View style={styles.switchWrapper}>
                    {coupons.map((coupon, index) => (
                      <TouchableOpacity
                        key={coupon.id}
                        activeOpacity={0.8}
                        onPress={() => switchToCoupon(coupon)}
                        style={styles.switchItem}
                      >
                        <Animated.View
                          style={[
                            styles.switchItemInner,
                            selectedCoupon?.id === coupon.id && styles.switchItemActive,
                            { transform: [{ scale: selectedCoupon?.id === coupon.id ? switchScale : 1 }] },
                          ]}
                        >
                          <LinearGradient
                            colors={selectedCoupon?.id === coupon.id 
                              ? ["#0a2a66ff", "#004aadff"] 
                              : ["#f0f0f0", "#e0e0e0"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.switchGradient}
                          >
                            <Text style={[
                              styles.switchDiscount,
                              selectedCoupon?.id === coupon.id && styles.switchDiscountActive
                            ]}>
                              {coupon.discount}%
                            </Text>
                            <Text style={[
                              styles.switchOff,
                              selectedCoupon?.id === coupon.id && styles.switchOffActive
                            ]}>
                              OFF
                            </Text>
                          </LinearGradient>
                          {selectedCoupon?.id === coupon.id && (
                            <View style={styles.activeIndicator}>
                              <Icon name="check-circle" size={16} color="#FFD700" />
                            </View>
                          )}
                        </Animated.View>
                        <Text style={[
                          styles.switchCode,
                          selectedCoupon?.id === coupon.id && styles.switchCodeActive
                        ]}>
                          {coupon.code}
                        </Text>
                        <Text style={[
                          styles.switchMin,
                          selectedCoupon?.id === coupon.id && styles.switchMinActive
                        ]}>
                          Min ₹{coupon.minAmount}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <ScrollView 
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.modalScrollContent}
                >
                  {/* Coupon Card */}
                  <View style={styles.couponCard}>
                    <View style={styles.couponCardInner}>
                      <View style={styles.couponCodeSection}>
                        <Text style={styles.couponCodeLabel}>COUPON CODE</Text>
                        <Text style={styles.couponCode}>{selectedCoupon?.code}</Text>
                      </View>
                      <View style={styles.couponDiscountSection}>
                        <Text style={styles.couponDiscount}>
                          {selectedCoupon?.discount}%
                        </Text>
                        <Text style={styles.couponOffText}>OFF</Text>
                      </View>
                    </View>
                  </View>

                  {/* Offer Details */}
                  <View style={styles.detailsCard}>
                    <Text style={styles.sectionTitle}>📋 Offer Details</Text>
                    
                    <View style={styles.detailRow}>
                      <Icon name="info" size={20} color="#0a2a66ff" />
                      <Text style={styles.detailText}>
                        {selectedCoupon?.description}
                      </Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Icon name="attach-money" size={20} color="#0a2a66ff" />
                      <Text style={styles.detailText}>
                        Minimum Order: ₹{selectedCoupon?.minAmount}
                      </Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Icon name="event" size={20} color="#0a2a66ff" />
                      <Text style={styles.detailText}>
                        Valid Till: {selectedCoupon && formatDate(selectedCoupon.validUntil)}
                      </Text>
                    </View>
                    
                    <View style={styles.detailRow}>
                      <Icon name="check-circle" size={20} color="#4caf50" />
                      <Text style={styles.detailText}>
                        Max Discount: ₹{selectedCoupon && (selectedCoupon.discount * 100)}
                      </Text>
                    </View>
                  </View>

                  {/* Terms & Conditions */}
                  <View style={styles.termsCard}>
                    <Text style={styles.sectionTitle}>📜 Terms & Conditions</Text>
                    
                    <View style={styles.termRow}>
                      <View style={styles.bulletPoint} />
                      <Text style={styles.termText}>Valid only on first booking for new users</Text>
                    </View>
                    
                    <View style={styles.termRow}>
                      <View style={styles.bulletPoint} />
                      <Text style={styles.termText}>Cannot be combined with other offers</Text>
                    </View>
                    
                    <View style={styles.termRow}>
                      <View style={styles.bulletPoint} />
                      <Text style={styles.termText}>Applicable on all service categories</Text>
                    </View>
                    
                    <View style={styles.termRow}>
                      <View style={styles.bulletPoint} />
                      <Text style={styles.termText}>One-time use per customer</Text>
                    </View>
                  </View>

                  {/* Apply Button */}
                  <TouchableOpacity
                    style={styles.applyButton}
                    onPress={() => selectedCoupon && copyToClipboard(selectedCoupon.code)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={["#0a2a66ff", "#004aadff"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.applyGradient}
                    >
                      <Icon name="content-copy" size={20} color="#fff" />
                      <Text style={styles.applyButtonText}>Copy Coupon Code</Text>
                      <Icon name="arrow-forward" size={20} color="#fff" />
                    </LinearGradient>
                  </TouchableOpacity>
                </ScrollView>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Banner Styles
  bannerContainer: {
    marginHorizontal: 0,
    marginVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  bannerGradient: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  discountText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  messageText: {
    color: '#ffffff',
    fontSize: 12,
    marginTop: 2,
    opacity: 0.9,
  },
  claimButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  claimText: {
    color: '#FFD700',
    fontSize: 12,
    fontWeight: '600',
  },
  shineEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    transform: [{ skewX: '-20deg' }],
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: height * 0.9,
    overflow: 'hidden',
  },
  dragHandle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  dragHandleBar: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
  },
  
  // Modern Switch Styles
  switchContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  switchWrapper: {
    flexDirection: 'row',
    gap: 12,
  },
  switchItem: {
    flex: 1,
    alignItems: 'center',
  },
  switchItemInner: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 8,
  },
  switchItemActive: {
    shadowColor: '#0a2a66ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  switchGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchDiscount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
  },
  switchDiscountActive: {
    color: '#FFD700',
  },
  switchOff: {
    fontSize: 10,
    fontWeight: '600',
    color: '#999',
    marginTop: 2,
  },
  switchOffActive: {
    color: '#fff',
  },
  activeIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  switchCode: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginTop: 4,
  },
  switchCodeActive: {
    color: '#0a2a66ff',
  },
  switchMin: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  switchMinActive: {
    color: '#004aadff',
  },

  modalScrollContent: {
    paddingBottom: 30,
  },
  couponCard: {
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0a2a66ff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  couponCardInner: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  couponCodeSection: {
    flex: 1,
  },
  couponCodeLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 4,
  },
  couponCode: {
    color: '#FFD700',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  couponDiscountSection: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  couponDiscount: {
    color: '#FFD700',
    fontSize: 28,
    fontWeight: 'bold',
  },
  couponOffText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  detailsCard: {
    margin: 16,
    marginTop: 8,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0a2a66ff',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  termsCard: {
    margin: 16,
    marginTop: 8,
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  termRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#004aadff',
    marginRight: 10,
  },
  termText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  applyButton: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  applyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BroadcastMessage;