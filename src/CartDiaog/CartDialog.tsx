import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { removeFromCart, selectCartItems, updateCartItem } from '../features/addToSlice';
import { CartItem, isMaidCartItem, isMealCartItem, isNannyCartItem } from '../types/cartSlice';
import { TermsCheckboxes } from '../common/TermsCheckboxes';
import TnC from "../TermsAndConditions/TnC";
import PrivacyPolicy from "../TermsAndConditions/PrivacyPolicy";
import KeyFactsStatement from "../TermsAndConditions/KeyFactsStatement";
import { CouponDialog, Coupon } from '../Coupons/CouponDialog';
import { useTheme } from '../../src/Settings/ThemeContext';

interface CartDialogProps {
  open: boolean;
  handleClose: () => void;
  handleCheckout?: () => void;
  handleCookCheckout?: () => void;
  handleMaidCheckout?: () => void;
  handleNannyCheckout?: () => void;
}

const calculatePriceForPersons = (basePrice: number, persons: number): number => {
  if (persons <= 3) return basePrice;
  if (persons > 3 && persons <= 6) return basePrice + basePrice * 0.2 * (persons - 3);
  if (persons > 6 && persons <= 9) {
    const priceFor6 = basePrice + basePrice * 0.2 * 3;
    return priceFor6 + priceFor6 * 0.1 * (persons - 6);
  }
  const priceFor6 = basePrice + basePrice * 0.2 * 3;
  const priceFor9 = priceFor6 + priceFor6 * 0.1 * 3;
  return priceFor9 + priceFor9 * 0.05 * (persons - 9);
};

const parseHouseSize = (size?: string): number => {
  if (!size) return 1;
  const numericValue = parseInt(size, 10);
  return isNaN(numericValue) ? 1 : numericValue;
};

const formatHouseSize = (size: number): string => {
  return `${size}BHK`;
};

export const CartDialog: React.FC<CartDialogProps> = ({ 
  open, 
  handleClose, 
  handleCheckout,
  handleCookCheckout,
  handleMaidCheckout,
  handleNannyCheckout
}) => {
  const { colors, fontSize, isDarkMode } = useTheme();
  
  const dispatch = useDispatch();
  const allCartItems = useSelector(selectCartItems);
  
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  
  const [termsAccepted, setTermsAccepted] = useState({
    keyFacts: false,
    terms: false,
    privacy: false
  });

  const [policyModalVisible, setPolicyModalVisible] = useState(false);
  const [activePolicy, setActivePolicy] = useState<'terms' | 'privacy' | 'keyfacts'>('terms');

  const mealCartItems = allCartItems.filter(isMealCartItem);
  const maidCartItems = allCartItems.filter(isMaidCartItem);
  const nannyCartItems = allCartItems.filter(isNannyCartItem);
  
  const mealCartTotal = mealCartItems.reduce((sum, item) => {
    if (item.basePrice) {
      const recalculatedPrice = calculatePriceForPersons(item.basePrice, item.persons || 1);
      return sum + recalculatedPrice;
    }
    return sum + (item.price || 0);
  }, 0);
  
  const maidCartTotal = maidCartItems.reduce((sum, item) => sum + (item.price || 0), 0);
  const nannyCartTotal = nannyCartItems.reduce((sum, item) => sum + (item.price || 0), 0);
  const totalPrice = mealCartTotal + maidCartTotal + nannyCartTotal;
  
  const discountedTotal = Math.max(0, totalPrice - couponDiscount);
  const tax = discountedTotal * 0.18;
  const platformFee = discountedTotal * 0.06;
  const grandTotal = discountedTotal + tax + platformFee;
  
  const originalTax = totalPrice * 0.18;
  const originalPlatformFee = totalPrice * 0.06;
  const totalSaved = couponDiscount + (originalTax - tax) + (originalPlatformFee - platformFee);

  const getServiceType = (): string => {
    if (mealCartItems.length > 0) return 'COOK';
    if (maidCartItems.length > 0) return 'MAID';
    if (nannyCartItems.length > 0) return 'NANNY';
    return 'COOK';
  };
  
  const getUserCity = (): string => {
    return 'Bangalore';
  };

  const getFontSizes = () => {
    switch (fontSize) {
      case 'small':
        return {
          title: 16,
          heading: 14,
          body: 12,
          caption: 10,
          button: 12,
        };
      case 'large':
        return {
          title: 22,
          heading: 18,
          body: 16,
          caption: 14,
          button: 16,
        };
      default:
        return {
          title: 18,
          heading: 16,
          body: 14,
          caption: 12,
          button: 14,
        };
    }
  };

  const fontSizes = getFontSizes();

  const handleQuickApplyCoupon = async () => {
    if (!couponCodeInput.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setIsValidatingCoupon(true);
    setCouponError(null);

    try {
      const response = await fetch(`https://coupons-o26r.onrender.com/api/coupons`);
      const data = await response.json();
      
      if (data.success) {
        const now = new Date();
        const foundCoupon = data.data.find((coupon: Coupon) => 
          coupon.coupon_code.toLowerCase() === couponCodeInput.toLowerCase() &&
          coupon.isActive &&
          (coupon.service_type === getServiceType() || coupon.service_type === 'ALL') &&
          coupon.city === getUserCity() &&
          new Date(coupon.start_date) <= now &&
          new Date(coupon.end_date) >= now
        );

        if (foundCoupon) {
          if (foundCoupon.minimum_order_value && totalPrice < foundCoupon.minimum_order_value) {
            setCouponError(`Minimum order amount of ₹${foundCoupon.minimum_order_value} required`);
            setIsValidatingCoupon(false);
            return;
          }

          let discount = 0;
          if (foundCoupon.discount_type === 'PERCENTAGE') {
            discount = (totalPrice * foundCoupon.discount_value) / 100;
          } else {
            discount = foundCoupon.discount_value;
          }
          
          setAppliedCoupon(foundCoupon);
          setCouponDiscount(discount);
          setCouponCodeInput('');
          setCouponError(null);
          Alert.alert('Success', 'Coupon applied successfully');
        } else {
          setCouponError('Invalid or expired coupon code');
        }
      } else {
        setCouponError('Unable to validate coupon');
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      setCouponError('Error validating coupon');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleApplyCoupon = (coupon: Coupon) => {
    let discount = 0;
    if (coupon.discount_type === 'PERCENTAGE') {
      discount = (totalPrice * coupon.discount_value) / 100;
    } else {
      discount = coupon.discount_value;
    }
    
    setAppliedCoupon(coupon);
    setCouponDiscount(discount);
    setCouponCodeInput('');
    setCouponError(null);
  };
  
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCodeInput('');
    setCouponError(null);
  };

  const handleRemoveItem = (id: string, itemType: CartItem['type']) => {
    dispatch(removeFromCart({ id, type: itemType }));
    if (appliedCoupon) {
      handleRemoveCoupon();
    }
  };

  const allTermsAccepted = termsAccepted.keyFacts && termsAccepted.terms && termsAccepted.privacy;

  useEffect(() => {
    if (!open) {
      setTermsAccepted({
        keyFacts: false,
        terms: false,
        privacy: false
      });
      setCouponCodeInput('');
      setCouponError(null);
    }
  }, [open]);

  useEffect(() => {
    if (allCartItems.length === 0 && appliedCoupon) {
      handleRemoveCoupon();
    }
  }, [allCartItems.length, appliedCoupon]);

  const handleTermsChange = (allAccepted: boolean) => {
    setTermsAccepted({
      keyFacts: allAccepted,
      terms: allAccepted,
      privacy: allAccepted
    });
  };

  const handleTermsUpdate = (updatedTerms: { keyFacts: boolean; terms: boolean; privacy: boolean }) => {
    setTermsAccepted(updatedTerms);
  };

  const handleOpenPolicy = (policyType: 'terms' | 'privacy' | 'keyfacts') => {
    setActivePolicy(policyType);
    setPolicyModalVisible(true);
  };

  const renderPolicyContent = () => {
    switch (activePolicy) {
      case 'terms':
        return <TnC />;
      case 'privacy':
        return <PrivacyPolicy />;
      case 'keyfacts':
        return <KeyFactsStatement />;
      default:
        return null;
    }
  };

  const handleCheckoutClick = async () => {
    setIsProcessing(true);
    
    try {
      if (handleCheckout) {
        await handleCheckout();
      } else if (mealCartItems.length > 0 && handleCookCheckout) {
        await handleCookCheckout();
      } else if (maidCartItems.length > 0 && handleMaidCheckout) {
        await handleMaidCheckout();
      } else if (nannyCartItems.length > 0 && handleNannyCheckout) {
        await handleNannyCheckout();
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const isCheckoutAvailable = () => {
    if (handleCheckout) return true;
    if (mealCartItems.length > 0 && !handleCookCheckout) return false;
    if (maidCartItems.length > 0 && !handleMaidCheckout) return false;
    if (nannyCartItems.length > 0 && !handleNannyCheckout) return false;
    return true;
  };

  const isCheckoutEnabled = allCartItems.length > 0 && allTermsAccepted && isCheckoutAvailable() && !isProcessing;

  return (
    <>
      <Modal
        visible={open}
        animationType="fade"
        transparent={true}
        onRequestClose={handleClose}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <LinearGradient
              colors={["#0a2a66ff", "#004aadff"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.dialogHeader}
            >
              <View style={styles.headerContent}>
                <Text style={[styles.dialogTitle, { fontSize: fontSizes.title }]}>
                  Your Order Summary
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleClose}
                >
                  <Icon name="close" size={24} color="#f7f8fa" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
            
            <ScrollView style={styles.dialogContent}>
              {allCartItems.length === 0 ? (
                <View style={styles.emptyCartContainer}>
                  <Text style={[styles.emptyCartText, { color: colors.textSecondary, fontSize: fontSizes.body }]}>
                    Your cart is empty
                  </Text>
                  <TouchableOpacity 
                    style={[styles.browseButton, { backgroundColor: colors.primary }]}
                    onPress={handleClose}
                  >
                    <Text style={[styles.browseButtonText, { color: '#fff', fontSize: fontSizes.button }]}>
                      Browse Services
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={styles.itemsContainer}>
                    {mealCartItems.length > 0 && (
                      <>
                        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSizes.heading }]}>
                          Meal Services
                        </Text>
                        {mealCartItems.map((item, index) => (
                          <CartItemCard 
                            key={`meal_${item.id || index}`}
                            item={item}
                            onRemove={() => handleRemoveItem(item.id, 'meal')}
                            itemType="meal"
                          />
                        ))}
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                      </>
                    )}
                    
                    {maidCartItems.length > 0 && (
                      <>
                        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSizes.heading }]}>
                          Maid Services
                        </Text>
                        {maidCartItems.map((item, index) => (
                          <CartItemCard 
                            key={`maid_${item.id || index}`}
                            item={item}
                            onRemove={() => handleRemoveItem(item.id, 'maid')}
                            itemType="maid"
                          />
                        ))}
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                      </>
                    )}
                    
                    {nannyCartItems.length > 0 && (
                      <>
                        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontSizes.heading }]}>
                          Nanny Services
                        </Text>
                        {nannyCartItems.map((item, index) => (
                          <CartItemCard 
                            key={`nanny_${item.id || index}`}
                            item={item}
                            onRemove={() => handleRemoveItem(item.id, 'nanny')}
                            itemType="nanny"
                          />
                        ))}
                      </>
                    )}
                  </View>

                  {/* Coupon Search Panel */}
                  <View style={[styles.couponSearchPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.couponSearchTitle, { color: colors.text, fontSize: fontSizes.body, fontWeight: '500' }]}>
                      Have a coupon code?
                    </Text>
                    <View style={styles.couponInputContainer}>
                      <View style={[styles.couponInputWrapper, { borderColor: colors.border, backgroundColor: colors.card }]}>
                        <MaterialCommunityIcons name="tag-outline" size={20} color={colors.primary} />
                        <TextInput
                          style={[styles.couponSearchInput, { color: colors.text, fontSize: fontSizes.body }]}
                          placeholder="Enter coupon code"
                          placeholderTextColor={colors.textTertiary}
                          value={couponCodeInput}
                          onChangeText={(text) => {
                            setCouponCodeInput(text.toUpperCase());
                            setCouponError(null);
                          }}
                          autoCapitalize="characters"
                          editable={!appliedCoupon}
                        />
                        {couponCodeInput.length > 0 && !appliedCoupon && (
                          <TouchableOpacity onPress={() => setCouponCodeInput('')}>
                            <Icon name="close" size={18} color={colors.textSecondary} />
                          </TouchableOpacity>
                        )}
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.applyCouponButton,
                          { backgroundColor: colors.primary },
                          (isValidatingCoupon || !couponCodeInput.trim() || appliedCoupon) && styles.disabledCouponButton
                        ]}
                        onPress={handleQuickApplyCoupon}
                        disabled={isValidatingCoupon || !couponCodeInput.trim() || !!appliedCoupon}
                      >
                        {isValidatingCoupon ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text style={[styles.applyCouponButtonText, { color: '#fff', fontSize: fontSizes.button }]}>
                            Apply
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                    {couponError && (
                      <Text style={[styles.couponErrorText, { color: colors.error, fontSize: fontSizes.caption }]}>
                        {couponError}
                      </Text>
                    )}
                    {!appliedCoupon && (
                      <TouchableOpacity 
                        style={styles.viewAllCouponsLink}
                        onPress={() => setCouponDialogOpen(true)}
                      >
                        <Text style={[styles.viewAllCouponsText, { color: colors.primary, fontSize: fontSizes.caption }]}>
                          View all available coupons →
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Applied Coupon Info or More Coupons Section */}
                  {appliedCoupon ? (
                    <View style={[styles.appliedCouponInfo, { backgroundColor: colors.success + '20', borderColor: colors.success }]}>
                      <View style={styles.appliedCouponInfoContent}>
                        <MaterialCommunityIcons name="check-circle" size={20} color={colors.success} />
                        <View style={styles.appliedCouponInfoText}>
                          <Text style={[styles.appliedCouponInfoCode, { color: colors.text, fontSize: fontSizes.body, fontWeight: '500' }]}>
                            Coupon Applied: {appliedCoupon.coupon_code}
                          </Text>
                          <Text style={[styles.appliedCouponInfoDesc, { color: colors.textSecondary, fontSize: fontSizes.caption }]}>
                            {appliedCoupon.description}
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity onPress={handleRemoveCoupon}>
                        <Text style={[styles.removeAppliedCouponText, { color: colors.error, fontSize: fontSizes.caption }]}>
                          Remove
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.couponsSection, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => setCouponDialogOpen(true)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.couponsHeader}>
                        <View style={styles.couponsHeaderLeft}>
                          <MaterialCommunityIcons name="tag-multiple" size={20} color={colors.primary} />
                          <Text style={[styles.couponsTitle, { color: colors.textSecondary, fontSize: fontSizes.body }]}>
                            More coupons & offers
                          </Text>
                        </View>
                        <View style={styles.couponsHeaderRight}>
                          {totalSaved > 0 && (
                            <Text style={[styles.savedAmount, { color: colors.success, fontSize: fontSizes.body }]}>
                              ₹{totalSaved.toFixed(2)} saved
                            </Text>
                          )}
                          <Text style={[styles.viewAllLink, { color: colors.primary, fontSize: fontSizes.body }]}>
                            View all →
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}

                  <View style={[styles.pricingContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.pricingRow}>
                      <Text style={[styles.pricingLabel, { color: colors.textSecondary, fontSize: fontSizes.body }]}>
                        Subtotal:
                      </Text>
                      <Text style={[styles.pricingValue, { color: colors.text, fontSize: fontSizes.body }]}>
                        ₹{totalPrice.toFixed(2)}
                      </Text>
                    </View>
                    
                    {couponDiscount > 0 && (
                      <View style={styles.pricingRow}>
                        <Text style={[styles.couponDiscountLabel, { color: colors.success, fontSize: fontSizes.body }]}>
                          Coupon Discount ({appliedCoupon?.coupon_code}):
                        </Text>
                        <Text style={[styles.couponDiscountValue, { color: colors.success, fontSize: fontSizes.body }]}>
                          -₹{couponDiscount.toFixed(2)}
                        </Text>
                      </View>
                    )}
                    
                    <View style={styles.pricingRow}>
                      <Text style={[styles.pricingLabel, { color: colors.textSecondary, fontSize: fontSizes.body }]}>
                        Tax (18%):
                      </Text>
                      <Text style={[styles.pricingValue, { color: colors.text, fontSize: fontSizes.body }]}>
                        ₹{tax.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.pricingRow}>
                      <Text style={[styles.pricingLabel, { color: colors.textSecondary, fontSize: fontSizes.body }]}>
                        Platform Fee (6%):
                      </Text>
                      <Text style={[styles.pricingValue, { color: colors.text, fontSize: fontSizes.body }]}>
                        ₹{platformFee.toFixed(2)}
                      </Text>
                    </View>
                    
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    
                    <View style={styles.pricingRow}>
                      <Text style={[styles.totalLabel, { color: colors.text, fontSize: fontSizes.heading, fontWeight: 'bold' }]}>
                        Total:
                      </Text>
                      <Text style={[styles.totalValue, { color: colors.primary, fontSize: fontSizes.heading, fontWeight: 'bold' }]}>
                        ₹{grandTotal.toFixed(2)}
                      </Text>
                    </View>
                    
                    {totalSaved > 0 && (
                      <View style={styles.totalSavingsRow}>
                        <Text style={[styles.totalSavingsText, { color: colors.success, fontSize: fontSizes.caption }]}>
                          Total Savings: ₹{totalSaved.toFixed(2)}
                        </Text>
                      </View>
                    )}
                    
                    <View style={[styles.termsDivider, { backgroundColor: colors.border }]} />

                    <View style={styles.termsContainer}>
                      <TermsCheckboxes 
                        onChange={handleTermsChange}
                        onIndividualChange={handleTermsUpdate}
                        initialValues={termsAccepted}
                        onLinkPress={handleOpenPolicy}
                      />
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
            
            {allCartItems.length > 0 && (
              <View style={[styles.dialogFooter, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.footerTopRow}>
                  <Text style={[styles.itemCountText, { color: colors.textSecondary, fontSize: fontSizes.caption }]}>
                    {allCartItems.length} item{allCartItems.length !== 1 ? 's' : ''} selected
                  </Text>
                </View>
                
                <View style={styles.footerButtons}>
                  <TouchableOpacity 
                    style={[styles.modifyButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                    onPress={handleClose}
                  >
                    <Text style={[styles.modifyButtonText, { color: colors.primary, fontSize: fontSizes.button }]}>
                      Modify Booking
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.checkoutButton,
                      { backgroundColor: colors.primary },
                      !isCheckoutEnabled && [styles.disabledButton, { backgroundColor: colors.disabled }]
                    ]}
                    onPress={handleCheckoutClick}
                    disabled={!isCheckoutEnabled}
                  >
                    {isProcessing ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={[
                        styles.checkoutButtonText,
                        { color: '#fff', fontSize: fontSizes.button },
                        !isCheckoutEnabled && { color: colors.textTertiary }
                      ]}>
                        Proceed to Pay ₹{grandTotal.toFixed(2)}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <CouponDialog
        open={couponDialogOpen}
        handleClose={() => setCouponDialogOpen(false)}
        currentTotal={totalPrice}
        onApplyCoupon={handleApplyCoupon}
        onRemoveCoupon={handleRemoveCoupon}
        appliedCoupon={appliedCoupon}
        serviceType={getServiceType()}
        userCity={getUserCity()}
      />

      <Modal
        visible={policyModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setPolicyModalVisible(false)}
      >
        <View style={[styles.policyModalContainer, { backgroundColor: colors.background }]}>
          <LinearGradient
            colors={["#0a2a66ff", "#004aadff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.policyModalHeader}
          >
            <Text style={[styles.policyModalTitle, { fontSize: fontSizes.title }]}>
              {activePolicy === 'terms' && 'Terms and Conditions'}
              {activePolicy === 'privacy' && 'Privacy Policy'}
              {activePolicy === 'keyfacts' && 'Key Facts Statement'}
            </Text>
            <TouchableOpacity
              style={styles.policyModalClose}
              onPress={() => setPolicyModalVisible(false)}
            >
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>
          <ScrollView style={styles.policyModalContent}>
            {renderPolicyContent()}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

interface CartItemCardProps {
  item: CartItem;
  onRemove: () => void;
  itemType: CartItem['type'];
}

const CartItemCard = ({ item, onRemove, itemType }: CartItemCardProps) => {
  const { colors } = useTheme();
  const dispatch = useDispatch();

  const getFontSizes = () => {
    return { body: 14, caption: 12, small: 10 };
  };

  const fontSizes = getFontSizes();

  const handleIncrement = (field: string) => {
    if (isMealCartItem(item)) {
      const newPersons = (item.persons || 1) + 1;
      const newPrice = (item.basePrice || item.price) * newPersons;
      
      dispatch(updateCartItem({
        id: item.id,
        type: 'meal',
        updates: { 
          persons: newPersons,
          price: newPrice
        }
      }));
    } else if (isMaidCartItem(item)) {
      const details = item.details || {};
      if (field === 'persons') {
        dispatch(updateCartItem({
          id: item.id,
          type: 'maid',
          updates: { details: { ...details, persons: (details.persons || 1) + 1 } }
        }));
      } else if (field === 'houseSize') {
        const currentSize = parseHouseSize(details.houseSize);
        dispatch(updateCartItem({
          id: item.id,
          type: 'maid',
          updates: { 
            details: { 
              ...details, 
              houseSize: formatHouseSize(currentSize + 1) 
            } 
          }
        }));
      } else if (field === 'bathrooms') {
        dispatch(updateCartItem({
          id: item.id,
          type: 'maid',
          updates: { details: { ...details, bathrooms: (details.bathrooms || 1) + 1 } }
        }));
      }
    } else if (isNannyCartItem(item)) {
      dispatch(updateCartItem({
        id: item.id,
        type: 'nanny',
        updates: { age: (item.age || 1) + 1 }
      }));
    }
  };

  const handleDecrement = (field: string) => {
    if (isMealCartItem(item)) {
      if (item.persons > 1) {
        const newPersons = item.persons - 1;
        const newPrice = (item.basePrice || item.price) * newPersons;
        
        dispatch(updateCartItem({
          id: item.id,
          type: 'meal',
          updates: { 
            persons: newPersons,
            price: newPrice
          }
        }));
      }
    } else if (isMaidCartItem(item)) {
      const details = item.details || {};
      if (field === 'persons' && (details.persons || 0) > 1) {
        dispatch(updateCartItem({
          id: item.id,
          type: 'maid',
          updates: { details: { ...details, persons: (details.persons || 1) - 1 } }
        }));
      } else if (field === 'houseSize' && details.houseSize) {
        const currentSize = parseHouseSize(details.houseSize);
        if (currentSize > 1) {
          dispatch(updateCartItem({
            id: item.id,
            type: 'maid',
            updates: { 
              details: { 
                ...details, 
                houseSize: formatHouseSize(currentSize - 1) 
              } 
            }
          }));
        }
      } else if (field === 'bathrooms' && (details.bathrooms || 0) > 1) {
        dispatch(updateCartItem({
          id: item.id,
          type: 'maid',
          updates: { details: { ...details, bathrooms: (details.bathrooms || 1) - 1 } }
        }));
      }
    } else if (isNannyCartItem(item) && item.age > 1) {
      dispatch(updateCartItem({
        id: item.id,
        type: 'nanny',
        updates: { age: item.age - 1 }
      }));
    }
  };

  const getNumericValue = (field: string): number => {
    if (isMealCartItem(item) && field === 'persons') {
      return item.persons || 1;
    } else if (isMaidCartItem(item)) {
      const details = item.details || {};
      if (field === 'persons') return details.persons || 1;
      if (field === 'houseSize') return parseHouseSize(details.houseSize);
      if (field === 'bathrooms') return details.bathrooms || 1;
    } else if (isNannyCartItem(item) && field === 'age') {
      return item.age || 1;
    }
    return 1;
  };

  const renderCounter = (field: string, label: string) => {
    const value = getNumericValue(field);
    const displayValue = field === 'houseSize' ? formatHouseSize(value) : value.toString();

    return (
      <View style={styles.counterContainer}>
        <Text style={[styles.counterLabel, { color: colors.textSecondary, fontSize: fontSizes.body }]}>
          {label}:
        </Text>
        <View style={[styles.counterWrapper, { borderColor: colors.border }]}>
          <TouchableOpacity 
            style={[styles.counterButton, { backgroundColor: colors.surface }]}
            onPress={() => handleDecrement(field)}
          >
            <Text style={[styles.counterButtonText, { color: colors.text, fontSize: fontSizes.body }]}>-</Text>
          </TouchableOpacity>
          <Text style={[styles.counterValue, { color: colors.text, fontSize: fontSizes.body }]}>
            {displayValue}
          </Text>
          <TouchableOpacity 
            style={[styles.counterButton, { backgroundColor: colors.surface }]}
            onPress={() => handleIncrement(field)}
          >
            <Text style={[styles.counterButtonText, { color: colors.text, fontSize: fontSizes.body }]}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const getItemType = () => {
    if (isNannyCartItem(item)) {
      return 'Nanny Service';
    }
    if (isMaidCartItem(item)) {
      return item.serviceType === 'package' ? 'Package' : 'Add-On';
    }
    return 'Meal Package';
  };

  const getItemName = () => {
    if (isMaidCartItem(item)) {
      return item.name.replace(/([A-Z])/g, ' $1').trim();
    }
    if (isNannyCartItem(item)) {
      const careType = item.careType === 'baby' ? 'Baby Care' : 'Elderly Care';
      const packageType = item.packageType.charAt(0).toUpperCase() + item.packageType.slice(1);
      return `${careType} - ${packageType}`;
    }
    if (isMealCartItem(item)) {
      return item.mealType;
    }
    return '';
  };

  const renderDescriptionItems = () => {
    const description = item.description || '';
    return description.split('\n').map((line, i) => (
      <View key={i} style={styles.descriptionItem}>
        <View style={[styles.bulletPoint, { backgroundColor: colors.primary }]} />
        <Text style={[styles.descriptionText, { color: colors.textSecondary, fontSize: fontSizes.caption }]}>
          {line}
        </Text>
      </View>
    ));
  };

  const getCurrentPrice = (): number => {
    if (isMealCartItem(item) && item.basePrice) {
      return item.basePrice * (item.persons || 1);
    }
    return item.price || 0;
  };

  return (
    <View style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={onRemove}
      >
        <Icon name="delete" size={20} color={colors.error} />
      </TouchableOpacity>
      
      <View style={styles.itemHeader}>
        <Text style={[styles.itemTitle, { color: colors.text, fontSize: fontSizes.body, fontWeight: 'bold' }]}>
          {getItemName()} {getItemType()}
        </Text>
      </View>
      
      {isMealCartItem(item) && renderCounter('persons', 'Persons')}
      
      {isMaidCartItem(item) && (
        <>
          {item.details?.persons !== undefined && renderCounter('persons', 'Persons')}
          {item.details?.houseSize !== undefined && renderCounter('houseSize', 'House Size')}
          {item.details?.bathrooms !== undefined && renderCounter('bathrooms', 'Bathrooms')}
        </>
      )}
      
      {isNannyCartItem(item) && renderCounter('age', 'Age')}
      
      <Text style={[styles.includesLabel, { color: colors.textSecondary, fontSize: fontSizes.caption }]}>
        Includes:
      </Text>
      
      <View style={styles.descriptionList}>
        {renderDescriptionItems()}
      </View>
      
      <View style={styles.priceContainer}>
        <Text style={[styles.priceLabel, { color: colors.textSecondary, fontSize: fontSizes.body }]}>
          Price:
        </Text>
        <Text style={[styles.priceValue, { color: colors.text, fontSize: fontSizes.body, fontWeight: 'bold' }]}>
          ₹{getCurrentPrice().toFixed(2)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    borderRadius: 12,
    maxHeight: '80%',
    width: '90%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
  },
  dialogHeader: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dialogTitle: {
    fontWeight: '600',
    color: '#fbfcff',
  },
  closeButton: {
    padding: 4,
  },
  dialogContent: {
    padding: 0,
  },
  emptyCartContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyCartText: {
    marginBottom: 16,
  },
  browseButton: {
    borderRadius: 6,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  browseButtonText: {
    fontWeight: '500',
  },
  itemsContainer: {
    padding: 20,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  couponSearchPanel: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  couponSearchTitle: {
    marginBottom: 12,
  },
  couponInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  couponInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  couponSearchInput: {
    flex: 1,
    padding: 0,
  },
  applyCouponButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  applyCouponButtonText: {
    fontWeight: '600',
  },
  disabledCouponButton: {
    opacity: 0.6,
  },
  couponErrorText: {
    marginTop: 8,
  },
  viewAllCouponsLink: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  viewAllCouponsText: {
    fontWeight: '500',
  },
  appliedCouponInfo: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  appliedCouponInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  appliedCouponInfoText: {
    flex: 1,
  },
  appliedCouponInfoCode: {
    marginBottom: 2,
  },
  appliedCouponInfoDesc: {
    fontSize: 12,
  },
  removeAppliedCouponText: {
    fontWeight: '500',
    marginLeft: 12,
  },
  savedAmount: {
    fontWeight: '500',
  },
  couponsSection: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    padding: 20,
    marginBottom: 8,
  },
  couponsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  couponsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  couponsTitle: {
    fontWeight: '500',
  },
  appliedChip: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  appliedChipText: {
    color: 'white',
    fontWeight: '500',
  },
  couponsHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  discountAmount: {
    fontWeight: '600',
  },
  viewAllLink: {
    fontWeight: '500',
  },
  appliedCouponDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  couponDescription: {
    flex: 1,
  },
  removeCouponText: {
    fontWeight: '500',
    marginLeft: 8,
  },
  savedText: {
    marginTop: 8,
  },
  pricingContainer: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pricingLabel: {},
  pricingValue: {},
  couponDiscountLabel: {},
  couponDiscountValue: {},
  totalLabel: {},
  totalValue: {},
  totalSavingsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  totalSavingsText: {
    fontWeight: '500',
  },
  termsDivider: {
    height: 1,
    marginVertical: 16,
  },
  termsContainer: {
    marginTop: 8,
  },
  dialogFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  footerTopRow: {
    marginBottom: 12,
  },
  itemCountText: {
    fontWeight: '500',
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  modifyButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  modifyButtonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  checkoutButton: {
    flex: 1,
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  checkoutButtonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  itemCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    position: 'relative',
  },
  deleteButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    zIndex: 1,
    padding: 4,
  },
  itemHeader: {
    marginBottom: 12,
    paddingRight: 30,
  },
  itemTitle: {
    textTransform: 'capitalize',
    letterSpacing: 0.5,
  },
  counterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  counterLabel: {
    flex: 1,
  },
  counterWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
  },
  counterButton: {
    padding: 8,
  },
  counterButtonText: {
    fontWeight: '500',
    paddingHorizontal: 8,
  },
  counterValue: {
    paddingHorizontal: 16,
    minWidth: 40,
    textAlign: 'center',
    fontWeight: '500',
  },
  includesLabel: {
    marginTop: 12,
    marginBottom: 8,
    fontWeight: '500',
  },
  descriptionList: {
    marginLeft: 8,
  },
  descriptionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    marginRight: 10,
  },
  descriptionText: {
    flex: 1,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  priceLabel: {
    fontWeight: '500',
  },
  priceValue: {},
  policyModalContainer: {
    flex: 1,
  },
  policyModalHeader: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  policyModalTitle: {
    color: '#fff',
    fontWeight: 'bold',
  },
  policyModalClose: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  policyModalContent: {
    flex: 1,
    padding: 16,
  },
});

export default CartDialog;