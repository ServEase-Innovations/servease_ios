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
import { CONFIRMATION, BOOKINGS } from "../Constants/pagesConstants";
import ProviderDetails from "../DetailsView/ProviderDetails";
import { useDispatch, useSelector } from "react-redux";
import { usePricingFilterService } from '../utils/PricingFilter';
import { ServiceProviderDTO } from "../types/ProviderDetailsType";
import ProviderFilter, { FilterCriteria } from "./ProviderFilter";
import { useTheme } from '../Settings/ThemeContext';
import { SkeletonLoader } from '../common/SkeletonLoader';
import dayjs, { Dayjs } from 'dayjs';
import { useAppUser } from '../context/AppUserContext';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const { colors, isDarkMode, fontSize, compactMode } = useTheme();
  const { appUser } = useAppUser();
  
  const customerId = appUser?.role === "CUSTOMER" ? appUser?.customerid : null;
  
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
  const [totalCount, setTotalCount] = useState(0);
  const [previousLocationKey, setPreviousLocationKey] = useState<string>("");
  
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

  const handleCheckoutData = (data: any) => {
    if (checkoutItem) {
      checkoutItem(data);
    }
  };

  const getLocationKey = useCallback(() => {
    if (!location) return "";
    const lat = location?.geometry?.location?.lat || location?.lat;
    const lng = location?.geometry?.location?.lng || location?.lng;
    return `${lat}-${lng}`;
  }, [location]);

  useEffect(() => {
    const currentLocationKey = getLocationKey();
    
    if (location && currentLocationKey !== previousLocationKey) {
      setPreviousLocationKey(currentLocationKey);
      setHasPerformedSearch(false);
      setIsInitialLoad(true);
    }
    
    if (bookingType && location && !hasPerformedSearch) {
      performSearch();
    }
  }, [selectedProviderType, location, bookingType, hasPerformedSearch, getLocationKey]);

  useEffect(() => {
    setSelectedProviderType(selected || '');
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

  // FIXED: Handle selected provider - can navigate to CONFIRMATION or BOOKINGS
  const handleSelectedProvider = useCallback((provider: any) => {
    console.log("📱 Provider selected in DetailsView:", provider);
    if (selectedProvider) {
      selectedProvider(provider);
    }
    // Navigate to confirmation by default
    sendDataToParent(CONFIRMATION);
  }, [selectedProvider, sendDataToParent]);

  const handleSearch = (formData: { serviceType: string; startTime: string; endTime: string }) => {
    setSearchData(formData);
  };

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

  const logProviderDetails = (providers: any[], source: string) => {
    // Keep for debugging but can be removed in production
  };

  const performSearch = async () => {
    try {
      setLoading(true);
      setHasPerformedSearch(true);

      let latitude = 0;
      let longitude = 0;

      if (location?.geometry?.location) {
        latitude = location?.geometry?.location?.lat;
        longitude = location?.geometry?.location?.lng;
      } else if (location?.lat && location?.lng) {
        latitude = location?.lat;
        longitude = location?.lng;
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
      
      preferredStartTime = preferredStartTime.trim();
      const housekeepingRole = bookingType?.housekeepingRole || 'COOK';

      if (latitude === 0 && longitude === 0) {
        Alert.alert(
          t('common.locationRequired'),
          t('common.locationDenied'),
          [{ text: t('common.ok') }]
        );
        setServiceProviderData([]);
        setFilteredProviders([]);
        setLoading(false);
        return;
      }

      try {
        const payload: any = {
          lat: latitude.toString(),
          lng: longitude.toString(),
          radius: 10,
          startDate: startDate,
          endDate: endDate,
          preferredStartTime: preferredStartTime,
          role: housekeepingRole,
          serviceDurationMinutes: 60
        };

        if (appUser?.role === "CUSTOMER" && customerId && customerId !== 0 && customerId !== null && customerId !== undefined) {
          payload.customerID = Number(customerId);
        }
        
        const response = await providerInstance.post('/api/service-providers/nearby-monthly', payload);

        setTotalCount(response.data.count || 0);

        if (response.data && response.data.providers) {
          const providers = response.data.providers;
          if (Array.isArray(providers) && providers.length > 0) {
            setServiceProviderData(providers);
            setFilteredProviders(providers);
          } else {
            setServiceProviderData([]);
            setFilteredProviders([]);
          }
        } else if (response.data && Array.isArray(response.data)) {
          setServiceProviderData(response.data);
          setFilteredProviders(response.data);
        } else {
          setServiceProviderData([]);
          setFilteredProviders([]);
        }
      } catch (apiError: any) {
        const errorMessage = apiError.response?.data?.message || t('errors.generic');
        Alert.alert(t('common.error'), errorMessage);
        setServiceProviderData([]);
        setFilteredProviders([]);
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), t('errors.generic'));
      setServiceProviderData([]);
      setFilteredProviders([]);
    } finally {
      setLoading(false);
      setIsInitialLoad(false);
    }
  };

  const normalizeLanguages = (languages: string | string[] | null | undefined): string[] => {
    if (!languages) return [];
    if (Array.isArray(languages)) return languages;
    if (typeof languages === 'string') {
      return languages.split(',').map(lang => lang.trim());
    }
    return [];
  };

  const applyFilters = (providers: ServiceProviderDTO[], filters: FilterCriteria): ServiceProviderDTO[] => {
    return providers.filter(provider => {
      if (filters.experience && (provider.experience < filters.experience[0] || provider.experience > filters.experience[1])) {
        return false;
      }

      if (filters.rating && (provider.rating || 0) < filters.rating) {
        return false;
      }

      if (filters.distance && (provider.distance_km || 0) > filters.distance[1]) {
        return false;
      }

      if (filters.gender.length > 0 && !filters.gender.includes(provider.gender || '')) {
        return false;
      }

      if (filters.diet.length > 0 && !filters.diet.includes(provider.diet || '')) {
        return false;
      }

      if (filters.language.length > 0) {
        const providerLanguages = normalizeLanguages(provider.languageknown);
        const hasMatchingLanguage = providerLanguages.some(lang => 
          filters.language.includes(lang)
        );
        if (!hasMatchingLanguage) return false;
      }

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

  const handleApplyFilters = (filters: FilterCriteria) => {
    setActiveFilters(filters);
    
    let count = 0;
    if (filters.experience[0] > 0 || filters.experience[1] < 30) count++;
    if (filters.rating) count++;
    if (filters.distance[0] > 0 || filters.distance[1] < 50) count++;
    if (filters.gender.length > 0) count++;
    if (filters.diet.length > 0) count++;
    if (filters.language.length > 0) count++;
    if (filters.availability.length > 0) count++;
    
    setActiveFilterCount(count);
    
    const filtered = applyFilters(serviceProviderData, filters);
    setFilteredProviders(filtered);
    setFilterOpen(false);
  };

  useEffect(() => {
    if (activeFilters) {
      const filtered = applyFilters(serviceProviderData, activeFilters);
      setFilteredProviders(filtered);
    } else {
      setFilteredProviders(serviceProviderData);
    }
  }, [serviceProviderData, activeFilters]);

  const handleClearFilters = () => {
    setActiveFilters(null);
    setFilteredProviders(serviceProviderData);
    setActiveFilterCount(0);
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
                {t('common.back')}
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
                  {t('details.filter.title')}
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
                    {t('details.filter.clearAll')}
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
            {activeFilters 
              ? t('details.filter.foundWithFilters', { count: filteredProviders.length }) + (filteredProviders.length !== 1 ? 's' : '')
              : t('details.found', { count: totalCount }) + (totalCount !== 1 ? 's' : '')
            }
          </Text>
          
          {filteredProviders.map((provider, index) => (
            <View key={index} style={[styles.providerContainer, { marginBottom: 16 * spacingMultiplier, paddingTop: 4 * spacingMultiplier }]}>
              <ProviderDetails 
                {...provider} 
                selectedProvider={handleSelectedProvider}
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
            {activeFilters ? t('details.noFilters') : t('details.noProviders')}
          </Text>
          <Text style={[styles.message, { color: colors.textSecondary, fontSize: fontStyles.textSize }]}>
            {activeFilters ? t('details.noFiltersMsg') : t('details.noProvidersMsg')}
          </Text>
          
          {activeFilters && (
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.primary, marginBottom: 12 * spacingMultiplier }]}
              onPress={handleClearFilters}
            >
              <Text style={[styles.buttonText, { fontSize: fontStyles.textSize }]}>{t('details.clearFilters')}</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: activeFilters ? colors.disabled : colors.primary }]}
            onPress={() => sendDataToParent("")}
          >
            <Text style={[styles.buttonText, { fontSize: fontStyles.textSize }]}>{t('details.goBack')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.secondary, marginTop: 12 * spacingMultiplier }]}
            onPress={performSearch}
          >
            <Text style={[styles.buttonText, { fontSize: fontStyles.textSize }]}>{t('details.tryAgain')}</Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      return (
        <View style={[styles.centerContainer, { minHeight: 400 }]}>
          <Text style={[styles.initialStateText, { color: colors.textSecondary, fontSize: fontStyles.textSize }]}>
            {t('details.initialState')}
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