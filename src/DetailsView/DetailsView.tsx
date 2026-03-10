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
      const timeslot = bookingType?.timeRange || '16:37-16:37';
      const housekeepingRole = bookingType?.housekeepingRole || 'COOK';

      console.log('🔍 Search Parameters:', {
        startDate,
        endDate,
        timeslot,
        housekeepingRole,
        latitude,
        longitude
      });

      if (latitude === 0 && longitude === 0) {
        console.warn('⚠️ No valid coordinates found');
        Alert.alert('Location Required', 'Please enable location services to find providers near you');
        setServiceProviderData([]);
        setFilteredProviders([]);
        setLoading(false);
        return;
      }

      try {
        const response = await providerInstance.post('/api/service-providers/nearby-monthly', {
          lat: latitude.toString(),
          lng: longitude.toString(),
          radius: 10,
          startDate: startDate,
          endDate: endDate,
          preferredStartTime: bookingType?.timeRange ? bookingType.timeRange.split('-')[0] : "16:37",
          role: housekeepingRole,
          serviceDurationMinutes: 60
        });

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
        Alert.alert('Error', 'Failed to search for providers');
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

  const renderContent = () => {
    if (loading && isInitialLoad) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Searching providers near you...</Text>
        </View>
      );
    } else if (Array.isArray(filteredProviders) && filteredProviders.length > 0) {
      return (
        <>
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={handleBackClick} style={styles.backButton}>
              <Icon name="arrow-back" size={24} color="#333" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            
            <View style={styles.filterContainer}>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setFilterOpen(true)}
              >
                <Icon name="filter-list" size={24} color="#333" />
                <Text style={styles.filterButtonText}>Filter</Text>
                {activeFilterCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{activeFilterCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
              
              {activeFilterCount > 0 && (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={handleClearFilters}
                >
                  <Text style={styles.clearButtonText}>Clear all</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Text style={styles.resultsCount}>
            Found {filteredProviders.length} provider{filteredProviders.length !== 1 ? 's' : ''} near you
          </Text>
          
          {filteredProviders.map((provider, index) => (
            <View key={index} style={styles.providerContainer}>
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
        <View style={styles.centerContainer}>
          <Text style={styles.title}>
            {activeFilters ? "No Providers Match Your Filters" : "Service Not Available in Your Area"}
          </Text>
          <Text style={styles.message}>
            {activeFilters 
              ? "Try adjusting your filters to see more providers." 
              : "Currently, we are unable to provide services in your location. We hope to be available in your area soon."}
          </Text>
          
          {activeFilters && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#007bff', marginBottom: 12 }]}
              onPress={handleClearFilters}
            >
              <Text style={styles.buttonText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: activeFilters ? '#6c757d' : '#007bff' }]}
            onPress={() => sendDataToParent("")}
          >
            <Text style={styles.buttonText}>Go Back</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#6c757d', marginTop: 12 }]}
            onPress={performSearch}
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      // Initial state - no search performed yet
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.initialStateText}>
            Select booking details to find providers
          </Text>
        </View>
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={[
          styles.contentContainer,
          filteredProviders.length === 0 && { justifyContent: 'center', flexGrow: 1 }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={performSearch}
            colors={['#007bff']}
            tintColor="#007bff"
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
    backgroundColor: '#f5f5f5',
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
    paddingHorizontal: 8,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 4,
    fontWeight: '500',
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    position: 'relative',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 4,
    marginRight: 4,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#007bff',
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 12,
    color: '#666',
    textDecorationLine: 'underline',
  },
  providerContainer: {
    marginBottom: 16,
    paddingTop: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    minHeight: 400,
  },
  loadingText: {
    fontSize: 16,
    color: '#333',
    marginTop: 16,
    textAlign: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#007bff',
    borderRadius: 8,
    width: 200,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
    textAlign: 'center',
  },
  resultsCount: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    marginBottom: 12,
    borderRadius: 8,
    textAlign: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  initialStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default DetailsView;