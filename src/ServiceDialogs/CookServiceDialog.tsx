import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Modal,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import RazorpayCheckout from 'react-native-razorpay';
import { BookingDetails } from '../types/engagementRequest';
import { BOOKINGS } from '../Constants/pagesConstants';
import axiosInstance from '../services/axiosInstance';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { usePricingFilterService } from '../utils/PricingFilter';
import Head, { LocationData } from '../Header/Header';

// Redux actions
import { addToCart, removeFromCart, updateCartItem } from '../features/addToSlice';
import { CartDialog } from '../CartDiaog/CartDialog';
import axios from 'axios';
import { useAppUser } from '../context/AppUserContext';
import BookingService, { BookingPayload } from '../services/bookingService';
import LinearGradient from 'react-native-linear-gradient';

interface Package {
  name: string;
  price: number;
  rating: number;
  reviews: string;
  prepTime: string;
  includes: string[];
  selected?: boolean;
  persons?: number;
  inCart?: boolean;
  bookingType?: string;
  category?: string;
  jobDescription?: string;
  remarks?: string;
  basePrice?: number;
  maxPersons?: number;
}

interface MealCartItem {
  type: 'meal';
  id: string;
  mealType: string;
  persons: number;
  price: number;
  description: string;
  basePrice: number;
  maxPersons: number;
  bookingType: string;
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

const DemoCook = ({
  visible,
  onClose,
  handleClose, 
  sendDataToParent,
  user,
  providerDetails,
  bookingType,
}: any) => {
  
  const dispatch = useDispatch();
  const cart = useSelector((state: any) => state.addToCart?.items || []);
  const { getFilteredPricing, getBookingType } = usePricingFilterService();
  const { setAppUser, appUser } = useAppUser();
  
  const cookPricing = getFilteredPricing('cook');
  const [showCartDialog, setShowCartDialog] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);
  const [voucher, setVoucher] = useState('');
  const [agreementDialogOpen, setAgreementDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
//using for location fetching from head.tsx
    const [currentLocation, setCurrentLocation] = React.useState<LocationData | null>(null);

  const getBookingTypeFromPreference = (bookingPreference: string | undefined): string => {
    if (!bookingPreference) return 'MONTHLY';
    const pref = bookingPreference.toLowerCase();
    if (pref === 'date') return 'ON_DEMAND';
    if (pref === 'short term') return 'SHORT_TERM';
    return 'MONTHLY';
  };

  const getPreparationTime = (category: string): string => {
    switch(category.toLowerCase()) {
      case 'breakfast': return '30 mins preparation';
      case 'lunch': return '45 mins preparation';
      case 'dinner': return '1.5 hrs preparation';
      default: return '30 mins preparation';
    }
  };

  const getReviewsText = (category: string): string => {
    switch(category.toLowerCase()) {
      case 'breakfast': return '(2.9M reviews)';
      case 'lunch': return '(1.7M reviews)';
      case 'dinner': return '(2.7M reviews)';
      default: return '(1M reviews)';
    }
  };

  const getCategoryColor = (category: string): string => {
    switch(category.toLowerCase()) {
      case 'breakfast': return '#e17055';
      case 'lunch': return '#00b894';
      case 'dinner': return '#0984e3';
      default: return '#2d3436';
    }
  };

  // Fix: Format time for backend - more robust version
  const formatTimeForBackend = (timeString: string): string => {
    console.log("🕒 Original time string:", timeString);
    
    if (!timeString) {
      console.log("🕒 Using default time: 10:00:00");
      return '10:00:00';
    }
    
    try {
      // Handle different time formats
      let timeToFormat = timeString;
      
      // If it's a range like "10:00 AM - 2:00 PM", take the first part
      if (timeString.includes(' - ')) {
        timeToFormat = timeString.split(' - ')[0].trim();
      }
      
      // If it's already in 24-hour format with seconds, return as is
      if (/^\d{2}:\d{2}:\d{2}$/.test(timeToFormat)) {
        return timeToFormat;
      }
      
      // Parse 12-hour format
      const timeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM)/i;
      const match = timeToFormat.match(timeRegex);
      
      if (match) {
        let [_, hours, minutes, modifier] = match;
        let hourNum = parseInt(hours);
        
        if (modifier.toUpperCase() === 'PM' && hourNum !== 12) {
          hourNum += 12;
        } else if (modifier.toUpperCase() === 'AM' && hourNum === 12) {
          hourNum = 0;
        }
        
        const formattedTime = `${hourNum.toString().padStart(2, '0')}:${minutes}:00`;
        console.log("🕒 Formatted time:", formattedTime);
        return formattedTime;
      }
      
      // If no AM/PM detected, assume 24-hour format and add seconds
      if (timeToFormat.includes(':')) {
        const parts = timeToFormat.split(':');
        if (parts.length === 2) {
          const formattedTime = `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`;
          console.log("🕒 Assumed 24-hour format:", formattedTime);
          return formattedTime;
        }
      }
      
      console.log("🕒 Could not parse time, using default");
      return '10:00:00';
    } catch (error) {
      console.error("🕒 Error formatting time:", error);
      return '10:00:00';
    }
  };

  // Add this helper function to validate payload
 const validatePayload = (payload: BookingPayload) => {
  const errors: string[] = [];

  if (!payload.customerid || payload.customerid <= 0) {
    errors.push("Invalid customer ID");
  }

  // For ON_DEMAND bookings, serviceproviderid can be null/0
  // For other types, it should be valid
  const isOnDemand = payload.booking_type === "ON_DEMAND";
  if (!isOnDemand && (!payload.serviceproviderid || payload.serviceproviderid <= 0)) {
    errors.push("Invalid service provider ID");
  }

  if (!payload.start_date) {
    errors.push("Start date is required");
  }

  if (!payload.start_time || !/^\d{2}:\d{2}:\d{2}$/.test(payload.start_time)) {
    errors.push("Invalid start time format. Expected HH:MM:SS");
  }

  if (payload.booking_type === "ON_DEMAND" && !payload.end_time) {
    errors.push("End time is required for ON_DEMAND bookings");
  }

  if (!payload.base_amount || payload.base_amount <= 0) {
    errors.push("Invalid base amount");
  }

  // if (errors.length > 0) {
  //   console.error("🚨 Payload validation errors:", errors);
  //   return false;
  // }

  return true;
};

  const initialPackages = useMemo(() => {
    if (!cookPricing || cookPricing.length === 0) return [];

    return cookPricing.map((item: any) => {
      const category = item.Categories?.toLowerCase() || item.ServiceName?.toLowerCase();
      const maxPersons = parseInt(item["Numbers/Size"]?.replace('<=', '')) || 3;
      const basePrice = bookingType?.bookingPreference?.toLowerCase() === "date" 
        ? item["Price /Day (INR)"] 
        : item["Price /Month (INR)"];

      const description = item["Job Description"]?.split('\n').filter((line: string) => line.trim() !== '') || 
                         ['5-8 chapatis/parathas', '1 dry veg/non-veg item'];

      return {
        name: item.Categories || item.ServiceName || '',
        price: basePrice,
        basePrice: basePrice, // Store base price separately
        rating: 4.84,
        reviews: getReviewsText(category),
        prepTime: getPreparationTime(category),
        includes: description,
        selected: false,
        persons: 1,
        inCart: false,
        bookingType: getBookingTypeFromPreference(bookingType?.bookingPreference),
        category: category,
        jobDescription: item["Job Description"],
        remarks: item["Remarks/Conditions"],
        maxPersons: maxPersons
      };
    });
  }, [cookPricing, bookingType?.bookingPreference]);

  useEffect(() => {
    if (packages.length === 0 && initialPackages.length > 0) {
      setPackages(initialPackages);
    }
  }, [initialPackages, packages.length]);

  useEffect(() => {
    if (packages.length === 0) return;

    const updatedPackages = packages.map(pkg => {
      const cartItem = cart.find((item: any) => 
        item.type === 'meal' && item.mealType === pkg.name.toUpperCase()
      );
      
      const currentPersons = cartItem?.persons || 1;
      const calculatedPrice = calculatePriceForPersons(pkg.basePrice || pkg.price, currentPersons);
      
      return {
        ...pkg,
        selected: !!cartItem,
        persons: currentPersons,
        inCart: !!cartItem,
        price: calculatedPrice
      };
    });

    setPackages(updatedPackages);
  }, [cart]);

  const handlePersonChange = (index: number, operation: 'increment' | 'decrement') => {
    setPackages(prev => {
      const updated = [...prev];
      const currentPackage = updated[index];
      const currentPersons = currentPackage.persons || 1;
      
      let newPersons = currentPersons;
      if (operation === 'increment') {
        newPersons = currentPersons + 1;
      } else if (operation === 'decrement' && currentPersons > 1) {
        newPersons = currentPersons - 1;
      }
      
      const calculatedPrice = calculatePriceForPersons(currentPackage.basePrice || currentPackage.price, newPersons);
      
      updated[index] = {
        ...currentPackage,
        persons: newPersons,
        price: calculatedPrice
      };
      
      if (currentPackage.inCart) {
        setTimeout(() => {
          dispatch(updateCartItem({
            id: currentPackage.name.toUpperCase(),
            type: 'meal',
            updates: {
              persons: newPersons,
              price: calculatedPrice,
              description: currentPackage.includes.join(', '),
              basePrice: currentPackage.basePrice || currentPackage.price,
              maxPersons: currentPackage.maxPersons || 15,
              // bookingType: currentPackage.bookingType
            }
          }));
        }, 0);
      }
      
      return updated;
    });
  };

  const toggleCart = (index: number) => {
    setPackages(prev => {
      const updated = [...prev];
      const currentPackage = updated[index];
      const newInCartState = !currentPackage.inCart;

      setTimeout(() => {
        if (newInCartState) {
          dispatch(addToCart({
            type: 'meal',
            id: currentPackage.name.toUpperCase(),
            mealType: currentPackage.name.toUpperCase(),
            persons: currentPackage.persons || 1,
            price: currentPackage.price,
            description: currentPackage.includes.join(', '),
            basePrice: currentPackage.basePrice || currentPackage.price,
            maxPersons: currentPackage.maxPersons || 15,
            // bookingType: currentPackage.bookingType
          }));
        } else {
          dispatch(removeFromCart({
            id: currentPackage.name.toUpperCase(),
            type: 'meal'
          }));
        }
      }, 0);

      updated[index] = {
        ...currentPackage,
        inCart: newInCartState,
        selected: newInCartState
      };
      
      return updated;
    });
  };

  const prepareCartForCheckout = () => {
    // Clear all existing cart items of type 'meal'
    dispatch(removeFromCart({ type: 'meal' }));

    // Add only the currently selected packages
    packages.forEach(pkg => {
      if (pkg.selected) {
        dispatch(addToCart({
          type: 'meal',
          id: pkg.name.toUpperCase(),
          mealType: pkg.name.toUpperCase(),
          persons: pkg.persons || 1,
          price: pkg.price,
          description: pkg.includes.join(', '),
          basePrice: pkg.basePrice || pkg.price,
          maxPersons: pkg.maxPersons || 15,
          // bookingType: pkg.bookingType
        }));
      }
    });
  };

  const handleOpenCartDialog = () => {
    const selectedPackages = packages.filter(pkg => pkg.selected);
    if (selectedPackages.length === 0) {
      Alert.alert("Please select at least one package");
      return;
    }

    prepareCartForCheckout();
    setShowCartDialog(true);
  };

const handleCheckout = async () => {
  try {
    setLoading(true);

    const selectedPackages = packages.filter(pkg => pkg.selected);
    
    if (selectedPackages.length === 0) {
      Alert.alert("Error", "Please select at least one package");
      setLoading(false);
      return;
    }

    const baseTotal = selectedPackages.reduce((sum, pkg) => sum + pkg.price, 0);
    const customerId = appUser?.customerid || user?.customerid || 19;

    const responsibilities = {
      tasks: selectedPackages.map(pkg => ({
        taskType: pkg.name.charAt(0).toUpperCase() + pkg.name.slice(1),
        persons: pkg.persons || 1
      }))
    };

    // Format start_time properly
    const currentBookingType = getBookingTypeFromPreference(bookingType?.bookingPreference);
    const startTime = formatTimeForBackend(bookingType?.timeRange);

    // Conditional serviceproviderid logic - FIXED
    const isOnDemand = currentBookingType === "ON_DEMAND";
    
    // Handle serviceproviderid properly to match BookingPayload type
    let serviceproviderid: number | null = null;
    if (!isOnDemand && providerDetails?.serviceproviderId) {
      serviceproviderid = Number(providerDetails.serviceproviderId);
    }

    console.log("Determined serviceproviderid:", bookingType);

    const demoForStartTime = bookingType?.timeRange.split("-");
    console.log("Demo for start time :", demoForStartTime + ":00")
    // Prepare payload matching BookingPayload interface
    const payload: BookingPayload = {
      customerid: customerId,
      serviceproviderid: serviceproviderid, // Now properly typed as number | null
      start_date: bookingType?.demoForStartTime || new Date().toISOString().split("T")[0],
      end_date: bookingType?.end_Date || new Date().toISOString().split("T")[0],
      responsibilities: responsibilities,
      booking_type: currentBookingType,
      taskStatus: "NOT_STARTED",
      service_type: "COOK",
      base_amount: baseTotal,
      payment_mode: "razorpay",
      start_time: demoForStartTime[0].trim()
    };

    console.log("Prepared booking payload:", payload);


    console.log("📦 Booking payload:", JSON.stringify(payload, null, 2));
    console.log(`🔍 Booking Type: ${currentBookingType}, Service Provider ID: ${serviceproviderid}`);

    // Validate payload before sending
    if (!validatePayload(payload)) {
      Alert.alert("Validation Error", "Please check your booking details");
      setLoading(false);
      return;
    }

    // ✅ Use the bookAndPay method exactly like in React web version
    console.log("🚀 Calling BookingService.bookAndPay...");
    const result = await BookingService.bookAndPay(payload);
    
    console.log("✅ bookAndPay result:", result);

    // ✅ Success handling - matching your React web version
    setSnackbarMessage(result?.verifyResult?.message || "Booking & Payment Successful ✅");
    setSnackbarSeverity("success");
    setSnackbarVisible(true);

    // Clear cart and close dialogs
    selectedPackages.forEach(pkg => {
      dispatch(removeFromCart({
        id: pkg.name.toUpperCase(),
        type: 'meal'
      }));
    });

    if (sendDataToParent) {
      sendDataToParent(BOOKINGS);
    }
    
    setTimeout(() => {
      setShowCartDialog(false);
      onClose();
    }, 2000);

  } catch (error: any) {
    console.error('❌ Checkout error:', error);
    
    // ✅ Enhanced error handling - matching your React web version
    let backendMessage = "Failed to initiate payment";
    
    if (error?.response?.data) {
      if (typeof error.response.data === "string") {
        backendMessage = error.response.data;
      } else if (error.response.data.error) {
        backendMessage = error.response.data.error;
      } else if (error.response.data.message) {
        backendMessage = error.response.data.message;
      }
    } else if (error.message) {
      backendMessage = error.message;
    }

    // Handle Razorpay specific errors
    if (error?.code) {
      switch (error.code) {
        case 0:
          backendMessage = "Payment cancelled by user";
          break;
        case 1:
          backendMessage = "Payment failed. Please try again.";
          break;
        case 2:
          backendMessage = "Network error. Please check your internet connection.";
          break;
        default:
          backendMessage = error.description || "Payment failed";
      }
    }

    setSnackbarMessage(backendMessage);
    setSnackbarSeverity("error");
    setSnackbarVisible(true);
  } finally {
    setLoading(false);
  }
};

  const getTotal = () => {
    return packages.reduce((sum, pkg) => {
      if (!pkg.inCart) return sum;
      return sum + pkg.price;
    }, 0);
  };

  const totalPersons = packages.reduce((sum, pkg) => {
    if (!pkg.inCart) return sum;
    return sum + (pkg.persons || 1);
  }, 0);

  const selectedCount = packages.filter(pkg => pkg.inCart).length;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
           <LinearGradient
                                  colors={["#0a2a66ff", "#004aadff"]}
                                  start={{ x: 0, y: 0 }}
                                  end={{ x: 1, y: 0 }}
                                  style={styles.linearGradient}
                                >
          {/* <View style={styles.header}> */}
            {/* <TouchableOpacity onPress={handleClose} style={styles.backIcon}>
              <Icon name="arrow-back" size={24} color="#333" />
            </TouchableOpacity> */}
            <Text style={styles.headtitle}>MEAL PACKAGES</Text>
            {/* <TouchableOpacity onPress={onClose} style={styles.closeIcon}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity> */}
          {/* </View> */}
          </LinearGradient>
          
          <ScrollView style={styles.scrollView}>
            <View style={styles.packagesContainer}>
              {packages.map((pkg, index) => {
                const categoryColor = getCategoryColor(pkg.category || pkg.name);
                const currentPersons = pkg.persons || 1;
                const maxPersons = pkg.maxPersons || 3;
                
                return (
                  <View key={index} style={[
                    styles.packageCard, 
                    pkg.inCart && styles.selectedPackage,
                    { borderLeftColor: categoryColor }
                  ]}>
                    <View style={styles.packageHeader}>
                      <View>
                        <Text style={styles.packageTitle}>{pkg.name}</Text>
                        <View style={styles.ratingContainer}>
                          <Text style={[styles.ratingValue, { color: categoryColor }]}>{pkg.rating}</Text>
                          <Text style={styles.reviewsText}>{pkg.reviews}</Text>
                        </View>
                        <Text style={styles.bookingTypeText}>
                          {pkg.bookingType === 'ON_DEMAND' ? 'On Demand' : 'Regular'} • {pkg.bookingType === 'ON_DEMAND' ? 'Per Day' : 'Per Month'}
                        </Text>
                      </View>
                      <View style={styles.priceContainer}>
                        <Text style={[styles.priceValue, { color: categoryColor }]}>
                          ₹{pkg.price.toFixed(2)}
                        </Text>
                        <Text style={styles.preparationTime}>{pkg.prepTime}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.personsControl}>
                      <Text style={styles.personsLabel}>Persons:</Text>
                      <View style={styles.personsInput}>
                        <TouchableOpacity 
                          style={[
                            styles.decrementButton,
                            currentPersons <= 1 && styles.disabledButton
                          ]}
                          onPress={() => handlePersonChange(index, 'decrement')}
                          disabled={currentPersons <= 1}
                        >
                          <Text style={styles.buttonText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.personsValue}>
                          {currentPersons}
                        </Text>
                        <TouchableOpacity 
                          style={[
                            styles.incrementButton,
                            currentPersons >= 15 && styles.disabledButton
                          ]}
                          onPress={() => handlePersonChange(index, 'increment')}
                          disabled={currentPersons >= 15}
                        >
                          <Text style={styles.buttonText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    {currentPersons > maxPersons && (
                      <Text style={styles.additionalCharges}>*Additional charges applied</Text>
                    )}
                    
                    <View style={styles.descriptionList}>
                      {pkg.includes.map((item, i) => (
                        <View key={i} style={styles.descriptionItem}>
                          <Text style={styles.descriptionBullet}>•</Text>
                          <Text style={styles.descriptionText}>{item}</Text>
                        </View>
                      ))}

                    </View>

                    <TouchableOpacity
                      style={[
                        styles.cartButton,
                        pkg.inCart && { backgroundColor: categoryColor, borderColor: categoryColor }
                      ]}
                      onPress={() => toggleCart(index)}
                    >
                      {pkg.inCart ? (
                        <Icon name="remove-shopping-cart" size={20} color="white" />
                      ) : (
                        <Icon name="add-shopping-cart" size={20} color={categoryColor} />
                      )}
                      <Text style={[
                        styles.cartButtonText,
                        pkg.inCart && styles.selectedCartButtonText,
                        !pkg.inCart && { color: categoryColor }
                      ]}>
                        {pkg.inCart ? 'REMOVE FROM CART' : 'ADD TO CART'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </ScrollView>
          
          <View style={styles.footerContainer}>
            <View style={styles.voucherContainer}>
              <TextInput
                style={styles.voucherInput}
                placeholder="Enter voucher code"
                placeholderTextColor="#999"
                value={voucher}
                onChangeText={setVoucher}
              />
              <TouchableOpacity style={styles.voucherButton}>
                <Text style={styles.voucherButtonText}>Apply Voucher</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.totalContainer}>
              <Text style={styles.footerText}>
                Total for {selectedCount} item{selectedCount !== 1 ? 's' : ''} ({totalPersons} person{totalPersons !== 1 ? 's' : ''})
              </Text>
              <Text style={styles.footerPrice}>
                ₹{getTotal().toFixed(2)}
              </Text>
            </View>
            
            <View style={styles.footerButtons}>
              <TouchableOpacity 
                style={styles.closeFooterButton}
                onPress={onClose}
              >
                <Text style={styles.closeFooterButtonText}>CLOSE</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.checkoutButton,
                  selectedCount === 0 && styles.disabledButton
                ]}
                onPress={handleOpenCartDialog}
                disabled={selectedCount === 0 || loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.checkoutButtonText}>CHECKOUT</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* Cart Dialog */}
      {/* <CartDialog
        open={showCartDialog}
        handleClose={() => setShowCartDialog(false)}
        handleCheckout={handleCheckout}
        // loading={loading}
      /> */}
      <CartDialog
  open={showCartDialog}
  handleClose={() => setShowCartDialog(false)}
  handleCheckout={handleCheckout} // This should work now
/>

      {/* Snackbar for notifications */}
      <Modal
        visible={snackbarVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSnackbarVisible(false)}
      >
        <View style={styles.snackbarOverlay}>
          <View style={[
            styles.snackbar,
            snackbarSeverity === 'success' ? styles.snackbarSuccess : styles.snackbarError
          ]}>
            <Text style={styles.snackbarText}>{snackbarMessage}</Text>
            <TouchableOpacity onPress={() => setSnackbarVisible(false)}>
              <Icon name="close" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const { height } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    borderRadius: 15,
    maxHeight: height * 0.85,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
     linearGradient: {
    padding: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  headtitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  // header: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   alignItems: 'center',
  //   padding: 20,
  //   borderBottomWidth: 1,
  //   borderBottomColor: '#eee',
  // },
  dialogTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeIcon: {
    padding: 5,
  },
  scrollView: {
    paddingHorizontal: 10,
  },
  packagesContainer: {
    marginBottom: 20,
  },
  packageCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#eee',
    borderLeftWidth: 5,
  },
  selectedPackage: {
    borderColor: '#3399cc',
    borderWidth: 2,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  packageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  bookingTypeText: {
    fontSize: 12,
    color: '#666',
    marginTop: 3,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 5,
  },
  reviewsText: {
    fontSize: 12,
    color: '#666',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  preparationTime: {
    fontSize: 12,
    color: '#666',
  },
  personsControl: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  personsLabel: {
    fontSize: 14,
    marginRight: 10,
    color: '#333',
  },
  personsInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  decrementButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  incrementButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#e0e0e0',
  },
  buttonText: {
    fontSize: 18,
    color: '#333',
  },
  personsValue: {
    marginHorizontal: 15,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  additionalCharges: {
    fontSize: 12,
    color: '#e74c3c',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  descriptionList: {
    marginBottom: 15,
  },
  descriptionItem: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  descriptionBullet: {
    marginRight: 10,
    color: '#666',
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  cartButton: {
    paddingVertical: 12,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#3399cc',
  },
  cartButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
    color: '#3399cc',
  },
  selectedCartButtonText: {
    color: 'white',
  },
  footerContainer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#f9f9f9',
  },
  voucherContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    justifyContent: 'space-between',
  },
  voucherInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginRight: 10,
    backgroundColor: '#fff',
  },
  voucherButton: {
    backgroundColor: '#3399cc',
    borderRadius: 5,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voucherButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  totalContainer: {
    marginBottom: 15,
  },
  footerText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  footerPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  footerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  closeFooterButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 9,
    backgroundColor: '#f0f0f0',
       borderWidth: 1,
     borderColor: "#007AFF",
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  closeFooterButtonText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  checkoutButton: {
    flex: 1,
    backgroundColor: '#3399cc',
    borderRadius: 5,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // disabledButton: {
  //   backgroundColor: '#ccc',
  // },
  checkoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  backIcon: {
    padding: 5,
    marginRight: 10,
  },
  snackbarOverlay: {
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  snackbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  snackbarSuccess: {
    backgroundColor: '#4caf50',
  },
  snackbarError: {
    backgroundColor: '#f44336',
  },
  snackbarText: {
    color: 'white',
    fontSize: 14,
    flex: 1,
    marginRight: 10,
  },
});

export default DemoCook;