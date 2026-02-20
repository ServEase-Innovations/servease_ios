import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
  BackHandler
} from 'react-native';
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { BookingDetails } from '../types/engagementRequest';
import { BOOKINGS } from '../Constants/pagesConstants';
import { EnhancedProviderDetails } from '../types/ProviderDetailsType';
import axiosInstance from '../services/axiosInstance';
import { addToCart, removeFromCart, selectCartItems } from '../features/addToSlice';
import { isMaidCartItem } from '../types/cartSlice';
import RazorpayCheckout from 'react-native-razorpay';
import { usePricingFilterService } from '../utils/PricingFilter';
import BookingService, { BookingPayload } from '../services/bookingService';
import { useAppUser } from '../context/AppUserContext';
import LinearGradient from "react-native-linear-gradient";

interface MaidServiceDialogProps {
  open: boolean;
  handleClose: () => void;
  providerDetails?: EnhancedProviderDetails;
  sendDataToParent?: (data: string) => void;
  user?: any;
  bookingType?: any;
}

// Define cart item types
type CartItemKey = 
  | 'utensilCleaning'
  | 'sweepingMopping'
  | 'bathroomCleaning'
  | 'bathroomDeepCleaning'
  | 'normalDusting'
  | 'deepDusting'
  | 'utensilDrying'
  | 'clothesDrying';

type CartItemsType = Record<CartItemKey, boolean>;

// Type guard to check if a string is a valid cart item key
function isCartItemKey(key: string): key is CartItemKey {
  return [
    'utensilCleaning',
    'sweepingMopping',
    'bathroomCleaning',
    'bathroomDeepCleaning',
    'normalDusting',
    'deepDusting',
    'utensilDrying',
    'clothesDrying'
  ].includes(key);
}

type HouseSize = '1BHK' | '2BHK' | '3BHK' | '4BHK+';

type PackageState = {
  utensilCleaning: { persons: number };
  sweepingMopping: { houseSize: HouseSize };
  bathroomCleaning: { bathrooms: number };
};

// --- Pricing helper ---
const getBasePrice = (service: any, bookingType: any) => {
  const basePrice =
    bookingType?.bookingPreference?.toLowerCase() === 'date'
      ? service?.["Price /Day (INR)"]
      : service?.["Price /Month (INR)"];
  return basePrice || 0;
};

// --- Types that mirror the pricing dataset ---
interface MaidPricingRow {
  _id?: string;
  Service?: string; // e.g. "Maid"
  Type?: string;    // e.g. "On Demand" | "Monthly" | etc.
  Categories?: string; // e.g. "Utensil Cleaning"
  'Sub-Categories'?: string; // e.g. "People" | "House Size" | "Bathrooms"
  'Numbers/Size'?: string; // e.g. "<=3", "4-6", "2BHK"
  'Price /Day (INR)'?: number;
  'Price /Month (INR)'?: number;
  'Price /Visit (INR)'?: number;
  'Price /Week (INR)'?: number;
  'Job Description'?: string;
}

const monthlyFromDaily = (daily?: number) => (daily ? Math.round(daily * 26) : 0); // business days heuristic
const monthlyFromWeekly = (weekly?: number) => (weekly ? Math.round(weekly * 4) : 0);
const monthlyFromVisit = (perVisit?: number, visitsPerMonth = 8) => (perVisit ? Math.round(perVisit * visitsPerMonth) : 0); // fallback

// checks if a numeric value satisfies a textual range like "<=3", ">=7", "4-6"
const matchesNumericBand = (band: string, value: number) => {
  const s = band.trim();
  if (/^<=\s*\d+$/i.test(s)) return value <= parseInt(s.replace(/[^\d]/g, ''), 10);
  if (/^>=\s*\d+$/i.test(s)) return value >= parseInt(s.replace(/[^\d]/g, ''), 10);
  const range = s.match(/^(\d+)\s*-\s*(\d+)$/);
  if (range) {
    const min = parseInt(range[1], 10);
    const max = parseInt(range[2], 10);
    return value >= min && value <= max;
  }
  // If band is a single number, compare directly
  if (/^\d+$/.test(s)) return value === parseInt(s, 10);
  return false;
};

const MaidServiceDialog: React.FC<MaidServiceDialogProps> = ({ 
  open, 
  handleClose, 
  providerDetails,
  sendDataToParent,
  user,
  bookingType
}) => {
  const [activeTab, setActiveTab] = useState('regular');
  const allCartItems = useSelector(selectCartItems);
  const maidCartItems = allCartItems.filter(isMaidCartItem);
  const [loading, setLoading] = useState(false);
  
  // Use the pricing filter service
  const { getFilteredPricing } = usePricingFilterService();
  const maidPricing = getFilteredPricing('maid');
  console.log('Maid Pricing Data:', maidPricing);

  const [cartItems, setCartItems] = useState<CartItemsType>(() => {
    const initialCartItems: CartItemsType = {
      utensilCleaning: false,
      sweepingMopping: false,
      bathroomCleaning: false,
      bathroomDeepCleaning: false,
      normalDusting: false,
      deepDusting: false,
      utensilDrying: false,
      clothesDrying: false
    };

    maidCartItems.forEach(item => {
      if ((item.serviceType === 'package' || item.serviceType === 'addon') && isCartItemKey(item.name)) {
        initialCartItems[item.name] = true;
      }
    });

    return initialCartItems;
  });

  const [packageStates, setPackageStates] = useState<PackageState>({
    utensilCleaning: { persons: 3 },
    sweepingMopping: { houseSize: '2BHK' },
    bathroomCleaning: { bathrooms: 2 }
  });
  
  const dispatch = useDispatch();
  const { setAppUser, appUser } = useAppUser();
  
  const users = useSelector((state: any) => state.user?.value);
  const currentLocation = users?.customerDetails?.currentLocation;
  const providerFullName = `${providerDetails?.firstName} ${providerDetails?.lastName}`;
  const customerId = appUser?.customerid || user?.customerid || 19;

  // Normalize pricing source
  const maidPricingRows: MaidPricingRow[] = useMemo(() => {
    const asArray = (data: any): MaidPricingRow[] => {
      if (!data) return [];
      if (Array.isArray(data)) return data as MaidPricingRow[];
      // Some stores keep it grouped by category; flatten if needed
      if (typeof data === 'object') {
        const flat: MaidPricingRow[] = [];
        Object.values(data).forEach((v: any) => {
          if (Array.isArray(v)) flat.push(...(v as MaidPricingRow[]));
        });
        return flat;
      }
      return [];
    };
    return asArray(maidPricing);
  }, [maidPricing]);

  // Get booking type from preference
  const getBookingTypeFromPreference = (bookingPreference: string | undefined): string => {
    if (!bookingPreference) return 'MONTHLY';
    const pref = bookingPreference.toLowerCase();
    if (pref === 'date') return 'ON_DEMAND';
    if (pref === 'short term') return 'SHORT_TERM';
    return 'MONTHLY';
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handlePersonChange = (operation: string) => {
    setPackageStates(prev => ({
      ...prev,
      utensilCleaning: {
        ...prev.utensilCleaning,
        persons: operation === 'increment' 
          ? Math.min(prev.utensilCleaning.persons + 1, 10)
          : Math.max(prev.utensilCleaning.persons - 1, 1)
      }
    }));
  };

  const handleHouseSizeChange = (operation: string) => {
    const sizes: HouseSize[] = ['1BHK', '2BHK', '3BHK', '4BHK+'];
    const currentIndex = sizes.indexOf(packageStates.sweepingMopping.houseSize);
    
    setPackageStates(prev => ({
      ...prev,
      sweepingMopping: {
        ...prev.sweepingMopping,
        houseSize: operation === 'increment' 
          ? sizes[Math.min(currentIndex + 1, sizes.length - 1)]
          : sizes[Math.max(currentIndex - 1, 0)]
      }
    }));
  };

  const handleBathroomChange = (operation: string) => {
    setPackageStates(prev => ({
      ...prev,
      bathroomCleaning: {
        ...prev.bathroomCleaning,
        bathrooms: operation === 'increment' 
          ? Math.min(prev.bathroomCleaning.bathrooms + 1, 5)
          : Math.max(prev.bathroomCleaning.bathrooms - 1, 1)
      }
    }));
  };

  // ------- DYNAMIC PRICING HELPERS -------
  const findRow = (
    category: string,
    subCategory?: string,
    sizeLabelOrBand?: string,
    numericForBand?: number,
    preferOnDemand: boolean = false
  ): MaidPricingRow | undefined => {
    if (!maidPricingRows.length) return undefined;

    // base rows for the category
    const rows = maidPricingRows.filter(
      (r) =>
        String(r.Service || '').toLowerCase() === 'maid' &&
        String(r.Categories || '').toLowerCase() === category.toLowerCase()
    );

    if (!rows.length) return undefined;

    // filter by sub-category if provided
    const rowsSub = subCategory
      ? rows.filter((r) => String(r['Sub-Categories'] || '').toLowerCase() === subCategory.toLowerCase())
      : rows;

    if (!rowsSub.length) return undefined;

    // prefer rows based on booking type
    const prefStr = preferOnDemand ? 'on demand' : 'regular';
    const prefCandidates = rowsSub.filter(
      (r) => String(r.Type || '').toLowerCase().includes(prefStr)
    );

    const candidates = prefCandidates.length ? prefCandidates : rowsSub;

    // Prefer exact size label match
    if (sizeLabelOrBand) {
      const exact = candidates.find(
        (r) => String(r['Numbers/Size'] || '').toLowerCase() === String(sizeLabelOrBand).toLowerCase()
      );
      if (exact) return exact;

      if (numericForBand) {
        const bandHit = candidates.find(
          (r) =>
            r['Numbers/Size'] &&
            matchesNumericBand(String(r['Numbers/Size']), numericForBand)
        );
        if (bandHit) return bandHit;
      }
    }

    return candidates[0];
  };

  const priceToMonthly = (row?: MaidPricingRow): number => {
    if (!row) return 0;
    if (row['Price /Month (INR)']) return row['Price /Month (INR)'] as number;
    if (row['Price /Week (INR)']) return monthlyFromWeekly(row['Price /Week (INR)']);
    if (row['Price /Visit (INR)']) return monthlyFromVisit(row['Price /Visit (INR)']);
    if (row['Price /Day (INR)']) return monthlyFromDaily(row['Price /Day (INR)']);
    return 0;
  };

  // Updated pricing functions using the same logic as React code
  const getPackagePrice = (packageName: CartItemKey): number => {
    const preferOnDemand = bookingType?.bookingPreference?.toLowerCase() === 'date';

    switch (packageName) {
      case 'utensilCleaning': {
        const persons = packageStates.utensilCleaning.persons;
        const row = findRow('Utensil Cleaning', 'People', undefined, persons, preferOnDemand);
        return getBasePrice(row, bookingType) || 1200;
      }
      case 'sweepingMopping': {
        const size = packageStates.sweepingMopping.houseSize;
        const preferOnDemand = bookingType?.bookingPreference?.toLowerCase() === 'date';

        // use "House" instead of "House Size"
        const row = findRow('Sweeping & Mopping', 'House', size, undefined, preferOnDemand);

        return getBasePrice(row, bookingType) || 1200;
      }
      case 'bathroomCleaning': {
        const bathrooms = packageStates.bathroomCleaning.bathrooms;
        const preferOnDemand = bookingType?.bookingPreference?.toLowerCase() === 'date';

        const row = findRow('Bathroom', 'Number', undefined, bathrooms, preferOnDemand);

        return getBasePrice(row, bookingType) || 600;
      }
      default:
        return 0;
    }
  };

  const getAddOnPrice = (addOnName: CartItemKey): number => {
    const map: Record<string, { cat: string; sub?: string; size?: string }> = {
      bathroomDeepCleaning: { cat: 'Bathroom -Deep Cleaning', sub: 'Number' },
      normalDusting:        { cat: 'Normal Dusting', sub: 'House' },
      deepDusting:          { cat: 'Deep Dusting', sub: 'House' },
      utensilDrying:        { cat: 'Utensil Drying & Arrangements', sub: 'People', size: '<=3' },
      clothesDrying:        { cat: 'Clothes Drying and Folding', sub: 'People', size: '<=3' },
    };

    const meta = map[addOnName];
    if (!meta) return 0;

    const preferOnDemand = bookingType?.bookingPreference?.toLowerCase() === 'date';
    const row = findRow(meta.cat, meta.sub, meta.size, undefined, preferOnDemand);

    const price = getBasePrice(row, bookingType);
    if (price && price > 0) return price;

    // fallback defaults
    switch (addOnName) {
      case 'deepDusting': return 1500;
      default: return 1000;
    }
  };

  const getPackageDescription = (packageName: CartItemKey): string => {
    switch(packageName) {
      case 'utensilCleaning': 
        return 'All kind of daily utensil cleaning\nParty used type utensil cleaning';
      case 'sweepingMopping':
        return 'Daily sweeping and mopping';
      case 'bathroomCleaning':
        return 'Weekly cleaning of bathrooms';
      default: return '';
    }
  };

  const getPackageDetails = (packageName: CartItemKey) => {
    switch(packageName) {
      case 'utensilCleaning':
        return { persons: packageStates.utensilCleaning.persons };
      case 'sweepingMopping':
        return { houseSize: packageStates.sweepingMopping.houseSize };
      case 'bathroomCleaning':
        return { bathrooms: packageStates.bathroomCleaning.bathrooms };
      default: return {};
    }
  };

  const getAddOnDescription = (addOnName: CartItemKey): string => {
    switch(addOnName) {
      case 'bathroomDeepCleaning':
        return 'Weekly cleaning of bathrooms, all bathroom walls cleaned';
      case 'normalDusting':
        return 'Daily furniture dusting, doors, carpet, bed making';
      case 'deepDusting':
        return 'Includes chemical agents cleaning: décor items, furniture';
      case 'utensilDrying':
        return 'Househelp will dry and make proper arrangements';
      case 'clothesDrying':
        return 'Househelp will get clothes from/to drying place';
      default: return '';
    }
  };

  useEffect(() => {
    const backAction = () => {
      handleClose();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, []);

  const handleAddPackageToCart = (packageName: CartItemKey) => {
    const packageDetails = {
      id: `package_${packageName}`,
      type: 'maid' as const,
      serviceType: 'package' as const,
      name: packageName,
      price: getPackagePrice(packageName),
      description: getPackageDescription(packageName),
      details: getPackageDetails(packageName)
    };

    if (cartItems[packageName]) {
      dispatch(removeFromCart({ id: packageDetails.id, type: 'maid' }));
    } else {
      dispatch(addToCart(packageDetails));
    }

    setCartItems(prev => ({
      ...prev,
      [packageName]: !prev[packageName]
    }));
  };

  const handleAddAddOnToCart = (addOnName: CartItemKey) => {
    const addOnDetails = {
      id: `addon_${addOnName}`,
      type: 'maid' as const,
      serviceType: 'addon' as const,
      name: addOnName,
      price: getAddOnPrice(addOnName),
      description: getAddOnDescription(addOnName)
    };

    if (cartItems[addOnName]) {
      dispatch(removeFromCart({ id: addOnDetails.id, type: 'maid' }));
    } else {
      dispatch(addToCart(addOnDetails));
    }

    setCartItems(prev => ({
      ...prev,
      [addOnName]: !prev[addOnName]
    }));
  };

  const calculateTotal = () => {
    let total = 0;
    
    // Packages
    if (cartItems.utensilCleaning) total += getPackagePrice('utensilCleaning');
    if (cartItems.sweepingMopping) total += getPackagePrice('sweepingMopping');
    if (cartItems.bathroomCleaning) total += getPackagePrice('bathroomCleaning');
    
    // Add-ons
    if (cartItems.bathroomDeepCleaning) total += getAddOnPrice('bathroomDeepCleaning');
    if (cartItems.normalDusting) total += getAddOnPrice('normalDusting');
    if (cartItems.deepDusting) total += getAddOnPrice('deepDusting');
    if (cartItems.utensilDrying) total += getAddOnPrice('utensilDrying');
    if (cartItems.clothesDrying) total += getAddOnPrice('clothesDrying');
    
    return total;
  };
  
  const countSelectedItems = () => {
    return Object.values(cartItems).filter(item => item).length;
  };

  // Get price display text based on booking type
  const getPriceDisplayText = () => {
    return bookingType?.bookingPreference?.toLowerCase() === 'date' ? 'Per Day' : 'Monthly service';
  };
  
  const handleCheckout = async () => {
    try {
      setLoading(true);

      const selectedServices = maidCartItems.filter(isMaidCartItem);
      const baseTotal = selectedServices.reduce((sum, item) => sum + (item.price || 0), 0);
      
      if (baseTotal <= 0) {
        Alert.alert('Warning', 'No items selected for checkout');
        setLoading(false);
        return;
      }

      const customerId = appUser?.customerid || user?.customerid || "guest-id";
      
      // Separate packages and add-ons
      const packages = selectedServices.filter(item => item.serviceType === "package");
      const addOns = selectedServices.filter(item => item.serviceType === "addon");

      // Format responsibilities
      const responsibilities = {
        tasks: packages.map(item => {
          if (item.name === "utensilCleaning") {
            return { 
              taskType: "Utensil Cleaning", 
              persons: item.details?.persons || 1 
            };
          }
          if (item.name === "sweepingMopping") {
            return { 
              taskType: "Sweeping & Mopping", 
              houseSize: item.details?.houseSize || "2BHK" 
            };
          }
          if (item.name === "bathroomCleaning") {
            return { 
              taskType: "Bathroom Cleaning", 
              bathrooms: item.details?.bathrooms || 1 
            };
          }
          return { taskType: item.name };
        }),
        add_ons: addOns.map(item => ({ 
          taskType: item.name 
        }))
      };

      // Get booking type
      const currentBookingType = getBookingTypeFromPreference(bookingType?.bookingPreference);
      const isOnDemand = currentBookingType === "ON_DEMAND";
      
      // Format time properly
      const formatTimeForBackend = (timeString: string): string => {
        console.log("🕒 Original time string:", timeString);
        
        if (!timeString) {
          return '10:00:00';
        }
        
        try {
          let timeToFormat = timeString;
          
          if (timeString.includes(' - ')) {
            timeToFormat = timeString.split(' - ')[0].trim();
          }
          
          if (/^\d{2}:\d{2}:\d{2}$/.test(timeToFormat)) {
            return timeToFormat;
          }
          
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
            
            return `${hourNum.toString().padStart(2, '0')}:${minutes}:00`;
          }
          
          if (timeToFormat.includes(':')) {
            const parts = timeToFormat.split(':');
            if (parts.length === 2) {
              return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`;
            }
          }
          
          return '10:00:00';
        } catch (error) {
          console.error("🕒 Error formatting time:", error);
          return '10:00:00';
        }
      };

      // Calculate times
      const startTime = formatTimeForBackend(bookingType?.timeRange);
      let endTime = '';
      
      if (isOnDemand) {
        try {
          const [hours, minutes] = startTime.split(':').map(Number);
          let endHours = hours + 1;
          if (endHours >= 24) endHours -= 24;
          endTime = `${endHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
        } catch (error) {
          endTime = formatTimeForBackend('06:00 PM');
        }
      }

      // Prepare payload
      const payload: BookingPayload = {
        customerid: customerId,
        serviceproviderid: providerDetails?.serviceproviderId
          ? Number(providerDetails.serviceproviderId)
          : 0,
        start_date: bookingType?.startDate || new Date().toISOString().split("T")[0],
        end_date: bookingType?.endDate || new Date().toISOString().split("T")[0],
        start_time: startTime,
        responsibilities: responsibilities,
        booking_type: currentBookingType,
        taskStatus: "NOT_STARTED",
        service_type: "MAID",
        base_amount: baseTotal,
        payment_mode: "razorpay",
        ...(isOnDemand && {
          end_time: endTime,
        }),
      };

      console.log("Final Maid Service Payload:", JSON.stringify(payload, null, 2));

      // ✅ Use ONLY BookingService.bookAndPay - it handles Razorpay internally
      console.log("🚀 Calling BookingService.bookAndPay...");
      const result = await BookingService.bookAndPay(payload);
      
      console.log("✅ bookAndPay result:", result);

      // Success handling
      Alert.alert(
        "Success ✅", 
        result?.verifyResult?.message || "Maid Service Booking & Payment Successful",
        [
          {
            text: "OK",
            onPress: () => {
              if (sendDataToParent) {
                sendDataToParent(BOOKINGS);
              }
              handleClose();
            }
          }
        ]
      );

    } catch (error: any) {
      console.error('❌ Checkout error:', error);
      
      let backendMessage = "Failed to complete booking";
      
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

      Alert.alert("Error", backendMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Modal
      visible={open}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={["#0a2a66ff", "#004aadff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.linearGradient}
          >
            <View style={styles.headerContainer}>
              <Text style={styles.headtitle}>MAID SERVICE PACKAGES</Text>
              
              <TouchableOpacity onPress={handleClose} style={styles.closeIcon}>
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
          
          <ScrollView style={styles.scrollView}>
            <View style={styles.tabsContainer}>
              <TouchableOpacity 
                style={[styles.tabButton, activeTab === 'regular' && styles.activeTab]}
                onPress={() => handleTabChange('regular')}
              >
                <Text style={[styles.tabText, activeTab === 'regular' && styles.activeTabText]}>
                  Regular Services
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.packagesContainer}>
              {/* Utensil Cleaning Package */}
              <View style={[
                styles.packageCard, 
                cartItems.utensilCleaning && styles.selectedPackage,
                { borderLeftColor: '#0984e3' }
              ]}>
                <View style={styles.packageHeader}>
                  <View>
                    <Text style={styles.packageTitle}>Utensil Cleaning</Text>
                    <View style={styles.ratingContainer}>
                      <Text style={[styles.ratingValue, { color: '#0984e3' }]}>4.7</Text>
                      <Text style={styles.reviewsText}>(1.2M reviews)</Text>
                    </View>
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={[styles.priceValue, { color: '#0984e3' }]}>
                      ₹{getPackagePrice('utensilCleaning').toLocaleString('en-IN')}
                    </Text>
                    <Text style={styles.preparationTime}>
                      {getPriceDisplayText()}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.personsControl}>
                  <Text style={styles.personsLabel}>Persons:</Text>
                  <View style={styles.personsInput}>
                    <TouchableOpacity 
                      style={[
                        styles.decrementButton,
                        cartItems.utensilCleaning && styles.selectedIncrementButton
                      ]}
                      onPress={() => handlePersonChange('decrement')}
                    >
                      <Text style={[
                        styles.buttonText,
                        cartItems.utensilCleaning && styles.selectedButtonText
                      ]}>−</Text>
                    </TouchableOpacity>
                    
                    <Text style={[
                      styles.personsValue,
                      cartItems.utensilCleaning && styles.selectedPersonsValue
                    ]}>
                      {packageStates.utensilCleaning.persons}
                    </Text>
                    
                    <TouchableOpacity 
                      style={[
                        styles.incrementButton,
                        cartItems.utensilCleaning && styles.selectedIncrementButton
                      ]}
                      onPress={() => handlePersonChange('increment')}
                    >
                      <Text style={[
                        styles.buttonText,
                        cartItems.utensilCleaning && styles.selectedButtonText
                      ]}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.descriptionList}>
                  <View style={styles.descriptionItem}>
                    <Text style={styles.descriptionBullet}>•</Text>
                    <Text style={styles.descriptionText}>All kind of daily utensil cleaning</Text>
                  </View>
                  <View style={styles.descriptionItem}>
                    <Text style={styles.descriptionBullet}>•</Text>
                    <Text style={styles.descriptionText}>Party used type utensil cleaning</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.cartButton,
                    cartItems.utensilCleaning && styles.selectedCartButton,
                    { borderColor: '#0984e3' }
                  ]}
                  onPress={() => handleAddPackageToCart('utensilCleaning')}
                >
                  {cartItems.utensilCleaning ? (
                    <Icon name="remove-shopping-cart" size={20} color="#fff" />
                  ) : (
                    <Icon name="add-shopping-cart" size={20} color="#0984e3" />
                  )}
                  <Text style={[
                    styles.cartButtonText,
                    cartItems.utensilCleaning && styles.selectedCartButtonText,
                    { color: cartItems.utensilCleaning ? '#fff' : '#0984e3' }
                  ]}>
                    {cartItems.utensilCleaning ? 'ADDED TO CART' : 'ADD TO CART'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Sweeping & Mopping Package */}
              <View style={[
                styles.packageCard, 
                cartItems.sweepingMopping && styles.selectedPackage,
                { borderLeftColor: '#0984e3' }
              ]}>
                <View style={styles.packageHeader}>
                  <View>
                    <Text style={styles.packageTitle}>Sweeping & Mopping</Text>
                    <View style={styles.ratingContainer}>
                      <Text style={[styles.ratingValue, { color: '#0984e3' }]}>4.8</Text>
                      <Text style={styles.reviewsText}>(1.5M reviews)</Text>
                    </View>
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={[styles.priceValue, { color: '#0984e3' }]}>
                      ₹{getPackagePrice('sweepingMopping').toLocaleString('en-IN')}
                    </Text>
                    <Text style={styles.preparationTime}>
                      {getPriceDisplayText()}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.personsControl}>
                  <Text style={styles.personsLabel}>House Size:</Text>
                  <View style={styles.personsInput}>
                    <TouchableOpacity 
                      style={[
                        styles.decrementButton,
                        cartItems.sweepingMopping && styles.selectedIncrementButton
                      ]}
                      onPress={() => handleHouseSizeChange('decrement')}
                    >
                      <Text style={[
                        styles.buttonText,
                        cartItems.sweepingMopping && styles.selectedButtonText
                      ]}>−</Text>
                    </TouchableOpacity>
                    
                    <Text style={[
                      styles.personsValue,
                      cartItems.sweepingMopping && styles.selectedPersonsValue
                    ]}>
                      {packageStates.sweepingMopping.houseSize}
                    </Text>
                    
                    <TouchableOpacity 
                      style={[
                        styles.incrementButton,
                        cartItems.sweepingMopping && styles.selectedIncrementButton
                      ]}
                      onPress={() => handleHouseSizeChange('increment')}
                    >
                      <Text style={[
                        styles.buttonText,
                        cartItems.sweepingMopping && styles.selectedButtonText
                      ]}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.descriptionList}>
                  <View style={styles.descriptionItem}>
                    <Text style={styles.descriptionBullet}>•</Text>
                    <Text style={styles.descriptionText}>Daily sweeping and mopping of 2 rooms, 1 Hall</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.cartButton,
                    cartItems.sweepingMopping && styles.selectedCartButton,
                    { borderColor: '#0984e3' }
                  ]}
                  onPress={() => handleAddPackageToCart('sweepingMopping')}
                >
                  {cartItems.sweepingMopping ? (
                    <Icon name="remove-shopping-cart" size={20} color="#fff" />
                  ) : (
                    <Icon name="add-shopping-cart" size={20} color="#0984e3" />
                  )}
                  <Text style={[
                    styles.cartButtonText,
                    cartItems.sweepingMopping && styles.selectedCartButtonText,
                    { color: cartItems.sweepingMopping ? '#fff' : '#0984e3' }
                  ]}>
                    {cartItems.sweepingMopping ? 'REMOVE FROM CART' : 'ADD TO CART'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Bathroom Cleaning Package */}
              <View style={[
                styles.packageCard, 
                cartItems.bathroomCleaning && styles.selectedPackage,
                { borderLeftColor: '#0984e3' }
              ]}>
                <View style={styles.packageHeader}>
                  <View>
                    <Text style={styles.packageTitle}>Bathroom Cleaning</Text>
                    <View style={styles.ratingContainer}>
                      <Text style={[styles.ratingValue, { color: '#0984e3' }]}>4.6</Text>
                      <Text style={styles.reviewsText}>(980K reviews)</Text>
                    </View>
                  </View>
                  <View style={styles.priceContainer}>
                    <Text style={[styles.priceValue, { color: '#0984e3' }]}>
                      ₹{getPackagePrice('bathroomCleaning').toLocaleString('en-IN')}
                    </Text>
                    <Text style={styles.preparationTime}>
                      {getPriceDisplayText()}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.personsControl}>
                  <Text style={styles.personsLabel}>Bathrooms:</Text>
                  <View style={styles.personsInput}>
                    <TouchableOpacity 
                      style={[
                        styles.decrementButton,
                        cartItems.bathroomCleaning && styles.selectedIncrementButton
                      ]}
                      onPress={() => handleBathroomChange('decrement')}
                    >
                      <Text style={[
                        styles.buttonText,
                        cartItems.bathroomCleaning && styles.selectedButtonText
                      ]}>−</Text>
                    </TouchableOpacity>
                    
                    <Text style={[
                      styles.personsValue,
                      cartItems.bathroomCleaning && styles.selectedPersonsValue
                    ]}>
                      {packageStates.bathroomCleaning.bathrooms}
                    </Text>
                    
                    <TouchableOpacity 
                      style={[
                        styles.incrementButton,
                        cartItems.bathroomCleaning && styles.selectedIncrementButton
                      ]}
                      onPress={() => handleBathroomChange('increment')}
                    >
                      <Text style={[
                        styles.buttonText,
                        cartItems.bathroomCleaning && styles.selectedButtonText
                      ]}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.descriptionList}>
                  <View style={styles.descriptionItem}>
                    <Text style={styles.descriptionBullet}>•</Text>
                    <Text style={styles.descriptionText}>Weekly cleaning of bathrooms</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.cartButton,
                    cartItems.bathroomCleaning && styles.selectedCartButton,
                    { borderColor: '#0984e3' }
                  ]}
                  onPress={() => handleAddPackageToCart('bathroomCleaning')}
                >
                  {cartItems.bathroomCleaning ? (
                    <Icon name="remove-shopping-cart" size={20} color="#fff" />
                  ) : (
                    <Icon name="add-shopping-cart" size={20} color="#0984e3" />
                  )}
                  <Text style={[
                    styles.cartButtonText,
                    cartItems.bathroomCleaning && styles.selectedCartButtonText,
                    { color: cartItems.bathroomCleaning ? '#fff' : '#0984e3' }
                  ]}>
                    {cartItems.bathroomCleaning ? 'REMOVE FROM CART' : 'ADD TO CART'}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* Add-ons Section */}
              <View style={styles.addOnsContainer}>
                <Text style={styles.addOnsTitle}>Regular Add-on Services</Text>
                <View style={styles.addOnsGrid}>
                  {/* Bathroom Deep Cleaning */}
                  <View style={[
                    styles.addOnCard, 
                    cartItems.bathroomDeepCleaning && styles.selectedAddOn,
                    { borderLeftColor: '#0984e3' }
                  ]}>
                    <View style={styles.addOnHeader}>
                      <Text style={styles.addOnTitle}>Bathroom Deep Cleaning</Text>
                      <Text style={[styles.addOnPrice, { color: '#0984e3' }]}>
                        +₹{getAddOnPrice('bathroomDeepCleaning').toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <Text style={styles.addOnDescription}>
                      Weekly cleaning of bathrooms, all bathroom walls cleaned
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.addOnButton,
                        cartItems.bathroomDeepCleaning && styles.selectedAddOnButton,
                        { borderColor: '#0984e3' }
                      ]}
                      onPress={() => handleAddAddOnToCart('bathroomDeepCleaning')}
                    >
                      <Icon 
                        name={cartItems.bathroomDeepCleaning ? "remove-shopping-cart" : "add-shopping-cart"} 
                        size={16} 
                        color={cartItems.bathroomDeepCleaning ? '#fff' : '#0984e3'} 
                        style={styles.addOnButtonIcon}
                      />
                      <Text style={[
                        styles.addOnButtonText,
                        cartItems.bathroomDeepCleaning && styles.selectedAddOnButtonText,
                        { color: cartItems.bathroomDeepCleaning ? '#fff' : '#0984e3' }
                      ]}>
                        {cartItems.bathroomDeepCleaning ? 'REMOVE' : 'ADD SERVICE'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Normal Dusting */}
                  <View style={[
                    styles.addOnCard, 
                    cartItems.normalDusting && styles.selectedAddOn,
                    { borderLeftColor: '#0984e3' }
                  ]}>
                    <View style={styles.addOnHeader}>
                      <Text style={styles.addOnTitle}>Normal Dusting</Text>
                      <Text style={[styles.addOnPrice, { color: '#0984e3' }]}>
                        +₹{getAddOnPrice('normalDusting').toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <Text style={styles.addOnDescription}>
                      Daily furniture dusting, doors, carpet, bed making
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.addOnButton,
                        cartItems.normalDusting && styles.selectedAddOnButton,
                        { borderColor: '#0984e3' }
                      ]}
                      onPress={() => handleAddAddOnToCart('normalDusting')}
                    >
                      <Icon 
                        name={cartItems.normalDusting ? "remove-shopping-cart" : "add-shopping-cart"} 
                        size={16} 
                        color={cartItems.normalDusting ? '#fff' : '#0984e3'} 
                        style={styles.addOnButtonIcon}
                      />
                      <Text style={[
                        styles.addOnButtonText,
                        cartItems.normalDusting && styles.selectedAddOnButtonText,
                        { color: cartItems.normalDusting ? '#fff' : '#0984e3' }
                      ]}>
                        {cartItems.normalDusting ? 'REMOVE' : 'ADD SERVICE'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Deep Dusting */}
                  <View style={[
                    styles.addOnCard, 
                    cartItems.deepDusting && styles.selectedAddOn,
                    { borderLeftColor: '#0984e3' }
                  ]}>
                    <View style={styles.addOnHeader}>
                      <Text style={styles.addOnTitle}>Deep Dusting</Text>
                      <Text style={[styles.addOnPrice, { color: '#0984e3' }]}>
                        +₹{getAddOnPrice('deepDusting').toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <Text style={styles.addOnDescription}>
                      Includes chemical agents cleaning: décor items, furniture
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.addOnButton,
                        cartItems.deepDusting && styles.selectedAddOnButton,
                        { borderColor: '#0984e3' }
                      ]}
                      onPress={() => handleAddAddOnToCart('deepDusting')}
                    >
                      <Icon 
                        name={cartItems.deepDusting ? "remove-shopping-cart" : "add-shopping-cart"} 
                        size={16} 
                        color={cartItems.deepDusting ? '#fff' : '#0984e3'} 
                        style={styles.addOnButtonIcon}
                      />
                      <Text style={[
                        styles.addOnButtonText,
                        cartItems.deepDusting && styles.selectedAddOnButtonText,
                        { color: cartItems.deepDusting ? '#fff' : '#0984e3' }
                      ]}>
                        {cartItems.deepDusting ? 'REMOVE' : 'ADD SERVICE'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Utensil Drying */}
                  <View style={[
                    styles.addOnCard, 
                    cartItems.utensilDrying && styles.selectedAddOn,
                    { borderLeftColor: '#0984e3' }
                  ]}>
                    <View style={styles.addOnHeader}>
                      <Text style={styles.addOnTitle}>Utensil Drying</Text>
                      <Text style={[styles.addOnPrice, { color: '#0984e3' }]}>
                        +₹{getAddOnPrice('utensilDrying').toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <Text style={styles.addOnDescription}>
                      Househelp will dry and make proper arrangements
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.addOnButton,
                        cartItems.utensilDrying && styles.selectedAddOnButton,
                        { borderColor: '#0984e3' }
                      ]}
                      onPress={() => handleAddAddOnToCart('utensilDrying')}
                    >
                      <Icon 
                        name={cartItems.utensilDrying ? "remove-shopping-cart" : "add-shopping-cart"} 
                        size={16} 
                        color={cartItems.utensilDrying ? '#fff' : '#0984e3'} 
                        style={styles.addOnButtonIcon}
                      />
                      <Text style={[
                        styles.addOnButtonText,
                        cartItems.utensilDrying && styles.selectedAddOnButtonText,
                        { color: cartItems.utensilDrying ? '#fff' : '#0984e3' }
                      ]}>
                        {cartItems.utensilDrying ? 'REMOVE' : 'ADD SERVICE'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {/* Clothes Drying */}
                  <View style={[
                    styles.addOnCard, 
                    cartItems.clothesDrying && styles.selectedAddOn,
                    { borderLeftColor: '#0984e3' }
                  ]}>
                    <View style={styles.addOnHeader}>
                      <Text style={styles.addOnTitle}>Clothes Drying</Text>
                      <Text style={[styles.addOnPrice, { color: '#0984e3' }]}>
                        +₹{getAddOnPrice('clothesDrying').toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <Text style={styles.addOnDescription}>
                      Househelp will get clothes from/to drying place
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.addOnButton,
                        cartItems.clothesDrying && styles.selectedAddOnButton,
                        { borderColor: '#0984e3' }
                      ]}
                      onPress={() => handleAddAddOnToCart('clothesDrying')}
                    >
                      <Icon 
                        name={cartItems.clothesDrying ? "remove-shopping-cart" : "add-shopping-cart"} 
                        size={16} 
                        color={cartItems.clothesDrying ? '#fff' : '#0984e3'} 
                        style={styles.addOnButtonIcon}
                      />
                      <Text style={[
                        styles.addOnButtonText,
                        cartItems.clothesDrying && styles.selectedAddOnButtonText,
                        { color: cartItems.clothesDrying ? '#fff' : '#0984e3' }
                      ]}>
                        {cartItems.clothesDrying ? 'REMOVE' : 'ADD SERVICE'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
          
          {/* Footer with Checkout */}
          <View style={styles.footerContainer}>
            <View style={styles.voucherContainer}>
              <TextInput
                style={styles.voucherInput}
                placeholder="Enter voucher code"
                placeholderTextColor="#999"
              />
              <TouchableOpacity style={styles.voucherButton}>
                <Text style={styles.voucherButtonText}>Apply Voucher</Text>
              </TouchableOpacity>
            </View>
          
            <View style={styles.totalContainer}>
              <Text style={styles.footerText}>
                Total for {countSelectedItems()} items
              </Text>
              <Text style={styles.footerPrice}>
                ₹{calculateTotal().toLocaleString('en-IN')}
              </Text>
            </View>
            
            <View style={styles.footerButtons}>
              <TouchableOpacity 
                style={styles.closeFooterButton}
                onPress={handleClose}
              >
                <Text style={styles.closeFooterButtonText}>CLOSE</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.checkoutButton,
                  countSelectedItems() === 0 && styles.disabledButton
                ]}
                onPress={handleCheckout}
                disabled={countSelectedItems() === 0 || loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon name="shopping-cart" size={18} color="#fff" style={styles.checkoutIcon} />
                    <Text style={styles.checkoutButtonText}>CHECKOUT</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    borderRadius: 15,
    maxHeight: '80%',
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
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 5,
  },
  headtitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    flex: 1,
  },
  closeIcon: {
    padding: 5,
  },
  backIcon: {
    padding: 5,
    marginRight: 10,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    paddingHorizontal: 10,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
    marginTop: 10,
  },
  tabButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3399cc',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    fontSize: 16,
    color: '#3399cc',
    fontWeight: 'bold',
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
    backgroundColor: '#e6f3ff',
    borderColor: '#0984e3',
    borderWidth: 0,
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
    marginBottom: 15,
  },
  personsLabel: {
    fontSize: 14,
    marginRight: 10,
    color: '#333',
    fontWeight: '500',
  },
  personsInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 2,
  },
  decrementButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  incrementButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  selectedIncrementButton: {
    backgroundColor: '#0984e3',
    borderColor: '#0984e3',
  },
  buttonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#555',
  },
  selectedButtonText: {
    color: '#fff',
  },
  personsValue: {
    marginHorizontal: 20,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    minWidth: 30,
    textAlign: 'center',
  },
  selectedPersonsValue: {
    color: '#0984e3',
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
  },
  selectedCartButton: {
    backgroundColor: '#0984e3',
    borderColor: '#0984e3',
  },
  cartButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  selectedCartButtonText: {
    color: '#fff',
  },
  addOnsContainer: {
    marginBottom: 20,
  },
  addOnsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  addOnsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  addOnCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
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
  selectedAddOn: {
    backgroundColor: '#e6f3ff',
    borderColor: '#0984e3',
    borderWidth: 1,
  },
  addOnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addOnTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  addOnPrice: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  addOnDescription: {
    fontSize: 11,
    color: '#666',
    marginBottom: 12,
    lineHeight: 14,
  },
  addOnButton: {
    paddingVertical: 8,
    borderRadius: 5,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
  },
  selectedAddOnButton: {
    backgroundColor: '#0984e3',
    borderColor: '#0984e3',
  },
  addOnButtonIcon: {
    marginRight: 4,
  },
  addOnButtonText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  selectedAddOnButtonText: {
    color: '#fff',
  },
  footerContainer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#f9f9f9',
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
    flexDirection: 'row',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  checkoutButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  checkoutIcon: {
    marginRight: 5,
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
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default MaidServiceDialog;