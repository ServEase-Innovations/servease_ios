/* eslint-disable */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import { SkeletonLoader } from '../common/SkeletonLoader';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

export interface Coupon {
  coupon_id: string;
  coupon_code: string;
  description: string;
  service_type: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: number;
  minimum_order_value: number;
  usage_limit: number;
  usage_per_user: number;
  start_date: string;
  end_date: string;
  city: string;
  isActive: boolean;
  created_at: string;
}

interface CouponDialogProps {
  open: boolean;
  handleClose: () => void;
  currentTotal: number;
  onApplyCoupon: (coupon: Coupon) => void;
  onRemoveCoupon: () => void;
  appliedCoupon?: Coupon | null;
  serviceType?: string;
  userCity?: string;
}

export const CouponDialog: React.FC<CouponDialogProps> = ({
  open,
  handleClose,
  currentTotal,
  onApplyCoupon,
  onRemoveCoupon,
  appliedCoupon,
  serviceType = 'COOK',
  userCity = 'Bangalore'
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [fetchingCoupons, setFetchingCoupons] = useState(false);

  // Fetch coupons from API when dialog opens
  useEffect(() => {
    if (open) {
      fetchCoupons();
    }
  }, [open]);

  const fetchCoupons = async () => {
    setFetchingCoupons(true);
    setError(null);
    try {
      const response = await axios.get('https://coupons-o26r.onrender.com/api/coupons/all');
      if (response.data.success) {
        const now = new Date();
        // Filter coupons by service type, city, active status, and date range
        const filteredCoupons = response.data.data.filter((coupon: Coupon) => {
          const startDate = new Date(coupon.start_date);
          const endDate = new Date(coupon.end_date);
          return (
            coupon.isActive &&
            (coupon.service_type === serviceType || coupon.service_type === 'ALL') &&
            coupon.city === userCity &&
            startDate <= now &&
            endDate >= now
          );
        });
        setCoupons(filteredCoupons);
      } else {
        setError('Failed to load coupons');
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
      setError('Failed to load coupons. Please try again.');
    } finally {
      setFetchingCoupons(false);
    }
  };

  const validateCoupon = (coupon: Coupon): { valid: boolean; message?: string } => {
    const now = new Date();
    const startDate = new Date(coupon.start_date);
    const endDate = new Date(coupon.end_date);

    // Check if coupon is active
    if (!coupon.isActive) {
      return { valid: false, message: 'This coupon is no longer active' };
    }

    // Check date validity
    if (startDate > now) {
      return { valid: false, message: `This coupon will be available from ${startDate.toLocaleDateString()}` };
    }
    if (endDate < now) {
      return { valid: false, message: 'This coupon has expired' };
    }

    // Check minimum order value
    if (coupon.minimum_order_value && currentTotal < coupon.minimum_order_value) {
      return { 
        valid: false, 
        message: `Minimum order of ₹${coupon.minimum_order_value} required for this coupon` 
      };
    }

    // Check service type
    if (coupon.service_type !== serviceType && coupon.service_type !== 'ALL') {
      return { valid: false, message: `This coupon is only valid for ${coupon.service_type} services` };
    }

    return { valid: true };
  };

  const handleApplyCoupon = async (coupon: Coupon) => {
    // Validate coupon
    const validation = validateCoupon(coupon);
    if (!validation.valid) {
      setError(validation.message || 'Invalid coupon');
      return;
    }

    setLoading(true);
    // Here you can make an API call to validate/apply coupon if needed
    setTimeout(() => {
      onApplyCoupon(coupon);
      setSuccess('Coupon applied successfully!');
      setError(null);
      setLoading(false);
      // Close dialog after short delay
      setTimeout(() => {
        handleClose();
        setSuccess(null);
        setCouponCode('');
      }, 1500);
    }, 500);
  };

  const handleRemoveCoupon = () => {
    onRemoveCoupon();
    setSuccess(null);
    setError(null);
  };

  const handleCustomCouponApply = async () => {
    if (!couponCode.trim()) {
      setError('Please enter a coupon code');
      return;
    }

    // Find coupon in fetched list
    const foundCoupon = coupons.find(
      c => c.coupon_code.toLowerCase() === couponCode.toLowerCase()
    );

    if (foundCoupon) {
      await handleApplyCoupon(foundCoupon);
    } else {
      setError('Invalid coupon code');
    }
  };

  const calculateDiscount = (coupon: Coupon): number => {
    if (coupon.discount_type === 'PERCENTAGE') {
      let discount = (currentTotal * coupon.discount_value) / 100;
      // You can add max discount logic here if needed
      return discount;
    } else {
      return coupon.discount_value;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Skeleton loader for coupon cards
  const CouponSkeleton = () => (
    <>
      {[1, 2, 3].map((index) => (
        <View
          key={index}
          style={styles.skeletonCard}
        >
          <View style={styles.skeletonContent}>
            <SkeletonLoader width={120} height={24} style={{ marginBottom: 8 }} />
            <SkeletonLoader width="80%" height={16} style={{ marginBottom: 8 }} />
            <SkeletonLoader width={100} height={12} style={{ marginBottom: 6 }} />
            <SkeletonLoader width={150} height={12} style={{ marginBottom: 6 }} />
            <SkeletonLoader width={90} height={12} />
          </View>
          <SkeletonLoader width={70} height={32} variant="rectangular" style={{ borderRadius: 6 }} />
        </View>
      ))}
    </>
  );

  return (
    <Modal
      visible={open}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Dialog Header */}
          <LinearGradient
                    colors={["#0a2a66ff", "#004aadff"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.dialogHeader}
                  >
          {/* <View style={styles.dialogHeader}> */}
            <View style={styles.headerContent}>
              <Icon name="local-offer" size={24} color="#ebeef4" />
              <Text style={styles.headerTitle}>
                Coupons and Offers
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
            >
              <Icon name="close" size={24} color="#fafafaff" />
            </TouchableOpacity>
          {/* </View> */}
          </LinearGradient>

          {/* Dialog Content */}
          <ScrollView style={styles.dialogContent} showsVerticalScrollIndicator={false}>
            {/* Applied Coupon */}
            {appliedCoupon && (
              <View style={styles.appliedCouponContainer}>
                <View style={styles.appliedCouponContent}>
                  <Icon name="local-offer" size={20} color="#0984e3" />
                  <View style={styles.appliedCouponText}>
                    <Text style={styles.appliedCouponCode}>
                      Coupon Applied: {appliedCoupon.coupon_code}
                    </Text>
                    <Text style={styles.appliedCouponDescription}>
                      {appliedCoupon.description}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={handleRemoveCoupon}>
                  <Text style={styles.removeButton}>Remove</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Custom Coupon Input */}
            <View style={styles.customCouponContainer}>
              <Text style={styles.sectionTitle}>
                Have a coupon code?
              </Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.couponInput}
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChangeText={(text) => setCouponCode(text.toUpperCase())}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={[styles.applyButton, (loading || !couponCode.trim() || fetchingCoupons) && styles.applyButtonDisabled]}
                  onPress={handleCustomCouponApply}
                  disabled={loading || !couponCode.trim() || fetchingCoupons}
                >
                  {loading ? (
                    <ActivityIndicator size={20} color="white" />
                  ) : (
                    <Text style={styles.applyButtonText}>Apply</Text>
                  )}
                </TouchableOpacity>
              </View>
              {error && (
                <Text style={styles.errorText}>
                  {error}
                </Text>
              )}
              {success && (
                <Text style={styles.successText}>
                  {success}
                </Text>
              )}
            </View>

            <View style={styles.divider} />

            {/* Available Coupons */}
            <Text style={styles.sectionTitle}>
              Available Coupons
            </Text>

            {fetchingCoupons ? (
              // Show skeleton loaders while fetching
              <CouponSkeleton />
            ) : coupons.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No coupons available at the moment
                </Text>
              </View>
            ) : (
              <ScrollView style={styles.couponsList} showsVerticalScrollIndicator={false}>
                {coupons.map((coupon) => {
                  const isApplicable = !coupon.minimum_order_value || currentTotal >= coupon.minimum_order_value;
                  const discountAmount = calculateDiscount(coupon);
                  const isApplied = appliedCoupon?.coupon_id === coupon.coupon_id;

                  return (
                    <View
                      key={coupon.coupon_id}
                      style={[
                        styles.couponCard,
                        isApplied && styles.couponCardApplied,
                        !isApplicable && styles.couponCardInactive
                      ]}
                    >
                      <View style={styles.couponCardContent}>
                        <View style={styles.couponInfo}>
                          <Text style={styles.couponCode}>
                            {coupon.coupon_code}
                          </Text>
                          <Text style={styles.couponDescription}>
                            {coupon.description}
                          </Text>
                          {coupon.minimum_order_value > 0 && (
                            <Text style={styles.couponDetail}>
                              Min. spend: ₹{coupon.minimum_order_value}
                            </Text>
                          )}
                          <Text style={styles.couponDetail}>
                            Valid until: {formatDate(coupon.end_date)}
                          </Text>
                          {discountAmount > 0 && (
                            <Text style={styles.couponSavings}>
                              You save: ₹{discountAmount.toFixed(2)}
                            </Text>
                          )}
                        </View>
                        {isApplicable && !isApplied && (
                          <TouchableOpacity
                            style={styles.collectButton}
                            onPress={() => handleApplyCoupon(coupon)}
                            disabled={loading}
                          >
                            <Text style={styles.collectButtonText}>Collect</Text>
                          </TouchableOpacity>
                        )}
                        {isApplied && (
                          <View style={styles.appliedChip}>
                            <Text style={styles.appliedChipText}>Applied</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}

            {/* Savings Summary */}
            {appliedCoupon && (
              <View style={styles.savingsSummary}>
                <Text style={styles.savingsTitle}>
                  Savings Summary
                </Text>
                <View style={styles.savingsRow}>
                  <Text style={styles.savingsLabel}>
                    Coupon Discount ({appliedCoupon.coupon_code}):
                  </Text>
                  <Text style={styles.savingsAmount}>
                    - ₹{calculateDiscount(appliedCoupon).toFixed(2)}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    maxHeight: '90%',
    minHeight: '70%',
  },
  dialogHeader: {
    backgroundColor: '#2c3e50',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ebeef4',
  },
  closeButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    padding: 8,
  },
  dialogContent: {
    padding: 16,
  },
  appliedCouponContainer: {
    marginBottom: 16,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appliedCouponContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 8,
  },
  appliedCouponText: {
    flex: 1,
  },
  appliedCouponCode: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2d3748',
  },
  appliedCouponDescription: {
    fontSize: 10,
    color: '#718096',
    marginTop: 2,
  },
  removeButton: {
    color: '#0984e3',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 8,
  },
  customCouponContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4a5568',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  couponInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#f8f9fa',
  },
  applyButton: {
    backgroundColor: '#0984e3',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonDisabled: {
    opacity: 0.6,
  },
  applyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 12,
    color: '#e53e3e',
    marginTop: 8,
  },
  successText: {
    fontSize: 12,
    color: '#38a169',
    marginTop: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  couponsList: {
    maxHeight: 400,
  },
  couponCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  couponCardApplied: {
    borderColor: '#0984e3',
    backgroundColor: '#e3f2fd',
  },
  couponCardInactive: {
    opacity: 0.6,
  },
  couponCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  couponInfo: {
    flex: 1,
  },
  couponCode: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  couponDescription: {
    fontSize: 14,
    color: '#4a5568',
    marginTop: 4,
  },
  couponDetail: {
    fontSize: 12,
    color: '#718096',
    marginTop: 4,
  },
  couponSavings: {
    fontSize: 12,
    color: '#0984e3',
    marginTop: 4,
    fontWeight: '500',
  },
  collectButton: {
    borderWidth: 1,
    borderColor: '#0984e3',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 16,
  },
  collectButtonText: {
    color: '#0984e3',
    fontSize: 12,
    fontWeight: '500',
  },
  appliedChip: {
    backgroundColor: '#0984e3',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginLeft: 16,
  },
  appliedChipText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '500',
  },
  savingsSummary: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  savingsTitle: {
    fontSize: 12,
    color: '#2d3748',
    fontWeight: '500',
  },
  savingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  savingsLabel: {
    fontSize: 12,
    color: '#0984e3',
  },
  savingsAmount: {
    fontSize: 12,
    color: '#0984e3',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#718096',
  },
  skeletonCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  skeletonContent: {
    flex: 1,
  },
});