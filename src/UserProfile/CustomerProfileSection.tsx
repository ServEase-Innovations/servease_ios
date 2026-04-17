// CustomerProfileSection.tsx
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store/userStore';
import { setHasMobileNumber } from '../features/customerSlice';
import { useAuth0 } from 'react-native-auth0';
import { useAppUser } from '../context/AppUserContext';
import Icon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import axiosInstance from '../services/axiosInstance';
import providerInstance from '../services/providerInstance';
import preferenceInstance from '../services/preferenceInstance'; // Changed from utilsInstance to preferenceInstance
import { useTheme } from '../../src/Settings/ThemeContext';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get('window');

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

interface UserData {
  firstName: string;
  lastName: string;
  contactNumber: string;
  altContactNumber: string;
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

interface CustomerProfileSectionProps {
  onBack?: () => void;
  userId?: number | null;
  userEmail?: string | null;
  initialData?: any;
  isExternalEdit?: boolean;
  setExternalEdit?: (val: boolean) => void;
}

const CustomerProfileSection: React.FC<CustomerProfileSectionProps> = ({
  onBack,
  userId: propUserId,
  userEmail: propUserEmail,
  initialData,
  isExternalEdit,
  setExternalEdit,
}) => {
  const dispatch = useDispatch();
  const { user: auth0User } = useAuth0();
  const { appUser } = useAppUser();
  const { colors, fontSize, isDarkMode } = useTheme();
  
  // Add refs for scroll handling
  const scrollViewRef = useRef<ScrollView>(null);
  const activeInputRef = useRef<View | null>(null);

  // Redux state
  const { customerId, hasMobileNumber: reduxHasMobileNumber } = useSelector(
    (state: RootState) => state.customer
  );

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<UserData>({
    firstName: '',
    lastName: '',
    contactNumber: '',
    altContactNumber: '',
  });
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [originalData, setOriginalData] = useState<OriginalData>({
    userData: { firstName: '', lastName: '', contactNumber: '', altContactNumber: '' },
    addresses: [],
  });
  const [expandedAddressIds, setExpandedAddressIds] = useState<string[]>([]);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    type: 'Home',
    customType: '',
    street: '',
    city: '',
    country: '',
    postalCode: '',
  });
  const [countryCode, setCountryCode] = useState('+91');
  const [altCountryCode, setAltCountryCode] = useState('+91');
  const [showCountryCodePicker, setShowCountryCodePicker] = useState(false);
  const [showAltCountryCodePicker, setShowAltCountryCodePicker] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Validation states
  const [contactValidation, setContactValidation] = useState<ValidationState>({
    loading: false,
    error: '',
    isAvailable: null,
    formatError: false,
  });
  const [altContactValidation, setAltContactValidation] = useState<ValidationState>({
    loading: false,
    error: '',
    isAvailable: null,
    formatError: false,
  });
  const [validatedFields, setValidatedFields] = useState<Set<string>>(new Set());

  // Get user ID from props or context
  const userId = propUserId || appUser?.customerid || customerId;
  const userEmail = propUserEmail || auth0User?.email || appUser?.email;

  // Derive hasMobileNumber from actual userData
  const hasMobileNumber = !!userData.contactNumber;

  // Keyboard listeners to prevent layout shift
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardVisible(true);
        // Disable LayoutAnimation during keyboard show to prevent glitch
        LayoutAnimation.configureNext({
          duration: 0,
          update: { type: 'linear', property: 'opacity' },
        });
      }
    );
    
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        // Disable LayoutAnimation during keyboard hide
        LayoutAnimation.configureNext({
          duration: 0,
          update: { type: 'linear', property: 'opacity' },
        });
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // Sync external edit state
  useEffect(() => {
    if (isExternalEdit !== undefined) {
      setIsEditing(isExternalEdit);
    }
  }, [isExternalEdit]);

  // Update Redux when mobile number changes
  useEffect(() => {
    if (hasMobileNumber) {
      dispatch(setHasMobileNumber(true));
    }
  }, [hasMobileNumber, dispatch]);

  // Get font sizes based on theme
  const getFontSizes = () => {
    switch (fontSize) {
      case 'small':
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
        };
      case 'large':
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
        };
    }
  };

  const fontSizes = getFontSizes();

  // Fetch customer details
  const fetchCustomerDetails = async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const response = await providerInstance.get(`/api/customer/${userId}`);
      const data = response.data?.data;

      const userDataFromApi = {
        firstName: data?.firstname || '',
        lastName: data?.lastname || '',
        contactNumber: data?.mobileno || '',
        altContactNumber: data?.alternateno || '',
      };

      setUserData(userDataFromApi);
      setOriginalData(prev => ({
        ...prev,
        userData: userDataFromApi,
      }));
    } catch (err) {
      console.error('Failed to fetch customer details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch customer addresses - Updated to use preferenceInstance
  const fetchCustomerAddresses = async (customerId: number) => {
    try {
      const response = await preferenceInstance.get(`/api/user-settings/${customerId}`);
      const data = response.data;

      if (Array.isArray(data) && data.length > 0) {
        const allSavedLocations = data.flatMap((doc: any) => doc.savedLocations || []);
        const uniqueAddresses = new Map();

        allSavedLocations
          .filter((loc: any) => loc.location?.address?.[0]?.formatted_address)
          .forEach((loc: any, idx: number) => {
            const primaryAddress = loc.location.address[0];
            const addressComponents = primaryAddress.address_components || [];

            const getComponent = (type: string) => {
              const component = addressComponents.find((c: any) => c.types.includes(type));
              return component?.long_name || '';
            };

            const locationKey =
              loc.location.lat && loc.location.lng
                ? `${loc.location.lat},${loc.location.lng}`
                : primaryAddress.formatted_address;

            if (!uniqueAddresses.has(locationKey)) {
              uniqueAddresses.set(locationKey, {
                id: loc._id || `addr_${idx}`,
                type: loc.name || 'Other',
                street: primaryAddress.formatted_address,
                city: getComponent('locality') || '',
                country: getComponent('country') || '',
                postalCode: getComponent('postal_code') || '',
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
        setOriginalData(prev => ({
          ...prev,
          addresses: mappedAddresses,
        }));
      }
    } catch (err) {
      console.error('Failed to fetch customer addresses:', err);
    }
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      if (userId) {
        if (initialData) {
          const userDataFromProps = {
            firstName: initialData.firstname || '',
            lastName: initialData.lastname || '',
            contactNumber: initialData.mobileno || '',
            altContactNumber: initialData.alternateno || '',
          };
          setUserData(userDataFromProps);
          setOriginalData(prev => ({
            ...prev,
            userData: userDataFromProps,
          }));
          setIsLoading(false);
          await fetchCustomerAddresses(userId);
        } else {
          await Promise.all([fetchCustomerDetails(), fetchCustomerAddresses(userId)]);
        }
      }
    };

    loadData();
  }, [userId, initialData]);

  // Validation functions
  const validateMobileFormat = (number: string): boolean => {
    return /^[0-9]{10}$/.test(number);
  };

  const checkMobileAvailability = async (
    number: string,
    isAlternate: boolean = false
  ): Promise<boolean> => {
    if (!number || !validateMobileFormat(number)) return false;

    const setValidation = isAlternate ? setAltContactValidation : setContactValidation;
    const fieldName = isAlternate ? 'altContactNumber' : 'contactNumber';

    setValidation({ loading: true, error: '', isAvailable: null, formatError: false });

    try {
      const response = await providerInstance.post('/api/service-providers/check-mobile', {
        mobile: number,
      });

      let isAvailable = true;
      let errorMessage = '';

      if (response.data.exists !== undefined) {
        isAvailable = !response.data.exists;
        errorMessage = response.data.exists
          ? isAlternate
            ? 'Alternate number is already registered'
            : 'Contact number is already registered'
          : '';
      }

      setValidation({
        loading: false,
        error: errorMessage,
        isAvailable,
        formatError: false,
      });

      if (isAvailable) {
        setValidatedFields(prev => new Set(prev).add(fieldName));
      }

      return isAvailable;
    } catch (error) {
      setValidation({
        loading: false,
        error: 'Something went wrong. Please try again.',
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

  // Input handlers with scroll adjustment
  const handleInputFocus = (event: any, inputRef: View) => {
    activeInputRef.current = inputRef;
    // Small delay to ensure keyboard is shown before scrolling
    setTimeout(() => {
      if (scrollViewRef.current && inputRef) {
        // Measure the input position and scroll to it
        inputRef.measureLayout(scrollViewRef.current as any, (x, y) => {
          scrollViewRef.current?.scrollTo({ y: y - 100, animated: true });
        });
      }
    }, 100);
  };

  const handleContactNumberChange = (value: string) => {
    const cleanedValue = value.replace(/\D/g, '').slice(0, 10);
    setUserData(prev => ({ ...prev, contactNumber: cleanedValue }));

    setContactValidation({
      loading: false,
      error: '',
      isAvailable: null,
      formatError: false,
    });

    if (cleanedValue.length === 10) {
      debouncedValidation(cleanedValue, false);
    } else if (cleanedValue) {
      setContactValidation({
        loading: false,
        error: 'Please enter exactly 10 digits',
        isAvailable: null,
        formatError: true,
      });
    }
  };

  const handleAltContactNumberChange = (value: string) => {
    const cleanedValue = value.replace(/\D/g, '').slice(0, 10);
    setUserData(prev => ({ ...prev, altContactNumber: cleanedValue }));

    setAltContactValidation({
      loading: false,
      error: '',
      isAvailable: null,
      formatError: false,
    });

    if (cleanedValue.length === 10) {
      if (cleanedValue === userData.contactNumber) {
        setAltContactValidation({
          loading: false,
          error: 'Contact numbers must be different',
          isAvailable: false,
          formatError: false,
        });
      } else {
        debouncedValidation(cleanedValue, true);
      }
    } else if (cleanedValue) {
      setAltContactValidation({
        loading: false,
        error: 'Please enter exactly 10 digits',
        isAvailable: null,
        formatError: true,
      });
    }
  };

  // Address functions - Updated to use preferenceInstance
  const saveAddressToUserSettings = async (addressData: any) => {
    if (!userId) return;

    try {
      const response = await preferenceInstance.get(`/api/user-settings/${userId}`);
      const currentSettings = response.data;

      let existingLocations = [];

      if (Array.isArray(currentSettings) && currentSettings.length > 0) {
        existingLocations = currentSettings[0].savedLocations || [];
      }

      const addressType =
        addressData.type === 'Other' && addressData.customType
          ? addressData.customType
          : addressData.type;

      const newLocation = {
        name: addressType,
        location: {
          address: [
            {
              formatted_address: addressData.street,
              address_components: [
                { long_name: addressData.city, types: ['locality'] },
                { long_name: addressData.country, types: ['country'] },
                { long_name: addressData.postalCode, types: ['postal_code'] },
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
      await preferenceInstance.put(`/api/user-settings/${userId}`, {
        customerId: userId,
        savedLocations: updatedLocations,
      });

      return true;
    } catch (error) {
      console.error('Failed to save address:', error);
      throw error;
    }
  };

  const updateAddressesInUserSettings = async (updatedAddresses: Address[]) => {
    if (!userId) return;

    try {
      const savedLocations = updatedAddresses.map(addr => ({
        name: addr.type,
        location: {
          address: [
            {
              formatted_address: addr.street,
              address_components: [
                { long_name: addr.city, types: ['locality'] },
                { long_name: addr.country, types: ['country'] },
                { long_name: addr.postalCode, types: ['postal_code'] },
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
      }));

      await preferenceInstance.put(`/api/user-settings/${userId}`, {
        customerId: userId,
        savedLocations: savedLocations,
      });
    } catch (error) {
      console.error('Failed to update addresses:', error);
      throw error;
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.street || !newAddress.city || !newAddress.country || !newAddress.postalCode) {
      Alert.alert('Error', 'Please fill in all address fields');
      return;
    }

    const addressType =
      newAddress.type === 'Other' && newAddress.customType
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

    if (userId) {
      try {
        await saveAddressToUserSettings(addressToAdd);
        await fetchCustomerAddresses(userId);
        setShowAddAddress(false);
        setNewAddress({
          type: 'Home',
          customType: '',
          street: '',
          city: '',
          country: '',
          postalCode: '',
        });
      } catch (err) {
        console.error('Failed to save new address:', err);
        Alert.alert('Error', 'Could not save address');
        setAddresses(addresses);
      }
    }
  };

  const removeAddress = async (id: string) => {
    if (addresses.length <= 1) return;

    const updatedAddresses = addresses.filter(addr => addr.id !== id);
    setAddresses(updatedAddresses);

    if (userId) {
      try {
        await updateAddressesInUserSettings(updatedAddresses);
      } catch (error) {
        console.error('Failed to remove address:', error);
        setAddresses(addresses);
        Alert.alert('Error', 'Could not remove address');
      }
    }
  };

  // Save handler
  const handleSave = async () => {
    // Validate
    if (userData.contactNumber && !validateMobileFormat(userData.contactNumber)) {
      Alert.alert('Error', 'Please enter a valid contact number');
      return;
    }

    if (userData.altContactNumber && !validateMobileFormat(userData.altContactNumber)) {
      Alert.alert('Error', 'Please enter a valid alternate number');
      return;
    }

    if (userData.contactNumber && userData.altContactNumber && 
        userData.contactNumber === userData.altContactNumber) {
      Alert.alert('Error', 'Contact numbers must be different');
      return;
    }

    setIsSaving(true);

    try {
      const payload: any = { customerid: userId };

      if (userData.firstName !== originalData.userData.firstName) {
        payload.firstname = userData.firstName;
      }

      if (userData.lastName !== originalData.userData.lastName) {
        payload.lastname = userData.lastName;
      }

      if (userData.contactNumber !== originalData.userData.contactNumber && userData.contactNumber) {
        payload.mobileno = userData.contactNumber.replace('+', '');
      }

      if (userData.altContactNumber !== originalData.userData.altContactNumber) {
        payload.alternateno = userData.altContactNumber?.replace('+', '') || null;
      }

      // Only make API call if there are changes
      if (Object.keys(payload).length > 1) {
        await providerInstance.put(`/api/customer/${userId}`, payload);
        await fetchCustomerDetails();
      }

      if (userData.contactNumber) {
        dispatch(setHasMobileNumber(true));
      }

      if (JSON.stringify(addresses) !== JSON.stringify(originalData.addresses)) {
        await updateAddressesInUserSettings(addresses);
      }

      setOriginalData({ userData: { ...userData }, addresses: [...addresses] });
      setIsEditing(false);
      if (setExternalEdit) setExternalEdit(false);

      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Failed to save data:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (setExternalEdit) setExternalEdit(false);
    setUserData(originalData.userData);
    setAddresses([...originalData.addresses]);
    setContactValidation({ loading: false, error: '', isAvailable: null, formatError: false });
    setAltContactValidation({ loading: false, error: '', isAvailable: null, formatError: false });
    // Dismiss keyboard when canceling
    Keyboard.dismiss();
  };

  const toggleAddress = (id: string) => {
    setExpandedAddressIds(prev =>
      prev.includes(id) ? prev.filter(addrId => addrId !== id) : [...prev, id]
    );
  };

  const hasChanges = (): boolean => {
    return (
      userData.firstName !== originalData.userData.firstName ||
      userData.lastName !== originalData.userData.lastName ||
      userData.contactNumber !== originalData.userData.contactNumber ||
      userData.altContactNumber !== originalData.userData.altContactNumber ||
      JSON.stringify(addresses) !== JSON.stringify(originalData.addresses)
    );
  };

  const isFormValid = (): boolean => {
    if (userData.contactNumber && !validateMobileFormat(userData.contactNumber)) return false;
    if (userData.altContactNumber && !validateMobileFormat(userData.altContactNumber)) return false;
    if (userData.contactNumber && userData.altContactNumber && 
        userData.contactNumber === userData.altContactNumber) return false;
    return true;
  };

  // Country code options
  const countryCodes = [
    { label: '+91 (IN)', value: '+91' },
    { label: '+1 (US)', value: '+1' },
    { label: '+44 (UK)', value: '+44' },
    { label: '+61 (AU)', value: '+61' },
    { label: '+65 (SG)', value: '+65' },
    { label: '+971 (UAE)', value: '+971' },
  ];

  // Loading skeleton
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.skeletonCard, { backgroundColor: colors.card }]}>
          <View style={styles.skeletonHeader}>
            <View style={[styles.skeletonTitle, { backgroundColor: colors.surface }]} />
            <View style={[styles.skeletonButton, { backgroundColor: colors.surface }]} />
          </View>
          <View style={styles.skeletonSection}>
            <View style={[styles.skeletonSectionTitle, { backgroundColor: colors.surface }]} />
            <View style={styles.skeletonRow}>
              <View style={styles.skeletonInputGroup}>
                <View style={[styles.skeletonLabel, { backgroundColor: colors.surface }]} />
                <View style={[styles.skeletonInput, { backgroundColor: colors.surface }]} />
              </View>
              <View style={styles.skeletonInputGroup}>
                <View style={[styles.skeletonLabel, { backgroundColor: colors.surface }]} />
                <View style={[styles.skeletonInput, { backgroundColor: colors.surface }]} />
              </View>
            </View>
            <View style={styles.skeletonRow}>
              <View style={styles.skeletonInputGroup}>
                <View style={[styles.skeletonLabel, { backgroundColor: colors.surface }]} />
                <View style={[styles.skeletonInput, { backgroundColor: colors.surface }]} />
              </View>
              <View style={styles.skeletonInputGroup}>
                <View style={[styles.skeletonLabel, { backgroundColor: colors.surface }]} />
                <View style={[styles.skeletonInput, { backgroundColor: colors.surface }]} />
              </View>
            </View>
          </View>
          <View style={[styles.skeletonDivider, { backgroundColor: colors.border }]} />
          <View style={styles.skeletonSection}>
            <View style={[styles.skeletonSectionTitle, { backgroundColor: colors.surface }]} />
            <View style={styles.skeletonAddressCard}>
              <View style={[styles.skeletonAddressTitle, { backgroundColor: colors.surface }]} />
              <View style={[styles.skeletonAddressLine, { backgroundColor: colors.surface }]} />
              <View style={[styles.skeletonAddressLineShort, { backgroundColor: colors.surface }]} />
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={true}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.mainContent}>
          <View style={[styles.formContainer, { backgroundColor: colors.card }]}>
            {/* Header */}
            <View style={[styles.formHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.formTitle, { color: colors.text, fontSize: fontSizes.formTitle }]}>
                My Account
              </Text>
              {!isEditing && (
                <TouchableOpacity
                  style={[styles.editButtonTop, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    setOriginalData({ userData: { ...userData }, addresses: [...addresses] });
                    setIsEditing(true);
                  }}
                >
                  <Icon name="edit-3" size={16} color="#fff" />
                  <Text style={[styles.editButtonText, { color: '#fff', fontSize: fontSizes.buttonText }]}>
                    Edit
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* User Information */}
            <View>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontSize: fontSizes.sectionTitle }]}>
                USER INFORMATION
              </Text>

              <View style={styles.inputRow}>
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: colors.text, fontSize: fontSizes.inputLabel }]}>
                    Email Address
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
                    value={userEmail || 'No email'}
                    editable={false}
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: colors.text, fontSize: fontSizes.inputLabel }]}>
                    User ID
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
                    value={customerId?.toString() || userId?.toString() || 'N/A'}
                    editable={false}
                  />
                </View>
              </View>

              <View style={styles.nameRow}>
                <View style={styles.nameInput}>
                  <Text style={[styles.inputLabel, { color: colors.text, fontSize: fontSizes.inputLabel }]}>
                    First Name
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: colors.border,
                        backgroundColor: isEditing ? colors.card : colors.surface,
                        color: colors.text,
                        fontSize: fontSizes.input,
                      },
                      !isEditing && styles.readOnlyInput,
                    ]}
                    value={userData.firstName}
                    onChangeText={value => setUserData(prev => ({ ...prev, firstName: value }))}
                    editable={isEditing}
                    placeholder="Enter first name"
                    placeholderTextColor={colors.placeholder}
                    onFocus={(e) => handleInputFocus(e, e.target as any)}
                  />
                </View>
                <View style={styles.nameInput}>
                  <Text style={[styles.inputLabel, { color: colors.text, fontSize: fontSizes.inputLabel }]}>
                    Last Name
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        borderColor: colors.border,
                        backgroundColor: isEditing ? colors.card : colors.surface,
                        color: colors.text,
                        fontSize: fontSizes.input,
                      },
                      !isEditing && styles.readOnlyInput,
                    ]}
                    value={userData.lastName}
                    onChangeText={value => setUserData(prev => ({ ...prev, lastName: value }))}
                    editable={isEditing}
                    placeholder="Enter last name"
                    placeholderTextColor={colors.placeholder}
                    onFocus={(e) => handleInputFocus(e, e.target as any)}
                  />
                </View>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {/* Contact Information */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary, fontSize: fontSizes.sectionTitle }]}>
              CONTACT INFORMATION
            </Text>

            <View style={styles.inputRow}>
              {/* Contact Number */}
              <View style={styles.inputContainer}>
                <View style={styles.labelContainer}>
                  <Text style={[styles.inputLabel, { color: colors.text, fontSize: fontSizes.inputLabel }]}>
                    Contact Number
                  </Text>
                  <Text
                    style={
                      hasMobileNumber
                        ? [styles.mobileSuccess, { color: colors.success, fontSize: fontSizes.validationText }]
                        : [styles.mobileWarningSmall, { color: colors.error, fontSize: fontSizes.validationText }]
                    }
                  >
                    {hasMobileNumber ? ` ✓ Verified` : ` ⚠ Required`}
                  </Text>
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
                      <Text style={[styles.countryCodeText, { color: colors.text, fontSize: fontSizes.input }]}>
                        {countryCode}
                      </Text>
                      <Icon name="chevron-down" size={16} color={colors.textSecondary} />
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
                      <Text style={[styles.countryCodeText, { color: colors.text, fontSize: fontSizes.input }]}>
                        {countryCode}
                      </Text>
                    </View>
                  )}
                  <TextInput
                    style={[
                      styles.phoneInput,
                      {
                        borderColor: contactValidation.error ? colors.error : colors.border,
                        backgroundColor: isEditing ? colors.card : colors.surface,
                        color: colors.text,
                        fontSize: fontSizes.input,
                      },
                      !isEditing && styles.readOnlyInput,
                    ]}
                    value={userData.contactNumber}
                    onChangeText={handleContactNumberChange}
                    placeholder="Enter 10 digit number"
                    placeholderTextColor={colors.placeholder}
                    editable={isEditing}
                    keyboardType="phone-pad"
                    maxLength={10}
                    onFocus={(e) => handleInputFocus(e, e.target as any)}
                  />
                  {isEditing && (
                    <View style={styles.validationIcon}>
                      {contactValidation.loading && (
                        <ActivityIndicator size="small" color={colors.primary} />
                      )}
                      {contactValidation.isAvailable && !contactValidation.loading && (
                        <Icon name="check" size={16} color={colors.success} />
                      )}
                      {contactValidation.isAvailable === false && !contactValidation.loading && (
                        <Icon name="alert-circle" size={16} color={colors.error} />
                      )}
                    </View>
                  )}
                </View>
                {contactValidation.error && (
                  <Text style={[styles.validationError, { color: colors.error, fontSize: fontSizes.validationText }]}>
                    {contactValidation.error}
                  </Text>
                )}
                {!hasMobileNumber && !isEditing && (
                  <Text style={[styles.mobileRequiredText, { color: colors.error, fontSize: fontSizes.validationText }]}>
                    Please add your mobile number
                  </Text>
                )}
              </View>

              {/* Alternative Contact Number */}
              <View style={styles.inputContainer}>
                <Text style={[styles.inputLabel, { color: colors.text, fontSize: fontSizes.inputLabel }]}>
                  Alternative Contact
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
                      <Text style={[styles.countryCodeText, { color: colors.text, fontSize: fontSizes.input }]}>
                        {altCountryCode}
                      </Text>
                      <Icon name="chevron-down" size={16} color={colors.textSecondary} />
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
                      <Text style={[styles.countryCodeText, { color: colors.text, fontSize: fontSizes.input }]}>
                        {altCountryCode}
                      </Text>
                    </View>
                  )}
                  <TextInput
                    style={[
                      styles.phoneInput,
                      {
                        borderColor: altContactValidation.error ? colors.error : colors.border,
                        backgroundColor: isEditing ? colors.card : colors.surface,
                        color: colors.text,
                        fontSize: fontSizes.input,
                      },
                      !isEditing && styles.readOnlyInput,
                    ]}
                    value={userData.altContactNumber}
                    onChangeText={handleAltContactNumberChange}
                    placeholder="Enter 10 digit number"
                    placeholderTextColor={colors.placeholder}
                    editable={isEditing}
                    keyboardType="phone-pad"
                    maxLength={10}
                    onFocus={(e) => handleInputFocus(e, e.target as any)}
                  />
                  {isEditing && (
                    <View style={styles.validationIcon}>
                      {altContactValidation.loading && (
                        <ActivityIndicator size="small" color={colors.primary} />
                      )}
                      {altContactValidation.isAvailable && !altContactValidation.loading && (
                        <Icon name="check" size={16} color={colors.success} />
                      )}
                      {altContactValidation.isAvailable === false && !altContactValidation.loading && (
                        <Icon name="alert-circle" size={16} color={colors.error} />
                      )}
                    </View>
                  )}
                </View>
                {altContactValidation.error && (
                  <Text style={[styles.validationError, { color: colors.error, fontSize: fontSizes.validationText }]}>
                    {altContactValidation.error}
                  </Text>
                )}
              </View>
            </View>

            {/* Addresses Section */}
            <View style={styles.addressesSection}>
              <View style={styles.addressesHeader}>
                <Text style={[styles.inputLabel, { color: colors.text, fontSize: fontSizes.inputLabel }]}>
                  Addresses
                </Text>
                {isEditing && (
                  <TouchableOpacity
                    onPress={() => setShowAddAddress(!showAddAddress)}
                    style={styles.addAddressButton}
                  >
                    <Icon name="plus" size={16} color={colors.primary} />
                    <Text style={[styles.addAddressText, { color: colors.primary, fontSize: fontSizes.buttonText }]}>
                      Add New Address
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
                    <Text style={[styles.addAddressFormTitle, { color: colors.primary, fontSize: fontSizes.formTitle }]}>
                      Add New Address
                    </Text>
                    <TouchableOpacity onPress={() => setShowAddAddress(false)}>
                      <Icon name="x" size={20} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.addressTypeContainer}>
                    <Text style={[styles.formLabel, { color: colors.text, fontSize: fontSizes.inputLabel }]}>
                      Save as
                    </Text>
                    <View style={styles.addressTypeButtons}>
                      {['Home', 'Work', 'Other'].map(type => (
                        <TouchableOpacity
                          key={type}
                          onPress={() => {
                            setNewAddress(prev => ({
                              ...prev,
                              type,
                              customType: type === 'Other' ? prev.customType : '',
                            }));
                          }}
                          style={[
                            styles.addressTypeButton,
                            {
                              borderColor: colors.border,
                              backgroundColor: colors.card,
                            },
                            newAddress.type === type && [
                              styles.addressTypeButtonActive,
                              {
                                backgroundColor: colors.primary + '20',
                                borderColor: colors.primary,
                              },
                            ],
                          ]}
                        >
                          {type === 'Home' && <Icon name="home" size={14} color={newAddress.type === type ? colors.primary : colors.textSecondary} />}
                          {type === 'Work' && <MaterialCommunityIcons name="office-building" size={14} color={newAddress.type === type ? colors.primary : colors.textSecondary} />}
                          {type === 'Other' && <Icon name="map-pin" size={14} color={newAddress.type === type ? colors.primary : colors.textSecondary} />}
                          <Text
                            style={[
                              styles.addressTypeText,
                              {
                                color: colors.textSecondary,
                                fontSize: fontSizes.inputLabel,
                              },
                              newAddress.type === type && [styles.addressTypeTextActive, { color: colors.primary }],
                            ]}
                          >
                            {type}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {newAddress.type === 'Other' && (
                    <View style={styles.formField}>
                      <Text style={[styles.formLabel, { color: colors.text, fontSize: fontSizes.inputLabel }]}>
                        Location Name
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
                        placeholder="Enter location name"
                        placeholderTextColor={colors.placeholder}
                        value={newAddress.customType}
                        onChangeText={value => setNewAddress(prev => ({ ...prev, customType: value }))}
                      />
                    </View>
                  )}

                  <View style={styles.addressFormInput}>
                    <Text style={[styles.inputLabel, { color: colors.text, fontSize: fontSizes.inputLabel }]}>
                      Street Address
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
                      onChangeText={value => setNewAddress(prev => ({ ...prev, street: value }))}
                      placeholder="Enter street address"
                      placeholderTextColor={colors.placeholder}
                    />
                  </View>

                  <View style={styles.addressFormRow}>
                    <View style={[styles.addressFormInput, { flex: 1 }]}>
                      <Text style={[styles.inputLabel, { color: colors.text, fontSize: fontSizes.inputLabel }]}>
                        City
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
                        onChangeText={value => setNewAddress(prev => ({ ...prev, city: value }))}
                        placeholder="Enter city"
                        placeholderTextColor={colors.placeholder}
                      />
                    </View>

                    <View style={[styles.addressFormInput, { flex: 1 }]}>
                      <Text style={[styles.inputLabel, { color: colors.text, fontSize: fontSizes.inputLabel }]}>
                        Country
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
                        onChangeText={value => setNewAddress(prev => ({ ...prev, country: value }))}
                        placeholder="Enter country"
                        placeholderTextColor={colors.placeholder}
                      />
                    </View>

                    <View style={[styles.addressFormInput, { flex: 1 }]}>
                      <Text style={[styles.inputLabel, { color: colors.text, fontSize: fontSizes.inputLabel }]}>
                        Postal Code
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
                        onChangeText={value => setNewAddress(prev => ({ ...prev, postalCode: value }))}
                        placeholder="Enter postal code"
                        placeholderTextColor={colors.placeholder}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={handleAddAddress}
                    style={[styles.addAddressSubmitButton, { backgroundColor: colors.primary }]}
                  >
                    <Text style={[styles.addAddressSubmitText, { color: '#fff', fontSize: fontSizes.buttonText }]}>
                      Save Address
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {addresses.length === 0 ? (
                <Text style={[styles.noAddressText, { color: colors.textSecondary, fontSize: fontSizes.roleText }]}>
                  No addresses added yet
                </Text>
              ) : (
                <View style={styles.addressesList}>
                  {addresses.map(address => (
                    <View
                      key={address.id}
                      style={[
                        styles.addressCard,
                        {
                          borderColor: colors.border,
                          backgroundColor: colors.surface,
                        },
                      ]}
                    >
                      <View style={styles.addressHeader}>
                        <Text style={[styles.addressType, { color: colors.text, fontSize: fontSizes.addressType }]}>
                          {address.type}
                        </Text>
                        <View style={styles.addressActions}>
                          <TouchableOpacity
                            onPress={() => toggleAddress(address.id)}
                            style={styles.addressActionButton}
                          >
                            <Icon
                              name={expandedAddressIds.includes(address.id) ? 'chevron-up' : 'chevron-down'}
                              size={20}
                              color={colors.textSecondary}
                            />
                          </TouchableOpacity>
                          {isEditing && addresses.length > 1 && (
                            <TouchableOpacity
                              onPress={() => removeAddress(address.id)}
                              style={styles.addressActionButton}
                            >
                              <Icon name="x" size={20} color={colors.error} />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>

                      {expandedAddressIds.includes(address.id) ? (
                        <View style={styles.addressDetails}>
                          <Text style={[styles.addressText, { color: colors.textSecondary, fontSize: fontSizes.addressText }]}>
                            {address.street}
                          </Text>
                          <Text style={[styles.addressText, { color: colors.textSecondary, fontSize: fontSizes.addressText }]}>
                            {address.city}, {address.country} {address.postalCode}
                          </Text>
                        </View>
                      ) : (
                        <Text
                          style={[styles.addressPreview, { color: colors.textSecondary, fontSize: fontSizes.addressText }]}
                          numberOfLines={1}
                        >
                          {address.street}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Action Buttons */}
            {isEditing && (
              <View style={styles.actionButtonsContainer}>
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton, { backgroundColor: colors.textSecondary }]}
                    onPress={handleCancel}
                    disabled={isSaving}
                  >
                    <Text style={[styles.buttonText, { color: '#fff', fontSize: fontSizes.buttonText }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.button,
                      styles.saveButton,
                      { backgroundColor: colors.primary },
                      (!isFormValid() || !hasChanges()) && [styles.disabledButton, { backgroundColor: colors.disabled }],
                    ]}
                    onPress={handleSave}
                    disabled={isSaving || !isFormValid() || !hasChanges()}
                  >
                    {isSaving ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={[styles.buttonText, { color: '#fff', fontSize: fontSizes.buttonText }]}>
                        Save Changes
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Country Code Pickers */}
        <Modal
          visible={showCountryCodePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowCountryCodePicker(false)}
        >
          <View style={[styles.modalContainer, { backgroundColor: colors.overlay }]}>
            <View style={[styles.pickerModal, { backgroundColor: colors.card }]}>
              <Text style={[styles.pickerTitle, { color: colors.text, fontSize: fontSizes.sectionTitle }]}>
                Select Country Code
              </Text>
              <Picker
                selectedValue={countryCode}
                onValueChange={itemValue => {
                  setCountryCode(itemValue);
                  setShowCountryCodePicker(false);
                }}
                style={{ color: colors.text }}
              >
                {countryCodes.map(code => (
                  <Picker.Item
                    key={code.value}
                    label={code.label}
                    value={code.value}
                    color={colors.text}
                  />
                ))}
              </Picker>
              <TouchableOpacity
                style={[styles.pickerButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowCountryCodePicker(false)}
              >
                <Text style={[styles.pickerButtonText, { color: '#fff', fontSize: fontSizes.buttonText }]}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        <Modal
          visible={showAltCountryCodePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowAltCountryCodePicker(false)}
        >
          <View style={[styles.modalContainer, { backgroundColor: colors.overlay }]}>
            <View style={[styles.pickerModal, { backgroundColor: colors.card }]}>
              <Text style={[styles.pickerTitle, { color: colors.text, fontSize: fontSizes.sectionTitle }]}>
                Select Country Code
              </Text>
              <Picker
                selectedValue={altCountryCode}
                onValueChange={itemValue => {
                  setAltCountryCode(itemValue);
                  setShowAltCountryCodePicker(false);
                }}
                style={{ color: colors.text }}
              >
                {countryCodes.map(code => (
                  <Picker.Item
                    key={code.value}
                    label={code.label}
                    value={code.value}
                    color={colors.text}
                  />
                ))}
              </Picker>
              <TouchableOpacity
                style={[styles.pickerButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowAltCountryCodePicker(false)}
              >
                <Text style={[styles.pickerButtonText, { color: '#fff', fontSize: fontSizes.buttonText }]}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  mainContent: {
    alignItems: 'center',
    padding: 16,
  },
  formContainer: {
    width: width - 32,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: 12,
    marginBottom: 16,
  },
  formTitle: {
    fontWeight: '600',
  },
  editButtonTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  editButtonText: {
    fontWeight: '600',
    marginLeft: 6,
  },
  sectionTitle: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  inputContainer: {
    width: width > 500 ? '48%' : '100%',
    marginBottom: 16,
  },
  inputLabel: {
    fontWeight: '600',
    marginBottom: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  readOnlyInput: {
    backgroundColor: '#f7fafc',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  nameInput: {
    flex: 1,
  },
  divider: {
    height: 1,
    marginVertical: 20,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  countryCodeContainer: {
    padding: 12,
    borderWidth: 1,
    borderRightWidth: 0,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -8 }],
  },
  validationError: {
    marginTop: 4,
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
  addressesSection: {
    marginBottom: 20,
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
    fontWeight: '600',
    marginLeft: 4,
  },
  addAddressForm: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  addAddressFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addAddressFormTitle: {
    fontWeight: '500',
  },
  addressTypeContainer: {
    marginBottom: 12,
  },
  formLabel: {
    fontWeight: '500',
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
  },
  addressTypeButtonActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#93c5fd',
  },
  addressTypeText: {
    fontSize: 14,
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
    borderRadius: 6,
    fontSize: 14,
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
  addAddressSubmitButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addAddressSubmitText: {
    fontWeight: '600',
  },
  noAddressText: {
    fontStyle: 'italic',
  },
  addressesList: {
    gap: 12,
  },
  addressCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addressType: {
    fontWeight: '600',
  },
  addressActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addressActionButton: {
    padding: 4,
    marginLeft: 8,
  },
  addressDetails: {
    marginTop: 8,
  },
  addressText: {
    marginBottom: 4,
    lineHeight: 20,
  },
  addressPreview: {
    marginTop: 8,
  },
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 120,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  saveButton: {
    backgroundColor: '#0a2a66',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  pickerModal: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
  },
  pickerTitle: {
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  pickerButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  pickerButtonText: {
    fontWeight: '600',
  },
  // Skeleton styles
  skeletonCard: {
    width: width - 32,
    borderRadius: 12,
    padding: 20,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    marginBottom: 16,
  },
  skeletonTitle: {
    width: 100,
    height: 24,
    borderRadius: 4,
  },
  skeletonButton: {
    width: 80,
    height: 36,
    borderRadius: 20,
  },
  skeletonSection: {
    marginBottom: 20,
  },
  skeletonSectionTitle: {
    width: 160,
    height: 20,
    borderRadius: 4,
    marginBottom: 16,
  },
  skeletonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  skeletonInputGroup: {
    width: width > 500 ? '48%' : '100%',
    marginBottom: 16,
  },
  skeletonLabel: {
    width: 80,
    height: 16,
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonInput: {
    width: '100%',
    height: 40,
    borderRadius: 8,
  },
  skeletonDivider: {
    height: 1,
    marginVertical: 20,
  },
  skeletonAddressCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  skeletonAddressTitle: {
    width: 120,
    height: 20,
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonAddressLine: {
    width: '100%',
    height: 16,
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonAddressLineShort: {
    width: '75%',
    height: 16,
    borderRadius: 4,
  },
});

export default CustomerProfileSection;