import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useAuth0 } from "react-native-auth0";
import LinearGradient from 'react-native-linear-gradient';
import Icon from "react-native-vector-icons/Feather";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useAppUser } from "../context/AppUserContext";
import MobileNumberDialog from "./MobileNumberDialog";
import axiosInstance from "../services/axiosInstance";
import utilsInstance from "../services/utilsInstance";
import providerInstance from "../services/providerInstance";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store/userStore";
import { setHasMobileNumber } from "../features/customerSlice";

const { width } = Dimensions.get('window');

// Interfaces
interface Address {
  id: string;
  type: string;
  street: string;
  city: string;
  country: string;
  postalCode: string;
  rawData?: {
    formattedAddress: string;
    latitude: number;
    longitude: number;
    placeId: string;
  };
}

interface PermanentAddress {
  field1: string;
  field2: string;
  ctArea: string;
  pinNo: string;
  state: string;
  country: string;
}

interface CorrespondenceAddress {
  field1: string;
  field2: string;
  ctArea: string;
  pinNo: string;
  state: string;
  country: string;
}

interface UserData {
  firstName: string;
  lastName: string;
  contactNumber: string;
  altContactNumber: string;
  role?: string;
}

interface ServiceProvider {
  serviceproviderId: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  mobileNo: number;
  alternateNo: number | null;
  emailId: string;
  gender: string;
  buildingName: string;
  locality: string;
  street: string;
  pincode: number;
  currentLocation: string;
  nearbyLocation: string;
  permanentAddress: PermanentAddress;
  correspondenceAddress: CorrespondenceAddress;
}

interface CustomerDetails {
  customerid: number;
  firstName: string;
  lastName: string;
  mobileNo: string | null;
  altMobileNo: string | null;
  email: string;
}

interface ValidationState {
  loading: boolean;
  error: string;
  isAvailable: boolean | null;
  formatError: boolean;
}

interface OriginalData {
  userData: UserData;
  addresses: Address[];
}

const ProfileScreen = () => {
  const { user: auth0User, isLoading: auth0Loading } = useAuth0();
  const { appUser } = useAppUser();
  
  // USE REDUX STATE
  const dispatch = useDispatch();
  const {
    customerId,
    mobileNo,
    alternateNo,
    firstName,
    lastName,
    emailId,
    hasMobileNumber,
    loading: customerLoading
  } = useSelector((state: RootState) => state.customer);

  console.log("App User from Context:", appUser);

  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userRole, setUserRole] = useState<string>("CUSTOMER");
  const [serviceProviderData, setServiceProviderData] = useState<ServiceProvider | null>(null);
  const [customerData, setCustomerData] = useState<CustomerDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedAddressIds, setExpandedAddressIds] = useState<string[]>([]);
  const [showMobileDialog, setShowMobileDialog] = useState(false);
  const [dialogShownInSession, setDialogShownInSession] = useState(false);

  const [userData, setUserData] = useState<UserData>({
    firstName: "",
    lastName: "",
    contactNumber: "",
    altContactNumber: ""
  });

  const [originalData, setOriginalData] = useState<OriginalData>({
    userData: {
      firstName: "",
      lastName: "",
      contactNumber: "",
      altContactNumber: ""
    },
    addresses: []
  });
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    type: "Home",
    customType: "",
    street: "",
    city: "",
    country: "",
    postalCode: ""
  });
  const [countryCode, setCountryCode] = useState("+91");
  const [altCountryCode, setAltCountryCode] = useState("+91");
  const [showCountryCodePicker, setShowCountryCodePicker] = useState(false);
  const [showAltCountryCodePicker, setShowAltCountryCodePicker] = useState(false);

  // Validation states
  const [contactValidation, setContactValidation] = useState<ValidationState>({
    loading: false,
    error: '',
    isAvailable: null,
    formatError: false
  });
  const [altContactValidation, setAltContactValidation] = useState<ValidationState>({
    loading: false,
    error: '',
    isAvailable: null,
    formatError: false
  });

  // Track which fields have been validated
  const [validatedFields, setValidatedFields] = useState<Set<string>>(new Set());

  // Function to handle user preference selection
  const handleUserPreference = (preference?: string) => {
    console.log("User preference selected: ", preference);

    if (!preference) {
      setNewAddress(prev => ({ ...prev, type: "Other", customType: "" }));
    } else {
      setNewAddress(prev => ({ ...prev, type: preference, customType: "" }));
    }
  };

  // Function to get user's first letter for profile picture
  const getUserInitial = () => {
    const name = userName || appUser?.nickname || "User";
    return name.charAt(0).toUpperCase();
  };

  // Function to get background color based on user initial
  const getAvatarBackgroundColor = (initial: string) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
    ];
    const charCode = initial.charCodeAt(0);
    return colors[charCode % colors.length];
  };

  // Function to render profile picture with fallback
  const renderProfilePicture = () => {
    const profilePictureUri = auth0User?.picture || appUser?.picture;
    
    if (profilePictureUri) {
      return (
        <Image
          source={{ uri: profilePictureUri }}
          style={styles.profileImage}
        />
      );
    } else {
      const initial = getUserInitial();
      const backgroundColor = getAvatarBackgroundColor(initial);
      
      return (
        <View style={[styles.avatarFallback, { backgroundColor }]}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
      );
    }
  };

 const getUserIdDisplay = () => {
  if (userRole === "SERVICE_PROVIDER") {
    // Try multiple sources for service provider ID
    return appUser?.serviceProviderId?.toString() || 
           userId?.toString() || 
           serviceProviderData?.serviceproviderId?.toString() || 
           "N/A";
  } else {
    // Try multiple sources for customer ID
    return appUser?.customerid?.toString() || 
           userId?.toString() || 
           customerId?.toString() || 
           customerData?.customerid?.toString() || 
           "N/A";
  }
};

  // Function to get display name for greeting
  const getDisplayName = () => {
    return userName || appUser?.nickname || "User";
  };

  // Format mobile number for display
  const formatMobileNumber = (number: string | null) => {
    if (!number || number === "null" || number === "undefined") return "";
    return number;
  };

  // Mobile number validation functions
  const validateMobileFormat = (number: string): boolean => {
    const mobilePattern = /^[0-9]{10}$/;
    return mobilePattern.test(number);
  };

  const checkMobileAvailability = async (number: string, isAlternate: boolean = false): Promise<boolean> => {
    if (!number || !validateMobileFormat(number)) {
      return false;
    }

    const setValidation = isAlternate ? setAltContactValidation : setContactValidation;
    const fieldName = isAlternate ? 'altContactNumber' : 'contactNumber';
    
    setValidation({
      loading: true,
      error: '',
      isAvailable: null,
      formatError: false
    });

    try {
      const endpoint = '/api/service-providers/check-mobile';
      const payload = { mobile: number };
      
      const response = await providerInstance.post(endpoint, payload);
      
      let isAvailable = true;
      let errorMessage = '';
      
      if (response.data.exists !== undefined) {
        isAvailable = !response.data.exists;
        errorMessage = response.data.exists 
          ? `${isAlternate ? 'Alternate' : 'Mobile'} number is already registered` 
          : '';
      } else if (response.data.available !== undefined) {
        isAvailable = response.data.available;
        errorMessage = !response.data.available 
          ? `${isAlternate ? 'Alternate' : 'Mobile'} number is already registered` 
          : '';
      } else if (response.data.isAvailable !== undefined) {
        isAvailable = response.data.isAvailable;
        errorMessage = !response.data.isAvailable 
          ? `${isAlternate ? 'Alternate' : 'Mobile'} number is already registered` 
          : '';
      } else {
        isAvailable = true;
      }
      
      setValidation({
        loading: false,
        error: errorMessage,
        isAvailable,
        formatError: false
      });

      if (isAvailable) {
        setValidatedFields(prev => {
          const newSet = new Set(prev);
          newSet.add(fieldName);
          return newSet;
        });
      }

      return isAvailable;
    } catch (error: any) {
      console.error('Error validating mobile number:', error);
      
      let errorMessage = `Error checking ${isAlternate ? 'alternate' : 'mobile'} number`;
      
      if (error.response?.data) {
        const apiError = error.response.data;
        if (typeof apiError === 'string') {
          errorMessage = apiError;
        } else if (apiError.message) {
          errorMessage = apiError.message;
        } else if (apiError.error) {
          errorMessage = apiError.error;
        }
      } else if (error.response?.status === 400) {
        errorMessage = `Invalid ${isAlternate ? 'alternate' : 'mobile'} number format`;
      } else if (error.response?.status === 409) {
        errorMessage = `${isAlternate ? 'Alternate' : 'Mobile'} number is already registered`;
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }

      setValidation({
        loading: false,
        error: errorMessage,
        isAvailable: false,
        formatError: false
      });

      return false;
    }
  };

  // Debounced validation
  const useDebouncedValidation = () => {
    const timeouts = {
      contact: null as NodeJS.Timeout | null,
      alternate: null as NodeJS.Timeout | null
    };

    return (number: string, isAlternate: boolean = false) => {
      const timeoutKey = isAlternate ? 'alternate' : 'contact';
      
      if (timeouts[timeoutKey]) {
        clearTimeout(timeouts[timeoutKey]!);
      }

      timeouts[timeoutKey] = setTimeout(() => {
        checkMobileAvailability(number, isAlternate);
      }, 800);
    };
  };

  const debouncedValidation = useDebouncedValidation();

  const handleContactNumberChange = (value: string) => {
    const cleanedValue = value.replace(/\D/g, '').slice(0, 10);
    setUserData(prev => ({ ...prev, contactNumber: cleanedValue }));

    setContactValidation(prev => ({
      ...prev,
      loading: false,
      error: '',
      isAvailable: null,
      formatError: false
    }));

    if (cleanedValue.length === 10) {
      setContactValidation(prev => ({
        ...prev,
        formatError: false,
        error: prev.error === 'Please enter a valid 10-digit mobile number' ? '' : prev.error
      }));
      
      debouncedValidation(cleanedValue, false);
      
      if (userData.altContactNumber === cleanedValue) {
        setAltContactValidation(prev => ({
          ...prev,
          error: 'Alternate number cannot be same as contact number',
          isAvailable: false,
          formatError: false
        }));
      } else if (userData.altContactNumber && userData.altContactNumber.length === 10) {
        if (altContactValidation.error === 'Alternate number cannot be same as contact number') {
          setAltContactValidation(prev => ({
            ...prev,
            error: '',
            isAvailable: null,
            formatError: false
          }));
          debouncedValidation(userData.altContactNumber, true);
        }
      }
    } else if (cleanedValue) {
      setContactValidation({
        loading: false,
        error: 'Please enter a valid 10-digit mobile number',
        isAvailable: null,
        formatError: true
      });
    } else {
      setContactValidation({
        loading: false,
        error: '',
        isAvailable: null,
        formatError: false
      });
    }
  };

  const handleAltContactNumberChange = (value: string) => {
    const cleanedValue = value.replace(/\D/g, '').slice(0, 10);
    setUserData(prev => ({ ...prev, altContactNumber: cleanedValue }));

    setAltContactValidation(prev => ({
      ...prev,
      loading: false,
      error: '',
      isAvailable: null,
      formatError: false
    }));

    if (cleanedValue) {
      if (cleanedValue.length === 10) {
        setAltContactValidation(prev => ({
          ...prev,
          formatError: false,
          error: prev.error === 'Please enter a valid 10-digit mobile number' ? '' : prev.error
        }));

        if (cleanedValue === userData.contactNumber) {
          setAltContactValidation({
            loading: false,
            error: 'Alternate number cannot be same as contact number',
            isAvailable: false,
            formatError: false
          });
        } else {
          debouncedValidation(cleanedValue, true);
        }
      } else {
        setAltContactValidation({
          loading: false,
          error: 'Please enter a valid 10-digit mobile number',
          isAvailable: null,
          formatError: true
        });
      }
    } else {
      setAltContactValidation({
        loading: false,
        error: '',
        isAvailable: null,
        formatError: false
      });
    }
  };

  const areNumbersUnique = (): boolean => {
    if (!userData.contactNumber || !userData.altContactNumber) return true;
    return userData.contactNumber !== userData.altContactNumber;
  };

  // Check if any field has been modified
  const hasChanges = (): boolean => {
    const userDataChanged = 
      userData.firstName !== originalData.userData.firstName ||
      userData.lastName !== originalData.userData.lastName ||
      userData.contactNumber !== originalData.userData.contactNumber ||
      userData.altContactNumber !== originalData.userData.altContactNumber;

    const addressesChanged = 
      addresses.length !== originalData.addresses.length ||
      addresses.some((addr, index) => {
        const originalAddr = originalData.addresses[index];
        if (!originalAddr) return true;
        return (
          addr.street !== originalAddr.street ||
          addr.city !== originalAddr.city ||
          addr.country !== originalAddr.country ||
          addr.postalCode !== originalAddr.postalCode ||
          addr.type !== originalAddr.type
        );
      });

    return userDataChanged || addressesChanged || showAddAddress;
  };

  const validateAllFields = async (): Promise<boolean> => {
    const contactNumberChanged = userData.contactNumber !== originalData.userData.contactNumber;
    const altContactNumberChanged = userData.altContactNumber !== originalData.userData.altContactNumber;

    let allValid = true;
    const validationPromises: Promise<boolean>[] = [];

    if (contactNumberChanged) {
      if (!validateMobileFormat(userData.contactNumber)) {
        Alert.alert("Validation Error", "Please enter a valid 10-digit contact number");
        return false;
      }

      if (!validatedFields.has('contactNumber') || contactValidation.isAvailable === null) {
        validationPromises.push(checkMobileAvailability(userData.contactNumber, false));
      }
    }

    if (altContactNumberChanged && userData.altContactNumber) {
      if (!validateMobileFormat(userData.altContactNumber)) {
        Alert.alert("Validation Error", "Please enter a valid 10-digit alternate contact number");
        return false;
      }

      if (!areNumbersUnique()) {
        Alert.alert("Validation Error", "Contact number and alternate contact number must be different");
        return false;
      }

      if (!validatedFields.has('altContactNumber') || altContactValidation.isAvailable === null) {
        validationPromises.push(checkMobileAvailability(userData.altContactNumber, true));
      }
    }

    if (validationPromises.length > 0) {
      const results = await Promise.all(validationPromises);
      allValid = results.every(result => result === true);
    }

    if (contactNumberChanged && contactValidation.isAvailable === false) {
      Alert.alert("Validation Error", "Contact number is not available");
      allValid = false;
    }

    if (altContactNumberChanged && userData.altContactNumber && altContactValidation.isAvailable === false) {
      Alert.alert("Validation Error", "Alternate contact number is not available");
      allValid = false;
    }

    return allValid;
  };

  // Function to save address to user-settings API
  const saveAddressToUserSettings = async (addressData: any) => {
    if (!userId || userRole !== "CUSTOMER") return;

    try {
      const response = await utilsInstance.get(`/user-settings/${userId}`);
      const currentSettings = response.data;

      let existingLocations = [];
      
      if (Array.isArray(currentSettings) && currentSettings.length > 0) {
        existingLocations = currentSettings[0].savedLocations || [];
      } else {
        await utilsInstance.post("/user-settings", {
          customerId: userId,
          savedLocations: []
        });
      }

      const addressType = addressData.type === "Other" && addressData.customType 
        ? addressData.customType 
        : addressData.type;

      const newLocation = {
        name: addressType,
        location: {
          address: [{
            formatted_address: addressData.street,
            address_components: [
              { long_name: addressData.city, types: ["locality"] },
              { long_name: addressData.country, types: ["country"] },
              { long_name: addressData.postalCode, types: ["postal_code"] },
            ],
            geometry: {
              location: {
                lat: addressData.rawData?.latitude || 0,
                lng: addressData.rawData?.longitude || 0
              }
            },
            place_id: addressData.rawData?.placeId || `manual_${Date.now()}`
          }],
          lat: addressData.rawData?.latitude || 0,
          lng: addressData.rawData?.longitude || 0
        }
      };

      const updatedLocations = [...existingLocations, newLocation];

      const payload = {
        customerId: userId,
        savedLocations: updatedLocations
      };

      await utilsInstance.put(`/user-settings/${userId}`, payload);
      
      console.log("✅ Address saved successfully to user settings");
      return true;
    } catch (error) {
      console.error("❌ Failed to save address to user settings:", error);
      throw error;
    }
  };

  // Function to update addresses in user-settings API
  const updateAddressesInUserSettings = async (updatedAddresses: Address[]) => {
    if (!userId || userRole !== "CUSTOMER") return;

    try {
      const savedLocations = updatedAddresses.map((addr) => {
        const addressType = addr.type;

        return {
          name: addressType,
          location: {
            address: [{
              formatted_address: addr.street,
              address_components: [
                { long_name: addr.city, types: ["locality"] },
                { long_name: addr.country, types: ["country"] },
                { long_name: addr.postalCode, types: ["postal_code"] },
              ],
              geometry: {
                location: {
                  lat: addr.rawData?.latitude || 0,
                  lng: addr.rawData?.longitude || 0
                }
              },
              place_id: addr.rawData?.placeId || `manual_${Date.now()}`
            }],
            lat: addr.rawData?.latitude || 0,
            lng: addr.rawData?.longitude || 0
          }
        };
      });

      const payload = {
        customerId: userId,
        savedLocations: savedLocations
      };

      await utilsInstance.put(`/user-settings/${userId}`, payload);
      console.log("✅ Addresses updated successfully in user settings");
    } catch (error) {
      console.error("❌ Failed to update addresses in user settings:", error);
      throw error;
    }
  };

  // Fetch customer details
  const fetchCustomerDetails = async (customerId: number) => {
    try {
      console.log("Fetching customer details for ID:", customerId);
      const response = await axiosInstance.get(`/api/customer/get-customer-by-id/${customerId}`);
      console.log("API Response:", response.data);
      
      const customer = response.data;

      const mobileNo = customer?.mobileNo ?? 
                      customer?.mobileNumber ?? 
                      customer?.phoneNumber ?? 
                      customer?.contactNumber ?? 
                      customer?.phone ?? 
                      "";
      
      const altMobileNo = customer?.altMobileNo ?? 
                         customer?.alternateMobileNo ?? 
                         customer?.altPhoneNumber ?? 
                         customer?.alternateContactNumber ?? 
                         "";

      console.log("Mapped mobile numbers:", { mobileNo, altMobileNo });

      setCustomerData(customer);
      
      const updatedUserData = {
        firstName: customer.firstName || "",
        lastName: customer.lastName || "",
        contactNumber: mobileNo ? mobileNo.toString() : "",
        altContactNumber: altMobileNo ? altMobileNo.toString() : ""
      };

      setUserData(updatedUserData);
      setOriginalData(prev => ({
        ...prev,
        userData: updatedUserData
      }));

      return customer;
    } catch (error) {
      console.error("Error fetching customer details:", error);
      return null;
    }
  };

  // Fetch customer addresses
  const fetchCustomerAddresses = async (customerId: number) => {
    try {
      const response = await utilsInstance.get(`/user-settings/${customerId}`);
      const data = response.data;

      if (Array.isArray(data) && data.length > 0) {
        const allSavedLocations = data.flatMap(doc => doc.savedLocations || []);

        const uniqueAddresses = new Map();
        
        allSavedLocations
          .filter((loc: any) => loc.location?.address?.[0]?.formatted_address)
          .forEach((loc: any, idx: number) => {
            const primaryAddress = loc.location.address[0];
            const addressComponents = primaryAddress.address_components || [];
            
            const getComponent = (type: string) => {
              const component = addressComponents.find((c: any) => c.types.includes(type));
              return component?.long_name || "";
            };

            const locationKey = loc.location.lat && loc.location.lng 
              ? `${loc.location.lat},${loc.location.lng}`
              : primaryAddress.formatted_address;

            if (!uniqueAddresses.has(locationKey)) {
              uniqueAddresses.set(locationKey, {
                id: loc._id || `addr_${idx}`,
                type: loc.name || "Other",
                street: primaryAddress.formatted_address,
                city: getComponent("locality") || 
                      getComponent("administrative_area_level_3") || 
                      getComponent("administrative_area_level_4") || 
                      "",
                country: getComponent("country") || "",
                postalCode: getComponent("postal_code") || "",
                rawData: {
                  formattedAddress: primaryAddress.formatted_address,
                  latitude: loc.location.lat,
                  longitude: loc.location.lng,
                  placeId: primaryAddress.place_id
                }
              });
            }
          });

        const mappedAddresses = Array.from(uniqueAddresses.values());
        
        setAddresses(mappedAddresses);
        setOriginalData(prev => ({
          ...prev,
          addresses: mappedAddresses
        }));
        console.log("Deduplicated addresses:", mappedAddresses);
      } else {
        console.log("No address data found");
        setAddresses([]);
        setOriginalData(prev => ({
          ...prev,
          addresses: []
        }));
      }
    } catch (err) {
      console.error("Failed to fetch customer addresses:", err);
      setAddresses([]);
      setOriginalData(prev => ({
        ...prev,
        addresses: []
      }));
    }
  };

  // Fetch service provider data
  const fetchServiceProviderData = async (serviceProviderId: number) => {
    try {
      const response = await axiosInstance.get(
        `/api/serviceproviders/get/serviceprovider/${serviceProviderId}`
      );

      const data = response.data;
      setServiceProviderData(data);

      const updatedUserData = {
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        contactNumber: data.mobileNo ? data.mobileNo.toString() : "",
        altContactNumber: data.alternateNo ? data.alternateNo.toString() : ""
      };

      setUserData(updatedUserData);
      setOriginalData(prev => ({
        ...prev,
        userData: updatedUserData
      }));

      const addresses: Address[] = [];

      if (data.permanentAddress) {
        const permAddr = data.permanentAddress;
        const streetAddress = `${permAddr.field1 || ""} ${permAddr.field2 || ""}`.trim() || 
                             data.street || 
                             data.buildingName || 
                             "";
        
        addresses.push({
          id: "permanent",
          type: "Permanent",
          street: streetAddress || "Address not specified",
          city: permAddr.ctArea || data.locality || data.currentLocation || "",
          country: permAddr.country || "India",
          postalCode: permAddr.pinNo || (data.pincode ? data.pincode.toString() : ""),
        });
      }

      if (data.correspondenceAddress) {
        const corrAddr = data.correspondenceAddress;
        const streetAddress = `${corrAddr.field1 || ""} ${corrAddr.field2 || ""}`.trim() || 
                             data.street || 
                             data.buildingName || 
                             "";
        
        addresses.push({
          id: "correspondence",
          type: "Correspondence",
          street: streetAddress || "Address not specified",
          city: corrAddr.ctArea || data.locality || data.currentLocation || "",
          country: corrAddr.country || "India",
          postalCode: corrAddr.pinNo || (data.pincode ? data.pincode.toString() : ""),
        });
      }

      if (addresses.length === 0) {
        const serviceProviderAddress: Address = {
          id: "1",
          type: "Home",
          street: `${data.buildingName || ""} ${data.street || ""} ${data.locality || ""}`.trim(),
          city: data.nearbyLocation || data.currentLocation || "",
          country: "India",
          postalCode: data.pincode ? data.pincode.toString() : "",
        };
        addresses.push(serviceProviderAddress);
      }

      setAddresses(addresses);
      setOriginalData(prev => ({
        ...prev,
        addresses: addresses
      }));
    } catch (error) {
      console.error("Failed to fetch service provider data:", error);
    }
  };

  // Handle mobile number update success
  const handleMobileNumberUpdateSuccess = () => {
    dispatch(setHasMobileNumber(true));
    if (userId && userRole === "CUSTOMER") {
      fetchCustomerDetails(userId);
    }
  };

  // Add Address functionality
  const handleAddAddress = async () => {
    if (newAddress.street && newAddress.city && newAddress.country && newAddress.postalCode) {
      const addressType = newAddress.type === "Other" && newAddress.customType 
        ? newAddress.customType 
        : newAddress.type;

      const addressToAdd: Address = {
        type: addressType,
        street: newAddress.street,
        city: newAddress.city,
        country: newAddress.country,
        postalCode: newAddress.postalCode,
        id: `addr_${Date.now()}`,
        rawData: {
          formattedAddress: newAddress.street,
          latitude: 0,
          longitude: 0,
          placeId: `manual_${Date.now()}`
        }
      };

      const updatedAddresses = [...addresses, addressToAdd];
      setAddresses(updatedAddresses);

      if (userRole === "CUSTOMER" && userId) {
        try {
          await saveAddressToUserSettings(addressToAdd);
          await fetchCustomerAddresses(userId);
          console.log("✅ Address saved successfully");
        } catch (err) {
          console.error("❌ Failed to save new address:", err);
          Alert.alert("Error", "Could not save address. Try again.");
          setAddresses(addresses);
          return;
        }
      }

      setNewAddress({
        type: "Home",
        customType: "",
        street: "",
        city: "",
        country: "",
        postalCode: ""
      });
      setShowAddAddress(false);
    } else {
      Alert.alert("Validation Error", "Please fill in all address fields");
    }
  };

  // Remove address
  const removeAddress = async (id: string) => {
    if (addresses.length <= 1) return;
    
    const updatedAddresses = addresses.filter(addr => addr.id !== id);
    
    setAddresses(updatedAddresses);

    if (userRole === "CUSTOMER" && userId) {
      try {
        await updateAddressesInUserSettings(updatedAddresses);
        console.log("✅ Address removed from user settings");
      } catch (error) {
        console.error("❌ Failed to remove address from user settings:", error);
        setAddresses(addresses);
        Alert.alert("Error", "Could not remove address. Try again.");
      }
    }
  };

  useEffect(() => {
    const initializeProfile = async () => {
      setIsLoading(true);

      if (auth0User || appUser) {
        const name = appUser?.name || auth0User?.name || null;
        const role = appUser?.role || "CUSTOMER";
        setUserRole(role);

        const id = role === "SERVICE_PROVIDER" 
          ? appUser?.serviceProviderId 
          : appUser?.customerid;
        
        setUserName(name);
        setUserId(id ? Number(id) : null);

        try {
          if (role === "SERVICE_PROVIDER" && id) {
            await fetchServiceProviderData(id);
            dispatch(setHasMobileNumber(true));
          } else if (role === "CUSTOMER" && id) {
            if (customerLoading) {
              console.log("⏳ Waiting for Redux customer data to load...");
              await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            const updatedUserData = {
              firstName: firstName || name?.split(" ")[0] || "",
              lastName: lastName || name?.split(" ").slice(1).join(" ") || "",
              contactNumber: mobileNo || "",
              altContactNumber: alternateNo || ""
            };
            
            setUserData(updatedUserData);
            setOriginalData(prev => ({
              ...prev,
              userData: updatedUserData
            }));
            
            console.log("✅ Profile data loaded from Redux:", {
              firstName,
              lastName,
              mobileNo,
              hasMobileNumber
            });
            
            if (!hasMobileNumber && !dialogShownInSession) {
              setTimeout(() => {
                setShowMobileDialog(true);
                setDialogShownInSession(true);
              }, 1000);
            }
            
            await fetchCustomerAddresses(Number(id));
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    initializeProfile();
  }, [auth0User, appUser, dialogShownInSession, dispatch]);

  // Update userData when Redux state changes
  useEffect(() => {
    if (userRole === "CUSTOMER" && (firstName || lastName)) {
      const updatedUserData = {
        firstName: firstName || userData.firstName || "",
        lastName: lastName || userData.lastName || "",
        contactNumber: mobileNo || userData.contactNumber || "",
        altContactNumber: alternateNo || userData.altContactNumber || ""
      };
      
      if (JSON.stringify(userData) !== JSON.stringify(updatedUserData)) {
        setUserData(updatedUserData);
        if (!isEditing) {
          setOriginalData(prev => ({
            ...prev,
            userData: updatedUserData
          }));
        }
      }
    }
  }, [firstName, lastName, mobileNo, alternateNo, userRole, isEditing]);

  const handleInputChange = (name: keyof UserData, value: string) => {
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    const isValid = await validateAllFields();
    if (!isValid) {
      return;
    }

    setIsSaving(true);

    try {
      if (userRole === "SERVICE_PROVIDER" && userId) {
        const payload: any = {
          serviceproviderId: userId,
        };

        if (userData.firstName !== originalData.userData.firstName) {
          payload.firstName = userData.firstName;
        }
        if (userData.lastName !== originalData.userData.lastName) {
          payload.lastName = userData.lastName;
        }
        if (userData.contactNumber !== originalData.userData.contactNumber) {
          payload.mobileNo = userData.contactNumber?.replace("+", "") || null;
        }
        if (userData.altContactNumber !== originalData.userData.altContactNumber) {
          payload.alternateNo = userData.altContactNumber?.replace("+", "") || null;
        }

        const permanentAddress = addresses.find(addr => addr.type === "Permanent");
        const correspondenceAddress = addresses.find(addr => addr.type === "Correspondence");

        if (permanentAddress) {
          payload.permanentAddress = {
            field1: permanentAddress.street.split(' ')[0] || "",
            field2: permanentAddress.street || "",
            ctArea: permanentAddress.city || "",
            pinNo: permanentAddress.postalCode || "",
            state: "West Bengal",
            country: permanentAddress.country || "India"
          };
        }

        if (correspondenceAddress) {
          payload.correspondenceAddress = {
            field1: correspondenceAddress.street.split(' ')[0] || "",
            field2: correspondenceAddress.street || "",
            ctArea: correspondenceAddress.city || "",
            pinNo: correspondenceAddress.postalCode || "",
            state: "West Bengal",
            country: correspondenceAddress.country || "India"
          };
        }

        await axiosInstance.put(
          `/api/serviceproviders/update/serviceprovider/${userId}`,
          payload
        );
        await fetchServiceProviderData(userId);
        Alert.alert("Success", "Profile updated successfully");
      } else if (userRole === "CUSTOMER" && userId) {
        const payload: any = {
          customerid: userId,
        };

        if (userData.firstName !== originalData.userData.firstName) {
          payload.firstName = userData.firstName;
        }
        if (userData.lastName !== originalData.userData.lastName) {
          payload.lastName = userData.lastName;
        }
        if (userData.contactNumber !== originalData.userData.contactNumber) {
          payload.mobileNo = userData.contactNumber?.replace("+", "") || null;
        }
        if (userData.altContactNumber !== originalData.userData.altContactNumber) {
          payload.alternateNo = userData.altContactNumber?.replace("+", "") || null;
        }

        await axiosInstance.put(
          `/api/customer/update-customer/${userId}`,
          payload
        );
        
        if (userData.contactNumber) {
          dispatch(setHasMobileNumber(true));
        }
        
        if (JSON.stringify(addresses) !== JSON.stringify(originalData.addresses)) {
          await updateAddressesInUserSettings(addresses);
        }
        
        Alert.alert("Success", "Profile updated successfully");
      }

      setValidatedFields(new Set());
      setContactValidation({ loading: false, error: '', isAvailable: null, formatError: false });
      setAltContactValidation({ loading: false, error: '', isAvailable: null, formatError: false });
      
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save data:", error);
      Alert.alert("Error", "Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setShowAddAddress(false);
    
    setUserData(originalData.userData);
    setAddresses([...originalData.addresses]);
    
    setValidatedFields(new Set());
    setContactValidation({ loading: false, error: '', isAvailable: null, formatError: false });
    setAltContactValidation({ loading: false, error: '', isAvailable: null, formatError: false });
  };

  const handleEditStart = () => {
    setOriginalData({
      userData: { ...userData },
      addresses: [...addresses]
    });
    setIsEditing(true);
  };

  const toggleAddress = (id: string) => {
    setExpandedAddressIds((prev) =>
      prev.includes(id) ? prev.filter((addrId) => addrId !== id) : [...prev, id]
    );
  };

  const handleAddressInputChange = (name: keyof typeof newAddress, value: string) => {
    setNewAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Get available address types based on user role
  const getAvailableAddressTypes = () => {
    if (userRole === "SERVICE_PROVIDER") return ["Permanent", "Correspondence"];
    return ["Home", "Work", "Other"];
  };

  const isFormValid = (): boolean => {
    const contactNumberChanged = userData.contactNumber !== originalData.userData.contactNumber;
    const altContactNumberChanged = userData.altContactNumber !== originalData.userData.altContactNumber;

    const contactValid = !contactNumberChanged || 
      (validateMobileFormat(userData.contactNumber) && 
       (contactValidation.isAvailable === true || contactValidation.isAvailable === null));

    const altContactValid = !altContactNumberChanged || 
      (!userData.altContactNumber ||
       (validateMobileFormat(userData.altContactNumber) && 
        (altContactValidation.isAvailable === true || altContactValidation.isAvailable === null) &&
        areNumbersUnique()));

    return contactValid && altContactValid;
  };

  // Country code options
  const countryCodes = [
    { label: "+91 (IN)", value: "+91" },
    { label: "+1 (US)", value: "+1" },
    { label: "+44 (UK)", value: "+44" },
    { label: "+61 (AU)", value: "+61" },
    { label: "+65 (SG)", value: "+65" },
    { label: "+971 (UAE)", value: "+971" },
  ];

  // Loading Screen Component
  const LoadingScreen = () => (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingContent}>
        <ActivityIndicator size="large" color="#0E305C" />
        <Text style={styles.loadingText}>Loading your profile</Text>
        <Text style={styles.loadingSubtext}>Please wait while we fetch your information</Text>
      </View>
    </View>
  );

  // Skeleton Loading Component
  const SkeletonLoader = () => (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <LinearGradient
        colors={['rgba(177, 213, 232, 0.8)', 'rgba(255, 255, 255, 1)']}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={styles.headerSkeleton}
      >
        <View style={styles.headerContentSkeleton}>
          <View style={styles.profileSection}>
            {renderProfilePicture()}
            <View style={styles.profileTextContainer}>
              <View style={styles.greetingSkeleton} />
              <View style={styles.roleSkeleton} />
            </View>
          </View>
          <View style={styles.editButtonSkeleton} />
        </View>
      </LinearGradient>

      {/* Main Content Skeleton */}
      <View style={styles.mainContentSkeleton}>
        <View style={styles.cardSkeleton}>
          <View style={styles.formHeaderSkeleton}>
            <View style={styles.titleSkeleton} />
          </View>

          <View style={styles.sectionSkeleton}>
            <View style={styles.sectionTitleSkeleton} />
            <View style={styles.rowSkeleton}>
              <View style={styles.inputGroupSkeleton}>
                <View style={styles.labelSkeleton} />
                <View style={styles.inputSkeleton} />
              </View>
              <View style={styles.inputGroupSkeleton}>
                <View style={styles.labelSkeleton} />
                <View style={styles.inputSkeleton} />
              </View>
            </View>

            <View style={styles.nameRowSkeleton}>
              <View style={styles.nameInputSkeleton}>
                <View style={styles.labelSkeleton} />
                <View style={styles.inputSkeleton} />
              </View>
              <View style={styles.nameInputSkeleton}>
                <View style={styles.labelSkeleton} />
                <View style={styles.inputSkeleton} />
              </View>
            </View>

            <View style={styles.inputGroupSkeleton}>
              <View style={styles.labelSkeleton} />
              <View style={styles.inputSkeleton} />
            </View>
          </View>

          <View style={styles.dividerSkeleton} />

          <View style={styles.sectionSkeleton}>
            <View style={styles.sectionTitleSkeleton} />
            <View style={styles.rowSkeleton}>
              <View style={styles.inputGroupSkeleton}>
                <View style={styles.labelSkeleton} />
                <View style={styles.inputSkeleton} />
              </View>
              <View style={styles.inputGroupSkeleton}>
                <View style={styles.labelSkeleton} />
                <View style={styles.inputSkeleton} />
              </View>
            </View>
          </View>

          <View style={styles.sectionSkeleton}>
            <View style={styles.labelSkeleton} />
            <View style={styles.addressCardSkeleton}>
              <View style={styles.addressHeaderSkeleton}>
                <View style={styles.addressTitleSkeleton} />
              </View>
              <View style={styles.addressLineSkeleton} />
              <View style={styles.addressLineShortSkeleton} />
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  if (auth0Loading || isLoading) {
    return <SkeletonLoader />;
  }

  return (
    <ScrollView style={styles.container}>
      {/* Mobile Number Dialog */}
      <MobileNumberDialog 
        visible={showMobileDialog}
        onClose={() => setShowMobileDialog(false)}
        customerId={appUser?.customerid}
        onSuccess={handleMobileNumberUpdateSuccess}
      />

      {/* Header with Linear Gradient */}
      <LinearGradient
        colors={['rgba(177, 213, 232, 0.8)', 'rgba(255, 255, 255, 1)']}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          {/* Profile Section */}
          <View style={styles.profileSection}>
            {renderProfilePicture()}
            <View style={styles.profileTextContainer}>
              <Text style={styles.greeting}>
                Hello, {getDisplayName()}
              </Text>
              <Text style={styles.roleText}>
                {userRole === "SERVICE_PROVIDER" ? "Service Provider" : "Customer"}, {getUserIdDisplay()}
                {userRole === "CUSTOMER" && !hasMobileNumber && (
                  <Text style={styles.mobileWarningSmall}> ⚠️ Mobile number required</Text>
                )}
              </Text>   
            </View>
          </View>

          {/* Edit Button - Top Right like web version */}
          {!isEditing && (
            <TouchableOpacity
              style={styles.editButtonTop}
              onPress={handleEditStart}
            >
              <Icon name="edit-3" size={16} color="#fdfeffff" />
              <Text style={styles.editButtonText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Main Content */}
      <View style={styles.mainContent}>
        <View style={styles.formContainer}>
          {/* Form Header */}
          <View style={styles.formHeader}>
            <Text style={styles.formTitle}>My account</Text>
            {userRole === "CUSTOMER" && !hasMobileNumber && (
              <TouchableOpacity
                onPress={() => setShowMobileDialog(true)}
                style={styles.addMobileButton}
              >
                <Text style={styles.addMobileButtonText}>Add Mobile Number</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* User Info Section */}
         {/* User Info Section */}
<View>
  <Text style={styles.sectionTitle}>User Information</Text>

  <View style={styles.inputRow}>
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>Username</Text>
      <TextInput
        style={[styles.input, styles.readOnlyInput]}
        value={appUser?.nickname || userName || "User"}
        editable={false}
      />
    </View>
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>Email address</Text>
      <TextInput
        style={[styles.input, styles.readOnlyInput]}
        value={appUser?.email || auth0User?.email || emailId || "No email available"}
        editable={false}
      />
    </View>
  </View>

  <View style={styles.ultraCompactNameRow}>
    <View style={styles.ultraCompactNameInput}>
      <Text style={styles.compactLabel}>First name</Text>
      <TextInput
        style={[styles.ultraCompactInput, !isEditing && styles.readOnlyInput]}
        value={userData.firstName}
        onChangeText={(value) => handleInputChange("firstName", value)}
        editable={isEditing}
        placeholder="First"
      />
    </View>
    <View style={styles.ultraCompactNameInput}>
      <Text style={styles.compactLabel}>Last name</Text>
      <TextInput
        style={[styles.ultraCompactInput, !isEditing && styles.readOnlyInput]}
        value={userData.lastName}
        onChangeText={(value) => handleInputChange("lastName", value)}
        editable={isEditing}
        placeholder="Last"
      />
    </View>
    <View style={styles.ultraCompactNameInput}>
      <Text style={styles.compactLabel}>
        {userRole === "SERVICE_PROVIDER" ? "Provider ID" : "User ID"}
      </Text>
      <TextInput
        style={[styles.ultraCompactInput, styles.readOnlyInput]}
        value={getUserIdDisplay()}
        editable={false}
      />
    </View>
  </View>
</View>

          <View style={styles.divider} />

          {/* Contact Info Section */}
          <Text style={styles.sectionTitle}>Contact Information</Text>

          <View style={styles.inputRow}>
            {/* Contact Number */}
            <View style={styles.inputContainer}>
              <View style={styles.labelContainer}>
                <Text style={styles.inputLabel}>
                  Contact Number
                </Text>
                {userRole === "CUSTOMER" && (
                  <Text style={!hasMobileNumber ? styles.mobileWarningSmall : styles.mobileSuccess}>
                    {!hasMobileNumber ? ' ⚠️' : ' ✓'}
                  </Text>
                )}
              </View>
              <View style={styles.phoneInputContainer}>
                {isEditing ? (
                  <TouchableOpacity
                    style={styles.countryCodeContainer}
                    onPress={() => setShowCountryCodePicker(true)}
                  >
                    <Text style={styles.countryCodeText}>{countryCode}</Text>
                    <Icon name="chevron-down" size={16} color="#4a5568" />
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.countryCodeContainer, styles.readOnlyInput]}>
                    <Text style={styles.countryCodeText}>{countryCode}</Text>
                  </View>
                )}
                <TextInput
                  style={[
                    styles.phoneInput, 
                    !isEditing && styles.readOnlyInput,
                    !hasMobileNumber && userRole === "CUSTOMER" && styles.invalidInput,
                    contactValidation.error && styles.invalidInput
                  ]}
                  value={formatMobileNumber(userData.contactNumber)}
                  onChangeText={handleContactNumberChange}
                  placeholder="Enter 10-digit number"
                  editable={isEditing}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                {isEditing && (
                  <View style={styles.validationIcon}>
                    {contactValidation.loading && (
                      <ActivityIndicator size="small" color="#3b82f6" />
                    )}
                    {contactValidation.isAvailable && !contactValidation.loading && (
                      <Icon name="check" size={16} color="#10b981" />
                    )}
                    {contactValidation.isAvailable === false && !contactValidation.loading && (
                      <Icon name="alert-circle" size={16} color="#ef4444" />
                    )}
                  </View>
                )}
              </View>
              
              {/* Validation Messages */}
              {contactValidation.error && (
                <Text style={styles.validationError}>{contactValidation.error}</Text>
              )}
              {contactValidation.formatError && isEditing && (
                <Text style={styles.validationError}>Please enter exactly 10 digits</Text>
              )}
              {contactValidation.isAvailable && (
                <Text style={styles.validationSuccess}>Contact number is available</Text>
              )}
              {userRole === "CUSTOMER" && !hasMobileNumber && !isEditing && (
                <View style={styles.mobileWarningContainer}>
                  <Text style={styles.mobileRequiredText}>
                    Mobile number is required for bookings and notifications
                  </Text>
                  <TouchableOpacity onPress={() => setShowMobileDialog(true)}>
                    <Text style={styles.addLink}>Click here to add mobile number</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Alternative Contact Number */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Alternative Contact Number</Text>
              <View style={styles.phoneInputContainer}>
                {isEditing ? (
                  <TouchableOpacity
                    style={styles.countryCodeContainer}
                    onPress={() => setShowAltCountryCodePicker(true)}
                  >
                    <Text style={styles.countryCodeText}>{altCountryCode}</Text>
                    <Icon name="chevron-down" size={16} color="#4a5568" />
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.countryCodeContainer, styles.readOnlyInput]}>
                    <Text style={styles.countryCodeText}>{altCountryCode}</Text>
                  </View>
                )}
                <TextInput
                  style={[
                    styles.phoneInput, 
                    !isEditing && styles.readOnlyInput,
                    altContactValidation.error && styles.invalidInput
                  ]}
                  value={formatMobileNumber(userData.altContactNumber)}
                  onChangeText={handleAltContactNumberChange}
                  placeholder="Enter 10-digit number"
                  editable={isEditing}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                {isEditing && (
                  <View style={styles.validationIcon}>
                    {altContactValidation.loading && (
                      <ActivityIndicator size="small" color="#3b82f6" />
                    )}
                    {altContactValidation.isAvailable && !altContactValidation.loading && (
                      <Icon name="check" size={16} color="#10b981" />
                    )}
                    {altContactValidation.isAvailable === false && !altContactValidation.loading && (
                      <Icon name="alert-circle" size={16} color="#ef4444" />
                    )}
                  </View>
                )}
              </View>
              
              {/* Validation Messages */}
              {altContactValidation.error && (
                <Text style={styles.validationError}>{altContactValidation.error}</Text>
              )}
              {altContactValidation.formatError && isEditing && (
                <Text style={styles.validationError}>Please enter exactly 10 digits</Text>
              )}
              {altContactValidation.isAvailable && (
                <Text style={styles.validationSuccess}>Alternate number is available</Text>
              )}
            </View>
          </View>

          {/* Country Code Pickers */}
          <Modal
            visible={showCountryCodePicker}
            transparent={true}
            animationType="slide"
          >
            <View style={styles.modalContainer}>
              <View style={styles.pickerModal}>
                <Text style={styles.pickerTitle}>Select Country Code</Text>
                <Picker
                  selectedValue={countryCode}
                  onValueChange={(itemValue) => {
                    setCountryCode(itemValue);
                    setShowCountryCodePicker(false);
                  }}
                >
                  {countryCodes.map((code) => (
                    <Picker.Item key={code.value} label={code.label} value={code.value} />
                  ))}
                </Picker>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowCountryCodePicker(false)}
                >
                  <Text style={styles.pickerButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal
            visible={showAltCountryCodePicker}
            transparent={true}
            animationType="slide"
          >
            <View style={styles.modalContainer}>
              <View style={styles.pickerModal}>
                <Text style={styles.pickerTitle}>Select Country Code</Text>
                <Picker
                  selectedValue={altCountryCode}
                  onValueChange={(itemValue) => {
                    setAltCountryCode(itemValue);
                    setShowAltCountryCodePicker(false);
                  }}
                >
                  {countryCodes.map((code) => (
                    <Picker.Item key={code.value} label={code.label} value={code.value} />
                  ))}
                </Picker>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setShowAltCountryCodePicker(false)}
                >
                  <Text style={styles.pickerButtonText}>Done</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Address Section */}
          <View style={styles.addressesSection}>
            <View style={styles.addressesHeader}>
              <Text style={styles.inputLabel}>Addresses</Text>
              {isEditing && userRole === "CUSTOMER" && (
                <TouchableOpacity
                  onPress={() => setShowAddAddress(!showAddAddress)}
                  style={styles.addAddressButton}
                >
                  <Icon name="plus" size={16} color="#0a2a66" />
                  <Text style={styles.addAddressText}>Add New Address</Text>
                </TouchableOpacity>
              )}
            </View>

            {showAddAddress && isEditing && (
              <View style={styles.addAddressForm}>
                <View style={styles.addAddressFormHeader}>
                  <Text style={styles.addAddressFormTitle}>Add New Address</Text>
                  <TouchableOpacity 
                    onPress={() => setShowAddAddress(false)}
                  >
                    <Icon name="x" size={20} color="#666" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.addressTypeContainer}>
                  <Text style={styles.formLabel}>Save As</Text>
                  <View style={styles.addressTypeButtons}>
                    <TouchableOpacity
                      onPress={() => handleUserPreference("Home")}
                      style={[
                        styles.addressTypeButton,
                        newAddress.type === "Home" && styles.addressTypeButtonActive
                      ]}
                    >
                      <Icon name="home" size={14} color={newAddress.type === "Home" ? "#2563eb" : "#4b5563"} />
                      <Text style={[
                        styles.addressTypeText,
                        newAddress.type === "Home" && styles.addressTypeTextActive
                      ]}>Home</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleUserPreference("Work")}
                      style={[
                        styles.addressTypeButton,
                        newAddress.type === "Work" && styles.addressTypeButtonActive
                      ]}
                    >
                      <MaterialCommunityIcons name="office-building" size={14} color={newAddress.type === "Work" ? "#2563eb" : "#4b5563"} />
                      <Text style={[
                        styles.addressTypeText,
                        newAddress.type === "Work" && styles.addressTypeTextActive
                      ]}>Work</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleUserPreference()}
                      style={[
                        styles.addressTypeButton,
                        newAddress.type === "Other" && styles.addressTypeButtonActive
                      ]}
                    >
                      <Icon name="map-pin" size={14} color={newAddress.type === "Other" ? "#2563eb" : "#4b5563"} />
                      <Text style={[
                        styles.addressTypeText,
                        newAddress.type === "Other" && styles.addressTypeTextActive
                      ]}>Other</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {newAddress.type === "Other" && (
                  <View style={styles.formField}>
                    <Text style={styles.formLabel}>Location Name</Text>
                    <TextInput
                      style={styles.formInput}
                      placeholder="Enter location name"
                      value={newAddress.customType}
                      onChangeText={(value) => handleAddressInputChange('customType', value)}
                    />
                  </View>
                )}
                
                <View style={styles.addressFormInput}>
                  <Text style={styles.inputLabel}>Street Address</Text>
                  <TextInput
                    style={styles.input}
                    value={newAddress.street}
                    onChangeText={(value) => handleAddressInputChange("street", value)}
                    placeholder="Enter street address"
                  />
                </View>
                
                <View style={styles.addressFormRow}>
                  <View style={[styles.addressFormInput, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>City</Text>
                    <TextInput
                      style={styles.input}
                      value={newAddress.city}
                      onChangeText={(value) => handleAddressInputChange("city", value)}
                      placeholder="Enter city"
                    />
                  </View>
                  
                  <View style={[styles.addressFormInput, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Country</Text>
                    <TextInput
                      style={styles.input}
                      value={newAddress.country}
                      onChangeText={(value) => handleAddressInputChange("country", value)}
                      placeholder="Enter country"
                    />
                  </View>
                  
                  <View style={[styles.addressFormInput, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Postal Code</Text>
                    <TextInput
                      style={styles.input}
                      value={newAddress.postalCode}
                      onChangeText={(value) => handleAddressInputChange("postalCode", value)}
                      placeholder="Enter postal code"
                    />
                  </View>
                </View>
                
                <TouchableOpacity
                  onPress={handleAddAddress}
                  style={styles.addAddressSubmitButton}
                  disabled={!newAddress.street || !newAddress.city || !newAddress.country || !newAddress.postalCode}
                >
                  <Text style={styles.addAddressSubmitText}>Add Address</Text>
                </TouchableOpacity>
              </View>
            )}

            {addresses.length === 0 ? (
              <Text style={styles.noAddressText}>No addresses saved yet</Text>
            ) : (
              <View style={styles.addressesList}>
                {addresses.map((address) => {
                  const isExpanded = userRole === "SERVICE_PROVIDER" || expandedAddressIds.includes(address.id);

                  return (
                    <View
                      key={address.id}
                      style={[
                        styles.addressCard,
                        isExpanded && styles.expandedAddressCard
                      ]}
                    >
                      {/* Header */}
                      <View style={styles.addressHeader}>
                        <View style={styles.addressTitleContainer}>
                          <Text style={styles.addressType}>{address.type}</Text>
                        </View>

                        <View style={styles.addressActions}>
                          {userRole === "CUSTOMER" && (
                            <TouchableOpacity
                              onPress={() => toggleAddress(address.id)}
                              style={styles.addressActionButton}
                            >
                              <Icon
                                name={isExpanded ? "chevron-up" : "chevron-down"}
                                size={20}
                                color="#666"
                              />
                            </TouchableOpacity>
                          )}
                          {isEditing && userRole === "CUSTOMER" && addresses.length > 1 && (
                            <TouchableOpacity
                              onPress={() => removeAddress(address.id)}
                              style={styles.addressActionButton}
                            >
                              <Icon name="x" size={20} color="#dc2626" />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>

                      {/* Body (only show when expanded) */}
                      {isExpanded && (
                        <View style={styles.addressDetails}>
                          <Text style={styles.addressText}>{address.street}</Text>
                          <Text style={styles.addressText}>
                            {(address.city || "No city")},{" "}
                            {(address.country || "No country")}{" "}
                            {address.postalCode || ""}
                          </Text>
                          {userRole === "SERVICE_PROVIDER" && (
                            <Text style={styles.addressNote}>
                              Service provider addresses are managed separately
                            </Text>
                          )}
                        </View>
                      )}

                      {userRole === "CUSTOMER" && !isExpanded && (
                        <Text style={styles.addressPreview} numberOfLines={1}>
                          {address.street}
                        </Text>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Service Provider Status Section */}
          {userRole === "SERVICE_PROVIDER" && (
            <View style={styles.serviceStatusSection}>
              <View style={styles.divider} />
              
              <Text style={styles.sectionTitle}>Service Status</Text>
              
              <View style={styles.statusCard}>
                <View style={styles.statusGrid}>
                  <View style={styles.statusItem}>
                    <Text style={styles.statusLabel}>Account Status</Text>
                    <View style={styles.statusValue}>
                      <View style={[styles.statusIndicator, styles.statusActive]} />
                      <Text style={styles.statusText}>Verified</Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.statusFooter}>
                  <Text style={styles.statusUpdateText}>
                    Active Service Provider
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Action Buttons - Now only at the bottom like web version */}
          {isEditing && (
            <View style={styles.actionButtonsContainer}>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleCancel}
                  disabled={isSaving}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton, (!isFormValid() || !hasChanges()) && styles.disabledButton]}
                  onPress={handleSave}
                  disabled={isSaving || !isFormValid() || !hasChanges()}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.buttonText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 MyApp All rights reserved.</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  loadingContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  loadingSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    width: '100%',
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#0a2a66",
    marginRight: 15,
  },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#0a2a66",
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  profileTextContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0a2a66",
  },
  roleText: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  editButtonTop: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4ea6e9ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  editButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
    marginLeft: 6,
  },
  mobileWarningSmall: {
    color: "#dc2626",
    fontSize: 12,
  },
  mobileSuccess: {
    color: "#16a34a",
    fontSize: 12,
  },
  mobileRequiredText: {
    color: "#dc2626",
    fontSize: 12,
    marginTop: 4,
  },
  mobileWarningContainer: {
    marginTop: 4,
  },
  addLink: {
    color: "#2563eb",
    fontSize: 12,
    marginTop: 4,
    textDecorationLine: 'underline',
  },
  mainContent: {
    alignItems: "center",
    padding: 16,
    marginTop: -20,
  },
  formContainer: {
    width: width - 32,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingBottom: 12,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2d3748",
  },
  addMobileButton: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addMobileButtonText: {
    color: "#dc2626",
    fontSize: 12,
    fontWeight: "600",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#718096",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  inputContainer: {
    width: width > 500 ? "48%" : "100%",
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4a5568",
    marginBottom: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  input: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    fontSize: 14,
  },
  readOnlyInput: {
    backgroundColor: "#f7fafc",
  },
  invalidInput: {
    borderColor: "#dc2626",
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 20,
  },
  // Address section styles
  addressesSection: {
    marginBottom: 20,
  },
  noAddressText: {
    color: "#666",
    fontStyle: "italic",
  },
  addressesList: {
    gap: 12,
  },
  addressCard: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
  },
  expandedAddressCard: {
    padding: 16,
  },
  addressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addressType: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  addressDetails: {
    marginTop: 8,
  },
  addressText: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 4,
    lineHeight: 20,
  },
  addressNote: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 8,
  },
  addressPreview: {
    fontSize: 14,
    color: "#4b5563",
    marginTop: 8,
  },
  footer: {
    backgroundColor: "#f3f4f6",
    padding: 16,
    alignItems: "center",
    marginTop: 20,
  },
  footerText: {
    color: "#6b7280",
    fontSize: 12,
  },
  // Skeleton styles
  headerSkeleton: {
    paddingTop: 60,
    paddingBottom: 30,
  },
  headerContentSkeleton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  greetingSkeleton: {
    width: 200,
    height: 28,
    backgroundColor: "#ddd",
    borderRadius: 4,
    marginBottom: 8,
  },
  roleSkeleton: {
    width: 120,
    height: 18,
    backgroundColor: "#ddd",
    borderRadius: 4,
  },
  editButtonSkeleton: {
    width: 80,
    height: 36,
    backgroundColor: "#ddd",
    borderRadius: 20,
  },
  mainContentSkeleton: {
    alignItems: "center",
    padding: 16,
    marginTop: -20,
  },
  cardSkeleton: {
    width: width - 32,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formHeaderSkeleton: {
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingBottom: 12,
    marginBottom: 16,
  },
  titleSkeleton: {
    width: 100,
    height: 24,
    backgroundColor: "#ddd",
    borderRadius: 4,
  },
  sectionSkeleton: {
    marginBottom: 20,
  },
  sectionTitleSkeleton: {
    width: 160,
    height: 20,
    backgroundColor: "#ddd",
    borderRadius: 4,
    marginBottom: 16,
  },
  rowSkeleton: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  nameRowSkeleton: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  nameInputSkeleton: {
    flex: 1,
    marginBottom: 16,
  },
  inputGroupSkeleton: {
    width: width > 500 ? "48%" : "100%",
    marginBottom: 16,
  },
  labelSkeleton: {
    width: 80,
    height: 16,
    backgroundColor: "#ddd",
    borderRadius: 4,
    marginBottom: 8,
  },
  inputSkeleton: {
    width: "100%",
    height: 40,
    backgroundColor: "#eee",
    borderRadius: 8,
  },
  dividerSkeleton: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 20,
  },
  addressCardSkeleton: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  addressHeaderSkeleton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  addressTitleSkeleton: {
    width: 120,
    height: 20,
    backgroundColor: "#ddd",
    borderRadius: 4,
  },
  addressLineSkeleton: {
    width: "100%",
    height: 16,
    backgroundColor: "#eee",
    borderRadius: 4,
    marginBottom: 8,
  },
  addressLineShortSkeleton: {
    width: "75%",
    height: 16,
    backgroundColor: "#eee",
    borderRadius: 4,
  },
  // Phone input styles
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  countryCodeContainer: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRightWidth: 0,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    backgroundColor: '#f7fafc',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 80,
  },
  countryCodeText: {
    fontSize: 14,
    color: '#4a5568',
  },
  phoneInput: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    fontSize: 14,
  },
  validationIcon: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -8 }],
  },
  validationError: {
    color: '#dc2626',
    fontSize: 12,
    marginTop: 4,
  },
  validationSuccess: {
    color: '#16a34a',
    fontSize: 12,
    marginTop: 4,
  },
  addressesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addAddressText: {
    color: '#0a2a66',
    fontWeight: '600',
    marginLeft: 4,
  },
  addAddressForm: {
    borderWidth: 1,
    borderColor: '#93c5fd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#dbeafe',
  },
  addAddressFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addAddressFormTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1e40af',
  },
  addressFormRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  addressFormInput: {
    marginBottom: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 44,
    backgroundColor: 'white',
  },
  // Modal styles for country code picker
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  pickerModal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
  },
  pickerTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  pickerButton: {
    backgroundColor: '#0a2a66',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  pickerButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  // Service status section styles
  serviceStatusSection: {
    marginBottom: 20,
  },
  statusCard: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusItem: {
    alignItems: 'center',
    flex: 1,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#718096',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  statusValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusActive: {
    backgroundColor: '#10b981',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2d3748',
  },
  statusFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  statusUpdateText: {
    fontSize: 12,
    color: '#718096',
  },
  // Ultra compact styles
  ultraCompactNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 8,
  },
  ultraCompactNameInput: {
    flex: 1,
  },
  ultraCompactInput: {
    width: "100%",
    paddingStart: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    fontSize: 14,
    minHeight: 40,
  },
  compactLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4a5568",
    marginBottom: 6,
  },
  // Action buttons container
  actionButtonsContainer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    alignItems: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 120,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: "#6c757d",
  },
  saveButton: {
    backgroundColor: "#0a2a66",
  },
  disabledButton: {
    backgroundColor: "#9ca3af",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
  addressTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressActionButton: {
    padding: 4,
    marginLeft: 8,
  },
  addressTypeContainer: {
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
    marginBottom: 8,
  },
  addressTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  addressTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  addressTypeButtonActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
  },
  addressTypeText: {
    fontSize: 14,
    color: '#4b5563',
  },
  addressTypeTextActive: {
    color: '#2563eb',
  },
  formField: {
    marginBottom: 12,
  },
  formInput: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  addAddressSubmitButton: {
    backgroundColor: '#0a2a66',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addAddressSubmitText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default ProfileScreen;