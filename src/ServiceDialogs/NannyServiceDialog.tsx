import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  BackHandler,
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import RazorpayCheckout from 'react-native-razorpay';
import { addToCart, removeFromCart, selectCartItems } from '../features/addToSlice';
import { isNannyCartItem } from '../types/cartSlice';
import { EnhancedProviderDetails } from '../types/ProviderDetailsType';
import { BookingDetails } from '../types/engagementRequest';
import axiosInstance from '../services/axiosInstance';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Dimensions } from 'react-native';
import { useAuth0 } from 'react-native-auth0';
import { usePricingFilterService } from '../utils/PricingFilter';
import { useAppUser } from '../context/AppUserContext';
import BookingService from '../services/bookingService';
import { CartDialog } from '../CartDiaog/CartDialog';
import LinearGradient from 'react-native-linear-gradient';

// Type definitions
type PackageType = 'day' | 'night' | 'fullTime';
type CareType = 'baby' | 'elderly';
type BookingType = "On_demand" | "REGULAR";

interface NannyPackage {
  selected: boolean;
  age: number;
  calculatedPrice: number;
  description: string[];
  rating: number;
  reviews: string;
  category: string;
  jobDescription: string;
  remarks: string;
  bookingType: BookingType;
  inCart: boolean;
  numbersSize?: string;
}

interface PackagesState {
  [key: string]: NannyPackage;
}

// ✅ Helper to check DB "Numbers/Size" conditions
const matchAgeToSize = (numbersSize: string, age: number): boolean => {
  if (!numbersSize) return false;
  
  if (numbersSize.startsWith("<=")) {
    const limit = parseInt(numbersSize.replace("<=", "").trim(), 10);
    return age <= limit;
  }
  if (numbersSize.startsWith(">=")) {
    const limit = parseInt(numbersSize.replace(">=", "").trim(), 10);
    return age >= limit;
  }
  if (numbersSize.startsWith(">")) {
    const limit = parseInt(numbersSize.replace(">", "").trim(), 10);
    return age > limit;
  }
  if (numbersSize.startsWith("<")) {
    const limit = parseInt(numbersSize.replace("<", "").trim(), 10);
    return age < limit;
  }
  
  if (numbersSize.includes("-")) {
    const [min, max] = numbersSize.split("-").map(num => parseInt(num.trim(), 10));
    return age >= min && age <= max;
  }
  
  const exactAge = parseInt(numbersSize, 10);
  return age === exactAge;
};

// ✅ Compute price dynamically from DB
const getPackagePrice = (
  allServices: any[],
  category: string,
  bookingType: BookingType,
  age: number
): number => {
  const matched = allServices.find(service => {
    const categoryMatch = service.Categories.toLowerCase() === category.toLowerCase();
    const ageMatch = matchAgeToSize(service["Numbers/Size"], age);
    
    return categoryMatch && ageMatch;
  });

  if (!matched) {
    console.log(`No matching service found for category: ${category}, age: ${age}`);
    return 0;
  }

  const price = bookingType === "On_demand"
    ? matched["Price /Day (INR)"]
    : matched["Price /Month (INR)"];

  console.log(`Price calculated: ${price} for ${category}, age: ${age}, type: ${bookingType}`);
  return price || 0;
};

interface NannyServicesDialogProps {
  open: boolean;
  handleClose: () => void;
  providerDetails?: EnhancedProviderDetails;
  sendDataToParent?: (data: string) => void;
  user?: any;
  bookingType?: any;
}

const NannyServicesDialog: React.FC<NannyServicesDialogProps> = ({ 
  open, 
  handleClose, 
  providerDetails,
  sendDataToParent,
  user,
  bookingType
}) => {
  const [activeTab, setActiveTab] = useState<CareType>('baby');
  const [packages, setPackages] = useState<PackagesState>({});
  const [allServices, setAllServices] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [voucherCode, setVoucherCode] = useState('');
  const [showCartDialog, setShowCartDialog] = useState(false);
  const { user: auth0User } = useAuth0();
  const { setAppUser, appUser } = useAppUser();
  
  const { getFilteredPricing } = usePricingFilterService();
  const { height: SCREEN_HEIGHT } = Dimensions.get('window');

  const bookingTypeFromRedux = useSelector((state: any) => state.bookingType?.value);
  const allCartItems = useSelector(selectCartItems);
  const nannyCartItems = allCartItems.filter(isNannyCartItem);
  const dispatch = useDispatch();

  const providerFullName = `${providerDetails?.firstName} ${providerDetails?.lastName}`;

  const bookingTypeLabel = useMemo((): BookingType => {
    const isOnDemand = bookingType?.bookingPreference?.toLowerCase() === "date";
    return isOnDemand ? "On_demand" : "REGULAR";
  }, [bookingType?.bookingPreference]);

  const nannyPricing = useMemo(() => {
    return getFilteredPricing('nanny');
  }, [getFilteredPricing]);

  const isInitialized = useRef(false);

  useEffect(() => {
    if (open && nannyPricing && nannyPricing.length > 0 && !isInitialized.current) {
      const updatedNannyServices = nannyPricing;
      const newPackages: PackagesState = {};

      updatedNannyServices.forEach((service: any) => {
        const key = `${service.Categories.toLowerCase()}_${service["Type"].toLowerCase()}_${bookingTypeLabel.toLowerCase()}`;
        const defaultAge = service.Categories.toLowerCase().includes("baby") ? 1 : 60;
        const numbersSize = service["Numbers/Size"];
        
        const initialPrice = getPackagePrice(
          updatedNannyServices,
          service.Categories,
          bookingTypeLabel,
          defaultAge
        );

        newPackages[key] = {
          selected: packages[key]?.selected || false,
          inCart: packages[key]?.inCart || false,
          age: packages[key]?.age || defaultAge,
          calculatedPrice: packages[key]?.calculatedPrice || initialPrice,
          description: service["Job Description"]?.split("\n").filter(Boolean) || [],
          rating: 4.7,
          reviews: "(1M reviews)",
          category: service.Categories,
          jobDescription: service["Job Description"],
          remarks: service["Remarks/Conditions"] || "",
          bookingType: bookingTypeLabel,
          numbersSize: numbersSize
        };
      });

      setPackages(newPackages);
      setAllServices(updatedNannyServices);
      isInitialized.current = true;
      console.log('Packages initialized with pricing:', newPackages);
    }
  }, [open, nannyPricing, bookingTypeLabel, packages]);

  useEffect(() => {
    if (!open) {
      isInitialized.current = false;
    }
  }, [open]);

  useEffect(() => {
    if (nannyCartItems.length === 0) return;
    
    const itemsToRemove = nannyCartItems.filter(
      item => item.type === "nanny" && item.activeTab !== activeTab
    );

    if (itemsToRemove.length === 0) return;

    itemsToRemove.forEach(item => {
      dispatch(removeFromCart({ id: item.id, type: "nanny" }));
    });

    setPackages(prev => {
      const updated = { ...prev };
      let hasChanges = false;
      
      itemsToRemove.forEach(item => {
        const packageKey = item.id.toLowerCase();
        if (updated[packageKey] && updated[packageKey].inCart) {
          updated[packageKey] = { 
            ...updated[packageKey], 
            inCart: false, 
            selected: false 
          };
          hasChanges = true;
        }
      });
      
      return hasChanges ? updated : prev;
    });
  }, [activeTab, dispatch, nannyCartItems]);

  useEffect(() => {
    if (nannyCartItems.length === 0 && Object.values(packages).every(pkg => !pkg.inCart)) {
      return;
    }

    setPackages(prevPackages => {
      const updatedPackages = { ...prevPackages };
      let hasChanges = false;

      nannyCartItems.forEach(item => {
        const packageKey = item.id.toLowerCase();
        if (updatedPackages[packageKey] && !updatedPackages[packageKey].inCart) {
          updatedPackages[packageKey] = {
            ...updatedPackages[packageKey],
            inCart: true,
            selected: true
          };
          hasChanges = true;
        }
      });

      Object.keys(updatedPackages).forEach(key => {
        const isInCart = nannyCartItems.some(item => item.id.toLowerCase() === key);
        if (updatedPackages[key].inCart !== isInCart) {
          updatedPackages[key] = {
            ...updatedPackages[key],
            inCart: isInCart,
            selected: isInCart
          };
          hasChanges = true;
        }
      });

      return hasChanges ? updatedPackages : prevPackages;
    });
  }, [nannyCartItems]);

  const getBookingTypeFromPreference = useCallback((bookingPreference: string | undefined): string => {
    if (!bookingPreference) return 'MONTHLY';
    const pref = bookingPreference.toLowerCase();
    if (pref === 'date') return 'ON_DEMAND';
    if (pref === 'short term') return 'SHORT_TERM';
    return 'MONTHLY';
  }, []);

  useEffect(() => {
    if (!open) return;

    const backAction = () => {
      handleClose();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [open, handleClose]);

  // ✅ FIXED: Age change handler with proper increment/decrement
  const handleAgeChange = useCallback((key: string, increment: number) => {
    setPackages(prev => {
      const currentPkg = prev[key];
      if (!currentPkg) {
        return prev;
      }

      const isBaby = key.includes('baby');
      const minAge = isBaby ? 1 : 60;
      const maxAge = isBaby ? 6 : 80;

      const newAge = currentPkg.age + increment;
      
      if (newAge < minAge || newAge > maxAge) {
        return prev;
      }

      const newPrice = getPackagePrice(
        allServices,
        currentPkg.category,
        currentPkg.bookingType,
        newAge
      );

      return {
        ...prev,
        [key]: {
          ...currentPkg,
          age: newAge,
          calculatedPrice: newPrice
        }
      };
    });
  }, [allServices]);

  const toggleCart = useCallback((key: string, pkg: NannyPackage) => {
    const packageType: PackageType = key.includes("day") ? "day" 
                      : key.includes("night") ? "night" 
                      : "fullTime";

    const careType: CareType = pkg.category.toLowerCase().includes("baby") 
      ? "baby" 
      : "elderly";

    const cartItem = {
      id: key.toUpperCase(),
      type: "nanny" as const,
      careType: careType,
      packageType: packageType,
      age: pkg.age,
      price: pkg.calculatedPrice,
      description: pkg.description.join(", "),
      providerId: providerDetails?.serviceproviderId || '',
      providerName: providerFullName,
      activeTab: activeTab
    };

    const isAlreadyInCart = nannyCartItems.some(item => 
      item.id === cartItem.id
    );

    if (isAlreadyInCart) {
      dispatch(removeFromCart({ id: cartItem.id, type: 'nanny' }));
      setPackages(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          inCart: false,
          selected: false
        }
      }));
    } else {
      const itemsToRemove = nannyCartItems.filter(item => 
        item.type === 'nanny' && item.activeTab !== activeTab
      );
      
      itemsToRemove.forEach(item => {
        dispatch(removeFromCart({ id: item.id, type: 'nanny' }));
      });

      dispatch(removeFromCart({ type: 'meal' }));
      dispatch(removeFromCart({ type: 'maid' }));
      
      dispatch(addToCart(cartItem));
      setPackages(prev => ({
        ...prev,
        [key]: {
          ...prev[key],
          inCart: true,
          selected: true
        }
      }));
    }
  }, [activeTab, dispatch, nannyCartItems, providerDetails, providerFullName]);

  const calculateTotal = useMemo((): number => {
    return Object.entries(packages)
      .filter(([key, pkg]) => {
        const isCurrentTab = activeTab === 'baby' 
          ? key.includes('baby') 
          : key.includes('elderly');
        
        return pkg.selected && isCurrentTab;
      })
      .reduce((sum, [_, pkg]) => sum + pkg.calculatedPrice, 0);
  }, [packages, activeTab]);

  const getSelectedPackagesCount = useMemo((): number => {
    return Object.entries(packages)
      .filter(([key, pkg]) => {
        const isCurrentTab = activeTab === 'baby' 
          ? key.includes('baby') 
          : key.includes('elderly');
        
        return pkg.selected && isCurrentTab;
      })
      .length;
  }, [packages, activeTab]);

  const handleApplyVoucher = () => {
    Alert.alert('Voucher Applied', 'Your voucher has been applied successfully');
  };

  const prepareCartForCheckout = () => {
    dispatch(removeFromCart({ type: 'nanny' }));

    Object.entries(packages).forEach(([key, pkg]) => {
      if (pkg.selected) {
        const packageType: PackageType = key.includes("day") ? "day" 
                          : key.includes("night") ? "night" 
                          : "fullTime";

        const careType: CareType = pkg.category.toLowerCase().includes("baby") 
          ? "baby" 
          : "elderly";

        dispatch(addToCart({
          type: 'nanny',
          id: key.toUpperCase(),
          careType: careType,
          packageType: packageType,
          age: pkg.age,
          price: pkg.calculatedPrice,
          description: pkg.description.join(", "),
          providerId: providerDetails?.serviceproviderId || '',
          providerName: providerFullName,
          activeTab: activeTab
        }));
      }
    });
  };

  const handleOpenCartDialog = () => {
    const selectedPackages = Object.entries(packages).filter(([_, pkg]) => pkg.selected);
    if (selectedPackages.length === 0) {
      Alert.alert("Selection Required", "Please select at least one package");
      return;
    }

    prepareCartForCheckout();
    setShowCartDialog(true);
  };

  const handleCheckout = async () => {
    try {
      setLoading(true);

      const selectedPackages = Object.entries(packages)
        .filter(([_, pkg]) => pkg.selected)
        .map(([key, pkg]) => ({
          key,
          age: pkg.age,
          price: pkg.calculatedPrice,
          category: pkg.category,
          packageType: key.includes('day') ? 'Day' : key.includes('night') ? 'Night' : 'Fulltime',
        }));

      const baseTotal = selectedPackages.reduce((sum, pkg) => sum + pkg.price, 0);
      if (baseTotal === 0) {
        Alert.alert("Selection Required", "Please select at least one service");
        setLoading(false);
        return;
      }

      if (!appUser?.customerid) {
        Alert.alert("Authentication Required", "Please log in to proceed with booking");
        setLoading(false);
        return;
      }

      const responsibilities = selectedPackages.map(pkg => ({
        taskType: `${pkg.category} care - ${pkg.packageType} service`,
        age: pkg.age,
        careType: activeTab,
      }));

      console.log("console booking:", bookingType);

      const payload = {
        customerid: appUser.customerid,
        serviceproviderid: providerDetails?.serviceproviderId
          ? Number(providerDetails.serviceproviderId)
          : 0,
        start_date: bookingType?.startDate || new Date().toISOString().split('T')[0],
        end_date: bookingType?.endDate || new Date().toISOString().split('T')[0],
        start_time: bookingType?.timeRange || '',
        responsibilities: { tasks: responsibilities },
        booking_type: getBookingTypeFromPreference(bookingType?.bookingPreference),
        taskStatus: "NOT_STARTED",
        service_type: "NANNY",
        base_amount: baseTotal,
        payment_mode: "razorpay",
        ...(bookingType?.bookingPreference?.toLowerCase() === "date" && {
          end_time: bookingType?.endTime || "",
        }),
      };

      console.log("Final Nanny Payload:", payload);

      const result = await BookingService.bookAndPay(payload);

      Alert.alert(
        "Success ✅", 
        result?.verifyResult?.message || "Booking & Payment Successful!",
        [
          {
            text: "OK",
            onPress: () => {
              dispatch(removeFromCart({ type: 'meal' }));
              dispatch(removeFromCart({ type: 'maid' }));
              dispatch(removeFromCart({ type: 'nanny' }));
              setShowCartDialog(false);
              handleClose();
              if (sendDataToParent) {
                sendDataToParent('BOOKINGS');
              }
            }
          }
        ]
      );

    } catch (err: any) {
      console.error("Checkout error:", err);

      let backendMessage = "Payment failed. Please try again.";
      if (err?.response?.data) {
        if (typeof err.response.data === "string") {
          backendMessage = err.response.data;
        } else if (err.response.data.error) {
          backendMessage = err.response.data.error;
        } else if (err.response.data.message) {
          backendMessage = err.response.data.message;
        }
      } else if (err.message) {
        backendMessage = err.message;
      }

      Alert.alert("Payment Error", backendMessage);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Package rendering with simple age validation
  const renderPackage = useCallback((key: string, pkg: NannyPackage) => {
    const packageType = key.includes("day") ? "day" 
                    : key.includes("night") ? "night" 
                    : "fullTime";
                    
    const displayPackageType = packageType.charAt(0).toUpperCase() + packageType.slice(1);
    const color = activeTab === 'baby' ? '#e17055' : '#0984e3';
    
    const isBaby = activeTab === 'baby';
    const minAge = isBaby ? 1 : 60;
    const maxAge = isBaby ? 6 : 80;

    return (
      <View key={key} style={[
        styles.packageCard, 
        pkg.selected && styles.selectedPackage,
        { borderLeftColor: color }
      ]}>
        <View style={styles.packageHeader}>
          <View style={styles.packageInfo}>
            <Text style={styles.packageTitle}>{pkg.category} - {displayPackageType}</Text>
            <View style={styles.ratingContainer}>
              <Text style={[styles.ratingValue, { color }]}>{pkg.rating}</Text>
              <Text style={styles.reviewsText}>{pkg.reviews}</Text>
            </View>
            <Text style={styles.bookingTypeText}>
              {pkg.bookingType === "On_demand" ? 'Per Day' : 'Monthly service'}
            </Text>
          </View>
          <View style={styles.priceContainer}>
            <Text style={[styles.priceValue, { color }]}>₹{pkg.calculatedPrice}</Text>
            <Text style={styles.careType}>{pkg.bookingType}</Text>
          </View>
        </View>

        {/* ✅ FIXED: Age Control with Simple Limits */}
        <View style={styles.personsControl}>
          <Text style={styles.personsLabel}>Age:</Text>
          <View style={styles.personsInput}>
            <TouchableOpacity 
              style={[
                styles.ageButton,
                pkg.age <= minAge && styles.disabledAgeButton
              ]}
              onPress={() => handleAgeChange(key, -1)}
              disabled={pkg.age <= minAge}
            >
              <Text style={[
                styles.ageButtonText, 
                pkg.age <= minAge && styles.disabledAgeButtonText
              ]}>-</Text>
            </TouchableOpacity>
            
            <View style={styles.ageValueContainer}>
              <Text style={styles.personsValue}>{pkg.age}</Text>
              <Text style={styles.ageRangeText}>Range: {minAge}-{maxAge}</Text>
            </View>
            
            <TouchableOpacity 
              style={[
                styles.ageButton,
                pkg.age >= maxAge && styles.disabledAgeButton
              ]}
              onPress={() => handleAgeChange(key, 1)}
              disabled={pkg.age >= maxAge}
            >
              <Text style={[
                styles.ageButtonText,
                pkg.age >= maxAge && styles.disabledAgeButtonText
              ]}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {activeTab === 'baby' && pkg.age === 1 && (
          <Text style={styles.ageInfoText}>Age 1 includes babies from 1 to 12 months</Text>
        )}
        {activeTab === 'elderly' && pkg.age === 60 && (
          <Text style={styles.ageInfoText}>For seniors aged 60 and above</Text>
        )}

        <View style={styles.descriptionList}>
          {pkg.description.map((item, index) => (
            <View key={index} style={styles.descriptionItem}>
              <Text style={styles.descriptionBullet}>•</Text>
              <Text style={styles.descriptionText}>{item}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[
            styles.cartButton,
            pkg.inCart && styles.selectedCartButton,
            { borderColor: color }
          ]}
          onPress={() => toggleCart(key, pkg)}
        >
          {pkg.inCart ? (
            <Icon name="remove-shopping-cart" size={20} color="white" />
          ) : (
            <Icon name="add-shopping-cart" size={20} color={color} />
          )}
          <Text style={[
            styles.cartButtonText,
            pkg.inCart && styles.selectedCartButtonText,
            !pkg.inCart && { color }
          ]}>
            {pkg.inCart ? 'REMOVE FROM CART' : 'ADD TO CART'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [activeTab, handleAgeChange, toggleCart]);

  const babyPackages = useMemo(() => {
    const packagesList = Object.entries(packages)
      .filter(([key]) => key.includes('baby'))
      .map(([key, pkg]) => renderPackage(key, pkg));

    if (packagesList.length === 0) {
      return (
        <View style={styles.noServiceContainer}>
          <Text style={styles.noServiceText}>No baby care services available at the moment</Text>
        </View>
      );
    }

    return packagesList;
  }, [packages, renderPackage]);

  const elderlyPackages = useMemo(() => {
    const packagesList = Object.entries(packages)
      .filter(([key]) => key.includes('elderly'))
      .map(([key, pkg]) => renderPackage(key, pkg));

    if (packagesList.length === 0) {
      return (
        <View style={styles.noServiceContainer}>
          <Text style={styles.noServiceText}>No elderly care services available at the moment</Text>
        </View>
      );
    }

    return packagesList;
  }, [packages, renderPackage]);

  return (    
    <Modal
      visible={open}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOver}>
        <View style={styles.modalContain}>
          <LinearGradient
            colors={["#0a2a66ff", "#004aadff"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.linearGradient}
          >
            <Text style={styles.headtitle}>Caregiver Service</Text>
          </LinearGradient>
          
          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'baby' && styles.activeTab]}
              onPress={() => setActiveTab('baby')}
            >
              <Text style={[styles.tabText, activeTab === 'baby' && styles.activeTabText]}>
                Baby Care
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tabButton, activeTab === 'elderly' && styles.activeTab]}
              onPress={() => setActiveTab('elderly')}
            >
              <Text style={[styles.tabText, activeTab === 'elderly' && styles.activeTabText]}>
                Elderly Care
              </Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.scrollView}>
            <View style={styles.packagesContainer}>
              {activeTab === 'baby' ? babyPackages : elderlyPackages}
            </View>
          </ScrollView>
          
          <View style={styles.footerContainer}>
            <View style={styles.voucherContainer}>
              <TextInput
                style={styles.voucherInput}
                placeholder="Enter voucher code"
                placeholderTextColor="#999"
                value={voucherCode}
                onChangeText={setVoucherCode}
              />
              <TouchableOpacity 
                style={styles.voucherButton}
                onPress={handleApplyVoucher}
              >
                <Text style={styles.voucherButtonText}>APPLY</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.totalContainer}>
              <Text style={styles.footerText}>
                Total for {getSelectedPackagesCount} service{getSelectedPackagesCount !== 1 ? 's' : ''}
              </Text>
              <Text style={styles.footerPrice}>₹{calculateTotal.toLocaleString()}</Text>
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
                  (getSelectedPackagesCount === 0 || loading) && styles.disabledButton
                ]}
                onPress={handleOpenCartDialog}
                disabled={getSelectedPackagesCount === 0 || loading}
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

      <CartDialog
        open={showCartDialog}
        handleClose={() => setShowCartDialog(false)}
        handleCheckout={handleCheckout}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOver: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContain: {
    backgroundColor: 'white',
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
  headtitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3399cc',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3399cc',
    fontWeight: 'bold',
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
  packageInfo: {
    flex: 1,
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
    marginBottom: 3,
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
  bookingTypeText: {
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
  careType: {
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
    fontWeight: '500',
    width: 40,
  },
  personsInput: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ageButton: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  disabledAgeButton: {
    backgroundColor: '#f9f9f9',
    borderColor: '#eee',
  },
  ageButtonText: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },
  disabledAgeButtonText: {
    color: '#ccc',
  },
  ageValueContainer: {
    alignItems: 'center',
    marginHorizontal: 15,
    minWidth: 60,
  },
  personsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  ageRangeText: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
  },
  ageInfoText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 10,
    textAlign: 'center',
    backgroundColor: '#f9f9f9',
    padding: 5,
    borderRadius: 5,
  },
  descriptionList: {
    marginBottom: 15,
  },
  descriptionItem: {
    flexDirection: 'row',
    marginBottom: 5,
    alignItems: 'flex-start',
  },
  descriptionBullet: {
    marginRight: 10,
    color: '#666',
    fontSize: 16,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 20,
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
    backgroundColor: '#3399cc',
    borderColor: '#3399cc',
  },
  cartButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
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
  disabledButton: {
    backgroundColor: '#ccc',
  },
  checkoutButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  noServiceContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noServiceText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default NannyServicesDialog;