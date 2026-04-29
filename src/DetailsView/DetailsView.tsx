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
  Dimensions,
  Image,
} from "react-native";
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import providerInstance from "../services/providerInstance";
import { CONFIRMATION } from "../Constants/pagesConstants";
import ProviderDetailsComponent from "../DetailsView/ProviderDetails";
import { useDispatch, useSelector } from "react-redux";
import { usePricingFilterService } from '../utils/PricingFilter';
import { ServiceProviderDTO } from "../types/ProviderDetailsType";
import ProviderFilter, { FilterCriteria } from "./ProviderFilter";
import { useTheme } from '../Settings/ThemeContext';
import { SkeletonLoader } from '../common/SkeletonLoader';
import dayjs, { Dayjs } from 'dayjs';
import { useAppUser } from '../context/AppUserContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const isFetchingRef = useRef(false);
  const locationKeyRef = useRef<string>("");
  
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
        return { textSize: 13, headingSize: 17, smallText: 11, badgeText: 10 };
      case 'large':
        return { textSize: 17, headingSize: 23, smallText: 15, badgeText: 13 };
      default:
        return { textSize: 15, headingSize: 20, smallText: 13, badgeText: 11 };
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

  const filteredProviders = allProviders;

  useEffect(() => {
    if (selectedProviderType !== undefined && location && bookingType && initialLoadDone.current) {
      console.log("Filters changed, resetting and searching");
      resetAndSearch();
    }
  }, [activeFilters]);

  useEffect(() => {
    const currentLocationKey = getLocationKey();
    const locationValid = isValidLocation(location);
    
    setIsLocationValid(locationValid);
    
    const locationChanged = locationValid && currentLocationKey !== locationKeyRef.current;
    
    if (locationValid && bookingType && !initialLoadDone.current) {
      console.log("Initial load triggered");
      locationKeyRef.current = currentLocationKey;
      initialLoadDone.current = true;
      resetAndSearch();
    } else if (locationValid && locationChanged && initialLoadDone.current) {
      console.log("Location changed, resetting");
      locationKeyRef.current = currentLocationKey;
      resetAndSearch();
    }
  }, [location, bookingType]);

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

  const fetchProviders = async (page: number, reset: boolean = false) => {
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
        if (activeFilters.gender !== null && activeFilters.gender !== "") {
          payload.gender = activeFilters.gender;
        }
        if (activeFilters.diet !== null && activeFilters.diet !== "") {
          payload.diet = activeFilters.diet;
        }
        if (activeFilters.language && activeFilters.language.length > 0) {
          payload.languages = activeFilters.language;
        }
        if (activeFilters.availability && activeFilters.availability.length > 0) {
          payload.availabilityStatuses = activeFilters.availability;
        }
      }

      if (appUser?.role === "CUSTOMER" && customerId && customerId !== 0 && customerId !== null && customerId !== undefined) {
        payload.customerID = Number(customerId);
      }
      
      console.log(`Fetching page ${page} with payload:`, payload);

      const response = await providerInstance.post(
        `/api/service-providers/nearby-monthly?page=${page}&limit=10`,
        payload
      );

      await new Promise(resolve => setTimeout(resolve, 300));

      console.log("API Response:", response.data);

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

  const fetchMoreData = useCallback(() => {
    if (isLoadingMore || !hasMore || loading || isFetchingRef.current) {
      return;
    }
    
    if (allProviders.length > 0 && hasMore) {
      fetchProviders(currentPage + 1, false);
    }
  }, [isLoadingMore, hasMore, loading, allProviders.length, currentPage]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    resetAndSearch();
  };

  const handleApplyFilters = (filters: FilterCriteria) => {
    setActiveFilters(filters);
    
    let count = 0;
    if (filters.experience[0] > 0 || filters.experience[1] < 30) count++;
    if (filters.rating) count++;
    if (filters.distance[0] > 0 || filters.distance[1] < 50) count++;
    if (filters.gender !== null && filters.gender !== "") count++;
    if (filters.diet !== null && filters.diet !== "") count++;
    if (filters.language && filters.language.length > 0) count++;
    if (filters.availability && filters.availability.length > 0) count++;
    
    setActiveFilterCount(count);
    setFilterOpen(false);
  };

  const handleClearFilters = () => {
    setActiveFilters(null);
    setActiveFilterCount(0);
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={[styles.footerLoader, { paddingVertical: 20 }]}>
        <ActivityIndicator size="large" color="#0a2a66ff" />
        <Text style={[styles.loadingMoreText, { color: '#64748B', fontSize: fontStyles.smallText }]}>
          Loading more providers...
        </Text>
      </View>
    );
  };

  const renderHeader = () => {
    if (filteredProviders.length === 0 && !loading && !hasFetchedOnce) return null;
    
    const resultsLabel = totalCount === 1 ? "1 service provider found" : `${totalCount} service providers found`;
    
    return (
      <>
        <View style={[styles.headerShell, { borderColor: colors.border, backgroundColor: isDarkMode ? colors.surface : "#ffffff" }]}>
          <View style={styles.headerTopRow}>
            <TouchableOpacity
              onPress={handleBackClick}
              style={[styles.backButton, { borderColor: colors.border, backgroundColor: isDarkMode ? colors.card : "#F8FAFC" }]}
            >
              <Icon name="arrow-back" size={20} color={colors.text} />
              <Text style={[styles.backText, { color: colors.text, fontSize: fontStyles.smallText }]}>Back</Text>
            </TouchableOpacity>
            <View style={[styles.resultsPill, { borderColor: colors.border, backgroundColor: isDarkMode ? colors.card : "#F8FAFC" }]}>
              <Text style={[styles.resultsCountText, { fontSize: fontStyles.smallText, color: colors.textSecondary }]}>
                {resultsLabel}
              </Text>
            </View>
          </View>

          <View style={styles.headerBottomRow}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontSize: fontStyles.headingSize }]}>
              Available Providers
            </Text>
            <View style={[styles.filterContainer, { gap: 8 * spacingMultiplier }]}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  {
                    backgroundColor: isDarkMode ? colors.card : '#FFFFFF',
                    borderColor: colors.border,
                    paddingHorizontal: 12 * spacingMultiplier,
                    paddingVertical: 8 * spacingMultiplier,
                  },
                ]}
                onPress={() => setFilterOpen(true)}
                activeOpacity={0.8}
              >
                <Icon name="tune" size={18} color={colors.text} />
                <Text style={[styles.filterButtonText, { color: colors.text, fontSize: fontStyles.smallText }]}>
                  Filter
                </Text>
                {activeFilterCount > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.badgeText, { fontSize: fontStyles.badgeText, color: '#FFFFFF' }]}>{activeFilterCount}</Text>
                  </View>
                )}
              </TouchableOpacity>

              {activeFilterCount > 0 && (
                <TouchableOpacity
                  style={[styles.clearButton, { padding: 8 * spacingMultiplier }]}
                  onPress={handleClearFilters}
                >
                  <Text style={[styles.clearButtonText, { color: colors.primary, fontSize: fontStyles.smallText }]}>
                    Clear
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border, marginBottom: 16 }]} />
      </>
    );
  };

  const renderEmptyComponent = () => {
    if (loading && !hasFetchedOnce) {
      return renderSkeletonLoader();
    } else if (hasFetchedOnce && filteredProviders.length === 0 && !loading) {
      return (
        <View style={[styles.centerContainer, { minHeight: 400, paddingHorizontal: 20 }]}>
          <LinearGradient
            colors={['#F8FAFC', '#FFFFFF']}
            style={styles.emptyGradientContainer}
          >
            <View style={styles.emptyIconContainer}>
              {activeFilters ? (
                <FontAwesome name="sliders" size={40} color="#0a2a66ff" />
              ) : (
                <Icon name="location-off" size={40} color="#0a2a66ff" />
              )}
            </View>
            <Text style={[styles.emptyTitle, { color: '#0F172A', fontSize: fontStyles.headingSize }]}>
              {activeFilters ? 'No Providers Match Your Filters' : 'Service Not Available in Your Area'}
            </Text>
            <Text style={[styles.emptyMessage, { color: '#64748B', fontSize: fontStyles.textSize }]}>
              {activeFilters 
                ? 'Try adjusting your filters to see more providers.'
                : 'Currently, we are unable to provide services in your location. We hope to be available in your area soon.'}
            </Text>
            
            <View style={{ gap: 12 * spacingMultiplier, marginTop: 24 }}>
              {activeFilters && (
                <TouchableOpacity
                  style={[styles.emptyButton, { backgroundColor: '#0a2a66ff' }]}
                  onPress={handleClearFilters}
                >
                  <Text style={[styles.emptyButtonText, { fontSize: fontStyles.textSize, color: '#FFFFFF' }]}>Clear Filters</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={[styles.emptyButtonOutline, { borderColor: '#0a2a66ff' }]}
                onPress={() => sendDataToParent("")}
              >
                <Text style={[styles.emptyButtonOutlineText, { fontSize: fontStyles.textSize, color: '#0a2a66ff' }]}>Go Back</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
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

  const renderProviderItem = ({ item, index }: { item: ServiceProviderDTO; index: number }) => {
    return (
      <View key={index} style={[styles.providerContainer, { marginBottom: 14 * spacingMultiplier }]}>
        <ProviderDetailsComponent
          {...item}
          selectedProvider={handleSelectedProvider}
          sendDataToParent={sendDataToParent}
        />
      </View>
    );
  };

  return (
    <LinearGradient
      colors={isDarkMode ? ['#0F172A', '#1E293B', '#0F172A'] : ['#F8FAFC', '#FFFFFF', '#F1F5F9']}
      style={{ flex: 1 }}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        {loading && !hasFetchedOnce ? (
          <View style={[styles.container]}>
            {renderSkeletonLoader()}
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={filteredProviders}
            renderItem={renderProviderItem}
            keyExtractor={(item, index) => `provider-${item.serviceproviderid || index}`}
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
                colors={['#0a2a66ff']}
                tintColor="#0a2a66ff"
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
    </LinearGradient>
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
    paddingHorizontal: 6,
    paddingBottom: 130,
  },
  headerShell: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 14,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  headerBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  backText: {
    marginLeft: 6,
    fontWeight: '600',
  },
  resultsPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  resultsCountText: {
    fontWeight: '600',
  },
  sectionTitle: {
    fontWeight: "700",
    flex: 1,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    position: 'relative',
  },
  filterButtonText: {
    marginLeft: 6,
    fontWeight: '500',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontWeight: 'bold',
  },
  clearButton: {},
  clearButtonText: {
    fontWeight: '500',
  },
  divider: {
    height: 1,
    width: '100%',
  },
  providerContainer: {
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyGradientContainer: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptyMessage: {
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 180,
    alignItems: 'center',
  },
  emptyButtonOutline: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 2,
    minWidth: 180,
    alignItems: 'center',
  },
  emptyButtonText: {
    fontWeight: '600',
  },
  emptyButtonOutlineText: {
    fontWeight: '600',
  },
  skeletonContainer: {
    flex: 1,
    padding: 16,
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
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