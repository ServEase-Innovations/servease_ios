/* eslint-disable */
import React, { useEffect, useState, useCallback, useRef, useMemo } from "react";
import moment from "moment";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
  Linking,
  Dimensions,
  Keyboard,
  Animated,
  AppState,
} from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
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
import { PERMISSIONS, request, check, RESULTS } from "react-native-permissions";
import { useSelector } from "react-redux";
import MapComponent from "../MapComponent/MapComponent";
import {
  formatServiceAddressFromGeoLocation,
  resolveLocationCoords,
} from "../utils/bookingLocation";
import ProfileImageUpload from "./ProfileImageUpload";
import DateTimePicker from '@react-native-community/datetimepicker';
import TnC from "../TermsAndConditions/TnC";
import PrivacyPolicy from "../TermsAndConditions/PrivacyPolicy";
import KeyFactsStatement from "../TermsAndConditions/KeyFactsStatement";
import { HomeHeroPageHeader } from "../common/HomeHeroPageHeader";
import { HOME_M3 } from "../theme/brandColors";
import { Button } from "../common/Button";
import {
  RegistrationAndroidKeyboardBar,
  RegistrationKeyboardAccessory,
} from "../common/RegistrationKeyboardAccessory";
import { useTheme } from "../../src/Settings/ThemeContext";
import { useAuth0 } from "react-native-auth0";

// Import the new components
import BasicInformation from "./BasicInformation";
import ServiceDetails from "./ServiceDetails";
import KYCVerification from "./KYCVerification";
import BankDetails, { BankDetailsData, BankDetailsErrors } from "./BankDetails";
import providerInstance from "../services/providerInstance";
import { API_URLS } from "../config/apiUrls";
import { Portal } from "react-native-paper";
import {
  clearSpRegistrationDraft,
  hasMeaningfulDraft,
  loadSpRegistrationDraft,
  sanitizeFormDataForDraft,
  saveSpRegistrationDraft,
} from "./spRegistrationDraft";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.94;
const SHEET_RADIUS = 18;

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
  // NEW: Bank details
  bankDetails: BankDetailsData;
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
  agentReferralId?: string;
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
  // NEW: Bank details errors
  bankDetails?: BankDetailsErrors;
}

// Regex for validation (kept for optional format checks)
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

const createEmptySpFormData = (): FormData => ({
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
    pincode: "",
  },
  correspondenceAddress: {
    apartment: "",
    street: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
  },
  bankDetails: {
    bankName: "",
    ifscCode: "",
    accountHolderName: "",
    accountNumber: "",
    accountType: "",
    upiId: "",
  },
});

const mergeLoadedSpFormData = (partial: Record<string, unknown>): FormData => {
  const base = createEmptySpFormData();
  const permanent = (partial.permanentAddress as FormData["permanentAddress"]) ?? {};
  const correspondence =
    (partial.correspondenceAddress as FormData["correspondenceAddress"]) ?? {};
  const bankDetails = (partial.bankDetails as FormData["bankDetails"]) ?? {};

  return {
    ...base,
    ...(partial as Partial<FormData>),
    panImage: null,
    documentImage: null,
    profileImage: null,
    permanentAddress: { ...base.permanentAddress, ...permanent },
    correspondenceAddress: { ...base.correspondenceAddress, ...correspondence },
    bankDetails: { ...base.bankDetails, ...bankDetails },
    housekeepingRole: Array.isArray(partial.housekeepingRole)
      ? (partial.housekeepingRole as string[])
      : base.housekeepingRole,
  };
};

interface RegistrationProps {
  onBackToLogin: (data: boolean) => void;
  onRegistrationSuccess?: () => void;
}

interface RegistrationContentProps extends RegistrationProps {
  onDismiss: () => void;
}

const ServiceProviderRegistration: React.FC<RegistrationProps> = (props) => (
  <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={() => props.onBackToLogin(true)}>
    <SafeAreaProvider>
      <RegistrationSheetHost {...props} />
    </SafeAreaProvider>
  </Modal>
);

const RegistrationSheetHost: React.FC<RegistrationProps> = (props) => {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const dismissWithAnimation = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      slideAnim.setValue(SCREEN_HEIGHT);
      fadeAnim.setValue(0);
      props.onBackToLogin(true);
    });
  }, [slideAnim, fadeAnim, props]);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 9,
        tension: 70,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, fadeAnim]);

  return (
    <View style={styles.modalRoot}>
      <Animated.View style={[styles.sheetOverlay, { opacity: fadeAnim }]}>
        <TouchableWithoutFeedback onPress={dismissWithAnimation}>
          <View style={styles.sheetOverlayTap} />
        </TouchableWithoutFeedback>
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          {
            maxHeight: SHEET_MAX_HEIGHT,
            paddingBottom: Math.max(insets.bottom, 8),
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <ServiceProviderRegistrationContent {...props} onDismiss={dismissWithAnimation} />
      </Animated.View>
    </View>
  );
};

const ServiceProviderRegistrationContent: React.FC<RegistrationContentProps> = ({
  onBackToLogin,
  onRegistrationSuccess,
  onDismiss,
}) => {
  const insets = useSafeAreaInsets();
  const { user: auth0User } = useAuth0();
  const auth0LoginEmail = (auth0User?.email ?? "").trim().toLowerCase();
  const isAuth0Authenticated = Boolean(auth0LoginEmail);
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
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [pendingMapSelection, setPendingMapSelection] = useState<{
    lat: number;
    lng: number;
    locationData: any;
  } | null>(null);
  const geoLocation = useSelector(
    (state: { geoLocation?: { value?: unknown } }) => state?.geoLocation?.value
  );
  const [isSameAddress, setIsSameAddress] = useState(false);
  const [isDobValid, setIsDobValid] = useState(true);
  const [useCustomPassword, setUseCustomPassword] = useState(() => !auth0LoginEmail);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);
  
  // Add selectedLanguages state
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  // NEW: State for KYC document upload
  const [kycDocumentUrl, setKycDocumentUrl] = useState<string>("");
  const [isKycUploading, setIsKycUploading] = useState(false);

  // Policy modal states
  const [policyModalVisible, setPolicyModalVisible] = useState(false);
  const [activePolicy, setActivePolicy] = useState<'terms' | 'privacy' | 'keyfacts'>('terms');

  // Date Picker State
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // State to track if next button should be disabled - NOW ALWAYS FALSE (no validation blocking)
  const [isNextDisabled, setIsNextDisabled] = useState(false);

  const [formData, setFormData] = useState<FormData>(createEmptySpFormData);
  const [draftReady, setDraftReady] = useState(false);
  const restoredDraftRef = useRef(false);

  const [errors, setErrors] = useState<FormErrors>({});

  // NEW: Handler for bank details field changes
  const handleBankFieldChange = (fieldName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails,
        [fieldName]: value
      }
    }));
    if (errors.bankDetails && errors.bankDetails[fieldName as keyof BankDetailsErrors]) {
      setErrors(prev => ({
        ...prev,
        bankDetails: {
          ...prev.bankDetails,
          [fieldName]: ""
        }
      }));
    }
  };

  const handleBankFieldFocus = (fieldName: string) => {
    if (errors.bankDetails && errors.bankDetails[fieldName as keyof BankDetailsErrors]) {
      setErrors(prev => ({
        ...prev,
        bankDetails: {
          ...prev.bankDetails,
          [fieldName]: ""
        }
      }));
    }
  };

  const buildDraftSnapshot = useCallback(
    () => ({
      activeStep,
      formData: sanitizeFormDataForDraft(formData as unknown as Record<string, unknown>),
      selectedLanguages,
      isCookSelected,
      isNannySelected,
      currentLocation,
      isSameAddress,
      kycDocumentUrl,
      useCustomPassword,
      selectedDate: selectedDate ? selectedDate.toISOString() : null,
    }),
    [
      activeStep,
      formData,
      selectedLanguages,
      isCookSelected,
      isNannySelected,
      currentLocation,
      isSameAddress,
      kycDocumentUrl,
      useCustomPassword,
      selectedDate,
    ]
  );

  const persistDraftNow = useCallback(() => {
    if (!draftReady) return;
    const snapshot = buildDraftSnapshot();
    if (!hasMeaningfulDraft({ version: 1, savedAt: Date.now(), ...snapshot })) {
      return;
    }
    void saveSpRegistrationDraft(snapshot);
  }, [buildDraftSnapshot, draftReady]);

  const debouncedPersistDraft = useMemo(
    () => debounce(() => persistDraftNow(), 500),
    [persistDraftNow]
  );

  // Initialize Geocoder
  useEffect(() => {
    Geocoder.init(keys.api_key);
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      const draft = await loadSpRegistrationDraft();
      if (!active || !draft || !hasMeaningfulDraft(draft)) {
        if (active) setDraftReady(true);
        return;
      }

      restoredDraftRef.current = true;
      setActiveStep(Math.min(Math.max(draft.activeStep, 0), steps.length - 1));
      setFormData(mergeLoadedSpFormData(draft.formData));
      setSelectedLanguages(draft.selectedLanguages ?? []);
      setIsCookSelected(Boolean(draft.isCookSelected));
      setIsNannySelected(Boolean(draft.isNannySelected));
      setCurrentLocation(draft.currentLocation ?? null);
      setIsSameAddress(Boolean(draft.isSameAddress));
      setKycDocumentUrl(draft.kycDocumentUrl ?? "");
      setUseCustomPassword(Boolean(draft.useCustomPassword));
      if (draft.selectedDate) {
        const parsed = new Date(draft.selectedDate);
        if (!Number.isNaN(parsed.getTime())) {
          setSelectedDate(parsed);
        }
      }
      if (active) {
        setDraftReady(true);
        setSnackbarMessage("Your registration progress was restored.");
        setSnackbarSeverity("info");
        setSnackbarOpen(true);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!draftReady) return;
    debouncedPersistDraft();
  }, [draftReady, debouncedPersistDraft, buildDraftSnapshot]);

  useEffect(() => {
    if (!draftReady) return;

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "background" || nextState === "inactive") {
        persistDraftNow();
      }
    });

    return () => subscription.remove();
  }, [draftReady, persistDraftNow]);

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

  useEffect(() => {
    if (!draftReady || !auth0LoginEmail) return;
    setFormData((prev) => ({
      ...prev,
      emailId: auth0LoginEmail,
    }));
    validateField("email", auth0LoginEmail);
  }, [auth0LoginEmail, validateField, draftReady]);

  useEffect(() => {
    if (auth0LoginEmail) {
      setUseCustomPassword(false);
      setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
      setErrors((prev) => ({ ...prev, password: "", confirmPassword: "" }));
    } else {
      setUseCustomPassword(true);
    }
  }, [auth0LoginEmail]);

  const handleCustomPasswordModeChange = useCallback((custom: boolean) => {
    setUseCustomPassword(custom);
    if (!custom) {
      setFormData((prev) => ({ ...prev, password: "", confirmPassword: "" }));
      setErrors((prev) => ({ ...prev, password: "", confirmPassword: "" }));
    }
  }, []);

  const scrollInputIntoView = useCallback((fieldRef: View | null) => {
    if (!fieldRef || !scrollViewRef.current) return;

    const scrollDelay = Platform.OS === "ios" ? 280 : 120;
    setTimeout(() => {
      fieldRef.measureInWindow((_x, y, _w, fieldHeight) => {
        const keyboardHeight = Keyboard.metrics()?.height ?? 0;
        const windowHeight = Dimensions.get("window").height;
        const fieldBottom = y + fieldHeight;
        const visibleBottom = windowHeight - keyboardHeight - 40;

        if (fieldBottom > visibleBottom) {
          const delta = fieldBottom - visibleBottom;
          scrollViewRef.current?.scrollTo({
            y: scrollYRef.current + delta,
            animated: true,
          });
        }
      });
    }, scrollDelay);
  }, []);

  // Helper function to check if step 0 is ready for next - **NOW ALWAYS TRUE**
  const isStep0ReadyForNext = () => {
    // All fields are optional - always allow next
    return true;
  };

  const checkStepCompletion = useCallback(() => {
    // NO VALIDATION - Always allow next/submit
    setIsNextDisabled(false);
  }, []);

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
        return <PrivacyPolicy embedded />;
      case 'keyfacts':
        return <KeyFactsStatement />;
      default:
        return null;
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

  // NEW: Function to upload KYC document
  const handleKycDocumentUpload = async (file: RNFile | null) => {
    if (!file) {
      setKycDocumentUrl("");
      setFormData(prev => ({ ...prev, documentImage: null }));
      return;
    }

    setIsKycUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", {
        uri: file.uri,
        type: file.type || 'image/jpeg',
        name: file.name || 'kyc_document.jpg'
      } as any);

      const response = await axios.post(
        `${API_URLS.imageUploader}/api/files/upload-file`,
        uploadFormData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status === 200 || response.status === 201) {
        const url =
          response.data.file?.url ||
          response.data.fileUrl ||
          response.data.url ||
          response.data.imageUrl ||
          "";
        if (url) {
          setKycDocumentUrl(url);
          setFormData(prev => ({ ...prev, documentImage: file }));
          showSnackbar("KYC document uploaded successfully", "success");
        } else {
          throw new Error("No URL returned");
        }
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("KYC upload error:", error);
      showSnackbar("Failed to upload KYC document", "error");
      setKycDocumentUrl("");
      setFormData(prev => ({ ...prev, documentImage: null }));
    } finally {
      setIsKycUploading(false);
    }
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

      // Optional validation - just for UX, not blocking
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

  // Updated handleRealTimeValidation - only shows validation errors for UX, never blocks submission
  const handleRealTimeValidation = (e: any) => {
    const { name, value } = e.target;
    
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }

    // Optional validation for UX only - never prevents submission
    if (name === "firstName" && value.trim()) {
      const trimmedValue = value.trim();
      if (!nameRegex.test(trimmedValue)) {
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

    if (name === "lastName" && value.trim()) {
      const trimmedValue = value.trim();
      if (!nameRegex.test(trimmedValue)) {
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

    if (name === "password" && value.trim()) {
      if (value.length < 8) {
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

    if (name === "confirmPassword" && value.trim()) {
      if (value !== formData.password) {
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

    if (name === "emailId" && value.trim()) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const trimmedValue = value.trim();

      if (!emailPattern.test(trimmedValue)) {
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
    } else if (name === "emailId" && !value.trim()) {
      resetValidation('email');
    }

    if (name === "mobileNo" && value.trim()) {
      const mobilePattern = /^[0-9]{10}$/;
      const trimmedValue = value.trim();

      if (!mobilePattern.test(trimmedValue)) {
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
    } else if (name === "mobileNo" && !value.trim()) {
      resetValidation('mobile');
    }

    if (name === "AlternateNumber" && value.trim()) {
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
    } else if (name === "AlternateNumber" && !value.trim()) {
      resetValidation('alternate');
    }

    if (name === "kycNumber" && value.trim()) {
      const trimmedValue = value.trim();
      setFormData(prev => ({ ...prev, kycNumber: trimmedValue }));

      // Optional validation for UX only
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
    } else if (name === "kycNumber" && !value.trim()) {
      setErrors(prev => ({ ...prev, kycNumber: "" }));
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
      [name]: name === "emailId" ? String(value).trim().toLowerCase() : value,
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

  const handleTimeSlotsChange = useCallback((timeslot: string) => {
    setFormData((prev) => {
      if (prev.timeslot === timeslot) {
        return prev;
      }
      return { ...prev, timeslot };
    });
  }, []);

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
      setLocationLoading(true);

      const storedCoords = resolveLocationCoords(geoLocation);
      if (storedCoords) {
        showSnackbar("Using your saved location...", "info");
        try {
          const storedAddress = formatServiceAddressFromGeoLocation(geoLocation);
          const res = await Geocoder.from(storedCoords.lat, storedCoords.lng);
          const address = res.results[0]?.formatted_address || storedAddress;
          const components = res.results[0]?.address_components || [];
          applyAddressFromGeocode(storedCoords.lat, storedCoords.lng, address, components);
          showSnackbar("Location fetched successfully!", "success");
        } catch (error) {
          console.error("Stored location geocoding error:", error);
          showSnackbar("Error getting address from saved location", "warning");
        } finally {
          setLocationLoading(false);
        }
        return;
      }

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
        setLocationLoading(false);
        return;
      }

      showSnackbar("Fetching your location...", "info");

      Geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            const res = await Geocoder.from(latitude, longitude);
            const address = res.results[0]?.formatted_address || "";
            const components = res.results[0]?.address_components || [];
            applyAddressFromGeocode(latitude, longitude, address, components);
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
        { enableHighAccuracy: Platform.OS === 'ios', timeout: 15000, maximumAge: 10000 }
      );
    } catch (error) {
      console.error("Location fetch error:", error);
      showSnackbar("Unable to fetch your location. Please try again.", "error");
      setLocationLoading(false);
    }
  };

  const applyAddressFromGeocode = (
    latitude: number,
    longitude: number,
    address: string,
    addressComponents: any[]
  ) => {
    const parsedAddress = parseAddressComponents(addressComponents);

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

    setFormData(prev => {
      const newPermanentAddress = {
        ...prev.permanentAddress,
        ...addressData,
      };
      const newCorrespondenceAddress = isSameAddress
        ? newPermanentAddress
        : prev.correspondenceAddress;

      return {
        ...prev,
        latitude,
        longitude,
        currentLocation: address,
        street: addressData.street,
        locality: addressData.city,
        pincode: addressData.pincode,
        buildingName: addressData.apartment,
        permanentAddress: newPermanentAddress,
        correspondenceAddress: newCorrespondenceAddress,
      };
    });

    setCurrentLocation({
      latitude,
      longitude,
      address,
    });
  };

  const handleMapLocationSelect = (data: { address: any; lat: number; lng: number }) => {
    const locationData = Array.isArray(data.address) ? data.address[0] : data.address;
    setPendingMapSelection({
      lat: data.lat,
      lng: data.lng,
      locationData,
    });
  };

  const handleSaveMapSelection = () => {
    if (!pendingMapSelection) {
      showSnackbar("Please select a location from map first", "warning");
      return;
    }

    const { lat, lng, locationData } = pendingMapSelection;
    const address = locationData?.formatted_address || "";
    const components = locationData?.address_components || [];
    applyAddressFromGeocode(lat, lng, address, components);
    setIsSameAddress(true);
    setMapPickerOpen(false);
    setPendingMapSelection(null);
    showSnackbar("Location saved to address fields", "success");
  };

  const getMapInitialCenter = () => {
    if (formData.latitude !== 0 || formData.longitude !== 0) {
      return { lat: formData.latitude, lng: formData.longitude };
    }

    const storedCoords = resolveLocationCoords(geoLocation);
    if (storedCoords) {
      return storedCoords;
    }

    return null;
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
        const currentStatus = await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
        if (currentStatus === RESULTS.GRANTED) {
          return true;
        }
        const fineStatus = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
        return fineStatus === RESULTS.GRANTED;
      } else if (Platform.OS === "ios") {
        const currentStatus = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        if (currentStatus === RESULTS.GRANTED || currentStatus === RESULTS.LIMITED) {
          return true;
        }
        const iosStatus = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
        return iosStatus === RESULTS.GRANTED || iosStatus === RESULTS.LIMITED;
      }
      return false;
    } catch (err) {
      console.warn("Permission error:", err);
      return false;
    }
  };

  // ============================================================
  // VALIDATION IS NOW DISABLED FOR ALL STEPS
  // ============================================================
  const validateStep = (step: number): boolean => {
    // All steps are always valid - no required fields
    return true;
  };

  const handleNext = () => {
    // No validation needed - just proceed
    setActiveStep((prevStep) => Math.min(prevStep + 1, steps.length - 1));
    // Scroll to top when step changes
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    if (activeStep === steps.length - 1) {
      showSnackbar("Registration form completed!", "success");
    }
  };

  const handleBack = () => {
    if (activeStep === 0) {
      onDismiss();
    } else {
      setActiveStep((prevActiveStep) => prevActiveStep - 1);
      // Scroll to top when step changes
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  };
  
  const areTermsAccepted = (): boolean => {
    return Boolean(formData.terms && formData.privacy && formData.keyFacts);
  };

  const handleSubmit = async () => {
    if (activeStep !== steps.length - 1) return;

    if (!areTermsAccepted()) {
      showSnackbar("Please accept all agreements before submitting.", "error");
      return;
    }

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

        const imageResponse = await axios.post(
          `${API_URLS.imageUploader}/api/images/upload`,
          profileFormData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (imageResponse.status === 200) {
          profilePicUrl = imageResponse.data.imageUrl || imageResponse.data.url || "";
        }
      }

      let uploadedKycUrl = kycDocumentUrl;
      if (!uploadedKycUrl && formData.documentImage) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", {
          uri: formData.documentImage.uri,
          type: formData.documentImage.type || "image/jpeg",
          name: formData.documentImage.name || "kyc_document.jpg",
        } as any);

        const uploadResponse = await axios.post(
          `${API_URLS.imageUploader}/api/files/upload-file`,
          uploadFormData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (uploadResponse.status === 200 || uploadResponse.status === 201) {
          uploadedKycUrl =
            uploadResponse.data.file?.url ||
            uploadResponse.data.fileUrl ||
            uploadResponse.data.url ||
            "";
          if (!uploadedKycUrl) {
            throw new Error("No URL returned from KYC upload");
          }
        } else {
          throw new Error("KYC upload failed");
        }
      }
      
      const selectedServices = formData.housekeepingRole;
      
      const toNull = (value: any) => (value === "" ? null : value);

      const registrationEmail = (
        isAuth0Authenticated && auth0LoginEmail
          ? auth0LoginEmail
          : (formData.emailId || "").trim().toLowerCase()
      );
      if (!registrationEmail) {
        setIsSubmitting(false);
        showSnackbar(
          "Email is required. Sign in with Auth0 first or enter the same email you will use to log in.",
          "error"
        );
        return;
      }

      const resolvedKycUrl = uploadedKycUrl || null;

      const payload = {
        firstName: toNull(formData.firstName),
        middleName: toNull(formData.middleName),
        lastName: toNull(formData.lastName),
        mobileNo: formData.mobileNo ? parseInt(formData.mobileNo) : null,
        alternateNo: formData.AlternateNumber ? parseInt(formData.AlternateNumber) : null,
        emailId: registrationEmail,
        gender: toNull(formData.gender),
        buildingName: toNull(formData.buildingName),
        locality: toNull(formData.locality),
        latitude: currentLocation?.latitude || formData.latitude || null,
        longitude: currentLocation?.longitude || formData.longitude || null,
        street: toNull(formData.street),
        pincode: formData.pincode ? parseInt(formData.pincode) : null,
        currentLocation: toNull(formData.currentLocation),
        nearbyLocation: toNull(formData.nearbyLocation),
        location: toNull(formData.currentLocation),
        housekeepingRoles: selectedServices.length ? selectedServices : null,
        serviceTypes: selectedServices.length ? selectedServices : null,
        diet: toNull(formData.diet),
        languages: selectedLanguages.length ? selectedLanguages : null,
        ...(selectedServices.includes("COOK") && formData.cookingSpeciality && {
          cookingSpeciality: formData.cookingSpeciality
        }),
        ...(selectedServices.includes("NANNY") && formData.nannyCareType && {
          nannyCareType: formData.nannyCareType
        }),
        timeslot: toNull(formData.timeslot),
        expectedSalary: 0,
        experience: formData.experience ? parseInt(formData.experience) : null,
        username: registrationEmail,
        password: toNull(formData.password),
        agentReferralId: toNull(formData.agentReferralId),
        privacy: formData.privacy || false,
        keyFacts: formData.keyFacts || false,
        permanentAddress: {
          field1: toNull(formData.permanentAddress.apartment),
          field2: toNull(formData.permanentAddress.street),
          ctarea: toNull(formData.permanentAddress.city),
          pinno: toNull(formData.permanentAddress.pincode),
          state: toNull(formData.permanentAddress.state),
          country: toNull(formData.permanentAddress.country)
        },
        correspondenceAddress: {
          field1: toNull(formData.correspondenceAddress.apartment),
          field2: toNull(formData.correspondenceAddress.street),
          ctarea: toNull(formData.correspondenceAddress.city),
          pinno: toNull(formData.correspondenceAddress.pincode),
          state: toNull(formData.correspondenceAddress.state),
          country: toNull(formData.correspondenceAddress.country)
        },
        active: true,
        kycType: toNull(formData.kycType),
        kycNumber: toNull(formData.kycNumber),
        kycDocumentUrl: resolvedKycUrl,
        kycImage: resolvedKycUrl,
        dob: toNull(formData.dob),
        ...(profilePicUrl ? { profilePic: profilePicUrl } : {}),
        bankName: toNull(formData.bankDetails.bankName),
        ifscCode: toNull(formData.bankDetails.ifscCode),
        accountHolderName: toNull(formData.bankDetails.accountHolderName),
        accountNumber: toNull(formData.bankDetails.accountNumber),
        accountType: toNull(formData.bankDetails.accountType),
        upiId: toNull(formData.bankDetails.upiId),
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

      const created = response.data?.data ?? response.data;
      const spId =
        created?.serviceProviderId ??
        created?.serviceproviderid ??
        created?.id;
      if (spId != null && isAuth0Authenticated && auth0LoginEmail) {
        const storedEmail = String(created?.emailId ?? created?.emailid ?? "").toLowerCase();
        if (storedEmail !== auth0LoginEmail) {
          await providerInstance.put(`/api/service-providers/serviceprovider/${spId}`, {
            emailId: auth0LoginEmail,
          });
        }
      }

      showSnackbar("Registration successful!", "success");
      await clearSpRegistrationDraft();

      if (registrationEmail && formData.password) {
        const authPayload = {
          email: registrationEmail,
          password: formData.password,
          name: `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || "Service Provider",
        };

        axios.post(`${API_URLS.utils}/authO/create-autho-user`, authPayload)
          .then((authResponse) => {
            console.log("AuthO user created successfully:", authResponse.data);
          }).catch((authError) => {
            console.error("Error creating AuthO user:", authError);
          });
      }

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
  };

  const handleCloseSnackbar = () => {
    if (snackbarTimeout) {
      clearTimeout(snackbarTimeout);
      setSnackbarTimeout(null);
    }
    setSnackbarOpen(false);
  };

  // Validate age function - kept for informational purposes only (not blocking)
  const validateAge = (dob: string): { isValid: boolean; message: string } => {
    if (!dob) {
      return { isValid: true, message: "" }; // No error if empty
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
            lockAuth0Email={Boolean(auth0LoginEmail)}
            useCustomPassword={useCustomPassword}
            onCustomPasswordModeChange={handleCustomPasswordModeChange}
            onScrollInputIntoView={scrollInputIntoView}
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
              onScrollInputIntoView={scrollInputIntoView}
              locationSection={{
                onFetchLocation: fetchLocationData,
                onSelectFromMap: () => {
                  setPendingMapSelection(null);
                  setMapPickerOpen(true);
                },
                locationLoading,
                detectedAddress: formData.currentLocation || undefined,
                hasCoordinates: formData.latitude !== 0 || formData.longitude !== 0,
                savedAddressPreview: formatServiceAddressFromGeoLocation(geoLocation) || undefined,
              }}
            />
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
        return (
          <View style={styles.stepContainer}>
            <KYCVerification
              formData={formData}
              errors={errors}
              onFieldChange={handleRealTimeValidation}
              onFieldFocus={(fieldName) => setErrors(prev => ({ ...prev, [fieldName]: "" }))}
              onDocumentUpload={handleKycDocumentUpload}
              onKycTypeChange={handleKycTypeChange}
              isUploading={isKycUploading}
              uploadedUrl={kycDocumentUrl}
            />
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <BankDetails
              formData={formData.bankDetails}
              errors={errors.bankDetails || {}}
              onFieldChange={handleBankFieldChange}
              onFieldFocus={handleBankFieldFocus}
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
            {!areTermsAccepted() && (
              <Text style={[styles.termsHint, { color: colors.warning || "#ed6c02", fontSize: fontSizes.small }]}>
                Please accept all agreements above to enable the Submit button.
              </Text>
            )}
          </View>
        );

      default:
        return <Text style={{ color: colors.text, fontSize: fontSizes.text }}>Unknown step</Text>;
    }
  };

  const headerSubtext = `Step ${activeStep + 1} of ${steps.length}`;
  const surface = isDarkMode ? colors.surface : "#ffffff";
  const textPrimary = isDarkMode ? colors.text : "#0f172a";
  const textMuted = isDarkMode ? colors.textSecondary : "#64748b";
  const borderColor = isDarkMode ? colors.border : "#e2e8f0";

  return (
    <View style={[styles.sheetBody, { backgroundColor: isDarkMode ? colors.background : "#f8fafc" }]}>
      <View style={[styles.sheetHeader, { backgroundColor: surface, borderBottomColor: borderColor }]}>
        <View style={styles.headerAccent} />
        <View style={styles.handleRow}>
          <View style={[styles.sheetHandle, { backgroundColor: borderColor }]} />
        </View>
        <View style={styles.headerTitleRow}>
          <View style={styles.headerTextCol}>
            <Text style={[styles.headerEyebrow, { color: textMuted }]}>Registration</Text>
            <Text style={[styles.sheetHeaderTitle, { color: textPrimary }]}>
              Service Provider
            </Text>
            <Text style={[styles.headerSub, { color: textMuted }]} numberOfLines={1}>
              {headerSubtext}
            </Text>
          </View>
          <TouchableOpacity
            onPress={onDismiss}
            style={[styles.sheetCloseBtn, { backgroundColor: isDarkMode ? colors.card : "#f1f5f9" }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Close registration"
            accessibilityRole="button"
          >
            <Icon name="close" size={22} color={textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.keyboardView}>
        <RegistrationKeyboardAccessory />
        <RegistrationAndroidKeyboardBar />
        <View style={[styles.container, { backgroundColor: isDarkMode ? colors.background : "#f8fafc" }]}>
          <ScrollView
            ref={scrollViewRef}
            style={[styles.content, { backgroundColor: isDarkMode ? colors.background : "#f8fafc" }]}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[
              styles.contentContainer,
              { paddingBottom: Math.max(insets.bottom, 16) + 48 },
            ]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
            onScroll={(event) => {
              scrollYRef.current = event.nativeEvent.contentOffset.y;
            }}
            scrollEventThrottle={16}
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
                    disabled={isSubmitting || !areTermsAccepted()}
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

            {policyModalVisible && (
              <Portal>
              <View style={[styles.policyModalContainer, { backgroundColor: HOME_M3.surface }]}>
                <HomeHeroPageHeader
                  title={
                    activePolicy === "terms"
                      ? "Terms and Conditions"
                      : activePolicy === "privacy"
                        ? "Privacy Policy"
                        : "Key Facts Statement"
                  }
                  onBack={() => setPolicyModalVisible(false)}
                  backIcon="close"
                />
                <ScrollView style={[styles.policyModalContent, { backgroundColor: HOME_M3.surface }]}>
                  {renderPolicyContent()}
                </ScrollView>
              </View>
              </Portal>
            )}

            {snackbarOpen && (
              <View style={[styles.snackbar, styles[`snackbar${snackbarSeverity}`], { backgroundColor: colors[snackbarSeverity] || colors.primary }]}>
                <Text style={[styles.snackbarText, { color: '#fff', fontSize: fontSizes.text }]}>{snackbarMessage}</Text>
                <TouchableOpacity onPress={handleCloseSnackbar}>
                  <Icon name="close" size={20} color="white" />
                </TouchableOpacity>
              </View>
            )}

            <Modal
              visible={mapPickerOpen}
              animationType="slide"
              onRequestClose={() => setMapPickerOpen(false)}
            >
              <View style={[styles.mapPickerModal, { backgroundColor: colors.background }]}>
                <View style={[styles.mapPickerHeader, { borderBottomColor: colors.border, paddingTop: Math.max(insets.top, 14) }]}>
                  <Text style={[styles.mapPickerTitle, { color: colors.text, fontSize: fontSizes.heading }]}>
                    Select location from map
                  </Text>
                  <TouchableOpacity onPress={() => setMapPickerOpen(false)}>
                    <Icon name="close" size={22} color={colors.text} />
                  </TouchableOpacity>
                </View>

                <View style={styles.mapPickerBody}>
                  <MapComponent
                    style={styles.mapPickerComponent}
                    onLocationSelect={handleMapLocationSelect}
                    initialCenter={getMapInitialCenter()}
                    savedLocation={geoLocation}
                  />

                  <Text style={[styles.mapPickerHint, { color: colors.textSecondary, fontSize: fontSizes.text }]}>
                    Click on the map to choose the exact service address, then press Save location.
                  </Text>

                  {pendingMapSelection ? (
                    <View style={[styles.mapPickerSelection, { backgroundColor: colors.infoLight, borderColor: colors.primary }]}>
                      <Text style={[styles.mapPickerSelectionText, { color: colors.primary, fontSize: fontSizes.small }]}>
                        Selected: {pendingMapSelection.lat.toFixed(6)}, {pendingMapSelection.lng.toFixed(6)}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.mapPickerActions}>
                    <TouchableOpacity
                      style={[styles.mapPickerCancelButton, { borderColor: colors.border }]}
                      onPress={() => setMapPickerOpen(false)}
                    >
                      <Text style={{ color: colors.text, fontSize: fontSizes.button }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.mapPickerSaveButton,
                        { backgroundColor: colors.primary },
                        !pendingMapSelection && styles.buttonDisabled,
                      ]}
                      onPress={handleSaveMapSelection}
                      disabled={!pendingMapSelection}
                    >
                      <Text style={{ color: "#fff", fontWeight: "600", fontSize: fontSizes.button }}>
                        Save location
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(2, 6, 23, 0.72)",
  },
  sheetOverlayTap: {
    flex: 1,
  },
  sheet: {
    width: SCREEN_WIDTH,
    height: SHEET_MAX_HEIGHT,
    backgroundColor: "#f8fafc",
    borderTopLeftRadius: SHEET_RADIUS,
    borderTopRightRadius: SHEET_RADIUS,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 24,
  },
  sheetBody: {
    flex: 1,
  },
  sheetHeader: {
    borderBottomWidth: 1,
    flexShrink: 0,
  },
  headerAccent: {
    height: 4,
    width: "100%",
    backgroundColor: "#2563eb",
  },
  handleRow: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 4,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    borderRadius: 999,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  headerTextCol: {
    flex: 1,
    minWidth: 0,
  },
  headerEyebrow: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  sheetHeaderTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  headerSub: {
    fontSize: 13,
    marginTop: 2,
  },
  sheetCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
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
  locationButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  locationButtonHalf: {
    flex: 1,
    marginBottom: 0,
  },
  locationButtonOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  mapPickerModal: {
    flex: 1,
  },
  mapPickerHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },
  mapPickerTitle: {
    fontWeight: "700",
    flex: 1,
    paddingRight: 12,
  },
  mapPickerBody: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  mapPickerComponent: {
    flex: 1,
    minHeight: 420,
  },
  mapPickerHint: {
    lineHeight: 20,
  },
  mapPickerSelection: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  mapPickerSelectionText: {
    fontWeight: "500",
  },
  mapPickerActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    paddingTop: 4,
  },
  mapPickerCancelButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  mapPickerSaveButton: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 120,
    alignItems: "center",
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
  termsHint: {
    marginTop: 12,
    lineHeight: 20,
  },
  policyModalContainer: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
  },
  policyModalContent: {
    flex: 1,
    padding: 16,
  },
});

export default ServiceProviderRegistration;