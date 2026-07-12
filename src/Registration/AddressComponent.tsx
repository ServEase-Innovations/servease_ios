import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axios from 'axios';
import { useTheme } from "../../src/Settings/ThemeContext";
import { useTranslation } from 'react-i18next';
import { registrationKeyboardInputProps } from "../common/RegistrationKeyboardAccessory";

export interface AddressData {
  apartment: string;
  street: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

interface AddressComponentProps {
  onAddressChange: (type: 'permanent' | 'correspondence', data: AddressData) => void;
  permanentAddress: AddressData;
  correspondenceAddress: AddressData;
  errors?: {
    permanent?: Partial<AddressData>;
    correspondence?: Partial<AddressData>;
  };
  onSameAddressToggle?: (checked: boolean) => void;
  isSameAddress?: boolean;
  onScrollInputIntoView?: (fieldRef: View | null) => void;
  locationSection?: {
    onFetchLocation: () => void;
    onSelectFromMap: () => void;
    locationLoading: boolean;
    detectedAddress?: string;
    hasCoordinates: boolean;
    savedAddressPreview?: string;
  };
}

interface Country {
  country: string;
  iso2: string;
  iso3: string;
}

interface State {
  name: string;
  state_code?: string;
}

// CountryStateService for API calls
class CountryStateService {
  private cachedCountries: Country[] = [];
  private cachedStates: Map<string, State[]> = new Map();
  private BASE_URL = 'https://countriesnow.space/api/v0.1';

  async getAllCountries(): Promise<Country[]> {
    if (this.cachedCountries.length > 0) {
      return this.cachedCountries;
    }

    try {
      const response = await axios.get(`${this.BASE_URL}/countries`);
      this.cachedCountries = response.data.data || [];
      this.cachedCountries.sort((a, b) => a.country.localeCompare(b.country));
      return this.cachedCountries;
    } catch (error) {
      console.error('Error fetching countries:', error);
      return this.getFallbackCountries();
    }
  }

  async getStatesByCountry(countryName: string): Promise<State[]> {
    if (this.cachedStates.has(countryName)) {
      return this.cachedStates.get(countryName) || [];
    }

    try {
      const response = await axios.post(`${this.BASE_URL}/countries/states`, {
        country: countryName
      });
      
      const states = response.data.data?.states || [];
      // Sort states alphabetically
      states.sort((a: State, b: State) => a.name.localeCompare(b.name));
      this.cachedStates.set(countryName, states);
      return states;
    } catch (error) {
      console.error(`Error fetching states for ${countryName}:`, error);
      return [];
    }
  }

  async getCountriesWithPopularFirst(): Promise<Country[]> {
    const allCountries = await this.getAllCountries();
    const popularCountries = [
      'India', 'United States', 'United Kingdom', 'Canada', 
      'Australia', 'Germany', 'France', 'Japan', 'Singapore'
    ];
    
    const popular = allCountries.filter(c => 
      popularCountries.includes(c.country)
    ).sort((a, b) => 
      popularCountries.indexOf(a.country) - popularCountries.indexOf(b.country)
    );
    
    const others = allCountries.filter(c => 
      !popularCountries.includes(c.country)
    );
    
    return [...popular, ...others];
  }

  getFallbackCountries(): Country[] {
    return [
      { country: 'India', iso2: 'IN', iso3: 'IND' },
      { country: 'United States', iso2: 'US', iso3: 'USA' },
      { country: 'United Kingdom', iso2: 'GB', iso3: 'GBR' },
      { country: 'Canada', iso2: 'CA', iso3: 'CAN' },
      { country: 'Australia', iso2: 'AU', iso3: 'AUS' },
      { country: 'Germany', iso2: 'DE', iso3: 'DEU' },
      { country: 'France', iso2: 'FR', iso3: 'FRA' },
      { country: 'Japan', iso2: 'JP', iso3: 'JPN' },
      { country: 'Singapore', iso2: 'SG', iso3: 'SGP' },
      { country: 'United Arab Emirates', iso2: 'AE', iso3: 'ARE' },
    ];
  }
}

const countryStateService = new CountryStateService();

const AddressComponent: React.FC<AddressComponentProps> = ({
  onAddressChange,
  permanentAddress,
  correspondenceAddress,
  errors = {},
  onSameAddressToggle,
  isSameAddress: externalIsSameAddress,
  onScrollInputIntoView,
  locationSection,
}) => {
  const { colors, fontSize, isDarkMode } = useTheme();
  const { t } = useTranslation();
  const [internalIsSameAddress, setInternalIsSameAddress] = useState(false);
  const isSameAddress = externalIsSameAddress !== undefined ? externalIsSameAddress : internalIsSameAddress;

  // Dropdown states
  const [showCountryDropdown, setShowCountryDropdown] = useState<'permanent' | 'correspondence' | null>(null);
  const [showStateDropdown, setShowStateDropdown] = useState<'permanent' | 'correspondence' | null>(null);
  
  // Data states
  const [countries, setCountries] = useState<Country[]>([]);
  const [permanentStates, setPermanentStates] = useState<State[]>([]);
  const [correspondenceStates, setCorrespondenceStates] = useState<State[]>([]);
  
  // Loading states
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingPermanentStates, setLoadingPermanentStates] = useState(false);
  const [loadingCorrespondenceStates, setLoadingCorrespondenceStates] = useState(false);
  
  // Search states
  const [countrySearch, setCountrySearch] = useState('');
  const [permanentStateSearch, setPermanentStateSearch] = useState('');
  const [correspondenceStateSearch, setCorrespondenceStateSearch] = useState('');

  const apartmentRef = useRef<View>(null);
  const streetRef = useRef<View>(null);
  const cityRef = useRef<View>(null);
  const pincodeRef = useRef<View>(null);

  // Get font sizes based on theme
  const getFontSizes = () => {
    switch (fontSize) {
      case 'small':
        return {
          title: 18,
          sectionTitle: 15,
          label: 13,
          input: 14,
          helper: 11,
          checkbox: 14,
          dropdownTitle: 16,
          dropdownItem: 15,
          emptyText: 14,
        };
      case 'large':
        return {
          title: 24,
          sectionTitle: 18,
          label: 16,
          input: 18,
          helper: 14,
          checkbox: 18,
          dropdownTitle: 20,
          dropdownItem: 18,
          emptyText: 16,
        };
      default:
        return {
          title: 20,
          sectionTitle: 16,
          label: 14,
          input: 16,
          helper: 12,
          checkbox: 16,
          dropdownTitle: 18,
          dropdownItem: 16,
          emptyText: 15,
        };
    }
  };

  const fontSizes = getFontSizes();

  const countFilledFields = (address: AddressData) => {
    const fields = [
      address.apartment,
      address.street,
      address.city,
      address.state,
      address.country,
      address.pincode,
    ];
    return fields.filter((value) => Boolean(value?.trim())).length;
  };

  const permanentFilledCount = countFilledFields(permanentAddress);

  const handleStatePress = (type: 'permanent' | 'correspondence') => {
    const country =
      type === 'permanent' ? permanentAddress.country : correspondenceAddress.country;
    if (!country) {
      Alert.alert(
        t('registration.address.selectCountry'),
        t('registration.address.selectCountryFirst')
      );
      return;
    }
    setShowStateDropdown(type);
  };

  const handleFieldFocus = (fieldRef: View | null) => {
    onScrollInputIntoView?.(fieldRef);
  };

  // Load countries on mount
  useEffect(() => {
    const loadCountries = async () => {
      setLoadingCountries(true);
      try {
        const data = await countryStateService.getCountriesWithPopularFirst();
        setCountries(data);
      } catch (error) {
        console.error('Failed to load countries:', error);
        const fallback = countryStateService.getFallbackCountries();
        setCountries(fallback);
      } finally {
        setLoadingCountries(false);
      }
    };

    loadCountries();
  }, []);

  // Load states for permanent address when country changes
  useEffect(() => {
    const loadStates = async () => {
      if (!permanentAddress.country) {
        setPermanentStates([]);
        return;
      }

      setLoadingPermanentStates(true);
      try {
        const data = await countryStateService.getStatesByCountry(permanentAddress.country);
        setPermanentStates(data);
        // If there's only one state, auto-select it
        if (data.length === 1 && !permanentAddress.state) {
          handlePermanentAddressChange('state', data[0].name);
        }
      } catch (error) {
        console.error(`Failed to load states for ${permanentAddress.country}:`, error);
        setPermanentStates([]);
      } finally {
        setLoadingPermanentStates(false);
      }
    };

    loadStates();
  }, [permanentAddress.country]);

  // Load states for correspondence address when country changes
  useEffect(() => {
    const loadStates = async () => {
      if (!correspondenceAddress.country || isSameAddress) {
        setCorrespondenceStates([]);
        return;
      }

      setLoadingCorrespondenceStates(true);
      try {
        const data = await countryStateService.getStatesByCountry(correspondenceAddress.country);
        setCorrespondenceStates(data);
        // If there's only one state, auto-select it
        if (data.length === 1 && !correspondenceAddress.state) {
          handleCorrespondenceAddressChange('state', data[0].name);
        }
      } catch (error) {
        console.error(`Failed to load states for ${correspondenceAddress.country}:`, error);
        setCorrespondenceStates([]);
      } finally {
        setLoadingCorrespondenceStates(false);
      }
    };

    loadStates();
  }, [correspondenceAddress.country, isSameAddress]);

  const handlePermanentAddressChange = (field: keyof AddressData, value: string) => {
    const newAddress = { ...permanentAddress, [field]: value };
    onAddressChange('permanent', newAddress);

    if (isSameAddress && field !== 'state') {
      // Don't auto-copy state if it's being cleared due to country change
      onAddressChange('correspondence', { ...newAddress, state: newAddress.state });
    }
  };

  const handleCorrespondenceAddressChange = (field: keyof AddressData, value: string) => {
    const newAddress = { ...correspondenceAddress, [field]: value };
    onAddressChange('correspondence', newAddress);
  };

  const handleSameAddressToggle = () => {
    const checked = !isSameAddress;
    if (externalIsSameAddress !== undefined && onSameAddressToggle) {
      onSameAddressToggle(checked);
    } else {
      setInternalIsSameAddress(checked);
    }

    if (checked) {
      // Copy permanent → correspondence
      onAddressChange('correspondence', { ...permanentAddress });
    }
  };

  const handleCountrySelect = (type: 'permanent' | 'correspondence', country: Country) => {
    if (type === 'permanent') {
      // Create new address with selected country and cleared state
      const newAddress = { 
        ...permanentAddress, 
        country: country.country,
        state: '' // Clear state when country changes
      };
      onAddressChange('permanent', newAddress);
      
      // If same address is checked, also update correspondence
      if (isSameAddress) {
        onAddressChange('correspondence', { ...newAddress });
      }
    } else {
      // Create new address with selected country and cleared state
      const newAddress = { 
        ...correspondenceAddress, 
        country: country.country,
        state: '' // Clear state when country changes
      };
      onAddressChange('correspondence', newAddress);
    }
    
    // Close dropdown and clear search
    setShowCountryDropdown(null);
    setCountrySearch('');
  };

  const handleStateSelect = (type: 'permanent' | 'correspondence', state: State) => {
    if (type === 'permanent') {
      // Create new address with selected state
      const newAddress = { ...permanentAddress, state: state.name };
      onAddressChange('permanent', newAddress);
      
      // If same address is checked, also update correspondence
      if (isSameAddress) {
        onAddressChange('correspondence', { ...newAddress });
      }
    } else {
      // Create new address with selected state
      const newAddress = { ...correspondenceAddress, state: state.name };
      onAddressChange('correspondence', newAddress);
    }
    
    // Close dropdown and clear search
    setShowStateDropdown(null);
    if (type === 'permanent') {
      setPermanentStateSearch('');
    } else {
      setCorrespondenceStateSearch('');
    }
  };

  const renderDropdown = (
    visible: boolean,
    onClose: () => void,
    data: any[],
    onSelect: (item: any) => void,
    loading: boolean,
    searchText: string,
    onSearchChange: (text: string) => void,
    title: string,
    getItemLabel: (item: any) => string
  ) => (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.dropdownContainer, { backgroundColor: colors.card }]}>
          <View style={[styles.dropdownHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.dropdownTitle, { color: colors.text, fontSize: fontSizes.dropdownTitle }]}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeButtonText, { color: colors.textSecondary }]}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <TextInput
            {...registrationKeyboardInputProps}
            style={[styles.searchInput, { 
              borderColor: colors.border, 
              backgroundColor: colors.surface,
              color: colors.text,
              fontSize: fontSizes.input
            }]}
            placeholder={t('registration.address.searchCountry')}
            placeholderTextColor={colors.placeholder}
            value={searchText}
            onChangeText={onSearchChange}
            autoFocus={true}
          />
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : (
            <ScrollView
              style={styles.dropdownList}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator
            >
              {data
                .filter((item) =>
                  getItemLabel(item).toLowerCase().includes(searchText.toLowerCase())
                )
                .map((item, index) => (
                  <TouchableOpacity
                    key={`${getItemLabel(item)}-${index}`}
                    style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                    onPress={() => onSelect(item)}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        { color: colors.text, fontSize: fontSizes.dropdownItem },
                      ]}
                    >
                      {getItemLabel(item)}
                    </Text>
                  </TouchableOpacity>
                ))}
              {data.filter((item) =>
                getItemLabel(item).toLowerCase().includes(searchText.toLowerCase())
              ).length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text
                    style={[
                      styles.emptyText,
                      { color: colors.textSecondary, fontSize: fontSizes.emptyText },
                    ]}
                  >
                    {t('registration.address.noItemsFound')}
                  </Text>
                </View>
              ) : null}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderInput = (
    label: string,
    value: string,
    onChange: (text: string) => void,
    error?: string,
    isHalfWidth?: boolean,
    keyboardType: 'default' | 'numeric' = 'default',
    maxLength?: number,
    onPress?: () => void,
    isDropdown?: boolean,
    placeholder?: string,
    fieldRef?: React.RefObject<View | null>,
    isDisabled?: boolean
  ) => (
    <View
      ref={fieldRef}
      style={[styles.inputContainer, isHalfWidth && styles.halfWidth]}
      collapsable={false}
    >
      <Text style={[styles.label, { color: colors.text, fontSize: fontSizes.label }]}>{label}</Text>
      {isDropdown ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onPress}
          disabled={isDisabled}
          style={styles.inputWrapper}
        >
          <View
            style={[
              styles.input,
              styles.dropdownInput,
              {
                borderColor: error ? colors.error : colors.border,
                backgroundColor: colors.surface,
                opacity: isDisabled ? 0.55 : 1,
              },
            ]}
          >
            <Text
              style={[
                styles.dropdownValueText,
                { color: value ? colors.text : colors.placeholder, fontSize: fontSizes.input },
              ]}
              numberOfLines={1}
            >
              {value || placeholder || ""}
            </Text>
            <Icon name="keyboard-arrow-down" size={22} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>
      ) : (
        <TextInput
          {...registrationKeyboardInputProps}
          style={[
            styles.input,
            {
              borderColor: error ? colors.error : colors.border,
              backgroundColor: colors.card,
              color: colors.text,
              fontSize: fontSizes.input,
            },
          ]}
          value={value}
          onChangeText={onChange}
          onFocus={() => handleFieldFocus(fieldRef?.current ?? null)}
          keyboardType={keyboardType}
          maxLength={maxLength}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
        />
      )}
      {error ? (
        <Text style={[styles.errorText, { color: colors.error, fontSize: fontSizes.helper }]}>
          {error}
        </Text>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text, fontSize: fontSizes.title }]}>
        {t('registration.address.title')}
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary, fontSize: fontSizes.helper }]}>
        {t('registration.address.subtitle', {
          defaultValue: 'Add where you provide services. Quick-fill from map or GPS, then review the fields.',
        })}
      </Text>

      {locationSection ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.cardHeaderRow}>
            <View style={[styles.cardIconWrap, { backgroundColor: colors.infoLight }]}>
              <Icon name="my-location" size={20} color={colors.primary} />
            </View>
            <View style={styles.cardHeaderText}>
              <Text style={[styles.cardTitle, { color: colors.text, fontSize: fontSizes.sectionTitle }]}>
                {t('registration.address.quickFillTitle', { defaultValue: 'Quick fill' })}
              </Text>
              <Text style={[styles.cardHint, { color: colors.textSecondary, fontSize: fontSizes.helper }]}>
                {t('registration.address.quickFillHint', {
                  defaultValue: 'Use your location or pick a point on the map to auto-fill the form.',
                })}
              </Text>
            </View>
          </View>

          {locationSection.savedAddressPreview ? (
            <View style={[styles.savedLocationBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Icon name="place" size={16} color={colors.primary} />
              <Text style={[styles.savedLocationText, { color: colors.text, fontSize: fontSizes.helper }]} numberOfLines={2}>
                {locationSection.savedAddressPreview}
              </Text>
            </View>
          ) : null}

          <View style={styles.locationActions}>
            <TouchableOpacity
              style={[
                styles.locationActionRow,
                {
                  borderColor: colors.primary,
                  backgroundColor: colors.infoLight,
                },
                locationSection.locationLoading && styles.buttonDisabled,
              ]}
              onPress={locationSection.onFetchLocation}
              disabled={locationSection.locationLoading}
              activeOpacity={0.7}
            >
              <View style={[styles.locationActionIcon, { backgroundColor: colors.primary }]}>
                {locationSection.locationLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Icon name="my-location" size={20} color="#fff" />
                )}
              </View>
              <Text
                style={[
                  styles.locationActionLabel,
                  { color: colors.text, fontSize: fontSizes.input },
                ]}
              >
                {t('registration.address.currentLocation', { defaultValue: 'Current Location' })}
              </Text>
              {!locationSection.locationLoading ? (
                <Icon name="chevron-right" size={22} color={colors.textSecondary} />
              ) : null}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.locationActionRow,
                {
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                },
                locationSection.locationLoading && styles.buttonDisabled,
              ]}
              onPress={locationSection.onSelectFromMap}
              disabled={locationSection.locationLoading}
              activeOpacity={0.7}
            >
              <View style={[styles.locationActionIcon, { backgroundColor: colors.card }]}>
                <Icon name="map" size={20} color={colors.primary} />
              </View>
              <Text
                style={[
                  styles.locationActionLabel,
                  { color: colors.text, fontSize: fontSizes.input },
                ]}
              >
                {t('registration.address.selectFromMap', { defaultValue: 'Select from map' })}
              </Text>
              <Icon name="chevron-right" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {locationSection.hasCoordinates && locationSection.detectedAddress ? (
            <View style={[styles.detectedBanner, { backgroundColor: colors.successLight, borderColor: colors.success }]}>
              <Icon name="check-circle" size={18} color={colors.success} />
              <Text style={[styles.detectedText, { color: colors.success, fontSize: fontSizes.helper }]} numberOfLines={3}>
                {locationSection.detectedAddress}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <Icon name="home" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.primary, fontSize: fontSizes.sectionTitle }]}>
              {t('registration.address.permanent')}
            </Text>
          </View>
          <View style={[styles.progressChip, { backgroundColor: colors.infoLight }]}>
            <Text style={[styles.progressChipText, { color: colors.primary, fontSize: fontSizes.helper }]}>
              {permanentFilledCount}/6
            </Text>
          </View>
        </View>

        <View style={styles.row}>
          {renderInput(
            t('registration.address.apartment'),
            permanentAddress.apartment,
            (text) => handlePermanentAddressChange('apartment', text),
            errors.permanent?.apartment,
            false,
            'default',
            undefined,
            undefined,
            false,
            t('registration.address.enterApartment'),
            apartmentRef
          )}
        </View>

        <View style={styles.row}>
          {renderInput(
            t('registration.address.street'),
            permanentAddress.street,
            (text) => handlePermanentAddressChange('street', text),
            errors.permanent?.street,
            false,
            'default',
            undefined,
            undefined,
            false,
            t('registration.address.enterStreet'),
            streetRef
          )}
        </View>

        <View style={styles.row}>
          {renderInput(
            t('registration.address.city'),
            permanentAddress.city,
            (text) => handlePermanentAddressChange('city', text),
            errors.permanent?.city,
            true,
            'default',
            undefined,
            undefined,
            false,
            t('registration.address.enterCity'),
            cityRef
          )}
          {renderInput(
            t('registration.address.country'),
            permanentAddress.country,
            () => {},
            errors.permanent?.country,
            true,
            'default',
            undefined,
            () => setShowCountryDropdown('permanent'),
            true,
            t('registration.address.selectCountry')
          )}
        </View>

        <View style={styles.row}>
          {renderInput(
            t('registration.address.state'),
            permanentAddress.state,
            () => {},
            errors.permanent?.state,
            true,
            'default',
            undefined,
            () => handleStatePress('permanent'),
            true,
            permanentAddress.country
              ? t('registration.address.selectState')
              : t('registration.address.selectCountryFirst'),
            undefined,
            !permanentAddress.country
          )}
          {renderInput(
            t('registration.address.pincode'),
            permanentAddress.pincode,
            (text) => handlePermanentAddressChange('pincode', text.replace(/\D/g, '').slice(0, 6)),
            errors.permanent?.pincode,
            true,
            'numeric',
            6,
            undefined,
            false,
            t('registration.address.enterPincode'),
            pincodeRef
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.sameAddressCard,
          {
            borderColor: isSameAddress ? colors.primary : colors.border,
            backgroundColor: isSameAddress ? colors.infoLight : colors.card,
          },
        ]}
        onPress={handleSameAddressToggle}
        activeOpacity={0.8}
      >
        <View style={[styles.checkboxBox, { borderColor: colors.primary }, isSameAddress && { backgroundColor: colors.primary }]}>
          {isSameAddress ? <Icon name="check" size={14} color="#fff" /> : null}
        </View>
        <View style={styles.sameAddressTextWrap}>
          <Text style={[styles.checkboxLabel, { color: colors.text, fontSize: fontSizes.checkbox }]}>
            {t('registration.address.sameAsPermanent')}
          </Text>
          <Text style={[styles.sameAddressHint, { color: colors.textSecondary, fontSize: fontSizes.helper }]}>
            {t('registration.address.sameAsPermanentHint', {
              defaultValue: 'Use the same address for correspondence',
            })}
          </Text>
        </View>
      </TouchableOpacity>

      {!isSameAddress ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.sectionHeaderLeft, { marginBottom: 14 }]}>
            <Icon name="local-shipping" size={18} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.primary, fontSize: fontSizes.sectionTitle }]}>
              {t('registration.address.correspondence')}
            </Text>
          </View>

          <View style={styles.row}>
            {renderInput(
              t('registration.address.apartment'),
              correspondenceAddress.apartment,
              (text) => handleCorrespondenceAddressChange('apartment', text),
              errors.correspondence?.apartment,
              false,
              'default',
              undefined,
              undefined,
              false,
              t('registration.address.enterApartment')
            )}
          </View>

          <View style={styles.row}>
            {renderInput(
              t('registration.address.street'),
              correspondenceAddress.street,
              (text) => handleCorrespondenceAddressChange('street', text),
              errors.correspondence?.street,
              false,
              'default',
              undefined,
              undefined,
              false,
              t('registration.address.enterStreet')
            )}
          </View>

          <View style={styles.row}>
            {renderInput(
              t('registration.address.city'),
              correspondenceAddress.city,
              (text) => handleCorrespondenceAddressChange('city', text),
              errors.correspondence?.city,
              true,
              'default',
              undefined,
              undefined,
              false,
              t('registration.address.enterCity')
            )}
            {renderInput(
              t('registration.address.country'),
              correspondenceAddress.country,
              () => {},
              errors.correspondence?.country,
              true,
              'default',
              undefined,
              () => setShowCountryDropdown('correspondence'),
              true,
              t('registration.address.selectCountry')
            )}
          </View>

          <View style={styles.row}>
            {renderInput(
              t('registration.address.state'),
              correspondenceAddress.state,
              () => {},
              errors.correspondence?.state,
              true,
              'default',
              undefined,
              () => handleStatePress('correspondence'),
              true,
              correspondenceAddress.country
                ? t('registration.address.selectState')
                : t('registration.address.selectCountryFirst'),
              undefined,
              !correspondenceAddress.country
            )}
            {renderInput(
              t('registration.address.pincode'),
              correspondenceAddress.pincode,
              (text) => handleCorrespondenceAddressChange('pincode', text.replace(/\D/g, '').slice(0, 6)),
              errors.correspondence?.pincode,
              true,
              'numeric',
              6,
              undefined,
              false,
              t('registration.address.enterPincode')
            )}
          </View>
        </View>
      ) : null}

      {/* Country Dropdown Modal */}
      {renderDropdown(
        showCountryDropdown !== null,
        () => {
          setShowCountryDropdown(null);
          setCountrySearch('');
        },
        countries,
        (country) => handleCountrySelect(showCountryDropdown!, country),
        loadingCountries,
        countrySearch,
        setCountrySearch,
        t('registration.address.selectCountry'),
        (item) => item.country
      )}

      {/* Permanent State Dropdown Modal */}
      {renderDropdown(
        showStateDropdown === 'permanent',
        () => {
          setShowStateDropdown(null);
          setPermanentStateSearch('');
        },
        permanentStates,
        (state) => handleStateSelect('permanent', state),
        loadingPermanentStates,
        permanentStateSearch,
        setPermanentStateSearch,
        t('registration.address.selectState'),
        (item) => item.name
      )}

      {/* Correspondence State Dropdown Modal */}
      {renderDropdown(
        showStateDropdown === 'correspondence',
        () => {
          setShowStateDropdown(null);
          setCorrespondenceStateSearch('');
        },
        correspondenceStates,
        (state) => handleStateSelect('correspondence', state),
        loadingCorrespondenceStates,
        correspondenceStateSearch,
        setCorrespondenceStateSearch,
        t('registration.address.selectState'),
        (item) => item.name
      )}
    </View>
  );
};

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  title: {
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    lineHeight: 18,
    marginBottom: 16,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  cardIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontWeight: '700',
  },
  cardHint: {
    marginTop: 4,
    lineHeight: 18,
  },
  savedLocationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  savedLocationText: {
    flex: 1,
    lineHeight: 18,
  },
  locationActions: {
    gap: 8,
  },
  locationActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  locationActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationActionLabel: {
    flex: 1,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  detectedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
  },
  detectedText: {
    flex: 1,
    lineHeight: 18,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  progressChip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  progressChipText: {
    fontWeight: '700',
  },
  row: {
    flexDirection: isSmallScreen ? 'column' : 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  inputContainer: {
    flex: 1,
    marginBottom: 10,
    marginHorizontal: 2,
  },
  halfWidth: {
    flex: isSmallScreen ? 1 : 0.48,
  },
  label: {
    fontWeight: '500',
    marginBottom: 6,
  },
  inputWrapper: {
    position: 'relative',
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    width: '100%',
  },
  dropdownInput: {
    paddingRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownValueText: {
    flex: 1,
    paddingRight: 8,
  },
  errorText: {
    marginTop: 4,
  },
  sameAddressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  sameAddressTextWrap: {
    flex: 1,
  },
  sameAddressHint: {
    marginTop: 2,
    lineHeight: 16,
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxLabel: {
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dropdownContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: 16,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  dropdownTitle: {
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  dropdownList: {
    maxHeight: 360,
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dropdownItemText: {
    fontSize: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
  },
});

export default AddressComponent;