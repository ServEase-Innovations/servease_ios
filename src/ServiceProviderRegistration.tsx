/* eslint-disable */
import React, { useEffect, useState, useCallback, useRef } from "react";
import moment from "moment";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
  Linking,
  Dimensions,
  KeyboardAvoidingView,
  SafeAreaView,
} from "react-native";
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from "axios";
import LinearGradient from 'react-native-linear-gradient';

import Geolocation from "@react-native-community/geolocation";
import Geocoder from "react-native-geocoding";
import { PERMISSIONS, request, RESULTS } from "react-native-permissions";
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from "./Settings/ThemeContext";
import BankDetails, { BankDetailsData, BankDetailsErrors } from "./Registration/BankDetails";
import { useFieldValidation } from "./Registration/useFieldValidation";
import { keys } from "./env";
import axiosInstance from "./services/axiosInstance";
import { debounce } from "./utils/debounce";
import TnC from "./TermsAndConditions/TnC";
import PrivacyPolicy from "./TermsAndConditions/PrivacyPolicy";
import KeyFactsStatement from "./TermsAndConditions/KeyFactsStatement";
import providerInstance from "./services/providerInstance";
import BasicInformation from "./Registration/BasicInformation";
import AddressComponent from "./Registration/AddressComponent";
import ServiceDetails from "./Registration/ServiceDetails";
import KYCVerification from "./Registration/KYCVerification";
import TermsCheckboxes from "./common/TermsCheckboxes";
import { Button } from "./common/Button";


// Import components


const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Define form data interface
interface FormData {
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  emailId: string;
  password: string;
  confirmPassword: string;
  mobileNo: string;
  AlternateNumber: string;
  buildingName: string;
  locality: string;
  street: string;
  currentLocation: string;
  nearbyLocation: string;
  pincode: string;
  latitude: number;
  longitude: number;
  AADHAR: string;
  pan: string;
  panImage: RNFile | null;
  housekeepingRole: string[];
  description: string;
  experience: string;
  kyc: string;
  documentImage: RNFile | null;
  otherDetails: string;
  profileImage: RNFile | null;
  cookingSpeciality: string;
  nannyCareType: string;
  age: string;
  diet: string;
  dob: string;
  profilePic: string;
  timeslot: string;
  referralCode: string;
  agreeToTerms: boolean;
  terms: boolean;
  privacy: boolean;
  keyFacts: boolean;
  kycType: string;
  kycNumber: string;
  agentReferralId: string;
  permanentAddress: {
    apartment: string;
    street: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  correspondenceAddress: {
    apartment: string;
    street: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
}

interface RNFile {
  name: string;
  type: string;
  uri: string;
  size?: number | null;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  gender?: string;
  emailId?: string;
  password?: string;
  confirmPassword?: string;
  mobileNo?: string;
  AlternateNumber?: string;
  buildingName?: string;
  locality?: string;
  street?: string;
  currentLocation?: string;
  pincode?: string;
  AADHAR?: string;
  pan?: string;
  agreeToTerms?: string;
  terms?: string;
  privacy?: string;
  keyFacts?: string;
  housekeepingRole?: string;
  description?: string;
  experience?: string;
  kyc?: string;
  documentImage?: string;
  cookingSpeciality?: string;
  nannyCareType?: string;
  diet?: string;
  dob?: string;
  kycType?: string;
  kycNumber?: string;
  permanentAddress?: {
    apartment?: string;
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  };
  correspondenceAddress?: {
    apartment?: string;
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;
  };
}

// Regex validations
const nameRegex = /^[A-Za-z]+(?:[ ][A-Za-z]+)*$/;
const emailIdRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Z|a-z]{2,}$/;
const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const phoneRegex = /^[0-9]{10}$/;
const aadhaarRegex = /^[0-9]{12}$/;
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const voterIdRegex = /^[A-Z]{3}[0-9]{7}$/;
const passportRegex = /^[A-Z]{1}[0-9]{7}$/;
const MAX_NAME_LENGTH = 30;

const steps = [
  "Basic\nInfo",
  "Address\nInfo",
  "Additional\nDetails",
  "KYC\nVerification",
  "Bank\nDetails",
  "Confirmation",
];

interface RegistrationProps {
  onBackToLogin: (data: boolean) => void;
  onRegistrationSuccess?: () => void;
}

const ServiceProviderRegistration: React.FC<RegistrationProps> = ({
  onBackToLogin,
  onRegistrationSuccess,
}) => {
  const { colors, fontSize, isDarkMode } = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [isFieldsDisabled, setIsFieldsDisabled] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "warning" | "info">("success");
  const [snackbarTimeout, setSnackbarTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isCookSelected, setIsCookSelected] = useState(false);
  const [isNannySelected, setIsNannySelected] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number; address: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [image, setImage] = useState<RNFile | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [isSameAddress, setIsSameAddress] = useState(false);
  const [isDobValid, setIsDobValid] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Languages selected in ServiceDetails
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  
  // Timeslot string from ServiceDetails (managed internally by ServiceDetails)
  const [timeslotString, setTimeslotString] = useState("06:00-20:00");

  // Policy modals
  const [policyModalVisible, setPolicyModalVisible] = useState(false);
  const [activePolicy, setActivePolicy] = useState<'terms' | 'privacy' | 'keyfacts'>('terms');

  // Date picker
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // Next button disabled state
  const [isNextDisabled, setIsNextDisabled] = useState(true);

  // Bank details
  const [bankDetails, setBankDetails] = useState<BankDetailsData>({
    bankName: "",
    ifscCode: "",
    accountHolderName: "",
    accountNumber: "",
    accountType: "",
    upiId: "",
  });
  const [bankDetailsErrors, setBankDetailsErrors] = useState<BankDetailsErrors>({});

  // Form data
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    middleName: "",
    lastName: "",
    gender: "",
    emailId: "",
    password: "",
    confirmPassword: "",
    mobileNo: "",
    AlternateNumber: "",
    buildingName: "",
    locality: "",
    street: "",
    currentLocation: "",
    nearbyLocation: "",
    pincode: "",
    latitude: 0,
    longitude: 0,
    AADHAR: "",
    pan: "",
    panImage: null,
    housekeepingRole: [],
    description: "",
    experience: "",
    kyc: "AADHAR",
    documentImage: null,
    otherDetails: "",
    profileImage: null,
    cookingSpeciality: "",
    nannyCareType: "",
    age: "",
    diet: "",
    dob: "",
    profilePic: "",
    timeslot: "06:00-20:00",
    referralCode: "",
    agreeToTerms: false,
    terms: false,
    privacy: false,
    keyFacts: false,
    kycType: "AADHAR",
    kycNumber: "",
    agentReferralId: "",
    permanentAddress: {
      apartment: "",
      street: "",
      city: "",
      state: "",
      country: "",
      pincode: ""
    },
    correspondenceAddress: {
      apartment: "",
      street: "",
      city: "",
      state: "",
      country: "",
      pincode: ""
    },
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const { validationResults, validateField, resetValidation } = useFieldValidation();

  // Initialize Geocoder
  useEffect(() => {
    Geocoder.init(keys.api_key);
  }, []);

  // Cleanup snackbar
  useEffect(() => {
    return () => {
      if (snackbarTimeout) clearTimeout(snackbarTimeout);
    };
  }, [snackbarTimeout]);

  const showSnackbar = (message: string, severity: "success" | "error" | "warning" | "info") => {
    if (snackbarTimeout) clearTimeout(snackbarTimeout);
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
    const timeout = setTimeout(() => {
      setSnackbarOpen(false);
      setSnackbarTimeout(null);
    }, 3000);
    setSnackbarTimeout(timeout);
  };

  // Axios interceptors
  useEffect(() => {
    const requestInterceptor = axiosInstance.interceptors.request.use(
      (config) => { console.log('Request:', config.url); return config; },
      (error) => Promise.reject(error)
    );
    const responseInterceptor = axiosInstance.interceptors.response.use(
      (response) => response,
      (error) => Promise.reject(error)
    );
    return () => {
      axiosInstance.interceptors.request.eject(requestInterceptor);
      axiosInstance.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Step completion check
  const checkStepCompletion = useCallback(() => {
    let isComplete = false;
    switch(activeStep) {
      case 0:
        isComplete = !!formData.firstName.trim() && !!formData.lastName.trim() && !!formData.gender &&
                     !!formData.emailId.trim() && !!formData.password.trim() && !!formData.confirmPassword.trim() &&
                     !!formData.mobileNo.trim() && !!formData.dob.trim() &&
                     !errors.firstName && !errors.lastName && !errors.gender && !errors.emailId &&
                     !errors.password && !errors.confirmPassword && !errors.mobileNo && !errors.dob &&
                     validationResults.email.isAvailable !== false && validationResults.mobile.isAvailable !== false;
        break;
      case 1:
        isComplete = !!formData.permanentAddress.apartment?.trim() && !!formData.permanentAddress.street?.trim() &&
                     !!formData.permanentAddress.city?.trim() && !!formData.permanentAddress.state?.trim() &&
                     !!formData.permanentAddress.country?.trim() && formData.permanentAddress.pincode?.trim().length === 6 &&
                     (isSameAddress || (
                       !!formData.correspondenceAddress.apartment?.trim() && !!formData.correspondenceAddress.street?.trim() &&
                       !!formData.correspondenceAddress.city?.trim() && !!formData.correspondenceAddress.state?.trim() &&
                       !!formData.correspondenceAddress.country?.trim() && formData.correspondenceAddress.pincode?.trim().length === 6
                     ));
        break;
      case 2:
        isComplete = formData.housekeepingRole.length > 0 && !!formData.diet && !!formData.experience &&
                     !isNaN(Number(formData.experience)) && Number(formData.experience) >= 0 &&
                     (!formData.housekeepingRole.includes("COOK") || !!formData.cookingSpeciality) &&
                     (!formData.housekeepingRole.includes("NANNY") || !!formData.nannyCareType);
        break;
      case 3:
        isComplete = !!formData.kycType && !!formData.kycNumber && formData.documentImage !== null;
        break;
      case 4:
        isComplete = true;
        break;
      case 5:
        isComplete = formData.keyFacts && formData.terms && formData.privacy;
        break;
      default: isComplete = false;
    }
    setIsNextDisabled(!isComplete);
  }, [activeStep, formData, errors, validationResults, isSameAddress]);

  useEffect(() => {
    checkStepCompletion();
  }, [activeStep, formData, errors, validationResults, isSameAddress, checkStepCompletion]);

  // Handle timeslot from ServiceDetails
  const handleTimeSlotsChange = (slots: string) => {
    setTimeslotString(slots);
    setFormData(prev => ({ ...prev, timeslot: slots }));
  };

  // Service type handlers
  const handleServiceTypeChange = (value: string) => {
    let updatedRoles: string[];
    if (formData.housekeepingRole.includes(value)) {
      updatedRoles = formData.housekeepingRole.filter(role => role !== value);
      if (value === "COOK") setFormData(prev => ({ ...prev, cookingSpeciality: "" }));
      if (value === "NANNY") setFormData(prev => ({ ...prev, nannyCareType: "" }));
    } else {
      updatedRoles = [...formData.housekeepingRole, value];
    }
    setFormData(prev => ({ ...prev, housekeepingRole: updatedRoles }));
    setIsCookSelected(updatedRoles.includes("COOK"));
    setIsNannySelected(updatedRoles.includes("NANNY"));
    if (updatedRoles.length > 0) setErrors(prev => ({ ...prev, housekeepingRole: "" }));
    checkStepCompletion();
  };

  const handleCookingSpecialityChange = (value: string) => {
    setFormData(prev => ({ ...prev, cookingSpeciality: value }));
    setErrors(prev => ({ ...prev, cookingSpeciality: "" }));
    checkStepCompletion();
  };

  const handleNannyCareTypeChange = (value: string) => {
    setFormData(prev => ({ ...prev, nannyCareType: value }));
    setErrors(prev => ({ ...prev, nannyCareType: "" }));
    checkStepCompletion();
  };

  const handleDietChange = (value: string) => {
    setFormData(prev => ({ ...prev, diet: value }));
    setErrors(prev => ({ ...prev, diet: "" }));
    checkStepCompletion();
  };

  const handleExperienceChange = (text: string) => {
    setFormData(prev => ({ ...prev, experience: text }));
    setErrors(prev => ({ ...prev, experience: "" }));
    checkStepCompletion();
  };

  const handleDescriptionChange = (text: string) => {
    setFormData(prev => ({ ...prev, description: text }));
  };

  const handleReferralCodeChange = (text: string) => {
    setFormData(prev => ({ ...prev, referralCode: text }));
  };

  const handleAgentReferralIdChange = (text: string) => {
    setFormData(prev => ({ ...prev, agentReferralId: text }));
  };

  const handleKycTypeChange = (kycType: string) => {
    setFormData(prev => ({ ...prev, kycType, kycNumber: "" }));
    setErrors(prev => ({ ...prev, kycType: "", kycNumber: "" }));
  };

  const handleDocumentUpload = (file: RNFile | null) => {
    setFormData(prev => ({ ...prev, documentImage: file }));
    checkStepCompletion();
  };

  const handleImageSelect = (file: RNFile | null) => {
    if (file) {
      setImage(file);
      setFormData(prev => ({ ...prev, profileImage: file }));
    } else {
      setImage(null);
      setFormData(prev => ({ ...prev, profileImage: null }));
    }
  };

  const handleTogglePasswordVisibility = () => setShowPassword(!showPassword);
  const handleToggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  const handleDatePress = () => setShowDatePicker(true);

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      const formattedDate = moment(date).format("YYYY-MM-DD");
      setFormData(prev => ({ ...prev, dob: formattedDate }));
      const { isValid, message } = validateAge(formattedDate);
      setIsDobValid(isValid);
      if (!isValid) {
        setIsFieldsDisabled(true);
        setErrors(prev => ({ ...prev, dob: message }));
      } else {
        setIsFieldsDisabled(false);
        setErrors(prev => ({ ...prev, dob: "" }));
      }
      checkStepCompletion();
    }
  };

  const validateAge = (dob: string): { isValid: boolean; message: string } => {
    if (!dob) return { isValid: false, message: "Date of birth is required" };
    const birthDate = moment(dob, "YYYY-MM-DD");
    const age = moment().diff(birthDate, "years");
    if (age < 18) return { isValid: false, message: "You must be at least 18 years old" };
    return { isValid: true, message: "" };
  };

  const handleAddressChange = async (type: 'permanent' | 'correspondence', data: any) => {
    const newFormData = { ...formData };
    if (type === 'permanent') newFormData.permanentAddress = data;
    else newFormData.correspondenceAddress = data;
    if (isSameAddress && type === 'permanent') newFormData.correspondenceAddress = data;
    setFormData(newFormData);
    if (type === 'permanent') setErrors(prev => ({ ...prev, permanentAddress: undefined }));
    else if (!isSameAddress) setErrors(prev => ({ ...prev, correspondenceAddress: undefined }));
    if (type === 'permanent' && isSameAddress) setErrors(prev => ({ ...prev, correspondenceAddress: undefined }));

    if (data.apartment && data.street && data.city && data.state && data.pincode) {
      try {
        const fullAddress = `${data.apartment}, ${data.street}, ${data.city}, ${data.state}, ${data.pincode}, ${data.country}`;
        const response = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
          params: { address: fullAddress, key: keys.api_key }
        });
        if (response.data.results && response.data.results.length > 0) {
          const location = response.data.results[0].geometry.location;
          const address = response.data.results[0].formatted_address;
          setFormData(prev => ({
            ...prev,
            latitude: location.lat,
            longitude: location.lng,
            currentLocation: address,
            locality: data.city,
            street: data.street,
            pincode: data.pincode,
            buildingName: data.apartment
          }));
          setCurrentLocation({ latitude: location.lat, longitude: location.lng, address });
        }
      } catch (error) {
        console.error("Error geocoding address:", error);
        showSnackbar("Error getting location coordinates", "warning");
      }
    }
    checkStepCompletion();
  };

  const handleSameAddressToggle = (checked: boolean) => {
    setIsSameAddress(checked);
    if (checked) {
      setFormData(prev => ({ ...prev, correspondenceAddress: { ...prev.permanentAddress } }));
      setErrors(prev => ({ ...prev, correspondenceAddress: undefined }));
    }
    checkStepCompletion();
  };

  const fetchLocationData = async () => {
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert("Permission Required", "Location permission is required.", [
          { text: "Open Settings", onPress: () => Linking.openSettings() },
          { text: "Cancel", style: "cancel" }
        ]);
        return;
      }
      setLocationLoading(true);
      showSnackbar("Fetching your location...", "info");
      Geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const res = await Geocoder.from(latitude, longitude);
            const address = res.results[0]?.formatted_address || "";
            const parsedAddress = parseAddressComponents(res.results[0]?.address_components || []);
            if (!parsedAddress.city || !parsedAddress.street) {
              const addressParts = address.split(',').map(part => part.trim());
              if (addressParts.length > 0) {
                if (!parsedAddress.apartment) parsedAddress.apartment = addressParts[0];
                if (!parsedAddress.street && addressParts.length > 1) parsedAddress.street = addressParts[1];
                if (!parsedAddress.city) {
                  for (let i = 1; i < addressParts.length - 2; i++) {
                    if (addressParts[i].match(/\d{6}/)) continue;
                    parsedAddress.city = addressParts[i];
                    break;
                  }
                }
              }
            }
            if (!parsedAddress.country) parsedAddress.country = "India";
            if (!parsedAddress.state) parsedAddress.state = "Unknown";
            if (!parsedAddress.city) parsedAddress.city = "Unknown";
            const addressData = {
              apartment: parsedAddress.apartment || "Current Location",
              street: parsedAddress.street || "Current Location",
              city: parsedAddress.city,
              state: parsedAddress.state,
              country: parsedAddress.country,
              pincode: parsedAddress.pincode || "",
            };
            const newPermanentAddress = { ...formData.permanentAddress, ...addressData };
            const newCorrespondenceAddress = isSameAddress ? newPermanentAddress : formData.correspondenceAddress;
            setFormData(prev => ({
              ...prev,
              latitude, longitude,
              currentLocation: address,
              street: addressData.street,
              locality: addressData.city,
              pincode: addressData.pincode,
              buildingName: addressData.apartment,
              permanentAddress: newPermanentAddress,
              correspondenceAddress: newCorrespondenceAddress,
            }));
            setCurrentLocation({ latitude, longitude, address });
            showSnackbar("Location fetched successfully!", "success");
          } catch (error) {
            console.error("Geocoding error:", error);
            showSnackbar("Error getting address from coordinates", "warning");
          } finally {
            setLocationLoading(false);
          }
        },
        (error) => {
          console.error("Location error:", error);
          showSnackbar("Unable to fetch location. Please check GPS.", "error");
          setLocationLoading(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } catch (error) {
      console.error("Location fetch error:", error);
      showSnackbar("Unable to fetch location. Please try again.", "error");
      setLocationLoading(false);
    }
  };

  const parseAddressComponents = (addressComponents: any[]) => {
    const result = { apartment: '', street: '', city: '', state: '', country: '', pincode: '' };
    addressComponents.forEach((component: any) => {
      const types = component.types;
      const longName = component.long_name;
      if (types.includes('street_number')) result.apartment = longName;
      else if (types.includes('route')) result.street = longName;
      else if (types.includes('locality')) result.city = longName;
      else if (types.includes('administrative_area_level_2') && !result.city) result.city = longName;
      else if (types.includes('administrative_area_level_1')) result.state = longName;
      else if (types.includes('country')) result.country = longName;
      else if (types.includes('postal_code')) result.pincode = longName;
      else if ((types.includes('sublocality_level_1') || types.includes('neighborhood')) && !result.street) result.street = longName;
    });
    return result;
  };

  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      if (Platform.OS === "android") {
        const fineStatus = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
        return fineStatus === RESULTS.GRANTED;
      } else if (Platform.OS === "ios") {
        const iosStatus = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        return iosStatus === RESULTS.GRANTED;
      }
      return false;
    } catch (err) {
      console.warn("Permission error:", err);
      return false;
    }
  };

  const handleBankDetailsChange = (data: BankDetailsData) => {
    setBankDetails(data);
    checkStepCompletion();
  };

  const debouncedEmailValidation = useCallback(debounce((email: string) => validateField('email', email), 500), [validateField]);
  const debouncedMobileValidation = useCallback(debounce((mobile: string) => validateField('mobile', mobile), 500), [validateField]);
  const debouncedAlternateValidation = useCallback(debounce((alternate: string) => validateField('alternate', alternate), 500), [validateField]);

  const handleClearEmail = () => {
    setFormData(prev => ({ ...prev, emailId: "" }));
    setErrors(prev => ({ ...prev, emailId: "" }));
    resetValidation('email');
  };
  const handleClearMobile = () => {
    setFormData(prev => ({ ...prev, mobileNo: "" }));
    setErrors(prev => ({ ...prev, mobileNo: "" }));
    resetValidation('mobile');
  };
  const handleClearAlternate = () => {
    setFormData(prev => ({ ...prev, AlternateNumber: "" }));
    setErrors(prev => ({ ...prev, AlternateNumber: "" }));
    resetValidation('alternate');
  };

  const handleRealTimeValidation = (e: any) => {
    const { name, value } = e.target;
    if (errors[name as keyof FormErrors]) setErrors(prev => ({ ...prev, [name]: "" }));

    if (name === "firstName") {
      const trimmed = value.trim();
      if (!trimmed) setErrors(prev => ({ ...prev, firstName: "First name is required" }));
      else if (!nameRegex.test(trimmed)) setErrors(prev => ({ ...prev, firstName: "Only letters allowed" }));
      else if (trimmed.length > MAX_NAME_LENGTH) setErrors(prev => ({ ...prev, firstName: `Max ${MAX_NAME_LENGTH} characters` }));
      else setErrors(prev => ({ ...prev, firstName: "" }));
    }
    if (name === "lastName") {
      const trimmed = value.trim();
      if (!trimmed) setErrors(prev => ({ ...prev, lastName: "Last name is required" }));
      else if (!nameRegex.test(trimmed)) setErrors(prev => ({ ...prev, lastName: "Only letters allowed" }));
      else if (trimmed.length > MAX_NAME_LENGTH) setErrors(prev => ({ ...prev, lastName: `Max ${MAX_NAME_LENGTH} characters` }));
      else setErrors(prev => ({ ...prev, lastName: "" }));
    }
    if (name === "middleName") {
      setFormData(prev => ({ ...prev, middleName: value }));
      return;
    }
    if (name === "password") {
      if (!value) setErrors(prev => ({ ...prev, password: "Password is required" }));
      else if (value.length < 8) setErrors(prev => ({ ...prev, password: "At least 8 characters" }));
      else if (!/[A-Z]/.test(value)) setErrors(prev => ({ ...prev, password: "One uppercase letter" }));
      else if (!/[a-z]/.test(value)) setErrors(prev => ({ ...prev, password: "One lowercase letter" }));
      else if (!/[0-9]/.test(value)) setErrors(prev => ({ ...prev, password: "One number" }));
      else if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) setErrors(prev => ({ ...prev, password: "One special character" }));
      else setErrors(prev => ({ ...prev, password: "" }));
    }
    if (name === "confirmPassword") {
      if (!value) setErrors(prev => ({ ...prev, confirmPassword: "Confirm password" }));
      else if (value !== formData.password) setErrors(prev => ({ ...prev, confirmPassword: "Passwords do not match" }));
      else setErrors(prev => ({ ...prev, confirmPassword: "" }));
    }
    if (name === "emailId") {
      const trimmed = value.trim();
      if (!trimmed) { setErrors(prev => ({ ...prev, emailId: "Email is required" })); resetValidation('email'); }
      else if (!emailIdRegex.test(trimmed)) { setErrors(prev => ({ ...prev, emailId: "Invalid email" })); resetValidation('email'); }
      else { setErrors(prev => ({ ...prev, emailId: "" })); debouncedEmailValidation(trimmed); }
    }
    if (name === "mobileNo") {
      const trimmed = value.trim();
      if (!trimmed) { setErrors(prev => ({ ...prev, mobileNo: "Mobile number required" })); resetValidation('mobile'); }
      else if (!phoneRegex.test(trimmed)) { setErrors(prev => ({ ...prev, mobileNo: "10-digit number" })); resetValidation('mobile'); }
      else { setErrors(prev => ({ ...prev, mobileNo: "" })); debouncedMobileValidation(trimmed); }
    }
    if (name === "AlternateNumber" && value) {
      const trimmed = value.trim();
      if (trimmed === formData.mobileNo) { setErrors(prev => ({ ...prev, AlternateNumber: "Cannot be same as mobile" })); resetValidation('alternate'); }
      else if (!phoneRegex.test(trimmed)) { setErrors(prev => ({ ...prev, AlternateNumber: "10-digit number" })); resetValidation('alternate'); }
      else { setErrors(prev => ({ ...prev, AlternateNumber: "" })); debouncedAlternateValidation(trimmed); }
    }
    if (name === "kycNumber") {
      const trimmed = value.trim();
      if (trimmed) {
        let isValid = true, errorMsg = "";
        switch(formData.kycType) {
          case "AADHAR": isValid = aadhaarRegex.test(trimmed); errorMsg = "12 digits required"; break;
          case "PAN": isValid = panRegex.test(trimmed); errorMsg = "Format ABCDE1234F"; break;
          case "DRIVING_LICENSE": isValid = trimmed.length >= 8; errorMsg = "Valid license number"; break;
          case "VOTER_ID": isValid = voterIdRegex.test(trimmed); errorMsg = "Format ABC1234567"; break;
          case "PASSPORT": isValid = passportRegex.test(trimmed); errorMsg = "1 letter + 7 digits"; break;
        }
        if (!isValid) setErrors(prev => ({ ...prev, kycNumber: errorMsg }));
        else setErrors(prev => ({ ...prev, kycNumber: "" }));
      } else {
        setErrors(prev => ({ ...prev, kycNumber: `${getKycLabel(formData.kycType)} number required` }));
      }
    }
    if (name === "gender") {
      setFormData(prev => ({ ...prev, gender: value }));
      if (errors.gender) setErrors(prev => ({ ...prev, gender: "" }));
      checkStepCompletion();
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
    checkStepCompletion();
  };

  const getKycLabel = (kycType: string): string => {
    const labels: Record<string, string> = { "AADHAR": "Aadhaar", "PAN": "PAN", "DRIVING_LICENSE": "Driving License", "VOTER_ID": "Voter ID", "PASSPORT": "Passport" };
    return labels[kycType] || "KYC";
  };

  const handleDobChange = (e: any) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, dob: value }));
    if (value) {
      const { isValid, message } = validateAge(value);
      setIsDobValid(isValid);
      setErrors(prev => ({ ...prev, dob: isValid ? "" : message }));
    }
    checkStepCompletion();
  };

  const handleOpenPolicy = (policyType: 'terms' | 'privacy' | 'keyfacts') => {
    setActivePolicy(policyType);
    setPolicyModalVisible(true);
  };

  const renderPolicyContent = () => {
    switch (activePolicy) {
      case 'terms': return <TnC />;
      case 'privacy': return <PrivacyPolicy />;
      case 'keyfacts': return <KeyFactsStatement />;
      default: return null;
    }
  };

  const handleTermsChange = useCallback((allAccepted: boolean) => {
    setFormData(prev => ({ ...prev, keyFacts: allAccepted, terms: allAccepted, privacy: allAccepted }));
    checkStepCompletion();
  }, [checkStepCompletion]);

  const handleTermsUpdate = useCallback((updatedTerms: { keyFacts: boolean; terms: boolean; privacy: boolean }) => {
    setFormData(prev => ({ ...prev, keyFacts: updatedTerms.keyFacts, terms: updatedTerms.terms, privacy: updatedTerms.privacy }));
    checkStepCompletion();
  }, [checkStepCompletion]);

  const validateStep = (step: number): boolean => {
    let tempErrors: FormErrors = {};
    let isValid = true;
    if (step === 0) {
      if (!formData.firstName.trim()) { tempErrors.firstName = "First name required"; isValid = false; }
      else if (!nameRegex.test(formData.firstName)) { tempErrors.firstName = "Only letters"; isValid = false; }
      if (!formData.lastName.trim()) { tempErrors.lastName = "Last name required"; isValid = false; }
      else if (!nameRegex.test(formData.lastName)) { tempErrors.lastName = "Only letters"; isValid = false; }
      if (!formData.gender) { tempErrors.gender = "Gender required"; isValid = false; }
      if (!formData.emailId.trim()) { tempErrors.emailId = "Email required"; isValid = false; }
      else if (!emailIdRegex.test(formData.emailId)) { tempErrors.emailId = "Invalid email"; isValid = false; }
      else if (validationResults.email.error) { tempErrors.emailId = validationResults.email.error; isValid = false; }
      else if (!validationResults.email.isAvailable) { tempErrors.emailId = "Email already registered"; isValid = false; }
      if (!formData.password.trim()) { tempErrors.password = "Password required"; isValid = false; }
      else if (!strongPasswordRegex.test(formData.password)) { tempErrors.password = "Password must be at least 8 characters with uppercase, lowercase, number, special char"; isValid = false; }
      if (!formData.confirmPassword.trim()) { tempErrors.confirmPassword = "Confirm password"; isValid = false; }
      else if (formData.password !== formData.confirmPassword) { tempErrors.confirmPassword = "Passwords do not match"; isValid = false; }
      if (!formData.mobileNo.trim()) { tempErrors.mobileNo = "Mobile number required"; isValid = false; }
      else if (!phoneRegex.test(formData.mobileNo)) { tempErrors.mobileNo = "10-digit number"; isValid = false; }
      else if (validationResults.mobile.error) { tempErrors.mobileNo = validationResults.mobile.error; isValid = false; }
      else if (!validationResults.mobile.isAvailable) { tempErrors.mobileNo = "Mobile already registered"; isValid = false; }
      if (formData.AlternateNumber.trim()) {
        if (!phoneRegex.test(formData.AlternateNumber)) { tempErrors.AlternateNumber = "10-digit number"; isValid = false; }
        else if (formData.AlternateNumber === formData.mobileNo) { tempErrors.AlternateNumber = "Cannot be same as mobile"; isValid = false; }
        else if (!validationResults.alternate.isAvailable) { tempErrors.AlternateNumber = "Alternate number already registered"; isValid = false; }
      }
      if (!formData.dob.trim()) { tempErrors.dob = "Date of birth required"; isValid = false; }
      else { const { isValid: ageValid, message } = validateAge(formData.dob); if (!ageValid) { tempErrors.dob = message; isValid = false; } }
    }
    else if (step === 1) {
      const permErrors: any = {};
      if (!formData.permanentAddress.apartment?.trim()) { permErrors.apartment = "Apartment required"; isValid = false; }
      if (!formData.permanentAddress.street?.trim()) { permErrors.street = "Street required"; isValid = false; }
      if (!formData.permanentAddress.city?.trim()) { permErrors.city = "City required"; isValid = false; }
      if (!formData.permanentAddress.state?.trim()) { permErrors.state = "State required"; isValid = false; }
      if (!formData.permanentAddress.country?.trim()) { permErrors.country = "Country required"; isValid = false; }
      if (!formData.permanentAddress.pincode?.trim()) { permErrors.pincode = "Pincode required"; isValid = false; }
      else if (formData.permanentAddress.pincode.length !== 6) { permErrors.pincode = "6 digits"; isValid = false; }
      if (Object.keys(permErrors).length) tempErrors.permanentAddress = permErrors;
      if (!isSameAddress) {
        const corrErrors: any = {};
        if (!formData.correspondenceAddress.apartment?.trim()) { corrErrors.apartment = "Apartment required"; isValid = false; }
        if (!formData.correspondenceAddress.street?.trim()) { corrErrors.street = "Street required"; isValid = false; }
        if (!formData.correspondenceAddress.city?.trim()) { corrErrors.city = "City required"; isValid = false; }
        if (!formData.correspondenceAddress.state?.trim()) { corrErrors.state = "State required"; isValid = false; }
        if (!formData.correspondenceAddress.country?.trim()) { corrErrors.country = "Country required"; isValid = false; }
        if (!formData.correspondenceAddress.pincode?.trim()) { corrErrors.pincode = "Pincode required"; isValid = false; }
        else if (formData.correspondenceAddress.pincode.length !== 6) { corrErrors.pincode = "6 digits"; isValid = false; }
        if (Object.keys(corrErrors).length) tempErrors.correspondenceAddress = corrErrors;
      }
    }
    else if (step === 2) {
      if (formData.housekeepingRole.length === 0) { tempErrors.housekeepingRole = "Select at least one service"; isValid = false; }
      if (formData.housekeepingRole.includes("COOK") && !formData.cookingSpeciality) { tempErrors.cookingSpeciality = "Select cooking speciality"; isValid = false; }
      if (formData.housekeepingRole.includes("NANNY") && !formData.nannyCareType) { tempErrors.nannyCareType = "Select care type"; isValid = false; }
      if (!formData.diet) { tempErrors.diet = "Select diet preference"; isValid = false; }
      if (!formData.experience) { tempErrors.experience = "Experience required"; isValid = false; }
      else if (isNaN(Number(formData.experience)) || Number(formData.experience) < 0) { tempErrors.experience = "Valid number"; isValid = false; }
    }
    else if (step === 3) {
      if (!formData.kycType) { tempErrors.kycType = "Select document type"; isValid = false; }
      if (!formData.kycNumber) { tempErrors.kycNumber = `${getKycLabel(formData.kycType)} number required`; isValid = false; }
      else {
        switch(formData.kycType) {
          case "AADHAR": if (!aadhaarRegex.test(formData.kycNumber)) { tempErrors.kycNumber = "12 digits"; isValid = false; } break;
          case "PAN": if (!panRegex.test(formData.kycNumber)) { tempErrors.kycNumber = "Format ABCDE1234F"; isValid = false; } break;
          case "DRIVING_LICENSE": if (formData.kycNumber.length < 8) { tempErrors.kycNumber = "Valid license number"; isValid = false; } break;
          case "VOTER_ID": if (!voterIdRegex.test(formData.kycNumber)) { tempErrors.kycNumber = "Format ABC1234567"; isValid = false; } break;
          case "PASSPORT": if (!passportRegex.test(formData.kycNumber)) { tempErrors.kycNumber = "1 letter + 7 digits"; isValid = false; } break;
        }
      }
      if (!formData.documentImage) { tempErrors.documentImage = "Upload document image"; isValid = false; }
    }
    else if (step === 5) {
      if (!formData.keyFacts) { tempErrors.keyFacts = "Agree to Key Facts Statement"; isValid = false; }
      if (!formData.terms) { tempErrors.terms = "Agree to Terms and Conditions"; isValid = false; }
      if (!formData.privacy) { tempErrors.privacy = "Agree to Privacy Policy"; isValid = false; }
    }
    setErrors(tempErrors);
    return isValid;
  };
  

  const handleNext = () => {
    if (isNextDisabled) { showSnackbar("Please fill all required fields", "warning"); return; }
    if (activeStep === 0 && (validationResults.email.loading || validationResults.mobile.loading)) {
      showSnackbar("Please wait for email/mobile validation", "warning");
      return;
    }
    if (!validateStep(activeStep)) { showSnackbar("Please fix errors before proceeding", "error"); return; }
    setActiveStep(prev => Math.min(prev + 1, steps.length - 1));
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    if (activeStep === steps.length - 1) showSnackbar("Registration form completed!", "success");
  };

  const handleBack = () => {
    if (activeStep === 0) onBackToLogin(true);
    else setActiveStep(prev => prev - 1);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleSubmit = async () => {
    if (activeStep !== steps.length - 1) return;
    if (validateStep(activeStep)) {
      setIsSubmitting(true);
      try {
        let profilePicUrl = "";
        if (image) {
          const profileFormData = new FormData();
          profileFormData.append("image", { uri: image.uri, type: image.type || 'image/jpeg', name: image.name || 'profile.jpg' } as any);
          const imageResponse = await axiosInstance.post("http://65.2.153.173:3000/upload", profileFormData, { headers: { "Content-Type": "multipart/form-data" } });
          if (imageResponse.status === 200) profilePicUrl = imageResponse.data.imageUrl;
        }
        const selectedServices = formData.housekeepingRole;
        const primaryRole = selectedServices.length > 0 ? selectedServices[0] : "";
        const age = formData.dob ? moment().diff(moment(formData.dob, "YYYY-MM-DD"), "years") : 0;
        const payload = {
          firstName: formData.firstName, middleName: formData.middleName, lastName: formData.lastName,
          mobileNo: parseInt(formData.mobileNo) || 0, alternateNo: formData.AlternateNumber ? parseInt(formData.AlternateNumber) : 0,
          emailId: formData.emailId, gender: formData.gender, buildingName: formData.buildingName, locality: formData.locality,
          latitude: currentLocation?.latitude || formData.latitude, longitude: currentLocation?.longitude || formData.longitude,
          street: formData.street, pincode: parseInt(formData.pincode) || 0, currentLocation: formData.currentLocation,
          nearbyLocation: formData.nearbyLocation, location: formData.currentLocation,
          housekeepingRoles: selectedServices, housekeepingRole: primaryRole, serviceTypes: selectedServices,
          diet: formData.diet, languages: selectedLanguages, age,
          ...(selectedServices.includes("COOK") && { cookingSpeciality: formData.cookingSpeciality }),
          ...(selectedServices.includes("NANNY") && { nannyCareType: formData.nannyCareType }),
          timeslot: formData.timeslot, expectedSalary: 0, experience: parseInt(formData.experience) || 0,
          username: formData.emailId, password: formData.password, agentReferralId: formData.agentReferralId || "",
          privacy: formData.privacy, keyFacts: formData.keyFacts,
          permanentAddress: {
            field1: formData.permanentAddress.apartment || "", field2: formData.permanentAddress.street || "",
            ctarea: formData.permanentAddress.city || "", pinno: formData.permanentAddress.pincode || "",
            state: formData.permanentAddress.state || "", country: formData.permanentAddress.country || ""
          },
          correspondenceAddress: {
            field1: formData.correspondenceAddress.apartment || "", field2: formData.correspondenceAddress.street || "",
            ctarea: formData.correspondenceAddress.city || "", pinno: formData.correspondenceAddress.pincode || "",
            state: formData.correspondenceAddress.state || "", country: formData.correspondenceAddress.country || ""
          },
          active: true, kycType: formData.kycType, kycNumber: formData.kycNumber, dob: formData.dob, profilePic: profilePicUrl,
          bankDetails: {
            bankName: bankDetails.bankName || "", ifscCode: bankDetails.ifscCode || "",
            accountHolderName: bankDetails.accountHolderName || "", accountNumber: bankDetails.accountNumber || "",
            accountType: bankDetails.accountType || "", upiId: bankDetails.upiId || ""
          }
        };
        console.log("Submitting payload:", JSON.stringify(payload, null, 2));
        await providerInstance.post("/api/service-providers/serviceprovider/add", payload, { headers: { "Content-Type": "application/json" } });
        showSnackbar("Registration successful!", "success");
        const authPayload = { email: formData.emailId, password: formData.password, name: `${formData.firstName} ${formData.lastName}` };
        axios.post('https://utils-ndt3.onrender.com/authO/create-autho-user', authPayload).catch(err => console.error("AuthO error:", err));
        setTimeout(() => {
          setIsSubmitting(false);
          if (onRegistrationSuccess) onRegistrationSuccess();
          else onBackToLogin(true);
        }, 3000);
      } catch (error) {
        setIsSubmitting(false);
        const errorMsg = axios.isAxiosError(error) ? error.response?.data?.debugMessage || error.response?.data?.message || "Registration failed" : "Registration failed";
        showSnackbar(errorMsg, "error");
        console.error("Submit error:", error);
      }
    } else setIsSubmitting(false);
  };

  const handleCloseSnackbar = () => {
    if (snackbarTimeout) clearTimeout(snackbarTimeout);
    setSnackbarOpen(false);
  };

  const getFontSizes = () => {
    switch (fontSize) {
      case 'small': return { title: 18, subtitle: 14, text: 12, small: 11, button: 13, heading: 16, label: 13 };
      case 'large': return { title: 24, subtitle: 18, text: 16, small: 14, button: 16, heading: 20, label: 15 };
      default: return { title: 20, subtitle: 16, text: 14, small: 12, button: 14, heading: 18, label: 14 };
    }
  };
  const fontSizes = getFontSizes();

  const renderStepper = () => (
    <View style={styles.stepperWrapper}>
      {steps.map((step, index) => (
        <View key={index} style={styles.stepperItem}>
          <View style={[styles.stepperCircle, index < activeStep && styles.stepperCircleCompleted, index === activeStep && styles.stepperCircleActive, index > activeStep && styles.stepperCircleInactive]}>
            {index < activeStep ? <Icon name="check" size={SCREEN_WIDTH < 380 ? 12 : 16} color="#fff" /> : <Text style={[styles.stepperNumber, { fontSize: SCREEN_WIDTH < 380 ? 10 : 12 }]}>{index + 1}</Text>}
          </View>
          <Text style={[styles.stepperLabel, { fontSize: SCREEN_WIDTH < 380 ? 9 : (SCREEN_WIDTH < 480 ? 10 : 11), textAlign: 'center' }, index <= activeStep ? styles.stepperLabelActive : styles.stepperLabelInactive]} numberOfLines={2}>{step}</Text>
          {index < steps.length - 1 && <View style={[styles.stepperLine, index < activeStep && styles.stepperLineActive]} />}
        </View>
      ))}
    </View>
  );

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return <BasicInformation
          formData={formData} errors={errors} validationResults={validationResults}
          showPassword={showPassword} showConfirmPassword={showConfirmPassword} isDobValid={isDobValid}
          onImageSelect={handleImageSelect} onFieldChange={handleRealTimeValidation}
          onFieldFocus={(fieldName) => setErrors(prev => ({ ...prev, [fieldName]: "" }))}
          onDobChange={handleDobChange} onDatePress={handleDatePress}
          onTogglePasswordVisibility={handleTogglePasswordVisibility}
          onToggleConfirmPasswordVisibility={handleToggleConfirmPasswordVisibility}
          onClearEmail={handleClearEmail} onClearMobile={handleClearMobile} onClearAlternate={handleClearAlternate}
        />;
      case 1:
        return (
          <View style={styles.stepContainer}>
            <AddressComponent
              onAddressChange={handleAddressChange}
              permanentAddress={formData.permanentAddress}
              correspondenceAddress={formData.correspondenceAddress}
              errors={{ permanent: errors.permanentAddress, correspondence: errors.correspondenceAddress }}
              onSameAddressToggle={handleSameAddressToggle}
              isSameAddress={isSameAddress}
            />
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <Icon name="location-on" size={22} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.text, fontSize: fontSizes.heading }]}>Current Location</Text>
              </View>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary, fontSize: fontSizes.text }]}>Use your current location to auto-fill address details</Text>
              <TouchableOpacity style={[styles.locationButton, { backgroundColor: colors.primary }, locationLoading && styles.buttonDisabled]} onPress={fetchLocationData} disabled={locationLoading}>
                {locationLoading ? <ActivityIndicator size="small" color="#fff" /> : <><Icon name="my-location" size={18} color="#fff" /><Text style={[styles.buttonText, { color: '#fff', fontSize: fontSizes.button }]}>Fetch Current Location</Text></>}
              </TouchableOpacity>
              {(formData.latitude !== 0 || formData.longitude !== 0) && (
                <View style={[styles.successAlert, { backgroundColor: colors.successLight, borderColor: colors.success }]}>
                  <Text style={[styles.alertText, { color: colors.success, fontSize: fontSizes.small }]}><Text style={{ fontWeight: 'bold' }}>Detected:</Text> {formData.currentLocation || "No address available"}</Text>
                </View>
              )}
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContainer}>
            <ServiceDetails
              formData={formData}
              errors={errors}
              isCookSelected={isCookSelected}
              isNannySelected={isNannySelected}
              onServiceTypeChange={handleServiceTypeChange}
              onCookingSpecialityChange={handleCookingSpecialityChange}
              onNannyCareTypeChange={handleNannyCareTypeChange}
              onDietChange={handleDietChange}
              onExperienceChange={handleExperienceChange}
              onDescriptionChange={handleDescriptionChange}
              onReferralCodeChange={handleReferralCodeChange}
              onAgentReferralIdChange={handleAgentReferralIdChange}
              selectedLanguages={selectedLanguages}
              onLanguagesChange={setSelectedLanguages}
              onTimeSlotsChange={handleTimeSlotsChange}
            />
          </View>
        );
      case 3:
        return <KYCVerification
          formData={formData} errors={errors}
          onFieldChange={handleRealTimeValidation}
          onFieldFocus={(fieldName) => setErrors(prev => ({ ...prev, [fieldName]: "" }))}
          onDocumentUpload={handleDocumentUpload}
          onKycTypeChange={handleKycTypeChange}
        />;
      case 4:
        return <BankDetails onBankDetailsChange={handleBankDetailsChange} initialData={bankDetails} errors={bankDetailsErrors} />;
      case 5:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.confirmationText, { color: colors.text, fontSize: fontSizes.text }]}>Please review your information and agree to the terms to complete your registration.</Text>
            <TermsCheckboxes onChange={handleTermsChange} onIndividualChange={handleTermsUpdate} onLinkPress={handleOpenPolicy} initialValues={{ keyFacts: formData.keyFacts, terms: formData.terms, privacy: formData.privacy }} />
            {errors.keyFacts && <Text style={[styles.errorText, { color: colors.error, fontSize: fontSizes.small }]}>{errors.keyFacts}</Text>}
            {errors.terms && <Text style={[styles.errorText, { color: colors.error, fontSize: fontSizes.small }]}>{errors.terms}</Text>}
            {errors.privacy && <Text style={[styles.errorText, { color: colors.error, fontSize: fontSizes.small }]}>{errors.privacy}</Text>}
          </View>
        );
      default: return <Text style={{ color: colors.text, fontSize: fontSizes.text }}>Unknown step</Text>;
    }
  };

  return (
    <Modal visible={true} animationType="slide" transparent={false}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.keyboardView} keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}>
          <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient colors={["#0a2a66ff", "#004aadff"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.headerContainer}>
              <Text style={[styles.title, { color: '#fff', fontSize: fontSizes.title }]}>Service Provider Registration</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => onBackToLogin(true)}><Icon name="close" size={24} color="#fff" /></TouchableOpacity>
            </LinearGradient>
            <ScrollView ref={scrollViewRef} style={[styles.content, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
              {renderStepper()}
              {renderStepContent(activeStep)}
              <View style={styles.buttonContainer}>
                <Button variant="outline" size="medium" onPress={handleBack} disabled={isSubmitting} startIcon={<Icon name="arrow-back" size={20} color={colors.primary} />}>Back</Button>
                {activeStep === steps.length - 1 ? (
                  <Button variant="primary" size="medium" onPress={handleSubmit} disabled={isNextDisabled || isSubmitting} loading={isSubmitting}>Submit</Button>
                ) : (
                  <Button variant="primary" size="medium" onPress={handleNext} disabled={isNextDisabled || isSubmitting} endIcon={<Icon name="arrow-forward" size={20} color="#fff" />}>Next</Button>
                )}
              </View>
            </ScrollView>
            <Modal visible={policyModalVisible} animationType="slide" transparent={false} onRequestClose={() => setPolicyModalVisible(false)}>
              <View style={[styles.policyModalContainer, { backgroundColor: colors.background }]}>
                <LinearGradient colors={["#0a2a66ff", "#004aadff"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.policyModalHeader}>
                  <Text style={[styles.policyModalTitle, { color: '#fff', fontSize: fontSizes.title }]}>{activePolicy === 'terms' ? "Terms and Conditions" : activePolicy === 'privacy' ? "Privacy Policy" : "Key Facts Statement"}</Text>
                  <TouchableOpacity style={styles.policyModalClose} onPress={() => setPolicyModalVisible(false)}><Icon name="close" size={24} color="#fff" /></TouchableOpacity>
                </LinearGradient>
                <ScrollView style={[styles.policyModalContent, { backgroundColor: colors.background }]}>{renderPolicyContent()}</ScrollView>
              </View>
            </Modal>
            {showDatePicker && <DateTimePicker value={selectedDate || new Date()} mode="date" display={Platform.OS === "ios" ? "spinner" : "default"} onChange={handleDateChange} maximumDate={new Date()} />}
            {snackbarOpen && (
              <View style={[styles.snackbar, styles[`snackbar${snackbarSeverity}`], { backgroundColor: colors[snackbarSeverity] || colors.primary }]}>
                <Text style={[styles.snackbarText, { color: '#fff', fontSize: fontSizes.text }]}>{snackbarMessage}</Text>
                <TouchableOpacity onPress={handleCloseSnackbar}><Icon name="close" size={20} color="white" /></TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  keyboardView: { flex: 1 },
  container: { flex: 1 },
  headerContainer: { paddingTop: Platform.OS === "ios" ? 12 : 16, paddingBottom: Platform.OS === "ios" ? 12 : 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  title: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  closeButton: { position: 'absolute', right: 16, top: Platform.OS === "ios" ? 12 : 16 },
  content: { flex: 1 },
  contentContainer: { padding: 16, paddingBottom: 32 },
  stepContainer: { marginBottom: 20 },
  stepperWrapper: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, paddingHorizontal: 4, flexWrap: 'wrap' },
  stepperItem: { flex: 1, alignItems: 'center', position: 'relative', minWidth: SCREEN_WIDTH < 480 ? 50 : 60 },
  stepperCircle: { width: SCREEN_WIDTH < 380 ? 32 : (SCREEN_WIDTH < 480 ? 36 : 40), height: SCREEN_WIDTH < 380 ? 32 : (SCREEN_WIDTH < 480 ? 36 : 40), borderRadius: SCREEN_WIDTH < 380 ? 16 : (SCREEN_WIDTH < 480 ? 18 : 20), justifyContent: 'center', alignItems: 'center', marginBottom: 6, zIndex: 2, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
  stepperCircleCompleted: { backgroundColor: '#4caf50' },
  stepperCircleActive: { backgroundColor: '#1976d2', transform: [{ scale: 1.02 }] },
  stepperCircleInactive: { backgroundColor: '#e0e0e0' },
  stepperNumber: { color: '#fff', fontWeight: 'bold' },
  stepperLabel: { fontWeight: '500', lineHeight: 14 },
  stepperLabelActive: { color: '#1976d2', fontWeight: 'bold' },
  stepperLabelInactive: { color: '#757575' },
  stepperLine: { position: 'absolute', top: SCREEN_WIDTH < 380 ? 16 : (SCREEN_WIDTH < 480 ? 18 : 20), left: '50%', right: '-50%', height: 2, backgroundColor: '#e0e0e0', zIndex: 1 },
  stepperLineActive: { backgroundColor: '#1976d2' },
  card: { borderRadius: 12, padding: 16, marginTop: 16, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontWeight: 'bold', marginLeft: 8 },
  cardSubtitle: { marginBottom: 16, lineHeight: 20 },
  locationButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 10, marginBottom: 16 },
  buttonText: { color: 'white', fontWeight: '600', marginLeft: 8 },
  buttonDisabled: { opacity: 0.6 },
  successAlert: { borderWidth: 1, borderRadius: 8, padding: 12, marginTop: 8 },
  alertText: { lineHeight: 18 },
  confirmationText: { marginBottom: 20, lineHeight: 22, textAlign: 'center' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, marginBottom: 20, gap: 12 },
  snackbar: { position: 'absolute', top: Platform.OS === "ios" ? 50 : 20, left: 16, right: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderRadius: 10, zIndex: 1000, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  snackbarsuccess: { backgroundColor: '#4caf50' },
  snackbarerror: { backgroundColor: '#f44336' },
  snackbarwarning: { backgroundColor: '#ff9800' },
  snackbarinfo: { backgroundColor: '#2196f3' },
  snackbarText: { color: 'white', flex: 1, marginRight: 12, lineHeight: 20 },
  errorText: { marginTop: 4, marginBottom: 8 },
  policyModalContainer: { flex: 1 },
  policyModalHeader: { paddingTop: Platform.OS === "ios" ? 50 : 20, paddingBottom: 16, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  policyModalTitle: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
  policyModalClose: { position: 'absolute', right: 16, top: Platform.OS === "ios" ? 50 : 20 },
  policyModalContent: { flex: 1, padding: 16 },
});

export default ServiceProviderRegistration;