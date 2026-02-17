/* eslint-disable */
import React, { useEffect, useState, useCallback } from "react";
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
} from "react-native";
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from "axios";
import { keys } from "../env";
import axiosInstance from "../services/axiosInstance";
import CustomFileInput from "./CustomFileInput";
import AddressComponent from "./AddressComponent";
import { TermsCheckboxes } from "../common/TermsCheckboxes";
import { debounce } from "../utils/debounce";
import { useFieldValidation } from "./useFieldValidation";
import Geolocation from "@react-native-community/geolocation";
import Geocoder from "react-native-geocoding";
import { PERMISSIONS, request, RESULTS } from "react-native-permissions";
import Slider from '@react-native-community/slider';
import ProfileImageUpload from "./ProfileImageUpload";
import DateTimePicker from '@react-native-community/datetimepicker';
import TnC from "../TermsAndConditions/TnC";
import PrivacyPolicy from "../TermsAndConditions/PrivacyPolicy";
import KeyFactsStatement from "../TermsAndConditions/KeyFactsStatement";
import { Button } from "../common/Button";

// Define the shape of formData using an interface
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
  housekeepingRole: string;
  description: string;
  experience: string;
  kyc: string;
  documentImage: RNFile | null;
  otherDetails: string;
  profileImage: RNFile | null;
  cookingSpeciality: string;
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

// Define RNFile interface to match React Native file objects
interface RNFile {
  name: string;
  type: string;
  uri: string;
  size?: number | null;
}

// Define the shape of errors to hold string messages
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
  diet?: string;
  dob?: string;
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

// Regex for validation
const nameRegex = /^[A-Za-z]+(?:[ ][A-Za-z]+)*$/;
const emailIdRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Z|a-z]{2,}$/;
const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const phoneRegex = /^[0-9]{10}$/;
const pincodeRegex = /^[0-9]{6}$/;
const aadhaarRegex = /^[0-9]{12}$/;
const MAX_NAME_LENGTH = 30;

// Fixed steps without extra spaces
const steps = [
  "Basic Information",
  "Address Information",
  "Additional Details",
  "KYC Verification",
  "Confirmation",
];

interface RegistrationProps {
  onBackToLogin: (data: boolean) => void;
  onRegistrationSuccess?: () => void;
}

const ServiceProviderRegistration: React.FC<RegistrationProps> = ({
  onBackToLogin, onRegistrationSuccess,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isFieldsDisabled, setIsFieldsDisabled] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "warning" | "info">("success");
  const [sliderDisabled, setSliderDisabled] = useState(true);
  const [sliderValueMorning, setSliderValueMorning] = useState([6, 12]);
  const [sliderValueEvening, setSliderValueEvening] = useState([12, 20]);
  const [isCookSelected, setIsCookSelected] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [image, setImage] = useState<RNFile | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [isSameAddress, setIsSameAddress] = useState(false);
  // Policy modal states
  const [policyModalVisible, setPolicyModalVisible] = useState(false);
  const [activePolicy, setActivePolicy] = useState<'terms' | 'privacy' | 'keyfacts'>('terms');

  // Date Picker State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

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
    housekeepingRole: "",
    description: "",
    experience: "",
    kyc: "AADHAR",
    documentImage: null,
    otherDetails: "",
    profileImage: null,
    cookingSpeciality: "",
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

  // Initialize Geocoder
  useEffect(() => {
    Geocoder.init("AIzaSyBWoIIAX-gE7fvfAkiquz70WFgDaL7YXSk"); // Replace with your API key
  }, []);

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

  const handleImageSelect = (file: RNFile | null) => {
    if (file) {
      setImage(file);
      // Also update formData with profileImage
      setFormData(prev => ({
        ...prev,
        profileImage: file
      }));
    } else {
      setImage(null);
      setFormData(prev => ({
        ...prev,
        profileImage: null
      }));
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleChange = (name: keyof FormData, value: string | boolean | RNFile | null) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Real-time validation for gender
    if (name === "gender") {
      setErrors((prevErrors) => ({
        ...prevErrors,
        gender: value ? "" : "Please select a gender.",
      }));
    }
  };

  // Date Picker Handlers
  const handleDatePress = () => {
    setShowDatePicker(true);
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);

    if (date) {
      setSelectedDate(date);
      const formattedDate = moment(date).format("YYYY-MM-DD");
      setFormData((prev) => ({ ...prev, dob: formattedDate }));

      // Validate age
      const isValidAge = validateAge(formattedDate);

      if (!isValidAge) {
        setIsFieldsDisabled(true);
        setErrors(prev => ({ ...prev, dob: "You must be at least 18 years old" }));
      } else {
        setIsFieldsDisabled(false);
        setErrors(prev => ({ ...prev, dob: "" }));
      }
    }
  };

  const handleAddressChange = async (type: 'permanent' | 'correspondence', data: any) => {
    setFormData(prev => ({
      ...prev,
      [type === 'permanent' ? 'permanentAddress' : 'correspondenceAddress']: data
    }));

    if (type === 'permanent') {
      // Also update main form fields for backward compatibility
      setFormData(prev => ({
        ...prev,
        buildingName: data.apartment,
        street: data.street,
        locality: data.city,
        pincode: data.pincode,
        currentLocation: `${data.apartment}, ${data.street}, ${data.city}, ${data.state}, ${data.country} - ${data.pincode}`
      }));
    }

    // If same address is checked, update correspondence address too
    if (type === 'permanent' && isSameAddress) {
      setFormData(prev => ({
        ...prev,
        correspondenceAddress: data
      }));
    }

    // Try to geocode for coordinates if we have enough data
    if (data.apartment && data.street && data.city && data.state && data.pincode) {
      try {
        const fullAddress = `${data.apartment}, ${data.street}, ${data.city}, ${data.state}, ${data.pincode}, ${data.country}`;

        const response = await axios.get(
          "https://maps.googleapis.com/maps/api/geocode/json",
          {
            params: {
              address: fullAddress,
              key: keys.api_key,
            },
          }
        );

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

          setCurrentLocation({
            latitude: location.lat,
            longitude: location.lng,
            address: address
          });
        }
      } catch (error) {
        console.error("Error geocoding address:", error);
      }
    }
  };

  const handleSameAddressToggle = (checked: boolean) => {
    setIsSameAddress(checked);
    if (checked) {
      // Copy permanent address to correspondence address
      setFormData(prev => ({
        ...prev,
        correspondenceAddress: prev.permanentAddress
      }));
    }
  };

  const { validationResults, validateField, resetValidation } = useFieldValidation();

  // Add debounced validation functions
  const debouncedEmailValidation = useCallback(
    debounce((email: string) => {
      validateField('email', email);
    }, 500),
    [validateField]
  );

  const debouncedMobileValidation = useCallback(
    debounce((mobile: string) => {
      validateField('mobile', mobile);
    }, 500),
    [validateField]
  );

  const debouncedAlternateValidation = useCallback(
    debounce((alternate: string) => {
      validateField('alternate', alternate);
    }, 500),
    [validateField]
  );

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

  const handleRealTimeValidation = (name: keyof FormData, value: string) => {
    const aadhaarPattern = /^[0-9]{12}$/;

    if (name === "firstName") {
      const trimmedValue = value.trim();
      if (!trimmedValue) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          firstName: "First Name is required.",
        }));
      } else if (!nameRegex.test(trimmedValue)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          firstName: "First Name should contain only alphabets.",
        }));
      } else if (trimmedValue.length > MAX_NAME_LENGTH) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          firstName: `First Name should not exceed ${MAX_NAME_LENGTH} characters.`,
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          firstName: "",
        }));
      }
    }

    if (name === "lastName") {
      const trimmedValue = value.trim();
      if (!trimmedValue) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          lastName: "Last Name is required.",
        }));
      } else if (!nameRegex.test(trimmedValue)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          lastName: "Last Name should contain only alphabets.",
        }));
      } else if (trimmedValue.length > MAX_NAME_LENGTH) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          lastName: `Last Name should not exceed ${MAX_NAME_LENGTH} characters.`,
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          lastName: "",
        }));
      }
    }

    if (name === "password") {
      if (!value) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          password: "Password is required.",
        }));
      } else if (value.length < 8) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          password: "Password must be at least 8 characters long.",
        }));
      } else if (!/[A-Z]/.test(value)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          password: "Password must contain at least one uppercase letter.",
        }));
      } else if (!/[a-z]/.test(value)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          password: "Password must contain at least one lowercase letter.",
        }));
      } else if (!/[0-9]/.test(value)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          password: "Password must contain at least one digit.",
        }));
      } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          password: "Password must contain at least one special character.",
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          password: "",
        }));
      }
    }

    if (name === "confirmPassword") {
      if (!value) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          confirmPassword: "Please confirm your password.",
        }));
      } else if (value !== formData.password) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          confirmPassword: "Passwords do not match",
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          confirmPassword: "",
        }));
      }
    }

    if (name === "emailId") {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const trimmedValue = value.trim();
      
      if (!trimmedValue) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          emailId: "Email is required.",
        }));
        resetValidation('email');
      } else if (!emailPattern.test(trimmedValue)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          emailId: "Please enter a valid email address.",
        }));
        resetValidation('email');
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          emailId: "",
        }));
        debouncedEmailValidation(trimmedValue);
      }
    }

    if (name === "mobileNo") {
      const mobilePattern = /^[0-9]{10}$/;
      const trimmedValue = value.trim();
      
      if (!trimmedValue) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          mobileNo: "Mobile number is required.",
        }));
        resetValidation('mobile');
      } else if (!mobilePattern.test(trimmedValue)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          mobileNo: "Please enter a valid 10-digit mobile number.",
        }));
        resetValidation('mobile');
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          mobileNo: "",
        }));
        debouncedMobileValidation(trimmedValue);
      }
    }

    if (name === "AlternateNumber" && value) {
      const mobilePattern = /^[0-9]{10}$/;
      const trimmedValue = value.trim();
      
      // Check if alternate number is same as primary mobile number
      if (trimmedValue === formData.mobileNo) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          AlternateNumber: "Alternate number cannot be the same as mobile number.",
        }));
        resetValidation('alternate');
      } else if (!mobilePattern.test(trimmedValue)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          AlternateNumber: "Please enter a valid 10-digit mobile number.",
        }));
        resetValidation('alternate');
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          AlternateNumber: "",
        }));
        debouncedAlternateValidation(trimmedValue);
      }
    }

    if (name === "AADHAR") {
      const trimmedValue = value.trim();
      if (!aadhaarPattern.test(trimmedValue)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          AADHAR: "AADHAR number must be exactly 12 digits.",
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          AADHAR: "",
        }));
      }
    }

    if (name === "pincode") {
      const numericValue = value.replace(/\D/g, "");
      setFormData((prevData) => ({
        ...prevData,
        [name]: numericValue.slice(0, 6),
      }));

      if (numericValue.length !== 6) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          pincode: "Pincode must be exactly 6 digits.",
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          pincode: "",
        }));
      }
    }

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleCookingSpecialityChange = (value: string) => {
    setFormData((prevData) => ({ ...prevData, cookingSpeciality: value }));
  };

  // Helper function to parse address components
  const parseAddressComponents = (addressComponents: any[]) => {
    const result = {
      apartment: '',
      street: '',
      city: '',
      state: '',
      country: '',
      pincode: ''
    };

    addressComponents.forEach((component: any) => {
      const types = component.types;
      const longName = component.long_name;

      if (types.includes('street_number')) {
        result.apartment = longName;
      } else if (types.includes('route')) {
        result.street = longName;
      } else if (types.includes('locality')) {
        result.city = longName;
      } else if (types.includes('administrative_area_level_2')) {
        // District - use as city if city not found
        if (!result.city) result.city = longName;
      } else if (types.includes('administrative_area_level_1')) {
        result.state = longName;
      } else if (types.includes('country')) {
        result.country = longName;
      } else if (types.includes('postal_code')) {
        result.pincode = longName;
      } else if (types.includes('sublocality_level_1') || types.includes('neighborhood')) {
        // Use as street if street not found
        if (!result.street) result.street = longName;
      }
    });

    return result;
  };

  const fetchLocationData = async () => {
    try {
      // Request location permission
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert(
          "Permission Required",
          "Location access is required to fetch your current location. Please enable it in settings.",
          [
            {
              text: "Open Settings",
              onPress: () => Linking.openSettings(),
            },
            { text: "Cancel", style: "cancel" },
          ]
        );
        return;
      }

      setLocationLoading(true);
      setSnackbarMessage("Fetching your current location...");
      setSnackbarSeverity("info");
      setSnackbarOpen(true);

      // Get current position
      Geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            // Reverse geocode to get address
            const res = await Geocoder.from(latitude, longitude);
            const address = res.results[0]?.formatted_address || "";

            // Parse address components using helper function
            const parsedAddress = parseAddressComponents(res.results[0]?.address_components || []);

            // If we couldn't extract enough details, try to parse from formatted address
            if (!parsedAddress.city || !parsedAddress.street) {
              const addressParts = address.split(',').map(part => part.trim());

              // Try to intelligently parse the address
              if (addressParts.length > 0) {
                // First part is usually apartment/street number
                if (!parsedAddress.apartment) {
                  parsedAddress.apartment = addressParts[0];
                }

                // Second part is often street
                if (!parsedAddress.street && addressParts.length > 1) {
                  parsedAddress.street = addressParts[1];
                }

                // Look for city (usually one of the middle parts)
                if (!parsedAddress.city) {
                  for (let i = 1; i < addressParts.length - 2; i++) {
                    if (addressParts[i].match(/\d{6}/)) {
                      // Skip pincodes
                      continue;
                    }
                    parsedAddress.city = addressParts[i];
                    break;
                  }
                }
              }
            }

            // Ensure we have default values
            if (!parsedAddress.country) {
              parsedAddress.country = 'India';
            }
            if (!parsedAddress.state) {
              parsedAddress.state = 'Unknown';
            }
            if (!parsedAddress.city) {
              parsedAddress.city = 'Unknown';
            }

            // Create address data object
            const addressData = {
              apartment: parsedAddress.apartment || "Current Location",
              street: parsedAddress.street || "Current Location",
              city: parsedAddress.city,
              state: parsedAddress.state,
              country: parsedAddress.country,
              pincode: parsedAddress.pincode || "",
            };

            // Update the permanent address in formData
            const newPermanentAddress = {
              ...formData.permanentAddress,
              ...addressData
            };

            // Also update the correspondence address if "Same as Permanent" is checked
            const newCorrespondenceAddress = isSameAddress ?
              newPermanentAddress :
              formData.correspondenceAddress;

            // Update form data
            setFormData(prev => ({
              ...prev,
              latitude: latitude,
              longitude: longitude,
              currentLocation: address,
              street: addressData.street,
              locality: addressData.city,
              pincode: addressData.pincode,
              buildingName: addressData.apartment,
              permanentAddress: newPermanentAddress,
              correspondenceAddress: newCorrespondenceAddress,
            }));

            setCurrentLocation({
              latitude: latitude,
              longitude: longitude,
              address: address
            });

            setSnackbarMessage("Location fetched and address fields populated!");
            setSnackbarSeverity("success");
            setSnackbarOpen(true);
          } catch (error) {
            console.error("Geocoding error:", error);
            setSnackbarMessage("Could not determine address details. Please fill manually.");
            setSnackbarSeverity("warning");
            setSnackbarOpen(true);
          } finally {
            setLocationLoading(false);
          }
        },
        (error) => {
          console.error("Location error:", error);
          setSnackbarMessage("Failed to get location. Please try again.");
          setSnackbarSeverity("error");
          setSnackbarOpen(true);
          setLocationLoading(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } catch (error) {
      console.error("Location fetch error:", error);
      setSnackbarMessage("Failed to fetch location. Please try again.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setLocationLoading(false);
    }
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

  const validateStep = (step: number): boolean => {
    let tempErrors: FormErrors = {};
    let isValid = true;

    if (step === 0) {
      // First Name validation
      if (!formData.firstName.trim()) {
        tempErrors.firstName = "First Name is required.";
        isValid = false;
      } else if (!nameRegex.test(formData.firstName)) {
        tempErrors.firstName = "First Name should contain only alphabets.";
        isValid = false;
      } else if (formData.firstName.length > MAX_NAME_LENGTH) {
        tempErrors.firstName = `First Name should be under ${MAX_NAME_LENGTH} characters.`;
        isValid = false;
      }

      // Last Name validation
      if (!formData.lastName.trim()) {
        tempErrors.lastName = "Last Name is required.";
        isValid = false;
      } else if (!nameRegex.test(formData.lastName)) {
        tempErrors.lastName = "Last Name should contain only alphabets.";
        isValid = false;
      } else if (formData.lastName.length > MAX_NAME_LENGTH) {
        tempErrors.lastName = `Last Name should be under ${MAX_NAME_LENGTH} characters.`;
        isValid = false;
      }

      // Gender validation
      if (!formData.gender) {
        tempErrors.gender = "Please select a gender.";
        isValid = false;
      } else {
        tempErrors.gender = ""; // Clear error when gender is selected
      }

      // Date of Birth validation
      if (!formData.dob) {
        tempErrors.dob = "Date of birth is required.";
        isValid = false;
      } else {
        const isValidAge = validateAge(formData.dob);
        if (!isValidAge) {
          tempErrors.dob = "You must be at least 18 years old.";
          isValid = false;
        }
      }

      // Email validation
      if (!formData.emailId.trim()) {
        tempErrors.emailId = "Email is required.";
        isValid = false;
      } else if (!emailIdRegex.test(formData.emailId)) {
        tempErrors.emailId = "Please enter a valid email address.";
        isValid = false;
      } else if (validationResults.email.error) {
        tempErrors.emailId = validationResults.email.error;
        isValid = false;
      }

      // Password validation
      if (!formData.password) {
        tempErrors.password = "Password is required.";
        isValid = false;
      } else if (!strongPasswordRegex.test(formData.password)) {
        tempErrors.password = "Password must contain at least 8 characters, including uppercase, lowercase, number and special character.";
        isValid = false;
      }

      // Confirm Password validation
      if (!formData.confirmPassword) {
        tempErrors.confirmPassword = "Please confirm your password.";
        isValid = false;
      } else if (formData.password !== formData.confirmPassword) {
        tempErrors.confirmPassword = "Passwords do not match.";
        isValid = false;
      }

      // Mobile Number validation
      if (!formData.mobileNo) {
        tempErrors.mobileNo = "Mobile number is required.";
        isValid = false;
      } else if (!phoneRegex.test(formData.mobileNo)) {
        tempErrors.mobileNo = "Please enter a valid 10-digit mobile number.";
        isValid = false;
      } else if (validationResults.mobile.error) {
        tempErrors.mobileNo = validationResults.mobile.error;
        isValid = false;
      }
      
      // Alternate Number validation (optional but if provided must be valid and not same as mobile)
      if (formData.AlternateNumber) {
        if (!phoneRegex.test(formData.AlternateNumber)) {
          tempErrors.AlternateNumber = "Please enter a valid 10-digit mobile number.";
          isValid = false;
        } else if (formData.AlternateNumber === formData.mobileNo) {
          tempErrors.AlternateNumber = "Alternate number cannot be the same as mobile number.";
          isValid = false;
        } else if (validationResults.alternate.error) {
          tempErrors.AlternateNumber = validationResults.alternate.error;
          isValid = false;
        }
      }
    }

    else if (step === 1) {
      // Validate permanent address
      if (!formData.permanentAddress.apartment.trim()) {
        if (!tempErrors.permanentAddress) tempErrors.permanentAddress = {};
        tempErrors.permanentAddress.apartment = "Apartment is required.";
        isValid = false;
      }
      if (!formData.permanentAddress.street.trim()) {
        if (!tempErrors.permanentAddress) tempErrors.permanentAddress = {};
        tempErrors.permanentAddress.street = "Street is required.";
        isValid = false;
      }
      if (!formData.permanentAddress.city.trim()) {
        if (!tempErrors.permanentAddress) tempErrors.permanentAddress = {};
        tempErrors.permanentAddress.city = "City is required.";
        isValid = false;
      }
      if (!formData.permanentAddress.state.trim()) {
        if (!tempErrors.permanentAddress) tempErrors.permanentAddress = {};
        tempErrors.permanentAddress.state = "State is required.";
        isValid = false;
      }
      if (!formData.permanentAddress.country.trim()) {
        if (!tempErrors.permanentAddress) tempErrors.permanentAddress = {};
        tempErrors.permanentAddress.country = "Country is required.";
        isValid = false;
      }
      if (!formData.permanentAddress.pincode) {
        if (!tempErrors.permanentAddress) tempErrors.permanentAddress = {};
        tempErrors.permanentAddress.pincode = "Pincode is required.";
        isValid = false;
      } else if (formData.permanentAddress.pincode.length !== 6) {
        if (!tempErrors.permanentAddress) tempErrors.permanentAddress = {};
        tempErrors.permanentAddress.pincode = "Pincode must be exactly 6 digits.";
        isValid = false;
      }

      // Validate correspondence address if not same as permanent
      if (!isSameAddress) {
        if (!formData.correspondenceAddress.apartment.trim()) {
          if (!tempErrors.correspondenceAddress) tempErrors.correspondenceAddress = {};
          tempErrors.correspondenceAddress.apartment = "Apartment is required.";
          isValid = false;
        }
        if (!formData.correspondenceAddress.street.trim()) {
          if (!tempErrors.correspondenceAddress) tempErrors.correspondenceAddress = {};
          tempErrors.correspondenceAddress.street = "Street is required.";
          isValid = false;
        }
        if (!formData.correspondenceAddress.city.trim()) {
          if (!tempErrors.correspondenceAddress) tempErrors.correspondenceAddress = {};
          tempErrors.correspondenceAddress.city = "City is required.";
          isValid = false;
        }
        if (!formData.correspondenceAddress.state.trim()) {
          if (!tempErrors.correspondenceAddress) tempErrors.correspondenceAddress = {};
          tempErrors.correspondenceAddress.state = "State is required.";
          isValid = false;
        }
        if (!formData.correspondenceAddress.country.trim()) {
          if (!tempErrors.correspondenceAddress) tempErrors.correspondenceAddress = {};
          tempErrors.correspondenceAddress.country = "Country is required.";
          isValid = false;
        }
        if (!formData.correspondenceAddress.pincode) {
          if (!tempErrors.correspondenceAddress) tempErrors.correspondenceAddress = {};
          tempErrors.correspondenceAddress.pincode = "Pincode is required.";
          isValid = false;
        } else if (formData.correspondenceAddress.pincode.length !== 6) {
          if (!tempErrors.correspondenceAddress) tempErrors.correspondenceAddress = {};
          tempErrors.correspondenceAddress.pincode = "Pincode must be exactly 6 digits.";
          isValid = false;
        }
      }
    }

    else if (step === 2) {
      if (!formData.housekeepingRole) {
        tempErrors.housekeepingRole = "Please select a service type.";
        isValid = false;
      }
      if (formData.housekeepingRole === "COOK" && !formData.cookingSpeciality) {
        tempErrors.cookingSpeciality = "Please select a speciality for the cook service.";
        isValid = false;
      }
      if (!formData.diet) {
        tempErrors.diet = "Please select diet.";
        isValid = false;
      }
      if (!formData.experience) {
        tempErrors.experience = "Please enter years of experience.";
        isValid = false;
      } else if (isNaN(Number(formData.experience)) || Number(formData.experience) < 0) {
        tempErrors.experience = "Please enter a valid experience in years.";
        isValid = false;
      }
    }

    else if (step === 3) {
      if (!formData.AADHAR) {
        tempErrors.kyc = "Aadhaar number is required.";
        isValid = false;
      } else if (!aadhaarRegex.test(formData.AADHAR)) {
        tempErrors.kyc = "Aadhaar number must be exactly 12 digits.";
        isValid = false;
      }
      if (!formData.documentImage) {
        tempErrors.documentImage = "Aadhaar document is required.";
        isValid = false;
      }
    }

    else if (step === 4) {
      if (!formData.keyFacts) {
        tempErrors.keyFacts = "You must agree to the Key Facts Document";
        isValid = false;
      }
      if (!formData.terms) {
        tempErrors.terms = "You must agree to the Terms and Conditions";
        isValid = false;
      }
      if (!formData.privacy) {
        tempErrors.privacy = "You must agree to the Privacy Policy";
        isValid = false;
      }
    }

    setErrors(tempErrors);
    
    return isValid;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => Math.min(prevStep + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    if (activeStep === 0) {
      onBackToLogin(true);
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (activeStep !== steps.length - 1) return;

    if (validateStep(activeStep)) {
      setIsSubmitting(true);
      try {
        let profilePicUrl = "";

        if (image) {
          try {
            const profileFormData = new FormData();

            profileFormData.append("image", {
              uri: image.uri,
              type: image.type || 'image/jpeg',
              name: image.name || 'profile.jpg'
            } as any);

            const imageResponse = await axios.post(
              "http://65.2.153.173:3000/upload",
              profileFormData,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              }
            );

            if (imageResponse.status === 200) {
              profilePicUrl = imageResponse.data.imageUrl;
            }
          } catch (error) {
            console.error("Error uploading profile image:", error);
            setSnackbarMessage("Failed to upload profile image. Proceeding without it.");
            setSnackbarSeverity("warning");
            setSnackbarOpen(true);
          }
        }
        // Handle Aadhaar document upload
        let aadhaarDocUrl = "";
        if (formData.documentImage) {
          try {
            const aadhaarFormData = new FormData();

            // Create the file object properly
            aadhaarFormData.append("image", {
              uri: formData.documentImage.uri,
              type: formData.documentImage.type || 'image/jpeg',
              name: formData.documentImage.name || 'document.jpg'
            } as any);

            const docResponse = await axios.post(
              "http://65.2.153.173:3000/upload",
              aadhaarFormData,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              }
            );

            if (docResponse.status === 200) {
              aadhaarDocUrl = docResponse.data.imageUrl;
            }
          } catch (error) {
            console.error("Error uploading document image:", error);
            setSnackbarMessage("Failed to upload Aadhaar document. Please try again.");
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
            setIsSubmitting(false);
            return;
          }
        }
        const payload = {
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName,
          mobileNo: parseInt(formData.mobileNo) || 0,
          alternateNo: parseInt(formData.AlternateNumber) || 0,
          emailId: formData.emailId,
          gender: formData.gender,
          buildingName: formData.buildingName,
          locality: formData.locality,
          latitude: currentLocation?.latitude || formData.latitude,
          longitude: currentLocation?.longitude || formData.longitude,
          street: formData.street,
          pincode: parseInt(formData.pincode) || 0,
          currentLocation: formData.currentLocation,
          nearbyLocation: formData.nearbyLocation,
          location: formData.currentLocation,
          housekeepingRole: formData.housekeepingRole,
          diet: formData.diet,
          ...(formData.housekeepingRole === "COOK" && {
            cookingSpeciality: formData.cookingSpeciality
          }),
          timeslot: formData.timeslot,
          expectedSalary: 0,
          experience: parseInt(formData.experience) || 0,
          username: formData.emailId,
          password: formData.password,
          privacy: formData.privacy,
          keyFacts: formData.keyFacts,
          permanentAddress: {
            field1: formData.permanentAddress.apartment,
            field2: formData.permanentAddress.street,
            ctArea: formData.permanentAddress.city,
            pinNo: formData.permanentAddress.pincode,
            state: formData.permanentAddress.state,
            country: formData.permanentAddress.country
          },
          correspondenceAddress: {
            field1: formData.correspondenceAddress.apartment,
            field2: formData.correspondenceAddress.street,
            ctArea: formData.correspondenceAddress.city,
            pinNo: formData.correspondenceAddress.pincode,
            state: formData.correspondenceAddress.state,
            country: formData.correspondenceAddress.country
          },
          active: true,
          kyc: formData.kyc,
          aadhaarNumber: formData.AADHAR,
          aadhaarDocumentUrl: aadhaarDocUrl,
          dob: formData.dob,
          profilePic: profilePicUrl
        };

        const response = await axiosInstance.post(
          "/api/serviceproviders/serviceprovider/add",
          payload,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        setSnackbarOpen(true);
        setSnackbarSeverity("success");
        setSnackbarMessage("Service provider added successfully!");

        const authPayload = {
          email: formData.emailId,
          password: formData.password,
          name: `${formData.firstName} ${formData.lastName}`,
        };

        axios.post('https://utils-ndt3.onrender.com/authO/create-autho-user', authPayload)
          .then((authResponse) => {
            console.log("AuthO user created successfully:", authResponse.data);
          }).catch((authError) => {
            console.error("Error creating AuthO user:", authError);
          });

        setTimeout(() => {
          setIsSubmitting(false);
          if (onRegistrationSuccess) {
            onRegistrationSuccess();
          } else {
            onBackToLogin(true);
          }
        }, 3000);
      } catch (error) {
        setIsSubmitting(false);
        setSnackbarOpen(true);
        setSnackbarSeverity("error");
        setSnackbarMessage("Failed to add service provider. Please try again.");
        console.error("Error submitting form:", error);
      }
    } else {
      setIsSubmitting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const validateAge = (dob: string) => {
    if (!dob) return false;

    const birthDate = moment(dob, "YYYY-MM-DD");
    const today = moment();
    const age = today.diff(birthDate, "years");

    return age >= 18;
  };

  const handleTermsChange = useCallback((allAccepted: boolean) => {
    setFormData(prev => ({
      ...prev,
      keyFacts: allAccepted,
      terms: allAccepted,
      privacy: allAccepted,
    }));
  }, []);

  // Function to format display time
  const formatDisplayTime = (value: number) => {
    const hour = Math.floor(value);
    const minutes = value % 1 === 0.5 ? "30" : "00";
    const formattedHour = hour < 10 ? `0${hour}` : `${hour}`;
    return `${formattedHour}:${minutes}`;
  };

  // Function to update form time slot
  const updateFormTimeSlot = (
    morningRange: number[],
    eveningRange: number[]
  ) => {
    const startMorning = formatDisplayTime(morningRange[0]);
    const endMorning = formatDisplayTime(morningRange[1]);
    const startEvening = formatDisplayTime(eveningRange[0]);
    const endEvening = formatDisplayTime(eveningRange[1]);

    const formattedTimeSlot = `${startMorning}-${endMorning}, ${startEvening}-${endEvening}`;
    setFormData((prev) => ({ ...prev, timeslot: formattedTimeSlot }));
  };

  // Handle service type change
  const handleServiceTypeChange = (value: string) => {
    handleChange("housekeepingRole", value);
    setIsCookSelected(value === "COOK");
  };

  // Handle diet change
  const handledietChange = (value: string) => {
    handleChange("diet", value);
  };

  // Handle experience change
  const handleExperienceChange = (value: string) => {
    handleChange("experience", value);
  };

  // COMPLETELY REWRITTEN renderStepper function for proper display
  const renderStepper = () => {
    return (
      <View style={styles.stepperContainer}>
        {steps.map((step, index) => (
          <View key={index} style={styles.stepWrapper}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  index < activeStep && styles.completedStep,
                  index === activeStep && styles.activeStep,
                  index > activeStep && styles.inactiveStep,
                ]}
              >
                {index < activeStep ? (
                  <Icon name="check" size={16} color="#fff" />
                ) : (
                  <Text style={styles.stepNumber}>{index + 1}</Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  index <= activeStep ? styles.activeLabel : styles.inactiveLabel,
                ]}
                numberOfLines={2}
              >
                {step}
              </Text>
            </View>
            {index < steps.length - 1 && (
              <View
                style={[
                  styles.stepConnector,
                  index < activeStep ? styles.activeConnector : styles.inactiveConnector,
                ]}
              />
            )}
          </View>
        ))}
      </View>
    );
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.profileImageContainer}>
              <ProfileImageUpload onImageSelect={handleImageSelect} />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={[styles.input, errors.firstName && styles.inputError]}
                placeholder="First Name"
                placeholderTextColor="#999"
                value={formData.firstName}
                onChangeText={(value) => handleRealTimeValidation("firstName", value)}
                maxLength={MAX_NAME_LENGTH}
              />
              {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Middle Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Middle Name"
                placeholderTextColor="#999"
                value={formData.middleName}
                onChangeText={(value) => handleChange("middleName", value)}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={[styles.input, errors.lastName && styles.inputError]}
                placeholder="Last Name"
                placeholderTextColor="#999"
                value={formData.lastName}
                onChangeText={(value) => handleRealTimeValidation("lastName", value)}
                maxLength={MAX_NAME_LENGTH}
              />
              {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Date of Birth *</Text>
              <TouchableOpacity
                style={[styles.datePickerButton, errors.dob && styles.inputError]}
                onPress={handleDatePress}
              >
                <Text style={formData.dob ? styles.datePickerText : styles.datePickerPlaceholder}>
                  {formData.dob ? moment(formData.dob).format("DD/MM/YYYY") : "Select Date of Birth"}
                </Text>
                <Icon name="calendar-today" size={20} color="#1976d2" />
              </TouchableOpacity>
              {errors.dob && <Text style={styles.errorText}>{errors.dob}</Text>}

              {showDatePicker && (
                <DateTimePicker
                  testID="dateTimePicker"
                  value={selectedDate || new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  maximumDate={new Date()}
                />
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Gender *</Text>
              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => handleChange("gender", "MALE")}
                >
                  <View style={styles.radioCircle}>
                    {formData.gender === "MALE" && <View style={styles.selectedRb} />}
                  </View>
                  <Text style={styles.radioLabel}>Male</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => handleChange("gender", "FEMALE")}
                >
                  <View style={styles.radioCircle}>
                    {formData.gender === "FEMALE" && <View style={styles.selectedRb} />}
                  </View>
                  <Text style={styles.radioLabel}>Female</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => handleChange("gender", "OTHER")}
                >
                  <View style={styles.radioCircle}>
                    {formData.gender === "OTHER" && <View style={styles.selectedRb} />}
                  </View>
                  <Text style={styles.radioLabel}>Other</Text>
                </TouchableOpacity>
              </View>
              {errors.gender && <Text style={styles.errorText}>{errors.gender}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email *</Text>
              <View style={[styles.inputWithIcon, errors.emailId && styles.inputError]}>
                <TextInput
                  style={styles.inputFlex}
                  placeholder="Email"
                  placeholderTextColor="#999"
                  value={formData.emailId}
                  onChangeText={(value) => handleRealTimeValidation("emailId", value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {validationResults.email.loading ? (
                  <ActivityIndicator size="small" />
                ) : validationResults.email.isAvailable ? (
                  <Icon name="check-circle" size={24} color="green" />
                ) : validationResults.email.isAvailable === false ? (
                  <TouchableOpacity onPress={handleClearEmail}>
                    <Icon name="close" size={24} color="red" />
                  </TouchableOpacity>
                ) : null}
              </View>
              {(errors.emailId || validationResults.email.error) && (
                <Text style={styles.errorText}>
                  {errors.emailId || validationResults.email.error}
                </Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password *</Text>
              <View style={[styles.inputWithIcon, errors.password && styles.inputError]}>
                <TextInput
                  style={styles.inputFlex}
                  placeholder="Password"
                  placeholderTextColor="#999"
                  value={formData.password}
                  onChangeText={(value) => handleRealTimeValidation("password", value)}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={handleTogglePasswordVisibility}>
                  <Icon name={showPassword ? "visibility" : "visibility-off"} size={24} color="#333" />
                </TouchableOpacity>
              </View>
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password *</Text>
              <View style={[styles.inputWithIcon, errors.confirmPassword && styles.inputError]}>
                <TextInput
                  style={styles.inputFlex}
                  placeholder="Confirm Password"
                  placeholderTextColor="#999"
                  value={formData.confirmPassword}
                  onChangeText={(value) => handleRealTimeValidation("confirmPassword", value)}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity onPress={handleToggleConfirmPasswordVisibility}>
                  <Icon name={showConfirmPassword ? "visibility" : "visibility-off"} size={24} color="#333" />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword && (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Mobile Number *</Text>
              <View style={[styles.inputWithIcon, errors.mobileNo && styles.inputError]}>
                <TextInput
                  style={styles.inputFlex}
                  placeholder="Mobile Number"
                  placeholderTextColor="#999"
                  value={formData.mobileNo}
                  onChangeText={(value) => handleRealTimeValidation("mobileNo", value)}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                {validationResults.mobile.loading ? (
                  <ActivityIndicator size="small" />
                ) : validationResults.mobile.isAvailable ? (
                  <Icon name="check-circle" size={24} color="green" />
                ) : validationResults.mobile.isAvailable === false ? (
                  <TouchableOpacity onPress={handleClearMobile}>
                    <Icon name="close" size={24} color="red" />
                  </TouchableOpacity>
                ) : null}
              </View>
              {(errors.mobileNo || validationResults.mobile.error) && (
                <Text style={styles.errorText}>
                  {errors.mobileNo || validationResults.mobile.error}
                </Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Alternate Number</Text>
              <View style={[styles.inputWithIcon, (errors.AlternateNumber || validationResults.alternate.isAvailable === false) && styles.inputError]}>
                <TextInput
                  style={styles.inputFlex}
                  placeholder="Alternate Number"
                  placeholderTextColor="#999"
                  value={formData.AlternateNumber}
                  onChangeText={(value) => handleRealTimeValidation("AlternateNumber", value)}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
                {validationResults.alternate.loading ? (
                  <ActivityIndicator size="small" />
                ) : validationResults.alternate.isAvailable ? (
                  <Icon name="check-circle" size={24} color="green" />
                ) : validationResults.alternate.isAvailable === false ? (
                  <TouchableOpacity onPress={handleClearAlternate}>
                    <Icon name="close" size={24} color="red" />
                  </TouchableOpacity>
                ) : null}
              </View>
              {(errors.AlternateNumber || validationResults.alternate.error) && (
                <Text style={styles.errorText}>
                  {errors.AlternateNumber || validationResults.alternate.error}
                </Text>
              )}
            </View>
          </ScrollView>
        );

      case 1:
        return (
          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            <AddressComponent
              onAddressChange={handleAddressChange}
              permanentAddress={formData.permanentAddress}
              correspondenceAddress={formData.correspondenceAddress}
              errors={{
                permanent: errors.permanentAddress,
                correspondence: errors.correspondenceAddress
              }}
              onSameAddressToggle={handleSameAddressToggle}
              isSameAddress={isSameAddress}
            />

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Icon name="location-on" size={24} color="#1976d2" />
                <Text style={styles.cardTitle}>Current Location</Text>
              </View>
              <Text style={styles.cardSubtitle}>
                Fetch your current location to automatically fill address fields
              </Text>

              <TouchableOpacity
                style={[styles.locationButton, locationLoading && styles.buttonDisabled]}
                onPress={fetchLocationData}
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon name="my-location" size={20} color="#fff" />
                    <Text style={styles.buttonText}>Fetch Location</Text>
                  </>
                )}
              </TouchableOpacity>

              {(formData.latitude !== 0 || formData.longitude !== 0) && (
                <>
                  <View style={styles.locationInfo}>
                    <Icon name="check-circle" size={20} color="green" />
                    <Text style={styles.locationText}>
                      <Text style={{ fontWeight: 'bold' }}>Location found:</Text>
                      Lat: {formData.latitude.toFixed(6)},
                      Lng: {formData.longitude.toFixed(6)}
                    </Text>
                  </View>

                  <View style={styles.successAlert}>
                    <Text style={styles.alertText}>
                      <Text style={{ fontWeight: 'bold' }}>Address detected:</Text> {formData.currentLocation || "No address available"}
                    </Text>
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        );

      case 2:
        return (
          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Select Service Type *</Text>
              <View style={styles.dropdown}>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setModalVisible(true)}
                >
                  <Text style={styles.dropdownText}>
                    {formData.housekeepingRole || "Select Service Type"}
                  </Text>
                  <Icon name="arrow-drop-down" size={24} />
                </TouchableOpacity>
              </View>
              {errors.housekeepingRole && (
                <Text style={styles.errorText}>{errors.housekeepingRole}</Text>
              )}
            </View>

            <Modal
              visible={modalVisible}
              transparent={true}
              animationType="slide"
            >
              <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Select Service Type</Text>
                  {["COOK", "NANNY", "MAID"].map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={styles.modalOption}
                      onPress={() => {
                        handleServiceTypeChange(option);
                        setModalVisible(false);
                      }}
                    >
                      <Text style={styles.modalOptionText}>{option}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={styles.modalCloseButton}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.modalCloseText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>

            {isCookSelected && (
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Cooking Speciality *</Text>
                <View style={styles.radioGroup}>
                  {["VEG", "NONVEG", "BOTH"].map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={styles.radioOption}
                      onPress={() => handleCookingSpecialityChange(option)}
                    >
                      <View style={styles.radioCircle}>
                        {formData.cookingSpeciality === option && (
                          <View style={styles.selectedRb} />
                        )}
                      </View>
                      <Text style={styles.radioLabel}>
                        {option === "VEG" ? "Veg" : option === "NONVEG" ? "Non-Veg" : "Both"}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                {errors.cookingSpeciality && (
                  <Text style={styles.errorText}>{errors.cookingSpeciality}</Text>
                )}
              </View>
            )}

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Diet *</Text>
              <View style={styles.radioGroup}>
                {["VEG", "NONVEG", "BOTH"].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={styles.radioOption}
                    onPress={() => handledietChange(option)}
                  >
                    <View style={styles.radioCircle}>
                      {formData.diet === option && <View style={styles.selectedRb} />}
                    </View>
                    <Text style={styles.radioLabel}>
                      {option === "VEG" ? "Veg" : option === "NONVEG" ? "Non-Veg" : "Both"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.diet && <Text style={styles.errorText}>{errors.diet}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description about your services"
                placeholderTextColor="#999"
                value={formData.description}
                onChangeText={(value) => handleChange("description", value)}
                multiline
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Experience *</Text>
              <TextInput
                style={[styles.input, errors.experience && styles.inputError]}
                placeholder="Years of experience"
                placeholderTextColor="#999"
                value={formData.experience}
                onChangeText={(value) => handleExperienceChange(value)}
                keyboardType="numeric"
              />
              {errors.experience && (
                <Text style={styles.errorText}>{errors.experience}</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Referral Code (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Referral Code"
                placeholderTextColor="#999"
                value={formData.referralCode || ""}
                onChangeText={(value) => handleChange("referralCode", value)}
              />
            </View>

            {/* Time Slot Selection Section */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Select Time Slot</Text>

              {/* Full Time Availability Checkbox - Using TouchableOpacity as checkbox */}
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => {
                  const newValue = formData.timeslot !== "06:00-20:00";
                  if (newValue) {
                    handleChange("timeslot", "06:00-20:00");
                    setSliderDisabled(true);
                  } else {
                    handleChange("timeslot", "");
                    setSliderDisabled(false);
                  }
                }}
              >
                <View style={[styles.checkboxBox, formData.timeslot === "06:00-20:00" && styles.checkboxChecked]}>
                  {formData.timeslot === "06:00-20:00" && (
                    <Icon name="check" size={16} color="#fff" />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>
                  Choose Full Time Availability (6:00 AM - 8:00 PM)
                </Text>
              </TouchableOpacity>

              {/* Morning Slider */}
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderTitle}>Morning (6:00 AM - 12:00 PM)</Text>
                <View style={styles.sliderRow}>
                  <Text style={styles.sliderTimeLabel}>
                    {formatDisplayTime(sliderValueMorning[0])}
                  </Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={6}
                    maximumValue={12}
                    step={0.5}
                    value={sliderValueMorning[0]}
                    onValueChange={(value) => {
                      const newValues = [value, sliderValueMorning[1]];
                      setSliderValueMorning(newValues);
                      updateFormTimeSlot(newValues, sliderValueEvening);
                    }}
                    minimumTrackTintColor={sliderDisabled ? "#bdbdbd" : "#1976d2"}
                    maximumTrackTintColor="#e0e0e0"
                    thumbTintColor={sliderDisabled ? "#9e9e9e" : "#1976d2"}
                    disabled={sliderDisabled}
                  />
                </View>
                <View style={styles.sliderRow}>
                  <Text style={styles.sliderTimeLabel}>
                    {formatDisplayTime(sliderValueMorning[1])}
                  </Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={6}
                    maximumValue={12}
                    step={0.5}
                    value={sliderValueMorning[1]}
                    onValueChange={(value) => {
                      const newValues = [sliderValueMorning[0], value];
                      setSliderValueMorning(newValues);
                      updateFormTimeSlot(newValues, sliderValueEvening);
                    }}
                    minimumTrackTintColor={sliderDisabled ? "#bdbdbd" : "#1976d2"}
                    maximumTrackTintColor="#e0e0e0"
                    thumbTintColor={sliderDisabled ? "#9e9e9e" : "#1976d2"}
                    disabled={sliderDisabled}
                  />
                </View>
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabel}>6:00 AM</Text>
                  <Text style={styles.sliderLabel}>12:00 PM</Text>
                </View>
                <Text style={styles.sliderValue}>
                  Selected: {formatDisplayTime(sliderValueMorning[0])} - {formatDisplayTime(sliderValueMorning[1])}
                </Text>
              </View>

              {/* Evening Slider */}
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderTitle}>Evening (12:00 PM - 8:00 PM)</Text>
                <View style={styles.sliderRow}>
                  <Text style={styles.sliderTimeLabel}>
                    {formatDisplayTime(sliderValueEvening[0])}
                  </Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={12}
                    maximumValue={20}
                    step={0.5}
                    value={sliderValueEvening[0]}
                    onValueChange={(value) => {
                      const newValues = [value, sliderValueEvening[1]];
                      setSliderValueEvening(newValues);
                      updateFormTimeSlot(sliderValueMorning, newValues);
                    }}
                    minimumTrackTintColor={sliderDisabled ? "#bdbdbd" : "#1976d2"}
                    maximumTrackTintColor="#e0e0e0"
                    thumbTintColor={sliderDisabled ? "#9e9e9e" : "#1976d2"}
                    disabled={sliderDisabled}
                  />
                </View>
                <View style={styles.sliderRow}>
                  <Text style={styles.sliderTimeLabel}>
                    {formatDisplayTime(sliderValueEvening[1])}
                  </Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={12}
                    maximumValue={20}
                    step={0.5}
                    value={sliderValueEvening[1]}
                    onValueChange={(value) => {
                      const newValues = [sliderValueEvening[0], value];
                      setSliderValueEvening(newValues);
                      updateFormTimeSlot(sliderValueMorning, newValues);
                    }}
                    minimumTrackTintColor={sliderDisabled ? "#bdbdbd" : "#1976d2"}
                    maximumTrackTintColor="#e0e0e0"
                    thumbTintColor={sliderDisabled ? "#9e9e9e" : "#1976d2"}
                    disabled={sliderDisabled}
                  />
                </View>
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabel}>12:00 PM</Text>
                  <Text style={styles.sliderLabel}>8:00 PM</Text>
                </View>
                <Text style={styles.sliderValue}>
                  Selected: {formatDisplayTime(sliderValueEvening[0])} - {formatDisplayTime(sliderValueEvening[1])}
                </Text>
              </View>

              {/* Current Time Slot Display */}
              <View style={styles.timeSlotDisplay}>
                <Text style={styles.timeSlotTitle}>Selected Time Slot:</Text>
                <Text style={styles.timeSlotValue}>{formData.timeslot}</Text>
              </View>
            </View>
          </ScrollView>
        );

      case 3:
        return (
          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Aadhaar Number *</Text>
              <TextInput
                style={[styles.input, errors.kyc && styles.inputError]}
                placeholder="12-digit Aadhaar Number"
                placeholderTextColor="#999"
                value={formData.AADHAR || ""}
                onChangeText={(value) => handleRealTimeValidation("AADHAR", value)}
                keyboardType="numeric"
                maxLength={12}
              />
              {errors.kyc && <Text style={styles.errorText}>{errors.kyc}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Upload Aadhaar Document *</Text>
              <CustomFileInput
                name="documentImage"
                accept="image/*"
                required
                value={formData.documentImage}
                onChange={(file) => handleChange("documentImage", file)}
                buttonText="Upload Aadhaar Document"
              />
              {errors.documentImage && <Text style={styles.errorText}>{errors.documentImage}</Text>}
            </View>
          </ScrollView>
        );

      case 4:
        return (
          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.confirmationText}>
              Please agree to the following before proceeding with your Registration:
            </Text>

            <TermsCheckboxes 
              onChange={handleTermsChange} 
              onLinkPress={handleOpenPolicy}
              initialValues={{
                keyFacts: formData.keyFacts,
                terms: formData.terms,
                privacy: formData.privacy
              }}
            />
            {errors.keyFacts && <Text style={styles.errorText}>{errors.keyFacts}</Text>}
            {errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}
            {errors.privacy && <Text style={styles.errorText}>{errors.privacy}</Text>}
          </ScrollView>
        );

      default:
        return <Text>Unknown step</Text>;
    }
  };

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent={false}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Service Provider Registration</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => onBackToLogin(true)}
          >
            <Icon name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderStepper()}
          {renderStepContent(activeStep)}

          <View style={styles.buttonContainer}>
            <Button
              variant="outline"
              size="medium"
              onPress={handleBack}
              disabled={activeStep === 0 || isSubmitting}
              startIcon={<Icon name="arrow-back" size={20} color="#1d4ed8" />}
            >
              Back
            </Button>

            {activeStep === steps.length - 1 ? (
              <Button
                variant="primary"
                size="medium"
                onPress={handleSubmit}
                disabled={!(formData.terms && formData.privacy && formData.keyFacts) || isSubmitting}
                loading={isSubmitting}
              >
                Submit
              </Button>
            ) : (
              <Button
                variant="primary"
                size="medium"
                onPress={handleNext}
                disabled={isSubmitting}
                endIcon={<Icon name="arrow-forward" size={20} color="#fff" />}
              >
                Next
              </Button>
            )}
          </View>
        </ScrollView>

        {/* Policy Modal */}
        <Modal
          visible={policyModalVisible}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setPolicyModalVisible(false)}
        >
          <View style={styles.policyModalContainer}>
            <View style={styles.policyModalHeader}>
              <Text style={styles.policyModalTitle}>
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
            </View>
            <View style={styles.policyModalContent}>
              {renderPolicyContent()}
            </View>
          </View>
        </Modal>

        {snackbarOpen && (
          <View style={[styles.snackbar, styles[`snackbar${snackbarSeverity}`]]}>
            <Text style={styles.snackbarText}>{snackbarMessage}</Text>
            <TouchableOpacity onPress={handleCloseSnackbar}>
              <Icon name="close" size={20} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#1976d2',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  stepWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepItem: {
    alignItems: 'center',
    width: 70,
  },
  stepCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  completedStep: {
    backgroundColor: '#4caf50',
  },
  activeStep: {
    backgroundColor: '#1976d2',
  },
  inactiveStep: {
    backgroundColor: '#e0e0e0',
  },
  stepNumber: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  stepLabel: {
    fontSize: 10,
    textAlign: 'center',
    fontWeight: '500',
    width: 70,
  },
  activeLabel: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
  inactiveLabel: {
    color: '#757575',
  },
  stepConnector: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
    alignSelf: 'center',
    marginTop: -16,
  },
  activeConnector: {
    backgroundColor: '#1976d2',
  },
  inactiveConnector: {
    backgroundColor: '#e0e0e0',
  },
  profileImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#333',
  },
  inputFlex: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 12,
  },
  inputError: {
    borderColor: '#f44336',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginTop: 4,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  radioCircle: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#1976d2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  selectedRb: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1976d2',
  },
  radioLabel: {
    fontSize: 16,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#333',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  locationButton: {
    backgroundColor: '#1976d2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 8,
  },
  locationText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  successAlert: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  alertText: {
    color: '#155724',
    fontSize: 14,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  modalOption: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#333',
  },
  modalCloseButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    color: '#1976d2',
    fontSize: 16,
  },
  confirmationText: {
    fontSize: 16,
    marginBottom: 16,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 20,
  },
  snackbar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  snackbarsuccess: {
    backgroundColor: '#4caf50',
  },
  snackbarerror: {
    backgroundColor: '#f44336',
  },
  snackbarwarning: {
    backgroundColor: '#ff9800',
  },
  snackbarinfo: {
    backgroundColor: '#2196f3',
  },
  snackbarText: {
    color: 'white',
    fontSize: 14,
    flex: 1,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#1976d2',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#1976d2',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  sliderContainer: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sliderTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
    color: '#333',
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sliderTimeLabel: {
    width: 60,
    fontSize: 14,
    fontWeight: '500',
    color: '#1976d2',
    textAlign: 'center',
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#666',
  },
  sliderValue: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 8,
    color: '#1976d2',
  },
  timeSlotDisplay: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#e8f4fd',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbdefb',
  },
  timeSlotTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    color: '#1976d2',
  },
  timeSlotValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  datePickerText: {
    fontSize: 16,
    color: '#333',
  },
  datePickerPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  // Policy Modal Styles
  policyModalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  policyModalHeader: {
    backgroundColor: '#1976d2',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  policyModalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  policyModalClose: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  policyModalContent: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

export default ServiceProviderRegistration;