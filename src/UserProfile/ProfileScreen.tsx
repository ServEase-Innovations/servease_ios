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
  BackHandler, // Add this import
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useAuth0 } from "react-native-auth0";
import LinearGradient from "react-native-linear-gradient";
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
import { useTheme } from "../../src/Settings/ThemeContext";
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get("window");

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

interface ProfileScreenProps {
  onBackToHome?: () => void; // Add this prop for back navigation
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBackToHome }) => {
  const { user: auth0User, isLoading: auth0Loading } = useAuth0();
  const { appUser } = useAppUser();
  const { colors, fontSize, isDarkMode } = useTheme();
  const { t } = useTranslation();

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
    loading: customerLoading,
  } = useSelector((state: RootState) => state.customer);

  console.log("App User from Context:", appUser);

  const [userName, setUserName] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userRole, setUserRole] = useState<string>("CUSTOMER");
  const [serviceProviderData, setServiceProviderData] =
    useState<ServiceProvider | null>(null);
  const [customerData, setCustomerData] = useState<CustomerDetails | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [expandedAddressIds, setExpandedAddressIds] = useState<string[]>([]);
  const [showMobileDialog, setShowMobileDialog] = useState(false);
  const [dialogShownInSession, setDialogShownInSession] = useState(false);

  const [userData, setUserData] = useState<UserData>({
    firstName: "",
    lastName: "",
    contactNumber: "",
    altContactNumber: "",
  });

  const [originalData, setOriginalData] = useState<OriginalData>({
    userData: {
      firstName: "",
      lastName: "",
      contactNumber: "",
      altContactNumber: "",
    },
    addresses: [],
  });

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    type: "Home",
    customType: "",
    street: "",
    city: "",
    country: "",
    postalCode: "",
  });
  const [countryCode, setCountryCode] = useState("+91");
  const [altCountryCode, setAltCountryCode] = useState("+91");
  const [showCountryCodePicker, setShowCountryCodePicker] = useState(false);
  const [showAltCountryCodePicker, setShowAltCountryCodePicker] =
    useState(false);

  // Validation states
  const [contactValidation, setContactValidation] = useState<ValidationState>({
    loading: false,
    error: "",
    isAvailable: null,
    formatError: false,
  });
  const [altContactValidation, setAltContactValidation] =
    useState<ValidationState>({
      loading: false,
      error: "",
      isAvailable: null,
      formatError: false,
    });

  // Track which fields have been validated
  const [validatedFields, setValidatedFields] = useState<Set<string>>(
    new Set(),
  );

  // Get font sizes based on theme
  const getFontSizes = () => {
    switch (fontSize) {
      case "small":
        return {
          greeting: 20,
          roleText: 13,
          formTitle: 18,
          sectionTitle: 13,
          inputLabel: 13,
          input: 13,
          buttonText: 13,
          addressType: 13,
          addressText: 13,
          footerText: 11,
          validationText: 11,
          statusLabel: 11,
          statusText: 13,
          compactLabel: 13,
        };
      case "large":
        return {
          greeting: 26,
          roleText: 16,
          formTitle: 22,
          sectionTitle: 16,
          inputLabel: 16,
          input: 16,
          buttonText: 16,
          addressType: 16,
          addressText: 16,
          footerText: 14,
          validationText: 14,
          statusLabel: 14,
          statusText: 16,
          compactLabel: 16,
        };
      default:
        return {
          greeting: 22,
          roleText: 14,
          formTitle: 20,
          sectionTitle: 14,
          inputLabel: 14,
          input: 14,
          buttonText: 14,
          addressType: 14,
          addressText: 14,
          footerText: 12,
          validationText: 12,
          statusLabel: 12,
          statusText: 14,
          compactLabel: 14,
        };
    }
  };

  const fontSizes = getFontSizes();

  // Function to handle user preference selection
  const handleUserPreference = (preference?: string) => {
    console.log("User preference selected: ", preference);

    if (!preference) {
      setNewAddress((prev) => ({ ...prev, type: "Other", customType: "" }));
    } else {
      setNewAddress((prev) => ({ ...prev, type: preference, customType: "" }));
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
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#96CEB4",
      "#FFEAA7",
      "#DDA0DD",
      "#98D8C8",
      "#F7DC6F",
      "#BB8FCE",
      "#85C1E9",
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
          <Text style={[styles.avatarText, { fontSize: fontSizes.greeting }]}>
            {initial}
          </Text>
        </View>
      );
    }
  };

  const getUserIdDisplay = () => {
    if (userRole === "SERVICE_PROVIDER") {
      // Try multiple sources for service provider ID
      return (
        appUser?.serviceProviderId?.toString() ||
        userId?.toString() ||
        serviceProviderData?.serviceproviderId?.toString() ||
        t('common.na')
      );
    } else {
      // Try multiple sources for customer ID
      return (
        appUser?.customerid?.toString() ||
        userId?.toString() ||
        customerId?.toString() ||
        customerData?.customerid?.toString() ||
        t('common.na')
      );
    }
  };

  // Function to get display name for greeting
  const getDisplayName = () => {
    return userName || appUser?.nickname || t('profile.page.user');
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

  const checkMobileAvailability = async (
    number: string,
    isAlternate: boolean = false,
  ): Promise<boolean> => {
    if (!number || !validateMobileFormat(number)) {
      return false;
    }

    const setValidation = isAlternate
      ? setAltContactValidation
      : setContactValidation;
    const fieldName = isAlternate ? "altContactNumber" : "contactNumber";

    setValidation({
      loading: true,
      error: "",
      isAvailable: null,
      formatError: false,
    });

    try {
      const endpoint = "/api/service-providers/check-mobile";
      const payload = { mobile: number };

      const response = await providerInstance.post(endpoint, payload);

      let isAvailable = true;
      let errorMessage = "";

      if (response.data.exists !== undefined) {
        isAvailable = !response.data.exists;
        errorMessage = response.data.exists
          ? isAlternate 
            ? t('errors.alternateNumberUnavailable')
            : t('errors.contactNumberUnavailable')
          : "";
      } else if (response.data.available !== undefined) {
        isAvailable = response.data.available;
        errorMessage = !response.data.available
          ? isAlternate 
            ? t('errors.alternateNumberUnavailable')
            : t('errors.contactNumberUnavailable')
          : "";
      } else if (response.data.isAvailable !== undefined) {
        isAvailable = response.data.isAvailable;
        errorMessage = !response.data.isAvailable
          ? isAlternate 
            ? t('errors.alternateNumberUnavailable')
            : t('errors.contactNumberUnavailable')
          : "";
      } else {
        isAvailable = true;
      }

      setValidation({
        loading: false,
        error: errorMessage,
        isAvailable,
        formatError: false,
      });

      if (isAvailable) {
        setValidatedFields((prev) => {
          const newSet = new Set(prev);
          newSet.add(fieldName);
          return newSet;
        });
      }

      return isAvailable;
    } catch (error: any) {
      console.error("Error validating mobile number:", error);

      let errorMessage = t('errors.generic');

      if (error.response?.data) {
        const apiError = error.response.data;
        if (typeof apiError === "string") {
          errorMessage = apiError;
        } else if (apiError.message) {
          errorMessage = apiError.message;
        } else if (apiError.error) {
          errorMessage = apiError.error;
        }
      } else if (error.response?.status === 400) {
        errorMessage = t('validation.phone');
      } else if (error.response?.status === 409) {
        errorMessage = isAlternate 
          ? t('errors.alternateNumberUnavailable')
          : t('errors.contactNumberUnavailable');
      } else if (error.response?.status === 500) {
        errorMessage = t('errors.server');
      }

      setValidation({
        loading: false,
        error: errorMessage,
        isAvailable: false,
        formatError: false,
      });

      return false;
    }
  };

  // Debounced validation
  const useDebouncedValidation = () => {
    const timeouts = {
      contact: null as NodeJS.Timeout | null,
      alternate: null as NodeJS.Timeout | null,
    };

    return (number: string, isAlternate: boolean = false) => {
      const timeoutKey = isAlternate ? "alternate" : "contact";

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
    const cleanedValue = value.replace(/\D/g, "").slice(0, 10);
    setUserData((prev) => ({ ...prev, contactNumber: cleanedValue }));

    setContactValidation((prev) => ({
      ...prev,
      loading: false,
      error: "",
      isAvailable: null,
      formatError: false,
    }));

    if (cleanedValue.length === 10) {
      setContactValidation((prev) => ({
        ...prev,
        formatError: false,
        error:
          prev.error === t('profile.page.exactly10Digits')
            ? ""
            : prev.error,
      }));

      debouncedValidation(cleanedValue, false);

      if (userData.altContactNumber === cleanedValue) {
        setAltContactValidation((prev) => ({
          ...prev,
          error: t('profile.page.numbersMustBeDifferent'),
          isAvailable: false,
          formatError: false,
        }));
      } else if (
        userData.altContactNumber &&
        userData.altContactNumber.length === 10
      ) {
        if (
          altContactValidation.error === t('profile.page.numbersMustBeDifferent')
        ) {
          setAltContactValidation((prev) => ({
            ...prev,
            error: "",
            isAvailable: null,
            formatError: false,
          }));
          debouncedValidation(userData.altContactNumber, true);
        }
      }
    } else if (cleanedValue) {
      setContactValidation({
        loading: false,
        error: t('profile.page.exactly10Digits'),
        isAvailable: null,
        formatError: true,
      });
    } else {
      setContactValidation({
        loading: false,
        error: "",
        isAvailable: null,
        formatError: false,
      });
    }
  };

  const handleAltContactNumberChange = (value: string) => {
    const cleanedValue = value.replace(/\D/g, "").slice(0, 10);
    setUserData((prev) => ({ ...prev, altContactNumber: cleanedValue }));

    setAltContactValidation((prev) => ({
      ...prev,
      loading: false,
      error: "",
      isAvailable: null,
      formatError: false,
    }));

    if (cleanedValue) {
      if (cleanedValue.length === 10) {
        setAltContactValidation((prev) => ({
          ...prev,
          formatError: false,
          error:
            prev.error === t('profile.page.exactly10Digits')
              ? ""
              : prev.error,
        }));

        if (cleanedValue === userData.contactNumber) {
          setAltContactValidation({
            loading: false,
            error: t('profile.page.numbersMustBeDifferent'),
            isAvailable: false,
            formatError: false,
          });
        } else {
          debouncedValidation(cleanedValue, true);
        }
      } else {
        setAltContactValidation({
          loading: false,
          error: t('profile.page.exactly10Digits'),
          isAvailable: null,
          formatError: true,
        });
      }
    } else {
      setAltContactValidation({
        loading: false,
        error: "",
        isAvailable: null,
        formatError: false,
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
    const contactNumberChanged =
      userData.contactNumber !== originalData.userData.contactNumber;
    const altContactNumberChanged =
      userData.altContactNumber !== originalData.userData.altContactNumber;

    let allValid = true;
    const validationPromises: Promise<boolean>[] = [];

    if (contactNumberChanged) {
      if (!validateMobileFormat(userData.contactNumber)) {
        Alert.alert(
          t('profile.page.validationError'),
          t('profile.page.enterValidContact'),
        );
        return false;
      }

      if (
        !validatedFields.has("contactNumber") ||
        contactValidation.isAvailable === null
      ) {
        validationPromises.push(
          checkMobileAvailability(userData.contactNumber, false),
        );
      }
    }

    if (altContactNumberChanged && userData.altContactNumber) {
      if (!validateMobileFormat(userData.altContactNumber)) {
        Alert.alert(
          t('profile.page.validationError'),
          t('profile.page.enterValidAlternate'),
        );
        return false;
      }

      if (!areNumbersUnique()) {
        Alert.alert(
          t('profile.page.validationError'),
          t('profile.page.numbersMustBeDifferent'),
        );
        return false;
      }

      if (
        !validatedFields.has("altContactNumber") ||
        altContactValidation.isAvailable === null
      ) {
        validationPromises.push(
          checkMobileAvailability(userData.altContactNumber, true),
        );
      }
    }

    if (validationPromises.length > 0) {
      const results = await Promise.all(validationPromises);
      allValid = results.every((result) => result === true);
    }

    if (contactNumberChanged && contactValidation.isAvailable === false) {
      Alert.alert(t('profile.page.validationError'), t('errors.contactNumberUnavailable'));
      allValid = false;
    }

    if (
      altContactNumberChanged &&
      userData.altContactNumber &&
      altContactValidation.isAvailable === false
    ) {
      Alert.alert(t('profile.page.validationError'), t('errors.alternateNumberUnavailable'));
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
          savedLocations: [],
        });
      }

      const addressType =
        addressData.type === "Other" && addressData.customType
          ? addressData.customType
          : addressData.type;

      const newLocation = {
        name: addressType,
        location: {
          address: [
            {
              formatted_address: addressData.street,
              address_components: [
                { long_name: addressData.city, types: ["locality"] },
                { long_name: addressData.country, types: ["country"] },
                { long_name: addressData.postalCode, types: ["postal_code"] },
              ],
              geometry: {
                location: {
                  lat: addressData.rawData?.latitude || 0,
                  lng: addressData.rawData?.longitude || 0,
                },
              },
              place_id: addressData.rawData?.placeId || `manual_${Date.now()}`,
            },
          ],
          lat: addressData.rawData?.latitude || 0,
          lng: addressData.rawData?.longitude || 0,
        },
      };

      const updatedLocations = [...existingLocations, newLocation];

      const payload = {
        customerId: userId,
        savedLocations: updatedLocations,
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
            address: [
              {
                formatted_address: addr.street,
                address_components: [
                  { long_name: addr.city, types: ["locality"] },
                  { long_name: addr.country, types: ["country"] },
                  { long_name: addr.postalCode, types: ["postal_code"] },
                ],
                geometry: {
                  location: {
                    lat: addr.rawData?.latitude || 0,
                    lng: addr.rawData?.longitude || 0,
                  },
                },
                place_id: addr.rawData?.placeId || `manual_${Date.now()}`,
              },
            ],
            lat: addr.rawData?.latitude || 0,
            lng: addr.rawData?.longitude || 0,
          },
        };
      });

      const payload = {
        customerId: userId,
        savedLocations: savedLocations,
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
      const response = await axiosInstance.get(
        `/api/customer/get-customer-by-id/${customerId}`,
      );
      console.log("API Response:", response.data);

      const customer = response.data;

      const mobileNo =
        customer?.mobileNo ??
        customer?.mobileNumber ??
        customer?.phoneNumber ??
        customer?.contactNumber ??
        customer?.phone ??
        "";

      const altMobileNo =
        customer?.altMobileNo ??
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
        altContactNumber: altMobileNo ? altMobileNo.toString() : "",
      };

      setUserData(updatedUserData);
      setOriginalData((prev) => ({
        ...prev,
        userData: updatedUserData,
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
        const allSavedLocations = data.flatMap(
          (doc) => doc.savedLocations || [],
        );

        const uniqueAddresses = new Map();

        allSavedLocations
          .filter((loc: any) => loc.location?.address?.[0]?.formatted_address)
          .forEach((loc: any, idx: number) => {
            const primaryAddress = loc.location.address[0];
            const addressComponents = primaryAddress.address_components || [];

            const getComponent = (type: string) => {
              const component = addressComponents.find((c: any) =>
                c.types.includes(type),
              );
              return component?.long_name || "";
            };

            const locationKey =
              loc.location.lat && loc.location.lng
                ? `${loc.location.lat},${loc.location.lng}`
                : primaryAddress.formatted_address;

            if (!uniqueAddresses.has(locationKey)) {
              uniqueAddresses.set(locationKey, {
                id: loc._id || `addr_${idx}`,
                type: loc.name || t('profile.page.other'),
                street: primaryAddress.formatted_address,
                city:
                  getComponent("locality") ||
                  getComponent("administrative_area_level_3") ||
                  getComponent("administrative_area_level_4") ||
                  "",
                country: getComponent("country") || "",
                postalCode: getComponent("postal_code") || "",
                rawData: {
                  formattedAddress: primaryAddress.formatted_address,
                  latitude: loc.location.lat,
                  longitude: loc.location.lng,
                  placeId: primaryAddress.place_id,
                },
              });
            }
          });

        const mappedAddresses = Array.from(uniqueAddresses.values());

        setAddresses(mappedAddresses);
        setOriginalData((prev) => ({
          ...prev,
          addresses: mappedAddresses,
        }));
        console.log("Deduplicated addresses:", mappedAddresses);
      } else {
        console.log("No address data found");
        setAddresses([]);
        setOriginalData((prev) => ({
          ...prev,
          addresses: [],
        }));
      }
    } catch (err) {
      console.error("Failed to fetch customer addresses:", err);
      setAddresses([]);
      setOriginalData((prev) => ({
        ...prev,
        addresses: [],
      }));
    }
  };

  // Fetch service provider data
  const fetchServiceProviderData = async (serviceProviderId: number) => {
    try {
      const response = await axiosInstance.get(
        `/api/serviceproviders/get/serviceprovider/${serviceProviderId}`,
      );

      const data = response.data;
      setServiceProviderData(data);

      const updatedUserData = {
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        contactNumber: data.mobileNo ? data.mobileNo.toString() : "",
        altContactNumber: data.alternateNo ? data.alternateNo.toString() : "",
      };

      setUserData(updatedUserData);
      setOriginalData((prev) => ({
        ...prev,
        userData: updatedUserData,
      }));

      const addresses: Address[] = [];

      if (data.permanentAddress) {
        const permAddr = data.permanentAddress;
        const streetAddress =
          `${permAddr.field1 || ""} ${permAddr.field2 || ""}`.trim() ||
          data.street ||
          data.buildingName ||
          "";

        addresses.push({
          id: "permanent",
          type: "Permanent",
          street: streetAddress || t('profile.page.addressNotSpecified'),
          city: permAddr.ctArea || data.locality || data.currentLocation || "",
          country: permAddr.country || t('country.india'),
          postalCode:
            permAddr.pinNo || (data.pincode ? data.pincode.toString() : ""),
        });
      }

      if (data.correspondenceAddress) {
        const corrAddr = data.correspondenceAddress;
        const streetAddress =
          `${corrAddr.field1 || ""} ${corrAddr.field2 || ""}`.trim() ||
          data.street ||
          data.buildingName ||
          "";

        addresses.push({
          id: "correspondence",
          type: "Correspondence",
          street: streetAddress || t('profile.page.addressNotSpecified'),
          city: corrAddr.ctArea || data.locality || data.currentLocation || "",
          country: corrAddr.country || t('country.india'),
          postalCode:
            corrAddr.pinNo || (data.pincode ? data.pincode.toString() : ""),
        });
      }

      if (addresses.length === 0) {
        const serviceProviderAddress: Address = {
          id: "1",
          type: t('profile.page.home'),
          street: `${data.buildingName || ""} ${data.street || ""} ${
            data.locality || ""
          }`.trim(),
          city: data.nearbyLocation || data.currentLocation || "",
          country: t('country.india'),
          postalCode: data.pincode ? data.pincode.toString() : "",
        };
        addresses.push(serviceProviderAddress);
      }

      setAddresses(addresses);
      setOriginalData((prev) => ({
        ...prev,
        addresses: addresses,
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
    if (
      newAddress.street &&
      newAddress.city &&
      newAddress.country &&
      newAddress.postalCode
    ) {
      const addressType =
        newAddress.type === "Other" && newAddress.customType
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
          placeId: `manual_${Date.now()}`,
        },
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
          Alert.alert(t('common.error'), t('profile.page.couldNotSaveAddress'));
          setAddresses(addresses);
          return;
        }
      }

      setNewAddress({
        type: t('profile.page.home'),
        customType: "",
        street: "",
        city: "",
        country: "",
        postalCode: "",
      });
      setShowAddAddress(false);
    } else {
      Alert.alert(t('profile.page.validationError'), t('profile.page.fillAllAddressFields'));
    }
  };

  // Remove address
  const removeAddress = async (id: string) => {
    if (addresses.length <= 1) return;

    const updatedAddresses = addresses.filter((addr) => addr.id !== id);

    setAddresses(updatedAddresses);

    if (userRole === "CUSTOMER" && userId) {
      try {
        await updateAddressesInUserSettings(updatedAddresses);
        console.log("✅ Address removed from user settings");
      } catch (error) {
        console.error("❌ Failed to remove address from user settings:", error);
        setAddresses(addresses);
        Alert.alert(t('common.error'), t('profile.page.couldNotRemoveAddress'));
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

        const id =
          role === "SERVICE_PROVIDER"
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
              await new Promise((resolve) => setTimeout(resolve, 500));
            }

            const updatedUserData = {
              firstName: firstName || name?.split(" ")[0] || "",
              lastName: lastName || name?.split(" ").slice(1).join(" ") || "",
              contactNumber: mobileNo || "",
              altContactNumber: alternateNo || "",
            };

            setUserData(updatedUserData);
            setOriginalData((prev) => ({
              ...prev,
              userData: updatedUserData,
            }));

            console.log("✅ Profile data loaded from Redux:", {
              firstName,
              lastName,
              mobileNo,
              hasMobileNumber,
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
        altContactNumber: alternateNo || userData.altContactNumber || "",
      };

      if (JSON.stringify(userData) !== JSON.stringify(updatedUserData)) {
        setUserData(updatedUserData);
        if (!isEditing) {
          setOriginalData((prev) => ({
            ...prev,
            userData: updatedUserData,
          }));
        }
      }
    }
  }, [firstName, lastName, mobileNo, alternateNo, userRole, isEditing]);

  const handleInputChange = (name: keyof UserData, value: string) => {
    setUserData((prev) => ({
      ...prev,
      [name]: value,
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
        if (
          userData.altContactNumber !== originalData.userData.altContactNumber
        ) {
          payload.alternateNo =
            userData.altContactNumber?.replace("+", "") || null;
        }

        const permanentAddress = addresses.find(
          (addr) => addr.type === "Permanent",
        );
        const correspondenceAddress = addresses.find(
          (addr) => addr.type === "Correspondence",
        );

        if (permanentAddress) {
          payload.permanentAddress = {
            field1: permanentAddress.street.split(" ")[0] || "",
            field2: permanentAddress.street || "",
            ctArea: permanentAddress.city || "",
            pinNo: permanentAddress.postalCode || "",
            state: "West Bengal",
            country: permanentAddress.country || t('country.india'),
          };
        }

        if (correspondenceAddress) {
          payload.correspondenceAddress = {
            field1: correspondenceAddress.street.split(" ")[0] || "",
            field2: correspondenceAddress.street || "",
            ctArea: correspondenceAddress.city || "",
            pinNo: correspondenceAddress.postalCode || "",
            state: "West Bengal",
            country: correspondenceAddress.country || t('country.india'),
          };
        }

        await axiosInstance.put(
          `/api/serviceproviders/update/serviceprovider/${userId}`,
          payload,
        );
        await fetchServiceProviderData(userId);
        Alert.alert(t('common.success'), t('profile.page.updateSuccess'));
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
        if (
          userData.altContactNumber !== originalData.userData.altContactNumber
        ) {
          payload.alternateNo =
            userData.altContactNumber?.replace("+", "") || null;
        }

        await axiosInstance.put(
          `/api/customer/update-customer/${userId}`,
          payload,
        );

        if (userData.contactNumber) {
          dispatch(setHasMobileNumber(true));
        }

        if (
          JSON.stringify(addresses) !== JSON.stringify(originalData.addresses)
        ) {
          await updateAddressesInUserSettings(addresses);
        }

        Alert.alert(t('common.success'), t('profile.page.updateSuccess'));
      }

      setValidatedFields(new Set());
      setContactValidation({
        loading: false,
        error: "",
        isAvailable: null,
        formatError: false,
      });
      setAltContactValidation({
        loading: false,
        error: "",
        isAvailable: null,
        formatError: false,
      });

      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save data:", error);
      Alert.alert(t('common.error'), t('profile.page.updateFailed'));
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
    setContactValidation({
      loading: false,
      error: "",
      isAvailable: null,
      formatError: false,
    });
    setAltContactValidation({
      loading: false,
      error: "",
      isAvailable: null,
      formatError: false,
    });
  };

  const handleEditStart = () => {
    setOriginalData({
      userData: { ...userData },
      addresses: [...addresses],
    });
    setIsEditing(true);
  };

  const toggleAddress = (id: string) => {
    setExpandedAddressIds((prev) =>
      prev.includes(id)
        ? prev.filter((addrId) => addrId !== id)
        : [...prev, id],
    );
  };

  const handleAddressInputChange = (
    name: keyof typeof newAddress,
    value: string,
  ) => {
    setNewAddress((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Get available address types based on user role
  const getAvailableAddressTypes = () => {
    if (userRole === "SERVICE_PROVIDER") return ["Permanent", "Correspondence"];
    return ["Home", "Work", "Other"];
  };

  const isFormValid = (): boolean => {
    const contactNumberChanged =
      userData.contactNumber !== originalData.userData.contactNumber;
    const altContactNumberChanged =
      userData.altContactNumber !== originalData.userData.altContactNumber;

    const contactValid =
      !contactNumberChanged ||
      (validateMobileFormat(userData.contactNumber) &&
        (contactValidation.isAvailable === true ||
          contactValidation.isAvailable === null));

    const altContactValid =
      !altContactNumberChanged ||
      !userData.altContactNumber ||
      (validateMobileFormat(userData.altContactNumber) &&
        (altContactValidation.isAvailable === true ||
          altContactValidation.isAvailable === null) &&
        areNumbersUnique());

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

  // ============= BACK BUTTON AND HARDWARE BACK HANDLING =============

  // Handle back button press
  const handleBackPress = () => {
    console.log("⬅️ Back button pressed in ProfileScreen");

    // Close any open dialogs or modals first
    if (showMobileDialog) {
      console.log("📱 Closing mobile dialog");
      setShowMobileDialog(false);
      return true; // Prevent default back behavior
    }

    if (showCountryCodePicker) {
      console.log("🌍 Closing country code picker");
      setShowCountryCodePicker(false);
      return true;
    }

    if (showAltCountryCodePicker) {
      console.log("🌍 Closing alternate country code picker");
      setShowAltCountryCodePicker(false);
      return true;
    }

    if (showAddAddress) {
      console.log("🏠 Closing add address form");
      setShowAddAddress(false);
      return true;
    }

    // If in editing mode, cancel editing first
    if (isEditing) {
      console.log("✏️ Canceling edit mode");
      handleCancel();
      return true;
    }

    // If no dialogs are open and not in edit mode, navigate back to home
    if (onBackToHome) {
      console.log("🏠 Navigating back to HomePage");
      onBackToHome();
      return true; // Prevent default back behavior
    }

    return false; // Let default back behavior happen
  };

  // Set up hardware back button listener
  useEffect(() => {
    console.log("🎯 Setting up back button handler for ProfileScreen");

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress,
    );

    // Clean up listener on unmount
    return () => {
      console.log("🧹 Cleaning up back button handler for ProfileScreen");
      backHandler.remove();
    };
  }, [
    onBackToHome,
    showMobileDialog,
    showCountryCodePicker,
    showAltCountryCodePicker,
    showAddAddress,
    isEditing,
  ]);

  // Loading Screen Component
  const LoadingScreen = () => (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingContent}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text
          style={[
            styles.loadingText,
            { color: colors.text, fontSize: fontSizes.formTitle },
          ]}
        >
          {t('profile.page.loadingProfile')}
        </Text>
        <Text
          style={[
            styles.loadingSubtext,
            { color: colors.textSecondary, fontSize: fontSizes.roleText },
          ]}
        >
          {t('profile.page.pleaseWait')}
        </Text>
      </View>
    </View>
  );

  // Skeleton Loading Component
  const SkeletonLoader = () => (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Skeleton */}
      <LinearGradient
        colors={[
          isDarkMode ? "rgba(14, 48, 92, 0.9)" : "rgba(177, 213, 232, 0.8)",
          isDarkMode ? colors.background : "rgba(255, 255, 255, 1)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.headerSkeleton}
      >
        <View style={styles.headerContentSkeleton}>
          <View style={styles.profileSection}>
            {renderProfilePicture()}
            <View style={styles.profileTextContainer}>
              <View
                style={[
                  styles.greetingSkeleton,
                  { backgroundColor: colors.surface },
                ]}
              />
              <View
                style={[
                  styles.roleSkeleton,
                  { backgroundColor: colors.surface },
                ]}
              />
            </View>
          </View>
          <View
            style={[
              styles.editButtonSkeleton,
              { backgroundColor: colors.surface },
            ]}
          />
        </View>
      </LinearGradient>

      {/* Main Content Skeleton */}
      <View style={styles.mainContentSkeleton}>
        <View style={[styles.cardSkeleton, { backgroundColor: colors.card }]}>
          <View style={styles.formHeaderSkeleton}>
            <View
              style={[
                styles.titleSkeleton,
                { backgroundColor: colors.surface },
              ]}
            />
          </View>

          <View style={styles.sectionSkeleton}>
            <View
              style={[
                styles.sectionTitleSkeleton,
                { backgroundColor: colors.surface },
              ]}
            />
            <View style={styles.rowSkeleton}>
              <View style={styles.inputGroupSkeleton}>
                <View
                  style={[
                    styles.labelSkeleton,
                    { backgroundColor: colors.surface },
                  ]}
                />
                <View
                  style={[
                    styles.inputSkeleton,
                    { backgroundColor: colors.surface },
                  ]}
                />
              </View>
              <View style={styles.inputGroupSkeleton}>
                <View
                  style={[
                    styles.labelSkeleton,
                    { backgroundColor: colors.surface },
                  ]}
                />
                <View
                  style={[
                    styles.inputSkeleton,
                    { backgroundColor: colors.surface },
                  ]}
                />
              </View>
            </View>

            <View style={styles.nameRowSkeleton}>
              <View style={styles.nameInputSkeleton}>
                <View
                  style={[
                    styles.labelSkeleton,
                    { backgroundColor: colors.surface },
                  ]}
                />
                <View
                  style={[
                    styles.inputSkeleton,
                    { backgroundColor: colors.surface },
                  ]}
                />
              </View>
              <View style={styles.nameInputSkeleton}>
                <View
                  style={[
                    styles.labelSkeleton,
                    { backgroundColor: colors.surface },
                  ]}
                />
                <View
                  style={[
                    styles.inputSkeleton,
                    { backgroundColor: colors.surface },
                  ]}
                />
              </View>
            </View>

            <View style={styles.inputGroupSkeleton}>
              <View
                style={[
                  styles.labelSkeleton,
                  { backgroundColor: colors.surface },
                ]}
              />
              <View
                style={[
                  styles.inputSkeleton,
                  { backgroundColor: colors.surface },
                ]}
              />
            </View>
          </View>

          <View
            style={[styles.dividerSkeleton, { backgroundColor: colors.border }]}
          />

          <View style={styles.sectionSkeleton}>
            <View
              style={[
                styles.sectionTitleSkeleton,
                { backgroundColor: colors.surface },
              ]}
            />
            <View style={styles.rowSkeleton}>
              <View style={styles.inputGroupSkeleton}>
                <View
                  style={[
                    styles.labelSkeleton,
                    { backgroundColor: colors.surface },
                  ]}
                />
                <View
                  style={[
                    styles.inputSkeleton,
                    { backgroundColor: colors.surface },
                  ]}
                />
              </View>
              <View style={styles.inputGroupSkeleton}>
                <View
                  style={[
                    styles.labelSkeleton,
                    { backgroundColor: colors.surface },
                  ]}
                />
                <View
                  style={[
                    styles.inputSkeleton,
                    { backgroundColor: colors.surface },
                  ]}
                />
              </View>
            </View>
          </View>

          <View style={styles.sectionSkeleton}>
            <View
              style={[
                styles.labelSkeleton,
                { backgroundColor: colors.surface },
              ]}
            />
            <View
              style={[
                styles.addressCardSkeleton,
                { backgroundColor: colors.surface },
              ]}
            >
              <View style={styles.addressHeaderSkeleton}>
                <View
                  style={[
                    styles.addressTitleSkeleton,
                    { backgroundColor: colors.surface },
                  ]}
                />
              </View>
              <View
                style={[
                  styles.addressLineSkeleton,
                  { backgroundColor: colors.surface },
                ]}
              />
              <View
                style={[
                  styles.addressLineShortSkeleton,
                  { backgroundColor: colors.surface },
                ]}
              />
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
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Mobile Number Dialog */}
      <MobileNumberDialog
        visible={showMobileDialog}
        onClose={() => setShowMobileDialog(false)}
        customerId={appUser?.customerid}
        onSuccess={handleMobileNumberUpdateSuccess}
      />

      {/* Header with Linear Gradient and Back Button */}
      <LinearGradient
        colors={[
          isDarkMode ? "rgba(14, 48, 92, 0.9)" : "rgba(177, 213, 232, 0.8)",
          isDarkMode ? colors.background : "rgba(255, 255, 255, 1)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          {/* Back Button */}
          <TouchableOpacity
            style={[
              styles.backButton,
              { backgroundColor: "rgba(255, 255, 255, 0.9)" },
            ]}
            onPress={handleBackPress}
          >
            <Icon name="arrow-left" size={24} color={colors.primary} />
          </TouchableOpacity>

          {/* Profile Section */}
          <View style={styles.profileSection}>
            {renderProfilePicture()}
            <View style={styles.profileTextContainer}>
              <Text
                style={[
                  styles.greeting,
                  { color: colors.text, fontSize: fontSizes.greeting },
                ]}
              >
                {t('profile.page.greeting', { name: getDisplayName() })}
              </Text>
              <Text
                style={[
                  styles.roleText,
                  { color: colors.textSecondary, fontSize: fontSizes.roleText },
                ]}
              >
                {userRole === "SERVICE_PROVIDER"
                  ? t('profile.page.serviceProvider')
                  : t('profile.page.customer')}
                , {t('profile.page.id', { id: getUserIdDisplay() })}
                {userRole === "CUSTOMER" && !hasMobileNumber && (
                  <Text
                    style={[styles.mobileWarningSmall, { color: colors.error }]}
                  >
                    {" "}
                    ⚠️ {t('profile.page.mobileRequired')}
                  </Text>
                )}
              </Text>
            </View>
          </View>

          {/* Edit Button - Top Right like web version */}
          {!isEditing && (
            <TouchableOpacity
              style={[
                styles.editButtonTop,
                { backgroundColor: colors.primary },
              ]}
              onPress={handleEditStart}
            >
              <Icon name="edit-3" size={16} color="#fdfeffff" />
              <Text
                style={[
                  styles.editButtonText,
                  { color: "#fff", fontSize: fontSizes.buttonText },
                ]}
              >
                {t('profile.page.edit')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Main Content */}
      <View style={styles.mainContent}>
        <View style={[styles.formContainer, { backgroundColor: colors.card }]}>
          {/* Form Header */}
          <View
            style={[styles.formHeader, { borderBottomColor: colors.border }]}
          >
            <Text
              style={[
                styles.formTitle,
                { color: colors.text, fontSize: fontSizes.formTitle },
              ]}
            >
              {t('profile.page.myAccount')}
            </Text>
            {userRole === "CUSTOMER" && !hasMobileNumber && (
              <TouchableOpacity
                onPress={() => setShowMobileDialog(true)}
                style={[
                  styles.addMobileButton,
                  { backgroundColor: colors.errorLight },
                ]}
              >
                <Text
                  style={[
                    styles.addMobileButtonText,
                    { color: colors.error, fontSize: fontSizes.buttonText },
                  ]}
                >
                  {t('profile.page.addMobileNumber')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* User Info Section */}
          <View>
            <Text
              style={[
                styles.sectionTitle,
                {
                  color: colors.textSecondary,
                  fontSize: fontSizes.sectionTitle,
                },
              ]}
            >
              {t('profile.page.userInformation')}
            </Text>

            <View style={styles.inputRow}>
              <View style={styles.inputContainer}>
                <Text
                  style={[
                    styles.inputLabel,
                    { color: colors.text, fontSize: fontSizes.inputLabel },
                  ]}
                >
                  {t('profile.page.username')}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.readOnlyInput,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.surface,
                      color: colors.text,
                      fontSize: fontSizes.input,
                    },
                  ]}
                  value={appUser?.nickname || userName || t('profile.page.user')}
                  editable={false}
                />
              </View>
              <View style={styles.inputContainer}>
                <Text
                  style={[
                    styles.inputLabel,
                    { color: colors.text, fontSize: fontSizes.inputLabel },
                  ]}
                >
                  {t('profile.page.emailAddress')}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    styles.readOnlyInput,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.surface,
                      color: colors.text,
                      fontSize: fontSizes.input,
                    },
                  ]}
                  value={
                    appUser?.email ||
                    auth0User?.email ||
                    emailId ||
                    t('profile.page.noEmail')
                  }
                  editable={false}
                />
              </View>
            </View>

            <View style={styles.ultraCompactNameRow}>
              <View style={styles.ultraCompactNameInput}>
                <Text
                  style={[
                    styles.compactLabel,
                    { color: colors.text, fontSize: fontSizes.compactLabel },
                  ]}
                >
                  {t('profile.page.firstName')}
                </Text>
                <TextInput
                  style={[
                    styles.ultraCompactInput,
                    {
                      borderColor: colors.border,
                      backgroundColor: isEditing ? colors.card : colors.surface,
                      color: colors.text,
                      fontSize: fontSizes.input,
                    },
                    !isEditing && styles.readOnlyInput,
                  ]}
                  value={userData.firstName}
                  onChangeText={(value) =>
                    handleInputChange("firstName", value)
                  }
                  editable={isEditing}
                  placeholder={t('profile.page.firstNamePlaceholder')}
                  placeholderTextColor={colors.placeholder}
                />
              </View>
              <View style={styles.ultraCompactNameInput}>
                <Text
                  style={[
                    styles.compactLabel,
                    { color: colors.text, fontSize: fontSizes.compactLabel },
                  ]}
                >
                  {t('profile.page.lastName')}
                </Text>
                <TextInput
                  style={[
                    styles.ultraCompactInput,
                    {
                      borderColor: colors.border,
                      backgroundColor: isEditing ? colors.card : colors.surface,
                      color: colors.text,
                      fontSize: fontSizes.input,
                    },
                    !isEditing && styles.readOnlyInput,
                  ]}
                  value={userData.lastName}
                  onChangeText={(value) => handleInputChange("lastName", value)}
                  editable={isEditing}
                  placeholder={t('profile.page.lastNamePlaceholder')}
                  placeholderTextColor={colors.placeholder}
                />
              </View>
              <View style={styles.ultraCompactNameInput}>
                <Text
                  style={[
                    styles.compactLabel,
                    { color: colors.text, fontSize: fontSizes.compactLabel },
                  ]}
                >
                  {userRole === "SERVICE_PROVIDER"
                    ? t('profile.page.providerId')
                    : t('profile.page.userId')}
                </Text>
                <TextInput
                  style={[
                    styles.ultraCompactInput,
                    styles.readOnlyInput,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.surface,
                      color: colors.text,
                      fontSize: fontSizes.input,
                    },
                  ]}
                  value={getUserIdDisplay()}
                  editable={false}
                />
              </View>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Contact Info Section */}
          <Text
            style={[
              styles.sectionTitle,
              { color: colors.textSecondary, fontSize: fontSizes.sectionTitle },
            ]}
          >
            {t('profile.page.contactInformation')}
          </Text>

          <View style={styles.inputRow}>
            {/* Contact Number */}
            <View style={styles.inputContainer}>
              <View style={styles.labelContainer}>
                <Text
                  style={[
                    styles.inputLabel,
                    { color: colors.text, fontSize: fontSizes.inputLabel },
                  ]}
                >
                  {t('profile.page.contactNumber')}
                </Text>
                {userRole === "CUSTOMER" && (
                  <Text
                    style={
                      !hasMobileNumber
                        ? [styles.mobileWarningSmall, { color: colors.error }]
                        : [styles.mobileSuccess, { color: colors.success }]
                    }
                  >
                    {!hasMobileNumber ? " ⚠️" : " ✓"}
                  </Text>
                )}
              </View>
              <View style={styles.phoneInputContainer}>
                {isEditing ? (
                  <TouchableOpacity
                    style={[
                      styles.countryCodeContainer,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.surface,
                      },
                    ]}
                    onPress={() => setShowCountryCodePicker(true)}
                  >
                    <Text
                      style={[
                        styles.countryCodeText,
                        { color: colors.text, fontSize: fontSizes.input },
                      ]}
                    >
                      {countryCode}
                    </Text>
                    <Icon
                      name="chevron-down"
                      size={16}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                ) : (
                  <View
                    style={[
                      styles.countryCodeContainer,
                      styles.readOnlyInput,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.surface,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.countryCodeText,
                        { color: colors.text, fontSize: fontSizes.input },
                      ]}
                    >
                      {countryCode}
                    </Text>
                  </View>
                )}
                <TextInput
                  style={[
                    styles.phoneInput,
                    {
                      borderColor:
                        contactValidation.error ||
                        (!hasMobileNumber && userRole === "CUSTOMER")
                          ? colors.error
                          : colors.border,
                      backgroundColor: isEditing ? colors.card : colors.surface,
                      color: colors.text,
                      fontSize: fontSizes.input,
                    },
                    !isEditing && styles.readOnlyInput,
                  ]}
                  value={formatMobileNumber(userData.contactNumber)}
                  onChangeText={handleContactNumberChange}
                  placeholder={t('profile.page.enter10Digit')}
                  placeholderTextColor={colors.placeholder}
                  editable={isEditing}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                {isEditing && (
                  <View style={styles.validationIcon}>
                    {contactValidation.loading && (
                      <ActivityIndicator size="small" color={colors.primary} />
                    )}
                    {contactValidation.isAvailable &&
                      !contactValidation.loading && (
                        <Icon name="check" size={16} color={colors.success} />
                      )}
                    {contactValidation.isAvailable === false &&
                      !contactValidation.loading && (
                        <Icon
                          name="alert-circle"
                          size={16}
                          color={colors.error}
                        />
                      )}
                  </View>
                )}
              </View>

              {/* Validation Messages */}
              {contactValidation.error && (
                <Text
                  style={[
                    styles.validationError,
                    { color: colors.error, fontSize: fontSizes.validationText },
                  ]}
                >
                  {contactValidation.error}
                </Text>
              )}
              {contactValidation.formatError && isEditing && (
                <Text
                  style={[
                    styles.validationError,
                    { color: colors.error, fontSize: fontSizes.validationText },
                  ]}
                >
                  {t('profile.page.exactly10Digits')}
                </Text>
              )}
              {contactValidation.isAvailable && (
                <Text
                  style={[
                    styles.validationSuccess,
                    {
                      color: colors.success,
                      fontSize: fontSizes.validationText,
                    },
                  ]}
                >
                  {t('profile.page.contactNumberAvailable')}
                </Text>
              )}
              {userRole === "CUSTOMER" && !hasMobileNumber && !isEditing && (
                <View style={styles.mobileWarningContainer}>
                  <Text
                    style={[
                      styles.mobileRequiredText,
                      {
                        color: colors.error,
                        fontSize: fontSizes.validationText,
                      },
                    ]}
                  >
                    {t('profile.page.mobileRequiredDesc')}
                  </Text>
                  <TouchableOpacity onPress={() => setShowMobileDialog(true)}>
                    <Text
                      style={[
                        styles.addLink,
                        {
                          color: colors.primary,
                          fontSize: fontSizes.validationText,
                        },
                      ]}
                    >
                      {t('profile.page.clickToAddMobile')}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Alternative Contact Number */}
            <View style={styles.inputContainer}>
              <Text
                style={[
                  styles.inputLabel,
                  { color: colors.text, fontSize: fontSizes.inputLabel },
                ]}
              >
                {t('profile.page.alternativeContact')}
              </Text>
              <View style={styles.phoneInputContainer}>
                {isEditing ? (
                  <TouchableOpacity
                    style={[
                      styles.countryCodeContainer,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.surface,
                      },
                    ]}
                    onPress={() => setShowAltCountryCodePicker(true)}
                  >
                    <Text
                      style={[
                        styles.countryCodeText,
                        { color: colors.text, fontSize: fontSizes.input },
                      ]}
                    >
                      {altCountryCode}
                    </Text>
                    <Icon
                      name="chevron-down"
                      size={16}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                ) : (
                  <View
                    style={[
                      styles.countryCodeContainer,
                      styles.readOnlyInput,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.surface,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.countryCodeText,
                        { color: colors.text, fontSize: fontSizes.input },
                      ]}
                    >
                      {altCountryCode}
                    </Text>
                  </View>
                )}
                <TextInput
                  style={[
                    styles.phoneInput,
                    {
                      borderColor: altContactValidation.error
                        ? colors.error
                        : colors.border,
                      backgroundColor: isEditing ? colors.card : colors.surface,
                      color: colors.text,
                      fontSize: fontSizes.input,
                    },
                    !isEditing && styles.readOnlyInput,
                  ]}
                  value={formatMobileNumber(userData.altContactNumber)}
                  onChangeText={handleAltContactNumberChange}
                  placeholder={t('profile.page.enter10Digit')}
                  placeholderTextColor={colors.placeholder}
                  editable={isEditing}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                {isEditing && (
                  <View style={styles.validationIcon}>
                    {altContactValidation.loading && (
                      <ActivityIndicator size="small" color={colors.primary} />
                    )}
                    {altContactValidation.isAvailable &&
                      !altContactValidation.loading && (
                        <Icon name="check" size={16} color={colors.success} />
                      )}
                    {altContactValidation.isAvailable === false &&
                      !altContactValidation.loading && (
                        <Icon
                          name="alert-circle"
                          size={16}
                          color={colors.error}
                        />
                      )}
                  </View>
                )}
              </View>

              {/* Validation Messages */}
              {altContactValidation.error && (
                <Text
                  style={[
                    styles.validationError,
                    { color: colors.error, fontSize: fontSizes.validationText },
                  ]}
                >
                  {altContactValidation.error}
                </Text>
              )}
              {altContactValidation.formatError && isEditing && (
                <Text
                  style={[
                    styles.validationError,
                    { color: colors.error, fontSize: fontSizes.validationText },
                  ]}
                >
                  {t('profile.page.exactly10Digits')}
                </Text>
              )}
              {altContactValidation.isAvailable && (
                <Text
                  style={[
                    styles.validationSuccess,
                    {
                      color: colors.success,
                      fontSize: fontSizes.validationText,
                    },
                  ]}
                >
                  {t('profile.page.alternateNumberAvailable')}
                </Text>
              )}
            </View>
          </View>

          {/* Country Code Pickers */}
          <Modal
            visible={showCountryCodePicker}
            transparent={true}
            animationType="slide"
          >
            <View
              style={[
                styles.modalContainer,
                { backgroundColor: colors.overlay },
              ]}
            >
              <View
                style={[styles.pickerModal, { backgroundColor: colors.card }]}
              >
                <Text
                  style={[
                    styles.pickerTitle,
                    { color: colors.text, fontSize: fontSizes.sectionTitle },
                  ]}
                >
                  {t('profile.page.selectCountryCode')}
                </Text>
                <Picker
                  selectedValue={countryCode}
                  onValueChange={(itemValue) => {
                    setCountryCode(itemValue);
                    setShowCountryCodePicker(false);
                  }}
                  style={{ color: colors.text }}
                >
                  {countryCodes.map((code) => (
                    <Picker.Item
                      key={code.value}
                      label={code.label}
                      value={code.value}
                      color={colors.text}
                    />
                  ))}
                </Picker>
                <TouchableOpacity
                  style={[
                    styles.pickerButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setShowCountryCodePicker(false)}
                >
                  <Text
                    style={[
                      styles.pickerButtonText,
                      { color: "#fff", fontSize: fontSizes.buttonText },
                    ]}
                  >
                    {t('profile.page.done')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal
            visible={showAltCountryCodePicker}
            transparent={true}
            animationType="slide"
          >
            <View
              style={[
                styles.modalContainer,
                { backgroundColor: colors.overlay },
              ]}
            >
              <View
                style={[styles.pickerModal, { backgroundColor: colors.card }]}
              >
                <Text
                  style={[
                    styles.pickerTitle,
                    { color: colors.text, fontSize: fontSizes.sectionTitle },
                  ]}
                >
                  {t('profile.page.selectCountryCode')}
                </Text>
                <Picker
                  selectedValue={altCountryCode}
                  onValueChange={(itemValue) => {
                    setAltCountryCode(itemValue);
                    setShowAltCountryCodePicker(false);
                  }}
                  style={{ color: colors.text }}
                >
                  {countryCodes.map((code) => (
                    <Picker.Item
                      key={code.value}
                      label={code.label}
                      value={code.value}
                      color={colors.text}
                    />
                  ))}
                </Picker>
                <TouchableOpacity
                  style={[
                    styles.pickerButton,
                    { backgroundColor: colors.primary },
                  ]}
                  onPress={() => setShowAltCountryCodePicker(false)}
                >
                  <Text
                    style={[
                      styles.pickerButtonText,
                      { color: "#fff", fontSize: fontSizes.buttonText },
                    ]}
                  >
                    {t('profile.page.done')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Address Section */}
          <View style={styles.addressesSection}>
            <View style={styles.addressesHeader}>
              <Text
                style={[
                  styles.inputLabel,
                  { color: colors.text, fontSize: fontSizes.inputLabel },
                ]}
              >
                {t('profile.page.addresses')}
              </Text>
              {isEditing && userRole === "CUSTOMER" && (
                <TouchableOpacity
                  onPress={() => setShowAddAddress(!showAddAddress)}
                  style={styles.addAddressButton}
                >
                  <Icon name="plus" size={16} color={colors.primary} />
                  <Text
                    style={[
                      styles.addAddressText,
                      { color: colors.primary, fontSize: fontSizes.buttonText },
                    ]}
                  >
                    {t('profile.page.addNewAddress')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {showAddAddress && isEditing && (
              <View
                style={[
                  styles.addAddressForm,
                  {
                    backgroundColor: colors.infoLight,
                    borderColor: colors.info,
                  },
                ]}
              >
                <View style={styles.addAddressFormHeader}>
                  <Text
                    style={[
                      styles.addAddressFormTitle,
                      { color: colors.primary, fontSize: fontSizes.formTitle },
                    ]}
                  >
                    {t('profile.page.addNewAddress')}
                  </Text>
                  <TouchableOpacity onPress={() => setShowAddAddress(false)}>
                    <Icon name="x" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <View style={styles.addressTypeContainer}>
                  <Text
                    style={[
                      styles.formLabel,
                      { color: colors.text, fontSize: fontSizes.inputLabel },
                    ]}
                  >
                    {t('profile.page.saveAs')}
                  </Text>
                  <View style={styles.addressTypeButtons}>
                    <TouchableOpacity
                      onPress={() => handleUserPreference("Home")}
                      style={[
                        styles.addressTypeButton,
                        {
                          borderColor: colors.border,
                          backgroundColor: colors.card,
                        },
                        newAddress.type === "Home" && [
                          styles.addressTypeButtonActive,
                          {
                            backgroundColor: colors.primary + "20",
                            borderColor: colors.primary,
                          },
                        ],
                      ]}
                    >
                      <Icon
                        name="home"
                        size={14}
                        color={
                          newAddress.type === "Home"
                            ? colors.primary
                            : colors.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.addressTypeText,
                          {
                            color: colors.textSecondary,
                            fontSize: fontSizes.inputLabel,
                          },
                          newAddress.type === "Home" && [
                            styles.addressTypeTextActive,
                            { color: colors.primary },
                          ],
                        ]}
                      >
                        {t('profile.page.home')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleUserPreference("Work")}
                      style={[
                        styles.addressTypeButton,
                        {
                          borderColor: colors.border,
                          backgroundColor: colors.card,
                        },
                        newAddress.type === "Work" && [
                          styles.addressTypeButtonActive,
                          {
                            backgroundColor: colors.primary + "20",
                            borderColor: colors.primary,
                          },
                        ],
                      ]}
                    >
                      <MaterialCommunityIcons
                        name="office-building"
                        size={14}
                        color={
                          newAddress.type === "Work"
                            ? colors.primary
                            : colors.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.addressTypeText,
                          {
                            color: colors.textSecondary,
                            fontSize: fontSizes.inputLabel,
                          },
                          newAddress.type === "Work" && [
                            styles.addressTypeTextActive,
                            { color: colors.primary },
                          ],
                        ]}
                      >
                        {t('profile.page.work')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleUserPreference()}
                      style={[
                        styles.addressTypeButton,
                        {
                          borderColor: colors.border,
                          backgroundColor: colors.card,
                        },
                        newAddress.type === "Other" && [
                          styles.addressTypeButtonActive,
                          {
                            backgroundColor: colors.primary + "20",
                            borderColor: colors.primary,
                          },
                        ],
                      ]}
                    >
                      <Icon
                        name="map-pin"
                        size={14}
                        color={
                          newAddress.type === "Other"
                            ? colors.primary
                            : colors.textSecondary
                        }
                      />
                      <Text
                        style={[
                          styles.addressTypeText,
                          {
                            color: colors.textSecondary,
                            fontSize: fontSizes.inputLabel,
                          },
                          newAddress.type === "Other" && [
                            styles.addressTypeTextActive,
                            { color: colors.primary },
                          ],
                        ]}
                      >
                        {t('profile.page.other')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {newAddress.type === "Other" && (
                  <View style={styles.formField}>
                    <Text
                      style={[
                        styles.formLabel,
                        { color: colors.text, fontSize: fontSizes.inputLabel },
                      ]}
                    >
                      {t('profile.page.locationName')}
                    </Text>
                    <TextInput
                      style={[
                        styles.formInput,
                        {
                          borderColor: colors.border,
                          backgroundColor: colors.card,
                          color: colors.text,
                          fontSize: fontSizes.input,
                        },
                      ]}
                      placeholder={t('profile.page.enterLocationName')}
                      placeholderTextColor={colors.placeholder}
                      value={newAddress.customType}
                      onChangeText={(value) =>
                        handleAddressInputChange("customType", value)
                      }
                    />
                  </View>
                )}

                <View style={styles.addressFormInput}>
                  <Text
                    style={[
                      styles.inputLabel,
                      { color: colors.text, fontSize: fontSizes.inputLabel },
                    ]}
                  >
                    {t('profile.page.streetAddress')}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: colors.border,
                        backgroundColor: colors.card,
                        color: colors.text,
                        fontSize: fontSizes.input,
                      },
                    ]}
                    value={newAddress.street}
                    onChangeText={(value) =>
                      handleAddressInputChange("street", value)
                    }
                    placeholder={t('profile.page.enterStreetAddress')}
                    placeholderTextColor={colors.placeholder}
                  />
                </View>

                <View style={styles.addressFormRow}>
                  <View style={[styles.addressFormInput, { flex: 1 }]}>
                    <Text
                      style={[
                        styles.inputLabel,
                        { color: colors.text, fontSize: fontSizes.inputLabel },
                      ]}
                    >
                      {t('profile.page.city')}
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          borderColor: colors.border,
                          backgroundColor: colors.card,
                          color: colors.text,
                          fontSize: fontSizes.input,
                        },
                      ]}
                      value={newAddress.city}
                      onChangeText={(value) =>
                        handleAddressInputChange("city", value)
                      }
                      placeholder={t('profile.page.enterCity')}
                      placeholderTextColor={colors.placeholder}
                    />
                  </View>

                  <View style={[styles.addressFormInput, { flex: 1 }]}>
                    <Text
                      style={[
                        styles.inputLabel,
                        { color: colors.text, fontSize: fontSizes.inputLabel },
                      ]}
                    >
                      {t('profile.page.country')}
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          borderColor: colors.border,
                          backgroundColor: colors.card,
                          color: colors.text,
                          fontSize: fontSizes.input,
                        },
                      ]}
                      value={newAddress.country}
                      onChangeText={(value) =>
                        handleAddressInputChange("country", value)
                      }
                      placeholder={t('profile.page.enterCountry')}
                      placeholderTextColor={colors.placeholder}
                    />
                  </View>

                  <View style={[styles.addressFormInput, { flex: 1 }]}>
                    <Text
                      style={[
                        styles.inputLabel,
                        { color: colors.text, fontSize: fontSizes.inputLabel },
                      ]}
                    >
                      {t('profile.page.postalCode')}
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          borderColor: colors.border,
                          backgroundColor: colors.card,
                          color: colors.text,
                          fontSize: fontSizes.input,
                        },
                      ]}
                      value={newAddress.postalCode}
                      onChangeText={(value) =>
                        handleAddressInputChange("postalCode", value)
                      }
                      placeholder={t('profile.page.enterPostalCode')}
                      placeholderTextColor={colors.placeholder}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleAddAddress}
                  style={[
                    styles.addAddressSubmitButton,
                    { backgroundColor: colors.primary },
                  ]}
                  disabled={
                    !newAddress.street ||
                    !newAddress.city ||
                    !newAddress.country ||
                    !newAddress.postalCode
                  }
                >
                  <Text
                    style={[
                      styles.addAddressSubmitText,
                      { color: "#fff", fontSize: fontSizes.buttonText },
                    ]}
                  >
                    {t('profile.page.addAddress')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {addresses.length === 0 ? (
              <Text
                style={[
                  styles.noAddressText,
                  { color: colors.textSecondary, fontSize: fontSizes.roleText },
                ]}
              >
                {t('profile.page.noAddresses')}
              </Text>
            ) : (
              <View style={styles.addressesList}>
                {addresses.map((address) => {
                  const isExpanded =
                    userRole === "SERVICE_PROVIDER" ||
                    expandedAddressIds.includes(address.id);

                  return (
                    <View
                      key={address.id}
                      style={[
                        styles.addressCard,
                        {
                          borderColor: colors.border,
                          backgroundColor: colors.surface,
                        },
                        isExpanded && styles.expandedAddressCard,
                      ]}
                    >
                      {/* Header */}
                      <View style={styles.addressHeader}>
                        <View style={styles.addressTitleContainer}>
                          <Text
                            style={[
                              styles.addressType,
                              {
                                color: colors.text,
                                fontSize: fontSizes.addressType,
                              },
                            ]}
                          >
                            {address.type}
                          </Text>
                        </View>

                        <View style={styles.addressActions}>
                          {userRole === "CUSTOMER" && (
                            <TouchableOpacity
                              onPress={() => toggleAddress(address.id)}
                              style={styles.addressActionButton}
                            >
                              <Icon
                                name={
                                  isExpanded ? "chevron-up" : "chevron-down"
                                }
                                size={20}
                                color={colors.textSecondary}
                              />
                            </TouchableOpacity>
                          )}
                          {isEditing &&
                            userRole === "CUSTOMER" &&
                            addresses.length > 1 && (
                              <TouchableOpacity
                                onPress={() => removeAddress(address.id)}
                                style={styles.addressActionButton}
                              >
                                <Icon name="x" size={20} color={colors.error} />
                              </TouchableOpacity>
                            )}
                        </View>
                      </View>

                      {/* Body (only show when expanded) */}
                      {isExpanded && (
                        <View style={styles.addressDetails}>
                          <Text
                            style={[
                              styles.addressText,
                              {
                                color: colors.textSecondary,
                                fontSize: fontSizes.addressText,
                              },
                            ]}
                          >
                            {address.street}
                          </Text>
                          <Text
                            style={[
                              styles.addressText,
                              {
                                color: colors.textSecondary,
                                fontSize: fontSizes.addressText,
                              },
                            ]}
                          >
                            {address.city || t('profile.page.noCity')},{" "}
                            {address.country || t('profile.page.noCountry')}{" "}
                            {address.postalCode || ""}
                          </Text>
                          {userRole === "SERVICE_PROVIDER" && (
                            <Text
                              style={[
                                styles.addressNote,
                                {
                                  color: colors.textTertiary,
                                  fontSize: fontSizes.roleText,
                                },
                              ]}
                            >
                              {t('profile.page.providerAddressNote')}
                            </Text>
                          )}
                        </View>
                      )}

                      {userRole === "CUSTOMER" && !isExpanded && (
                        <Text
                          style={[
                            styles.addressPreview,
                            {
                              color: colors.textSecondary,
                              fontSize: fontSizes.addressText,
                            },
                          ]}
                          numberOfLines={1}
                        >
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
              <View
                style={[styles.divider, { backgroundColor: colors.border }]}
              />

              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color: colors.textSecondary,
                    fontSize: fontSizes.sectionTitle,
                  },
                ]}
              >
                {t('profile.page.serviceStatus')}
              </Text>

              <View
                style={[
                  styles.statusCard,
                  { borderColor: colors.border, backgroundColor: colors.card },
                ]}
              >
                <View style={styles.statusGrid}>
                  <View style={styles.statusItem}>
                    <Text
                      style={[
                        styles.statusLabel,
                        {
                          color: colors.textSecondary,
                          fontSize: fontSizes.statusLabel,
                        },
                      ]}
                    >
                      {t('profile.page.accountStatus')}
                    </Text>
                    <View style={styles.statusValue}>
                      <View
                        style={[
                          styles.statusIndicator,
                          styles.statusActive,
                          { backgroundColor: colors.success },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color: colors.text,
                            fontSize: fontSizes.statusText,
                          },
                        ]}
                      >
                        {t('profile.page.verified')}
                      </Text>
                    </View>
                  </View>
                </View>

                <View
                  style={[
                    styles.statusFooter,
                    { borderTopColor: colors.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusUpdateText,
                      {
                        color: colors.textTertiary,
                        fontSize: fontSizes.statusLabel,
                      },
                    ]}
                  >
                    {t('profile.page.activeServiceProvider')}
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
                  style={[
                    styles.button,
                    styles.cancelButton,
                    { backgroundColor: colors.textSecondary },
                  ]}
                  onPress={handleCancel}
                  disabled={isSaving}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      { color: "#fff", fontSize: fontSizes.buttonText },
                    ]}
                  >
                    {t('profile.page.cancel')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.saveButton,
                    { backgroundColor: colors.primary },
                    (!isFormValid() || !hasChanges()) && [
                      styles.disabledButton,
                      { backgroundColor: colors.disabled },
                    ],
                  ]}
                  onPress={handleSave}
                  disabled={isSaving || !isFormValid() || !hasChanges()}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text
                      style={[
                        styles.buttonText,
                        { color: "#fff", fontSize: fontSizes.buttonText },
                      ]}
                    >
                      {t('profile.page.saveChanges')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: colors.surface }]}>
        <Text
          style={[
            styles.footerText,
            { color: colors.textTertiary, fontSize: fontSizes.footerText },
          ]}
        >
          {t('profile.page.footer')}
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
  },
  loadingContent: {
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
    fontWeight: "600",
  },
  loadingSubtext: {
    marginTop: 8,
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
    width: "100%",
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 20,
    top: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginLeft: 40, // Add margin to account for back button
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
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  avatarText: {
    fontWeight: "bold",
    color: "white",
  },
  profileTextContainer: {
    flex: 1,
  },
  greeting: {
    fontWeight: "bold",
  },
  roleText: {
    marginTop: 4,
  },
  editButtonTop: {
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: "600",
    marginLeft: 6,
  },
  mobileWarningSmall: {
    fontSize: 12,
  },
  mobileSuccess: {
    fontSize: 12,
  },
  mobileRequiredText: {
    marginTop: 4,
  },
  mobileWarningContainer: {
    marginTop: 4,
  },
  addLink: {
    marginTop: 4,
    textDecorationLine: "underline",
  },
  mainContent: {
    alignItems: "center",
    padding: 16,
    marginTop: -20,
  },
  formContainer: {
    width: width - 32,
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
    paddingBottom: 12,
    marginBottom: 16,
  },
  formTitle: {
    fontWeight: "600",
  },
  addMobileButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addMobileButtonText: {
    fontWeight: "600",
  },
  sectionTitle: {
    fontWeight: "600",
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
    fontWeight: "600",
    marginBottom: 8,
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  input: {
    width: "100%",
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  readOnlyInput: {
    backgroundColor: "#f7fafc",
  },
  invalidInput: {
    borderColor: "#dc2626",
  },
  divider: {
    height: 1,
    marginVertical: 20,
  },
  // Address section styles
  addressesSection: {
    marginBottom: 20,
  },
  noAddressText: {
    fontStyle: "italic",
  },
  addressesList: {
    gap: 12,
  },
  addressCard: {
    borderWidth: 1,
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
    fontWeight: "600",
  },
  addressDetails: {
    marginTop: 8,
  },
  addressText: {
    marginBottom: 4,
    lineHeight: 20,
  },
  addressNote: {
    marginTop: 8,
  },
  addressPreview: {
    marginTop: 8,
  },
  footer: {
    padding: 16,
    alignItems: "center",
    marginTop: 20,
  },
  footerText: {
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
    borderRadius: 4,
    marginBottom: 8,
  },
  roleSkeleton: {
    width: 120,
    height: 18,
    borderRadius: 4,
  },
  editButtonSkeleton: {
    width: 80,
    height: 36,
    borderRadius: 20,
  },
  mainContentSkeleton: {
    alignItems: "center",
    padding: 16,
    marginTop: -20,
  },
  cardSkeleton: {
    width: width - 32,
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
    borderRadius: 4,
  },
  sectionSkeleton: {
    marginBottom: 20,
  },
  sectionTitleSkeleton: {
    width: 160,
    height: 20,
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
    borderRadius: 4,
    marginBottom: 8,
  },
  inputSkeleton: {
    width: "100%",
    height: 40,
    borderRadius: 8,
  },
  dividerSkeleton: {
    height: 1,
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
    borderRadius: 4,
  },
  addressLineSkeleton: {
    width: "100%",
    height: 16,
    borderRadius: 4,
    marginBottom: 8,
  },
  addressLineShortSkeleton: {
    width: "75%",
    height: 16,
    borderRadius: 4,
  },
  // Phone input styles
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  countryCodeContainer: {
    padding: 12,
    borderWidth: 1,
    borderRightWidth: 0,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minWidth: 80,
  },
  countryCodeText: {
    fontSize: 14,
  },
  phoneInput: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  validationIcon: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: [{ translateY: -8 }],
  },
  validationError: {
    marginTop: 4,
  },
  validationSuccess: {
    marginTop: 4,
  },
  addressesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  addAddressButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  addAddressText: {
    fontWeight: "600",
    marginLeft: 4,
  },
  addAddressForm: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  addAddressFormHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  addAddressFormTitle: {
    fontWeight: "500",
  },
  addressFormRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 12,
  },
  addressFormInput: {
    marginBottom: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: 44,
    backgroundColor: "white",
  },
  // Modal styles for country code picker
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  pickerModal: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
  },
  pickerTitle: {
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  pickerButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  pickerButtonText: {
    fontWeight: "600",
  },
  // Service status section styles
  serviceStatusSection: {
    marginBottom: 20,
  },
  statusCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statusItem: {
    alignItems: "center",
    flex: 1,
  },
  statusLabel: {
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  statusValue: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusActive: {
    backgroundColor: "#10b981",
  },
  statusText: {
    fontWeight: "600",
  },
  statusFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
  },
  statusUpdateText: {
    fontSize: 12,
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
    borderRadius: 6,
    minHeight: 40,
  },
  compactLabel: {
    fontWeight: "600",
    marginBottom: 6,
  },
  // Action buttons container
  actionButtonsContainer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    alignItems: "center",
  },
  actionButtons: {
    flexDirection: "row",
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
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#6c757d",
  },
  saveButton: {
    backgroundColor: "#0a2a66",
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
  },
  addressTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  addressActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  addressActionButton: {
    padding: 4,
    marginLeft: 8,
  },
  addressTypeContainer: {
    marginBottom: 12,
  },
  formLabel: {
    fontWeight: "500",
    marginBottom: 8,
  },
  addressTypeButtons: {
    flexDirection: "row",
    gap: 8,
  },
  addressTypeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  addressTypeButtonActive: {
    backgroundColor: "#dbeafe",
    borderColor: "#93c5fd",
  },
  addressTypeText: {
    fontSize: 14,
  },
  addressTypeTextActive: {
    color: "#2563eb",
  },
  formField: {
    marginBottom: 12,
  },
  formInput: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 6,
    fontSize: 14,
  },
  addAddressSubmitButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 8,
  },
  addAddressSubmitText: {
    fontWeight: "600",
  },
});

export default ProfileScreen;