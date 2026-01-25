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
import { CONFIRMATION } from "../Constants/pagesConstants";
import ProviderDetails from "../DetailsView/ProviderDetails";
import { useDispatch, useSelector } from "react-redux";
import { usePricingFilterService } from '../utils/PricingFilter';
import { ServiceProviderDTO } from "../types/ProviderDetailsType";
import providerInstance from "../services/providerInstance";

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
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [hasPerformedSearch, setHasPerformedSearch] = useState(false);
  
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
          } else {
            console.log('❌ No providers found in providers array');
            setServiceProviderData([]);
          }
        } else if (response.data && Array.isArray(response.data)) {
          console.log(`🎉 Found ${response.data.length} providers directly in array`);
          logProviderDetails(response.data, 'DIRECT ARRAY RESPONSE');
          setServiceProviderData(response.data);
        } else {
          console.log('❌ Unexpected response format');
          console.log('Response structure:', {
            isArray: Array.isArray(response.data),
            hasProviders: !!response.data?.providers,
            keys: Object.keys(response.data || {})
          });
          setServiceProviderData([]);
        }
      } catch (apiError: any) {
        console.error('❌ API Error:', apiError.message);
        console.log('💡 Error details:', apiError.response?.data);
        Alert.alert('Error', 'Failed to search for providers');
        setServiceProviderData([]);
      }
    } catch (error: any) {
      console.error('❌ Search failed:', {
        message: error.message,
        stack: error.stack
      });
      Alert.alert('Error', 'Failed to search for providers');
      setServiceProviderData([]);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
      console.log('🏁 Search completed');
    }
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
    } else if (Array.isArray(serviceProviderData) && serviceProviderData.length > 0) {
      return (
        <>
          <Text style={styles.resultsCount}>
            Found {serviceProviderData.length} provider{serviceProviderData.length !== 1 ? 's' : ''} near you
          </Text>
          {serviceProviderData.map((provider, index) => (
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
          <Text style={styles.title}>Service Not Available in Your Area</Text>
          <Text style={styles.message}>
            Currently, we are unable to provide services in your location. 
            We hope to be available in your area soon.
          </Text>
          <TouchableOpacity
            style={styles.button}
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
          serviceProviderData.length === 0 && { justifyContent: 'center', flexGrow: 1 }
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
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
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