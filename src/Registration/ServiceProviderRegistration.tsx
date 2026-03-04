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

// Import the new components
import BasicInformation from "./BasicInformation";
import ServiceDetails from "./ServiceDetails";
import KYCVerification from "./KYCVerification";

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

  // Add axios interceptors for debugging
  useEffect(() => {
    // Request interceptor
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

    // Response interceptor
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

    // Cleanup interceptors
    return () => {
      axiosInstance.interceptors.request.eject(requestInterceptor);
      axiosInstance.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  const { validationResults, validateField, resetValidation } = useFieldValidation();

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

  // Helper function to check if two time ranges overlap
  const isRangeOverlapping = (range1: number[], range2: number[]): boolean => {
    return !(range1[1] <= range2[0] || range1[0] >= range2[1]);
  };

  // Get disabled ranges for a specific slot (all other slots)
  const getDisabledRangesForSlot = (slots: number[][], currentIndex: number): number[][] => {
    return slots.filter((_, index) => index !== currentIndex);
  };

  // Helper function to format time display
  const formatDisplayTime = (value: number): string => {
    const hour = Math.floor(value);
    const minute = Math.round((value - hour) * 60);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour;
    const displayHourFormatted = displayHour === 0 ? 12 : displayHour;
    const minuteFormatted = minute === 30 ? '30' : '00';
    return `${displayHourFormatted}:${minuteFormatted} ${period}`;
  };

  // Helper function to format time for storage (24-hour format)
  const formatTimeForStorage = (value: number): string => {
    const hour = Math.floor(value);
    const minute = value % 1 === 0.5 ? "30" : "00";
    const formattedHour = hour < 10 ? `0${hour}` : `${hour}`;
    return `${formattedHour}:${minute}`;
  };

  // Custom Slider component with disabled ranges
  const TimeSliderWithDisabledRanges: React.FC<{
    value: number[];
    onChange: (newValue: number[]) => void;
    min: number;
    max: number;
    marks?: Array<{ value: number; label: string }>;
    disabledRanges: number[][];
  }> = ({ value, onChange, min, max, marks, disabledRanges }) => {
    
    const handleSliderChange = (newValues: number[]) => {
      const [start, end] = newValues;
      
      // Check if the new range overlaps with any disabled ranges
      const hasOverlap = disabledRanges.some(disabledRange => 
        isRangeOverlapping([start, end], disabledRange)
      );
      
      if (!hasOverlap) {
        onChange(newValues);
      } else {
        setSnackbarMessage("This time range overlaps with another selected slot");
        setSnackbarSeverity("warning");
        setSnackbarOpen(true);
      }
    };

    return (
      <View style={styles.sliderContainer}>
        <View style={styles.sliderWrapper}>
          <Slider
            value={value[0]}
            minimumValue={min}
            maximumValue={max}
            step={0.5}
            onValueChange={(val) => handleSliderChange([val, value[1]])}
            minimumTrackTintColor="#1976d2"
            maximumTrackTintColor="#bfbfbf"
          />
          <Slider
            value={value[1]}
            minimumValue={min}
            maximumValue={max}
            step={0.5}
            onValueChange={(val) => handleSliderChange([value[0], val])}
            minimumTrackTintColor="#1976d2"
            maximumTrackTintColor="#bfbfbf"
            style={styles.sliderOverlay}
          />
        </View>
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabel}>{formatDisplayTime(value[0])}</Text>
          <Text style={styles.sliderLabel}>{formatDisplayTime(value[1])}</Text>
        </View>
      </View>
    );
  };

  // Component to visually show disabled ranges
  const DisabledRangesIndicator: React.FC<{
    ranges: number[][];
    min: number;
    max: number;
  }> = ({ ranges, min, max }) => {
    if (ranges.length === 0) return null;

    const totalWidth = max - min;
    
    return (
      <View style={styles.disabledRangesContainer}>
        <View style={styles.disabledRangesTrack} />
        {ranges.map((range, index) => {
          const startPercent = ((range[0] - min) / totalWidth) * 100;
          const widthPercent = ((range[1] - range[0]) / totalWidth) * 100;
          
          return (
            <View
              key={index}
              style={[
                styles.disabledRange,
                {
                  left: `${startPercent}%`,
                  width: `${widthPercent}%`,
                }
              ]}
            />
          );
        })}
      </View>
    );
  };

  // Update selected time slots summary
  const updateSelectedTimeSlots = useCallback(() => {
    if (isFullTime) {
      setSelectedTimeSlots("06:00 - 20:00 (Full Day)");
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

    // Format for display (with AM/PM)
    morningSlots.forEach(([start, end]) => {
      displaySlots.push(`${formatDisplayTime(start)} - ${formatDisplayTime(end)}`);
    });
    
    eveningSlots.forEach(([start, end]) => {
      displaySlots.push(`${formatDisplayTime(start)} - ${formatDisplayTime(end)}`);
    });

    // Format for storage (24-hour format)
    morningSlotStrings.forEach(slot => storageSlots.push(slot));
    eveningSlotStrings.forEach(slot => storageSlots.push(slot));

    if (displaySlots.length > 0) {
      setSelectedTimeSlots(displaySlots.join(', '));
      setFormData((prev) => ({ ...prev, timeslot: storageSlots.join(', ') }));
    } else {
      setSelectedTimeSlots('No slots selected');
      setFormData((prev) => ({ ...prev, timeslot: '' }));
    }
  }, [isFullTime, morningSlots, eveningSlots]);

  // Update slots when they change
  useEffect(() => {
    updateSelectedTimeSlots();
  }, [morningSlots, eveningSlots, isFullTime, updateSelectedTimeSlots]);

  const handleAddMorningSlot = () => {
    setMorningSlots(prevSlots => {
      // Find an available time range that doesn't conflict with existing slots
      const existingRanges = prevSlots;
      let newStart = 6;
      let newEnd = 6.5;
      let foundAvailableSlot = false;

      // Try to find an available 30-minute slot
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

      // If no 30-minute slot available, try to find any non-overlapping range
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

      // If still no slot found
      if (!foundAvailableSlot) {
        setSnackbarMessage("No available time slots remaining in morning");
        setSnackbarSeverity("warning");
        setSnackbarOpen(true);
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
      // Find an available time range that doesn't conflict with existing slots
      const existingRanges = prevSlots;
      let newStart = 12;
      let newEnd = 12.5;
      let foundAvailableSlot = false;

      // Try to find an available 30-minute slot
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

      // If no 30-minute slot available, try to find any non-overlapping range
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

      // If still no slot found
      if (!foundAvailableSlot) {
        setSnackbarMessage("No available time slots remaining in evening");
        setSnackbarSeverity("warning");
        setSnackbarOpen(true);
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
    
    // Check if new range overlaps with any other slots
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
    
    // Check if new range overlaps with any other slots
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
    
    // Clear error for this field when user types
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  // Handler for KYC type change
  const handleKycTypeChange = (kycType: string) => {
    setFormData(prev => ({ 
      ...prev, 
      kycType,
      kycNumber: "" // Clear the number when type changes
    }));
    setErrors(prev => ({ 
      ...prev, 
      kycType: "",
      kycNumber: "" 
    }));
  };

  // Helper function to get KYC label
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
      const { isValid, message } = validateAge(formattedDate);
      setIsDobValid(isValid);

      if (!isValid) {
        setIsFieldsDisabled(true);
        setErrors(prev => ({ ...prev, dob: message }));
      } else {
        setIsFieldsDisabled(false);
        setErrors(prev => ({ ...prev, dob: "" }));
      }
    }
  };

  const handleAddressChange = async (type: 'permanent' | 'correspondence', data: any) => {
    const newFormData = {
      ...formData,
      [type === 'permanent' ? 'permanentAddress' : 'correspondenceAddress']: data
    };
    
    // If isSameAddress is true and we're updating permanent address, also update correspondence address
    if (isSameAddress && type === 'permanent') {
      newFormData.correspondenceAddress = data;
    }
    
    setFormData(newFormData);

    // Clear address errors when address is being filled
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

    // If permanent address is updated and isSameAddress is true, also clear correspondence errors
    if (type === 'permanent' && isSameAddress) {
      setErrors(prev => ({
        ...prev,
        correspondenceAddress: undefined
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
        setSnackbarMessage("Could not get coordinates for this address. Please check the address details.");
        setSnackbarSeverity("warning");
        setSnackbarOpen(true);
      }
    }
  };

  const handleSameAddressToggle = (checked: boolean) => {
    setIsSameAddress(checked);
    
    if (checked) {
      // Copy permanent address to correspondence address
      setFormData(prev => ({
        ...prev,
        correspondenceAddress: { ...prev.permanentAddress }
      }));
      
      // Clear correspondence address errors
      setErrors(prev => ({
        ...prev,
        correspondenceAddress: undefined
      }));
    }
  };

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

  // Helper function to check if step 0 is ready for next
  const isStep0ReadyForNext = () => {
    // Check if required fields are filled
    const requiredFieldsFilled = formData.firstName.trim() && 
                                 formData.lastName.trim() && 
                                 formData.gender && 
                                 formData.emailId.trim() && 
                                 formData.password.trim() && 
                                 formData.confirmPassword.trim() && 
                                 formData.mobileNo.trim() &&
                                 formData.dob.trim();

    // Check if there are any validation errors
    const hasValidationErrors = validationResults.email.error || 
                               validationResults.mobile.error ||
                               !validationResults.email.isAvailable ||
                               !validationResults.mobile.isAvailable ||
                               !!errors.dob;

    // Check if DOB is valid
    const isDobFieldValid = isDobValid && !errors.dob;

    return requiredFieldsFilled && !hasValidationErrors && isDobFieldValid;
  };

  const handleRealTimeValidation = (e: any) => {
    const { name, value } = e.target;

    // Clear error for this field when user starts typing
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

    if (name === "kycNumber") {
      const trimmedValue = value.trim();
      setFormData(prev => ({ ...prev, kycNumber: trimmedValue }));
      
      // Validate based on kycType
      if (trimmedValue) {
        let isValid = true;
        let errorMessage = "";
        
        switch(formData.kycType) {
          case "AADHAR":
            isValid = /^[0-9]{12}$/.test(trimmedValue);
            errorMessage = "Aadhaar number must be exactly 12 digits.";
            break;
          case "PAN":
            isValid = panRegex.test(trimmedValue);
            errorMessage = "Please enter a valid PAN (e.g., ABCDE1234F).";
            break;
          case "DRIVING_LICENSE":
            isValid = trimmedValue.length >= 8;
            errorMessage = "Please enter a valid driving license number.";
            break;
          case "VOTER_ID":
            isValid = voterIdRegex.test(trimmedValue);
            errorMessage = "Please enter a valid 10-digit Voter ID.";
            break;
          case "PASSPORT":
            isValid = passportRegex.test(trimmedValue);
            errorMessage = "Please enter a valid 8-character passport number.";
            break;
        }
        
        if (!isValid) {
          setErrors(prev => ({ ...prev, kycNumber: errorMessage }));
        } else {
          setErrors(prev => ({ ...prev, kycNumber: "" }));
        }
      } else {
        setErrors(prev => ({ ...prev, kycNumber: `${getKycLabel(formData.kycType)} number is required.` }));
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
    setErrors(prevErrors => ({ ...prevErrors, cookingSpeciality: "" }));
  };

  // Handler for nanny care type
  const handleNannyCareTypeChange = (value: string) => {
    setFormData(prev => ({ ...prev, nannyCareType: value }));
    setErrors(prev => ({ ...prev, nannyCareType: "" }));
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

      if (!formData.gender) {
        tempErrors.gender = "Please select a gender.";
        isValid = false;
      }
      
      if (!formData.emailId.trim()) {
        tempErrors.emailId = "Email is required.";
        isValid = false;
      } else if (!emailIdRegex.test(formData.emailId)) {
        tempErrors.emailId = "Please enter a valid email address.";
        isValid = false;
      } else if (validationResults.email.error) {
        tempErrors.emailId = validationResults.email.error;
        isValid = false;
      } else if (!validationResults.email.isAvailable) {
        tempErrors.emailId = "Email is not available.";
        isValid = false;
      }
      
      if (!formData.password.trim()) {
        tempErrors.password = "Password is required.";
        isValid = false;
      } else if (!strongPasswordRegex.test(formData.password)) {
        tempErrors.password = "Password must contain at least 8 characters, including uppercase, lowercase, number, and special character.";
        isValid = false;
      }
      
      if (!formData.confirmPassword.trim()) {
        tempErrors.confirmPassword = "Confirm Password is required.";
        isValid = false;
      } else if (formData.password !== formData.confirmPassword) {
        tempErrors.confirmPassword = "Passwords do not match.";
        isValid = false;
      }
      
      if (!formData.mobileNo.trim()) {
        tempErrors.mobileNo = "Mobile number is required.";
        isValid = false;
      } else if (!phoneRegex.test(formData.mobileNo)) {
        tempErrors.mobileNo = "Please enter a valid 10-digit mobile number.";
        isValid = false;
      } else if (validationResults.mobile.error) {
        tempErrors.mobileNo = validationResults.mobile.error;
        isValid = false;
      } else if (!validationResults.mobile.isAvailable) {
        tempErrors.mobileNo = "Mobile number is not available.";
        isValid = false;
      }
      
      // Validate alternate number if provided
      if (formData.AlternateNumber.trim()) {
        if (!phoneRegex.test(formData.AlternateNumber)) {
          tempErrors.AlternateNumber = "Please enter a valid 10-digit mobile number.";
          isValid = false;
        } else if (formData.AlternateNumber === formData.mobileNo) {
          tempErrors.AlternateNumber = "Alternate number must be different from primary mobile number.";
          isValid = false;
        } else if (!validationResults.alternate.isAvailable) {
          tempErrors.AlternateNumber = "Alternate number is not available.";
          isValid = false;
        }
      }

      // Validate DOB
      if (!formData.dob.trim()) {
        tempErrors.dob = "Date of Birth is required.";
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
        permanentErrors.apartment = "Apartment is required.";
        isValid = false;
      }
      if (!formData.permanentAddress.street?.trim()) {
        permanentErrors.street = "Street is required.";
        isValid = false;
      }
      if (!formData.permanentAddress.city?.trim()) {
        permanentErrors.city = "City is required.";
        isValid = false;
      }
      if (!formData.permanentAddress.state?.trim()) {
        permanentErrors.state = "State is required.";
        isValid = false;
      }
      if (!formData.permanentAddress.country?.trim()) {
        permanentErrors.country = "Country is required.";
        isValid = false;
      }
      if (!formData.permanentAddress.pincode?.trim()) {
        permanentErrors.pincode = "Pincode is required.";
        isValid = false;
      } else if (formData.permanentAddress.pincode.length !== 6) {
        permanentErrors.pincode = "Pincode must be exactly 6 digits.";
        isValid = false;
      }

      if (Object.keys(permanentErrors).length > 0) {
        tempErrors.permanentAddress = permanentErrors;
      }

      // Only validate correspondence address if not same as permanent
      if (!isSameAddress) {
        const correspondenceErrors: any = {};
        if (!formData.correspondenceAddress.apartment?.trim()) {
          correspondenceErrors.apartment = "Apartment is required.";
          isValid = false;
        }
        if (!formData.correspondenceAddress.street?.trim()) {
          correspondenceErrors.street = "Street is required.";
          isValid = false;
        }
        if (!formData.correspondenceAddress.city?.trim()) {
          correspondenceErrors.city = "City is required.";
          isValid = false;
        }
        if (!formData.correspondenceAddress.state?.trim()) {
          correspondenceErrors.state = "State is required.";
          isValid = false;
        }
        if (!formData.correspondenceAddress.country?.trim()) {
          correspondenceErrors.country = "Country is required.";
          isValid = false;
        }
        if (!formData.correspondenceAddress.pincode?.trim()) {
          correspondenceErrors.pincode = "Pincode is required.";
          isValid = false;
        } else if (formData.correspondenceAddress.pincode.length !== 6) {
          correspondenceErrors.pincode = "Pincode must be exactly 6 digits.";
          isValid = false;
        }

        if (Object.keys(correspondenceErrors).length > 0) {
          tempErrors.correspondenceAddress = correspondenceErrors;
        }
      }
    }

    else if (step === 2) {
      if (formData.housekeepingRole.length === 0) {
        tempErrors.housekeepingRole = "Please select at least one service type.";
        isValid = false;
      }
      if (formData.housekeepingRole.includes("COOK") && !formData.cookingSpeciality) {
        tempErrors.cookingSpeciality = "Please select a speciality for the cook service.";
        isValid = false;
      }
      if (formData.housekeepingRole.includes("NANNY") && !formData.nannyCareType) {
        tempErrors.nannyCareType = "Please select a care type for the nanny service.";
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
      if (!formData.kycType) {
        tempErrors.kycType = "Please select a KYC document type.";
        isValid = false;
      }
      if (!formData.kycNumber) {
        tempErrors.kycNumber = `${getKycLabel(formData.kycType)} number is required.`;
        isValid = false;
      } else {
        // Add specific validation based on KYC type
        switch(formData.kycType) {
          case "AADHAR":
            if (!aadhaarRegex.test(formData.kycNumber)) {
              tempErrors.kycNumber = "Aadhaar number must be exactly 12 digits.";
              isValid = false;
            }
            break;
          case "PAN":
            if (!panRegex.test(formData.kycNumber)) {
              tempErrors.kycNumber = "Please enter a valid PAN (e.g., ABCDE1234F).";
              isValid = false;
            }
            break;
          case "DRIVING_LICENSE":
            if (formData.kycNumber.length < 8) {
              tempErrors.kycNumber = "Please enter a valid driving license number.";
              isValid = false;
            }
            break;
          case "VOTER_ID":
            if (!voterIdRegex.test(formData.kycNumber)) {
              tempErrors.kycNumber = "Please enter a valid 10-digit Voter ID.";
              isValid = false;
            }
            break;
          case "PASSPORT":
            if (!passportRegex.test(formData.kycNumber)) {
              tempErrors.kycNumber = "Please enter a valid 8-character passport number.";
              isValid = false;
            }
            break;
        }
      }
      if (!formData.documentImage) {
        tempErrors.documentImage = "Please upload your KYC document.";
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
    // For step 0, check if validations are complete before proceeding
    if (activeStep === 0) {
      if (validationResults.email.loading || validationResults.mobile.loading) {
        setSnackbarMessage("Please wait for email/mobile validation to complete.");
        setSnackbarSeverity("warning");
        setSnackbarOpen(true);
        return;
      }
      
      // Validate the current step
      if (!validateStep(activeStep)) {
        return;
      }
      
      // Additional check for validation results
      if (!isStep0ReadyForNext()) {
        setSnackbarMessage("Please fix all validation errors before proceeding.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        return;
      }
    } else {
      // For other steps, just validate
      if (!validateStep(activeStep)) {
        return;
      }
    }
    
    setActiveStep((prevStep) => Math.min(prevStep + 1, steps.length - 1));
    if (activeStep === steps.length - 1) {
      setSnackbarMessage("Registration Successful!");
      setSnackbarOpen(true);
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
        
        // Handle document upload
        let documentUrl = "";
        if (formData.documentImage) {
          try {
            const docFormData = new FormData();

            docFormData.append("image", {
              uri: formData.documentImage.uri,
              type: formData.documentImage.type || 'image/jpeg',
              name: formData.documentImage.name || 'document.jpg'
            } as any);

            const docResponse = await axios.post(
              "http://65.2.153.173:3000/upload",
              docFormData,
              {
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              }
            );

            if (docResponse.status === 200) {
              documentUrl = docResponse.data.imageUrl;
            }
          } catch (error) {
            console.error("Error uploading document image:", error);
            setSnackbarMessage("Failed to upload KYC document. Proceeding without it.");
            setSnackbarSeverity("warning");
            setSnackbarOpen(true);
          }
        }

        const primaryRole = formData.housekeepingRole.length > 0 ? formData.housekeepingRole[0] : "";
        
        const payload = {
          firstName: formData.firstName,
          middleName: formData.middleName || "",
          lastName: formData.lastName,
          mobileNo: formData.mobileNo ? parseInt(formData.mobileNo) : 0,
          alternateNo: formData.AlternateNumber ? parseInt(formData.AlternateNumber) : 0,
          emailId: formData.emailId,
          gender: formData.gender,
          buildingName: formData.buildingName || "",
          locality: formData.locality || "",
          latitude: currentLocation?.latitude || formData.latitude || 0,
          longitude: currentLocation?.longitude || formData.longitude || 0,
          street: formData.street || "",
          pincode: formData.pincode ? parseInt(formData.pincode) : 0,
          currentLocation: formData.currentLocation || "",
          nearbyLocation: formData.nearbyLocation || "",
          location: formData.currentLocation || "",
          housekeepingRole: primaryRole,
          serviceTypes: formData.housekeepingRole,
          diet: formData.diet,
          ...(formData.housekeepingRole.includes("COOK") && {
            cookingSpeciality: formData.cookingSpeciality
          }),
          ...(formData.housekeepingRole.includes("NANNY") && {
            nannyCareType: formData.nannyCareType
          }),
          timeslot: formData.timeslot || "06:00-20:00",
          expectedSalary: 0,
          experience: formData.experience ? parseInt(formData.experience) : 0,
          username: formData.emailId,
          password: formData.password,
          privacy: formData.privacy,
          keyFacts: formData.keyFacts,
          permanentAddress: {
            field1: formData.permanentAddress.apartment || "",
            field2: formData.permanentAddress.street || "",
            ctArea: formData.permanentAddress.city || "",
            pinNo: formData.permanentAddress.pincode || "",
            state: formData.permanentAddress.state || "",
            country: formData.permanentAddress.country || "India"
          },
          correspondenceAddress: {
            field1: formData.correspondenceAddress.apartment || "",
            field2: formData.correspondenceAddress.street || "",
            ctArea: formData.correspondenceAddress.city || "",
            pinNo: formData.correspondenceAddress.pincode || "",
            state: formData.correspondenceAddress.state || "",
            country: formData.correspondenceAddress.country || "India"
          },
          active: true,
          kycType: formData.kycType,
          kycNumber: formData.kycNumber,
          kycDocumentUrl: documentUrl,
          dob: formData.dob,
          profilePic: profilePicUrl
        };

        console.log("Submitting payload:", JSON.stringify(payload, null, 2));

        const response = await axiosInstance.post(
          "/api/serviceproviders/serviceprovider/add",
          payload,
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Response:", response.data);

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
      } catch (error: any) {
        console.error("Error submitting form:", error);
        
        // Enhanced error handling to capture response data
        let errorMessage = "Failed to add service provider. Please try again.";
        
        if (error.response) {
          console.error("Error response status:", error.response.status);
          console.error("Error response headers:", error.response.headers);
          
          const responseData = error.response.data;
          console.error("Error response data:", responseData);
          
          if (responseData) {
            if (typeof responseData === 'string') {
              errorMessage = responseData;
            } else if (responseData.message) {
              errorMessage = responseData.message;
            } else if (responseData.error) {
              errorMessage = responseData.error;
            } else if (responseData.msg) {
              errorMessage = responseData.msg;
            } else if (Array.isArray(responseData) && responseData.length > 0) {
              errorMessage = responseData[0].msg || responseData[0].message || JSON.stringify(responseData);
            } else {
              errorMessage = JSON.stringify(responseData);
            }
          }
        } else if (error.request) {
          errorMessage = "No response from server. Please check your network connection.";
        } else {
          errorMessage = error.message;
        }
        
        setSnackbarOpen(true);
        setSnackbarSeverity("error");
        setSnackbarMessage(errorMessage);
        setIsSubmitting(false);
      }
    } else {
      setIsSubmitting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const validateAge = (dob: string): { isValid: boolean; message: string } => {
    if (!dob) {
      return { isValid: false, message: "Date of Birth is required." };
    }

    const birthDate = moment(dob, "YYYY-MM-DD");
    const today = moment();
    const age = today.diff(birthDate, "years");

    if (age < 18) {
      return { isValid: false, message: "You must be at least 18 years old to register." };
    }

    return { isValid: true, message: "" };
  };

  // Handle terms change from TermsCheckboxes component
  const handleTermsChange = useCallback((allAccepted: boolean) => {
    setFormData(prev => ({
      ...prev,
      keyFacts: allAccepted,
      terms: allAccepted,
      privacy: allAccepted,
    }));
  }, []);

  // Handle individual terms updates
  const handleTermsUpdate = useCallback((updatedTerms: { keyFacts: boolean; terms: boolean; privacy: boolean }) => {
    setFormData(prev => ({
      ...prev,
      keyFacts: updatedTerms.keyFacts,
      terms: updatedTerms.terms,
      privacy: updatedTerms.privacy,
    }));
  }, []);

  // Handler for service type change (updated for multi-select)
  const handleServiceTypeChange = (e: any) => {
    const value = e.target.value;
    let updatedRoles: string[];
    
    if (formData.housekeepingRole.includes(value)) {
      // Remove if already selected
      updatedRoles = formData.housekeepingRole.filter(role => role !== value);
      // Clear related fields when service is deselected
      if (value === "COOK") {
        setFormData(prev => ({ ...prev, cookingSpeciality: "" }));
      }
      if (value === "NANNY") {
        setFormData(prev => ({ ...prev, nannyCareType: "" }));
      }
    } else {
      // Add if not selected
      updatedRoles = [...formData.housekeepingRole, value];
    }
    
    setFormData(prev => ({ ...prev, housekeepingRole: updatedRoles }));
    setIsCookSelected(updatedRoles.includes("COOK"));
    setIsNannySelected(updatedRoles.includes("NANNY"));
    
    // Clear error if at least one role is selected
    if (updatedRoles.length > 0) {
      setErrors(prev => ({ ...prev, housekeepingRole: "" }));
    }
  };

  // Handle diet change
  const handledietChange = (e: any) => {
    const { value } = e.target;
    setFormData((prevData) => ({ ...prevData, diet: value }));
    setErrors(prevErrors => ({ ...prevErrors, diet: "" }));
  };

  // Handle experience change
  const handleExperienceChange = (e: any) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, experience: value }));
    setErrors(prev => ({ ...prev, experience: "" }));
  };

  // Handle description change
  const handleDescriptionChange = (e: any) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, description: value }));
  };

  // Handle referral code change
  const handleReferralCodeChange = (e: any) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, referralCode: value }));
  };

  // Handle document upload
  const handleDocumentUpload = (file: RNFile | null) => {
    setFormData(prev => ({ ...prev, documentImage: file }));
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
      onDobChange={(e) => {
        // e.target.value contains the date in YYYY-MM-DD format
        const formattedDate = e.target.value;
        
        // Create a Date object for the DateTimePicker if needed
        if (formattedDate) {
          const dateObj = new Date(formattedDate);
          // Call your existing handleDateChange with the proper format
          // Since handleDateChange expects a different signature, we need to adapt it
          handleDateChange(null, dateObj);
        } else {
          handleDateChange(null, undefined);
        }
        
        // Also directly update the formData if needed
        setFormData(prev => ({ ...prev, dob: formattedDate }));
        
        // Validate age
        if (formattedDate) {
          const { isValid, message } = validateAge(formattedDate);
          setIsDobValid(isValid);
          if (!isValid) {
            setErrors(prev => ({ ...prev, dob: message }));
          } else {
            setErrors(prev => ({ ...prev, dob: "" }));
          }
        }
      }}
      onTogglePasswordVisibility={handleTogglePasswordVisibility}
      onToggleConfirmPasswordVisibility={handleToggleConfirmPasswordVisibility}
      onClearEmail={handleClearEmail}
      onClearMobile={handleClearMobile}
      onClearAlternate={handleClearAlternate}
    />
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
            onCookingSpecialityChange={(e) => handleCookingSpecialityChange(e.target.value)}
            onNannyCareTypeChange={(e) => handleNannyCareTypeChange(e.target.value)}
            onDietChange={handledietChange}
            onExperienceChange={handleExperienceChange}
            onDescriptionChange={handleDescriptionChange}
            onReferralCodeChange={handleReferralCodeChange}
            onFullTimeToggle={handleFullTimeToggle}
            onAddMorningSlot={handleAddMorningSlot}
            onRemoveMorningSlot={handleRemoveMorningSlot}
            onClearMorningSlots={handleClearMorningSlots}
            onAddEveningSlot={handleAddEveningSlot}
            onRemoveEveningSlot={handleRemoveEveningSlot}
            onClearEveningSlots={handleClearEveningSlots}
            onMorningSlotChange={handleMorningSlotChange}
            onEveningSlotChange={handleEveningSlotChange}
          />
        );

      case 3:
        return (
          <KYCVerification
            formData={formData}
            errors={errors}
            onFieldChange={handleRealTimeValidation}
            onFieldFocus={(fieldName) => setErrors(prev => ({ ...prev, [fieldName]: "" }))}
            onDocumentUpload={handleDocumentUpload}
            onKycTypeChange={handleKycTypeChange}
          />
        );

      case 4:
        return (
          <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
            <Text style={styles.confirmationText}>
              Please agree to the following before proceeding with your Registration:
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
            {errors.keyFacts && <Text style={styles.errorText}>{errors.keyFacts}</Text>}
            {errors.terms && <Text style={styles.errorText}>{errors.terms}</Text>}
            {errors.privacy && <Text style={styles.errorText}>{errors.privacy}</Text>}
          </ScrollView>
        );

      default:
        return <Text>Unknown step</Text>;
    }
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

  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent={false}
    >
      <View style={styles.container}>
        {/* Updated Header with Linear Gradient */}
        <LinearGradient
          colors={["#0a2a66ff", "#004aadff"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerContainer}
        >
          <Text style={styles.title}>Service Provider Registration</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => onBackToLogin(true)}
          >
            <Icon name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>

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

        {/* Policy Modal - Updated with Linear Gradient Header */}
        <Modal
          visible={policyModalVisible}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setPolicyModalVisible(false)}
        >
          <View style={styles.policyModalContainer}>
            <LinearGradient
              colors={["#0a2a66ff", "#004aadff"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.policyModalHeader}
            >
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
            </LinearGradient>
            <ScrollView style={styles.policyModalContent}>
              {renderPolicyContent()}
            </ScrollView>
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

// [Keep all the existing styles from the old code]
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  title: {
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
  inputError: {
    borderColor: '#f44336',
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
  sliderWrapper: {
    height: 40,
    position: 'relative',
  },
  sliderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    padding: 16,
  },
  disabledRangesContainer: {
    position: 'relative',
    width: '100%',
    height: 4,
    marginTop: 8,
    marginBottom: 16,
  },
  disabledRangesTrack: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
  },
  disabledRange: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#ff9800',
    opacity: 0.5,
    borderRadius: 2,
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
  inputFlex: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 12,
  },
  profileImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
});

export default ServiceProviderRegistration;