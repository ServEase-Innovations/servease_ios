/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable */

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  RefreshControl,
  FlatList,
} from "react-native";
import Icon from 'react-native-vector-icons/MaterialIcons';
import providerInstance from "../services/providerInstance";
import { CONFIRMATION } from "../Constants/pagesConstants";
import ProviderDetails from "../DetailsView/ProviderDetails";
import { useDispatch, useSelector } from "react-redux";
import { usePricingFilterService } from '../utils/PricingFilter';
import { ServiceProviderDTO } from "../types/ProviderDetailsType";
import ProviderFilter, { FilterCriteria } from "./ProviderFilter";
import { useTheme } from '../Settings/ThemeContext';
import { SkeletonLoader } from '../common/SkeletonLoader';
import dayjs, { Dayjs } from 'dayjs';
import { useAppUser } from '../context/AppUserContext';

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
  const { colors, isDarkMode, fontSize, compactMode } = useTheme();
  const { appUser } = useAppUser();
  
  const customerId = appUser?.role === "CUSTOMER" ? appUser?.customerid : null;
  
  const [selectedProviderType, setSelectedProviderType] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<FilterCriteria | null>(null);
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
  const [previousLocationKey, setPreviousLocationKey] = useState<string>("");
  const [isLocationValid, setIsLocationValid] = useState(false);
  
  // Add a ref to track if initial load has been done
  const initialLoadDone = useRef(false);
  const isFetchingRef = useRef(false); // Prevent concurrent fetches
  const locationKeyRef = useRef<string>(""); // Track location changes
  
  // Infinite scroll state
  const [loading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [allProviders, setAllProviders] = useState<ServiceProviderDTO[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  
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
  const spacingMultiplier = compactMode ? 0.8 : 1;

  const { getBookingType, getPricingData, getFilteredPricing } = usePricingFilterService();
  const bookingType = getBookingType();
  
  const dispatch = useDispatch();
  const location = useSelector((state: any) => state?.geoLocation?.value);

  // Helper function to check if location is valid
  const isValidLocation = useCallback((loc: any): boolean => {
    if (!loc) return false;
    
    let lat = null;
    let lng = null;
    
    if (loc?.geometry?.location) {
      lat = loc.geometry.location.lat;
      lng = loc.geometry.location.lng;
    } else if (loc?.lat && loc?.lng) {
      lat = loc.lat;
      lng = loc.lng;
    } else if (typeof loc === 'string') {
      return false;
    }
    
    return lat !== null && lng !== null && lat !== 0 && lng !== 0 && !isNaN(lat) && !isNaN(lng);
  }, []);

  // Fixed getLocationKey with validation
  const getLocationKey = useCallback(() => {
    if (!location || !isValidLocation(location)) return "";
    
    let lat = null;
    let lng = null;
    
    if (location?.geometry?.location) {
      lat = location.geometry.location.lat;
      lng = location.geometry.location.lng;
    } else if (location?.lat && location?.lng) {
      lat = location.lat;
      lng = location.lng;
    }
    
    if (lat && lng) {
      return `${lat.toFixed(4)}-${lng.toFixed(4)}`;
    }
    
    return "";
  }, [location, isValidLocation]);

  // No client-side filtering - backend handles all filtering
  // filteredProviders is just allProviders from API (already filtered by backend)
  const filteredProviders = allProviders;

  // ✅ Trigger search when filters change
  useEffect(() => {
    // Only search if we have the necessary data and initial load is done
    if (selectedProviderType !== undefined && location && bookingType && initialLoadDone.current) {
      console.log("Filters changed, resetting and searching");
      resetAndSearch();
    }
  }, [activeFilters]); // Re-run when filters change

  // ✅ Fixed: Single source of truth for initial load
  useEffect(() => {
    const currentLocationKey = getLocationKey();
    const locationValid = isValidLocation(location);
    
    setIsLocationValid(locationValid);
    
    // Check if location has actually changed
    const locationChanged = locationValid && currentLocationKey !== locationKeyRef.current;
    
    if (locationValid && bookingType && !initialLoadDone.current) {
      // Initial load - only once
      console.log("Initial load triggered");
      locationKeyRef.current = currentLocationKey;
      initialLoadDone.current = true;
      resetAndSearch();
    } else if (locationValid && locationChanged && initialLoadDone.current) {
      // Location changed after initial load - reset and search
      console.log("Location changed, resetting");
      locationKeyRef.current = currentLocationKey;
      resetAndSearch();
    }
  }, [location, bookingType]); // Only depend on location and bookingType

  // Handle selected provider type changes
  useEffect(() => {
    if (selected && selected !== selectedProviderType && initialLoadDone.current) {
      setSelectedProviderType(selected);
      resetAndSearch();
    } else if (selected && !initialLoadDone.current) {
      setSelectedProviderType(selected);
    }
  }, [selected]);

  const resetAndSearch = () => {
    setCurrentPage(1);
    setHasMore(true);
    setAllProviders([]);
    setHasFetchedOnce(false);
    performSearch(true);
  };

  const handleBackClick = () => {
    sendDataToParent("");
  };

  const handleSelectedProvider = useCallback((provider: any) => {
    if (selectedProvider) {
      selectedProvider(provider);
    }
    sendDataToParent(CONFIRMATION);
  }, [selectedProvider, sendDataToParent]);

  const formatDateOnly = (dateString?: string) => {
    if (!dateString) return "";
    return dateString.split("T")[0];
  };

  const formatTimeToHHMM = (time?: Dayjs | string | null): string => {
    if (!time) return "08:00";
    
    if (typeof time === 'string') {
      const trimmedTime = time.trim();
      if (/^\d{2}:\d{2}$/.test(trimmedTime)) {
        return trimmedTime;
      }
      const parsed = dayjs(trimmedTime, ['HH:mm', 'h:mm A', 'h:mm a']);
      if (parsed.isValid()) {
        return parsed.format('HH:mm');
      }
      return "08:00";
    }
    
    if (time && typeof time === 'object' && 'format' in time) {
      return (time as Dayjs).format('HH:mm');
    }
    
    return "08:00";
  };

  const calculateDurationInMinutes = (startTime?: string, endTime?: string): number => {
    if (!startTime || !endTime) return 60;

    try {
      const startTimeStr = startTime.trim();
      const endTimeStr = endTime.trim();

      const today = new Date();
      const startDateTime = new Date(today);
      const endDateTime = new Date(today);

      const startParts = startTimeStr.match(/(\d+):(\d+)(?:\s*(AM|PM))?/i);
      const endParts = endTimeStr.match(/(\d+):(\d+)(?:\s*(AM|PM))?/i);

      if (startParts && endParts) {
        let startHour = parseInt(startParts[1]);
        let startMinute = parseInt(startParts[2]);
        let endHour = parseInt(endParts[1]);
        let endMinute = parseInt(endParts[2]);

        if (startParts[3]) {
          const startPeriod = startParts[3].toUpperCase();
          if (startPeriod === 'PM' && startHour !== 12) startHour += 12;
          if (startPeriod === 'AM' && startHour === 12) startHour = 0;
        }

        if (endParts[3]) {
          const endPeriod = endParts[3].toUpperCase();
          if (endPeriod === 'PM' && endHour !== 12) endHour += 12;
          if (endPeriod === 'AM' && endHour === 12) endHour = 0;
        }

        startDateTime.setHours(startHour, startMinute, 0, 0);
        endDateTime.setHours(endHour, endMinute, 0, 0);

        const diffInMilliseconds = endDateTime.getTime() - startDateTime.getTime();
        const diffInMinutes = Math.round(diffInMilliseconds / (1000 * 60));

        if (diffInMinutes < 0) {
          return diffInMinutes + (24 * 60);
        }
        return diffInMinutes > 0 ? diffInMinutes : 60;
      }
    } catch (error) {
      console.error("Error calculating duration:", error);
    }
    return 60;
  };

  // Core fetch function with pagination + filter parameters (backend filtering)
  const fetchProviders = async (page: number, reset: boolean = false) => {
    // Prevent concurrent fetch calls
    if (isFetchingRef.current) {
      console.log("Fetch already in progress, skipping...");
      return;
    }
    
    try {
      isFetchingRef.current = true;
      
      if (reset) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      let latitude = 0;
      let longitude = 0;

      if (location?.geometry?.location) {
        latitude = location.geometry.location.lat;
        longitude = location.geometry.location.lng;
      } else if (location?.lat && location?.lng) {
        latitude = location.lat;
        longitude = location.lng;
      }

      if (latitude === 0 || longitude === 0 || isNaN(latitude) || isNaN(longitude)) {
        Alert.alert(
          'Location Required',
          'Please enable location services to find providers near you.',
          [{ text: 'OK' }]
        );
        setAllProviders([]);
        setHasFetchedOnce(true);
        setLoading(false);
        setIsLoadingMore(false);
        return;
      }

      const startDate = formatDateOnly(bookingType?.startDate) || '2025-04-01';
      const endDate = formatDateOnly(bookingType?.endDate) || '2025-04-30';
      
      let preferredStartTime = "08:00";
      
      if (bookingType?.timeRange) {
        const startTimeFromRange = bookingType.timeRange.split('-')[0];
        preferredStartTime = formatTimeToHHMM(startTimeFromRange);
      } else if (bookingType?.startTime) {
        preferredStartTime = formatTimeToHHMM(bookingType.startTime);
      }
      
      const housekeepingRole = bookingType?.housekeepingRole || 'COOK';
      const serviceDurationMinutes = calculateDurationInMinutes(
        bookingType?.startTime,
        bookingType?.endTime
      );

      // Base payload
      const payload: any = {
        lat: latitude.toString(),
        lng: longitude.toString(),
        radius: 10,
        startDate: startDate,
        endDate: endDate,
        preferredStartTime: preferredStartTime,
        role: housekeepingRole,
        serviceDurationMinutes: serviceDurationMinutes
      };

      // ✅ Add filter parameters if present (same as web version)
      if (activeFilters) {
        if (activeFilters.experience && (activeFilters.experience[0] > 0 || activeFilters.experience[1] < 30)) {
          payload.minExperience = activeFilters.experience[0];
          payload.maxExperience = activeFilters.experience[1];
        }
        if (activeFilters.rating) {
          payload.minRating = activeFilters.rating;
        }
        if (activeFilters.distance && activeFilters.distance[1] < 50) {
          payload.maxDistance = activeFilters.distance[1];
        }
        if (activeFilters.gender.length > 0) {
          payload.genders = activeFilters.gender;
        }
        if (activeFilters.diet.length > 0) {
          payload.diets = activeFilters.diet;
        }
        if (activeFilters.language.length > 0) {
          payload.languages = activeFilters.language;
        }
        if (activeFilters.availability.length > 0) {
          payload.availabilityStatuses = activeFilters.availability;
        }
      }

      if (appUser?.role === "CUSTOMER" && customerId && customerId !== 0 && customerId !== null && customerId !== undefined) {
        payload.customerID = Number(customerId);
      }
      
      console.log(`Fetching page ${page} with filters:`, payload);

      const response = await providerInstance.post(
        `/api/service-providers/nearby-monthly?page=${page}&limit=10`,
        payload
      );

      // Small delay to make skeleton visible and avoid flicker
      await new Promise(resolve => setTimeout(resolve, 300));

      const newProviders = response.data.providers || [];
      const total = response.data.count || 0;
      setTotalCount(total);

      if (reset) {
        setAllProviders(newProviders);
        setHasFetchedOnce(true);
      } else {
        setAllProviders(prev => [...prev, ...newProviders]);
      }

      const loadedCount = reset ? newProviders.length : allProviders.length + newProviders.length;
      setHasMore(loadedCount < total);
      setCurrentPage(page);

    } catch (error: any) {
      console.error("API error:", error.message || error);
      Alert.alert('Error', error.response?.data?.message || 'An error occurred. Please try again.');
      if (reset) {
        setAllProviders([]);
        setTotalCount(0);
        setHasFetchedOnce(true);
      }
      setHasMore(false);
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
      isFetchingRef.current = false;
    }
  };

  const performSearch = async (reset: boolean = true) => {
    if (reset) {
      setCurrentPage(1);
      setHasMore(true);
      setAllProviders([]);
      setHasFetchedOnce(false);
    }
    await fetchProviders(reset ? 1 : currentPage + 1, reset);
  };

  // ✅ Proper infinite scroll - only triggers when needed
  const fetchMoreData = useCallback(() => {
    // Check all conditions before fetching more
    if (isLoadingMore || !hasMore || loading || isFetchingRef.current) {
      console.log("Skipping fetch more:", { isLoadingMore, hasMore, loading, isFetching: isFetchingRef.current });
      return;
    }
    
    // Only fetch if we have providers loaded and not at the end
    if (allProviders.length > 0 && hasMore) {
      console.log("Fetching more data, next page:", currentPage + 1);
      fetchProviders(currentPage + 1, false);
    }
  }, [isLoadingMore, hasMore, loading, allProviders.length, currentPage]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    resetAndSearch();
  };

  // ✅ Filter handlers (updated to match web version)
  const handleApplyFilters = (filters: FilterCriteria) => {
    setActiveFilters(filters);
    
    // Count active filters for badge
    let count = 0;
    if (filters.experience[0] > 0 || filters.experience[1] < 30) count++;
    if (filters.rating) count++;
    if (filters.distance[0] > 0 || filters.distance[1] < 50) count++;
    if (filters.gender.length > 0) count++;
    if (filters.diet.length > 0) count++;
    if (filters.language.length > 0) count++;
    if (filters.availability.length > 0) count++;
    
    setActiveFilterCount(count);
    setFilterOpen(false);
    // Search will be triggered automatically by the useEffect that watches activeFilters
  };

  const handleClearFilters = () => {
    setActiveFilters(null);
    setActiveFilterCount(0);
    // Search will be triggered automatically by the useEffect that watches activeFilters
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={[styles.footerLoader, { paddingVertical: 20 }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingMoreText, { color: colors.textSecondary, fontSize: fontStyles.smallText }]}>
          Loading more providers...
        </Text>
      </View>
    );
  };

  const renderHeader = () => {
    if (filteredProviders.length === 0 && !loading && !hasFetchedOnce) return null;
    
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
          {totalCount} service provider{totalCount !== 1 ? 's' : ''} found
        </Text>
      </>
    );
  };

  const renderEmptyComponent = () => {
    if (loading && !hasFetchedOnce) {
      return renderSkeletonLoader();
    } else if (hasFetchedOnce && filteredProviders.length === 0 && !loading) {
      return (
        <View style={[styles.centerContainer, { minHeight: 400 }]}>
          <Text style={[styles.title, { color: colors.text, fontSize: fontStyles.headingSize }]}>
            {activeFilters ? 'No Providers Match Your Filters' : 'Service Not Available in Your Area'}
          </Text>
          <Text style={[styles.message, { color: colors.textSecondary, fontSize: fontStyles.textSize }]}>
            {activeFilters 
              ? 'Try adjusting your filters to see more providers.'
              : 'Currently, we are unable to provide services in your location. We hope to be available in your area soon.'}
          </Text>
          
          <View style={{ gap: 12 * spacingMultiplier }}>
            {activeFilters && (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary, width: 200 }]}
                onPress={handleClearFilters}
              >
                <Text style={[styles.buttonText, { fontSize: fontStyles.textSize }]}>Clear Filters</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.secondary, width: 200 }]}
              onPress={() => sendDataToParent("")}
            >
              <Text style={[styles.buttonText, { fontSize: fontStyles.textSize }]}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    return null;
  };

  const renderSkeletonLoader = () => {
    return (
      <View style={styles.skeletonContainer}>
        <View style={[styles.skeletonHeader, { marginBottom: 16 * spacingMultiplier }]}>
          <SkeletonLoader width={80} height={40} variant="rectangular" />
          <SkeletonLoader width={100} height={40} variant="rectangular" />
        </View>
        
        <SkeletonLoader width="100%" height={40} style={{ marginBottom: 12 * spacingMultiplier }} />
        
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

  const renderProviderItem = ({ item, index }: { item: ServiceProviderDTO; index: number }) => (
    <View key={index} style={[styles.providerContainer, { marginBottom: 16 * spacingMultiplier, paddingTop: 4 * spacingMultiplier }]}>
      <ProviderDetails 
        {...item} 
        selectedProvider={handleSelectedProvider}
        sendDataToParent={sendDataToParent} 
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      {loading && !hasFetchedOnce ? (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          {renderSkeletonLoader()}
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={filteredProviders}
          renderItem={renderProviderItem}
          keyExtractor={(item, index) => `provider-${item.id || index}`}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.contentContainer,
            filteredProviders.length === 0 && { flexGrow: 1 }
          ]}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyComponent}
          ListFooterComponent={renderFooter}
          onEndReached={fetchMoreData}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}

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
  footerLoader: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  loadingMoreText: {
    marginTop: 8,
  },
});

export default DetailsView;