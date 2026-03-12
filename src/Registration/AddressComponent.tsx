import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { useTheme } from "../../src/Settings/ThemeContext";

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
}) => {
  const { colors, fontSize, isDarkMode } = useTheme();
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
    console.log('Selected country:', country); // For debugging
    
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
    console.log('Selected state:', state); // For debugging
    
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
            style={[styles.searchInput, { 
              borderColor: colors.border, 
              backgroundColor: colors.surface,
              color: colors.text,
              fontSize: fontSizes.input
            }]}
            placeholder={`Search ${title.toLowerCase()}...`}
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
            <FlatList
              data={data.filter(item => 
                getItemLabel(item).toLowerCase().includes(searchText.toLowerCase())
              )}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    console.log('Item pressed:', item); // For debugging
                    onSelect(item);
                  }}
                >
                  <Text style={[styles.dropdownItemText, { color: colors.text, fontSize: fontSizes.dropdownItem }]}>{getItemLabel(item)}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary, fontSize: fontSizes.emptyText }]}>No items found</Text>
                </View>
              }
              keyboardShouldPersistTaps="handled"
            />
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
    placeholder?: string
  ) => (
    <View style={[styles.inputContainer, isHalfWidth && styles.halfWidth]}>
      <Text style={[styles.label, { color: colors.text, fontSize: fontSizes.label }]}>{label}</Text>
      <TouchableOpacity
        activeOpacity={isDropdown ? 0.7 : 1}
        onPress={onPress}
        disabled={!isDropdown}
        style={styles.inputWrapper}
      >
        <View pointerEvents={isDropdown ? 'none' : 'auto'} style={styles.inputWrapper}>
          <TextInput
            style={[
              styles.input,
              { 
                borderColor: error ? colors.error : colors.border,
                backgroundColor: isDropdown ? colors.surface : colors.card,
                color: colors.text,
                fontSize: fontSizes.input
              },
              isDropdown && styles.dropdownInput,
              !value && { color: colors.placeholder }
            ]}
            value={value}
            onChangeText={onChange}
            keyboardType={keyboardType}
            maxLength={maxLength}
            placeholder={placeholder || `Enter ${label.toLowerCase()}`}
            placeholderTextColor={colors.placeholder}
            editable={!isDropdown}
          />
          {isDropdown && (
            <View style={styles.dropdownIconContainer}>
              <Text style={[styles.dropdownIcon, { color: colors.textSecondary }]}>▼</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      {error && <Text style={[styles.errorText, { color: colors.error, fontSize: fontSizes.helper }]}>{error}</Text>}
    </View>
  );

  const { width } = Dimensions.get('window');
  const isSmallScreen = width < 375;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text, fontSize: fontSizes.title }]}>Address Information</Text>

      {/* Permanent Address */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.primary, fontSize: fontSizes.sectionTitle }]}>Permanent Address *</Text>
        
        <View style={styles.row}>
          {renderInput(
            'Apartment Name/Flat Name or Number *',
            permanentAddress.apartment,
            (text) => handlePermanentAddressChange('apartment', text),
            errors.permanent?.apartment,
            false
          )}
        </View>

        <View style={styles.row}>
          {renderInput(
            'Street Name/Locality name *',
            permanentAddress.street,
            (text) => handlePermanentAddressChange('street', text),
            errors.permanent?.street,
            false
          )}
        </View>

        {/* City and Country row */}
        <View style={styles.row}>
          {renderInput(
            'City *',
            permanentAddress.city,
            (text) => handlePermanentAddressChange('city', text),
            errors.permanent?.city,
            true
          )}
          {renderInput(
            'Country *',
            permanentAddress.country,
            () => {}, // Empty function as we handle via dropdown
            errors.permanent?.country,
            true,
            'default',
            undefined,
            () => setShowCountryDropdown('permanent'),
            true,
            'Select country'
          )}
        </View>

        {/* State and Pincode row */}
        <View style={styles.row}>
          {renderInput(
            'State *',
            permanentAddress.state,
            () => {}, // Empty function as we handle via dropdown
            errors.permanent?.state,
            true,
            'default',
            undefined,
            () => permanentAddress.country ? setShowStateDropdown('permanent') : null,
            true,
            permanentAddress.country ? 'Select state' : 'Select country first'
          )}
          {renderInput(
            'Pincode *',
            permanentAddress.pincode,
            (text) => handlePermanentAddressChange('pincode', text.replace(/\D/g, '').slice(0, 6)),
            errors.permanent?.pincode,
            true,
            'numeric',
            6
          )}
        </View>
      </View>

      {/* Same as Permanent Checkbox */}
      <View style={styles.checkboxContainer}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={handleSameAddressToggle}
        >
          <View style={[
            styles.checkboxBox, 
            { borderColor: colors.primary },
            isSameAddress && [styles.checkboxChecked, { backgroundColor: colors.primary }]
          ]}>
            {isSameAddress && <Text style={[styles.checkmark, { color: '#fff' }]}>✓</Text>}
          </View>
          <Text style={[styles.checkboxLabel, { color: colors.text, fontSize: fontSizes.checkbox }]}>Same as Permanent Address</Text>
        </TouchableOpacity>
      </View>

      {/* Correspondence Address (only show if not same) */}
      {!isSameAddress && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary, fontSize: fontSizes.sectionTitle }]}>Correspondence Address *</Text>
          
          <View style={styles.row}>
            {renderInput(
              'Apartment Name/Flat Name or Number *',
              correspondenceAddress.apartment,
              (text) => handleCorrespondenceAddressChange('apartment', text),
              errors.correspondence?.apartment,
              false
            )}
          </View>

          <View style={styles.row}>
            {renderInput(
              'Street Name/Locality name *',
              correspondenceAddress.street,
              (text) => handleCorrespondenceAddressChange('street', text),
              errors.correspondence?.street,
              false
            )}
          </View>

          {/* City and Country row */}
          <View style={styles.row}>
            {renderInput(
              'City *',
              correspondenceAddress.city,
              (text) => handleCorrespondenceAddressChange('city', text),
              errors.correspondence?.city,
              true
            )}
            {renderInput(
              'Country *',
              correspondenceAddress.country,
              () => {}, // Empty function as we handle via dropdown
              errors.correspondence?.country,
              true,
              'default',
              undefined,
              () => setShowCountryDropdown('correspondence'),
              true,
              'Select country'
            )}
          </View>

          {/* State and Pincode row */}
          <View style={styles.row}>
            {renderInput(
              'State *',
              correspondenceAddress.state,
              () => {}, // Empty function as we handle via dropdown
              errors.correspondence?.state,
              true,
              'default',
              undefined,
              () => correspondenceAddress.country ? setShowStateDropdown('correspondence') : null,
              true,
              correspondenceAddress.country ? 'Select state' : 'Select country first'
            )}
            {renderInput(
              'Pincode *',
              correspondenceAddress.pincode,
              (text) => handleCorrespondenceAddressChange('pincode', text.replace(/\D/g, '').slice(0, 6)),
              errors.correspondence?.pincode,
              true,
              'numeric',
              6
            )}
          </View>
        </View>
      )}

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
        'Select Country',
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
        'Select State',
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
        'Select State',
        (item) => item.name
      )}
    </ScrollView>
  );
};

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontWeight: '600',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 16,
  },
  row: {
    flexDirection: isSmallScreen ? 'column' : 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  inputContainer: {
    flex: 1,
    marginBottom: 12,
    marginHorizontal: 4,
  },
  halfWidth: {
    flex: 0.48,
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
    borderRadius: 6,
    padding: 12,
    width: '100%',
  },
  dropdownInput: {
    backgroundColor: '#f9f9f9',
    paddingRight: 40, // Make room for dropdown icon
  },
  inputError: {
    borderColor: '#d32f2f',
  },
  placeholderText: {
    color: '#999',
  },
  errorText: {
    marginTop: 4,
  },
  checkboxContainer: {
    marginBottom: 24,
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#1976d2',
  },
  checkmark: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 16,
  },
  // Dropdown icon styles
  dropdownIconContainer: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  dropdownIcon: {
    fontSize: 12,
  },
  // Modal styles
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
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
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