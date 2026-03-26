/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable */

import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Dimensions,
  RefreshControl,
} from "react-native";
import Icon from 'react-native-vector-icons/MaterialIcons';
import providerInstance from "../services/providerInstance";
import { CONFIRMATION } from "../Constants/pagesConstants";
import ProviderDetails from "../DetailsView/ProviderDetails";
import { useDispatch, useSelector } from "react-redux";
import { usePricingFilterService } from '../utils/PricingFilter';
import { ServiceProviderDTO } from "../types/ProviderDetailsType";
import ProviderFilter, { FilterCriteria } from "./ProviderFilter";
import { useTheme } from '../Settings/ThemeContext'; // Import useTheme
import { SkeletonLoader } from '../common/SkeletonLoader'; // Import SkeletonLoader
import dayjs, { Dayjs } from 'dayjs';

interface DetailsViewProps {
  sendDataToParent: (data: string) => void;
  selected?: string;
  checkoutItem?: (data: any) => void;
  selectedProvider?: (data: any) => void;
}

export const DetailsView: React.FC<DetailsViewProps> = ({
  sendDataToParent,
  selected,
  checkoutItem,
  selectedProvider,
}) => {
  // Get theme values
  const { colors, isDarkMode, fontSize, compactMode } = useTheme();
  
  const [serviceProvidersData, setServiceProvidersData] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProviderType, setSelectedProviderType] = useState("");
  const [searchData, setSearchData] = useState<any>();
  const [serviceProviderData, setServiceProviderData] = useState<ServiceProviderDTO[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<ServiceProviderDTO[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasPerformedSearch, setHasPerformedSearch] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterCriteria | null>(null);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  
  // Get font size styles based on settings
  const getFontSizeStyles = () => {
    switch (fontSize) {
      case 'small':
        return { textSize: 14, headingSize: 18, smallText: 12 };
      case 'large':
        return { textSize: 18, headingSize: 24, smallText: 16 };
      default:
        return { textSize: 16, headingSize: 20, smallText: 14 };
    }
  };

  const fontStyles = getFontSizeStyles();

  // Get spacing multiplier based on compact mode
  const spacingMultiplier = compactMode ? 0.8 : 1;

  const { getBookingType, getPricingData, getFilteredPricing } = usePricingFilterService();
  const bookingType = getBookingType();
  
  console.log("Details:", bookingType);
  
  const dispatch = useDispatch();

  const location = useSelector((state: any) => {
    console.log('🌍 Retrieving geolocation from Redux state:', state);
    return state?.geoLocation?.value;
  });

  const handleCheckoutData = (data: any) => {
    console.log("Received checkout data:", data);

    if (checkoutItem) {
      checkoutItem(data);
    }
  };

  useEffect(() => {
    console.log('🔄 DetailsView useEffect triggered');
    console.log('📅 Booking type:', bookingType);
    console.log('📍 Location:', location);
    
    // Only perform search if we have both booking type and location
    if (bookingType && location && !hasPerformedSearch) {
      performSearch();
    }
  }, [selectedProviderType, location, bookingType]);

  useEffect(() => {
    console.log('Selected ...', selected);
    setSelectedProviderType(selected || '');

    if (selected && !hasPerformedSearch) {
      // You might want to fetch by role here if needed
      // fetchServiceProvidersByRole(selected);
    }
  }, [selected]);

  const handleBackClick = () => {
    sendDataToParent("");
  };

  const toggleDrawer = (open: boolean) => {
    setDrawerOpen(open);
  };

  const handleSearchResults = (data: any[]) => {
    setSearchResults(data);
    toggleDrawer(false);
  };

  const handleSelectedProvider = useCallback((provider: any) => {
    console.log('👤 Handle selected provider:', {
      providerId: provider.serviceproviderId || provider.id,
      name: `${provider.firstname} ${provider.lastname}`,
      role: provider.housekeepingrole,
      dataStructure: Object.keys(provider)
    });
    
    if (selectedProvider) {
      selectedProvider(provider);
    }
    
    sendDataToParent(CONFIRMATION);
  }, [selectedProvider, sendDataToParent]);

  const handleSearch = (formData: { serviceType: string; startTime: string; endTime: string }) => {
    console.log("Search data received in MainComponent:", formData);
    setSearchData(formData);
  };

  const formatDateOnly = (dateString?: string) => {
    if (!dateString) return "";
    return dateString.split("T")[0];
  };

  // Helper function to format time to HH:mm (24-hour format)
  const formatTimeToHHMM = (time?: Dayjs | string | null): string => {
    if (!time) return "08:00"; // Default time
    
    if (typeof time === 'string') {
      // If time is a string like "12:00", ensure it's properly formatted
      const trimmedTime = time.trim();
      if (/^\d{2}:\d{2}$/.test(trimmedTime)) {
        return trimmedTime;
      }
      // Try to parse the time string
      const parsed = dayjs(trimmedTime, ['HH:mm', 'h:mm A', 'h:mm a']);
      if (parsed.isValid()) {
        return parsed.format('HH:mm');
      }
      return "08:00";
    }
    
    // If time is a Dayjs object
    if (time && typeof time === 'object' && 'format' in time) {
      return (time as Dayjs).format('HH:mm');
    }
    
    return "08:00";
  };

  const logProviderDetails = (providers: any[], source: string) => {
    console.log(`\n📊 =========== PROVIDER DETAILS FROM ${source} ===========`);
    console.log(`📦 Total providers: ${providers.length}`);
    
    providers.forEach((provider, index) => {
      console.log(`\n👤 Provider ${index + 1}:`);
      console.log('   ID:', provider.serviceproviderId || provider.id);
      console.log('   Name:', `${provider.firstname} ${provider.lastname}`);
      console.log('   Role:', provider.housekeepingrole);
      console.log('   Rating:', provider.rating);
      console.log('   Experience:', provider.experience, 'years');
      console.log('   Distance:', provider.distance_km, 'km');
      console.log('   Locality:', provider.locality);
    });
    
    console.log(`=========== END PROVIDER DETAILS FROM ${source} ===========\n`);
  };

  const performSearch = async () => {
    try {
      console.log('\n🚀 =========== STARTING NEW SEARCH ===========');
      setLoading(true);
      setHasPerformedSearch(true);

      console.log('📋 Booking Type:', bookingType);
      console.log('📍 Location object:', location);

      let latitude = 0;
      let longitude = 0;

      if (location?.geometry?.location) {
        latitude = location?.geometry?.location?.lat;
        longitude = location?.geometry?.location?.lng;
      } else if (location?.lat && location?.lng) {
        latitude = location?.lat;
        longitude = location?.lng;
      }

      console.log('📌 Extracted coordinates:', { latitude, longitude });

      const startDate = formatDateOnly(bookingType?.startDate) || '2025-04-01';
      const endDate = formatDateOnly(bookingType?.endDate) || '2025-04-30';
      
      // FIXED: Properly format the time to HH:mm without trailing spaces
      let preferredStartTime = "08:00"; // Default time
      
      if (bookingType?.timeRange) {
        // Extract the start time from timeRange (format like "12:00-13:00")
        const startTimeFromRange = bookingType.timeRange.split('-')[0];
        preferredStartTime = formatTimeToHHMM(startTimeFromRange);
      } else if (bookingType?.startTime) {
        preferredStartTime = formatTimeToHHMM(bookingType.startTime);
      }
      
      // Ensure no trailing spaces
      preferredStartTime = preferredStartTime.trim();
      
      const housekeepingRole = bookingType?.housekeepingRole || 'COOK';

      console.log('🔍 Search Parameters:', {
        startDate,
        endDate,
        preferredStartTime,
        housekeepingRole,
        latitude,
        longitude
      });

      if (latitude === 0 && longitude === 0) {
        console.warn('⚠️ No valid coordinates found');
        Alert.alert(
          'Location Required', 
          'Please enable location services to find providers near you',
          [{ text: 'OK' }]
        );
        setServiceProviderData([]);
        setFilteredProviders([]);
        setLoading(false);
        return;
      }

      try {
        // Prepare the request payload
        const requestPayload = {
          lat: latitude.toString(),
          lng: longitude.toString(),
          radius: 10,
          startDate: startDate,
          endDate: endDate,
          preferredStartTime: preferredStartTime, // Now properly formatted (e.g., "12:00", "08:30", etc.)
          role: housekeepingRole,
          serviceDurationMinutes: 60
        };
        
        console.log('📤 API Request Payload:', JSON.stringify(requestPayload, null, 2));
        
        const response = await providerInstance.post('/api/service-providers/nearby-monthly', requestPayload);

        console.log('✅ API Response received');
        console.log('📦 Raw response data:', response.data);
        console.log('🧾 FULL AXIOS RESPONSE:', response);
        console.log('📦 RESPONSE.DATA:', JSON.stringify(response.data, null, 2));

        if (response.data && response.data.providers) {
          const providers = response.data.providers;
          if (Array.isArray(providers) && providers.length > 0) {
            console.log(`🎉 Found ${providers.length} providers in providers object`);
            logProviderDetails(providers, 'PROVIDERS OBJECT RESPONSE');
            setServiceProviderData(providers);
            setFilteredProviders(providers);
          } else {
            console.log('❌ No providers found in providers array');
            setServiceProviderData([]);
            setFilteredProviders([]);
          }
        } else if (response.data && Array.isArray(response.data)) {
          console.log(`🎉 Found ${response.data.length} providers directly in array`);
          logProviderDetails(response.data, 'DIRECT ARRAY RESPONSE');
          setServiceProviderData(response.data);
          setFilteredProviders(response.data);
        } else {
          console.log('❌ Unexpected response format');
          console.log('Response structure:', {
            isArray: Array.isArray(response.data),
            hasProviders: !!response.data?.providers,
            keys: Object.keys(response.data || {})
          });
          setServiceProviderData([]);
          setFilteredProviders([]);
        }
      } catch (apiError: any) {
        console.error('❌ API Error:', apiError.message);
        console.log('💡 Error details:', apiError.response?.data);
        
        // Show more specific error message
        const errorMessage = apiError.response?.data?.message || 'Failed to search for providers';
        Alert.alert('Error', errorMessage);
        
        setServiceProviderData([]);
        setFilteredProviders([]);
      }
    } catch (error: any) {
      console.error('❌ Search failed:', {
        message: error.message,
        stack: error.stack
      });
      Alert.alert('Error', 'Failed to search for providers');
      setServiceProviderData([]);
      setFilteredProviders([]);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
      console.log('🏁 Search completed');
    }
  };

  // Apply filters to providers
  const applyFilters = (providers: ServiceProviderDTO[], filters: FilterCriteria): ServiceProviderDTO[] => {
    return providers.filter(provider => {
      // Experience filter
      if (filters.experience && (provider.experience < filters.experience[0] || provider.experience > filters.experience[1])) {
        return false;
      }

      // Rating filter
      if (filters.rating && (provider.rating || 0) < filters.rating) {
        return false;
      }

      // Distance filter
      if (filters.distance && (provider.distance_km || 0) > filters.distance[1]) {
        return false;
      }

      // Gender filter
      if (filters.gender.length > 0 && !filters.gender.includes(provider.gender || '')) {
        return false;
      }

      // Diet filter
      if (filters.diet.length > 0 && !filters.diet.includes(provider.diet || '')) {
        return false;
      }

      // Language filter
      if (filters.language.length > 0) {
        const providerLanguages = provider.languageknown || [];
        const hasMatchingLanguage = providerLanguages.some(lang => 
          filters.language.includes(lang)
        );
        if (!hasMatchingLanguage) return false;
      }

      // Availability filter
      if (filters.availability.length > 0) {
        const availabilityStatus = provider.monthlyAvailability?.fullyAvailable 
          ? 'Fully Available' 
          : provider.monthlyAvailability?.exceptions?.length 
            ? provider.monthlyAvailability.exceptions.length > 10 
              ? 'Limited' 
              : 'Partially Available'
            : 'Partially Available';
        
        if (!filters.availability.includes(availabilityStatus)) {
          return false;
        }
      }

      return true;
    });
  };

  // Handle applying filters
  const handleApplyFilters = (filters: FilterCriteria) => {
    setActiveFilters(filters);
    
    // Count active filters
    let count = 0;
    if (filters.experience[0] > 0 || filters.experience[1] < 30) count++;
    if (filters.rating) count++;
    if (filters.distance[0] > 0 || filters.distance[1] < 50) count++;
    if (filters.gender.length > 0) count++;
    if (filters.diet.length > 0) count++;
    if (filters.language.length > 0) count++;
    if (filters.availability.length > 0) count++;
    
    setActiveFilterCount(count);
    
    // Apply filters to current providers
    const filtered = applyFilters(serviceProviderData, filters);
    setFilteredProviders(filtered);
    setFilterOpen(false);
  };

  // Update filtered providers when serviceProviderData or activeFilters change
  useEffect(() => {
    if (activeFilters) {
      const filtered = applyFilters(serviceProviderData, activeFilters);
      setFilteredProviders(filtered);
    } else {
      setFilteredProviders(serviceProviderData);
    }
  }, [serviceProviderData, activeFilters]);

  // Handle clearing filters
  const handleClearFilters = () => {
    setActiveFilters(null);
    setFilteredProviders(serviceProviderData);
    setActiveFilterCount(0);
  };

  // FIXED: Use useCallback to prevent unnecessary re-renders
  const handleProviderSelection = useCallback((provider: any) => {
    console.log('\n🎯 =========== PROVIDER SELECTED ===========');
    console.log('Provider selected from ProviderDetails:', {
      id: provider.serviceproviderId || provider.id,
      name: `${provider.firstname} ${provider.lastname}`,
      role: provider.housekeepingrole,
      selectedMorningTime: provider.selectedMorningTime,
      selectedEveningTime: provider.selectedEveningTime,
    });
    
    if (selectedProvider) {
      selectedProvider(provider);
    }
    
    sendDataToParent(CONFIRMATION);
  }, [selectedProvider, sendDataToParent]);

  // Log whenever serviceProviderData changes
  useEffect(() => {
    if (serviceProviderData.length > 0) {
      console.log('\n📈 ServiceProviderData updated:', {
        count: serviceProviderData.length,
        providers: serviceProviderData.map(p => ({
          id: p.serviceproviderid,
          name: `${p.firstname} ${p.lastname}`,
          role: p.housekeepingRole
        }))
      });
    }
  }, [serviceProviderData]);

  console.log('📊 Current state:', {
    serviceProviderDataLength: serviceProviderData?.length || 0,
    filteredProvidersLength: filteredProviders?.length || 0,
    activeFilterCount,
    loading,
    selectedProviderType,
    hasPerformedSearch,
    isInitialLoad
  });

  const renderSkeletonLoader = () => {
    return (
      <View style={styles.skeletonContainer}>
        {/* Header skeleton */}
        <View style={[styles.skeletonHeader, { marginBottom: 16 * spacingMultiplier }]}>
          <SkeletonLoader width={80} height={40} variant="rectangular" />
          <SkeletonLoader width={100} height={40} variant="rectangular" />
        </View>
        
        {/* Results count skeleton */}
        <SkeletonLoader width="100%" height={40} style={{ marginBottom: 12 * spacingMultiplier }} />
        
        {/* Provider cards skeletons */}
        {[1, 2, 3].map((item) => (
          <View key={item} style={[styles.skeletonCard, { marginBottom: 16 * spacingMultiplier }]}>
            <View style={styles.skeletonCardHeader}>
              <SkeletonLoader width={60} height={60} variant="circular" />
              <View style={styles.skeletonCardHeaderText}>
                <SkeletonLoader width={120} height={20} style={{ marginBottom: 8 }} />
                <SkeletonLoader width={80} height={16} />
              </View>
            </View>
            <SkeletonLoader width="100%" height={16} style={{ marginBottom: 8 }} />
            <SkeletonLoader width="90%" height={16} style={{ marginBottom: 8 }} />
            <SkeletonLoader width="95%" height={16} style={{ marginBottom: 12 }} />
            <View style={styles.skeletonCardFooter}>
              <SkeletonLoader width={100} height={36} />
              <SkeletonLoader width={100} height={36} />
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderContent = () => {
    if (loading && isInitialLoad) {
      return renderSkeletonLoader();
    } else if (Array.isArray(filteredProviders) && filteredProviders.length > 0) {
      return (
        <>
          <View style={[styles.headerContainer, { paddingHorizontal: 16 * spacingMultiplier }]}>
            <TouchableOpacity onPress={handleBackClick} style={styles.backButton}>
              <Icon name="arrow-back" size={24} color={colors.text} />
              <Text style={[styles.backText, { color: colors.text, fontSize: fontStyles.textSize }]}>
                Back
              </Text>
            </TouchableOpacity>
            
            <View style={[styles.filterContainer, { gap: 8 * spacingMultiplier }]}>
              <TouchableOpacity
                style={[styles.filterButton, { 
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  paddingHorizontal: 12 * spacingMultiplier,
                  paddingVertical: 8 * spacingMultiplier,
                }]}
                onPress={() => setFilterOpen(true)}
              >
                <Icon name="filter-list" size={24} color={colors.text} />
                <Text style={[styles.filterButtonText, { color: colors.text, fontSize: fontStyles.smallText }]}>
                  Filter
                </Text>
                {activeFilterCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
                    <Text style={[styles.badgeText, { fontSize: fontStyles.smallText - 2 }]}>{activeFilterCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              {activeFilterCount > 0 && (
                <TouchableOpacity
                  style={[styles.clearButton, { padding: 8 * spacingMultiplier }]}
                  onPress={handleClearFilters}
                >
                  <Text style={[styles.clearButtonText, { color: colors.primary, fontSize: fontStyles.smallText }]}>
                    Clear all
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Text style={[styles.resultsCount, { 
            color: colors.textSecondary, 
            fontSize: fontStyles.smallText,
            backgroundColor: colors.surface,
            marginHorizontal: 16 * spacingMultiplier,
            paddingHorizontal: 16 * spacingMultiplier,
            paddingVertical: 8 * spacingMultiplier,
          }]}>
            Found {filteredProviders.length} provider{filteredProviders.length !== 1 ? 's' : ''} near you
          </Text>
          
          {filteredProviders.map((provider, index) => (
            <View key={index} style={[styles.providerContainer, { marginBottom: 16 * spacingMultiplier, paddingTop: 4 * spacingMultiplier }]}>
              <ProviderDetails 
                {...provider} 
                selectedProvider={handleProviderSelection}
                sendDataToParent={sendDataToParent} 
              />
            </View>
          ))}
        </>
      );
    } else if (!loading && hasPerformedSearch) {
      return (
        <View style={[styles.centerContainer, { minHeight: 400 }]}>
          <Text style={[styles.title, { color: colors.text, fontSize: fontStyles.headingSize }]}>
            {activeFilters ? "No Providers Match Your Filters" : "Service Not Available in Your Area"}
          </Text>
          <Text style={[styles.message, { color: colors.textSecondary, fontSize: fontStyles.textSize }]}>
            {activeFilters 
              ? "Try adjusting your filters to see more providers." 
              : "Currently, we are unable to provide services in your location. We hope to be available in your area soon."}
          </Text>
          
          {activeFilters && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary, marginBottom: 12 * spacingMultiplier }]}
              onPress={handleClearFilters}
            >
              <Text style={[styles.buttonText, { fontSize: fontStyles.textSize }]}>Clear Filters</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: activeFilters ? colors.disabled : colors.primary }]}
            onPress={() => sendDataToParent("")}
          >
            <Text style={[styles.buttonText, { fontSize: fontStyles.textSize }]}>Go Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.secondary, marginTop: 12 * spacingMultiplier }]}
            onPress={performSearch}
          >
            <Text style={[styles.buttonText, { fontSize: fontStyles.textSize }]}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      // Initial state - no search performed yet
      return (
        <View style={[styles.centerContainer, { minHeight: 400 }]}>
          <Text style={[styles.initialStateText, { color: colors.textSecondary, fontSize: fontStyles.textSize }]}>
            Select booking details to find providers
          </Text>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView 
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.contentContainer,
          filteredProviders.length === 0 && !loading && { justifyContent: 'center', flexGrow: 1 }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading && !isInitialLoad}
            onRefresh={performSearch}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {renderContent()}
      </ScrollView>

      {/* Filter Modal/Drawer */}
      <ProviderFilter
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApplyFilters={handleApplyFilters}
        initialFilters={activeFilters || undefined}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backText: {
    marginLeft: 4,
    fontWeight: '500',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    position: 'relative',
  },
  filterButtonText: {
    marginLeft: 4,
    marginRight: 4,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  clearButton: {},
  clearButtonText: {
    textDecorationLine: 'underline',
  },
  providerContainer: {},
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
  },
  title: {
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: 200,
  },
  buttonText: {
    fontWeight: '500',
    color: 'white',
    textAlign: 'center',
  },
  resultsCount: {
    borderRadius: 8,
    textAlign: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  initialStateText: {
    textAlign: 'center',
    marginTop: 20,
  },
  // Skeleton loader styles
  skeletonContainer: {
    flex: 1,
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  skeletonCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f9fafb',
  },
  skeletonCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  skeletonCardHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  skeletonCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
});

export default DetailsView;