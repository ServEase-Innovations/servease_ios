import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { removeFromCart, selectCartItems, updateCartItem } from '../features/addToSlice';
import { CartItem, isMaidCartItem, isMealCartItem, isNannyCartItem } from '../types/cartSlice';
import { TermsCheckboxes } from '../common/TermsCheckboxes';

interface CartDialogProps {
  open: boolean;
  handleClose: () => void;
  handleCheckout?: () => void;
  handleCookCheckout?: () => void;
  handleMaidCheckout?: () => void;
  handleNannyCheckout?: () => void;
}

// Add the price calculation function here (same as in DemoCook)
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

// Utility functions for houseSize handling
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
  const dispatch = useDispatch();
  const allCartItems = useSelector(selectCartItems);
  
  // Filter items by type
  const mealCartItems = allCartItems.filter(isMealCartItem);
  const maidCartItems = allCartItems.filter(isMaidCartItem);
  const nannyCartItems = allCartItems.filter(isNannyCartItem);
  
  // Calculate totals - Updated with proper price recalculation for meals
  const mealCartTotal = mealCartItems.reduce((sum, item) => {
    // Recalculate price based on current persons count to ensure accuracy
    if (item.basePrice) {
      const recalculatedPrice = calculatePriceForPersons(item.basePrice, item.persons || 1);
      return sum + recalculatedPrice;
    }
    return sum + (item.price || 0);
  }, 0);
  
  const maidCartTotal = maidCartItems.reduce((sum, item) => sum + (item.price || 0), 0);
  const nannyCartTotal = nannyCartItems.reduce((sum, item) => sum + (item.price || 0), 0);
  const totalPrice = mealCartTotal + maidCartTotal + nannyCartTotal;
  const tax = totalPrice * 0.18;
  const platformFee = totalPrice * 0.06;
  const grandTotal = totalPrice + tax + platformFee;

  const handleRemoveItem = (id: string, itemType: CartItem['type']) => {
    dispatch(removeFromCart({ id, type: itemType }));
  };

  const [allTermsAccepted, setAllTermsAccepted] = useState(false);

  // Reset checkboxes whenever dialog closes
  useEffect(() => {
    if (!open) {
      setAllTermsAccepted(false);
    }
  }, [open]);

  // Debug: Log when terms acceptance changes
  useEffect(() => {
    console.log('All terms accepted:', allTermsAccepted);
  }, [allTermsAccepted]);

  // Handle checkout button click
  const handleCheckoutClick = () => {
    console.log('Checkout clicked, terms accepted:', allTermsAccepted);
    
    if (handleCheckout) {
      console.log('Using generic handleCheckout');
      handleCheckout();
      return;
    }
    
    if (mealCartItems.length > 0 && handleCookCheckout) {
      console.log('Using handleCookCheckout');
      handleCookCheckout();
    } else if (maidCartItems.length > 0 && handleMaidCheckout) {
      console.log('Using handleMaidCheckout');
      handleMaidCheckout();
    } else if (nannyCartItems.length > 0 && handleNannyCheckout) {
      console.log('Using handleNannyCheckout');
      handleNannyCheckout();
    } else {
      console.error("No checkout handler available for cart items");
    }
  };

  // Check if checkout is available for current cart items
  const isCheckoutAvailable = () => {
    if (handleCheckout) return true;
    
    if (mealCartItems.length > 0 && !handleCookCheckout) return false;
    if (maidCartItems.length > 0 && !handleMaidCheckout) return false;
    if (nannyCartItems.length > 0 && !handleNannyCheckout) return false;
    return true;
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  // Check if checkout button should be enabled
  const isCheckoutEnabled = allCartItems.length > 0 && allTermsAccepted && isCheckoutAvailable();

  console.log('Checkout enabled:', isCheckoutEnabled, 'Items:', allCartItems.length, 'Terms:', allTermsAccepted, 'Available:', isCheckoutAvailable());

  return (
    <Modal
      visible={open}
      animationType="fade"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.dialogHeader}>
            <View style={styles.headerContent}>
              <Text style={styles.dialogTitle}>Your Order Summary</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleClose}
              >
                <Icon name="close" size={24} color="#718096" />
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Content */}
          <ScrollView style={styles.dialogContent}>
            {allCartItems.length === 0 ? (
              <View style={styles.emptyCartContainer}>
                <Text style={styles.emptyCartText}>Your cart is empty</Text>
                <TouchableOpacity 
                  style={styles.browseButton}
                  onPress={handleClose}
                >
                  <Text style={styles.browseButtonText}>Browse Services</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.itemsContainer}>
                  {/* Meal Cart Items */}
                  {mealCartItems.length > 0 && (
                    <>
                      <Text style={styles.sectionTitle}>Meal Services</Text>
                      {mealCartItems.map((item, index) => (
                        <CartItemCard 
                          key={`meal_${item.id || index}`}
                          item={item}
                          onRemove={() => handleRemoveItem(item.id, 'meal')}
                          itemType="meal"
                        />
                      ))}
                      <View style={styles.divider} />
                    </>
                  )}
                  
                  {/* Maid Cart Items */}
                  {maidCartItems.length > 0 && (
                    <>
                      <Text style={styles.sectionTitle}>Maid Services</Text>
                      {maidCartItems.map((item, index) => (
                        <CartItemCard 
                          key={`maid_${item.id || index}`}
                          item={item}
                          onRemove={() => handleRemoveItem(item.id, 'maid')}
                          itemType="maid"
                        />
                      ))}
                      <View style={styles.divider} />
                    </>
                  )}
                  
                  {/* Nanny Cart Items */}
                  {nannyCartItems.length > 0 && (
                    <>
                      <Text style={styles.sectionTitle}>Nanny Services</Text>
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

                {/* Pricing Summary */}
                <View style={styles.pricingContainer}>
                  <View style={styles.pricingRow}>
                    <Text style={styles.pricingLabel}>Subtotal:</Text>
                    <Text style={styles.pricingValue}>₹{totalPrice.toFixed(2)}</Text>
                  </View>
                  <View style={styles.pricingRow}>
                    <Text style={styles.pricingLabel}>Tax (18%):</Text>
                    <Text style={styles.pricingValue}>₹{tax.toFixed(2)}</Text>
                  </View>
                  <View style={styles.pricingRow}>
                    <Text style={styles.pricingLabel}>Platform Fee (6%):</Text>
                    <Text style={styles.pricingValue}>₹{platformFee.toFixed(2)}</Text>
                  </View>
                  
                  <View style={styles.divider} />
                  
                  <View style={styles.pricingRow}>
                    <Text style={styles.totalLabel}>Total:</Text>
                    <Text style={styles.totalValue}>₹{grandTotal.toFixed(2)}</Text>
                  </View>
                  
                  <View style={styles.termsDivider} />

                  {/* Terms Checkboxes */}
                  <View style={styles.termsContainer}>
                    <TermsCheckboxes 
                      onChange={setAllTermsAccepted}
                      onLinkPress={(type) => {
                        const urls: Record<string, string> = {
                          terms: 'https://servease.com/terms',
                          privacy: 'https://servease.com/privacy',
                          keyfacts: 'https://servease.com/keyfacts'
                        };
                        openLink(urls[type] || '');
                      }}
                    />
                  </View>
                </View>
              </>
            )}
          </ScrollView>
          
          {/* Footer */}
          {allCartItems.length > 0 && (
            <View style={styles.dialogFooter}>
              <View style={styles.footerTopRow}>
                <Text style={styles.itemCountText}>
                  {allCartItems.length} item{allCartItems.length !== 1 ? 's' : ''} selected
                </Text>
              </View>
              
              <View style={styles.footerButtons}>
                <TouchableOpacity 
                  style={styles.modifyButton}
                  onPress={handleClose}
                >
                  <Text style={styles.modifyButtonText}>Modify Booking</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.checkoutButton,
                    !isCheckoutEnabled && styles.disabledButton
                  ]}
                  onPress={handleCheckoutClick}
                  disabled={!isCheckoutEnabled}
                >
                  <Text style={[
                    styles.checkoutButtonText,
                    !isCheckoutEnabled && styles.disabledButtonText
                  ]}>
                    Proceed to Checkout (₹{grandTotal.toFixed(2)})
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

interface CartItemCardProps {
  item: CartItem;
  onRemove: () => void;
  itemType: CartItem['type'];
}

const CartItemCard = ({ item, onRemove, itemType }: CartItemCardProps) => {
  const dispatch = useDispatch();

  const handleIncrement = (field: string) => {
    if (isMealCartItem(item)) {
      const newPersons = (item.persons || 1) + 1;
      // Recalculate price based on new persons count
      const newPrice = calculatePriceForPersons(item.basePrice || item.price, newPersons);
      
      dispatch(updateCartItem({
        id: item.id,
        type: 'meal',
        updates: { 
          persons: newPersons,
          price: newPrice // Update the price as well
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
        // Recalculate price based on new persons count
        const newPrice = calculatePriceForPersons(item.basePrice || item.price, newPersons);
        
        dispatch(updateCartItem({
          id: item.id,
          type: 'meal',
          updates: { 
            persons: newPersons,
            price: newPrice // Update the price as well
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
        <Text style={styles.counterLabel}>{label}:</Text>
        <View style={styles.counterWrapper}>
          <TouchableOpacity 
            style={styles.counterButton}
            onPress={() => handleDecrement(field)}
          >
            <Text style={styles.counterButtonText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.counterValue}>{displayValue}</Text>
          <TouchableOpacity 
            style={styles.counterButton}
            onPress={() => handleIncrement(field)}
          >
            <Text style={styles.counterButtonText}>+</Text>
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
      return item.serviceType === 'package' ? 'Package' : 'Add-on';
    }
    return 'Meal Package';
  };

  const getItemName = () => {
    if (isMaidCartItem(item)) {
      return item.name.replace(/([A-Z])/g, ' $1').trim();
    }
    if (isNannyCartItem(item)) {
      return `${item.careType === 'baby' ? 'Baby' : 'Elderly'} Care - ${item.packageType.charAt(0).toUpperCase() + item.packageType.slice(1)}`;
    }
    if (isMealCartItem(item)) {
      return item.mealType;
    }
    return '';
  };

  const renderDescriptionItems = () => {
    // Handle case where description might be undefined or not a string
    const description = item.description || '';
    return description.split('\n').map((line, i) => (
      <View key={i} style={styles.descriptionItem}>
        <View style={styles.bulletPoint} />
        <Text style={styles.descriptionText}>{line}</Text>
      </View>
    ));
  };

  // Get the current price (for meal items, ensure it's recalculated)
  const getCurrentPrice = (): number => {
    if (isMealCartItem(item) && item.basePrice) {
      return calculatePriceForPersons(item.basePrice, item.persons || 1);
    }
    return item.price || 0;
  };

  return (
    <View style={styles.itemCard}>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={onRemove}
      >
        <Icon name="delete" size={20} color="#e53e3e" />
      </TouchableOpacity>
      
      <View style={styles.itemHeader}>
        <Text style={styles.itemTitle}>
          {getItemName()} {getItemType()}
        </Text>
      </View>
      
      {/* Add counters based on item type */}
      {isMealCartItem(item) && renderCounter('persons', 'Persons')}
      
      {isMaidCartItem(item) && (
        <>
          {item.details?.persons !== undefined && renderCounter('persons', 'Persons')}
          {item.details?.houseSize !== undefined && renderCounter('houseSize', 'House Size')}
          {item.details?.bathrooms !== undefined && renderCounter('bathrooms', 'Bathrooms')}
        </>
      )}
      
      {isNannyCartItem(item) && renderCounter('age', 'Age')}
      
      <Text style={styles.includesLabel}>Includes:</Text>
      
      <View style={styles.descriptionList}>
        {renderDescriptionItems()}
      </View>
      
      <View style={styles.priceContainer}>
        <Text style={styles.priceLabel}>Price:</Text>
        <Text style={styles.priceValue}>₹{getCurrentPrice().toFixed(2)}</Text>
      </View>
    </View>
  );
};

// Keep the existing styles object as is
const styles = StyleSheet.create({
  // ... (all your existing styles remain exactly the same)
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: '#f8f9fa',
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
    borderColor: '#e0e0e0',
  },
  dialogHeader: {
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
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
    fontSize: 20,
    color: '#2d3748',
  },
  closeButton: {
    padding: 4,
  },
  dialogContent: {
    padding: 0,
    backgroundColor: '#f8f9fa',
  },
  emptyCartContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: '#ffffff',
  },
  emptyCartText: {
    color: '#4a5568',
    marginBottom: 16,
    fontSize: 16,
  },
  browseButton: {
    backgroundColor: '#4299e1',
    borderRadius: 6,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  browseButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  itemsContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
    color: '#2d3748',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#edf2f7',
    marginVertical: 16,
  },
  pricingContainer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#edf2f7',
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
  pricingLabel: {
    color: '#4a5568',
    fontSize: 14,
  },
  pricingValue: {
    color: '#4a5568',
    fontSize: 14,
  },
  totalLabel: {
    color: '#2d3748',
    fontSize: 16,
    fontWeight: '600',
  },
  totalValue: {
    color: '#2b6cb0',
    fontSize: 16,
    fontWeight: '600',
  },
  termsDivider: {
    height: 1,
    backgroundColor: '#cbd5e0',
    marginVertical: 16,
  },
  termsContainer: {
    marginTop: 8,
  },
  dialogFooter: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#edf2f7',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  footerTopRow: {
    marginBottom: 12,
  },
  itemCountText: {
    color: '#4a5568',
    fontWeight: '500',
    fontSize: 14,
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  modifyButton: {
    flex: 1,
    backgroundColor: '#ebf8ff',
    borderWidth: 1,
    borderColor: '#bee3f8',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  modifyButtonText: {
    color: '#2b6cb0',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  checkoutButton: {
    flex: 1,
    backgroundColor: '#4299e1',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  disabledButton: {
    backgroundColor: '#e2e8f0',
  },
  disabledButtonText: {
    color: '#a0aec0',
  },
  itemCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#edf2f7',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
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
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
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
    color: '#2d3436',
    fontSize: 14,
    flex: 1,
  },
  counterWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#dfe6e9',
    borderRadius: 20,
  },
  counterButton: {
    padding: 8,
    backgroundColor: '#f5f5f5',
  },
  counterButtonText: {
    fontSize: 16,
    fontWeight: '500',
    paddingHorizontal: 8,
  },
  counterValue: {
    paddingHorizontal: 16,
    minWidth: 40,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  includesLabel: {
    marginTop: 12,
    marginBottom: 8,
    color: '#4a5568',
    fontWeight: '500',
    fontSize: 14,
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
    backgroundColor: '#4299e1',
    borderRadius: 3,
    marginTop: 6,
    marginRight: 10,
  },
  descriptionText: {
    color: '#4a5568',
    fontSize: 14,
    flex: 1,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  priceLabel: {
    color: '#4a5568',
    fontWeight: '500',
    fontSize: 14,
  },
  priceValue: {
    color: '#2d3748',
    fontWeight: '600',
    fontSize: 14,
  },
});

export default CartDialog;