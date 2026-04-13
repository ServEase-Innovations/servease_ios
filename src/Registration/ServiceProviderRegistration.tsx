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
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import axios from "axios";
import LinearGradient from 'react-native-linear-gradient';
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
import { useTheme } from "../../src/Settings/ThemeContext";

// Import the new components
import BasicInformation from "./BasicInformation";
import ServiceDetails from "./ServiceDetails";
import KYCVerification from "./KYCVerification";
import BankDetails, { BankDetailsData, BankDetailsErrors } from "./BankDetails";
import providerInstance from "../services/providerInstance";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

// Regex for validation
const nameRegex = /^[A-Za-z]+(?:[ ][A-Za-z]+)*$/;
const emailIdRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Z|a-z]{2,}$/;
const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
const phoneRegex = /^[0-9]{10}$/;
const pincodeRegex = /^[0-9]{6}$/;
const aadhaarRegex = /^[0-9]{12}$/;
const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const drivingLicenseRegex = /^[A-Z]{2}[0-9]{2}[0-9]{4,11}$/;
const voterIdRegex = /^[A-Z]{3}[0-9]{7}$/;
const passportRegex = /^[A-Z]{1}[0-9]{7}$/;
const MAX_NAME_LENGTH = 30;

// Steps with Bank Details added
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
  onBackToLogin, onRegistrationSuccess,
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
  const [isDobValid, setIsDobValid] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Add selectedLanguages state
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  
  // New state variables for multi-slot time selection
  const [morningSlots, setMorningSlots] = useState<number[][]>([[6, 12]]);
  const [eveningSlots, setEveningSlots] = useState<number[][]>([[12, 20]]);
  const [isFullTime, setIsFullTime] = useState(true);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string>("06:00-20:00");

  // Policy modal states
  const [policyModalVisible, setPolicyModalVisible] = useState(false);
  const [activePolicy, setActivePolicy] = useState<'terms' | 'privacy' | 'keyfacts'>('terms');

  // Date Picker State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // State to track if next button should be disabled
  const [isNextDisabled, setIsNextDisabled] = useState(true);

  // Bank Details State
  const [bankDetails, setBankDetails] = useState<BankDetailsData>({
    bankName: "",
    ifscCode: "",
    accountHolderName: "",
    accountNumber: "",
    accountType: "",
    upiId: "",
  });
  const [bankDetailsErrors, setBankDetailsErrors] = useState<BankDetailsErrors>({});

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

  // Initialize Geocoder
  useEffect(() => {
    Geocoder.init(keys.api_key);
  }, []);

  // Cleanup snackbar timeout on unmount
  useEffect(() => {
    return () => {
      if (snackbarTimeout) {
        clearTimeout(snackbarTimeout);
      }
    };
  }, [snackbarTimeout]);

  // Show snackbar with auto-dismiss
  const showSnackbar = (message: string, severity: "success" | "error" | "warning" | "info") => {
    if (snackbarTimeout) {
      clearTimeout(snackbarTimeout);
      setSnackbarTimeout(null);
    }
    
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
    
    const timeout = setTimeout(() => {
      setSnackbarOpen(false);
      setSnackbarTimeout(null);
    }, 3000);
    
    setSnackbarTimeout(timeout);
  };

  useEffect(() => {
    const requestInterceptor = axiosInstance.interceptors.request.use(
      (config) => {
        console.log('Request:', {
          url: config.url,
          method: config.method,
          data: config.data,
          headers: config.headers
        });
        return config;
      },
      (error) => {
        console.error('Request Error:', error);
        return Promise.reject(error);
      }
    );

    const responseInterceptor = axiosInstance.interceptors.response.use(
      (response) => {
        console.log('Response:', {
          status: response.status,
          data: response.data,
          headers: response.headers
        });
        return response;
      },
      (error) => {
        console.error('Response Error:', {
          message: error.message,
          response: error.response ? {
            status: error.response.status,
            data: error.response.data,
            headers: error.response.headers
          } : 'No response',
          request: error.request ? 'Request made' : 'No request'
        });
        return Promise.reject(error);
      }
    );

    return () => {
      axiosInstance.interceptors.request.eject(requestInterceptor);
      axiosInstance.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const { validationResults, validateField, resetValidation } = useFieldValidation();

  const checkStepCompletion = useCallback(() => {
    let isComplete = false;
    
    switch(activeStep) {
      case 0:
        isComplete = formData.firstName.trim() !== "" &&
                     formData.lastName.trim() !== "" &&
                     formData.gender !== "" &&
                     formData.emailId.trim() !== "" &&
                     formData.password.trim() !== "" &&
                     formData.confirmPassword.trim() !== "" &&
                     formData.mobileNo.trim() !== "" &&
                     formData.dob.trim() !== "" &&
                     !errors.firstName &&
                     !errors.lastName &&
                     !errors.gender &&
                     !errors.emailId &&
                     !errors.password &&
                     !errors.confirmPassword &&
                     !errors.mobileNo &&
                     !errors.dob &&
                     validationResults.email.isAvailable !== false &&
                     validationResults.mobile.isAvailable !== false;
        break;
        
      case 1:
        isComplete = formData.permanentAddress.apartment?.trim() !== "" &&
                     formData.permanentAddress.street?.trim() !== "" &&
                     formData.permanentAddress.city?.trim() !== "" &&
                     formData.permanentAddress.state?.trim() !== "" &&
                     formData.permanentAddress.country?.trim() !== "" &&
                     formData.permanentAddress.pincode?.trim() !== "" &&
                     formData.permanentAddress.pincode.length === 6 &&
                     (isSameAddress || (
                       formData.correspondenceAddress.apartment?.trim() !== "" &&
                       formData.correspondenceAddress.street?.trim() !== "" &&
                       formData.correspondenceAddress.city?.trim() !== "" &&
                       formData.correspondenceAddress.state?.trim() !== "" &&
                       formData.correspondenceAddress.country?.trim() !== "" &&
                       formData.correspondenceAddress.pincode?.trim() !== "" &&
                       formData.correspondenceAddress.pincode.length === 6
                     ));
        break;
        
      case 2:
        isComplete = formData.housekeepingRole.length > 0 &&
                     formData.diet !== "" &&
                     formData.experience !== "" &&
                     !isNaN(Number(formData.experience)) &&
                     Number(formData.experience) >= 0 &&
                     (!formData.housekeepingRole.includes("COOK") || formData.cookingSpeciality !== "") &&
                     (!formData.housekeepingRole.includes("NANNY") || formData.nannyCareType !== "");
        break;
        
      case 3:
        isComplete = formData.kycType !== "" &&
                     formData.kycNumber !== "" &&
                     formData.documentImage !== null;
        break;
        
      case 4:
        // Bank Details - Optional step, always complete
        isComplete = true;
        break;
        
      case 5:
        isComplete = formData.keyFacts && formData.terms && formData.privacy;
        break;
        
      default:
        isComplete = false;
    }
    
    setIsNextDisabled(!isComplete);
  }, [activeStep, formData, errors, validationResults, isSameAddress]);

  useEffect(() => {
    checkStepCompletion();
  }, [activeStep, formData, errors, validationResults, isSameAddress, checkStepCompletion]);

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

  const isRangeOverlapping = (range1: number[], range2: number[]): boolean => {
    return !(range1[1] <= range2[0] || range1[0] >= range2[1]);
  };

  const formatDisplayTime = (value: number): string => {
    const hour = Math.floor(value);
    const minute = Math.round((value - hour) * 60);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour;
    const displayHourFormatted = displayHour === 0 ? 12 : displayHour;
    const minuteFormatted = minute === 30 ? '30' : '00';
    return `${displayHourFormatted}:${minuteFormatted} ${period}`;
  };

  const formatTimeForStorage = (value: number): string => {
    const hour = Math.floor(value);
    const minute = value % 1 === 0.5 ? "30" : "00";
    const formattedHour = hour < 10 ? `0${hour}` : `${hour}`;
    return `${formattedHour}:${minute}`;
  };

  const updateSelectedTimeSlots = useCallback(() => {
    if (isFullTime) {
      setSelectedTimeSlots("Full Day (6:00 AM - 8:00 PM)");
      setFormData((prev) => ({ ...prev, timeslot: "06:00-20:00" }));
      return;
    }

    const morningSlotStrings = morningSlots.map(([start, end]) => 
      `${formatTimeForStorage(start)}-${formatTimeForStorage(end)}`
    );
    
    const eveningSlotStrings = eveningSlots.map(([start, end]) => 
      `${formatTimeForStorage(start)}-${formatTimeForStorage(end)}`
    );

    let displaySlots: string[] = [];
    let storageSlots: string[] = [];

    morningSlots.forEach(([start, end]) => {
      displaySlots.push(`${formatDisplayTime(start)} - ${formatDisplayTime(end)}`);
    });
    
    eveningSlots.forEach(([start, end]) => {
      displaySlots.push(`${formatDisplayTime(start)} - ${formatDisplayTime(end)}`);
    });

    morningSlotStrings.forEach(slot => storageSlots.push(slot));
    eveningSlotStrings.forEach(slot => storageSlots.push(slot));

    if (displaySlots.length > 0) {
      setSelectedTimeSlots(displaySlots.join(', '));
      setFormData((prev) => ({ ...prev, timeslot: storageSlots.join(', ') }));
    } else {
      setSelectedTimeSlots("No slots selected");
      setFormData((prev) => ({ ...prev, timeslot: '' }));
    }
  }, [isFullTime, morningSlots, eveningSlots]);

  useEffect(() => {
    updateSelectedTimeSlots();
  }, [morningSlots, eveningSlots, isFullTime, updateSelectedTimeSlots]);

  const handleAddMorningSlot = () => {
    setMorningSlots(prevSlots => {
      const existingRanges = prevSlots;
      let newStart = 6;
      let newEnd = 6.5;
      let foundAvailableSlot = false;

      for (let time = 6; time < 12; time += 0.5) {
        const potentialEnd = time + 0.5;
        const hasConflict = existingRanges.some(range => 
          isRangeOverlapping([time, potentialEnd], range)
        );
        
        if (!hasConflict) {
          newStart = time;
          newEnd = potentialEnd;
          foundAvailableSlot = true;
          break;
        }
      }

      if (!foundAvailableSlot) {
        for (let time = 6; time < 12; time += 0.5) {
          for (let endTime = time + 0.5; endTime <= 12; endTime += 0.5) {
            const hasConflict = existingRanges.some(range => 
              isRangeOverlapping([time, endTime], range)
            );
            
            if (!hasConflict) {
              newStart = time;
              newEnd = endTime;
              foundAvailableSlot = true;
              break;
            }
          }
          if (foundAvailableSlot) break;
        }
      }

      if (!foundAvailableSlot) {
        showSnackbar("No available morning slots to add", "warning");
        return prevSlots;
      }

      return [...prevSlots, [newStart, newEnd]];
    });
  };

  const handleRemoveMorningSlot = (index: number) => {
    const newSlots = morningSlots.filter((_, i) => i !== index);
    setMorningSlots(newSlots.length > 0 ? newSlots : []);
  };

  const handleAddEveningSlot = () => {
    setEveningSlots(prevSlots => {
      const existingRanges = prevSlots;
      let newStart = 12;
      let newEnd = 12.5;
      let foundAvailableSlot = false;

      for (let time = 12; time < 20; time += 0.5) {
        const potentialEnd = time + 0.5;
        const hasConflict = existingRanges.some(range => 
          isRangeOverlapping([time, potentialEnd], range)
        );
        
        if (!hasConflict) {
          newStart = time;
          newEnd = potentialEnd;
          foundAvailableSlot = true;
          break;
        }
      }

      if (!foundAvailableSlot) {
        for (let time = 12; time < 20; time += 0.5) {
          for (let endTime = time + 0.5; endTime <= 20; endTime += 0.5) {
            const hasConflict = existingRanges.some(range => 
              isRangeOverlapping([time, endTime], range)
            );
            
            if (!hasConflict) {
              newStart = time;
              newEnd = endTime;
              foundAvailableSlot = true;
              break;
            }
          }
          if (foundAvailableSlot) break;
        }
      }

      if (!foundAvailableSlot) {
        showSnackbar("No available evening slots to add", "warning");
        return prevSlots;
      }

      return [...prevSlots, [newStart, newEnd]];
    });
  };

  const handleRemoveEveningSlot = (index: number) => {
    const newSlots = eveningSlots.filter((_, i) => i !== index);
    setEveningSlots(newSlots.length > 0 ? newSlots : []);
  };

  const handleClearMorningSlots = () => {
    setMorningSlots([]);
  };

  const handleClearEveningSlots = () => {
    setEveningSlots([]);
  };

  const handleMorningSlotChange = (index: number, newValue: number[]) => {
    const updatedSlots = [...morningSlots];
    const otherSlots = updatedSlots.filter((_, i) => i !== index);
    
    const hasOverlap = otherSlots.some(slot => 
      isRangeOverlapping(newValue, slot)
    );
    
    if (!hasOverlap && newValue[0] <= newValue[1]) {
      updatedSlots[index] = newValue;
      setMorningSlots(updatedSlots);
    }
  };

  const handleEveningSlotChange = (index: number, newValue: number[]) => {
    const updatedSlots = [...eveningSlots];
    const otherSlots = updatedSlots.filter((_, i) => i !== index);
    
    const hasOverlap = otherSlots.some(slot => 
      isRangeOverlapping(newValue, slot)
    );
    
    if (!hasOverlap && newValue[0] <= newValue[1]) {
      updatedSlots[index] = newValue;
      setEveningSlots(updatedSlots);
    }
  };

  const handleFullTimeToggle = (checked: boolean) => {
    setIsFullTime(checked);
    if (checked) {
      setMorningSlots([[6, 12]]);
      setEveningSlots([[12, 20]]);
    }
  };

  const handleImageSelect = (file: RNFile | null) => {
    if (file) {
      setImage(file);
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

  const handleChange = (name: keyof FormData, value: string | boolean | RNFile | string[] | null) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleKycTypeChange = (kycType: string) => {
    setFormData(prev => ({ 
      ...prev, 
      kycType,
      kycNumber: ""
    }));
    setErrors(prev => ({ 
      ...prev, 
      kycType: "",
      kycNumber: "" 
    }));
  };

  const handleAgentReferralIdChange = (text: string) => {
    setFormData(prev => ({
      ...prev,
      agentReferralId: text
    }));
  };

  const getKycLabel = (kycType: string): string => {
    const labels: Record<string, string> = {
      "AADHAR": "Aadhaar",
      "PAN": "PAN",
      "DRIVING_LICENSE": "Driving License",
      "VOTER_ID": "Voter ID",
      "PASSPORT": "Passport"
    };
    return labels[kycType] || "KYC";
  };

  const handleDatePress = () => {
    setShowDatePicker(true);
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);

    if (date) {
      setSelectedDate(date);
      const formattedDate = moment(date).format("YYYY-MM-DD");
      setFormData((prev) => ({ ...prev, dob: formattedDate }));

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

  const handleAddressChange = async (type: 'permanent' | 'correspondence', data: any) => {
    const newFormData = {
      ...formData,
      [type === 'permanent' ? 'permanentAddress' : 'correspondenceAddress']: data
    };
    
    if (isSameAddress && type === 'permanent') {
      newFormData.correspondenceAddress = data;
    }
    
    setFormData(newFormData);

    if (type === 'permanent') {
      setErrors(prev => ({
        ...prev,
        permanentAddress: undefined
      }));
    } else if (!isSameAddress) {
      setErrors(prev => ({
        ...prev,
        correspondenceAddress: undefined
      }));
    }

    if (type === 'permanent' && isSameAddress) {
      setErrors(prev => ({
        ...prev,
        correspondenceAddress: undefined
      }));
    }

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
        showSnackbar("Error getting location coordinates", "warning");
      }
    }
    
    checkStepCompletion();
  };

  const handleSameAddressToggle = (checked: boolean) => {
    setIsSameAddress(checked);
    
    if (checked) {
      setFormData(prev => ({
        ...prev,
        correspondenceAddress: { ...prev.permanentAddress }
      }));
      
      setErrors(prev => ({
        ...prev,
        correspondenceAddress: undefined
      }));
    }
    
    checkStepCompletion();
  };

  const handleBankDetailsChange = (data: BankDetailsData) => {
    setBankDetails(data);
    checkStepCompletion();
  };

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

  // Fixed handleRealTimeValidation - accepts event object with target
  const handleRealTimeValidation = (e: any) => {
    const { name, value } = e.target;
    
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }

    if (name === "firstName") {
      const trimmedValue = value.trim();
      if (!trimmedValue) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          firstName: "First name is required",
        }));
      } else if (!nameRegex.test(trimmedValue)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          firstName: "First name should contain only letters",
        }));
      } else if (trimmedValue.length > MAX_NAME_LENGTH) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          firstName: `First name must be less than ${MAX_NAME_LENGTH} characters`,
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
          lastName: "Last name is required",
        }));
      } else if (!nameRegex.test(trimmedValue)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          lastName: "Last name should contain only letters",
        }));
      } else if (trimmedValue.length > MAX_NAME_LENGTH) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          lastName: `Last name must be less than ${MAX_NAME_LENGTH} characters`,
        }));
      } else {
        setErrors((prevErrors) => ({
          ...prevErrors,
          lastName: "",
        }));
      }
    }

    if (name === "middleName") {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
      return;
    }

    if (name === "password") {
      if (!value) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          password: "Password is required",
        }));
      } else if (value.length < 8) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          password: "Password must be at least 8 characters",
        }));
      } else if (!/[A-Z]/.test(value)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          password: "Password must contain at least one uppercase letter",
        }));
      } else if (!/[a-z]/.test(value)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          password: "Password must contain at least one lowercase letter",
        }));
      } else if (!/[0-9]/.test(value)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          password: "Password must contain at least one number",
        }));
      } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          password: "Password must contain at least one special character",
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
          confirmPassword: "Please confirm your password",
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
          emailId: "Email address is required",
        }));
        resetValidation('email');
      } else if (!emailPattern.test(trimmedValue)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          emailId: "Please enter a valid email address",
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
          mobileNo: "Mobile number is required",
        }));
        resetValidation('mobile');
      } else if (!mobilePattern.test(trimmedValue)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          mobileNo: "Please enter a valid 10-digit mobile number",
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
      
      if (trimmedValue === formData.mobileNo) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          AlternateNumber: "Alternate number cannot be same as mobile number",
        }));
        resetValidation('alternate');
      } else if (!mobilePattern.test(trimmedValue)) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          AlternateNumber: "Please enter a valid 10-digit number",
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

    if (name === "kycNumber") {
      const trimmedValue = value.trim();
      
      if (trimmedValue) {
        let isValid = true;
        let errorMessage = "";
        
        switch(formData.kycType) {
          case "AADHAR":
            isValid = /^[0-9]{12}$/.test(trimmedValue);
            errorMessage = "Aadhaar number must be 12 digits";
            break;
          case "PAN":
            isValid = panRegex.test(trimmedValue);
            errorMessage = "PAN number must be in format: ABCDE1234F";
            break;
          case "DRIVING_LICENSE":
            isValid = trimmedValue.length >= 8;
            errorMessage = "Please enter a valid driving license number";
            break;
          case "VOTER_ID":
            isValid = voterIdRegex.test(trimmedValue);
            errorMessage = "Voter ID must be in format: ABC1234567";
            break;
          case "PASSPORT":
            isValid = passportRegex.test(trimmedValue);
            errorMessage = "Passport number must be 8 characters (1 letter + 7 digits)";
            break;
        }
        
        if (!isValid) {
          setErrors(prev => ({ ...prev, kycNumber: errorMessage }));
        } else {
          setErrors(prev => ({ ...prev, kycNumber: "" }));
        }
      } else {
        setErrors(prev => ({ ...prev, kycNumber: `${getKycLabel(formData.kycType)} number is required` }));
      }
    }

    if (name === "gender") {
      setFormData((prevData) => ({
        ...prevData,
        [name]: value,
      }));
      if (errors.gender) {
        setErrors(prev => ({ ...prev, gender: "" }));
      }
      checkStepCompletion();
      return;
    }

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    
    checkStepCompletion();
  };

  // Service type handlers for React Native (receive string directly)
  const handleServiceTypeChange = (value: string) => {
    let updatedRoles: string[];
    
    if (formData.housekeepingRole.includes(value)) {
      updatedRoles = formData.housekeepingRole.filter(role => role !== value);
      if (value === "COOK") {
        setFormData(prev => ({ ...prev, cookingSpeciality: "" }));
      }
      if (value === "NANNY") {
        setFormData(prev => ({ ...prev, nannyCareType: "" }));
      }
    } else {
      updatedRoles = [...formData.housekeepingRole, value];
    }
    
    setFormData(prev => ({ ...prev, housekeepingRole: updatedRoles }));
    setIsCookSelected(updatedRoles.includes("COOK"));
    setIsNannySelected(updatedRoles.includes("NANNY"));
    
    if (updatedRoles.length > 0) {
      setErrors(prev => ({ ...prev, housekeepingRole: "" }));
    }
    
    checkStepCompletion();
  };

  const handleCookingSpecialityChange = (value: string) => {
    setFormData((prevData) => ({ ...prevData, cookingSpeciality: value }));
    setErrors(prevErrors => ({ ...prevErrors, cookingSpeciality: "" }));
    checkStepCompletion();
  };

  const handleNannyCareTypeChange = (value: string) => {
    setFormData(prev => ({ ...prev, nannyCareType: value }));
    setErrors(prev => ({ ...prev, nannyCareType: "" }));
    checkStepCompletion();
  };

  const handleDietChange = (value: string) => {
    setFormData((prevData) => ({ ...prevData, diet: value }));
    setErrors(prevErrors => ({ ...prevErrors, diet: "" }));
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

  const handleDocumentUpload = (file: RNFile | null) => {
    setFormData(prev => ({ ...prev, documentImage: file }));
    checkStepCompletion();
  };

  // Handle DOB change for BasicInformation
  const handleDobChange = (e: any) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, dob: value }));
    
    if (value) {
      const { isValid, message } = validateAge(value);
      setIsDobValid(isValid);
      if (!isValid) {
        setErrors(prev => ({ ...prev, dob: message }));
      } else {
        setErrors(prev => ({ ...prev, dob: "" }));
      }
    }
    
    checkStepCompletion();
  };

  const fetchLocationData = async () => {
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        Alert.alert(
          "Permission Required",
          "Location permission is required to fetch your current location.",
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
                if (!parsedAddress.apartment) {
                  parsedAddress.apartment = addressParts[0];
                }
                if (!parsedAddress.street && addressParts.length > 1) {
                  parsedAddress.street = addressParts[1];
                }
                if (!parsedAddress.city) {
                  for (let i = 1; i < addressParts.length - 2; i++) {
                    if (addressParts[i].match(/\d{6}/)) {
                      continue;
                    }
                    parsedAddress.city = addressParts[i];
                    break;
                  }
                }
              }
            }

            if (!parsedAddress.country) {
              parsedAddress.country = "India";
            }
            if (!parsedAddress.state) {
              parsedAddress.state = "Unknown";
            }
            if (!parsedAddress.city) {
              parsedAddress.city = "Unknown";
            }

            const addressData = {
              apartment: parsedAddress.apartment || "Current Location",
              street: parsedAddress.street || "Current Location",
              city: parsedAddress.city,
              state: parsedAddress.state,
              country: parsedAddress.country,
              pincode: parsedAddress.pincode || "",
            };

            const newPermanentAddress = {
              ...formData.permanentAddress,
              ...addressData
            };

            const newCorrespondenceAddress = isSameAddress ?
              newPermanentAddress :
              formData.correspondenceAddress;

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
          showSnackbar("Unable to fetch your location. Please check your GPS settings.", "error");
          setLocationLoading(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } catch (error) {
      console.error("Location fetch error:", error);
      showSnackbar("Unable to fetch your location. Please try again.", "error");
      setLocationLoading(false);
    }
  };

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
        if (!result.city) result.city = longName;
      } else if (types.includes('administrative_area_level_1')) {
        result.state = longName;
      } else if (types.includes('country')) {
        result.country = longName;
      } else if (types.includes('postal_code')) {
        result.pincode = longName;
      } else if (types.includes('sublocality_level_1') || types.includes('neighborhood')) {
        if (!result.street) result.street = longName;
      }
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

  const validateStep = (step: number): boolean => {
    let tempErrors: FormErrors = {};
    let isValid = true;

    if (step === 0) {
      if (!formData.firstName.trim()) {
        tempErrors.firstName = "First name is required";
        isValid = false;
      } else if (!nameRegex.test(formData.firstName)) {
        tempErrors.firstName = "First name should contain only letters";
        isValid = false;
      } else if (formData.firstName.length > MAX_NAME_LENGTH) {
        tempErrors.firstName = `First name must be less than ${MAX_NAME_LENGTH} characters`;
        isValid = false;
      }

      if (!formData.lastName.trim()) {
        tempErrors.lastName = "Last name is required";
        isValid = false;
      } else if (!nameRegex.test(formData.lastName)) {
        tempErrors.lastName = "Last name should contain only letters";
        isValid = false;
      } else if (formData.lastName.length > MAX_NAME_LENGTH) {
        tempErrors.lastName = `Last name must be less than ${MAX_NAME_LENGTH} characters`;
        isValid = false;
      }

      if (!formData.gender) {
        tempErrors.gender = "Gender is required";
        isValid = false;
      }
      
      if (!formData.emailId.trim()) {
        tempErrors.emailId = "Email address is required";
        isValid = false;
      } else if (!emailIdRegex.test(formData.emailId)) {
        tempErrors.emailId = "Please enter a valid email address";
        isValid = false;
      } else if (validationResults.email.error) {
        tempErrors.emailId = validationResults.email.error;
        isValid = false;
      } else if (!validationResults.email.isAvailable) {
        tempErrors.emailId = "Email is already registered";
        isValid = false;
      }
      
      if (!formData.password.trim()) {
        tempErrors.password = "Password is required";
        isValid = false;
      } else if (!strongPasswordRegex.test(formData.password)) {
        tempErrors.password = "Password must be at least 8 characters and include uppercase, lowercase, number and special character";
        isValid = false;
      }
      
      if (!formData.confirmPassword.trim()) {
        tempErrors.confirmPassword = "Please confirm your password";
        isValid = false;
      } else if (formData.password !== formData.confirmPassword) {
        tempErrors.confirmPassword = "Passwords do not match";
        isValid = false;
      }
      
      if (!formData.mobileNo.trim()) {
        tempErrors.mobileNo = "Mobile number is required";
        isValid = false;
      } else if (!phoneRegex.test(formData.mobileNo)) {
        tempErrors.mobileNo = "Please enter a valid 10-digit mobile number";
        isValid = false;
      } else if (validationResults.mobile.error) {
        tempErrors.mobileNo = validationResults.mobile.error;
        isValid = false;
      } else if (!validationResults.mobile.isAvailable) {
        tempErrors.mobileNo = "Mobile number is already registered";
        isValid = false;
      }
      
      if (formData.AlternateNumber.trim()) {
        if (!phoneRegex.test(formData.AlternateNumber)) {
          tempErrors.AlternateNumber = "Please enter a valid 10-digit number";
          isValid = false;
        } else if (formData.AlternateNumber === formData.mobileNo) {
          tempErrors.AlternateNumber = "Alternate number cannot be same as mobile number";
          isValid = false;
        } else if (!validationResults.alternate.isAvailable) {
          tempErrors.AlternateNumber = "Alternate number is already registered";
          isValid = false;
        }
      }

      if (!formData.dob.trim()) {
        tempErrors.dob = "Date of birth is required";
        isValid = false;
      } else {
        const { isValid: isAgeValid, message } = validateAge(formData.dob);
        if (!isAgeValid) {
          tempErrors.dob = message;
          isValid = false;
        }
      }
    }

    else if (step === 1) {
      const permanentErrors: any = {};
      if (!formData.permanentAddress.apartment?.trim()) {
        permanentErrors.apartment = "Apartment/House number is required";
        isValid = false;
      }
      if (!formData.permanentAddress.street?.trim()) {
        permanentErrors.street = "Street address is required";
        isValid = false;
      }
      if (!formData.permanentAddress.city?.trim()) {
        permanentErrors.city = "City is required";
        isValid = false;
      }
      if (!formData.permanentAddress.state?.trim()) {
        permanentErrors.state = "State is required";
        isValid = false;
      }
      if (!formData.permanentAddress.country?.trim()) {
        permanentErrors.country = "Country is required";
        isValid = false;
      }
      if (!formData.permanentAddress.pincode?.trim()) {
        permanentErrors.pincode = "Pincode is required";
        isValid = false;
      } else if (formData.permanentAddress.pincode.length !== 6) {
        permanentErrors.pincode = "Pincode must be 6 digits";
        isValid = false;
      }

      if (Object.keys(permanentErrors).length > 0) {
        tempErrors.permanentAddress = permanentErrors;
      }

      if (!isSameAddress) {
        const correspondenceErrors: any = {};
        if (!formData.correspondenceAddress.apartment?.trim()) {
          correspondenceErrors.apartment = "Apartment/House number is required";
          isValid = false;
        }
        if (!formData.correspondenceAddress.street?.trim()) {
          correspondenceErrors.street = "Street address is required";
          isValid = false;
        }
        if (!formData.correspondenceAddress.city?.trim()) {
          correspondenceErrors.city = "City is required";
          isValid = false;
        }
        if (!formData.correspondenceAddress.state?.trim()) {
          correspondenceErrors.state = "State is required";
          isValid = false;
        }
        if (!formData.correspondenceAddress.country?.trim()) {
          correspondenceErrors.country = "Country is required";
          isValid = false;
        }
        if (!formData.correspondenceAddress.pincode?.trim()) {
          correspondenceErrors.pincode = "Pincode is required";
          isValid = false;
        } else if (formData.correspondenceAddress.pincode.length !== 6) {
          correspondenceErrors.pincode = "Pincode must be 6 digits";
          isValid = false;
        }

        if (Object.keys(correspondenceErrors).length > 0) {
          tempErrors.correspondenceAddress = correspondenceErrors;
        }
      }
    }

    else if (step === 2) {
      if (formData.housekeepingRole.length === 0) {
        tempErrors.housekeepingRole = "Please select at least one service type";
        isValid = false;
      }
      if (formData.housekeepingRole.includes("COOK") && !formData.cookingSpeciality) {
        tempErrors.cookingSpeciality = "Please select cooking speciality";
        isValid = false;
      }
      if (formData.housekeepingRole.includes("NANNY") && !formData.nannyCareType) {
        tempErrors.nannyCareType = "Please select care type";
        isValid = false;
      }
      if (!formData.diet) {
        tempErrors.diet = "Please select diet preference";
        isValid = false;
      }
      if (!formData.experience) {
        tempErrors.experience = "Experience is required";
        isValid = false;
      } else if (isNaN(Number(formData.experience)) || Number(formData.experience) < 0) {
        tempErrors.experience = "Please enter a valid number";
        isValid = false;
      }
    }

    else if (step === 3) {
      if (!formData.kycType) {
        tempErrors.kycType = "Please select document type";
        isValid = false;
      }
      if (!formData.kycNumber) {
        tempErrors.kycNumber = `${getKycLabel(formData.kycType)} number is required`;
        isValid = false;
      } else {
        switch(formData.kycType) {
          case "AADHAR":
            if (!aadhaarRegex.test(formData.kycNumber)) {
              tempErrors.kycNumber = "Aadhaar number must be 12 digits";
              isValid = false;
            }
            break;
          case "PAN":
            if (!panRegex.test(formData.kycNumber)) {
              tempErrors.kycNumber = "PAN number must be in format: ABCDE1234F";
              isValid = false;
            }
            break;
          case "DRIVING_LICENSE":
            if (formData.kycNumber.length < 8) {
              tempErrors.kycNumber = "Please enter a valid driving license number";
              isValid = false;
            }
            break;
          case "VOTER_ID":
            if (!voterIdRegex.test(formData.kycNumber)) {
              tempErrors.kycNumber = "Voter ID must be in format: ABC1234567";
              isValid = false;
            }
            break;
          case "PASSPORT":
            if (!passportRegex.test(formData.kycNumber)) {
              tempErrors.kycNumber = "Passport number must be 8 characters (1 letter + 7 digits)";
              isValid = false;
            }
            break;
        }
      }
      if (!formData.documentImage) {
        tempErrors.documentImage = "Please upload document image";
        isValid = false;
      }
    }

    else if (step === 4) {
      // Bank details are optional, always valid
      isValid = true;
    }

    else if (step === 5) {
      if (!formData.keyFacts) {
        tempErrors.keyFacts = "You must agree to the Key Facts Statement";
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
    if (isNextDisabled) {
      showSnackbar("Please fill all required fields", "warning");
      return;
    }
    
    if (activeStep === 0) {
      if (validationResults.email.loading || validationResults.mobile.loading) {
        showSnackbar("Please wait for email and mobile validation", "warning");
        return;
      }
    }
    
    if (!validateStep(activeStep)) {
      showSnackbar("Please fix the errors before proceeding", "error");
      return;
    }
    
    setActiveStep((prevStep) => Math.min(prevStep + 1, steps.length - 1));
    // Scroll to top when step changes
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    if (activeStep === steps.length - 1) {
      showSnackbar("Registration form completed!", "success");
    }
  };

  const handleBack = () => {
    if (activeStep === 0) {
      onBackToLogin(true);
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep - 1);
      // Scroll to top when step changes
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };
  
  const handleSubmit = async () => {
    if (activeStep !== steps.length - 1) return;

    if (validateStep(activeStep)) {
      setIsSubmitting(true);
      try {
        let profilePicUrl = "";

        if (image) {
          const profileFormData = new FormData();
          profileFormData.append("image", {
            uri: image.uri,
            type: image.type || 'image/jpeg',
            name: image.name || 'profile.jpg'
          } as any);

          const imageResponse = await axiosInstance.post(
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
        }
        
        const selectedServices = formData.housekeepingRole;
        const primaryRole = selectedServices.length > 0 ? selectedServices[0] : "";
        
        const calculateAge = (dob: string): number => {
          if (!dob) return 0;
          const birthDate = moment(dob, "YYYY-MM-DD");
          const today = moment();
          return today.diff(birthDate, "years");
        };
        
        const age = calculateAge(formData.dob);
        
        const payload = {
          firstName: formData.firstName,
          middleName: formData.middleName,
          lastName: formData.lastName,
          mobileNo: parseInt(formData.mobileNo) || 0,
          alternateNo: formData.AlternateNumber ? parseInt(formData.AlternateNumber) : 0,
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
          housekeepingRoles: selectedServices,
          housekeepingRole: primaryRole,
          serviceTypes: selectedServices,
          diet: formData.diet,
          languages: selectedLanguages,
          age: age,
          ...(selectedServices.includes("COOK") && {
            cookingSpeciality: formData.cookingSpeciality
          }),
          ...(selectedServices.includes("NANNY") && {
            nannyCareType: formData.nannyCareType
          }),
          timeslot: formData.timeslot,
          expectedSalary: 0,
          experience: parseInt(formData.experience) || 0,
          username: formData.emailId,
          password: formData.password,
          agentReferralId: formData.agentReferralId || "",
          privacy: formData.privacy,
          keyFacts: formData.keyFacts,
          permanentAddress: {
            field1: formData.permanentAddress.apartment || "",
            field2: formData.permanentAddress.street || "",
            ctarea: formData.permanentAddress.city || "",
            pinno: formData.permanentAddress.pincode || "",
            state: formData.permanentAddress.state || "",
            country: formData.permanentAddress.country || ""
          },
          correspondenceAddress: {
            field1: formData.correspondenceAddress.apartment || "",
            field2: formData.correspondenceAddress.street || "",
            ctarea: formData.correspondenceAddress.city || "",
            pinno: formData.correspondenceAddress.pincode || "",
            state: formData.correspondenceAddress.state || "",
            country: formData.correspondenceAddress.country || ""
          },
          active: true,
          kycType: formData.kycType,
          kycNumber: formData.kycNumber,
          dob: formData.dob,
          profilePic: profilePicUrl,
          // Add bank details to payload
          bankDetails: {
            bankName: bankDetails.bankName || "",
            ifscCode: bankDetails.ifscCode || "",
            accountHolderName: bankDetails.accountHolderName || "",
            accountNumber: bankDetails.accountNumber || "",
            accountType: bankDetails.accountType || "",
            upiId: bankDetails.upiId || "",
          }
        };

        console.log("Submitting payload:", JSON.stringify(payload, null, 2));

        const response = await providerInstance.post(
          "/api/service-providers/serviceprovider/add",
          payload,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        showSnackbar("Registration successful!", "success");

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
        
        if (axios.isAxiosError(error) && error.response) {
          const errorMsg = error.response.data?.debugMessage || error.response.data?.message || "Registration failed. Please try again.";
          showSnackbar(errorMsg, "error");
          console.error("Error submitting form:", error.response.data);
        } else {
          showSnackbar("Registration failed. Please try again.", "error");
          console.error("Error submitting form:", error);
        }
      }
    } else {
      setIsSubmitting(false);
    }
  };

  const handleCloseSnackbar = () => {
    if (snackbarTimeout) {
      clearTimeout(snackbarTimeout);
      setSnackbarTimeout(null);
    }
    setSnackbarOpen(false);
  };

  const validateAge = (dob: string): { isValid: boolean; message: string } => {
    if (!dob) {
      return { isValid: false, message: "Date of birth is required" };
    }

    const birthDate = moment(dob, "YYYY-MM-DD");
    const today = moment();
    const age = today.diff(birthDate, "years");

    if (age < 18) {
      return { isValid: false, message: "You must be at least 18 years old" };
    }

    return { isValid: true, message: "" };
  };

  const handleTermsChange = useCallback((allAccepted: boolean) => {
    setFormData(prev => ({
      ...prev,
      keyFacts: allAccepted,
      terms: allAccepted,
      privacy: allAccepted,
    }));
    checkStepCompletion();
  }, [checkStepCompletion]);

  const handleTermsUpdate = useCallback((updatedTerms: { keyFacts: boolean; terms: boolean; privacy: boolean }) => {
    setFormData(prev => ({
      ...prev,
      keyFacts: updatedTerms.keyFacts,
      terms: updatedTerms.terms,
      privacy: updatedTerms.privacy,
    }));
    checkStepCompletion();
  }, [checkStepCompletion]);

  const getFontSizes = () => {
    switch (fontSize) {
      case 'small':
        return {
          title: 18,
          subtitle: 14,
          text: 12,
          small: 11,
          button: 13,
          heading: 16,
          label: 13,
        };
      case 'large':
        return {
          title: 24,
          subtitle: 18,
          text: 16,
          small: 14,
          button: 16,
          heading: 20,
          label: 15,
        };
      default:
        return {
          title: 20,
          subtitle: 16,
          text: 14,
          small: 12,
          button: 14,
          heading: 18,
          label: 14,
        };
    }
  };

  const fontSizes = getFontSizes();

  const renderStepper = () => {
  return (
    <View style={styles.stepperWrapper}>
      {steps.map((step, index) => (
        <View key={index} style={styles.stepperItem}>
          <View
            style={[
              styles.stepperCircle,
              index < activeStep && styles.stepperCircleCompleted,
              index === activeStep && styles.stepperCircleActive,
              index > activeStep && styles.stepperCircleInactive,
            ]}
          >
            {index < activeStep ? (
              <Icon name="check" size={SCREEN_WIDTH < 380 ? 12 : 16} color="#fff" />
            ) : (
              <Text style={[styles.stepperNumber, { fontSize: SCREEN_WIDTH < 380 ? 10 : 12 }]}>{index + 1}</Text>
            )}
          </View>
          <Text
            style={[
              styles.stepperLabel,
              { 
                fontSize: SCREEN_WIDTH < 380 ? 9 : (SCREEN_WIDTH < 480 ? 10 : 11),
                textAlign: 'center'
              },
              index <= activeStep ? styles.stepperLabelActive : styles.stepperLabelInactive,
            ]}
            numberOfLines={2}
          >
            {step}
          </Text>
          {index < steps.length - 1 && (
            <View
              style={[
                styles.stepperLine,
                index < activeStep && styles.stepperLineActive,
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
          <BasicInformation
            formData={formData}
            errors={errors}
            validationResults={validationResults}
            showPassword={showPassword}
            showConfirmPassword={showConfirmPassword}
            isDobValid={isDobValid}
            onImageSelect={handleImageSelect}
            onFieldChange={handleRealTimeValidation}
            onFieldFocus={(fieldName) => setErrors(prev => ({ ...prev, [fieldName]: "" }))}
            onDobChange={handleDobChange}
            onDatePress={handleDatePress}
            onTogglePasswordVisibility={handleTogglePasswordVisibility}
            onToggleConfirmPasswordVisibility={handleToggleConfirmPasswordVisibility}
            onClearEmail={handleClearEmail}
            onClearMobile={handleClearMobile}
            onClearAlternate={handleClearAlternate}
          />
        );
      
      case 1:
        return (
          <View style={styles.stepContainer}>
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

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <Icon name="location-on" size={22} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.text, fontSize: fontSizes.heading }]}>Current Location</Text>
              </View>
              <Text style={[styles.cardSubtitle, { color: colors.textSecondary, fontSize: fontSizes.text }]}>
                Use your current location to auto-fill address details
              </Text>

              <TouchableOpacity
                style={[styles.locationButton, { backgroundColor: colors.primary }, locationLoading && styles.buttonDisabled]}
                onPress={fetchLocationData}
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon name="my-location" size={18} color="#fff" />
                    <Text style={[styles.buttonText, { color: '#fff', fontSize: fontSizes.button }]}>Fetch Current Location</Text>
                  </>
                )}
              </TouchableOpacity>

              {(formData.latitude !== 0 || formData.longitude !== 0) && (
                <View style={[styles.successAlert, { backgroundColor: colors.successLight, borderColor: colors.success }]}>
                  <Text style={[styles.alertText, { color: colors.success, fontSize: fontSizes.small }]}>
                    <Text style={{ fontWeight: 'bold' }}>Detected:</Text> {formData.currentLocation || "No address available"}
                  </Text>
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
              morningSlots={morningSlots}
              eveningSlots={eveningSlots}
              isFullTime={isFullTime}
              selectedTimeSlots={selectedTimeSlots}
              onServiceTypeChange={handleServiceTypeChange}
              onCookingSpecialityChange={handleCookingSpecialityChange}
              onNannyCareTypeChange={handleNannyCareTypeChange}
              onDietChange={handleDietChange}
              onExperienceChange={handleExperienceChange}
              onDescriptionChange={handleDescriptionChange}
              onReferralCodeChange={handleReferralCodeChange}
              onAgentReferralIdChange={handleAgentReferralIdChange}
              onFullTimeToggle={handleFullTimeToggle}
              onAddMorningSlot={handleAddMorningSlot}
              onRemoveMorningSlot={handleRemoveMorningSlot}
              onClearMorningSlots={handleClearMorningSlots}
              onAddEveningSlot={handleAddEveningSlot}
              onRemoveEveningSlot={handleRemoveEveningSlot}
              onClearEveningSlots={handleClearEveningSlots}
              onMorningSlotChange={handleMorningSlotChange}
              onEveningSlotChange={handleEveningSlotChange}
              formatDisplayTime={formatDisplayTime}
              selectedLanguages={selectedLanguages}
              onLanguagesChange={setSelectedLanguages}
            />
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <KYCVerification
              formData={formData}
              errors={errors}
              onFieldChange={handleRealTimeValidation}
              onFieldFocus={(fieldName) => setErrors(prev => ({ ...prev, [fieldName]: "" }))}
              onDocumentUpload={handleDocumentUpload}
              onKycTypeChange={handleKycTypeChange}
            />
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <BankDetails
              onBankDetailsChange={handleBankDetailsChange}
              initialData={bankDetails}
              errors={bankDetailsErrors}
            />
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContainer}>
            <Text style={[styles.confirmationText, { color: colors.text, fontSize: fontSizes.text }]}>
              Please review your information and agree to the terms to complete your registration.
            </Text>

            <TermsCheckboxes 
              onChange={handleTermsChange} 
              onIndividualChange={handleTermsUpdate}
              onLinkPress={handleOpenPolicy}
              initialValues={{
                keyFacts: formData.keyFacts,
                terms: formData.terms,
                privacy: formData.privacy
              }}
            />
            {errors.keyFacts && <Text style={[styles.errorText, { color: colors.error, fontSize: fontSizes.small }]}>{errors.keyFacts}</Text>}
            {errors.terms && <Text style={[styles.errorText, { color: colors.error, fontSize: fontSizes.small }]}>{errors.terms}</Text>}
            {errors.privacy && <Text style={[styles.errorText, { color: colors.error, fontSize: fontSizes.small }]}>{errors.privacy}</Text>}
          </View>
        );

      default:
        return <Text style={{ color: colors.text, fontSize: fontSizes.text }}>Unknown step</Text>;
    }
  };

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent={false}
    >
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
              colors={["#0a2a66ff", "#004aadff"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.headerContainer}
            >
              <Text style={[styles.title, { color: '#fff', fontSize: fontSizes.title }]}>Service Provider Registration</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => onBackToLogin(true)}
              >
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView 
              ref={scrollViewRef}
              style={[styles.content, { backgroundColor: colors.background }]} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.contentContainer}
              keyboardShouldPersistTaps="handled"
            >
              {renderStepper()}
              {renderStepContent(activeStep)}

              <View style={styles.buttonContainer}>
                <Button
                  variant="outline"
                  size="medium"
                  onPress={handleBack}
                  disabled={isSubmitting}
                  startIcon={<Icon name="arrow-back" size={20} color={colors.primary} />}
                >
                  Back
                </Button>

                {activeStep === steps.length - 1 ? (
                  <Button
                    variant="primary"
                    size="medium"
                    onPress={handleSubmit}
                    disabled={isNextDisabled || isSubmitting}
                    loading={isSubmitting}
                  >
                    Submit
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="medium"
                    onPress={handleNext}
                    disabled={isNextDisabled || isSubmitting}
                    endIcon={<Icon name="arrow-forward" size={20} color="#fff" />}
                  >
                    Next
                  </Button>
                )}
              </View>
            </ScrollView>

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
                  <Text style={[styles.policyModalTitle, { color: '#fff', fontSize: fontSizes.title }]}>
                    {activePolicy === 'terms' && "Terms and Conditions"}
                    {activePolicy === 'privacy' && "Privacy Policy"}
                    {activePolicy === 'keyfacts' && "Key Facts Statement"}
                  </Text>
                  <TouchableOpacity
                    style={styles.policyModalClose}
                    onPress={() => setPolicyModalVisible(false)}
                  >
                    <Icon name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </LinearGradient>
                <ScrollView style={[styles.policyModalContent, { backgroundColor: colors.background }]}>
                  {renderPolicyContent()}
                </ScrollView>
              </View>
            </Modal>

            {showDatePicker && (
              <DateTimePicker
                value={selectedDate || new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}

            {snackbarOpen && (
              <View style={[styles.snackbar, styles[`snackbar${snackbarSeverity}`], { backgroundColor: colors[snackbarSeverity] || colors.primary }]}>
                <Text style={[styles.snackbarText, { color: '#fff', fontSize: fontSizes.text }]}>{snackbarMessage}</Text>
                <TouchableOpacity onPress={handleCloseSnackbar}>
                  <Icon name="close" size={20} color="white" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  headerContainer: {
    paddingTop: Platform.OS === "ios" ? 12 : 16,
    paddingBottom: Platform.OS === "ios" ? 12 : 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: Platform.OS === "ios" ? 12 : 16,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  stepContainer: {
    marginBottom: 20,
  },
  stepperWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingHorizontal: 4,
    flexWrap: 'wrap',
  },
  stepperItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
    minWidth: SCREEN_WIDTH < 480 ? 50 : 60,
  },
  stepperCircle: {
    width: SCREEN_WIDTH < 380 ? 32 : (SCREEN_WIDTH < 480 ? 36 : 40),
    height: SCREEN_WIDTH < 380 ? 32 : (SCREEN_WIDTH < 480 ? 36 : 40),
    borderRadius: SCREEN_WIDTH < 380 ? 16 : (SCREEN_WIDTH < 480 ? 18 : 20),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    zIndex: 2,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  stepperCircleCompleted: {
    backgroundColor: '#4caf50',
  },
  stepperCircleActive: {
    backgroundColor: '#1976d2',
    transform: [{ scale: 1.02 }],
  },
  stepperCircleInactive: {
    backgroundColor: '#e0e0e0',
  },
  stepperNumber: {
    color: '#fff',
    fontWeight: 'bold',
  },
  stepperLabel: {
  fontWeight: '500',
  lineHeight: 14,
},
  stepperLabelActive: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
  stepperLabelInactive: {
    color: '#757575',
  },
  stepperLine: {
    position: 'absolute',
    top: SCREEN_WIDTH < 380 ? 16 : (SCREEN_WIDTH < 480 ? 18 : 20),
    left: '50%',
    right: '-50%',
    height: 2,
    backgroundColor: '#e0e0e0',
    zIndex: 1,
  },
  stepperLineActive: {
    backgroundColor: '#1976d2',
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cardSubtitle: {
    marginBottom: 16,
    lineHeight: 20,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  successAlert: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  alertText: {
    lineHeight: 18,
  },
  confirmationText: {
    marginBottom: 20,
    lineHeight: 22,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 20,
    gap: 12,
  },
  snackbar: {
    position: 'absolute',
    top: Platform.OS === "ios" ? 50 : 20,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 10,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
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
    flex: 1,
    marginRight: 12,
    lineHeight: 20,
  },
  errorText: {
    marginTop: 4,
    marginBottom: 8,
  },
  policyModalContainer: {
    flex: 1,
  },
  policyModalHeader: {
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  policyModalTitle: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  policyModalClose: {
    position: 'absolute',
    right: 16,
    top: Platform.OS === "ios" ? 50 : 20,
  },
  policyModalContent: {
    flex: 1,
    padding: 16,
  },
});

export default ServiceProviderRegistration;